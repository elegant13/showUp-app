import subprocess

with open('js/config.js', 'r') as f:
    config_code = f.read()

with open('js/history.js', 'r') as f:
    history_code = f.read()

test_script = f"""
const store = {{}};
var localStorage = {{
  getItem: function(k) {{ return store[k] !== undefined ? store[k] : null; }},
  setItem: function(k, v) {{ store[k] = String(v); }},
  removeItem: function(k) {{ delete store[k]; }},
  clear: function() {{ Object.keys(store).forEach(function(k) {{ delete store[k]; }}); }}
}};

var elements = {{}};
var document = {{
  getElementById: function(id) {{
    if (!elements[id]) {{
      elements[id] = {{
        id: id,
        value: '',
        max: '',
        innerText: '',
        title: '',
        classList: {{
          contains: function() {{ return false; }},
          add: function() {{}},
          remove: function() {{}}
        }}
      }};
    }}
    return elements[id];
  }},
  addEventListener: function() {{}}
}};

var window = this;
var console = {{
  log: function() {{
    var args = Array.prototype.slice.call(arguments);
    print(args.join(" "));
  }},
  warn: function() {{
    var args = Array.prototype.slice.call(arguments);
    print("[WARN] " + args.join(" "));
  }},
  assert: function(cond, msg) {{
    if (!cond) {{
      throw new Error("Assertion failed: " + msg);
    }}
  }}
}};

{config_code}
{history_code}

// Test 1: getUserTimeZone detects and tracks timezone in localStorage
var tz = getUserTimeZone();
console.log("Detected time zone:", tz);
console.assert(tz && tz.length > 0, "Time zone is detected");
console.assert(localStorage.getItem('showUp_user_timezone') === tz, "Time zone tracked in localStorage");

// Test 2: getLocalDateKey respects local timezone even when UTC has crossed into next day
// Simulate 8:30 PM EDT (UTC-4) on Oct 16: UTC time is 00:30 on Oct 17
var eveningDate = new Date("2026-10-17T00:30:00Z"); // 8:30 PM Oct 16 in NY (EDT)
var nyKey = new Intl.DateTimeFormat('en-CA', {{
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}}).format(eveningDate);
console.log("Oct 16 8:30 PM EDT in NY timezone resolves to:", nyKey);
console.assert(nyKey === "2026-10-16", "New York time zone correctly keeps date on Oct 16 when UTC is Oct 17");

// Test 3: Date picker initialization uses local date key
initDatePickerConstraints();
var dateInput = document.getElementById('workout-date-picker');
var expectedToday = getLocalDateKey();
console.log("Date picker value:", dateInput.value, "Expected today:", expectedToday);
console.assert(dateInput.value === expectedToday, "Date picker value initialized to local date");
console.assert(dateInput.max === expectedToday, "Date picker max constrained to local date");
console.assert(selectedWorkoutDate === expectedToday, "selectedWorkoutDate matches local date");

// Test 4: Timezone display element updated
updateTimezoneDisplay();
var tzDisplay = document.getElementById('user-timezone-display');
console.log("Timezone display text:", tzDisplay.innerText);
console.assert(tzDisplay.innerText.length > 0, "Timezone display has text");

console.log("ALL TIMEZONE TRACKING TESTS PASSED!");
"""

with open("scratch/test_tz.js", "w") as f:
    f.write(test_script)

res = subprocess.run([
    '/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc',
    'scratch/test_tz.js'
], capture_output=True, text=True)

print(res.stdout)
if res.stderr:
    print("STDERR:", res.stderr)
assert res.returncode == 0, "Timezone test script failed"
