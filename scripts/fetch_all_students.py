import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

url = 'https://schaledb.com/data/kr/students.json'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        raw_text = resp.read().decode('utf-8')
        data = json.loads(raw_text)
except Exception as e:
    print("Error fetching:", e)
    sys.exit(1)

# Check if data is dict or list
if isinstance(data, dict):
    student_list = list(data.values())
else:
    student_list = data

print(f"Total students parsed: {len(student_list)}")

bullet_map = {
    'Explosion': '폭발',
    'Pierce': '관통',
    'Mystic': '신비',
    'Sonic': '진동'
}

armor_map = {
    'LightArmor': '경장',
    'HeavyArmor': '중장',
    'Unarmed': '특수',
    'ElasticArmor': '탄력'
}

role_map = {
    'DamageDealer': '딜러',
    'Tanker': '탱커',
    'Supporter': '서포터',
    'Healer': '힐러',
    'Vehicle': 'T.S.'
}

processed = []
for s in student_list:
    if not isinstance(s, dict):
        continue
    
    sid = s.get('Id')
    name = s.get('Name', '')
    star = s.get('StarGrade', 3)
    squad_type = '스트라이커' if s.get('SquadType') == 'Main' else '스페셜'
    bullet_type = bullet_map.get(s.get('BulletType'), s.get('BulletType', ''))
    armor_type = armor_map.get(s.get('ArmorType'), s.get('ArmorType', ''))
    pos = (s.get('Position') or '').upper()
    role = role_map.get(s.get('TacticRole'), s.get('TacticRole', ''))
    school = s.get('School', '')
    order = s.get('DefaultOrder', 0)
    is_released = s.get('IsReleased', [True, True])
    
    # icon url (schaledb or fallback)
    icon_url = f"https://schaledb.com/images/student/icon/{sid}.webp"
    
    processed.append({
        'id': sid,
        'name': name,
        'starGrade': star,
        'bulletType': bullet_type,
        'armorType': armor_type,
        'squadType': squad_type,
        'position': pos,
        'role': role,
        'school': school,
        'order': order,
        'isReleased': is_released[1] if isinstance(is_released, list) and len(is_released) > 1 else True,
        'iconUrl': icon_url
    })

print(f"Processed valid students: {len(processed)}")
with open('src/data/allStudents.json', 'w', encoding='utf-8') as f:
    json.dump(processed, f, ensure_ascii=False, indent=2)

print("Saved to src/data/allStudents.json successfully!")
