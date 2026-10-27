import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

# 1. Collect all unique item and currency uids from event_859_full.json and eventData.ts
with open('src/data/event_859_full.json', 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

uids = set()
for st in data.get('stages', []):
    for rew in st.get('rewards', []):
        res = rew.get('resource', {})
        if res.get('uid'):
            uids.add(str(res['uid']))

with open('src/data/event_859.json', 'r', encoding='utf-8-sig') as f:
    d2 = json.load(f)
    for sr in d2.get('shopResources', []):
        for it in sr.get('items', []):
            res = it.get('resource', {})
            if res.get('uid'):
                uids.add(str(res['uid']))

print(f"Total unique item/currency UIDs to lookup: {len(uids)}")

# Query baql for these items
q = {
    'query': f'''
    query {{
      items(uids: {json.dumps(list(uids))}) {{
        uid
        name
        description
      }}
    }}
    '''
}

req = urllib.request.Request(
    'https://api.baql.net/graphql',
    data=json.dumps(q).encode('utf-8'),
    headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'}
)

try:
    res = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    items = res.get('data', {}).get('items', [])
    desc_map = {}
    for it in items:
        desc_map[str(it['uid'])] = {
            'name': it['name'],
            'description': it.get('description') or ''
        }
    print(f"Retrieved {len(desc_map)} descriptions from baql")
    with open('src/data/item_descriptions.json', 'w', encoding='utf-8') as out:
        json.dump(desc_map, out, ensure_ascii=False, indent=2)
except Exception as e:
    print("Error:", e)
