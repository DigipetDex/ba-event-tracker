"""
Global(한국 서버 포함) 이벤트 데이터 빌드 스크립트.

baql GraphQL API에서 gl 지역 일정이 있는 이벤트만 골라
public/events/{uid}.json (이벤트 상세)을 만들고 src/data/allEventsMap.json 에 병합한 뒤,
복각 데이터 / 이벤트 목록(eventIndex.ts) / 기능 태그 스크립트를 순서대로 실행한다.

실행: python scripts/build_events.py
"""
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

sys.stdout.reconfigure(encoding='utf-8')

API = 'https://api.baql.net/graphql'
ASSET = 'https://assets.baql.net/images'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'public', 'events')
MAP_JSON = os.path.join(ROOT, 'src', 'data', 'allEventsMap.json')
POST_STEPS = [
    'scripts/build_reruns.py',
    'src/data/update_event_index_periods.py',
    'src/data/embed_tags_to_index.py',
]

# 반복 소탕 시 얻는 보상 태그 (FirstClear / ThreeStar 는 1회성이므로 제외)
REPEAT_TAGS = {'Event', 'Default', 'Rare'}

TYPE_DIR = {
    'Item': 'resources/items',
    'Equipment': 'resources/equipments',
    'Furniture': 'resources/furnitures',
    'Currency': 'resources/currencies',
    'Emblem': 'resources/emblems',
}


def gql(query, retries=3):
    body = json.dumps({'query': query}).encode('utf-8')
    for attempt in range(retries):
        try:
            req = urllib.request.Request(API, data=body, headers={
                'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'})
            res = json.loads(urllib.request.urlopen(req, timeout=30).read().decode('utf-8'))
            if 'errors' in res:
                raise RuntimeError(res['errors'])
            return res['data']
        except (urllib.error.URLError, TimeoutError) as e:
            if attempt == retries - 1:
                raise
            time.sleep(1.5 * (attempt + 1))


def image_url(res):
    folder = TYPE_DIR.get(res.get('__typename'), 'resources/items')
    return f"{ASSET}/{folder}/{res['uid']}.webp"


RES_FIELDS = '__typename uid name description rarity'

EVENT_QUERY = '''{
  eventContent(uid: "%s") {
    uid name
    stages(runType: RUNTYPE) {
      uid stageNumber stageType enterCostAmount
      rewards { amount probability tag resource { %s } }
    }
    shopResources(runType: RUNTYPE) {
      uid shopAmount
      resource { %s }
      paymentResource { %s }
      purchaseTiers { unitPrice quantity }
    }
    bonuses(runType: RUNTYPE) {
      percentage
      resource { uid }
      student { uid name role }
    }
  }
}''' % ('%s', RES_FIELDS, RES_FIELDS, RES_FIELDS)


def build_event(uid, name, period, start_at, end_at, run_type='first', out_id=None):
    data = gql((EVENT_QUERY % uid).replace('RUNTYPE', run_type))['eventContent']
    if not data:
        return None

    currencies = {}  # uid -> Currency

    def add_currency(res):
        if res['uid'] not in currencies:
            currencies[res['uid']] = {
                'id': res['uid'],
                'name': res['name'],
                'color': 'zinc',
                'imageUrl': image_url(res),
            }

    # --- 스테이지 (일반 스테이지만) ---
    stages = []
    for st in data['stages'] or []:
        if st['stageType'] != 'stage':
            continue
        try:
            number = int(st['stageNumber'])
        except ValueError:
            continue

        drops = []
        event_currency_ids = []
        for rw in st['rewards']:
            if rw['tag'] not in REPEAT_TAGS:
                continue
            res = rw['resource']
            is_event = rw['tag'] == 'Event'
            if is_event:
                add_currency(res)
                event_currency_ids.append(res['uid'])
            drops.append({
                'resourceUid': res['uid'],
                'name': res['name'],
                'amount': rw['amount'],
                'probability': rw['probability'],
                'imageUrl': image_url(res),
                'isEventCurrency': is_event,
                'description': res.get('description') or '',
            })

        unique_event = sorted(set(event_currency_ids))
        stages.append({
            'id': st['uid'],
            'number': number,
            'name': f'{number} 스테이지',
            'apCost': st['enterCostAmount'],
            'primaryCurrencyId': unique_event[0] if len(unique_event) == 1 else None,
            'drops': drops,
        })
    stages.sort(key=lambda s: s['number'])

    # --- 상점 ---
    shop_items = []
    for sr in data['shopResources'] or []:
        res = sr['resource']
        pay = sr['paymentResource']
        if not res or not pay:
            continue
        add_currency(pay)
        tiers = sr['purchaseTiers'] or [{'unitPrice': 0, 'quantity': None}]
        for i, tier in enumerate(tiers):
            shop_items.append({
                'id': sr['uid'] if len(tiers) == 1 else f"{sr['uid']}_{i}",
                'name': res['name'],
                'description': res.get('description') or '',
                'imageUrl': image_url(res),
                'currencyId': pay['uid'],
                'maxQuantity': tier['quantity'],
                'unitPrice': tier['unitPrice'],
                'shopAmount': sr.get('shopAmount') or 1,
                'rarity': res.get('rarity'),
            })

    # --- 보너스 학생 ---
    students = {}
    for b in data['bonuses'] or []:
        s = b['student']
        if not s:
            continue
        entry = students.setdefault(s['uid'], {
            'studentUid': s['uid'],
            'name': s['name'],
            'role': (s.get('role') or 'striker').lower(),
            'imageUrl': f"{ASSET}/students/collection/{s['uid']}.webp",
            'bonuses': [],
        })
        entry['bonuses'].append({
            'currencyId': b['resource']['uid'],
            'percentage': float(b['percentage']),
        })

    if not stages or not shop_items:
        return None

    return {
        'id': out_id or uid,
        'name': name,
        'period': period,
        'startAt': start_at,
        'endAt': end_at,
        'currencies': sorted(currencies.values(), key=lambda c: c['id']),
        'stages': stages,
        'shopItems': shop_items,
        'bonusStudents': list(students.values()),
    }


