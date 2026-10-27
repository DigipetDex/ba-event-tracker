import urllib.request
import json
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

q = {
    'query': '''
    query {
      eventContents {
        uid
        name
        schedules {
          region
          runType
          startAt
          endAt
        }
      }
    }
    '''
}
req = urllib.request.Request(
    'https://api.baql.net/graphql',
    data=json.dumps(q).encode('utf-8'),
    headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'}
)
res = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
events = res['data']['eventContents']

def format_date_str(iso_str):
    if not iso_str:
        return ''
    try:
        from datetime import datetime, timezone, timedelta
        dt = datetime.fromisoformat(iso_str.replace('Z', '+00:00'))
        kst = dt.astimezone(timezone(timedelta(hours=9)))
        ampm = '오전' if kst.hour < 12 else '오후'
        hour12 = kst.hour if kst.hour <= 12 else kst.hour - 12
        if hour12 == 0:
            hour12 = 12
        return f"{kst.year}. {kst.month}. {kst.day}. {ampm} {hour12}:{kst.minute:02d}:{kst.second:02d}"
    except Exception as e:
        return str(iso_str)[:10]

parsed = []
for ev in events:
    uid = str(ev['uid'])
    name = ev['name']
    schedules = ev.get('schedules') or []
    
    gl_sched = next((s for s in schedules if s.get('region') == 'gl'), None)
    jp_sched = next((s for s in schedules if s.get('region') == 'jp'), None)
    
    gl_period = ''
    if gl_sched and gl_sched.get('startAt') and gl_sched.get('endAt'):
        gl_period = f"{format_date_str(gl_sched.get('startAt'))} ~ {format_date_str(gl_sched.get('endAt'))}"
        
    jp_period = ''
    if jp_sched and jp_sched.get('startAt') and jp_sched.get('endAt'):
        jp_period = f"{format_date_str(jp_sched.get('startAt'))} ~ {format_date_str(jp_sched.get('endAt'))}"
    
    # Simple period for dropdown
    simple_period = ''
    if gl_sched and gl_sched.get('startAt') and gl_sched.get('endAt'):
        s_date = str(gl_sched.get('startAt'))[:10].replace('-', '.')
        e_date = str(gl_sched.get('endAt'))[:10].replace('-', '.')
        simple_period = f"{s_date} ~ {e_date}"
    elif jp_sched and jp_sched.get('startAt') and jp_sched.get('endAt'):
        s_date = str(jp_sched.get('startAt'))[:10].replace('-', '.')
        e_date = str(jp_sched.get('endAt'))[:10].replace('-', '.')
        simple_period = f"{s_date} ~ {e_date}"
        
    parsed.append({
        'uid': uid,
        'name': name,
        'period': simple_period,
        'glPeriod': gl_period,
        'jpPeriod': jp_period,
        'startAt': (gl_sched or jp_sched or {}).get('startAt'),
        'endAt': (gl_sched or jp_sched or {}).get('endAt'),
        'runs': [
            {'type': r['runType'], 'startAt': r['startAt'], 'endAt': r['endAt']}
            for r in schedules
            if r.get('region') == 'gl' and r.get('runType') == 'first'
            and r.get('startAt') and r.get('endAt')
        ]
    })

# filter numeric uids and sort descending
parsed = [p for p in parsed if p['uid'].isdigit()]

# 복각(rerun)은 보상/상점이 다를 수 있어 별도 항목(uid_rerun)으로 추가 (데이터: scripts/build_reruns.py)
rerun_files = set(os.listdir('public/events'))
for ev in events:
    rerun = next((s for s in (ev.get('schedules') or [])
                  if s.get('region') == 'gl' and s.get('runType') == 'rerun'
                  and s.get('startAt') and s.get('endAt')), None)
    rid = f"{ev['uid']}_rerun"
    if not rerun or f'{rid}.json' not in rerun_files:
        continue
    jp_rerun = next((s for s in (ev.get('schedules') or [])
                     if s.get('region') == 'jp' and s.get('runType') == 'rerun'
                     and s.get('startAt') and s.get('endAt')), None)
    parsed.append({
        'uid': rid,
        'name': f"{ev['name']} (복각)",
        'period': f"{rerun['startAt'][:10].replace('-', '.')} ~ {rerun['endAt'][:10].replace('-', '.')}",
        'glPeriod': f"{format_date_str(rerun['startAt'])} ~ {format_date_str(rerun['endAt'])}",
        'jpPeriod': f"{format_date_str(jp_rerun['startAt'])} ~ {format_date_str(jp_rerun['endAt'])}" if jp_rerun else '',
        'startAt': rerun['startAt'],
        'endAt': rerun['endAt'],
        'runs': [{'type': 'rerun', 'startAt': rerun['startAt'], 'endAt': rerun['endAt']}],
    })

parsed.sort(key=lambda x: x['startAt'] or '', reverse=True)

ts_content = '''// 자동 생성 파일: python scripts/build_events.py
export interface EventSummary {
  uid: string;
  name: string;
  period: string;
  glPeriod?: string;
  jpPeriod?: string;
  startAt: string | null;
  endAt: string | null;
  runs?: { type: string; startAt: string; endAt: string }[];
}

export const EVENT_INDEX: EventSummary[] = ''' + json.dumps(parsed, ensure_ascii=False, indent=2) + ';\n'

with open('src/data/eventIndex.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f"Updated src/data/eventIndex.ts with {len(parsed)} events.")
for p in parsed[:3]:
    print(p['uid'], p['name'], "GL:", p['glPeriod'], "JP:", p['jpPeriod'])
