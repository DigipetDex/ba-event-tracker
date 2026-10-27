import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

q = {
    'query': '''
    query {
      items(uids: ["80840", "80841", "80842", "80843", "110", "111", "210", "211", "90001"]) {
        uid
        name
        description
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
    print("Items found:", len(res.get('data', {}).get('items', [])))
    for it in res.get('data', {}).get('items', []):
        print(f"UID: {it['uid']} | {it['name']} -> {it.get('description')}")
except Exception as e:
    print("Error:", e)