def fmt_date(iso):
    if not iso:
        return ''
    # UTC -> KST(+9) 날짜
    from datetime import datetime, timedelta
    dt = datetime.fromisoformat(iso.replace('Z', '+00:00')) + timedelta(hours=9)
    return dt.strftime('%Y.%m.%d')


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    events = gql('{ eventContents { uid name schedules { region runType startAt endAt } } }')['eventContents']

    index = []
    for ev in events:
        gl = [s for s in (ev['schedules'] or []) if s['region'] == 'gl']
        if not gl:
            continue  # 한국(글로벌) 서버 미출시 이벤트 제외
        first = next((s for s in gl if s['runType'] == 'first'), gl[0])
        start_at, end_at = first['startAt'], first['endAt']
        period = f"{fmt_date(start_at)} ~ {fmt_date(end_at)}" if end_at else f"{fmt_date(start_at)} ~"

        try:
            detail = build_event(ev['uid'], ev['name'], period, start_at, end_at)
        except Exception as e:
            print(f"  [skip] {ev['uid']} {ev['name']}: {e}")
            continue
        if not detail:
            print(f"  [skip] {ev['uid']} {ev['name']}: 스테이지/상점 데이터 없음")
            continue

        with open(os.path.join(OUT_DIR, f"{ev['uid']}.json"), 'w', encoding='utf-8') as f:
            json.dump(detail, f, ensure_ascii=False)

        index.append({
            'uid': ev['uid'],
            'name': ev['name'],
            'period': period,
            'startAt': start_at,
            'endAt': end_at,
        })
        print(f"  [ok] {ev['uid']} {ev['name']} ({period}) "
              f"stages={len(detail['stages'])} shop={len(detail['shopItems'])} students={len(detail['bonusStudents'])}")

    # 앱 내장용 맵(src/data/allEventsMap.json)에 병합 (복각 항목 등 기존 키 유지)
    with open(MAP_JSON, 'r', encoding='utf-8') as f:
        events_map = json.load(f)
    for e in index:
        with open(os.path.join(OUT_DIR, f"{e['uid']}.json"), 'r', encoding='utf-8') as f:
            events_map[e['uid']] = json.load(f)
    with open(MAP_JSON, 'w', encoding='utf-8') as f:
        json.dump(events_map, f, ensure_ascii=False)

    print(f"\n총 {len(index)}개 이벤트 생성 완료 -> {OUT_DIR}")

    # 후속 단계: 복각 데이터 -> 목록(eventIndex.ts, runs/복각 항목) -> 기능 태그
    # eventIndex.ts 는 이 스크립트가 직접 쓰지 않는다 (runs/tags/_rerun 항목 보존)
    for step in POST_STEPS:
        print(f"\n>> python {step}")
        subprocess.run([sys.executable, step], cwd=ROOT, check=True)


if __name__ == '__main__':
    main()
