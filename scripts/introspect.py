import urllib.request, json, sys
sys.stdout.reconfigure(encoding='utf-8')

def gql(query):
    req = urllib.request.Request('https://api.baql.net/graphql',
        data=json.dumps({'query': query}).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'})
    return json.loads(urllib.request.urlopen(req).read().decode('utf-8'))

def fields(name):
    r = gql('{ __type(name: "%s") { fields { name type { name kind ofType { name kind ofType { name kind } } } } } }' % name)
    t = r['data']['__type']
    if not t: return None
    out = []
    for f in t['fields']:
        ty = f['type']
        n = ty.get('name') or (ty.get('ofType') or {}).get('name') or ((ty.get('ofType') or {}).get('ofType') or {}).get('name')
        out.append(f"{f['name']}:{n}")
    return out

for t in ['EventContent', 'Stage', 'StageReward', 'EventContentStage', 'EventContentShopResource', 'EventContentBonus', 'EventContentSchedule']:
    print(t, fields(t))

r = gql('{ eventContents { uid name schedules { region runType startAt endAt } } }')
regions = set()
for e in r['data']['eventContents']:
    for s in e['schedules'] or []:
        regions.add(s['region'])
print('regions:', regions)
print(json.dumps(r['data']['eventContents'][:3], ensure_ascii=False))
