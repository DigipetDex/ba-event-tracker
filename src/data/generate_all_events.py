import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

q = {
    'query': '''
    query {
      eventContents {
        uid
        name
        schedules {
          startAt
          endAt
          region
          runType
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

parsed_events = []
for ev in events:
    uid = str(ev['uid'])
    name = ev['name']
    schedules = ev.get('schedules') or []
    
    # prefer KR or Global region schedule
    kr_sched = next((s for s in schedules if s.get('region') in ['KR', 'Global']), None)
    if not kr_sched and schedules:
        kr_sched = schedules[0]
    
    start_at = kr_sched.get('startAt', '') if kr_sched else ''
    end_at = kr_sched.get('endAt', '') if kr_sched else ''
    
    start_fmt = start_at[:10].replace('-', '.') if start_at else ''
    end_fmt = end_at[:10].replace('-', '.') if end_at else ''
    period = f"{start_fmt} ~ {end_fmt}" if start_fmt and end_fmt else "이벤트 일정 정보"
    
    parsed_events.append({
        'uid': uid,
        'name': name,
        'period': period,
        'runType': kr_sched.get('runType', '') if kr_sched else '',
    })

# sort by uid descending (newer events first, e.g. 863, 862, 859 ...)
parsed_events.sort(key=lambda x: int(x['uid']) if x['uid'].isdigit() else 0, reverse=True)

ts_content = f"""// 전체 이벤트 목록 및 일정 정보
export interface EventSummary {{
  uid: string;
  name: string;
  period: string;
  runType?: string;
}}

export const ALL_EVENTS: EventSummary[] = {json.dumps(parsed_events, ensure_ascii=False, indent=2)};
"""

with open('src/data/allEvents.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f"Generated src/data/allEvents.ts with {len(parsed_events)} events.")
for p in parsed_events[:10]:
    print(p)
