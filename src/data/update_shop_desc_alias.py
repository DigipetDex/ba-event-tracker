import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('src/data/event_859_full.json', 'r', encoding='utf-8-sig') as f:
    full = json.load(f)

# 1. Existing desc_map
with open('src/data/itemDescriptions.ts', 'r', encoding='utf-8') as f:
    # load by stripping prefix and suffix
    raw = f.read()
    json_str = raw.split(' = ', 1)[1].rstrip(';\n ')
    desc_map = json.loads(json_str)

# 2. For each shop item, copy the description to shopItem.id as well
for sr in full.get('shopResources', []):
    s_uid = str(sr.get('uid'))
    res = sr.get('resource', {})
    if res.get('uid'):
        r_uid = str(res['uid'])
        if r_uid in desc_map:
            desc_map[s_uid] = desc_map[r_uid]

print(f"Total entries in desc_map after shop alias: {len(desc_map)}")

ts_code = f"// 아이템 설명 툴팁용 맵\nexport const ITEM_DESCRIPTIONS: Record<string, {{ name: string; description: string }}> = {json.dumps(desc_map, ensure_ascii=False, indent=2)};\n"
with open('src/data/itemDescriptions.ts', 'w', encoding='utf-8') as out:
    out.write(ts_code)
print("Updated src/data/itemDescriptions.ts with shop item mappings.")
