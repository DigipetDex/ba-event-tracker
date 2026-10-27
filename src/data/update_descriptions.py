import json

with open('src/data/item_descriptions.json', 'r', encoding='utf-8') as f:
    desc_map = json.load(f)

# Read eventData.ts and inject description into each drop and shopItem if matching resourceUid / id
with open('src/data/eventData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Add descriptions map directly or modify eventData.ts
# Let's inspect how drops are structured
print("Item description keys count:", len(desc_map))
