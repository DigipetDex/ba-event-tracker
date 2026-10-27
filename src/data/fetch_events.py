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
      }
    }
    '''
}

req = urllib.request.Request(
    'https://api.baql.net/graphql',
    data=json.dumps(q).encode('utf-8'),
    headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'}
)

try:
    res = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    events = res['data']['eventContents']
    print(f"Total events: {len(events)}")
    for e in events:
        print(f"{e['uid']}: {e['name']}")
    with open('src/data/all_events_summary.json', 'w', encoding='utf-8') as f:
        json.dump(events, f, ensure_ascii=False, indent=2)
except Exception as e:
    print("Error:", e)
