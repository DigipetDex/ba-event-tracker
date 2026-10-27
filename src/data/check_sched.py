import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

q_type = {
    'query': '''
    query {
      __type(name: "EventContentSchedule") {
        fields {
          name
        }
      }
    }
    '''
}
req = urllib.request.Request(
    'https://api.baql.net/graphql',
    data=json.dumps(q_type).encode('utf-8'),
    headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'}
)
res = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
print(res)
