import re, json
from html.parser import HTMLParser

class BaselineAuditor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.inline_handlers = []
        self.scripts = []
        self.in_script = False
        self.current_script = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if 'id' in attrs_dict:
            self.ids.add(attrs_dict['id'])
        for attr, val in attrs:
            if attr.startswith('on') and val:
                self.inline_handlers.append((tag, attr, val))
        if tag == 'script':
            self.in_script = True
            self.current_script = []

    def handle_endtag(self, tag):
        if tag == 'script':
            self.in_script = False
            self.scripts.append(''.join(self.current_script))
            self.current_script = []

    def handle_data(self, data):
        if self.in_script:
            self.current_script.append(data)

def extract_baseline():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    auditor = BaselineAuditor()
    auditor.feed(html)

    all_js = "\n".join(auditor.scripts)

    # Function declarations
    func_pattern = re.compile(r'(?:function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:window\.)?([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?function)')
    functions = set()
    for m in func_pattern.finditer(all_js):
        fn = m.group(1) or m.group(2) or m.group(3)
        if fn:
            functions.add(fn)

    # LocalStorage keys
    ls_keys = set(re.findall(r'localStorage\.(?:getItem|setItem|removeItem)\s*\(\s*[\'\"]([a-zA-Z0-9_]+)[\'\"]', all_js))

    data = {
        "dom_ids_count": len(auditor.ids),
        "dom_ids": sorted(list(auditor.ids)),
        "functions_count": len(functions),
        "functions": sorted(list(functions)),
        "inline_handlers_count": len(auditor.inline_handlers),
        "inline_handlers": auditor.inline_handlers,
        "localStorage_keys_count": len(ls_keys),
        "localStorage_keys": sorted(list(ls_keys))
    }

    with open('scratch/baseline_inventory.json', 'w', encoding='utf-8') as out:
        json.dump(data, out, indent=2)

    print(f"Baseline Inventory Saved:")
    print(f"  DOM IDs: {data['dom_ids_count']}")
    print(f"  Functions: {data['functions_count']}")
    print(f"  Inline Handlers: {data['inline_handlers_count']}")
    print(f"  LocalStorage Keys: {data['localStorage_keys_count']}")

if __name__ == '__main__':
    extract_baseline()
