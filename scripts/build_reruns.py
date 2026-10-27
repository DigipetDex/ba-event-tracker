"""
복각(rerun) 이벤트 상세 데이터 빌드 스크립트.

gl 지역에 rerun 일정이 있는 이벤트마다 runType: rerun 기준의 스테이지 보상/상점/보너스를 받아
public/events/{uid}_rerun.json 을 만들고 src/data/allEventsMap.json 에도 병합한다.
목록(eventIndex.ts)은 src/data/update_event_index_periods.py 가 {uid}_rerun 항목을 생성한다.

실행: python scripts/build_reruns.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_events as be

sys.stdout.reconfigure(encoding='utf-8')

MAP_JSON = os.path.join(be.ROOT, 'src', 'data', 'allEventsMap.json')


def main():
    os.makedirs(be.OUT_DIR, exist_ok=True)
    with open(MAP_JSON, 'r', encoding='utf-8') as f:
        events_map = json.load(f)

    events = be.gql('{ eventContents { uid name schedules { region runType startAt endAt } } }')['eventContents']
    for ev in events:
        rerun = next((s for s in (ev['schedules'] or [])
                      if s['region'] == 'gl' and s['runType'] == 'rerun'), None)
        if not rerun or not str(ev['uid']).isdigit():
            continue
        out_id = f"{ev['uid']}_rerun"
        period = f"{be.fmt_date(rerun['startAt'])} ~ {be.fmt_date(rerun['endAt'])}"
        try:
            detail = be.build_event(ev['uid'], f"{ev['name']} (복각)", period,
                                    rerun['startAt'], rerun['endAt'], 'rerun', out_id)
        except Exception as e:
            print(f"  [skip] {out_id}: {e}")
            continue
        if not detail:
            print(f"  [skip] {out_id}: 스테이지/상점 데이터 없음")
            continue
        with open(os.path.join(be.OUT_DIR, f'{out_id}.json'), 'w', encoding='utf-8') as f:
            json.dump(detail, f, ensure_ascii=False)
        events_map[out_id] = detail
        print(f"  [ok] {out_id} ({period}) stages={len(detail['stages'])} shop={len(detail['shopItems'])}")

    with open(MAP_JSON, 'w', encoding='utf-8') as f:
        json.dump(events_map, f, ensure_ascii=False)


if __name__ == '__main__':
    main()
