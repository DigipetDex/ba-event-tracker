import json

with open('src/data/item_descriptions.json', 'r', encoding='utf-8') as f:
    desc_map = json.load(f)

ts_content = f"""// 아이템 설명 툴팁용 맵
export const ITEM_DESCRIPTIONS: Record<string, {{ name: string; description: string }}> = {json.dumps(desc_map, ensure_ascii=False, indent=2)};
"""

with open('src/data/itemDescriptions.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print("Generated src/data/itemDescriptions.ts successfully.")
