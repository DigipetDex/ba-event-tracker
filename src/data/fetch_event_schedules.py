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
          server
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

# Filter events with numbers (normal event contents)
parsed_events = []
for ev in events:
    uid = ev['uid']
    name = ev['name']
    schedules = ev.get('schedules') or []
    # find korean or global schedule or latest schedule
    kr_sched = next((s for s in schedules if s.get('server') == 'KR'), None)
    if not kr_sched and schedules:
        kr_sched = schedules[0]
    
    start_at = kr_sched.get('startAt') if kr_sched else ''
    end_at = kr_sched.get('endAt') if kr_sched else ''
    
    parsed_events.append({
        'uid': uid,
        'name': name,
        'startAt': start_at[:10] if start_at else '',
        'endAt': end_at[:10] if end_at else '',
    })

# sort by uid descending (newer events first)
parsed_events.sort(key=lambda x: int(x['uid']) if x['uid'].isdigit() else 0, reverse=True)

with open('src/data/all_events_list.json', 'w', encoding='utf-8') as f:
    json.dump(parsed_events, f, ensure_ascii=False, indent=2)

print(f"Saved {len(parsed_events)} events.")
for p in parsed_events[:10]:
    print(p)
