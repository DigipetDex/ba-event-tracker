import json

with open('src/data/allStudents.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for s in data:
    if s.get('armorType') == 'CompositeArmor':
        s['armorType'] = '복합'
    if s.get('bulletType') == 'Composite':
        s['bulletType'] = '복합'

with open('src/data/allStudents.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated CompositeArmor to 복합 in allStudents.json")
