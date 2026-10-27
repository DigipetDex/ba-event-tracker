import urllib.request, json, sys
sys.stdout.reconfigure(encoding='utf-8')

def gql(query):
    req = urllib.request.Request('https://api.baql.net/graphql',
        data=json.dumps({'query': query}).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'})
    try:
        return json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode('utf-8'))

r = gql('''{ __type(name: "RunTypeEnum") { enumValues { name } } }''')
print('RunTypeEnum', [v['name'] for v in r['data']['__type']['enumValues']])

r = gql('''{ eventContent(uid: "859") {
  stages(runType: first) { stageNumber stageType enterCostAmount rewards { amount probability tag resource { __typename uid name } } }
} }''')
if 'errors' in r: print(r['errors'])
stages = r['data']['eventContent']['stages']
print('stageTypes', set(s['stageType'] for s in stages), 'count', len(stages))
for st in stages:
    if st['stageNumber'] in ('1', '10'):
        print(st['stageNumber'], st['stageType'], st['enterCostAmount'])
        for rw in st['rewards']:
            print('   ', rw['tag'], rw['amount'], rw['probability'], rw['resource']['__typename'], rw['resource']['uid'], rw['resource']['name'])
