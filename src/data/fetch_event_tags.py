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
events = res['data']['eventContents']

event_tags_map = {}
for ev in events:
    uid = str(ev['uid'])
    name = ev['name']
    
    tags = []
    
    stages = ev.get('stages') or []
    if stages:
        tags.append('스테이지')
        
    # Almost all Blue Archive events with stages have missions
    if stages:
        tags.append('미션')
        
    shops = ev.get('shopResources') or []
    if shops:
        tags.append('상점')
        
    minigames = ev.get('minigameConfigs') or []
    for mg in minigames:
        mtype = mg.get('minigameType', '')
        if mtype == 'CardFlip':
            tags.append('미니게임 - 카드 뽑기')
        elif mtype == 'TreasureHunt':
            tags.append('미니게임 - 보물 찾기')
        elif mtype == 'BoxGacha':
            tags.append('박스 가챠 (상자 추첨)')
        elif mtype == 'FortuneGacha':
            tags.append('오미쿠지 (점괘 뽑기)')
        elif mtype == 'Dice':
            tags.append('미니게임 - 주사위 레이스')
        elif mtype == 'Rhythm':
            tags.append('미니게임 - 리듬게임')
        elif mtype == 'Shooting':
            tags.append('미니게임 - 슈팅')
        elif mtype == 'Defense':
            tags.append('미니게임 - 디펜스')
        elif mtype == 'Road':
            tags.append('미니게임 - 타일 개척')
        elif mtype:
            tags.append(f"미니게임 - {mtype}")
            
    event_tags_map[uid] = tags

print(f"Generated tags for {len(event_tags_map)} events.")
for uid in ['862', '861', '860', '859', '858', '856', '841', '808', '806']:
    if uid in event_tags_map:
        print(f"UID {uid} ({next(e['name'] for e in events if str(e['uid'])==uid)}): {event_tags_map[uid]}")

with open('src/data/event_tags.json', 'w', encoding='utf-8') as f:
    json.dump(event_tags_map, f, ensure_ascii=False, indent=2)
