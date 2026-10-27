import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Search github repos for blue archive student data json
urls = [
    'https://raw.githubusercontent.com/SchaleDB/SchaleDB/main/data/kr/students.json',
    'https://raw.githubusercontent.com/lonqix/SchaleDB/main/data/kr/students.json',
    'https://raw.githubusercontent.com/JustinBs/SchaleDB/main/data/kr/students.json',
    'https://schale.gg/data/kr/students.json',
    'https://raw.githubusercontent.com/baql-dev/baql/main/data/students.json'
]

for u in urls:
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as r:
            data = json.loads(r.read().decode('utf-8'))
            print("SUCCESS from", u, "Count:", len(data))
            with open('students_raw.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            break
    except Exception as e:
        print("Failed", u, e)
