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
        minigameConfigs(runType: first) {
          minigameType
        }
        shopResources(runType: first) {
          uid
        }
        stages(runType: first) {
          stageType
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
res = json.loads(urllib.request.urlopen(req, timeout=10).read().decode('utf-8'))
if 'errors' in res:
    print("GraphQL errors:", res['errors'])
else:
    print("Success with shopResources(runType: first), count:", len(res['data']['eventContents']))
