import subprocess
import json
import re

files = [
    'js/config.js',
    'js/storage.js',
    'js/utils.js',
    'js/theme.js',
    'js/auth.js',
    'js/workout.js',
    'js/history.js',
    'js/progress.js',
    'js/squads.js',
    'js/map.js',
    'js/visitors.js',
    'js/backup.js',
    'js/main.js'
]

# 1. Check individual file syntax
print("--- 1. Individual File Syntax Check ---")
all_syntax_pass = True
for f in files:
    # Wrap in minimal mock if needed
    res = subprocess.run([
        '/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc',
        f
    ], capture_output=True, text=True)
    if res.returncode != 0 and "SyntaxError" in (res.stdout + res.stderr):
        print(f"[FAIL] Syntax error in {f}: {res.stdout} {res.stderr}")
        all_syntax_pass = False
    else:
        print(f"[PASS] Syntax valid: {f}")

if not all_syntax_pass:
    print("Stopping due to syntax errors.")
    exit(1)

# 2. Check all functions are preserved
print("\n--- 2. Function Coverage Check ---")
with open('scratch/baseline_inventory.json', 'r', encoding='utf-8') as b_file:
    baseline = json.load(b_file)

baseline_funcs = set(baseline['functions'])
# Note: submitManualAuthProfile, seedInitialGlobalVisitorsLog, fillAuthProfilePreset were removed in Phase 0
# gm_authFailure stays inline in head (line 24)
expected_removed = {'submitManualAuthProfile', 'seedInitialGlobalVisitorsLog', 'fillAuthProfilePreset', 'gm_authFailure'}
target_funcs = baseline_funcs - expected_removed

found_funcs = set()
func_pattern = re.compile(r'(?:function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:window\.)?([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?function)')

for f in files:
    with open(f, 'r', encoding='utf-8') as src:
        content = src.read()
    for m in func_pattern.finditer(content):
        fn = m.group(1) or m.group(2) or m.group(3)
        if fn:
            found_funcs.add(fn)

missing = target_funcs - found_funcs
if missing:
    print(f"[FAIL] Missing {len(missing)} functions: {missing}")
else:
    print(f"[PASS] All {len(target_funcs)} functions from baseline are preserved across modular files!")

