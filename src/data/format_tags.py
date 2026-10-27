import json

with open('src/data/event_tags.json', 'r', encoding='utf-8') as f:
    tags = json.load(f)

korean_minigame_names = {
    '미니게임 - card_flip': '미니게임 - 카드 뽑기',
    '미니게임 - treasure_hunt': '미니게임 - 보물 찾기',
    '미니게임 - box_gacha': '박스 가챠 (상자 추첨)',
    '미니게임 - fortune_gacha': '오미쿠지 (점괘 뽑기)',
    '미니게임 - concentration': '미니게임 - 카드 뒤집기 (기억력)',
    '미니게임 - clue_search': '미니게임 - 단서 수색'
}

for uid, t_list in tags.items():
    new_list = []
    for t in t_list:
        new_list.append(korean_minigame_names.get(t, t))
    tags[uid] = new_list

with open('src/data/event_tags.json', 'w', encoding='utf-8') as f:
    json.dump(tags, f, ensure_ascii=False, indent=2)

print("Updated event_tags.json with clean Korean names.")
for uid in ['859', '858', '856', '861', '806']:
    print(uid, tags.get(uid))
