import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

q = {
    'query': '''
    query {
      eventContent(uid: "859") {
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
print(json.dumps(res, ensure_ascii=False, indent=2))
