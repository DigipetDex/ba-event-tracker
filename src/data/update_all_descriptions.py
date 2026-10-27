import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

# 1. Collect all unique item and currency uids from event_859_full.json
with open('src/data/event_859_full.json', 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

uids = set()
names_by_uid = {}

for st in data.get('stages', []):
    for rew in st.get('rewards', []):
        res = rew.get('resource', {})
        if res.get('uid'):
            uid = str(res['uid'])
            uids.add(uid)
            names_by_uid[uid] = res.get('name', '')

for sr in data.get('shopResources', []):
    res = sr.get('resource', {})
    if res.get('uid'):
        uid = str(res['uid'])
        uids.add(uid)
        names_by_uid[uid] = res.get('name', '')

print(f"Total unique item/currency UIDs: {len(uids)}")

# Query baql for these items
q = {
    'query': f'''
    query {{
      items(uids: {json.dumps(list(uids))}) {{
        uid
        name
        description
      }}
      furnitures(uids: {json.dumps(list(uids))}) {{
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
    items = res.get('data', {}).get('items', []) or []
    furnitures = res.get('data', {}).get('furnitures', []) or []
    
    desc_map = {}
    for it in items + furnitures:
        uid = str(it['uid'])
        desc_map[uid] = {
            'name': it['name'],
            'description': it.get('description') or ''
        }

    # Also load SchaleDB items.json to fill in any missing descriptions
    schale_items = json.loads(urllib.request.urlopen('https://raw.githubusercontent.com/SchaleDB/SchaleDB/main/data/kr/items.json').read().decode('utf-8'))
    for s_it in schale_items:
        s_uid = str(s_it.get('Id'))
        if s_uid in uids and (s_uid not in desc_map or not desc_map[s_uid]['description']):
            desc_map[s_uid] = {
                'name': s_it.get('Name'),
                'description': s_it.get('Desc') or ''
            }
            
    # Also check SchaleDB furniture.json
    try:
        schale_furn = json.loads(urllib.request.urlopen('https://raw.githubusercontent.com/SchaleDB/SchaleDB/main/data/kr/furniture.json').read().decode('utf-8'))
        for s_f in schale_furn:
            s_uid = str(s_f.get('Id'))
            if s_uid in uids and (s_uid not in desc_map or not desc_map[s_uid]['description']):
                desc_map[s_uid] = {
                    'name': s_f.get('Name'),
                    'description': s_f.get('Desc') or ''
                }
    except Exception as e:
        print("Furniture fetch error:", e)

    # Fallback with known names
    for uid in uids:
        if uid not in desc_map:
            desc_map[uid] = {
                'name': names_by_uid.get(uid, ''),
                'description': ''
            }

    print(f"Total resolved descriptions: {len(desc_map)}")
    
    # Write ts file
    ts_code = f"// 아이템 설명 툴팁용 맵\nexport const ITEM_DESCRIPTIONS: Record<string, {{ name: string; description: string }}> = {json.dumps(desc_map, ensure_ascii=False, indent=2)};\n"
    with open('src/data/itemDescriptions.ts', 'w', encoding='utf-8') as out:
        out.write(ts_code)
    print("Updated src/data/itemDescriptions.ts")
except Exception as e:
    print("Error:", e)
