import json

with open('src/data/event_tags.json', 'r', encoding='utf-8') as f:
    tags_map = json.load(f)

with open('src/data/eventIndex.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the line with EVENT_INDEX: EventSummary[] = [
json_str = ""
capture = False
for line in lines:
    if "EVENT_INDEX: EventSummary[] = [" in line:
        capture = True
        json_str += "[\n"
        continue
    if capture:
        if line.strip() == "];":
            json_str += "]\n"
            break
        json_str += line

events = json.loads(json_str)

for ev in events:
    uid = ev['uid']
    ev['tags'] = tags_map.get(uid.replace('_rerun', ''), ['스테이지', '미션', '상점'])

ts_content = '''// 자동 생성 파일: python scripts/build_events.py
export interface EventSummary {
  uid: string;
  name: string;
  period: string;
  glPeriod?: string;
  jpPeriod?: string;
  startAt: string | null;
  endAt: string | null;
  runs?: { type: string; startAt: string; endAt: string }[];
  tags?: string[];
}

export const EVENT_INDEX: EventSummary[] = ''' + json.dumps(events, ensure_ascii=False, indent=2) + ';\n'

with open('src/data/eventIndex.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f"Updated eventIndex.ts with dynamic tags for all {len(events)} events.")
