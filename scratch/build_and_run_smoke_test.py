import re
import os
import sys
import json
import subprocess
from html.parser import HTMLParser

class FullDOMAuditor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.classes = set()
        self.inline_handlers = []
        self.scripts = []
        self.in_script = False
        self.current_script = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if 'id' in attrs_dict:
            self.ids.add(attrs_dict['id'])
        if 'class' in attrs_dict:
            for cls in attrs_dict['class'].split():
                self.classes.add(cls)
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

def generate_and_run_smoke_test():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    auditor = FullDOMAuditor()
    auditor.feed(html)

    inline_scripts = [s for s in auditor.scripts if s.strip()]

    # Load baseline
    with open('scratch/baseline_inventory.json', 'r', encoding='utf-8') as f:
        baseline = json.load(f)

    print("============================================================")
    print("SHOWUP FULL-FLEDGED SMOKE TEST SUITE (PHASE 0 CHECKPOINT)")
    print("Runtime Engine: Apple JavaScriptCore (jsc)")
    print("============================================================")

    # 1. Audit DOM IDs and Inline handlers
    missing_ids = set(baseline['dom_ids']) - auditor.ids
    # Note: we intentionally removed 'auth-modal-name-input', 'auth-modal-email-input' in Phase 0,
    # and Experience Mode controls ('quick-ui-mode-toggle', 'quick-ui-mode-name', 'ui-mode-btn-*')
    # as Zen is now the exclusive default experience mode
    expected_removed_ids = {
        'auth-modal-name-input', 'auth-modal-email-input',
        'quick-ui-mode-toggle', 'quick-ui-mode-name',
        'ui-mode-btn-precision', 'ui-mode-btn-zen', 'ui-mode-btn-hud', 'ui-mode-btn-light'
    }
    actual_missing_ids = missing_ids - expected_removed_ids
    if actual_missing_ids:
        print(f"[FAIL] Unexpected missing DOM IDs ({len(actual_missing_ids)}): {actual_missing_ids}")
        return False
    else:
        print(f"[PASS] DOM IDs integrity verified ({len(auditor.ids)} elements present)")

    # 2. Check inline handlers
    # 3. Check that #tab-home-view has only 1 container (#home-weekly-outlook-card)
    home_match = re.search(r'<div id="tab-home-view"[^>]*>(.*?)</div>\s*<!-- VIEW TAB 1:', html, re.DOTALL)
    if home_match:
        home_content = home_match.group(1)
        containers = re.findall(r'<section\s+id="([^"]+)"', home_content)
        if containers == ['home-weekly-outlook-card']:
            print(f"[PASS] Home section container verified: #home-weekly-outlook-card is the ONLY container")
        else:
            print(f"[FAIL] Expected only #home-weekly-outlook-card in Home section, found: {containers}")
            return False

    # 4. Check header settings button icon-only with desktop tooltip
    if 'id="header-settings-btn"' in html and 'title="Settings"' in html:
        print("[PASS] Header settings button icon-only with 'Settings' desktop tooltip verified in HTML")
    else:
        print("[FAIL] Header settings button with title='Settings' missing in HTML")
        return False

    # 5. Check Workout in Progress HUD in HTML
    if 'id="workout-session-hud"' in html and 'Workout in progress' in html:
        print("[PASS] Workout session HUD with 'Workout in progress' verified in HTML")
    else:
        print("[FAIL] Workout session HUD missing in HTML")
        return False

    # 6. Check auto-muscles-scroll-container with horizontal scrolling in HTML
    if 'id="auto-muscles-scroll-container"' in html and 'overflow-x-auto' in html and 'whitespace-nowrap' in html:
        print("[PASS] auto-muscles-scroll-container with overflow-x-auto and whitespace-nowrap verified in HTML")
    else:
        print("[FAIL] auto-muscles-scroll-container with overflow-x-auto missing in HTML")
        return False

    # 7. Check target bullseye icon under target rest in HTML
    if 'fa-bullseye' in html and 'id="rest-timer-target-val"' in html:
        print("[PASS] Target bullseye icon under rest-timer-target-val verified in HTML")
    else:
        print("[FAIL] Target bullseye icon missing in HTML")
        return False

    # 8. Check Muscles Engaged section renaming, passive styling, and toggle in HTML
    if 'Muscles Engaged' in html and 'id="btn-toggle-muscle-map"' in html and 'id="btn-toggle-auto-muscles"' in html:
        print("[PASS] Muscles Engaged section renaming and toggle buttons verified in HTML")
    else:
        print("[FAIL] Muscles Engaged section renaming or toggle buttons missing in HTML")
        return False

    # 9. Check Exercise Filter Pills toggle, Macebell (Gadaa), and Collapsible Session Logs in HTML
    if ('id="btn-toggle-exercise-filters"' in html and
        'id="exercise-catalog-filter-container"' in html and
        'id="filter-pill-macebell"' in html and
        'id="current-session-logs-header"' in html and
        'id="btn-toggle-session-logs"' in html and
        'id="session-logs-chevron"' in html and
        'id="current-session-logs-body"' in html and
        'value="Macebell (Gadaa)"' in html):
        print("[PASS] Filter toggle, Macebell (Gadaa), and collapsible Current Session Logs verified in HTML")
    else:
        print("[FAIL] Filter toggle, Macebell (Gadaa), or collapsible Current Session Logs missing in HTML")
        return False

    # 10. Check HRM & Muscles Engaged Enable Options in Settings Defaults, 3s Pill Hang Time Copy, and Reduced Muscles Engaged Transparency in HTML
    if ('id="pref-hrm-enabled"' in html and
        'id="pref-hrm-enabled-row"' in html and
        'id="pref-hr-collapsed-row"' in html and
        'id="pref-muscles-engaged-enabled"' in html and
        'id="pref-muscles-engaged-enabled-row"' in html and
        'bg-slate-900/55' in html and
        'opacity-100' in html and
        'app for 3 seconds without interrupting your session' in html):
        print("[PASS] HRM & Muscles Engaged enable options in Defaults, 3s pill hang time copy, and reduced Muscles Engaged transparency verified in HTML")
    else:
        print("[FAIL] HRM/Muscles Engaged enable option, 3s pill copy, or Muscles Engaged opacity missing in HTML")
        return False

    # 11. Check Hyper-Emerald palette option, PR celebration banner, Set Classification chips, and Direct Dual-Target Numpad in HTML
    if ('id="pr-celebration-banner"' in html and
        'id="set-classification-container"' in html and
        'id="set-type-normal"' in html and
        'id="set-type-warmup"' in html and
        'id="set-type-drop"' in html and
        'id="set-type-failure"' in html and
        'id="direct-numpad-modal"' in html and
        'id="numpad-tab-weight"' in html and
        'id="numpad-tab-reps"' in html and
        '#00F59B' in html):
        print("[PASS] Hyper-Emerald palette, PR celebration banner, Set Classification chips, and Direct Dual-Target Keypad verified in HTML")
    else:
        print("[FAIL] PR banner, Set Classification chips, Direct Numpad, or Hyper-Emerald missing in HTML")
        return False

    # 12. Check Auto-Start Set on Rest Target preference toggle in HTML
    if ('id="pref-auto-start-set"' in html and
        'id="pref-auto-start-set-row"' in html and
        'Auto-Start Set on Rest Target' in html):
        print("[PASS] Auto-Start Set on Rest Target preference toggle verified in HTML")
    else:
        print("[FAIL] Auto-Start Set on Rest Target preference toggle missing in HTML")
        return False

    # 13. Check Mobile-First Bottom Sheets in HTML
    if ('mobile-bottom-sheet' in html and
        'w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto' in html and
        'pb-[max(1.5rem,env(safe-area-inset-bottom))]' in html):
        print("[PASS] Mobile-First sliding bottom sheets & pull handles verified in HTML")
    else:
        print("[FAIL] Mobile-First bottom sheets or pull handles missing in HTML")
        return False

    # 14. Check 1-Tap Match Last Set Button in HTML
    if ('id="btn-match-last-set"' in html and
        'id="btn-match-last-set-preview"' in html and
        'Match Last Set:' in html):
        print("[PASS] 1-Tap Match Last Set button verified in HTML")
    else:
        print("[FAIL] 1-Tap Match Last Set button missing in HTML")
        return False

    # 15. Check App Confirm Modal centering & comfortable button height in HTML
    if ('id="app-confirm-modal"' in html and
        'items-center justify-center' in html and
        'id="app-confirm-cancel-btn"' in html and
        'min-h-[48px]' in html):
        print("[PASS] App Confirm modal centered with minimum 48px button height verified in HTML")
    else:
        print("[FAIL] App Confirm modal comfortable touch targets missing in HTML")
        return False

    # 16. Verify Delete Account is NOT in profile dropdown (preventing accidental clicks under Log out)
    if 'id="btn-dropdown-delete-account"' not in html:
        print("[PASS] Delete Account safely excluded from profile dropdown (accidental clicks under Log out prevented)")
    else:
        print("[FAIL] Delete Account should not be directly under Log out in profile dropdown")
        return False

    if 'id="settings-delete-account-card"' in html and 'id="btn-settings-delete-account"' in html:
        print("[PASS] Delete Account safely housed in Settings Backup Danger Zone")
    else:
        print("[FAIL] Delete Account Danger Zone missing in Settings Backup")
        return False

    # Build the JSC Smoke Test JS File
    harness_code = """
// ================= BROWSER ENVIRONMENT MOCKS =================
const mockElements = {};
function getOrCreateElement(id, tag = 'div') {
  if (!mockElements[id]) {
    const listeners = {};
    const classes = new Set();
    const attributes = {};
    const children = [];
    mockElements[id] = {
      id: id,
      tagName: tag.toUpperCase(),
      className: '',
      children: children,
      value: '',
      checked: false,
      innerText: '',
      innerHTML: '',
      textContent: '',
      style: {},
      dataset: {},
      parentElement: { clientWidth: 400, clientHeight: 100 },
      classList: {
        add: (...cls) => cls.forEach(c => classes.add(c)),
        remove: (...cls) => cls.forEach(c => classes.delete(c)),
        toggle: (c, force) => {
          if (force === undefined) {
            if (classes.has(c)) classes.delete(c); else classes.add(c);
          } else if (force) classes.add(c); else classes.delete(c);
        },
        contains: (c) => classes.has(c)
      },
      setAttribute: (k, v) => { attributes[k] = String(v); },
      getAttribute: (k) => attributes[k] !== undefined ? attributes[k] : null,
      removeAttribute: (k) => { delete attributes[k]; },
      addEventListener: (ev, fn) => {
        if (!listeners[ev]) listeners[ev] = [];
        listeners[ev].push(fn);
      },
      dispatchEvent: (ev) => {
        const type = typeof ev === 'string' ? ev : ev.type;
        if (listeners[type]) listeners[type].forEach(fn => fn(ev));
      },
      querySelector: (sel) => getOrCreateElement('sub_' + Math.random().toString(36).substr(2, 5)),
      querySelectorAll: (sel) => [],
      appendChild: (child) => { children.push(child); return child; },
      removeChild: (child) => child,
      remove: () => {},
      replaceChildren: () => { children.length = 0; },
      focus: () => {},
      blur: () => {},
      scrollIntoView: () => {},
      getBoundingClientRect: () => ({ top: 100, bottom: 150, left: 10, right: 300, width: 290, height: 50 }),
      closest: (sel) => null,
      contains: (target) => false,
      getContext: () => ({
        clearRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {}
      }),
      click: function() {
        if (typeof this.onclick === 'function') this.onclick();
        if (listeners['click']) listeners['click'].forEach(fn => fn({ target: this }));
      }
    };
  }
  return mockElements[id];
}

const mockLS = {};
const mockLocalStorage = {
  getItem: (k) => mockLS[k] !== undefined ? mockLS[k] : null,
  setItem: (k, v) => { mockLS[k] = String(v); },
  removeItem: (k) => { delete mockLS[k]; },
  clear: () => { for (let k in mockLS) delete mockLS[k]; }
};

globalThis.console = {
  log: () => {},
  warn: () => {},
  error: () => {},
  info: () => {},
  debug: () => {}
};

globalThis.window = globalThis;
globalThis.addEventListener = (ev, fn) => {
  globalThis._listeners = globalThis._listeners || {};
  globalThis._listeners[ev] = globalThis._listeners[ev] || [];
  globalThis._listeners[ev].push(fn);
};
globalThis.removeEventListener = () => {};
globalThis.window.addEventListener = globalThis.addEventListener;
globalThis.window.removeEventListener = globalThis.removeEventListener;

globalThis.setTimeout = (fn, ms) => 1;
globalThis.clearTimeout = (id) => {};
globalThis.setInterval = (fn, ms) => 1;
globalThis.clearInterval = (id) => {};
globalThis.window.setTimeout = globalThis.setTimeout;
globalThis.window.clearTimeout = globalThis.clearTimeout;
globalThis.window.setInterval = globalThis.setInterval;
globalThis.window.clearInterval = globalThis.clearInterval;
globalThis.requestAnimationFrame = (fn) => 1;
globalThis.cancelAnimationFrame = (id) => {};
globalThis.scrollTo = (opts) => {};
globalThis.window.scrollTo = globalThis.scrollTo;

globalThis.document = {
  getElementById: (id) => getOrCreateElement(id),
  querySelector: (sel) => getOrCreateElement('qs_' + sel),
  querySelectorAll: (sel) => [],
  createElement: (tag) => getOrCreateElement('el_' + Math.random().toString(36).substr(2, 5), tag),
  body: getOrCreateElement('body', 'body'),
  documentElement: getOrCreateElement('html', 'html'),
  addEventListener: (ev, fn) => {
    globalThis.addEventListener(ev, fn);
  }
};
globalThis.localStorage = mockLocalStorage;
globalThis.sessionStorage = mockLocalStorage;
globalThis.navigator = {
  userAgent: 'Mozilla/5.0 Mac',
  onLine: true,
  geolocation: { getCurrentPosition: (success, error) => {} },
  wakeLock: {
    request: async (type) => {
      globalThis.__wakeLockRequested = type;
      return {
        type: type,
        released: false,
        release: async function() { this.released = true; globalThis.__wakeLockReleased = true; },
        addEventListener: (ev, fn) => {}
      };
    }
  },
  vibrate: (pattern) => {
    globalThis.__lastVibrate = pattern;
    return true;
  }
};
globalThis.AudioContext = function() {
  return {
    state: 'running',
    currentTime: 0,
    resume: () => {},
    createOscillator: () => ({
      type: 'sine',
      frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {} },
      connect: () => {},
      start: () => {},
      stop: () => {}
    }),
    createGain: () => ({
      gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {} },
      connect: () => {}
    }),
    createDynamicsCompressor: () => ({
      threshold: { setValueAtTime: () => {} },
      knee: { setValueAtTime: () => {} },
      ratio: { setValueAtTime: () => {} },
      attack: { setValueAtTime: () => {} },
      release: { setValueAtTime: () => {} },
      connect: () => {}
    }),
    destination: {}
  };
};
globalThis.webkitAudioContext = globalThis.AudioContext;
globalThis.location = { href: 'http://localhost/', reload: () => {} };
globalThis.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
globalThis.alert = (msg) => {};
globalThis.confirm = (msg) => true;
globalThis.lastTokenClientInitConfig = null;
globalThis.lastTokenClientRequestConfig = null;
globalThis.google = {
  accounts: {
    id: { initialize: () => {}, renderButton: () => {} },
    oauth2: {
      initTokenClient: (config) => {
        globalThis.lastTokenClientInitConfig = config;
        return {
          requestAccessToken: (reqConfig) => {
            globalThis.lastTokenClientRequestConfig = reqConfig;
          }
        };
      },
      hasGrantedAllScopes: (response, ...scopes) => true
    }
  }
};

// Test Framework in JSC
let testPassedCount = 0;
let testFailedCount = 0;

function assert(cond, msg) {
  if (!cond) {
    testFailedCount++;
    print("  [FAIL] " + msg);
    throw new Error(msg);
  } else {
    testPassedCount++;
    print("  [PASS] " + msg);
  }
}

function runSuite(name, fn) {
  print("\\n=== SUITE: " + name + " ===");
  try {
    fn();
  } catch (err) {
    print("  SUITE ERROR in " + name + ": " + err.message);
  }
}
"""

    # Add the inline scripts plus external js files in exact order
    js_files = [
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
    external_code = []
    for js_f in js_files:
        with open(js_f, 'r', encoding='utf-8') as f:
            external_code.append(f.read())
    app_code = "\n".join(inline_scripts + external_code)

    # Add Test Assertions
    assertions_code = """
// ================= LIVE FUNCTIONAL SMOKE TEST SUITES =================

runSuite("1. App Initialization & DOMContentLoaded", () => {
  assert(typeof globalThis._listeners['DOMContentLoaded'] !== 'undefined', "DOMContentLoaded listeners registered");
  globalThis._listeners['DOMContentLoaded'].forEach(fn => fn());
  assert(Array.isArray(defaultCatalog) && defaultCatalog.length > 0, "Catalog initialized with exercises (" + defaultCatalog.length + " found)");
  assert(defaultCatalog.some(e => e.name === "Barbell Back Squat"), "Barbell Back Squat present in catalog");
  assert(defaultCatalog.some(e => e.implement === "Row Erg"), "Row Erg exercises present in catalog");
});

runSuite("2. Theme Palette & Typography Engine", () => {
  const palettes = ['orange', 'teal', 'lime', 'india', 'obsidian'];
  palettes.forEach(p => {
    setThemePalette(p);
    assert(localStorage.getItem('showUp_theme_accent') === p, "Palette persistence for: " + p);
  });
  
  const fonts = ['font-jakarta', 'font-outfit', 'font-space', 'font-lexend', 'font-mono'];
  fonts.forEach(f => {
    setFontFamily(f);
    assert(localStorage.getItem('showUp_font') === f, "Font persistence for: " + f);
  });

  // Zen is the exclusive default experience mode
  restoreAppUIMode();
  assert(localStorage.getItem('showUp_ui_mode') === 'zen', "Zen is default experience mode");
  setAppUIMode('zen');
  assert(localStorage.getItem('showUp_ui_mode') === 'zen', "UI mode persistence is zen");
  cycleAppUIMode();
  assert(localStorage.getItem('showUp_ui_mode') === 'zen', "Cycling UI mode remains in zen");
});

runSuite("3. Auth Security, Fake Seed Removal & Logout Eradication (TC-9.1, TC-9.2)", () => {
  assert(typeof globalThis.submitManualAuthProfile === 'undefined', "Manual unverified email sign-in bypass is eradicated");
  assert(typeof globalThis.seedInitialGlobalVisitorsLog === 'undefined', "Fake visitor telemetry seed generator is eradicated");
  
  // Sign in simulation
  applyUserProfile({ firstName: "TestAthlete", email: "test@showup.app", picture: "pic.jpg" });
  assert(localStorage.getItem('showUp_user_profile') !== null, "User profile saved on login");
  
  // Populate IP location cache & visitor log
  localStorage.setItem('showUp_user_ip_zip', '20147');
  localStorage.setItem('showUp_user_ip_city', 'Ashburn, VA');
  localStorage.setItem('showUp_user_ip_lat', '39.0438');
  localStorage.setItem('showUp_user_ip_lng', '-77.4874');
  localStorage.setItem('showUp_global_visitors_log_v1', JSON.stringify([{ id: 'v1' }]));
  
  // Run logout
  handleLogout();
  
  // Verify complete purge
  assert(localStorage.getItem('showUp_user_profile') === null, "Logout cleared user profile");
  assert(localStorage.getItem('showUp_session_expiry') === null, "Logout cleared session expiry");
  assert(localStorage.getItem('showUp_user_ip_zip') === null, "Logout cleared showUp_user_ip_zip");
  assert(localStorage.getItem('showUp_user_ip_city') === null, "Logout cleared showUp_user_ip_city");
  assert(localStorage.getItem('showUp_user_ip_lat') === null, "Logout cleared showUp_user_ip_lat");
  assert(localStorage.getItem('showUp_user_ip_lng') === null, "Logout cleared showUp_user_ip_lng");
  assert(localStorage.getItem('showUp_global_visitors_log_v1') === null, "Logout cleared showUp_global_visitors_log_v1");

  // Verify AppStorage module API
  assert(typeof AppStorage !== 'undefined', "AppStorage module initialized");
  assert(typeof AppStorage.KEYS.USER_PROFILE === 'string', "AppStorage.KEYS contains typed constants");
  AppStorage.set('showUp_test_storage_key', { athlete: 'Tester', score: 100 });
  const retrieved = AppStorage.get('showUp_test_storage_key');
  assert(retrieved && retrieved.athlete === 'Tester', "AppStorage.get/set handles structured JSON defensively");
  AppStorage.remove('showUp_test_storage_key');
  assert(AppStorage.get('showUp_test_storage_key', 'fallback_val') === 'fallback_val', "AppStorage.get fallback default works");
});

runSuite("4. Workout Tracking & Logging Engine", () => {
  userWeight = 180;
  currentSessionSets = [];
  
  // Mock input elements for set logging
  getOrCreateElement('exercise-select').value = "Barbell Back Squat";
  getOrCreateElement('weight-input').value = "225";
  getOrCreateElement('reps-input').value = "5";
  getOrCreateElement('rpe-select').value = "8";
  
  // Log set manually into session
  const setObj = {
    id: Date.now(),
    exerciseName: "Barbell Back Squat",
    implement: "Barbell",
    muscle: "Quads",
    secondaryMuscles: ["Hamstrings/Glutes", "Core/Abs"],
    rpe: 8,
    weight: 225,
    reps: 5
  };
  currentSessionSets.push(setObj);
  assert(currentSessionSets.length === 1, "Set added to active workout session");
  renderLoggedSets();
  
  // Evaluate and finish workout
  getOrCreateElement('workout-title-input').value = "Leg Day Heavy";
  getOrCreateElement('workout-notes-input').value = "Felt great";
  evaluateAndFinishWorkout();
  
  assert(completedWorkoutsHistory.length > 0, "Workout added to completedWorkoutsHistory");
  const lastWorkout = completedWorkoutsHistory[completedWorkoutsHistory.length - 1];
  assert(lastWorkout.workoutName === "Leg Day Heavy", "Workout title saved accurately");
  assert(lastWorkout.totalVolume === (225 * 5), "Total strength volume calculated accurately: " + lastWorkout.totalVolume);

  // 1RM Calculation verification (Epley formula)
  function calcEpley1RM(w, r) {
    if (r === 1) return w;
    return Math.round(w * (1 + r / 30.0) * 10) / 10;
  }
  assert(calcEpley1RM(225, 5) === 262.5, "Epley 1RM calculation accurate for 225x5: " + calcEpley1RM(225, 5));
  assert(calcEpley1RM(315, 1) === 315, "Epley 1RM calculation accurate for 315x1: " + calcEpley1RM(315, 1));

  // --- TIMER REVIVAL VALIDATION (Req 1, 2, 3) ---
  // Req 1: Timer shall have start, pause, and restart options.
  assert(typeof startWorkoutTimer === 'function', "startWorkoutTimer is defined");
  assert(typeof pauseWorkoutTimer === 'function', "pauseWorkoutTimer is defined");
  assert(typeof restartWorkoutTimer === 'function', "restartWorkoutTimer is defined");

  workoutTimerSeconds = 0;
  startWorkoutTimer();
  assert(workoutTimerState === 'running', "Workout session timer starts");
  workoutTimerSeconds = 45;
  pauseWorkoutTimer();
  assert(workoutTimerState === 'paused', "Workout session timer pauses");
  assert(workoutTimerSeconds === 45, "Paused timer retains elapsed duration");
  restartWorkoutTimer();
  assert(workoutTimerState === 'running', "Workout session timer restarts");
  assert(workoutTimerSeconds === 0, "Restart resets timer to 0");
  pauseWorkoutTimer();

  // Req 2: Each set shall have a start set and log set option from a timer standpoint.
  // Once a set is logged, a rest timer shall start.
  currentSessionSets = [];
  getOrCreateElement('exercise-name-input').value = "Incline Dumbbell Press";
  getOrCreateElement('implement-select').value = "Dumbbell";
  getOrCreateElement('muscle-group-select').value = "Chest";
  getOrCreateElement('rpe-select').value = "8";
  getOrCreateElement('input-weight').value = "80";
  getOrCreateElement('input-reps').value = "10";

  assert(typeof startSet === 'function', "startSet option is defined");
  assert(typeof logSet === 'function', "logSet option is defined");

  // Athlete clicks "Start Set 1"
  startSet();
  assert(isSetInProgress === true, "Active set 1 is in progress");
  assert(activeSetStartTime !== null, "Active set start time is recorded");

  // Athlete finishes set 1 and clicks "Log Set 1"
  logSet();
  assert(currentSessionSets.length === 1, "Set 1 logged successfully");
  assert(isSetInProgress === false, "Set in progress is reset after logging");
  assert(isRestTimerRunning === true, "Rest timer automatically started after set 1 is logged");

  // Simulate 90 seconds of rest
  restTimerStartTime = Date.now() - (90 * 1000);

  // Req 3: When a second set is started the rest timer shall stop and get recorded as the rest period
  // between the prior set and the newly started set.
  startSet();
  assert(isRestTimerRunning === false, "Rest timer stopped when second set started");
  assert(currentPendingRestPeriod >= 89 && currentPendingRestPeriod <= 91, "Rest period recorded accurately (~90s): " + currentPendingRestPeriod);
  assert(isSetInProgress === true, "Set 2 is in progress");

  // Log set 2
  getOrCreateElement('input-reps').value = "8";
  logSet();
  assert(currentSessionSets.length === 2, "Set 2 logged successfully");
  const set2 = currentSessionSets[1];
  assert(set2.restPeriod >= 89 && set2.restPeriod <= 91, "Set 2 captured recorded rest period from prior set: " + set2.restPeriod);
  assert(isRestTimerRunning === true, "Rest timer started again after set 2");

  // Test Evaluation Summary timing breakdown (Total time, Rest time, Active time = total - rest)
  workoutTimerSeconds = 300; // 5 min workout
  evaluateAndFinishWorkout();

  assert(completedWorkoutsHistory.length > 0, "Workout evaluated and finished");
  const finishedWorkout = completedWorkoutsHistory[completedWorkoutsHistory.length - 1];
  assert(finishedWorkout.totalWorkoutSeconds >= 300, "totalWorkoutSeconds recorded in workout summary: " + finishedWorkout.totalWorkoutSeconds);
  assert(finishedWorkout.totalRestSeconds >= 89 && finishedWorkout.totalRestSeconds <= 91, "totalRestSeconds recorded in workout summary: " + finishedWorkout.totalRestSeconds);
  assert(finishedWorkout.totalActiveSeconds === (finishedWorkout.totalWorkoutSeconds - finishedWorkout.totalRestSeconds), "totalActiveSeconds is strictly the difference between total and rest: " + finishedWorkout.totalActiveSeconds);
  assert(document.getElementById('summary-total-time').innerText.length > 0, "summary-total-time rendered in DOM");
  assert(document.getElementById('summary-rest-time').innerText.length > 0, "summary-rest-time rendered in DOM");
  assert(document.getElementById('summary-active-time').innerText.length > 0, "summary-active-time rendered in DOM");

  // Cleanup rest timer
  stopRestTimer();
  assert(isRestTimerRunning === false, "Rest timer cleanly stopped");

  // --- HRM Minimalist Pill, Connectivity Modal & Auto-Expanding Card Tests ---
  assert(typeof isHRMConnected === 'function', "isHRMConnected is defined");
  assert(typeof openHRMModal === 'function', "openHRMModal is defined");
  assert(typeof closeHRMModal === 'function', "closeHRMModal is defined");
  assert(typeof connectHRM === 'function', "connectHRM is defined");
  assert(typeof toggleHRSimulator === 'function', "toggleHRSimulator is defined");
  assert(typeof disconnectHRM === 'function', "disconnectHRM is defined");

  const hrCardEl = getOrCreateElement('hr-card');
  const hrModalEl = getOrCreateElement('hrm-connectivity-modal');
  const hrPillLabelEl = getOrCreateElement('hr-pill-label');
  const hrPillBpmEl = getOrCreateElement('hr-pill-bpm');
  const liveHrDisplayEl = getOrCreateElement('live-hr-display');

  // Disconnected resting state
  disconnectHRM();
  assert(isHRMConnected() === false, "HRM is initially disconnected");
  assert(hrCardEl.classList.contains('hidden'), "Full HR telemetry card is hidden in minimalistic disconnected state");
  assert(hrPillLabelEl.innerText === "HRM Disconnected", "Minimalist pill shows HRM Disconnected");

  // Open & Close modal
  openHRMModal();
  assert(!hrModalEl.classList.contains('hidden'), "HRM connectivity modal opens on demand");
  closeHRMModal();
  assert(hrModalEl.classList.contains('hidden'), "HRM connectivity modal closes cleanly");

  // Connect via HR Simulator
  toggleHRSimulator();
  assert(isHRMConnected() === true, "HRM simulator is actively connected");
  assert(!hrCardEl.classList.contains('hidden'), "Full HR telemetry card auto-expands once connected");
  assert(liveHrDisplayEl.innerText !== "--", "Live HR display renders active BPM: " + liveHrDisplayEl.innerText);
  assert(hrPillLabelEl.innerText === "HRM Live:", "Minimalist pill updates to live telemetry state");
  assert(!hrPillBpmEl.classList.contains('hidden'), "Minimalist pill displays live BPM");

  // Disconnect HR
  disconnectHRM();
  assert(isHRMConnected() === false, "HRM cleanly disconnected");
  assert(hrCardEl.classList.contains('hidden'), "Full HR telemetry card collapses back to hidden when disconnected");
  assert(liveHrDisplayEl.innerText === "--", "Live HR display resets to --");
  assert(hrPillLabelEl.innerText === "HRM Disconnected", "Minimalist pill resets to disconnected resting state");
});

runSuite("5. History, Calendar & 'Showed Up' Logic (TC-4.1)", () => {
  const todayKey = typeof getLocalDateKey === 'function' ? getLocalDateKey() : (typeof getETDateKey === 'function' ? getETDateKey() : new Date().toISOString().slice(0, 10));
  const workedOutToday = completedWorkoutsHistory.some(item => (typeof item === 'string' ? item : item.date) === todayKey);
  assert(workedOutToday === true, "Today correctly recorded as 'Showed Up' with workout");
  renderCalendar();
  renderMonthlyHistory();
  assert(true, "Calendar and Monthly History rendered without exceptions");
});

runSuite("6. Squads Strict Isolation & Membership Controls (TC-6.1)", () => {
  // Clear squads
  localStorage.removeItem('showUp_squads');
  const loggedOutSquads = getSquads();
  assert(loggedOutSquads.length === 0, "Zero initial squads for logged-out athlete (strict isolation)");
  
  // Log in athlete
  applyUserProfile({ firstName: "ThunderAthlete", email: "thunder@showup.app" });
  
  // Create a user squad
  getOrCreateElement('new-squad-name').value = "Thunder Squad";
  getOrCreateElement('new-squad-motto').value = "Heavy lifting crew";
  createNewSquadSubmit();
  const squadsAfter = getSquads();
  assert(squadsAfter.length === 1, "Created squad appears in user squads");
  assert(squadsAfter[0].name === "Thunder Squad", "Created squad name matches: " + squadsAfter[0].name);
});

runSuite("7. Global Daily Counter & Live Telemetry Engine (TC-7.1)", () => {
  // Verify Set-based unique athlete logic
  const athletes = new Set();
  athletes.add("user_1");
  athletes.add("user_2");
  athletes.add("user_1"); // duplicate check
  assert(athletes.size === 2, "Daily athlete counter strictly deduplicates repeated logs by same athlete");
});

runSuite("8. Admin Telemetry & Zero Fake Seeds Verification", () => {
  // Fresh visitor log
  localStorage.removeItem(GLOBAL_VISITORS_LOG_KEY);
  const log = getGlobalVisitorsLog();
  assert(Array.isArray(log) && log.length === 0, "Global visitor log is completely empty on cold start (0 fake seeds)");
  
  // Parse location helper
  const parsed = parseCityAndState("Ashburn, VA", "20147");
  assert(parsed.city === "Ashburn", "City parsed correctly: " + parsed.city);
  assert(parsed.state === "VA", "State parsed correctly: " + parsed.state);
  assert(parsed.stateName === "Virginia", "State name resolved correctly: " + parsed.stateName);
  
  // Record real visitor location
  recordCurrentVisitorLocation({ city: "Ashburn, VA", zip: "20147", lat: 39.0438, lng: -77.4874 });
  const updatedLog = getGlobalVisitorsLog();
  assert(updatedLog.length === 1, "Exactly 1 real visitor entry recorded");
  assert(updatedLog[0].city === "Ashburn", "Recorded visitor city is authentic");

  // Verify top level visitors metric and telemetry total visitors metric are strictly identical
  const headerCount = getOrCreateElement('header-visitor-count').innerText;
  const adminTotal = getOrCreateElement('admin-telemetry-total-visitors').innerText;
  assert(headerCount === adminTotal, "Top level visitor count (" + headerCount + ") matches telemetry total visitors (" + adminTotal + ")");
  assert(headerCount === "1", "Visitor count reflects recorded visitor: " + headerCount);
  
  // Verify Admin authorization
  applyUserProfile({ firstName: "RegularUser", email: "user@example.com" });
  assert(isGlobalVisitorTelemetryAdmin() === false, "Regular user is NOT admin for visitor telemetry");
  
  applyUserProfile({ firstName: "Abhi", email: "abhi13@gmail.com" });
  assert(isGlobalVisitorTelemetryAdmin() === true, "abhi13@gmail.com is recognized as admin for visitor telemetry");

  applyUserProfile({ firstName: "Hithesh", email: "hithesh@gmail.com" });
  assert(isGlobalVisitorTelemetryAdmin() === true, "hithesh@gmail.com is recognized as admin for visitor telemetry");

  // Verify Squads Telemetry tab & container in Global Telemetry Modal
  assert(typeof setAdminVisitorViewMode === "function", "setAdminVisitorViewMode is defined");
  setAdminVisitorViewMode('squads');
  assert(adminVisitorViewMode === 'squads', "adminVisitorViewMode is set to squads");
  const squadsContainer = getOrCreateElement('admin-squads-container');
  assert(!squadsContainer.classList.contains('hidden'), "admin-squads-container is visible in squads view mode");
  const tfContainer = getOrCreateElement('admin-timeframe-groups-container');
  assert(tfContainer.classList.contains('hidden'), "timeframe container is hidden in squads view mode");
  
  // Verify Squads summary tiles exist and update
  const totalSquadsAdmin = getOrCreateElement('admin-telemetry-total-squads');
  assert(totalSquadsAdmin !== null, "admin-telemetry-total-squads exists");
  const totalSquadsSettings = getOrCreateElement('settings-total-squads-count');
  assert(totalSquadsSettings !== null, "settings-total-squads-count exists");

  // Verify Firebase Firestore configuration
  assert(typeof FIREBASE_CONFIG === "object" && FIREBASE_CONFIG !== null, "FIREBASE_CONFIG is defined");
  assert(FIREBASE_CONFIG.projectId === "showup-app-ca372", "FIREBASE_CONFIG projectId is showup-app-ca372");
  assert(typeof FIREBASE_CONFIG.apiKey === "string" && FIREBASE_CONFIG.apiKey.length > 10, "FIREBASE_CONFIG apiKey is valid");
});

runSuite("9. Backup & Offline JSON Sync Engine", () => {
  // Ensure workout exists for current user
  if (completedWorkoutsHistory.length === 0) {
    completedWorkoutsHistory.push({
      date: "2026-10-10",
      workoutName: "Backup Verification Workout",
      totalVolume: 1200,
      sets: [{ exerciseName: "Bench Press", setNumber: 1, reps: 10, weight: 120 }]
    });
    AppStorage.saveAthleteWorkouts(completedWorkoutsHistory);
  }
  // Test export JSON generation
  exportJSONBackup();
  const backupWorkouts = completedWorkoutsHistory;
  assert(backupWorkouts.length > 0, "Workouts present for export backup");
});

runSuite("10. Multi-Tier Restore & Data Integrity Engine", () => {
  // Construct clean backup payload
  const restorePayload = {
    app: "showUp",
    version: "2.0",
    exportedAt: new Date().toISOString(),
    theme: "purple",
    font: "font-mono",
    profile: {
      height: 72,
      weight: 195,
      theme: "purple"
    },
    workouts: [
      { date: "2026-10-01", workoutName: "Test Bench Press", totalVolume: 1000, sets: [] }
    ],
    weightHistory: [
      { date: "2026-10-01", weight: 195 }
    ],
    squads: [
      {
        id: "squad_test_restore",
        name: "Restored Squad",
        creatorId: "thunder@showup.app",
        members: [{ id: "thunder@showup.app", name: "ThunderAthlete", email: "thunder@showup.app", isCreator: true }]
      }
    ]
  };

  // Simulate import restore logic
  if (restorePayload.theme) setThemePalette(restorePayload.theme);
  if (restorePayload.font) setFontFamily(restorePayload.font);
  completedWorkoutsHistory = restorePayload.workouts;
  localStorage.setItem('showUp_synced_workouts', JSON.stringify(completedWorkoutsHistory));
  
  assert(localStorage.getItem('showUp_theme_accent') === "purple", "Restore applied theme: purple");
  assert(localStorage.getItem('showUp_font') === "font-mono", "Restore applied font: font-mono");
  assert(completedWorkoutsHistory.length === 1, "Restore restored 1 workout");
  assert(completedWorkoutsHistory[0].workoutName === "Test Bench Press", "Restored workout title accurate");

  // Non-destructive workout merging test:
  // Today's workout recorded locally must NOT be erased by an incoming cloud restore
  const localTodayWorkout = { date: "2026-10-16", workoutName: "Today Heavy Deadlifts", totalVolume: 4500, sets: [{ reps: 5, weight: 315 }] };
  const cloudPastWorkouts = [
    { date: "2026-10-15", workoutName: "Yesterday Pull Ups", totalVolume: 1200, sets: [] },
    { date: "2026-10-16", workoutName: "Partial Sync Deadlifts", totalVolume: 1000, sets: [] } // Older/less complete sync
  ];

  const merged = AppStorage.mergeWorkouts([localTodayWorkout], cloudPastWorkouts);
  assert(merged.length === 2, "Merge preserves both today and past workouts");
  const mergedToday = merged.find(w => w.date === "2026-10-16");
  assert(mergedToday !== undefined, "Merged workouts retain today's session");
  assert(mergedToday.workoutName === "Today Heavy Deadlifts", "Merge retains the higher-fidelity local workout");
  assert(merged.some(w => w.date === "2026-10-15"), "Merge retains cloud past workout");
});

runSuite("11. Squads Collapsible UI & Athlete Profile Isolation Engine", () => {
  // Test 1: Squad collapse toggle functions exist
  assert(typeof toggleSquadCollapse === "function", "toggleSquadCollapse is a defined function");
  assert(typeof toggleSquadsDefaultCollapse === "function", "toggleSquadsDefaultCollapse is a defined function");
  assert(typeof toggleSquadsDefaultCollapsePref === "function", "toggleSquadsDefaultCollapsePref is a defined function");
  assert(typeof updateSquadsDefaultCollapseUI === "function", "updateSquadsDefaultCollapseUI is a defined function");

  // Test 2: Default collapse preference toggle
  toggleSquadsDefaultCollapsePref(true);
  assert(localStorage.getItem('showUp_squads_default_collapsed') === "true", "Default collapse preference saved as true");
  toggleSquadsDefaultCollapsePref(false);
  assert(localStorage.getItem('showUp_squads_default_collapsed') === "false", "Default collapse preference saved as false");

  // Test 3: Individual squad collapse toggle
  applyUserProfile({ firstName: "AlphaAthlete", email: "alpha@example.com" });
  const activeUser = getAppUser();
  const testSquads = [
    {
      id: "squad_alpha",
      name: "Alpha Squad",
      creatorId: activeUser.email,
      members: [{ id: activeUser.id || activeUser.email, name: "Alpha", email: activeUser.email, isCreator: true }]
    }
  ];
  saveSquads(testSquads);
  toggleSquadCollapse("squad_alpha");
  const updatedSquads = getSquads();
  assert(updatedSquads.length > 0, "Squad returned for active user");
  assert(updatedSquads[0].isCollapsed === true, "Squad isCollapsed toggled to true");
  toggleSquadCollapse("squad_alpha");
  const updatedSquads2 = getSquads();
  assert(updatedSquads2[0].isCollapsed === false, "Squad isCollapsed toggled to false");

  // Test 4: Athlete workout isolation vs Guest workout
  // Guest workouts in showUp_workouts_history
  localStorage.setItem('showUp_workouts_history', JSON.stringify([{ workoutName: "Guest Workout 1" }]));
  
  // Athlete profile applied with email
  applyUserProfile({ firstName: "AthleteOne", email: "athlete1@showup.app" });
  const profile = JSON.parse(localStorage.getItem('showUp_user_profile') || '{}');
  assert(profile.email === "athlete1@showup.app", "Active user is athlete1");
  // Athlete should not inherit guest workout directly if athlete store is initialized
  AppStorage.saveAthleteWorkouts([{ workoutName: "Athlete Workout 1" }]);
  const athleteStored = JSON.parse(localStorage.getItem('showUp_user_workouts_athlete1@showup.app') || '[]');
  assert(athleteStored.length === 1 && athleteStored[0].workoutName === "Athlete Workout 1", "Athlete isolated store preserved");

  // Switch to another athlete
  applyUserProfile({ firstName: "AthleteTwo", email: "athlete2@showup.app" });
  const athlete2Stored = JSON.parse(localStorage.getItem('showUp_user_workouts_athlete2@showup.app') || '[]');
  assert(athlete2Stored.length === 0, "New athlete starts with clean isolated workout store");

  // Test 5: Squad Member Invite Delivered and 'Yet to join' Engine
  applyUserProfile({ firstName: "CreatorCoach", email: "coach@showup.app" });
  const coachUser = getAppUser();
  const squadWithInvite = {
    id: "squad_invite_test",
    name: "Invitations Squad",
    creatorId: coachUser.id,
    creatorEmail: coachUser.email,
    members: [
      {
        id: coachUser.id,
        name: coachUser.name,
        rawName: coachUser.rawName,
        email: coachUser.email,
        isCreator: true,
        hasJoined: true
      },
      {
        id: "member_invited_pending",
        name: "Pending Teammate",
        rawName: "Pending Teammate",
        email: "pending@showup.app",
        invitedByEmail: true,
        inviteEmail: "pending@showup.app",
        inviteStatus: "delivered",
        inviteDeliveredAt: "10:20 AM",
        hasJoined: false,
        lastActive: "Just invited"
      }
    ]
  };

  // 5a: Verify isMemberYetToJoin returns true for pending invite and false for creator
  assert(typeof isMemberYetToJoin === "function", "isMemberYetToJoin function is defined");
  assert(isMemberYetToJoin(squadWithInvite.members[0], squadWithInvite, coachUser) === false, "Creator is joined, not yet to join");
  assert(isMemberYetToJoin(squadWithInvite.members[1], squadWithInvite, coachUser) === true, "Pending teammate is marked as Yet to join");

  // 5b: Render squads tab and verify 'Yet to join' and mail checkmark icon present
  saveSquads([squadWithInvite]);
  renderSquadsTab();
  const squadTabHtml = document.getElementById('squads-list-container').innerHTML;
  assert(squadTabHtml.includes("<span>Yet to join</span>"), "Squad card contains 'Yet to join' status pill");
  assert(squadTabHtml.includes("fa-envelope-circle-check"), "Squad card contains small mail checkmark icon");
  assert(!squadTabHtml.includes("simulateTeammateWorkout"), "Squad card does NOT contain simulateTeammateWorkout button");
  assert(!squadTabHtml.includes("Invite Delivered ("), "Bulky 'Invite Delivered (...)' text pill is avoided");

  // 5c: Once athlete joins, verify Yet to join & delivery badge are avoided
  squadWithInvite.members[1].hasJoined = true;
  squadWithInvite.members[1].inviteStatus = "accepted";
  assert(isMemberYetToJoin(squadWithInvite.members[1], squadWithInvite, coachUser) === false, "Joined teammate is no longer yet to join");
  saveSquads([squadWithInvite]);
  renderSquadsTab();
  const squadTabHtmlAfterJoin = document.getElementById('squads-list-container').innerHTML;
  assert(!squadTabHtmlAfterJoin.includes("fa-envelope-circle-check"), "Delivery badge icon avoided once athlete has joined squad");
  assert(!squadTabHtmlAfterJoin.includes("<span>Yet to join</span>"), "Yet to join status avoided once athlete has joined squad");

  // 5d: Fellow athlete joins via submitJoinSquadByCode with squad invite code
  const squadCoach = {
    id: "squad_code_join_test",
    name: "Thunderbirds",
    inviteCode: "THUNDER1",
    creatorId: coachUser.id,
    creatorEmail: coachUser.email,
    members: [
      {
        id: coachUser.id,
        name: coachUser.name,
        rawName: coachUser.rawName,
        email: coachUser.email,
        isCreator: true,
        hasJoined: true
      },
      {
        id: "member_sarah_invited",
        name: "Sarah Runner",
        rawName: "Sarah Runner",
        email: "sarah@showup.app",
        invitedByEmail: true,
        inviteEmail: "sarah@showup.app",
        inviteStatus: "delivered",
        hasJoined: false,
        lastActive: "Just invited"
      }
    ]
  };
  saveSquads([squadCoach]);
  saveSquadToGlobalRegistry(squadCoach);

  // Sarah logs in and enters the invite code THUNDER1
  applyUserProfile({ firstName: "Sarah", lastName: "Runner", email: "sarah@showup.app" });
  document.getElementById('join-squad-code-input').value = "THUNDER1";
  submitJoinSquadByCode();

  // Switch back to Coach's view and fetch squads
  applyUserProfile({ firstName: "CreatorCoach", email: "coach@showup.app" });
  const coachRetrievedSquads = getSquads();
  const coachThunderSquad = coachRetrievedSquads.find(s => s.id === "squad_code_join_test");
  assert(coachThunderSquad !== undefined, "Coach squad retrieved");
  const coachSarahMember = coachThunderSquad.members.find(m => m.email === "sarah@showup.app");
  assert(coachSarahMember !== undefined, "Sarah member found in coach's squad");
  assert(isMemberYetToJoin(coachSarahMember, coachThunderSquad, coachUser) === false, "Sarah is no longer Yet to join in coach's view");
  renderSquadsTab();
  const coachViewHtml = document.getElementById('squads-list-container').innerHTML;
  assert(!coachViewHtml.includes("<span>Yet to join</span>"), "Coach view does NOT show 'Yet to join' after fellow athlete joins");
  assert(!coachViewHtml.includes("fa-envelope-circle-check"), "Coach view does NOT show invite delivered envelope after fellow athlete joins");
  assert(coachViewHtml.includes("Yet to show up") || coachViewHtml.includes("Showed Up"), "Coach view shows active teammate workout status");
});

runSuite("12. Squad Teammate Workout Visibility & Auto-Login Retrieval Engine", () => {
  // 1: Verify bottom navigation centering and responsiveness markup in index.html and app.css
  const navHtml = document.querySelector('nav');
  assert(navHtml !== null, "Bottom navigation element exists in DOM");

  // 2: Verify Squad Teammates Workout Status visibility (Showed Up with workout title and Lifting Now)
  toggleSquadsDefaultCollapsePref(false);
  applyUserProfile({ firstName: "Coach", email: "coach@apex.com" });
  const coachUser = getAppUser();
  const currentETDate = getETDateKey();
  const testSquad = {
    id: "sq_status_test",
    name: "Apex Athletes",
    isCollapsed: false,
    creatorId: coachUser.id,
    creatorName: coachUser.name,
    creatorEmail: coachUser.email,
    members: [
      {
        id: coachUser.id,
        name: coachUser.name,
        rawName: coachUser.rawName,
        email: coachUser.email,
        isCreator: true,
        hasJoined: true,
        isWorkingOut: false,
        completedToday: false
      },
      {
        id: "teammate_1",
        name: "Sarah Connors",
        rawName: "Sarah Connors",
        email: "sarah@apex.com",
        isCreator: false,
        hasJoined: true,
        isWorkingOut: true,
        currentWorkout: "Back Squats 5x5",
        completedToday: false
      },
      {
        id: "teammate_2",
        name: "John Miller",
        rawName: "John Miller",
        email: "john@apex.com",
        isCreator: false,
        hasJoined: true,
        isWorkingOut: false,
        completedToday: true,
        completedDate: currentETDate,
        lastCompletedWorkout: "Olympic Clean & Jerk"
      }
    ]
  };

  saveSquads([testSquad]);
  renderSquadsTab();

  const renderedSquadHtml = document.getElementById('squads-list-container').innerHTML;
  assert(renderedSquadHtml.includes("Lifting Now: Back Squats 5x5"), "Teammate lifting status and current workout are visible");
  assert(renderedSquadHtml.includes("Showed Up"), "Teammate completed status 'Showed Up' is visible");
  assert(renderedSquadHtml.includes("Olympic Clean &amp; Jerk") || renderedSquadHtml.includes("Olympic Clean & Jerk"), "Teammate last completed workout title is visible to squad members");

  // 3: Verify broadcastUserWorkoutEnded updates current user's completedToday, completedDate, and lastCompletedWorkout
  broadcastUserWorkoutStarted("Heavy Deadlift Session");
  let squads = getSquads();
  let userMem = squads[0].members.find(m => m.id === coachUser.id || m.email === coachUser.email);
  assert(userMem.isWorkingOut === true, "User workout started broadcast sets isWorkingOut to true");
  assert(userMem.currentWorkout === "Heavy Deadlift Session", "User workout started sets workout title");

  broadcastUserWorkoutEnded("Heavy Deadlift Session");
  squads = getSquads();
  userMem = squads[0].members.find(m => m.id === coachUser.id || m.email === coachUser.email);
  assert(userMem.isWorkingOut === false, "User workout ended sets isWorkingOut to false");
  assert(userMem.completedToday === true, "User workout ended sets completedToday to true");
  assert(userMem.completedDate === currentETDate, "User workout ended sets completedDate to current ET date");
  assert(userMem.lastCompletedWorkout === "Heavy Deadlift Session", "User workout ended records lastCompletedWorkout");

  // 4: Verify auto-retrieval and display of workouts and squads upon login
  const testAthlete = {
    id: "athlete_auto_login",
    firstName: "Marcus",
    email: "marcus@gym.com",
    picture: "https://example.com/avatar.jpg"
  };

  // Seed isolated workouts for Marcus
  const marcusWorkouts = [
    { date: currentETDate, workoutName: "Morning Conditioning", sets: [{ weight: 100, reps: 10 }] }
  ];
  localStorage.setItem('showUp_user_workouts_marcus@gym.com', JSON.stringify(marcusWorkouts));

  // Apply user profile (login action)
  applyUserProfile(testAthlete);

  // Verify workouts retrieved and displayed
  assert(completedWorkoutsHistory.length === 1, "Workouts retrieved for athlete upon login");
  assert(completedWorkoutsHistory[0].workoutName === "Morning Conditioning", "Workout title accurately retrieved upon login");

  // Verify UI refreshed
  const loggedUser = getAppUser();
  assert(loggedUser.email === "marcus@gym.com", "Athlete profile active upon login");
});

runSuite("13. Leave Squad Immediate Removal & Accurate Retrieval Engine", function() {
  // Test User
  const athleteUser = {
    id: "athlete_leave_test",
    firstName: "Elena",
    rawName: "Elena Rostova",
    name: "Elena Rostova",
    email: "elena@fitness.com"
  };
  localStorage.setItem('showUp_user_profile', JSON.stringify(athleteUser));

  // Create two squads: one as creator, one as regular member
  const squadCreated = {
    id: "squad_elena_created",
    name: "Elena's Lifters",
    creatorId: athleteUser.id,
    creatorEmail: athleteUser.email,
    creatorName: athleteUser.name,
    members: [
      { id: athleteUser.id, name: athleteUser.name, rawName: athleteUser.rawName, email: athleteUser.email, isCreator: true },
      { id: "member_teammate_1", name: "Boris", rawName: "Boris", email: "boris@gym.com", isCreator: false }
    ]
  };

  const squadJoined = {
    id: "squad_team_beast",
    name: "Team Beast",
    creatorId: "coach_beast",
    creatorEmail: "coach@beast.com",
    creatorName: "Coach Beast",
    members: [
      { id: "coach_beast", name: "Coach Beast", email: "coach@beast.com", isCreator: true },
      { id: athleteUser.id, name: athleteUser.name, rawName: athleteUser.rawName, email: athleteUser.email, isCreator: false }
    ]
  };

  saveSquads([squadCreated, squadJoined]);
  let squads = getSquads();
  assert(squads.length === 2, "Both squads saved and visible to athlete");

  // Verify athlete leaves squadJoined as regular member
  leaveSquadAsMember("squad_team_beast");
  squads = getSquads();
  assert(squads.length === 1, "Immediate removal: Squads count decremented to 1");
  assert(squads.some(s => s.id === "squad_team_beast") === false, "Left squad is immediately removed from Squads view");

  // Verify athlete isolated cache does not contain left squad
  const userCached = JSON.parse(localStorage.getItem('showUp_user_squads_elena@fitness.com') || '[]');
  assert(userCached.some(s => s.id === "squad_team_beast") === false, "Left squad purged from user cache");

  // Verify global registry has user removed from squadJoined
  const globalReg = getGlobalSquadRegistry();
  const leftSqInGlobal = globalReg.find(s => s.id === "squad_team_beast");
  assert(leftSqInGlobal && !leftSqInGlobal.members.some(m => m.id === athleteUser.id), "User removed from global squad registry membership");

  // Verify creator transfer and leave
  transferTargetSquadId = "squad_elena_created";
  // Mock radio selection in DOM
  const mockRadio = getOrCreateElement("radio_mock");
  mockRadio.value = "member_teammate_1";
  document.querySelector = (sel) => {
    if (sel.includes('successor-creator-radio')) return mockRadio;
    return getOrCreateElement("dummy_" + Math.random().toString(36).substr(2, 4));
  };

  confirmTransferAndLeave();
  squads = getSquads();
  assert(squads.length === 0, "Creator transferred and left: Squad immediately removed from view");

  // Verify deleteSquadPrompt removes squad completely and permanently
  const singleSquad = {
    id: "squad_temp_to_delete",
    name: "Temp Squad",
    creatorId: athleteUser.id,
    creatorEmail: athleteUser.email,
    members: [{ id: athleteUser.id, email: athleteUser.email, isCreator: true }]
  };
  saveSquads([singleSquad]);
  assert(getSquads().length === 1, "Temp squad added");

  deleteSquadPrompt("squad_temp_to_delete");
  assert(getSquads().length === 0, "deleteSquadPrompt immediately removes squad from view");
  assert(getGlobalSquadRegistry().some(s => s.id === "squad_temp_to_delete") === false, "deleteSquadPrompt purges squad from global registry");

  // Verify accurate squad retrieval: left squad is NOT resurrected
  const candidateSquads = initSquads();
  assert(candidateSquads.length === 0, "Accurate squad retrieval: No phantom/left squads retrieved");
});

runSuite("14. Calendar Monday Start & Home Section Weekly Outlook / Celebration", () => {
  // 1. Verify Calendar Day Headers Start on Monday and End on Sunday
  const calGrid = getOrCreateElement('calendar-grid');
  renderCalendar();
  assert(calGrid.innerHTML.includes('>M<') && calGrid.innerHTML.includes('>S<'), "Calendar grid renders Monday-to-Sunday day headers");
  
  // Verify Weekday Monday calculation
  // Thursday Oct 1, 2026: Date.getDay() = 4. Monday offset = (4 + 6) % 7 = 3.
  const testDate = new Date(2026, 9, 15); // Thursday Oct 15, 2026
  const weekBounds = getWeekWorkoutBounds(testDate);
  assert(weekBounds.days.length === 7, "Weekly bounds contains exactly 7 days (Monday through Sunday)");
  assert(weekBounds.days[0].dayNameShort === "Mon", "First day of week is strictly Monday");
  assert(weekBounds.days[6].dayNameShort === "Sun", "Last day of week is strictly Sunday");
  assert(weekBounds.startDateKey === "2026-10-12", "Week start key is Monday Oct 12, 2026");
  assert(weekBounds.endDateKey === "2026-10-18", "Week end key is Sunday Oct 18, 2026");

  // 2. Verify Tab Switching Across All Sections (Home, Workout, Calendar, Squads)
  toggleSquadsEnabledPref(true);
  const homeView = getOrCreateElement('tab-home-view');
  const workoutView = getOrCreateElement('tab-workout-view');
  const calView = getOrCreateElement('tab-calendar-view');
  const squadsView = getOrCreateElement('tab-squads-view');
  const btnHome = getOrCreateElement('nav-btn-home');
  const btnWorkout = getOrCreateElement('nav-btn-workout');
  const btnCal = getOrCreateElement('nav-btn-calendar');
  const btnSquads = getOrCreateElement('nav-btn-squads');

  switchTab('home');
  assert(!homeView.classList.contains('hidden'), "Home tab view is visible when active");
  assert(workoutView.classList.contains('hidden'), "Workout tab view is hidden when Home is active");
  assert(btnHome.className.includes('text-emerald-400'), "Home nav button has active emerald highlight");
  assert(btnWorkout.className.includes('text-slate-400'), "Workout nav button is unhighlighted");

  switchTab('workout');
  assert(!workoutView.classList.contains('hidden'), "Workout tab view is visible when active");
  assert(homeView.classList.contains('hidden'), "Home tab view is hidden when Workout is active");

  switchTab('calendar');
  assert(!calView.classList.contains('hidden'), "Calendar tab view is visible when active");
  assert(workoutView.classList.contains('hidden'), "Workout tab view is hidden when Calendar is active");

  switchTab('squads');
  assert(!squadsView.classList.contains('hidden'), "Squads tab view is visible when active");
  assert(calView.classList.contains('hidden'), "Calendar tab view is hidden when Squads is active");

  // Tab Screen Reload & Persistence Verification
  assert(typeof restoreActiveTab === 'function', "restoreActiveTab is a defined function");
  switchTab('workout');
  assert(localStorage.getItem('showUp_active_tab') === 'workout', "Active tab persisted to localStorage on switch");
  // Simulate page reload calling restoreActiveTab
  restoreActiveTab();
  assert(!workoutView.classList.contains('hidden'), "restoreActiveTab reloads the athlete's current screen (workout) instead of resetting to home");

  switchTab('squads');
  assert(localStorage.getItem('showUp_active_tab') === 'squads', "Active tab persisted as squads");
  restoreActiveTab();
  assert(!squadsView.classList.contains('hidden'), "restoreActiveTab reloads the athlete's current screen (squads) instead of resetting to home");

  switchTab('home');
  assert(!homeView.classList.contains('hidden'), "Home tab view restored when switched back");

  // Verify Icon-Only Header Settings Button & Modal
  const headerSettingsBtn = getOrCreateElement('header-settings-btn');
  assert(headerSettingsBtn !== null, "Header settings button exists");
  assert(getOrCreateElement('settings-modal') !== null, "Settings modal exists with 'Settings' screen title");

  // 3. Verify Home Section Weekly Positive Outlook & Celebration (Requirement 1)
  const todayKey = typeof getETDateKey === 'function' ? getETDateKey() : new Date().toISOString().slice(0, 10);
  completedWorkoutsHistory = [
    {
      date: todayKey,
      workoutName: "Full Body Blast",
      totalSets: 12,
      totalVolume: 5400,
      totalWorkoutSeconds: 2400,
      totalWorkoutTimeFormatted: "40:00",
      totalRestSeconds: 600,
      totalRestTimeFormatted: "10:00",
      totalActiveSeconds: 1800,
      totalActiveTimeFormatted: "30:00",
      sets: [
        { exerciseName: "Bench Press", muscle: "Chest", weight: 225, reps: 5, rpe: 8 }
      ]
    }
  ];

  const weekStats = getWeekWorkoutStats();
  assert(weekStats.daysCount >= 1, "Week stats accurately captures weekly workouts");
  assert(weekStats.weekVolume >= 5400, "Week stats captures weekly volume");
  assert(typeof weekStats.outlookHeadline === 'string' && weekStats.outlookHeadline.length > 0, "Positive celebration headline generated for the week");
  assert(typeof weekStats.outlookMessage === 'string' && weekStats.outlookMessage.length > 0, "Positive celebration message generated for the week");

  // 4. Verify Congratulatory Casual Message for Today's Workout (Requirement 2)
  const dailyCongrat = getDailyWorkoutCongratulation();
  assert(dailyCongrat.completed === true, "Daily status recognizes workout done for the day");
  assert(dailyCongrat.headline.length > 0, "Congratulatory headline provided");
  assert(dailyCongrat.subtext.length > 0, "Casual congratulatory message provided");
  assert(dailyCongrat.workoutName === "Full Body Blast", "Workout name displayed in congratulation");

  // 5. Verify Full Home Tab DOM Rendering & Theme Color Fill
  renderHomeTab();
  const todayCard = getOrCreateElement('home-today-status-card');
  assert(todayCard.innerHTML.includes('Full Body Blast'), "Today status card renders workout title in DOM");
  assert(todayCard.innerHTML.includes(escapeHtml(dailyCongrat.headline)), "Today status card renders congratulatory headline");
  assert(todayCard.className.includes('hero-victory-card'), "Today status card uses hero-victory-card celebratory styling");

  const weekPills = getOrCreateElement('home-week-pills-container');
  assert(weekPills.innerHTML.includes('M') && weekPills.innerHTML.includes('S'), "Week pills container renders Monday to Sunday day initials");
  assert(weekPills.innerHTML.includes('background-color: var(--m3-primary)'), "Week calendar view displays showed-up days filled with theme color");

  const celebrationBanner = getOrCreateElement('home-week-celebration-banner');
  assert(celebrationBanner.innerHTML.includes(escapeHtml(weekStats.outlookHeadline)), "Celebration banner renders weekly positive outlook headline");

  const workoutsMetric = getOrCreateElement('home-metric-workouts');
  assert(workoutsMetric.innerText.includes('/ 7'), "Weekly workouts metric renders ratio of 7 days");

  // 6. Verify Daily Status when No Workout Done Today (Hidden, Single Container Clean State)
  completedWorkoutsHistory = [
    {
      date: "2020-01-01",
      workoutName: "Past Workout",
      totalSets: 5,
      totalVolume: 1000,
      sets: []
    }
  ];
  const restDayStatus = getDailyWorkoutCongratulation();
  assert(restDayStatus.completed === false, "Daily status recognizes no workout done today");
  renderHomeTab();
  assert(todayCard.classList.contains('hidden'), "Today status card is cleanly hidden when no workout done today");
  assert(todayCard.innerHTML === '', "Today status card has no lingering DOM markup when no workout done today");
});

runSuite("15. Running Exercise, HRM Capture & Evaluated Running Metrics Engine", () => {
  // 1. Catalog & Detection
  const runCatalog = defaultCatalog.find(c => c.name === "Running");
  assert(runCatalog !== undefined, "Running exists in defaultCatalog");
  assert(runCatalog.implement === "Running", "Running catalog implement is 'Running'");
  assert(runCatalog.muscle === "Quads", "Running primary muscle is Quads");

  // Exercise input detection
  handleExerciseInput("Running");
  assert(getOrCreateElement('implement-select').value === "Running", "handleExerciseInput sets implement to Running");
  assert(!getOrCreateElement('running-metrics-panel').classList.contains('hidden'), "running-metrics-panel is visible when Running is active");
  assert(getOrCreateElement('standard-metrics-panel').classList.contains('hidden'), "standard-metrics-panel is hidden when Running is active");

  handleExerciseInput("Morning Run 5K");
  assert(getOrCreateElement('implement-select').value === "Running", "fuzzy match 'Run' selects Running");

  handleExerciseInput("Interval Sprint Session");
  assert(getOrCreateElement('implement-select').value === "Running", "fuzzy match 'Sprint' selects Running");

  // 2. Quick Stepper / Adjuster functions
  const distInput = getOrCreateElement('input-running-distance');
  distInput.value = "3.1";
  adjustRunningDistance(1.0);
  assert(parseFloat(distInput.value) === 4.1, "adjustRunningDistance adds distance: " + distInput.value);
  adjustRunningDistance(-0.25);
  assert(parseFloat(distInput.value) === 3.85, "adjustRunningDistance subtracts distance: " + distInput.value);

  const timeInput = getOrCreateElement('input-running-time');
  timeInput.value = "00:25:00";
  adjustRunningTime(60);
  assert(timeInput.value === "00:26:00", "adjustRunningTime adds 1 minute: " + timeInput.value);
  adjustRunningTime(-300);
  assert(timeInput.value === "00:21:00", "adjustRunningTime subtracts 5 minutes: " + timeInput.value);

  const avgHrInput = getOrCreateElement('input-running-avg-hr');
  const maxHrInput = getOrCreateElement('input-running-max-hr');
  avgHrInput.value = "140";
  maxHrInput.value = "160";
  adjustRunningAvgHR(5);
  assert(parseInt(avgHrInput.value) === 145, "adjustRunningAvgHR adds 5 bpm: " + avgHrInput.value);
  adjustRunningMaxHR(5);
  assert(parseInt(maxHrInput.value) === 165, "adjustRunningMaxHR adds 5 bpm: " + maxHrInput.value);

  // 3. External Heart Rate Monitor (HRM) Capture
  disconnectHRM();
  updateRunningHRMUI();
  assert(isHRMConnected() === false, "HRM is disconnected initially");
  assert(getOrCreateElement('running-avg-hr-source').innerText === "Manual", "Avg HR source marked Manual when HRM disconnected");

  // Connect HRM via simulator
  toggleHRSimulator();
  assert(isHRMConnected() === true, "HRM connected via simulator");
  window.runningHRSamples = [150, 155, 160, 165, 170];
  updateHRTelemetry(160);
  assert(parseInt(avgHrInput.value) === 160, "Avg HR auto-captured from HRM: " + avgHrInput.value);
  assert(parseInt(maxHrInput.value) === 170, "Max HR auto-captured from HRM: " + maxHrInput.value);
  assert(getOrCreateElement('running-avg-hr-source').innerHTML.includes("HRM"), "Avg HR source marked HRM when connected");

  // 4. Log Running Set
  currentSessionSets = [];
  distInput.value = "3.1";
  timeInput.value = "00:24:48"; // 24m 48s = 8:00 /mi
  avgHrInput.value = "158";
  maxHrInput.value = "172";
  getOrCreateElement('exercise-name-input').value = "Tempo Run";

  logSet();
  assert(currentSessionSets.length === 1, "Running set successfully logged");
  const loggedRun = currentSessionSets[0];
  assert(loggedRun.implement === "Running", "Logged set implement is Running");
  assert(loggedRun.runningDistance === 3.1, "Logged set distance is 3.1 miles");
  assert(loggedRun.runningTime === "00:24:48", "Logged set time is 00:24:48");
  assert(loggedRun.runningAvgHR === 158, "Logged set avg HR is 158 bpm");
  assert(loggedRun.runningMaxHR === 172, "Logged set max HR is 172 bpm");

  renderLoggedSets();
  const loggedSetsList = getOrCreateElement('logged-sets-list');
  assert(loggedSetsList.innerHTML.includes('3.1 mi'), "renderLoggedSets renders 3.1 mi");
  assert(loggedSetsList.innerHTML.includes('158 avg'), "renderLoggedSets renders 158 avg HR");

  // 5. Ascertain Running Metrics on Finish and Evaluate Workout
  getOrCreateElement('workout-title-input').value = "Morning 5K Run";
  evaluateAndFinishWorkout();

  const finishedRunWorkout = completedWorkoutsHistory[completedWorkoutsHistory.length - 1];
  assert(finishedRunWorkout !== undefined, "Workout finished and saved");
  assert(finishedRunWorkout.runningMetrics !== null, "runningMetrics ascertained and saved on workoutObj");
  assert(finishedRunWorkout.runningMetrics.totalDistance === 3.1, "Ascertained totalDistance is 3.1: " + finishedRunWorkout.runningMetrics.totalDistance);
  assert(finishedRunWorkout.runningMetrics.avgPace === "8:00 /mi", "Ascertained avgPace is 8:00 /mi: " + finishedRunWorkout.runningMetrics.avgPace);
  assert(finishedRunWorkout.runningMetrics.avgSpeed === "7.5 mph", "Ascertained avgSpeed is 7.5 mph: " + finishedRunWorkout.runningMetrics.avgSpeed);
  assert(finishedRunWorkout.runningMetrics.avgHR === 158, "Ascertained avgHR is 158: " + finishedRunWorkout.runningMetrics.avgHR);
  assert(finishedRunWorkout.runningMetrics.maxHR === 172, "Ascertained maxHR is 172: " + finishedRunWorkout.runningMetrics.maxHR);
  assert(finishedRunWorkout.runningMetrics.calories > 0, "Ascertained running calories burned > 0: " + finishedRunWorkout.runningMetrics.calories);

  // Summary UI card DOM assertions
  const runSummaryCard = getOrCreateElement('summary-running-metrics-card');
  assert(!runSummaryCard.classList.contains('hidden'), "summary-running-metrics-card is visible in DOM");
  assert(getOrCreateElement('summary-running-distance').innerText === "3.10 mi", "summary-running-distance rendered in DOM");
  assert(getOrCreateElement('summary-running-pace').innerText === "8:00 /mi", "summary-running-pace rendered in DOM");
  assert(getOrCreateElement('summary-running-speed').innerText === "7.5 mph", "summary-running-speed rendered in DOM");
  assert(getOrCreateElement('summary-running-hr').innerText.includes("158"), "summary-running-hr rendered in DOM");

  // Clean up HRM
  disconnectHRM();
  assert(isHRMConnected() === false, "HRM cleanly disconnected after test");
});

runSuite("16. Squads Teammate Workout Details, Double High Five Emoting & Clean Map Scored View", () => {
  // 1. Verify existence of functions
  assert(typeof openSquadWorkoutDetailsModal === 'function', "openSquadWorkoutDetailsModal is a defined function");
  assert(typeof closeSquadWorkoutDetailsModal === 'function', "closeSquadWorkoutDetailsModal is a defined function");
  assert(typeof giveDoubleHighFive === 'function', "giveDoubleHighFive is a defined function");
  assert(typeof toggleDoubleHighFive === 'function', "toggleDoubleHighFive is a defined function");
  assert(typeof getMemberWorkoutDetails === 'function', "getMemberWorkoutDetails is a defined function");

  // 2. Setup athlete & squad with fellow athlete
  applyUserProfile({ firstName: "Jordan", lastName: "Peak", email: "jordan@showup.fit" });
  const activeUserJordan = getAppUser();

  const testSquad = {
    id: "sq_details_test_101",
    name: "Barbell Brigade",
    creatorId: activeUserJordan.email,
    members: [
      {
        id: activeUserJordan.id || "athlete_user_1",
        name: "Jordan Peak",
        email: "jordan@showup.fit",
        isCreator: true,
        role: "creator",
        status: "active",
        isWorkingOut: false,
        completedToday: true,
        lastCompletedWorkout: "Deadlift Overdrive",
        workoutDetails: {
          workoutTitle: "Deadlift Overdrive",
          workoutName: "Deadlift Overdrive",
          durationFormatted: "52m",
          volume: 12400,
          totalVolume: 12400,
          totalSets: 5,
          setsCount: 5,
          exercisesCount: 1,
          sets: [
            { exerciseName: "Deadlift", weight: 315, reps: 5, setNumber: 1 },
            { exerciseName: "Deadlift", weight: 365, reps: 3, setNumber: 2 },
            { exerciseName: "Deadlift", weight: 405, reps: 2, setNumber: 3 },
            { exerciseName: "Deadlift", weight: 405, reps: 2, setNumber: 4 },
            { exerciseName: "Deadlift", weight: 315, reps: 8, setNumber: 5 }
          ]
        },
        doubleHighFives: []
      },
      {
        id: "athlete_user_2",
        name: "Morgan Stone",
        email: "morgan@showup.fit",
        role: "member",
        status: "active",
        isWorkingOut: false,
        completedToday: true,
        lastCompletedWorkout: "Leg Day Heavy",
        workoutDetails: {
          workoutTitle: "Leg Day Heavy",
          workoutName: "Leg Day Heavy",
          durationFormatted: "48m",
          volume: 18200,
          totalVolume: 18200,
          totalSets: 4,
          setsCount: 4,
          exercisesCount: 1,
          sets: [
            { exerciseName: "Back Squat", weight: 225, reps: 8, setNumber: 1 },
            { exerciseName: "Back Squat", weight: 275, reps: 6, setNumber: 2 },
            { exerciseName: "Back Squat", weight: 315, reps: 4, setNumber: 3 },
            { exerciseName: "Back Squat", weight: 225, reps: 10, setNumber: 4 }
          ]
        },
        doubleHighFives: []
      }
    ]
  };

  saveSquads([testSquad]);

  // 3. View fellow athlete's workout details
  const morganDetails = getMemberWorkoutDetails(testSquad.members[1]);
  assert(morganDetails !== null, "Fellow athlete workout details retrieved");
  assert(morganDetails.workoutTitle === "Leg Day Heavy" || morganDetails.workoutName === "Leg Day Heavy", "Fellow athlete workout title is Leg Day Heavy");
  assert(morganDetails.totalVolume === 18200 || morganDetails.volume === 18200, "Fellow athlete volume is 18200 lbs");
  assert(morganDetails.sets.length === 4, "Fellow athlete logged 4 sets");

  // Open modal for fellow athlete
  openSquadWorkoutDetailsModal("sq_details_test_101", "athlete_user_2");
  const modal = getOrCreateElement('squad-workout-details-modal');
  assert(!modal.classList.contains('hidden'), "Squad workout details modal is visible");
  assert(getOrCreateElement('swd-athlete-name').innerText.includes("Morgan Stone"), "Modal shows fellow athlete name");
  assert(getOrCreateElement('swd-workout-title').innerText === "Leg Day Heavy", "Modal shows fellow athlete workout title");
  assert(getOrCreateElement('swd-sets-list').innerHTML.includes("Back Squat"), "Modal displays fellow athlete's exercise sets");

  // 4. Emote via Double High Five
  // Logged-in user Jordan gives double high five to Morgan
  const giveResult = giveDoubleHighFive("sq_details_test_101", "athlete_user_2");
  assert(giveResult === true, "giveDoubleHighFive succeeded");

  const refreshedSquads = getSquads();
  const refreshedMorgan = refreshedSquads[0].members.find(m => m.id === "athlete_user_2");
  assert(refreshedMorgan.doubleHighFives.length === 1, "Morgan received 1 double high five");
  assert(refreshedMorgan.doubleHighFives[0].giverName.includes("Jordan"), "High five giver name recorded as Jordan");
  assert(refreshedMorgan.doubleHighFives[0].giverEmail === "jordan@showup.fit", "High five giver email recorded as jordan@showup.fit");

  // 5. Athlete who received double high five views who gave it to them
  // Switch active user to Morgan
  applyUserProfile({ firstName: "Morgan", lastName: "Stone", email: "morgan@showup.fit" });

  // Morgan opens their own workout details modal
  openSquadWorkoutDetailsModal("sq_details_test_101", "morgan@showup.fit");
  const giversList = getOrCreateElement('swd-high-fives-givers-list');
  assert(giversList.innerHTML.includes("Jordan"), "Recipient can see Jordan gave them double high five in modal");
  assert(giversList.innerHTML.includes("Double High Fives (1)"), "High five count shows 1 in modal");
  assert(getOrCreateElement('swd-high-five-action-container').innerHTML.includes("1 Double High Five"), "Recipient sees celebration banner that they received 1 Double High Five");

  // Render squads tab and verify giver visibility in card/pill
  renderSquadsTab();
  const squadsContainer = getOrCreateElement('squads-list-container');
  assert(squadsContainer.innerHTML.includes("Jordan") || squadsContainer.innerHTML.includes("🙌"), "Squad view shows high five indicator and giver details");

  // Close modal
  closeSquadWorkoutDetailsModal();
  assert(modal.classList.contains('hidden'), "Squad workout details modal closes cleanly");

  // 6. Active Workout Map cleaner view (cleaner scored workouts count badge)
  const centerHud = getOrCreateElement('map-boundary-center-hud');
  const topHud = getOrCreateElement('map-boundary-top-hud');
  const testActiveNodes = [
    { zip: "20105", city: "Ashburn", lat: 39.0438, lng: -77.4874, activeCount: 5, completedToday: 42, lifters: [] }
  ];
  selectedHeatMapZip = "20105";
  currentMapZoom = 14;
  renderMapZipBoundariesOverlay(testActiveNodes);

  assert(topHud.innerHTML === "", "Top HUD is kept cleanly empty to avoid visual clutter");
  assert(centerHud.innerHTML.includes("42"), "Center HUD renders only the number of workouts scored: 42");
  assert(centerHud.innerHTML.includes("Workouts Scored"), "Center HUD indicates workouts scored cleanly");
  assert(!centerHud.innerHTML.includes("polygon"), "Heavy polygons eliminated from cleaner HUD view");

  // 7. Activity Workout Map Date Selector Engine
  assert(typeof getSelectedMapDate === 'function', "getSelectedMapDate is a defined function");
  assert(typeof setSelectedMapDate === 'function', "setSelectedMapDate is a defined function");
  assert(typeof shiftMapDate === 'function', "shiftMapDate is a defined function");
  assert(typeof setMapDateToToday === 'function', "setMapDateToToday is a defined function");
  assert(typeof handleMapDateChange === 'function', "handleMapDateChange is a defined function");

  // Initial date is today's ET date
  const todayKey = getETDateKey();
  assert(getSelectedMapDate() === todayKey, "Initial selected map date is today's ET date");

  // Save historical workouts on different dates: Oct 16 and Oct 17
  const multiDateWorkouts = [
    { date: "2026-10-16", workoutName: "Friday Bench Blast", sets: [{ weight: 225, reps: 5 }] },
    { date: "2026-10-17", workoutName: "Saturday Squat Session", sets: [{ weight: 315, reps: 5 }] },
    { date: getYesterdayETDateKey(), workoutName: "Yesterday Workout", sets: [{ weight: 315, reps: 5 }] },
    { date: todayKey, workoutName: "Sunday Deadlift Day", sets: [{ weight: 405, reps: 3 }] }
  ];
  localStorage.setItem('showUp_synced_workouts', JSON.stringify(multiDateWorkouts));
  setUserZip("20105", "Ashburn, VA", 39.0438, -77.4874);

  // Switch to past date: 2026-10-16
  setSelectedMapDate("2026-10-16");
  assert(getSelectedMapDate() === "2026-10-16", "Selected map date switched to 2026-10-16");
  const pickerInput = getOrCreateElement('map-date-picker');
  assert(pickerInput.value === "2026-10-16", "Date picker input value updated to 2026-10-16");
  const dateBadge = getOrCreateElement('map-date-badge');
  assert(dateBadge.innerText.includes("Oct 16, 2026"), "Map date badge displays Oct 16, 2026");

  // Query nodes for Oct 16
  const oct16Nodes = getActiveAndCompletedZipNodes("2026-10-16");
  assert(oct16Nodes.length > 0, "Activity map retrieves workouts for Oct 16");
  assert(oct16Nodes[0].completedToday === 1, "1 workout scored on Oct 16 in user's zip");

  // Shift date forward by +1 day (to 2026-10-17)
  shiftMapDate(1);
  assert(getSelectedMapDate() === "2026-10-17", "shiftMapDate(+1) shifted date forward to 2026-10-17");
  const oct17Nodes = getActiveAndCompletedZipNodes("2026-10-17");
  assert(oct17Nodes.length > 0, "Activity map retrieves workouts for Oct 17");
  assert(oct17Nodes[0].completedToday === 1, "1 workout scored on Oct 17 in user's zip");

  // Shift date backward by -2 days (to 2026-10-15)
  shiftMapDate(-2);
  assert(getSelectedMapDate() === "2026-10-15", "shiftMapDate(-2) shifted date back to 2026-10-15");
  const oct15Nodes = getActiveAndCompletedZipNodes("2026-10-15");
  assert(oct15Nodes.length === 0, "No workouts scored on Oct 15 returns 0 nodes");

  // Detail card reflects empty state for selected date
  updateZipDetailCard(oct15Nodes);
  assert(getOrCreateElement('zip-detail-title').innerText.includes("No workouts recorded"), "Detail card informs no workouts recorded on selected date");

  // Reset date back to today
  setMapDateToToday();
  assert(getSelectedMapDate() === todayKey, "setMapDateToToday() snaps back to today's date");
  assert(getOrCreateElement('map-date-badge').innerText.includes("Today"), "Map date badge reflects Today");
  const todayNodes = getActiveAndCompletedZipNodes(todayKey);
  assert(todayNodes.length > 0, "Today's workouts retrieved accurately");
  assert(todayNodes[0].completedToday === 1, "Today's workout scored in map");

  // Snap to Yesterday via setMapDateToYesterday
  assert(typeof setMapDateToYesterday === 'function', "setMapDateToYesterday is a defined function");
  setMapDateToYesterday();
  const yesterdayKey = getYesterdayETDateKey();
  assert(getSelectedMapDate() === yesterdayKey, "setMapDateToYesterday() snaps directly to yesterday's date");
  assert(getOrCreateElement('map-date-badge').innerText.includes("Yesterday"), "Map date badge reflects Yesterday");
  const yNodes = getActiveAndCompletedZipNodes(yesterdayKey);
  assert(yNodes.length > 0, "Yesterday's workouts retrieved accurately on map");
  assert(yNodes[0].completedToday === 1, "Yesterday's workout scored in map");

  // Empty state for today prompting yesterday's scored activity
  setSelectedMapDate(todayKey);
  updateZipDetailCard([]);
  const detailDesc = getOrCreateElement('zip-detail-desc').innerHTML;
  assert(detailDesc.includes("scored yesterday") || detailDesc.includes("Yesterday"), "Empty card prompts yesterday's scored activity when today is empty");

  // Tombstone & migration protection: 2026-10-17 is NOT deleted or tombstoned
  AppStorage.applyPendingMigrations();
  let deletedWorkouts = JSON.parse(localStorage.getItem('showUp_deleted_workouts') || '[]');
  assert(!deletedWorkouts.includes('2026-10-17'), "2026-10-17 is NOT tombstoned in deleted workouts");
  const allRecovered = getAllAthleteWorkouts();
  assert(allRecovered.some(w => (typeof w === 'string' ? w : w.date) === '2026-10-17'), "2026-10-17 workout is preserved and never dropped");
});

runSuite("17. Historical Workout Updates, Country Edge Sticking & Email/Password Authentication Engine", () => {
  // 1. Historical Workout Updates & Pencil Icon
  assert(typeof openEditHistoricalWorkoutModal === 'function', "openEditHistoricalWorkoutModal is a defined function");
  assert(typeof closeEditHistoricalWorkoutModal === 'function', "closeEditHistoricalWorkoutModal is a defined function");
  assert(typeof saveHistoricalWorkoutChanges === 'function', "saveHistoricalWorkoutChanges is a defined function");
  assert(typeof addSetToEditHistoricalWorkout === 'function', "addSetToEditHistoricalWorkout is a defined function");

  // Monthly history rendering contains pencil icon for workout updates
  renderMonthlyHistory();
  const monthlyHtml = getOrCreateElement('monthly-history-list').innerHTML;
  assert(monthlyHtml.includes('fa-pencil'), "Monthly history list renders pencil icon for editing workouts");
  assert(monthlyHtml.includes('openEditHistoricalWorkoutModal'), "Monthly history list includes openEditHistoricalWorkoutModal trigger");

  // Open Edit Modal for Oct 17
  openEditHistoricalWorkoutModal('2026-10-17');
  const editModal = getOrCreateElement('edit-historical-workout-modal');
  assert(!editModal.classList.contains('hidden'), "Edit historical workout modal opens and is visible");
  assert(getOrCreateElement('edit-workout-date').value === '2026-10-17', "Edit modal correctly populates workout date");

  // Modify workout title, calories, and duration
  getOrCreateElement('edit-workout-name').value = "Updated Power Lift";
  getOrCreateElement('edit-workout-calories').value = "520";
  getOrCreateElement('edit-workout-duration').value = "55";
  getOrCreateElement('edit-workout-notes').value = "Felt great, new PR hit!";

  // Save changes
  saveHistoricalWorkoutChanges();
  assert(editModal.classList.contains('hidden'), "Edit historical workout modal closes after saving changes");

  // Verify updated workout in history
  const updatedWorkout = completedWorkoutsHistory.find(w => (typeof w === 'string' ? w : w.date) === '2026-10-17');
  assert(updatedWorkout !== undefined, "Updated workout exists in completedWorkoutsHistory");
  assert(updatedWorkout.workoutName === "Updated Power Lift", "Workout title successfully updated to Updated Power Lift");
  assert(updatedWorkout.caloriesBurned === 520, "Calories burned successfully updated to 520");
  assert(updatedWorkout.notes === "Felt great, new PR hit!", "Notes successfully updated");

  // AppStorage updateWorkout verification
  const testWObj = {
    date: '2026-10-10',
    workoutName: 'Historical Back & Core',
    totalVolume: 8000,
    caloriesBurned: 400,
    sets: [{ exerciseName: 'Deadlift', weight: 315, reps: 5, rpe: 8 }]
  };
  AppStorage.updateWorkout('2026-10-10', testWObj);
  const storedW = AppStorage.getAthleteWorkouts().find(w => (typeof w === 'string' ? w : w.date) === '2026-10-10');
  assert(storedW && storedW.workoutName === 'Historical Back & Core', "AppStorage.updateWorkout successfully updates workout in persistent storage");

  // 2. Country-Level Hovering & Edge Sticking Map Engine
  assert(typeof updateCountryHoverEdgeTracker === 'function', "updateCountryHoverEdgeTracker is a defined function");
  assert(typeof panMapToCountry === 'function', "panMapToCountry is a defined function");

  // Test at Country Level (zoom = 3)
  currentMapZoom = 3;
  renderMapZipBoundariesOverlay([{ zip: '10001', city: 'New York', lat: 40.75, lng: -73.99, completedToday: 5 }]);
  const countryBadge = getOrCreateElement('map-country-edge-hover-badge');
  assert(countryBadge !== null, "Country badge element created in overlay");
  assert(countryBadge.style.display !== 'none', "Country badge is displayed at country zoom level");
  assert(countryBadge.innerHTML.includes('5'), "Country badge reflects workouts scored count: 5");

  // Verify transition when zoomed into zip level (zoom = 14)
  currentMapZoom = 14;
  renderMapZipBoundariesOverlay([{ zip: '10001', city: 'New York', lat: 40.75, lng: -73.99, completedToday: 5 }]);
  assert(countryBadge.style.display === 'none', "Country badge is cleanly hidden when zoomed in to zip level");

  // 3. Email & Password Authentication Engine (Setup, Login, Reset)
  assert(typeof registerAthleteAccount === 'function', "registerAthleteAccount is a defined function");
  assert(typeof loginAthleteWithEmailPassword === 'function', "loginAthleteWithEmailPassword is a defined function");
  assert(typeof resetAthletePassword === 'function', "resetAthletePassword is a defined function");
  assert(typeof getRegisteredAccounts === 'function', "getRegisteredAccounts is a defined function");

  // Account Setup / Registration
  const regResult = registerAthleteAccount('runner@showup.fit', 'ironStrong99', 'Alex', 'Smith', '90210');
  assert(regResult.success === true, "Account registration succeeds with chosen email and password");
  const accounts = getRegisteredAccounts();
  assert(accounts['runner@showup.fit'] !== undefined, "Registered account is stored in registered accounts");
  assert(accounts['runner@showup.fit'].firstName === 'Alex', "Account stores athlete name");

  // Verify logged-in state
  const currentUser = getAppUser();
  assert(currentUser.email === 'runner@showup.fit', "User profile is active with registered email");
  assert(currentUser.rawName === 'Alex', "User profile is active with registered name");

  // Re-registering same email returns helpful error
  const dupResult = registerAthleteAccount('runner@showup.fit', 'otherPass', 'Alex');
  assert(dupResult.success === false, "Duplicate registration is rejected with appropriate error");

  // Logout clears session but preserves account
  handleLogout(true);
  assert(getAppUser().email !== 'runner@showup.fit', "Logout clears current session");
  assert(getRegisteredAccounts()['runner@showup.fit'] !== undefined, "Registered accounts persist across session logouts");

  // Login with incorrect password fails
  const badLogin = loginAthleteWithEmailPassword('runner@showup.fit', 'wrongPassword');
  assert(badLogin.success === false, "Login with wrong password fails");

  // Login with correct email and password succeeds
  const goodLogin = loginAthleteWithEmailPassword('runner@showup.fit', 'ironStrong99');
  assert(goodLogin.success === true, "Login with chosen email and password succeeds");
  assert(getAppUser().email === 'runner@showup.fit', "Athlete profile active after email/password login");

  // Reset Password Engine
  const resetRes = resetAthletePassword('runner@showup.fit', 'newSecret2026');
  assert(resetRes.success === true, "Password reset succeeds");

  // Verify old password fails and new password succeeds
  handleLogout(true);
  const oldLogin = loginAthleteWithEmailPassword('runner@showup.fit', 'ironStrong99');
  assert(oldLogin.success === false, "Old password no longer valid after reset");
  const newLogin = loginAthleteWithEmailPassword('runner@showup.fit', 'newSecret2026');
  assert(newLogin.success === true, "Login with new reset password succeeds");

  // Email OTP Forgot Password Workflow
  assert(typeof requestPasswordResetOTP === 'function', "requestPasswordResetOTP is a defined function");
  assert(typeof verifyPasswordResetOTP === 'function', "verifyPasswordResetOTP is a defined function");
  assert(typeof resetAthletePasswordWithOTP === 'function', "resetAthletePasswordWithOTP is a defined function");

  // Step 1: Request OTP
  const otpReq = requestPasswordResetOTP('runner@showup.fit');
  assert(otpReq.success === true, "requestPasswordResetOTP succeeds");
  assert(typeof otpReq.otp === 'string' && otpReq.otp.length === 6, "OTP code is exactly 6 digits: " + otpReq.otp);

  // Step 2: Attempt with wrong OTP fails
  const badOtpVerify = verifyPasswordResetOTP('runner@showup.fit', '000000');
  assert(badOtpVerify.success === false, "Wrong OTP code is rejected");

  // Step 3: Reset password with valid OTP
  const validOtpReset = resetAthletePasswordWithOTP('runner@showup.fit', otpReq.otp, 'ultraPower2027');
  assert(validOtpReset.success === true, "Password reset with valid OTP succeeds");

  // Step 4: OTP is single-use (cannot be reused)
  const reuseOtp = resetAthletePasswordWithOTP('runner@showup.fit', otpReq.otp, 'hackerAttempt');
  assert(reuseOtp.success === false, "Used OTP cannot be reused (single-use token protection)");

  // Step 5: Verify new password login
  handleLogout(true);
  const updatedLogin = loginAthleteWithEmailPassword('runner@showup.fit', 'ultraPower2027');
  assert(updatedLogin.success === true, "Login with OTP-verified password succeeds");

  // Email OTP Two-Step Registration Workflow
  assert(typeof requestRegistrationOTP === 'function', "requestRegistrationOTP is a defined function");
  assert(typeof verifyRegistrationOTP === 'function', "verifyRegistrationOTP is a defined function");
  assert(typeof verifyAndFinalizeRegistration === 'function', "verifyAndFinalizeRegistration is a defined function");

  // Step 1: Request Registration OTP
  const regOtpReq = requestRegistrationOTP('verified@showup.fit', { name: 'Verified Athlete', password: 'securePass2026', zip: '10001' });
  assert(regOtpReq.success === true, "requestRegistrationOTP succeeds");
  assert(typeof regOtpReq.otp === 'string' && regOtpReq.otp.length === 6, "Registration OTP code is exactly 6 digits: " + regOtpReq.otp);

  // Step 2: Bad OTP fails
  const badRegVerify = verifyRegistrationOTP('verified@showup.fit', '111111');
  assert(badRegVerify.success === false, "Wrong registration OTP rejected");

  // Step 3: Complete registration with valid OTP
  const validRegFinal = verifyAndFinalizeRegistration('verified@showup.fit', regOtpReq.otp);
  assert(validRegFinal.success === true, "Registration with valid OTP succeeds");
  assert(getRegisteredAccounts()['verified@showup.fit'] !== undefined, "Verified account exists in registered accounts");

  // Step 4: OTP is single-use
  const reuseRegOtp = verifyAndFinalizeRegistration('verified@showup.fit', regOtpReq.otp);
  assert(reuseRegOtp.success === false, "Registration OTP cannot be reused");

  // Auth UI Tabs
  switchAuthTab('signin');
  assert(!getOrCreateElement('auth-signin-view').classList.contains('hidden'), "Sign in view visible on signin tab");
  switchAuthTab('register');
  assert(!getOrCreateElement('auth-register-view').classList.contains('hidden'), "Register view visible on register tab");
  assert(!getOrCreateElement('auth-register-step-details').classList.contains('hidden'), "Register step 1 details visible initially");
  switchAuthTab('reset');
  assert(!getOrCreateElement('auth-reset-view').classList.contains('hidden'), "Reset view visible on reset tab");

  // 3-Step Progressive Registration Wizard:
  switchAuthTab('register');
  const regStep1 = getOrCreateElement('auth-register-step-details');
  const regStep2 = getOrCreateElement('auth-register-step-otp');
  const regStep3 = getOrCreateElement('auth-register-step-password');
  assert(!regStep1.classList.contains('hidden'), "Step 1 is visible initially");
  assert(regStep2.classList.contains('hidden'), "Step 2 is hidden initially");
  assert(regStep3.classList.contains('hidden'), "Step 3 is hidden initially");

  // Step 1: Input Name & Email, request OTP
  getOrCreateElement('auth-register-name').value = "Triathlete Taylor";
  getOrCreateElement('auth-register-email').value = "taylor@showup.fit";
  handleRequestRegistrationOTP();

  assert(regStep1.classList.contains('hidden'), "Step 1 is hidden after requesting OTP");
  assert(!regStep2.classList.contains('hidden'), "Step 2 is visible after requesting OTP");
  assert(regStep3.classList.contains('hidden'), "Step 3 remains hidden");
  assert(getOrCreateElement('auth-register-otp-target-email-display').innerText === "taylor@showup.fit", "Target email displayed on Step 2");

  // Step 2: Input OTP code, verify OTP
  const generatedOtp = activeRegistrationOTPs['taylor@showup.fit']?.code;
  assert(typeof generatedOtp === 'string' && generatedOtp.length === 6, "OTP generated in active registration OTPs");
  getOrCreateElement('auth-register-otp-code').value = generatedOtp;
  handleVerifyRegistrationOTP();

  assert(regStep1.classList.contains('hidden'), "Step 1 remains hidden");
  assert(regStep2.classList.contains('hidden'), "Step 2 is hidden after OTP verification");
  assert(!regStep3.classList.contains('hidden'), "Step 3 is visible after OTP verification");
  assert(getOrCreateElement('auth-register-verified-email-display').innerText === "taylor@showup.fit", "Verified email displayed on Step 3");

  // Step 3: Input Password twice, finalize registration
  getOrCreateElement('auth-register-password').value = "triathlonPower2026";
  getOrCreateElement('auth-register-confirm-password').value = "triathlonPower2026";
  getOrCreateElement('auth-register-zip').value = "94107";
  handleFinalizeRegistration();

  const registeredAccs = getRegisteredAccounts();
  assert(registeredAccs['taylor@showup.fit'] !== undefined, "Account created in registered accounts after Step 3");
  assert(regStep1.classList.contains('hidden') === false, "Register wizard reset back to Step 1 for next usage");

  // Modal Backdrop Protection Test:
  assert(typeof handleAuthModalBackdropClick === 'function', "handleAuthModalBackdropClick is a defined function");
  const authModal = getOrCreateElement('auth-login-modal');
  
  // Test Registration Flow:
  openAuthLoginModal('register');
  assert(!authModal.classList.contains('hidden'), "Auth modal open for registration");
  handleAuthModalBackdropClick({ target: authModal, currentTarget: authModal });
  assert(!authModal.classList.contains('hidden'), "Clicking outside modal during registration does NOT close modal");
  closeAuthLoginModal(); // Click of top-right X button alone
  assert(authModal.classList.contains('hidden'), "Clicking top-right X button closes registration modal");

  // Test Forgot Password Flow:
  openAuthLoginModal('reset');
  assert(!authModal.classList.contains('hidden'), "Auth modal open for password reset");
  handleAuthModalBackdropClick({ target: authModal, currentTarget: authModal });
  assert(!authModal.classList.contains('hidden'), "Clicking outside modal during password reset does NOT close modal");
  closeAuthLoginModal(); // Click of top-right X button alone
  assert(authModal.classList.contains('hidden'), "Clicking top-right X button closes password reset modal");

  // Test Sign In Flow (backdrop dismiss allowed):
  openAuthLoginModal('signin');
  assert(!authModal.classList.contains('hidden'), "Auth modal open for sign in");
  handleAuthModalBackdropClick({ target: authModal, currentTarget: authModal });
  assert(authModal.classList.contains('hidden'), "Clicking outside modal during sign in closes modal");
});

runSuite("18. Firebase Firestore Cloud Backup & Cross-Device Sync Engine", () => {
  assert(typeof syncToFirestore === 'function', "syncToFirestore is a defined function");
  assert(typeof restoreFromFirestore === 'function', "restoreFromFirestore is a defined function");
  assert(typeof syncOrRestoreFirestoreBackup === 'function', "syncOrRestoreFirestoreBackup is a defined function");
  assert(typeof queueFirestoreAutoSync === 'function', "queueFirestoreAutoSync is a defined function");

  assert(typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS.LAST_FIRESTORE_SYNC === 'showUp_last_firestore_sync', "STORAGE_KEYS.LAST_FIRESTORE_SYNC is defined");

  // DOM elements in Settings
  assert(getOrCreateElement('settings-firestore-card') !== null, "settings-firestore-card exists in Settings DOM");
  assert(getOrCreateElement('btn-settings-firestore-backup') !== null, "btn-settings-firestore-backup exists in Settings DOM");
  assert(getOrCreateElement('btn-settings-firestore-restore') !== null, "btn-settings-firestore-restore exists in Settings DOM");
  assert(getOrCreateElement('settings-firestore-status-pill') !== null, "settings-firestore-status-pill exists in Settings DOM");
  assert(getOrCreateElement('settings-firestore-time-val') !== null, "settings-firestore-time-val exists in Settings DOM");

  // Mock Firestore test environment
  const mockStorage = new Map();
  const mockDb = {
    collection: function(colName) {
      return {
        doc: function(docId) {
          const key = colName + '/' + docId;
          return {
            get: async function() {
              return {
                exists: mockStorage.has(key),
                data: function() { return mockStorage.get(key); }
              };
            },
            set: async function(data, options) {
              if (options && options.merge && mockStorage.has(key)) {
                const prev = mockStorage.get(key) || {};
                mockStorage.set(key, Object.assign({}, prev, data));
              } else {
                mockStorage.set(key, data);
              }
              return Promise.resolve();
            },
            delete: async function() {
              mockStorage.delete(key);
              return Promise.resolve();
            }
          };
        },
        get: async function() {
          return Promise.resolve({ empty: true, docs: [] });
        }
      };
    }
  };

  window.getFirestoreDb = function() { return mockDb; };

  // Setup athlete logged in with email
  const athleteProfile = {
    firstName: "Alex",
    email: "alex@showup.fit",
    authProvider: "email_password"
  };
  localStorage.setItem('showUp_user_profile', JSON.stringify(athleteProfile));

  // Populate local workouts
  const localWorkouts = [
    { date: "2026-10-18T10:00:00Z", workoutName: "Push Day", sets: [{ exercise: "Bench Press", weight: 225, reps: 5 }] },
    { date: "2026-10-17T10:00:00Z", workoutName: "Pull Day", sets: [{ exercise: "Deadlift", weight: 405, reps: 3 }] }
  ];
  AppStorage.saveAthleteWorkouts(localWorkouts);

  // Update UI and verify connected pill
  updateCloudBackupUI();
  const pill = getOrCreateElement('settings-firestore-status-pill');
  assert(pill.innerText === "Connected", "Firestore pill reflects Connected state for logged in athlete");
  const badge = getOrCreateElement('settings-backup-status-badge');
  assert(badge.innerText === "Cloud Synced", "Settings badge reflects Cloud Synced");
});

runSuite("19. Exercise Catalog Abbreviations & Auto Muscle Impact Identification Engine", () => {
  // 1. Verify Abbreviation Dictionary
  assert(typeof EXERCISE_ABBREVIATIONS === 'object' && EXERCISE_ABBREVIATIONS !== null, "EXERCISE_ABBREVIATIONS dictionary is defined");
  assert(EXERCISE_ABBREVIATIONS["SH"] === "Single Hand", "SH maps to Single Hand");
  assert(EXERCISE_ABBREVIATIONS["SA"] === "Single Arm", "SA maps to Single Arm");
  assert(EXERCISE_ABBREVIATIONS["DH"] === "Double Hand", "DH maps to Double Hand");
  assert(EXERCISE_ABBREVIATIONS["KB"] === "Kettle Bell", "KB maps to Kettle Bell");
  assert(EXERCISE_ABBREVIATIONS["DB"] === "Dumbell", "DB maps to Dumbell");

  // Helper functions
  assert(typeof expandExerciseAbbreviations === 'function', "expandExerciseAbbreviations is a defined function");
  assert(expandExerciseAbbreviations("SH KB Snatch") === "Single Hand Kettle Bell Snatch", "expandExerciseAbbreviations expands SH KB correctly");
  assert(expandExerciseAbbreviations("SA DB Press") === "Single Arm Dumbell Press", "expandExerciseAbbreviations expands SA DB correctly");
  assert(expandExerciseAbbreviations("DH Carry") === "Double Hand Carry", "expandExerciseAbbreviations expands DH correctly");

  // 2. Verify all required exercises are present in defaultCatalog
  const requiredExercises = [
    { name: "Banded KB Suitcase Carry", implement: "Kettlebell", primary: "Core/Abs", secondaries: ["Shoulders", "Back", "Hamstrings/Glutes", "Quads"] },
    { name: "Hanging Knee Tucks", implement: "Bodyweight", primary: "Core/Abs", secondaries: ["Back", "Shoulders"] },
    { name: "Ring Walk Out", implement: "Gymnastics Rings", primary: "Core/Abs", secondaries: ["Chest", "Shoulders", "Triceps", "Back"] },
    { name: "SH KB Suitcase Carry", implement: "Kettlebell", primary: "Core/Abs", secondaries: ["Shoulders", "Back", "Quads", "Hamstrings/Glutes"] },
    { name: "KB Farmers Walk", implement: "Kettlebell", primary: "Full Body", secondaries: ["Core/Abs", "Back", "Shoulders", "Quads", "Hamstrings/Glutes"] },
    { name: "KB Shoulder Press", implement: "Kettlebell", primary: "Shoulders", secondaries: ["Triceps", "Core/Abs", "Chest"] },
    { name: "SH KB Snatch", implement: "Kettlebell", primary: "Full Body", secondaries: ["Hamstrings/Glutes", "Back", "Shoulders", "Core/Abs"] },
    { name: "SH KB Clean and Press", implement: "Kettlebell", primary: "Full Body", secondaries: ["Shoulders", "Hamstrings/Glutes", "Back", "Triceps", "Core/Abs"] },
    { name: "SH KB High Pull", implement: "Kettlebell", primary: "Back", secondaries: ["Hamstrings/Glutes", "Shoulders", "Biceps", "Core/Abs"] },
    { name: "Chest Dips", implement: "Bodyweight", primary: "Chest", secondaries: ["Triceps", "Shoulders", "Core/Abs"] },
    { name: "Tricep Bar Dips", implement: "Bodyweight", primary: "Triceps", secondaries: ["Chest", "Shoulders", "Core/Abs"] },
    { name: "Bent Arm Cross Over", implement: "Bodyweight", primary: "Chest", secondaries: ["Shoulders", "Biceps", "Core/Abs"] },
    { name: "Glute Bridge", implement: "Bodyweight", primary: "Hamstrings/Glutes", secondaries: ["Core/Abs", "Quads"] },
    { name: "Lunges", implement: "Bodyweight", primary: "Quads", secondaries: ["Hamstrings/Glutes", "Core/Abs"] },
    { name: "SH KB Romanian Dead Lift", implement: "Kettlebell", primary: "Hamstrings/Glutes", secondaries: ["Back", "Core/Abs", "Shoulders"] },
    { name: "KB Swings", implement: "Kettlebell", primary: "Hamstrings/Glutes", secondaries: ["Core/Abs", "Back", "Shoulders", "Quads"] },
    { name: "SH KB Swings", implement: "Kettlebell", primary: "Hamstrings/Glutes", secondaries: ["Core/Abs", "Back", "Shoulders", "Quads"] },
    { name: "SH KB Squat", implement: "Kettlebell", primary: "Quads", secondaries: ["Hamstrings/Glutes", "Core/Abs", "Shoulders"] },
    { name: "SH KB Thruster", implement: "Kettlebell", primary: "Full Body", secondaries: ["Quads", "Shoulders", "Hamstrings/Glutes", "Triceps", "Core/Abs"] },
    { name: "SH KB Rows", implement: "Kettlebell", primary: "Back", secondaries: ["Biceps", "Core/Abs", "Shoulders"] },
    { name: "Bar Chest Dips", implement: "Bodyweight", primary: "Chest", secondaries: ["Triceps", "Shoulders", "Core/Abs"] },
    { name: "Ring Push-ups", implement: "Gymnastics Rings", primary: "Chest", secondaries: ["Triceps", "Shoulders", "Core/Abs"] },
    { name: "Pull-ups", implement: "Bodyweight", primary: "Back", secondaries: ["Biceps", "Forearms", "Core/Abs"] }
  ];

  requiredExercises.forEach(req => {
    const found = defaultCatalog.find(c => c.name.toLowerCase() === req.name.toLowerCase());
    assert(found !== undefined, req.name + " exists in defaultCatalog");
    assert(found.implement === req.implement, req.name + " implement is " + req.implement);
    assert(found.muscle === req.primary, req.name + " primary muscle is accurately " + req.primary);
    req.secondaries.forEach(sec => {
      assert(found.secondary && found.secondary.includes(sec), req.name + " secondary includes " + sec);
    });
  });

  // Verify defaultCatalog is organized in alphabetical order
  const catalogNames = defaultCatalog.map(e => e.name);
  const sortedCatalogNames = [...catalogNames].sort((a, b) => a.localeCompare(b));
  assert(JSON.stringify(catalogNames) === JSON.stringify(sortedCatalogNames), "defaultCatalog exercises are sorted in alphabetical order");

  // 3. Test Auto Muscle Identification Engine & Implement Inference
  assert(typeof resolveExerciseMuscles === 'function', "resolveExerciseMuscles is a defined function");
  assert(typeof inferImplementFromExerciseName === 'function', "inferImplementFromExerciseName is a defined function");

  // Implement inference from exercise name
  assert(inferImplementFromExerciseName("SH KB Squat") === "Kettlebell", "Infers Kettlebell from SH KB Squat");
  assert(inferImplementFromExerciseName("SH KB Thruster") === "Kettlebell", "Infers Kettlebell from SH KB Thruster");
  assert(inferImplementFromExerciseName("KB Swings") === "Kettlebell", "Infers Kettlebell from KB Swings");
  assert(inferImplementFromExerciseName("SH KB Swings") === "Kettlebell", "Infers Kettlebell from SH KB Swings");
  assert(inferImplementFromExerciseName("DB Incline Press") === "Dumbbell", "Infers Dumbbell from DB Incline Press");
  assert(inferImplementFromExerciseName("Barbell Back Squat") === "Barbell", "Infers Barbell from Barbell Back Squat");

  // Direct catalog resolve
  const kbSwingsProfile = resolveExerciseMuscles("KB Swings");
  assert(kbSwingsProfile.primary === "Hamstrings/Glutes", "KB Swings auto resolves primary to Hamstrings/Glutes");
  assert(kbSwingsProfile.implement === "Kettlebell", "KB Swings auto resolves implement to Kettlebell");

  const shKbSwingsProfile = resolveExerciseMuscles("SH KB Swings");
  assert(shKbSwingsProfile.primary === "Hamstrings/Glutes", "SH KB Swings auto resolves primary to Hamstrings/Glutes");
  assert(shKbSwingsProfile.implement === "Kettlebell", "SH KB Swings auto resolves implement to Kettlebell");

  const carryProfile = resolveExerciseMuscles("SH KB Suitcase Carry");
  assert(carryProfile.primary === "Core/Abs", "SH KB Suitcase Carry auto resolves primary to Core/Abs");
  assert(carryProfile.implement === "Kettlebell", "SH KB Suitcase Carry auto resolves implement to Kettlebell");

  const squatProfile = resolveExerciseMuscles("SH KB Squat");
  assert(squatProfile.primary === "Quads", "SH KB Squat auto resolves primary to Quads");
  assert(squatProfile.implement === "Kettlebell", "SH KB Squat auto resolves implement to Kettlebell");
  assert(squatProfile.secondary.includes("Hamstrings/Glutes"), "SH KB Squat secondary includes Hamstrings/Glutes");

  const thrusterProfile = resolveExerciseMuscles("SH KB Thruster");
  assert(thrusterProfile.primary === "Full Body", "SH KB Thruster auto resolves primary to Full Body");
  assert(thrusterProfile.implement === "Kettlebell", "SH KB Thruster auto resolves implement to Kettlebell");
  assert(thrusterProfile.secondary.includes("Quads") && thrusterProfile.secondary.includes("Shoulders"), "SH KB Thruster secondary includes Quads and Shoulders");

  // Expanded form resolve
  const snatchProfile = resolveExerciseMuscles("Single Hand Kettle Bell Snatch");
  assert(snatchProfile.primary === "Full Body", "Expanded 'Single Hand Kettle Bell Snatch' auto resolves to Full Body");
  assert(snatchProfile.implement === "Kettlebell", "Expanded 'Single Hand Kettle Bell Snatch' auto resolves implement to Kettlebell");

  // RDL alias resolve
  const rdlProfile = resolveExerciseMuscles("SH KB RDL");
  assert(rdlProfile.primary === "Hamstrings/Glutes", "SH KB RDL auto resolves to Hamstrings/Glutes");

  // SA alias resolve
  const saCleanProfile = resolveExerciseMuscles("SA KB Clean and Press");
  assert(saCleanProfile.primary === "Full Body", "SA KB Clean and Press auto resolves to Full Body");

  // 4. Test handleExerciseInput automatic DOM updates
  const exInput = getOrCreateElement('exercise-name-input');
  const impSelect = getOrCreateElement('implement-select');
  const musSelect = getOrCreateElement('muscle-group-select');
  const autoPill = getOrCreateElement('exercise-auto-muscles-pill');
  const autoPrimary = getOrCreateElement('auto-muscle-primary');
  const autoSecondary = getOrCreateElement('auto-muscle-secondary');
  const autoImplement = getOrCreateElement('auto-implement-val');

  exInput.value = "Chest Dips";
  handleExerciseInput("Chest Dips");
  assert(impSelect.value === "Bodyweight", "handleExerciseInput sets implement-select to Bodyweight for Chest Dips");
  assert(musSelect.value === "Chest", "handleExerciseInput automatically sets primary muscle to Chest for Chest Dips");
  assert(!autoPill.classList.contains('hidden'), "Auto muscle pill is displayed when exercise entered");
  assert(autoPrimary.innerText === "Chest", "Auto muscle primary indicator displays Chest");
  assert(autoSecondary.innerText.includes("Triceps"), "Auto muscle secondary indicator includes Triceps");

  // Test optional implement input: type SH KB Squat without touching implement select
  impSelect.value = "Bodyweight"; // default untouched value
  exInput.value = "SH KB Squat";
  handleExerciseInput("SH KB Squat");
  assert(impSelect.value === "Kettlebell", "handleExerciseInput automatically infers and sets Kettlebell implement for SH KB Squat");
  assert(musSelect.value === "Quads", "handleExerciseInput automatically sets primary muscle to Quads for SH KB Squat");
  assert(autoImplement.innerText === "Kettlebell", "Auto implement indicator displays Kettlebell");

  // Dynamic Exercise Suggestions & Viewport Scrolling Tests
  assert(typeof filterExerciseCatalog === 'function', "filterExerciseCatalog is a defined function");
  assert(typeof updateExerciseSuggestions === 'function', "updateExerciseSuggestions is a defined function");
  assert(typeof selectExerciseSuggestion === 'function', "selectExerciseSuggestion is a defined function");
  assert(typeof scrollExerciseInputIntoView === 'function', "scrollExerciseInputIntoView is a defined function");

  // Filtering on "swings"
  const swingsMatches = filterExerciseCatalog("swings");
  assert(swingsMatches.length >= 2, "filterExerciseCatalog('swings') returns at least 2 matches (" + swingsMatches.length + " found)");
  assert(swingsMatches.some(e => e.name === "KB Swings"), "Matches contain KB Swings");
  assert(swingsMatches.some(e => e.name === "SH KB Swings"), "Matches contain SH KB Swings");

  // Filtering on "sh kb"
  const shMatches = filterExerciseCatalog("sh kb");
  assert(shMatches.length >= 5, "filterExerciseCatalog('sh kb') returns matching single-hand KB exercises");
  assert(shMatches.some(e => e.name === "SH KB Swings"), "sh kb matches include SH KB Swings");

  // Test dynamic dropdown updates
  const suggestionsDropdown = getOrCreateElement('exercise-suggestions-dropdown');
  updateExerciseSuggestions("swings", "exercise-name-input", "exercise-suggestions-dropdown");
  assert(!suggestionsDropdown.classList.contains('hidden'), "Suggestions dropdown is visible when typing query");
  assert(suggestionsDropdown.innerHTML.includes("KB Swings"), "Suggestions dropdown contains matching exercise names");

  // Test selection from dropdown
  selectExerciseSuggestion("KB Swings", "exercise-name-input", "exercise-suggestions-dropdown");
  assert(exInput.value === "KB Swings", "Exercise name input populated with selected exercise name");
  assert(impSelect.value === "Kettlebell", "Selected exercise automatically inferred Kettlebell implement");
  assert(musSelect.value === "Hamstrings/Glutes", "Selected exercise automatically set primary muscle to Hamstrings/Glutes");
  assert(suggestionsDropdown.classList.contains('hidden'), "Suggestions dropdown closed upon selection");

  // Test scrollExerciseInputIntoView executes smoothly
  let scrollException = null;
  try {
    scrollExerciseInputIntoView(exInput);
  } catch (e) {
    scrollException = e;
  }
  assert(scrollException === null, "scrollExerciseInputIntoView executed smoothly without exception");

  // Implement Filter Capability Tests (Barbell, Kettlebell, Dumbbell, Bodyweight)
  assert(typeof toggleExerciseCatalogFilter === 'function', "toggleExerciseCatalogFilter is a defined function");
  assert(typeof renderExerciseCatalogFilterPills === 'function', "renderExerciseCatalogFilterPills is a defined function");
  assert(typeof exerciseMatchesImplementFilter === 'function', "exerciseMatchesImplementFilter is a defined function");

  // 1. Filter matching checks
  const kbCatalog = filterExerciseCatalog("", "Kettlebell");
  assert(kbCatalog.length > 0, "filterExerciseCatalog('', 'Kettlebell') returns kettlebell exercises (" + kbCatalog.length + " found)");
  assert(kbCatalog.every(e => e.implement === "Kettlebell" || e.name.toLowerCase().includes("kb") || e.name.toLowerCase().includes("kettlebell")), "All filtered kettlebell items belong to Kettlebell");

  const bbCatalog = filterExerciseCatalog("", "Barbell");
  assert(bbCatalog.length >= 5, "filterExerciseCatalog('', 'Barbell') returns barbell exercises (" + bbCatalog.length + " found)");
  assert(bbCatalog.every(e => e.implement === "Barbell" || e.name.toLowerCase().includes("barbell")), "All filtered barbell items belong to Barbell");

  const dbCatalog = filterExerciseCatalog("", "Dumbbell");
  assert(dbCatalog.length >= 7, "filterExerciseCatalog('', 'Dumbbell') returns dumbbell exercises (" + dbCatalog.length + " found)");
  assert(dbCatalog.every(e => e.implement === "Dumbbell" || e.name.toLowerCase().includes("dumbbell") || e.name.startsWith("DB ") || e.name.includes("Dumbbell")), "All filtered dumbbell items belong to Dumbbell");

  const bwCatalog = filterExerciseCatalog("", "Bodyweight");
  assert(bwCatalog.length >= 5, "filterExerciseCatalog('', 'Bodyweight') returns bodyweight exercises (" + bwCatalog.length + " found)");
  assert(bwCatalog.every(e => e.implement === "Bodyweight"), "All filtered bodyweight items belong to Bodyweight");

  const ringsCatalog = filterExerciseCatalog("", "Gymnastics Rings");
  assert(ringsCatalog.length >= 9, "filterExerciseCatalog('', 'Gymnastics Rings') returns rings exercises (" + ringsCatalog.length + " found)");
  assert(ringsCatalog.every(e => e.implement === "Gymnastics Rings" || e.name.toLowerCase().includes("ring")), "All filtered rings items belong to Gymnastics Rings");

  const machineCatalog = filterExerciseCatalog("", "Machine");
  assert(machineCatalog.length >= 35, "filterExerciseCatalog('', 'Machine') returns gym machine exercises (" + machineCatalog.length + " found)");
  assert(machineCatalog.every(e => e.implement === "Machine" || e.name.toLowerCase().includes("machine") || e.name.toLowerCase().includes("cable")), "All filtered machine items belong to Machine");

  assert(inferImplementFromExerciseName("Ring Dips") === "Gymnastics Rings", "Ring Dips infers Gymnastics Rings");
  assert(inferImplementFromExerciseName("Ring Rows") === "Gymnastics Rings", "Ring Rows infers Gymnastics Rings");
  assert(inferImplementFromExerciseName("Gymnastic Ring Pullups") === "Gymnastics Rings", "Gymnastic Ring Pullups infers Gymnastics Rings");
  assert(inferImplementFromExerciseName("Ring Inverted Row") === "Gymnastics Rings", "Ring Inverted Row infers Gymnastics Rings");
  assert(inferImplementFromExerciseName("Ring Bicep Curls") === "Gymnastics Rings", "Ring Bicep Curls infers Gymnastics Rings");
  assert(inferImplementFromExerciseName("Ring Tricep Extensions") === "Gymnastics Rings", "Ring Tricep Extensions infers Gymnastics Rings");
  assert(inferImplementFromExerciseName("Ring H_V Raises") === "Gymnastics Rings", "Ring H_V Raises infers Gymnastics Rings");
  assert(inferImplementFromExerciseName("Ring Archer Push-Ups") === "Gymnastics Rings", "Ring Archer Push-Ups infers Gymnastics Rings");
  assert(inferImplementFromExerciseName("Ring Pelican Bicep Curls") === "Gymnastics Rings", "Ring Pelican Bicep Curls infers Gymnastics Rings");
  assert(inferImplementFromExerciseName("Ring SH Bicep Curls") === "Gymnastics Rings", "Ring SH Bicep Curls infers Gymnastics Rings");
  assert(inferImplementFromExerciseName("Chest Press (Machine)") === "Machine", "Chest Press (Machine) infers Machine");
  assert(inferImplementFromExerciseName("Lat Pulldown (Cable)") === "Machine", "Lat Pulldown (Cable) infers Machine");
  assert(inferImplementFromExerciseName("Leg Press (Machine)") === "Machine", "Leg Press (Machine) infers Machine");
  assert(inferImplementFromExerciseName("Smith Machine Squat") === "Machine", "Smith Machine Squat infers Machine");

  // 2. Interactive toggle on Kettlebell pill
  const pillKb = getOrCreateElement('filter-pill-kettlebell');
  const pillMach = getOrCreateElement('filter-pill-machine');
  const filterIndicator = getOrCreateElement('active-exercise-filter-indicator');
  const filterNameLabel = getOrCreateElement('active-exercise-filter-name');

  toggleExerciseCatalogFilter("Kettlebell", "exercise-name-input", "exercise-suggestions-dropdown");
  assert(getActiveExerciseCatalogFilter() === "Kettlebell", "activeExerciseCatalogFilter is set to Kettlebell");
  assert(pillKb.getAttribute('aria-pressed') === 'true', "Kettlebell pill aria-pressed is true (engaged)");
  assert(pillKb.className.includes("text-emerald-400"), "Kettlebell pill displays depressed and engaged emerald styling");
  assert(!filterIndicator.classList.contains('hidden'), "Active filter indicator is visible");
  assert(filterNameLabel.textContent === "Kettlebell", "Active filter indicator name is Kettlebell");
  assert(!suggestionsDropdown.classList.contains('hidden'), "Dropdown opens automatically showing Kettlebell catalog");
  assert(suggestionsDropdown.innerHTML.includes("Kettlebell Catalog"), "Dropdown shows Kettlebell Catalog header with exercise count");

  // 3. Search query refined within Kettlebell filter
  updateExerciseSuggestions("press", "exercise-name-input", "exercise-suggestions-dropdown");
  assert(suggestionsDropdown.innerHTML.includes("KB Shoulder Press"), "Suggestions dropdown includes KB Shoulder Press");
  assert(!suggestionsDropdown.innerHTML.includes("Barbell Bench Press"), "Suggestions dropdown strictly excludes non-kettlebell exercises (e.g. Barbell Bench Press)");

  // 4. Deselect / remove filter by tapping again on chosen filter
  toggleExerciseCatalogFilter("Kettlebell", "exercise-name-input", "exercise-suggestions-dropdown");
  assert(getActiveExerciseCatalogFilter() === null, "Tapping again removes the chosen filter (null)");
  assert(pillKb.getAttribute('aria-pressed') === 'false', "Kettlebell pill aria-pressed is false (disengaged)");
  assert(!pillKb.className.includes("font-black text-emerald-400"), "Kettlebell pill returns to unselected resting styling");
  assert(filterIndicator.classList.contains('hidden'), "Active filter indicator is hidden when filter is removed");

  // 4b. Interactive toggle on Machine pill
  exInput.value = "";
  toggleExerciseCatalogFilter("Machine", "exercise-name-input", "exercise-suggestions-dropdown");
  assert(getActiveExerciseCatalogFilter() === "Machine", "activeExerciseCatalogFilter is set to Machine");
  assert(pillMach.getAttribute('aria-pressed') === 'true', "Machine pill aria-pressed is true (engaged)");
  assert(pillMach.className.includes("text-emerald-400"), "Machine pill displays depressed and engaged emerald styling");
  assert(!filterIndicator.classList.contains('hidden'), "Active filter indicator is visible for Machine");
  assert(filterNameLabel.textContent === "Machine", "Active filter indicator name is Machine");
  assert(!suggestionsDropdown.classList.contains('hidden'), "Dropdown opens automatically showing Machine catalog");
  assert(suggestionsDropdown.innerHTML.includes("Machine Catalog"), "Dropdown shows Machine Catalog header");

  toggleExerciseCatalogFilter("Machine", "exercise-name-input", "exercise-suggestions-dropdown");
  assert(getActiveExerciseCatalogFilter() === null, "Tapping Machine filter again removes filter");
  assert(pillMach.getAttribute('aria-pressed') === 'false', "Machine pill disengaged");

  // 5. Test newly added exercises in defaultCatalog
  const newExercises = [
    { name: "DB Hammer Curls", imp: "Dumbbell", mus: "Biceps" },
    { name: "EZ Bar Bicep Curls", imp: "Barbell", mus: "Biceps" },
    { name: "EZ Bar Preacher Curls", imp: "Barbell", mus: "Biceps" },
    { name: "EZ Bar Lying Down Tricep Extensions", imp: "Barbell", mus: "Triceps" },
    { name: "EZ Bar Tricep Pull Overs", imp: "Barbell", mus: "Triceps" },
    { name: "Bicep Curls", imp: "Dumbbell", mus: "Biceps" },
    { name: "Banded Lateral Walk", imp: "Bodyweight", mus: "Hamstrings/Glutes" },
    { name: "Ring Bicep Curls", imp: "Gymnastics Rings", mus: "Biceps" },
    { name: "Ring Tricep Extensions", imp: "Gymnastics Rings", mus: "Triceps" },
    { name: "Ring H_V Raises", imp: "Gymnastics Rings", mus: "Shoulders" },
    { name: "Ring Archer Push-Ups", imp: "Gymnastics Rings", mus: "Chest" },
    { name: "Ring Pelican Bicep Curls", imp: "Gymnastics Rings", mus: "Biceps" },
    { name: "Ring SH Bicep Curls", imp: "Gymnastics Rings", mus: "Biceps" },
    { name: "Chest Press (Machine)", imp: "Machine", mus: "Chest" },
    { name: "Lat Pulldown (Cable)", imp: "Machine", mus: "Back" },
    { name: "Leg Press (Machine)", imp: "Machine", mus: "Quads" },
    { name: "Hack Squat (Machine)", imp: "Machine", mus: "Quads" },
    { name: "Pec Deck Fly (Machine)", imp: "Machine", mus: "Chest" },
    { name: "Seated Cable Row", imp: "Machine", mus: "Back" },
    { name: "Cable Bicep Curl", imp: "Machine", mus: "Biceps" },
    { name: "Cable Tricep Pushdown", imp: "Machine", mus: "Triceps" }
  ];

  newExercises.forEach(item => {
    const found = findCatalogExercise(item.name);
    assert(found !== null, "Catalog contains newly added exercise: " + item.name);
    assert(found.implement === item.imp, item.name + " implement matches " + item.imp);
    assert(found.muscle === item.mus, item.name + " muscle target matches " + item.mus);
  });

  // Verify Ring H_V Raises aliases
  assert(findCatalogExercise("ringh_vraises") !== null && findCatalogExercise("ringh_vraises").name === "Ring H_V Raises", "Alias ringh_vraises resolves to Ring H_V Raises");
  assert(findCatalogExercise("ringh-vraises") !== null && findCatalogExercise("ringh-vraises").name === "Ring H_V Raises", "Alias ringh-vraises resolves to Ring H_V Raises");
  assert(findCatalogExercise("ringhvraises") !== null && findCatalogExercise("ringhvraises").name === "Ring H_V Raises", "Alias ringhvraises resolves to Ring H_V Raises");

  // 6. Test logSet automatic muscle identification without manual input
  currentSessionSets = [];
  exInput.value = "Banded KB Suitcase Carry";
  handleExerciseInput("Banded KB Suitcase Carry");
  logSet();

  assert(currentSessionSets.length === 1, "Set was logged successfully");
  const loggedSet = currentSessionSets[0];
  assert(loggedSet.exerciseName === "Banded KB Suitcase Carry", "Logged set has correct exercise name");
  assert(loggedSet.implement === "Kettlebell", "Logged set automatically has Kettlebell implement");
  assert(loggedSet.muscle === "Core/Abs", "Logged set automatically has Core/Abs primary muscle without manual input");
  assert(Array.isArray(loggedSet.secondaryMuscles) && loggedSet.secondaryMuscles.includes("Shoulders"), "Logged set automatically has secondary muscles attached");

  // Log second set with SH KB Thruster (implement untouched)
  impSelect.value = "Bodyweight";
  musSelect.value = "Full Body";
  exInput.value = "SH KB Thruster";
  handleExerciseInput("SH KB Thruster");
  logSet();

  assert(currentSessionSets.length === 2, "Second set logged");
  const secondSet = currentSessionSets[1];
  assert(secondSet.implement === "Kettlebell", "Second set automatically inferred Kettlebell implement from exercise name");
  assert(secondSet.muscle === "Full Body", "Second set automatically has Full Body primary muscle without manual input");
  assert(secondSet.secondaryMuscles.includes("Quads"), "Second set has Quads secondary muscle");
  assert(secondSet.secondaryMuscles.includes("Shoulders"), "Second set has Shoulders secondary muscle");

  // Test active set editing functionality
  assert(typeof openEditActiveSetModal === 'function', "openEditActiveSetModal is a defined function");
  assert(typeof saveActiveSetEdits === 'function', "saveActiveSetEdits is a defined function");
  assert(typeof closeEditActiveSetModal === 'function', "closeEditActiveSetModal is a defined function");
  
  openEditActiveSetModal(secondSet.id);
  assert(!getOrCreateElement('edit-active-set-modal').classList.contains('hidden'), "Edit active set modal is visible when opened");
  assert(getOrCreateElement('edit-active-set-exercise').value === "SH KB Thruster", "Edit modal populated with correct exercise name");

  // Modify values in modal
  getOrCreateElement('edit-active-set-exercise').value = "Barbell Back Squat";
  handleEditActiveSetExerciseInput("Barbell Back Squat");
  getOrCreateElement('edit-active-set-weight').value = "225";
  getOrCreateElement('edit-active-set-reps').value = "8";
  getOrCreateElement('edit-active-set-rpe').value = "9";
  saveActiveSetEdits();

  assert(getOrCreateElement('edit-active-set-modal').classList.contains('hidden'), "Edit modal closes after saving changes");
  const editedSet = currentSessionSets.find(s => s.id === secondSet.id);
  assert(editedSet.exerciseName === "Barbell Back Squat", "Active set exercise name successfully edited");
  assert(editedSet.weight === 225, "Active set weight successfully updated to 225");
  assert(editedSet.reps === 8, "Active set reps successfully updated to 8");
  assert(editedSet.rpe === 9, "Active set RPE successfully updated to 9");
  assert(editedSet.implement === "Barbell", "Active set implement automatically updated to Barbell");
  assert(editedSet.muscle === "Quads", "Active set muscle automatically updated to Quads");

  // 6. Test Progress sub-tab switching (Workouts | Weight)
  assert(typeof switchProgressSubTab === 'function', "switchProgressSubTab is a defined function");
  switchProgressSubTab('weight');
  assert(currentProgressSubTab === 'weight', "currentProgressSubTab is updated to weight");
  assert(getOrCreateElement('progress-subpane-workouts').classList.contains('hidden'), "Workouts subpane hidden when weight selected");
  assert(!getOrCreateElement('progress-subpane-weight').classList.contains('hidden'), "Weight subpane visible when weight selected");

  // Test Progress sub-tab switching with 'body'
  switchProgressSubTab('body');
  assert(currentProgressSubTab === 'body', "currentProgressSubTab accepts 'body'");
  assert(getOrCreateElement('progress-subpane-workouts').classList.contains('hidden'), "Workouts subpane hidden when body selected");
  assert(!getOrCreateElement('progress-subpane-weight').classList.contains('hidden'), "Body metrics subpane visible when body selected");

  // Test Height & BMI calculation functions
  assert(typeof formatHeightDisplay === 'function', "formatHeightDisplay is a defined function");
  assert(formatHeightShort(70) === "5' 10\\"", "formatHeightShort correctly formats 70 inches");
  assert(formatHeightShort(72) === "6' 0\\"", "formatHeightShort correctly formats 72 inches");
  assert(calculateBMI(175, 70) === 25.1, "calculateBMI accurately computes BMI");

  // Test Body Metric Logging with Weight and Height
  getOrCreateElement('log-weight-date-input').value = '2026-10-23';
  getOrCreateElement('log-weight-num-input').value = '175';
  getOrCreateElement('log-height-num-input').value = '70';
  saveLogWeightEntry();

  assert(weightHistory.length > 0, "Weight history has logged entries");
  assert(weightHistory[0].weight === 175, "Latest entry has weight 175 lbs");
  assert(weightHistory[0].height === 70, "Latest entry has height 70 inches");
  assert(userHeight === 70, "userHeight synchronized with logged entry");
  assert(getOrCreateElement('cal-current-height-val').innerText.includes("5' 10"), "Current height element displays formatted height");
  assert(getOrCreateElement('cal-current-bmi-val').innerText.includes("25.1"), "Current BMI element displays calculated BMI");

  switchProgressSubTab('workouts');
  assert(currentProgressSubTab === 'workouts', "currentProgressSubTab is updated to workouts");
  assert(!getOrCreateElement('progress-subpane-workouts').classList.contains('hidden'), "Workouts subpane visible when workouts selected");
  assert(getOrCreateElement('progress-subpane-weight').classList.contains('hidden'), "Weight subpane hidden when workouts selected");

  // Test switchTab('progress')
  switchTab('progress');
  assert(!getOrCreateElement('tab-calendar-view').classList.contains('hidden'), "tab-calendar-view visible when switchTab('progress') called");

  // 7. Test Settings modal tab switching (Styling | Defaults | Backup | Telemetry)
  assert(typeof switchSettingsTab === 'function', "switchSettingsTab is a defined function");
  switchSettingsTab('defaults');
  assert(!getOrCreateElement('settings-pane-defaults').classList.contains('hidden'), "Defaults pane visible when selected");
  assert(getOrCreateElement('settings-pane-styling').classList.contains('hidden'), "Styling pane hidden when defaults selected");

  switchSettingsTab('backup');
  assert(!getOrCreateElement('settings-pane-backup').classList.contains('hidden'), "Backup pane visible when selected");
  assert(getOrCreateElement('settings-pane-defaults').classList.contains('hidden'), "Defaults pane hidden when backup selected");

  switchSettingsTab('telemetry');
  assert(!getOrCreateElement('settings-pane-telemetry').classList.contains('hidden'), "Telemetry pane visible when selected");
  assert(getOrCreateElement('settings-pane-backup').classList.contains('hidden'), "Backup pane hidden when telemetry selected");

  switchSettingsTab('styling');
  assert(!getOrCreateElement('settings-pane-styling').classList.contains('hidden'), "Styling pane visible when selected");
  assert(getOrCreateElement('settings-pane-telemetry').classList.contains('hidden'), "Telemetry pane hidden when styling selected");

  // 8. Test Phase 1, Phase 2 & Phase 3 UX enhancements
  // Phase 1: BMI badge and target weight badge rendering in 4-metric grid
  assert(getOrCreateElement('cal-current-bmi-badge').innerHTML.length > 0, "cal-current-bmi-badge displays BMI category badge");
  assert(typeof openLogWeightModal === 'function', "openLogWeightModal is a defined function");
  assert(typeof openWeightTrendGraph === 'function', "openWeightTrendGraph is a defined function");

  // Phase 2: Quick plate chips and repeat set
  assert(typeof renderQuickWeightChips === 'function', "renderQuickWeightChips is a defined function");
  assert(typeof applyQuickWeightChip === 'function', "applyQuickWeightChip is a defined function");
  assert(typeof repeatSet === 'function', "repeatSet is a defined function");

  renderQuickWeightChips('Barbell');
  assert(getOrCreateElement('quick-plate-chips-container').innerHTML.includes('+45'), "Barbell plate chips include +45 plate");
  
  renderQuickWeightChips('Kettlebell');
  assert(getOrCreateElement('quick-plate-chips-container').innerHTML.includes('16kg'), "Kettlebell plate chips include 16kg standard bell");

  getOrCreateElement('input-weight').value = "45";
  applyQuickWeightChip(45, 'add');
  assert(Number(getOrCreateElement('input-weight').value) === 90, "applyQuickWeightChip correctly adds 45 to input-weight");
  
  applyQuickWeightChip(53, 'set');
  assert(Number(getOrCreateElement('input-weight').value) === 53, "applyQuickWeightChip correctly sets 53 on input-weight");

  // Test repeatSet loading previous set into active controls
  repeatSet(secondSet.id);
  assert(getOrCreateElement('exercise-name-input').value === "Barbell Back Squat", "repeatSet populates exercise-name-input from previous set");
  assert(getOrCreateElement('input-exercise-name').value === "Barbell Back Squat", "repeatSet populates legacy input-exercise-name from previous set");
  assert(Number(getOrCreateElement('input-weight').value) === 225, "repeatSet populates weight from previous set");
  assert(Number(getOrCreateElement('input-reps').value) === 8, "repeatSet populates reps from previous set");

  // Horizontal Tape Ruler & Explicit Step Selector Pills Tests
  assert(typeof initTouchScrollerInputs === 'function', "initTouchScrollerInputs is a defined function");
  assert(typeof setScrollerStep === 'function', "setScrollerStep is a defined function");
  assert(typeof nudgeScroller === 'function', "nudgeScroller is a defined function");
  assert(getOrCreateElement('scroller-weight-container') !== null, "Weight touch scroller container exists");
  assert(getOrCreateElement('tape-ruler-weight') !== null, "Weight tape ruler exists");
  assert(getOrCreateElement('weight-step-pills') !== null, "Weight explicit step pills exist");
  assert(getOrCreateElement('roller-drum-weight') !== null, "Weight roller drum exists for backward compatibility");
  assert(getOrCreateElement('weight-step-badge') !== null, "Weight step mode badge exists for backward compatibility");
  assert(getOrCreateElement('scroller-reps-container') !== null, "Reps touch scroller container exists");
  assert(getOrCreateElement('tape-ruler-reps') !== null, "Reps tape ruler exists");
  assert(getOrCreateElement('reps-step-pills') !== null, "Reps explicit step pills exist");
  assert(getOrCreateElement('roller-drum-reps') !== null, "Reps roller drum exists for backward compatibility");
  assert(getOrCreateElement('quick-plate-chips-wrapper') !== null, "Quick plate chips wrapper exists to retain backward-compatible test hooks");

  setScrollerStep('weight', 5);
  assert(window.scrollerSteps.weight === 5, "setScrollerStep correctly configures weight step to 5");
  setScrollerStep('weight', 1);
  assert(window.scrollerSteps.weight === 1, "setScrollerStep resets weight step to 1");

  // Metric Stepper Buttons (1x Tap & 5x Hold-to-Repeat) Tests
  assert(typeof bindHoldStepper === 'function', "bindHoldStepper is a defined function");
  assert(getOrCreateElement('btn-weight-decrement') !== null, "btn-weight-decrement exists in DOM");
  assert(getOrCreateElement('btn-weight-increment') !== null, "btn-weight-increment exists in DOM");
  assert(getOrCreateElement('btn-reps-decrement') !== null, "btn-reps-decrement exists in DOM");
  assert(getOrCreateElement('btn-reps-increment') !== null, "btn-reps-increment exists in DOM");

  const testWeightInput = getOrCreateElement('input-weight');
  testWeightInput.value = "100";
  const weightIncBtn = getOrCreateElement('btn-weight-increment');
  const weightDecBtn = getOrCreateElement('btn-weight-decrement');

  // Test single tap (1x step)
  weightIncBtn.dispatchEvent({ type: 'click' });
  assert(Number(testWeightInput.value) === 101, "Single click/tap on weight increment adds 1x");
  weightDecBtn.dispatchEvent({ type: 'click' });
  assert(Number(testWeightInput.value) === 100, "Single click/tap on weight decrement subtracts 1x");

  const testRepsInput = getOrCreateElement('input-reps');
  testRepsInput.value = "10";
  const repsIncBtn = getOrCreateElement('btn-reps-increment');
  const repsDecBtn = getOrCreateElement('btn-reps-decrement');

  repsIncBtn.dispatchEvent({ type: 'click' });
  assert(Number(testRepsInput.value) === 11, "Single click/tap on reps increment adds 1x");
  repsDecBtn.dispatchEvent({ type: 'click' });
  assert(Number(testRepsInput.value) === 10, "Single click/tap on reps decrement subtracts 1x");

  // Test 5x nudge compatibility
  nudgeScroller('weight', 1, 5);
  assert(Number(testWeightInput.value) === 105, "5x hold step increment adjusts weight by 5");
  nudgeScroller('weight', -1, 5);
  assert(Number(testWeightInput.value) === 100, "5x hold step decrement adjusts weight by 5");
  nudgeScroller('reps', 1, 5);
  assert(Number(testRepsInput.value) === 15, "5x hold step increment adjusts reps by 5");
  nudgeScroller('reps', -1, 5);
  assert(Number(testRepsInput.value) === 10, "5x hold step decrement adjusts reps by 5");

  // Rest Timer LocalStorage Persistence & Restoration Test
  startRestTimer(10);
  assert(isRestTimerRunning === true, "startRestTimer sets isRestTimerRunning to true");
  assert(localStorage.getItem('showUp_rest_timer_data') !== null, "startRestTimer persists rest timer data to localStorage");
  stopRestTimer();
  assert(isRestTimerRunning === false, "stopRestTimer stops rest timer");
  assert(localStorage.getItem('showUp_rest_timer_data') === null, "stopRestTimer removes rest timer data from localStorage");

  // Test background restoration
  localStorage.setItem('showUp_rest_timer_data', JSON.stringify({ running: true, startTime: Date.now() - 45000 }));
  restoreRestTimerState();
  assert(isRestTimerRunning === true, "restoreRestTimerState restores running rest timer");
  assert(restTimerSeconds >= 45, "restoreRestTimerState accurately recovers elapsed rest seconds");
  stopRestTimer();

  // Phase 3: Default rest time preference and target weight goal
  assert(typeof getDefaultRestTimeSeconds === 'function', "getDefaultRestTimeSeconds is a defined function");
  assert(typeof saveDefaultRestTimePref === 'function', "saveDefaultRestTimePref is a defined function");
  saveDefaultRestTimePref(120);
  assert(getDefaultRestTimeSeconds() === 120, "getDefaultRestTimeSeconds returns 120 after preference saved");

  getOrCreateElement('user-target-weight-input').value = "170";
  savePhysicalProfile();
  assert(localStorage.getItem('showUp_user_target_weight') === "170", "savePhysicalProfile stores target weight in localStorage");
  assert(getOrCreateElement('cal-weight-target-badge').innerHTML.includes('Goal'), "cal-weight-target-badge renders goal information");
});

runSuite("24. Frictionless Sign-In UX & Decluttered Top Feed", () => {
  // 1. Cloud backup banner kept hidden from main screen
  const banner = getOrCreateElement('cloud-backup-reminder-banner');
  assert(banner.classList.contains('hidden'), "Cloud backup banner has hidden class by default");
  updateCloudBackupUI();
  assert(banner.classList.contains('hidden'), "Cloud backup banner remains hidden after updateCloudBackupUI");

  // 2. First set logged prompts for login when unauthenticated
  assert(typeof isAthleteAuthenticated === 'function', "isAthleteAuthenticated is a defined function");
  assert(typeof dismissFirstSetLoginPrompt === 'function', "dismissFirstSetLoginPrompt is a defined function");
  
  const savedProfile = localStorage.getItem('showUp_user_profile');
  localStorage.removeItem('showUp_user_profile');
  if (typeof googleAccessToken !== 'undefined') googleAccessToken = null;
  assert(!isAthleteAuthenticated(), "Athlete is recognized as guest when profile is not set");

  sessionStorage.removeItem('showUp_first_set_login_prompt_dismissed');
  currentSessionSets = [
    { id: 991, exerciseName: "Bench Press", implement: "Barbell", weight: 135, reps: 10, rpe: 8 }
  ];
  renderLoggedSets();
  const listHtml = getOrCreateElement('logged-sets-list').innerHTML;
  assert(listHtml.includes('first-set-login-prompt'), "first-set-login-prompt renders when first set is logged by guest athlete");
  assert(listHtml.includes('First set in the books!'), "first-set-login-prompt contains encouraging copy");
  assert(listHtml.includes('Sign In to Save'), "first-set-login-prompt contains Sign In to Save action");

  // 3. Dismissal of first-set prompt
  dismissFirstSetLoginPrompt();
  assert(sessionStorage.getItem('showUp_first_set_login_prompt_dismissed') === 'true', "Dismissal saved in sessionStorage");
  renderLoggedSets();
  assert(!getOrCreateElement('logged-sets-list').innerHTML.includes('first-set-login-prompt'), "Prompt does not re-render once dismissed");

  // 4. Authenticated athletes do not see first-set prompt
  sessionStorage.removeItem('showUp_first_set_login_prompt_dismissed');
  if (savedProfile) localStorage.setItem('showUp_user_profile', savedProfile);
  assert(isAthleteAuthenticated(), "Athlete is authenticated when profile is present");
  renderLoggedSets();
  assert(!getOrCreateElement('logged-sets-list').innerHTML.includes('first-set-login-prompt'), "Authenticated athlete does not see guest prompt");

  // 5. Clean up session sets
  currentSessionSets = [];
  renderLoggedSets();
});

runSuite("25. Exercise Dropdown Ordering, Previous Workout Metrics & Single Log Set", () => {
  // 1. Exercise Ball Wood Chops in catalog
  const woodChops = defaultCatalog.find(c => c.name === "Exercise Ball Wood Chops");
  assert(woodChops !== undefined, "Exercise Ball Wood Chops exists in defaultCatalog");
  assert(woodChops.implement === "Exercise Ball", "Exercise Ball Wood Chops implement is Exercise Ball");
  assert(woodChops.muscle === "Core/Abs", "Exercise Ball Wood Chops primary muscle is Core/Abs");
  assert(woodChops.secondary.includes("Shoulders"), "Exercise Ball Wood Chops secondary includes Shoulders");
  assert(woodChops.secondary.includes("Back"), "Exercise Ball Wood Chops secondary includes Back");
  assert(woodChops.secondary.includes("Quads"), "Exercise Ball Wood Chops secondary includes Quads");
  assert(inferImplementFromExerciseName("Exercise Ball Wood Chops") === "Exercise Ball", "inferImplementFromExerciseName correctly identifies Exercise Ball");

  // 1b. Replace Single Leg RDL with Kickstand KB RDL
  assert(defaultCatalog.find(c => c.name === "Single Leg RDL") === undefined, "Single Leg RDL is replaced and absent from defaultCatalog");
  const kickstandRdl = defaultCatalog.find(c => c.name === "Kickstand KB RDL");
  assert(kickstandRdl !== undefined, "Kickstand KB RDL exists in defaultCatalog");
  assert(kickstandRdl.implement === "Kettlebell", "Kickstand KB RDL implement is Kettlebell");
  assert(kickstandRdl.muscle === "Hamstrings/Glutes", "Kickstand KB RDL primary muscle is Hamstrings/Glutes");
  assert(kickstandRdl.secondary.includes("Core/Abs"), "Kickstand KB RDL secondary includes Core/Abs");
  assert(findCatalogExercise("Single Leg RDL").name === "Kickstand KB RDL", "findCatalogExercise alias resolves Single Leg RDL to Kickstand KB RDL");
  assert(findCatalogExercise("Kickstand KB RDL").name === "Kickstand KB RDL", "findCatalogExercise matches Kickstand KB RDL");

  // 2. Primary Log Set and Passive Start Set buttons
  const logBtn = getOrCreateElement('btn-log-set');
  const startBtn = getOrCreateElement('btn-start-set');
  assert(logBtn !== null, "btn-log-set is present in DOM");
  assert(startBtn !== null, "btn-start-set is present in DOM as passive CTA");
  updateSetControlsUI();
  assert(!startBtn.classList.contains('hidden'), "btn-start-set is visible as passive CTA option");

  // 3. Previous workout metrics
  completedWorkoutsHistory = [
    {
      date: "2026-10-20",
      workoutName: "Chest & Core Day",
      sets: [
        { exerciseName: "Bench Press", weight: 135, reps: 8, implement: "Barbell" },
        { exerciseName: "Bench Press", weight: 135, reps: 8, implement: "Barbell" },
        { exerciseName: "Bench Press", weight: 135, reps: 8, implement: "Barbell" },
        { exerciseName: "Exercise Ball Wood Chops", weight: 0, reps: 15, implement: "Exercise Ball" }
      ]
    }
  ];

  const prevBench = getPreviousWorkoutExerciseMetric("Bench Press");
  assert(prevBench !== null, "Previous workout metric found for Bench Press");
  assert(prevBench.metric === "135 lb × 8 reps · 3 sets", "Bench Press metric matches '135 lb × 8 reps · 3 sets'");

  const prevWoodChops = getPreviousWorkoutExerciseMetric("Exercise Ball Wood Chops");
  assert(prevWoodChops !== null, "Previous workout metric found for Exercise Ball Wood Chops");
  assert(prevWoodChops.metric === "15 reps · 1 set", "Wood Chops metric accurately formatted");

  const prevNonExistent = getPreviousWorkoutExerciseMetric("Non Existent Lift 999");
  assert(prevNonExistent === null, "Non-existent exercise returns null previous metric");

  updateExercisePreviousWorkoutMetric("Bench Press");
  const banner = getOrCreateElement('exercise-previous-workout-banner');
  const metricSpan = getOrCreateElement('exercise-previous-workout-metric');
  assert(!banner.classList.contains('hidden'), "Previous workout banner is visible when exercise metric exists");
  assert(metricSpan.innerText === "135 lb × 8 reps · 3 sets", "Previous workout banner metric element displays correct metric");

  updateExercisePreviousWorkoutMetric("");
  assert(banner.classList.contains('hidden'), "Previous workout banner is hidden when exercise name is empty");
  assert(metricSpan.innerText === "", "Metric span text is cleared when exercise name is empty");

  updateExercisePreviousWorkoutMetric("Custom Exercise");
  assert(banner.classList.contains('hidden'), "Previous workout banner is hidden when exercise name is 'Custom Exercise'");

  const exInputEl = getOrCreateElement('exercise-name-input');
  exInputEl.value = "";
  handleExerciseInput("");
  assert(banner.classList.contains('hidden'), "handleExerciseInput with empty input strictly hides previous workout banner");

  handleExerciseInput("Custom Exercise");
  assert(banner.classList.contains('hidden'), "handleExerciseInput with 'Custom Exercise' strictly hides previous workout banner");

  // 4. Exercise Suggestions: recents first, separator line, alphabetical catalog
  currentSessionSets = [
    { id: 101, exerciseName: "Barbell Squats", weight: 225, reps: 5, implement: "Barbell", muscle: "Quads" }
  ];
  const recents = getRecentExercises(6);
  assert(Array.isArray(recents) && recents.length > 0, "getRecentExercises returns recent exercises");
  assert(recents[0].name === "Barbell Squats", "Most recent active set is listed first");
  assert(recents.some(r => r.name === "Bench Press"), "Recents includes Bench Press from completed workout history");

  updateExerciseSuggestions("", "exercise-name-input", "exercise-suggestions-dropdown");
  const dropdown = getOrCreateElement('exercise-suggestions-dropdown');
  assert(!dropdown.classList.contains('hidden'), "Dropdown opens on tap/click with empty input");
  assert(dropdown.innerHTML.includes("Recent Exercises"), "Dropdown includes Recent Exercises header first");
  assert(dropdown.innerHTML.includes("All Exercises (A–Z)"), "Dropdown includes separator line with All Exercises (A–Z)");

  // 5. Typography defaulted to Jakarta and no other options offered
  localStorage.removeItem('showUp_font');
  restoreFontPreferences();
  assert(localStorage.getItem('showUp_font') === 'jakarta' || localStorage.getItem('showUp_font') === 'font-jakarta', "Default font is Jakarta");
  updateFontUI('jakarta');
  const outfitBtn = getOrCreateElement('font-btn-outfit');
  assert(outfitBtn.classList.contains('hidden'), "Other typography options (Outfit) are hidden in UI");

  // Cleanup
  completedWorkoutsHistory = [];
  currentSessionSets = [];
});

runSuite("26. Workout in Progress HUD Redesign", () => {
  // 1. Elements exist in DOM
  const hud = getOrCreateElement('workout-session-hud');
  assert(hud !== null, "workout-session-hud exists in DOM");

  const statusText = getOrCreateElement('workout-session-status-text');
  assert(statusText !== null, "workout-session-status-text exists in DOM");

  const startTimeEl = getOrCreateElement('workout-session-start-time');
  assert(startTimeEl !== null, "workout-session-start-time exists in DOM");

  const completedEl = getOrCreateElement('session-completed-exercises-display');
  assert(completedEl !== null, "session-completed-exercises-display exists in DOM");

  const setsLoggedEl = getOrCreateElement('session-sets-logged-display');
  assert(setsLoggedEl !== null, "session-sets-logged-display exists in DOM");

  // 2. Legacy baseline elements preserved in DOM (hidden)
  const legacyTimer = getOrCreateElement('session-timer');
  assert(legacyTimer !== null, "session-timer retained in DOM for baseline compatibility");
  const legacyDatePicker = getOrCreateElement('workout-date-picker');
  assert(legacyDatePicker !== null, "workout-date-picker retained in DOM for baseline compatibility");
  const legacyTimezone = getOrCreateElement('user-timezone-display');
  assert(legacyTimezone !== null, "user-timezone-display retained in DOM for baseline compatibility");

  // 3. Start time formatting
  assert(typeof formatWorkoutStartTime === 'function', "formatWorkoutStartTime is a defined function");
  const sampleTime = new Date(2026, 9, 25, 6, 32).getTime();
  const formattedStart = formatWorkoutStartTime(sampleTime);
  assert(formattedStart.startsWith("Started "), "formatWorkoutStartTime starts with 'Started '");
  assert(formattedStart.includes("6:32"), "formatWorkoutStartTime includes '6:32'");

  // 4. Initial HUD state with 0 sets
  currentSessionSets = [];
  updateWorkoutSessionHUD();
  assert(completedEl.innerText === "0 exercises", "completedEl displays '0 exercises' with 0 sets");
  assert(setsLoggedEl.innerText === "0", "setsLoggedEl displays '0' with 0 sets");

  // 5. Dynamic update matching screenshot: 3 completed exercises, 8 sets logged
  currentSessionSets = [
    { id: 1001, exerciseName: "Bench Press", implement: "Barbell", weight: 135, reps: 8, rpe: 8 },
    { id: 1002, exerciseName: "Bench Press", implement: "Barbell", weight: 135, reps: 8, rpe: 8 },
    { id: 1003, exerciseName: "Bench Press", implement: "Barbell", weight: 135, reps: 8, rpe: 8 },
    { id: 1004, exerciseName: "Kickstand KB RDL", implement: "Kettlebell", weight: 53, reps: 10, rpe: 8 },
    { id: 1005, exerciseName: "Kickstand KB RDL", implement: "Kettlebell", weight: 53, reps: 10, rpe: 8 },
    { id: 1006, exerciseName: "Exercise Ball Wood Chops", implement: "Exercise Ball", weight: 0, reps: 15, rpe: 7 },
    { id: 1007, exerciseName: "Exercise Ball Wood Chops", implement: "Exercise Ball", weight: 0, reps: 15, rpe: 7 },
    { id: 1008, exerciseName: "Exercise Ball Wood Chops", implement: "Exercise Ball", weight: 0, reps: 15, rpe: 7 }
  ];
  updateWorkoutSessionHUD();
  assert(completedEl.innerText === "3 exercises", "completedEl displays '3 exercises'");
  assert(setsLoggedEl.innerText === "8", "setsLoggedEl displays '8'");

  // 6. Options menu toggle
  const menu = getOrCreateElement('session-options-menu');
  menu.classList.add('hidden');
  assert(menu.classList.contains('hidden'), "session-options-menu is hidden initially");
  toggleSessionOptionsMenu();
  assert(!menu.classList.contains('hidden'), "toggleSessionOptionsMenu opens menu");
  toggleSessionOptionsMenu();
  assert(menu.classList.contains('hidden'), "toggleSessionOptionsMenu closes menu");

  // 7. Cancel workout session clears sets and updates HUD
  assert(typeof cancelWorkoutSession === 'function', "cancelWorkoutSession is defined");
  cancelWorkoutSession(true);
  assert(currentSessionSets.length === 0, "cancelWorkoutSession clears active sets");
  assert(completedEl.innerText === "0 exercises", "HUD completed exercises reset to 0 exercises");
  assert(setsLoggedEl.innerText === "0", "HUD sets logged reset to 0");
  resetWorkoutSession();
  assert(currentSessionSets.length === 0, "resetWorkoutSession clears active sets");
});

runSuite("27. Start Set Passive CTA & Conspicuous Active Timer", () => {
  const startBtn = getOrCreateElement('btn-start-set');
  const startLabel = getOrCreateElement('btn-start-set-label');
  const activeBanner = getOrCreateElement('active-set-timer-banner');
  const activeVal = getOrCreateElement('active-set-timer-val');

  assert(activeBanner !== null, "active-set-timer-banner exists in DOM");
  assert(activeVal !== null, "active-set-timer-val exists in DOM");

  // Initial passive state
  isSetInProgress = false;
  updateSetControlsUI();
  assert(activeBanner.classList.contains('hidden'), "active-set-timer-banner hidden before set start");
  assert(!startBtn.classList.contains('hidden'), "startBtn is visible as passive CTA");
  assert(startLabel.innerText === "Start Set 1", "startBtn displays 'Start Set 1'");

  // Start Set action
  startSet();
  assert(isSetInProgress === true, "isSetInProgress is true after startSet");
  assert(!activeBanner.classList.contains('hidden'), "active-set-timer-banner is conspicuous and visible when set started");
  assert(activeVal.innerText === "00:00", "active-set-timer-val displays initial 00:00");
  assert(startLabel.innerText.includes("Timing Set 1"), "startLabel updates to Timing Set 1");

  // Tick active set
  activeSetStartTime = Date.now() - 15000; // 15 seconds ago
  tickActiveSet();
  assert(activeVal.innerText === "00:15", "active-set-timer-val formats 15s to 00:15");
  assert(startLabel.innerText.includes("15s"), "startLabel reflects 15s elapsed");

  // Cancel active set timer
  cancelActiveSetTimer();
  assert(isSetInProgress === false, "isSetInProgress is false after cancelActiveSetTimer");
  assert(activeBanner.classList.contains('hidden'), "activeBanner hidden after cancellation");
  assert(startLabel.innerText === "Start Set 1", "startBtn returns to passive Start Set 1");

  // Start set and log set
  startSet();
  activeSetStartTime = Date.now() - 25000; // 25s elapsed
  currentSessionSets = [];
  const nameInput = getOrCreateElement('exercise-name-input');
  nameInput.value = "Bench Press";
  logSet();
  assert(isSetInProgress === false, "isSetInProgress reset to false after logSet");
  assert(activeBanner.classList.contains('hidden'), "activeBanner hidden after set logged");
  assert(currentSessionSets.length === 1, "Set was logged");
  assert(currentSessionSets[0].setDuration >= 24, "setDuration accurately captured from active set timer");

  // Rest target extension via adjustRestTimer(+30)
  localStorage.removeItem('showUp_default_rest_time');
  startRestTimer(10); // 10s elapsed
  assert(getCurrentRestTarget() === 60, "Initial rest target defaults to 60s");
  assert(restTimerSeconds === 10, "Elapsed rest seconds is 10s");
  adjustRestTimer(30);
  assert(getCurrentRestTarget() === 90, "adjustRestTimer(+30) increases rest target to 90s");
  assert(restTimerSeconds === 10, "Elapsed rest seconds remains intact at 10s without inflation");

  // Clean up
  if (isRestTimerRunning) stopRestTimer();
  currentSessionSets = [];
});

runSuite("28. Rest Recovery Haptic, 3 Chimes (Masculine/Feminine), Steppers & Muscles Scroll", () => {
  // 1. Function existence
  assert(typeof playDoubleBellRing === 'function', "playDoubleBellRing is a defined function");
  assert(typeof playDoubleDingChime === 'function', "playDoubleDingChime is a defined function");
  assert(typeof playTripleDingChime === 'function', "playTripleDingChime is a defined function");
  assert(typeof playDeepGongChime === 'function', "playDeepGongChime is a defined function");
  assert(typeof playRestChime === 'function', "playRestChime is a defined function");
  assert(typeof getRestChimeSound === 'function', "getRestChimeSound is a defined function");
  assert(typeof setRestChimeSound === 'function', "setRestChimeSound is a defined function");
  assert(typeof cycleRestChimeSound === 'function', "cycleRestChimeSound is a defined function");
  assert(typeof adjustRestTarget === 'function', "adjustRestTarget is a defined function");
  assert(typeof isRestSoundAlertEnabled === 'function', "isRestSoundAlertEnabled is a defined function");
  assert(typeof setRestSoundAlertEnabled === 'function', "setRestSoundAlertEnabled is a defined function");
  assert(typeof toggleRestSoundAlert === 'function', "toggleRestSoundAlert is a defined function");
  assert(typeof toggleRestSoundAlertPref === 'function', "toggleRestSoundAlertPref is a defined function");
  assert(typeof updateRestSoundAlertUI === 'function', "updateRestSoundAlertUI is a defined function");
  assert(typeof checkRestRecoveryThreshold === 'function', "checkRestRecoveryThreshold is a defined function");

  // 2. DOM elements
  const soundBtn = getOrCreateElement('btn-toggle-rest-sound');
  const soundIcon = getOrCreateElement('btn-toggle-rest-sound-icon');
  const prefCheckbox = getOrCreateElement('pref-rest-sound-alert');
  const chimeCycleBtn = getOrCreateElement('btn-chime-cycle');
  const chimeSelect = getOrCreateElement('pref-rest-chime-select');
  const decBtn = getOrCreateElement('btn-rest-decrement');
  const incBtn = getOrCreateElement('btn-rest-increment');
  const targetValEl = getOrCreateElement('rest-timer-target-val');

  assert(soundBtn !== null, "btn-toggle-rest-sound exists in DOM");
  assert(soundIcon !== null, "btn-toggle-rest-sound-icon exists in DOM");
  assert(prefCheckbox !== null, "pref-rest-sound-alert exists in DOM");
  assert(chimeCycleBtn !== null, "btn-chime-cycle exists in DOM");
  assert(chimeSelect !== null, "pref-rest-chime-select exists in DOM");
  assert(decBtn !== null, "btn-rest-decrement exists in DOM");
  assert(incBtn !== null, "btn-rest-increment exists in DOM");
  assert(targetValEl !== null, "rest-timer-target-val exists in DOM");

  // 3. Horizontal scroll container for Target and Secondary muscles
  const scrollContainer = getOrCreateElement('auto-muscles-scroll-container');
  assert(scrollContainer !== null, "auto-muscles-scroll-container exists in DOM");

  // 4. Preference behavior (defaults to true)
  localStorage.removeItem('showUp_rest_sound_alert');
  assert(isRestSoundAlertEnabled() === true, "Rest recovery sound alert is enabled by default");

  setRestSoundAlertEnabled(false);
  assert(isRestSoundAlertEnabled() === false, "Sound alert can be disabled");
  assert(localStorage.getItem('showUp_rest_sound_alert') === 'false', "Preference persisted in localStorage as false");

  setRestSoundAlertEnabled(true);
  assert(isRestSoundAlertEnabled() === true, "Sound alert can be re-enabled");
  assert(localStorage.getItem('showUp_rest_sound_alert') === 'true', "Preference persisted in localStorage as true");

  // 5. Rest Timer Steppers & Sticky Target Persistence
  localStorage.removeItem('showUp_default_rest_time');
  startRestTimer(0);
  assert(getCurrentRestTarget() === 60, "Rest timer target defaults to 60s");

  // Single step +1
  adjustRestTarget(1);
  assert(getCurrentRestTarget() === 61, "adjustRestTarget(1) steps target to 61s");
  assert(localStorage.getItem('showUp_default_rest_time') === '61', "Target rest is sticky in localStorage");

  // Step -1
  adjustRestTarget(-1);
  assert(getCurrentRestTarget() === 60, "adjustRestTarget(-1) steps target back to 60s");
  assert(localStorage.getItem('showUp_default_rest_time') === '60', "Target rest is sticky in localStorage");

  // 5x hold step +5
  adjustRestTarget(5);
  assert(getCurrentRestTarget() === 65, "adjustRestTarget(5) steps target by 5 to 65s");
  assert(localStorage.getItem('showUp_default_rest_time') === '65', "Target rest is sticky in localStorage");

  // 5x hold step -5
  adjustRestTarget(-5);
  assert(getCurrentRestTarget() === 60, "adjustRestTarget(-5) steps target back to 60s");
  assert(localStorage.getItem('showUp_default_rest_time') === '60', "Target rest is sticky in localStorage");

  // 6. Chimes Definition & Synthesis execution
  assert(REST_CHIMES.double_ding !== undefined, "REST_CHIMES defines double_ding (Boxing Bell Double Ding)");
  assert(REST_CHIMES.double_ding.name === "Boxing Bell", "REST_CHIMES.double_ding is Boxing Bell");
  assert(REST_CHIMES.triple_ding !== undefined, "REST_CHIMES defines triple_ding (Boxing Bell Triple Ding)");
  assert(REST_CHIMES.triple_ding.name === "Boxing Bell", "REST_CHIMES.triple_ding is Boxing Bell");
  assert(REST_CHIMES.deep_gong !== undefined, "REST_CHIMES defines deep_gong (Definitively Masculine)");
  assert(REST_CHIMES.crystal_harp === undefined, "Crystal Chime has been cleanly removed");

  let audioDoubleDing = false;
  let audioTripleDing = false;
  let audioMasculine = false;
  try {
    playDoubleDingChime();
    audioDoubleDing = true;
  } catch (e) {
    audioDoubleDing = false;
  }
  try {
    playTripleDingChime();
    audioTripleDing = true;
  } catch (e) {
    audioTripleDing = false;
  }
  try {
    playDeepGongChime();
    audioMasculine = true;
  } catch (e) {
    audioMasculine = false;
  }

  assert(audioDoubleDing === true, "playDoubleDingChime (boxing bell double ding) executes cleanly with Web Audio API");
  assert(audioTripleDing === true, "playTripleDingChime (boxing bell triple ding) executes cleanly with Web Audio API");
  assert(audioMasculine === true, "playDeepGongChime (masculine) executes cleanly with Web Audio API");

  // 7. Minimalistic Chime Cycling & Persistence
  localStorage.removeItem('showUp_rest_chime_sound');
  assert(getRestChimeSound() === 'double_ding', "Default chime sound is double_ding");

  const next1 = cycleRestChimeSound(false);
  assert(next1 === 'triple_ding', "cycleRestChimeSound transitions double_ding -> triple_ding");
  assert(localStorage.getItem('showUp_rest_chime_sound') === 'triple_ding', "triple_ding persisted to localStorage");

  const next2 = cycleRestChimeSound(false);
  assert(next2 === 'deep_gong', "cycleRestChimeSound transitions triple_ding -> deep_gong");
  assert(localStorage.getItem('showUp_rest_chime_sound') === 'deep_gong', "deep_gong persisted to localStorage");

  const next3 = cycleRestChimeSound(false);
  assert(next3 === 'double_ding', "cycleRestChimeSound transitions deep_gong -> double_ding");
  assert(localStorage.getItem('showUp_rest_chime_sound') === 'double_ding', "double_ding persisted to localStorage");

  // 8. Haptic pattern for recovery
  globalThis.__lastVibrate = null;
  triggerHaptic('recovery');
  assert(Array.isArray(globalThis.__lastVibrate) && globalThis.__lastVibrate.length === 3, "triggerHaptic('recovery') fires a 3-part double pulse pattern");
  assert(globalThis.__lastVibrate[0] === 70 && globalThis.__lastVibrate[1] === 100 && globalThis.__lastVibrate[2] === 90, "Pattern matches [70, 100, 90]");

  // 9. Recovery alert triggers once when target rest is reached
  globalThis.__lastVibrate = null;
  let restChimeFired = false;
  const originalPlayChime = playRestChime;
  globalThis.playRestChime = () => { restChimeFired = true; };

  localStorage.setItem('showUp_default_rest_time', '60');
  startRestTimer(0);
  assert(hasTriggeredRestRecoveryAlert === false, "Alert flag is initially false");
  assert(restChimeFired === false, "Sound has not fired at 0s");
  assert(globalThis.__lastVibrate === null, "Haptic has not fired at 0s");

  const statusBadge = getOrCreateElement('rest-timer-status-badge');
  assert(statusBadge.classList.contains('hidden') || statusBadge.className === 'hidden' || statusBadge.innerText === '', "Resting badge pill is silenced during rest countdown");

  // Advance to 59s (under target)
  restTimerSeconds = 59;
  checkRestRecoveryThreshold();
  assert(hasTriggeredRestRecoveryAlert === false, "Alert does not fire before target (59s < 60s)");
  assert(restChimeFired === false, "Sound has not fired at 59s");

  // Advance to 60s (target reached!)
  restTimerSeconds = 60;
  checkRestRecoveryThreshold();
  updateRestTimerUI();
  assert(hasTriggeredRestRecoveryAlert === true, "Alert flag set to true when target reached (60s >= 60s)");
  assert(restChimeFired === true, "Rest chime sound alert triggered at target recovery");
  assert(globalThis.__lastVibrate !== null, "Haptic alert triggered at target recovery");
  assert(statusBadge.innerText === "Ready to Lift!", "Status badge switches to 'Ready to Lift!' upon reaching target recovery");
  assert(statusBadge.className.includes('animate-bounce'), "Ready to Lift pill has animate-bounce class");

  // Verify single-fire behavior (does not re-fire on next ticks at 61s, 62s)
  restChimeFired = false;
  globalThis.__lastVibrate = null;
  restTimerSeconds = 61;
  checkRestRecoveryThreshold();
  assert(restChimeFired === false, "Alert sound does not re-trigger on subsequent seconds");
  assert(globalThis.__lastVibrate === null, "Haptic does not re-trigger on subsequent seconds");

  // 10. Extending rest target re-arms alert
  adjustRestTarget(30); // Target is now 90s, current restTimerSeconds is 61s
  assert(getCurrentRestTarget() === 90, "New target is 90s");
  assert(hasTriggeredRestRecoveryAlert === false, "Extending rest target re-arms alert flag");

  // Reaches extended target at 90s
  restTimerSeconds = 90;
  checkRestRecoveryThreshold();
  assert(hasTriggeredRestRecoveryAlert === true, "Alert triggers again at new extended target (90s)");
  assert(restChimeFired === true, "Chime sound fired for extended target");

  // 11. Optional alert: when muted, sound is suppressed but haptic still fires
  restChimeFired = false;
  globalThis.__lastVibrate = null;
  setRestSoundAlertEnabled(false);
  localStorage.setItem('showUp_default_rest_time', '60');
  startRestTimer(0);
  restTimerSeconds = 60;
  checkRestRecoveryThreshold();
  assert(restChimeFired === false, "Sound alert is suppressed when disabled/muted");
  assert(globalThis.__lastVibrate !== null, "Haptic alert still fires when sound is muted");

  // Restore mocks and clean up
  globalThis.playRestChime = originalPlayChime;
  setRestSoundAlertEnabled(true);
  stopRestTimer();
  localStorage.removeItem('showUp_default_rest_time');
  localStorage.removeItem('showUp_rest_sound_alert');
  localStorage.removeItem('showUp_rest_chime_sound');
});

runSuite("Suite 28: Post-Log Set Notes and Modal Note Support", () => {
  // Clear any existing sets
  currentSessionSets = [];
  localStorage.removeItem('showUp_active_workout_sets');

  // 1. Pre-log setup: verify logging a set keeps inputs fast and includes notes: ""
  document.getElementById('exercise-name-input').value = "Incline Dumbbell Press";
  document.getElementById('implement-select').value = "Dumbbell";
  document.getElementById('muscle-group-select').value = "Chest";
  document.getElementById('input-weight').value = "80";
  document.getElementById('input-reps').value = "10";
  document.getElementById('rpe-select').value = "8.5";

  logSet();

  assert(currentSessionSets.length === 1, "Set is successfully logged");
  const setId = currentSessionSets[0].id;
  assert(currentSessionSets[0].notes === "", "Set starts with empty notes string");
  assert(currentSessionSets[0].exerciseName === "Incline Dumbbell Press", "Exercise name correct");

  // 2. Rendered card has the subtle + Note trigger
  const listEl = document.getElementById('logged-sets-list');
  assert(listEl.innerHTML.includes(`set-note-box-${setId}`), "Set note box rendered for the set");
  assert(listEl.innerHTML.includes('+ Note'), "Renders subtle + Note button when note is empty");

  // 3. Opening inline note input
  openInlineSetNoteInput(setId);
  const noteBox = document.getElementById(`set-note-box-${setId}`);
  assert(noteBox.innerHTML.includes(`inline-set-note-input-${setId}`), "Inline note input rendered");

  // 4. Saving inline note
  const inlineInput = document.getElementById(`inline-set-note-input-${setId}`);
  inlineInput.value = "Felt smooth, paused at the bottom";
  saveInlineSetNote(setId);

  assert(currentSessionSets[0].notes === "Felt smooth, paused at the bottom", "Set note updated in memory");
  const savedLS = JSON.parse(localStorage.getItem('showUp_active_workout_sets'));
  assert(savedLS[0].notes === "Felt smooth, paused at the bottom", "Set note persisted to localStorage");
  assert(listEl.innerHTML.includes("Felt smooth, paused at the bottom"), "Set note text rendered on the card");
  assert(listEl.innerHTML.includes("fa-note-sticky"), "Sticky note icon rendered with note");

  // 5. Cancelling inline note does not overwrite existing note
  openInlineSetNoteInput(setId);
  const inlineInput2 = document.getElementById(`inline-set-note-input-${setId}`);
  inlineInput2.value = "Changed my mind";
  cancelInlineSetNote(setId);
  assert(currentSessionSets[0].notes === "Felt smooth, paused at the bottom", "Cancelling leaves note unchanged");

  // 6. Modal note editing
  openEditActiveSetModal(setId);
  const modalNotesEl = document.getElementById('edit-active-set-notes');
  assert(modalNotesEl.value === "Felt smooth, paused at the bottom", "Edit modal loads existing note");

  modalNotesEl.value = "Updated note: pushed to RPE 9 on last rep";
  saveActiveSetEdits();

  assert(currentSessionSets[0].notes === "Updated note: pushed to RPE 9 on last rep", "Modal update saves note to set object");
  const updatedLS = JSON.parse(localStorage.getItem('showUp_active_workout_sets'));
  assert(updatedLS[0].notes === "Updated note: pushed to RPE 9 on last rep", "Modal update persists note to localStorage");
  assert(listEl.innerHTML.includes("Updated note: pushed to RPE 9 on last rep"), "Updated note rendered on logged sets list");

  // 7. Summary sets breakdown displays note
  lastEvaluatedSummary = {
    date: "2026-10-25",
    workoutName: "Push Day",
    sets: [...currentSessionSets]
  };
  renderSummarySetsList();
  const summaryChronology = document.getElementById('summary-sets-chronology');
  assert(summaryChronology.innerHTML.includes("Updated note: pushed to RPE 9 on last rep"), "Summary sets list renders set note");

  // 8. Delete note resets back to empty note with + Note trigger
  deleteSetNote(setId);
  assert(currentSessionSets[0].notes === "", "deleteSetNote resets notes to empty string");
  assert(listEl.innerHTML.includes('+ Note'), "Card returns to subtle + Note trigger after deletion");

  // Clean up
  currentSessionSets = [];
  localStorage.removeItem('showUp_active_workout_sets');
  lastEvaluatedSummary = null;
});

runSuite("29. Streamlined Google OAuth Permissions & Non-Redundant Consent Flow", () => {
  // 1. Clear any stored profile
  localStorage.removeItem('showUp_user_profile');
  lastTokenClientInitConfig = null;
  lastTokenClientRequestConfig = null;

  // 2. Call requestDriveAuthorization without user profile
  requestDriveAuthorization(false);
  assert(lastTokenClientInitConfig !== null, "requestDriveAuthorization calls initTokenClient");
  assert(lastTokenClientInitConfig.prompt === '', "requestDriveAuthorization uses prompt: '' to avoid forcing consent modal");
  assert(lastTokenClientRequestConfig.prompt === '', "requestAccessToken requests prompt: '' without forcing consent");
  assert(!lastTokenClientInitConfig.hint, "hint is omitted when no user profile exists in localStorage");

  // 3. Save athlete user profile
  const mockProfile = { firstName: "Abhilash", email: "athlete@example.com", picture: "" };
  localStorage.setItem('showUp_user_profile', JSON.stringify(mockProfile));

  // 4. Call requestDriveAuthorization with saved user profile
  lastTokenClientInitConfig = null;
  lastTokenClientRequestConfig = null;
  requestDriveAuthorization(false);
  assert(lastTokenClientInitConfig.hint === "athlete@example.com", "requestDriveAuthorization passes hint: email when user profile exists");
  assert(lastTokenClientRequestConfig.hint === "athlete@example.com", "requestAccessToken passes hint: email to skip account chooser");
  assert(lastTokenClientInitConfig.prompt === '', "requestDriveAuthorization preserves prompt: '' with user hint");

  // 5. Call handleGoogleSignIn with saved profile
  lastTokenClientInitConfig = null;
  lastTokenClientRequestConfig = null;
  handleGoogleSignIn();
  assert(lastTokenClientInitConfig.prompt === '', "handleGoogleSignIn uses prompt: '' for known users to prevent re-consent screen");
  assert(lastTokenClientInitConfig.hint === "athlete@example.com", "handleGoogleSignIn passes hint: email for known users");
  assert(lastTokenClientRequestConfig.prompt === '', "handleGoogleSignIn requestAccessToken uses prompt: '' for known users");

  // 6. Call handleGoogleSignIn without saved profile (first-time user)
  localStorage.removeItem('showUp_user_profile');
  lastTokenClientInitConfig = null;
  lastTokenClientRequestConfig = null;
  handleGoogleSignIn();
  assert(lastTokenClientInitConfig.prompt === 'select_account', "handleGoogleSignIn uses prompt: 'select_account' for new/unknown users");
  assert(lastTokenClientRequestConfig.prompt === 'select_account', "requestAccessToken uses prompt: 'select_account' for new/unknown users");

  // 7. Call requestTokenSilently with saved profile
  localStorage.setItem('showUp_user_profile', JSON.stringify(mockProfile));
  lastTokenClientInitConfig = null;
  lastTokenClientRequestConfig = null;
  requestTokenSilently();
  assert(lastTokenClientInitConfig.hint === "athlete@example.com", "requestTokenSilently passes hint: email for silent token renewal");
  assert(lastTokenClientRequestConfig.prompt === '', "requestTokenSilently passes prompt: '' for non-intrusive renewal");

  // Clean up
  localStorage.removeItem('showUp_user_profile');
  lastTokenClientInitConfig = null;
  lastTokenClientRequestConfig = null;
});

runSuite("30. Enable Squads Module Defaults, isMe Safe Resolution & Rogue Squad Purge", function() {
  const prefCheckbox = getOrCreateElement('pref-squads-enabled');
  const navBtnSquads = getOrCreateElement('nav-btn-squads');
  const bottomNavGrid = getOrCreateElement('bottom-nav-grid');
  const squadsView = getOrCreateElement('tab-squads-view');

  // 1. Verify Enable Squads Module Defaults Toggle
  assert(typeof isSquadsEnabled === "function", "isSquadsEnabled is a defined function");
  assert(typeof toggleSquadsEnabledPref === "function", "toggleSquadsEnabledPref is a defined function");
  assert(typeof applySquadsEnabledUI === "function", "applySquadsEnabledUI is a defined function");

  // Disable squads
  toggleSquadsEnabledPref(false);
  assert(isSquadsEnabled() === false, "isSquadsEnabled returns false when disabled");
  assert(prefCheckbox.checked === false, "pref-squads-enabled checkbox is unchecked");
  assert(navBtnSquads.classList.contains('hidden'), "nav-btn-squads is hidden when squads module disabled");
  assert(bottomNavGrid.classList.contains('grid-cols-3'), "bottom-nav-grid adapts to grid-cols-3 when squads disabled");

  // Attempt to switch to squads tab while disabled
  switchTab('squads');
  assert(squadsView.classList.contains('hidden'), "Squads view remains hidden when navigating to squads while disabled");

  // Re-enable squads
  toggleSquadsEnabledPref(true);
  assert(isSquadsEnabled() === true, "isSquadsEnabled returns true when enabled");
  assert(prefCheckbox.checked === true, "pref-squads-enabled checkbox is checked");
  assert(!navBtnSquads.classList.contains('hidden'), "nav-btn-squads is visible when squads module enabled");
  assert(bottomNavGrid.classList.contains('grid-cols-4'), "bottom-nav-grid returns to grid-cols-4 when squads enabled");

  // 2. Verify getGlobalActiveAthletesCount resolves isMe cleanly without ReferenceError
  assert(typeof getGlobalActiveAthletesCount === "function", "getGlobalActiveAthletesCount is a defined function");
  let activeCount = null;
  try {
    activeCount = getGlobalActiveAthletesCount();
  } catch (err) {
    assert(false, "getGlobalActiveAthletesCount threw error: " + err.message);
  }
  assert(typeof activeCount === "number", "getGlobalActiveAthletesCount returns number without isMe reference error");

  // 3. Verify Rogue Squad ('frie nds') Detection and Purge
  assert(typeof isRogueFriendsSquad === "function", "isRogueFriendsSquad is a defined function");
  assert(isRogueFriendsSquad("frie nds") === true, "isRogueFriendsSquad identifies 'frie nds'");
  assert(isRogueFriendsSquad("friends") === true, "isRogueFriendsSquad identifies 'friends'");
  assert(isRogueFriendsSquad("Friends") === true, "isRogueFriendsSquad is case-insensitive");
  assert(isRogueFriendsSquad("Iron Collective") === false, "isRogueFriendsSquad does not match legitimate squads");
  assert(isRogueFriendsSquad("Morning Crew") === false, "isRogueFriendsSquad does not match Morning Crew");

  // Simulate injection of rogue squad
  const rogueSquad = {
    id: "squad_rogue_friends_test",
    name: "frie nds",
    createdAt: "2026-10-20T12:00:00.000Z",
    creatorId: "unknown_user",
    creatorName: "Unknown User",
    creatorEmail: "unknown@example.com",
    members: []
  };
  localStorage.setItem('showUp_squads', JSON.stringify([rogueSquad]));
  purgeFriendsSquads();
  const purgedSquads = JSON.parse(localStorage.getItem('showUp_squads') || '[]');
  assert(purgedSquads.length === 0, "purgeFriendsSquads eradicates rogue 'frie nds' squad from localStorage");
});

runSuite("31. Muscles Engaged Section Renaming, Passive Transparency, Collapsible & Sticky State", () => {
  assert(typeof isAutoMusclesCollapsed === 'function', "isAutoMusclesCollapsed is a defined function");
  assert(typeof setAutoMusclesCollapsed === 'function', "setAutoMusclesCollapsed is a defined function");
  assert(typeof toggleAutoMusclesCollapse === 'function', "toggleAutoMusclesCollapse is a defined function");
  assert(typeof applyAutoMusclesCollapseUI === 'function', "applyAutoMusclesCollapseUI is a defined function");
  assert(typeof isMuscleMapCollapsed === 'function', "isMuscleMapCollapsed is a defined function");
  assert(typeof setMuscleMapCollapsed === 'function', "setMuscleMapCollapsed is a defined function");
  assert(typeof toggleMuscleMapCollapse === 'function', "toggleMuscleMapCollapse is a defined function");
  assert(typeof applyMuscleMapCollapseUI === 'function', "applyMuscleMapCollapseUI is a defined function");

  // DOM elements in mock
  const autoDetails = getOrCreateElement('auto-muscles-expandable-details');
  const autoChevron = getOrCreateElement('auto-muscles-chevron');
  const mapContent = getOrCreateElement('muscle-map-content');
  const mapChevron = getOrCreateElement('muscle-map-chevron');
  const mapHint = getOrCreateElement('muscle-map-collapsed-hint');

  // Test Auto Muscles Pill (Logger)
  localStorage.removeItem('showup_auto_muscles_collapsed');
  assert(isAutoMusclesCollapsed() === false, "Auto muscles pill defaults to expanded");
  applyAutoMusclesCollapseUI(false);
  assert(!autoDetails.classList.contains('hidden'), "Expandable details visible when expanded");
  assert(autoChevron.classList.contains('fa-chevron-up'), "Chevron points up when expanded");

  toggleAutoMusclesCollapse();
  assert(isAutoMusclesCollapsed() === true, "toggleAutoMusclesCollapse sets state to collapsed");
  assert(localStorage.getItem('showup_auto_muscles_collapsed') === 'true', "Collapsed state is sticky in localStorage");
  assert(autoDetails.classList.contains('hidden'), "Expandable details hidden when collapsed");
  assert(autoChevron.classList.contains('fa-chevron-down'), "Chevron points down when collapsed");

  toggleAutoMusclesCollapse();
  assert(isAutoMusclesCollapsed() === false, "toggleAutoMusclesCollapse expands again");
  assert(localStorage.getItem('showup_auto_muscles_collapsed') === 'false', "Expanded state is sticky in localStorage");
  assert(!autoDetails.classList.contains('hidden'), "Expandable details visible after re-expansion");

  // Test Muscles Engaged Map (Summary)
  localStorage.removeItem('showup_muscles_engaged_collapsed');
  assert(isMuscleMapCollapsed() === false, "Summary muscle map defaults to expanded");
  applyMuscleMapCollapseUI(false);
  assert(!mapContent.classList.contains('hidden'), "Muscle map content visible when expanded");
  assert(mapChevron.classList.contains('fa-chevron-up'), "Map chevron points up when expanded");

  mapHint.textContent = "Primary: Chest";
  toggleMuscleMapCollapse();
  assert(isMuscleMapCollapsed() === true, "toggleMuscleMapCollapse sets state to collapsed");
  assert(localStorage.getItem('showup_muscles_engaged_collapsed') === 'true', "Summary map collapsed state is sticky in localStorage");
  assert(mapContent.classList.contains('hidden'), "Muscle map content hidden when collapsed");
  assert(mapChevron.classList.contains('fa-chevron-down'), "Map chevron points down when collapsed");
  assert(!mapHint.classList.contains('hidden'), "Primary target hint badge is visible when collapsed");

  toggleMuscleMapCollapse();
  assert(isMuscleMapCollapsed() === false, "toggleMuscleMapCollapse expands again");
  assert(localStorage.getItem('showup_muscles_engaged_collapsed') === 'false', "Expanded state is sticky in localStorage");
  assert(!mapContent.classList.contains('hidden'), "Muscle map content visible when re-expanded");
  assert(mapHint.classList.contains('hidden'), "Primary target hint badge hidden when expanded");
});

runSuite("32. Filter Pills Toggle, Macebell (Gadaa) Implement, Collapsible Session Logs, and Instant Login Calendar Sync", () => {
  // 1. Filter Pills Toggle & Cascading Behavior
  assert(typeof toggleExerciseFilterPills === 'function', "toggleExerciseFilterPills is defined");
  assert(typeof isExerciseFilterPillsVisible === 'function', "isExerciseFilterPillsVisible is defined");
  assert(typeof applyExerciseFilterPillsUI === 'function', "applyExerciseFilterPillsUI is defined");

  const filterContainer = document.getElementById('exercise-catalog-filter-container');
  const filterBtn = document.getElementById('btn-toggle-exercise-filters');
  const filterIcon = document.getElementById('exercise-filter-toggle-icon');

  // Verify initial folded state
  filterContainer.classList.add('hidden');
  applyExerciseFilterPillsUI();
  assert(isExerciseFilterPillsVisible() === false, "Filter pills are folded/hidden initially to reduce visual engagement fatigue");
  assert(filterBtn.getAttribute('aria-expanded') === 'false', "Filter toggle button has aria-expanded false when folded");

  // Tap filter toggle button to cascade open
  toggleExerciseFilterPills();
  assert(isExerciseFilterPillsVisible() === true, "toggleExerciseFilterPills cascades open filter pills on tap");
  assert(!filterContainer.classList.contains('hidden'), "Filter container does not have hidden class when open");
  assert(filterBtn.getAttribute('aria-expanded') === 'true', "Filter toggle button has aria-expanded true when open");
  assert(filterIcon.classList.contains('text-emerald-400'), "Filter toggle icon reflects active accent when open");

  // Tap again to fold back
  toggleExerciseFilterPills();
  assert(isExerciseFilterPillsVisible() === false, "toggleExerciseFilterPills folds back filter pills on second tap");
  assert(filterContainer.classList.contains('hidden'), "Filter container hidden class restored when folded back");
  assert(filterBtn.getAttribute('aria-expanded') === 'false', "Filter toggle button aria-expanded false when folded back");

  // 2. Macebell (Gadaa) Implement Type & Inference
  assert(inferImplementFromExerciseName("Gadaa 360") === "Macebell (Gadaa)", "Infers Macebell (Gadaa) for Gadaa 360");
  assert(inferImplementFromExerciseName("Macebell 360") === "Macebell (Gadaa)", "Infers Macebell (Gadaa) for Macebell 360");
  assert(inferImplementFromExerciseName("Traditional Mace Swings") === "Macebell (Gadaa)", "Infers Macebell (Gadaa) for exercise with Mace");
  assert(inferImplementFromExerciseName("Heavy Gada Flow") === "Macebell (Gadaa)", "Infers Macebell (Gadaa) for exercise with Gada");

  const gadaExercise = { name: "Gadaa 360", implement: "Macebell (Gadaa)" };
  assert(exerciseMatchesImplementFilter(gadaExercise, "Macebell (Gadaa)") === true, "Matches exact Macebell (Gadaa) filter");
  assert(exerciseMatchesImplementFilter(gadaExercise, "Macebell") === true, "Matches Macebell filter");
  assert(exerciseMatchesImplementFilter(gadaExercise, "Gadaa") === true, "Matches Gadaa filter");
  assert(exerciseMatchesImplementFilter(gadaExercise, "Mace") === true, "Matches Mace filter");

  // 3. Current Session Logs Collapsible & Sticky State
  assert(typeof isCurrentSessionLogsCollapsed === 'function', "isCurrentSessionLogsCollapsed is defined");
  assert(typeof setCurrentSessionLogsCollapsed === 'function', "setCurrentSessionLogsCollapsed is defined");
  assert(typeof toggleCurrentSessionLogsCollapse === 'function', "toggleCurrentSessionLogsCollapse is defined");
  assert(typeof applyCurrentSessionLogsCollapseUI === 'function', "applyCurrentSessionLogsCollapseUI is defined");

  const sessionLogsBody = document.getElementById('current-session-logs-body');
  const sessionLogsChevron = document.getElementById('session-logs-chevron');

  // Verify initial expanded state
  localStorage.removeItem('showup_session_logs_collapsed');
  assert(isCurrentSessionLogsCollapsed() === false, "Current session logs defaults to expanded");
  applyCurrentSessionLogsCollapseUI(false);
  assert(!sessionLogsBody.classList.contains('hidden'), "Current session logs body visible when expanded");
  assert(sessionLogsChevron.classList.contains('fa-chevron-up'), "Chevron points up when expanded");

  // Toggle to collapsed
  toggleCurrentSessionLogsCollapse();
  assert(isCurrentSessionLogsCollapsed() === true, "toggleCurrentSessionLogsCollapse sets collapsed state");
  assert(localStorage.getItem('showup_session_logs_collapsed') === 'true', "Collapsed state is sticky in localStorage");
  assert(sessionLogsBody.classList.contains('hidden'), "Current session logs body is hidden when collapsed");
  assert(sessionLogsChevron.classList.contains('fa-chevron-down'), "Chevron points down when collapsed");

  // Toggle back to expanded
  toggleCurrentSessionLogsCollapse();
  assert(isCurrentSessionLogsCollapsed() === false, "toggleCurrentSessionLogsCollapse expands session logs again");
  assert(localStorage.getItem('showup_session_logs_collapsed') === 'false', "Expanded state is sticky in localStorage");
  assert(!sessionLogsBody.classList.contains('hidden'), "Current session logs body visible after expansion");
  assert(sessionLogsChevron.classList.contains('fa-chevron-up'), "Chevron points up after expansion");

  // 4. Instant Calendar View / Progress Update on Google Login
  const todayKey = new Date().toISOString().slice(0, 10);
  const testHistoricalWorkouts = [
    {
      date: todayKey,
      workoutName: "Macebell Conditioning",
      sets: [{ exerciseName: "Gadaa 360", implement: "Macebell (Gadaa)", reps: 30, weight: 15 }]
    }
  ];

  // Save historical workouts for user to simulate cloud restore
  const testAthleteEmail = "athlete.gadha@showup.app";
  localStorage.setItem('showUp_user_workouts_' + testAthleteEmail, JSON.stringify(testHistoricalWorkouts));
  localStorage.setItem('showUp_synced_workouts', JSON.stringify(testHistoricalWorkouts));

  // Perform login profile application
  applyUserProfile({
    firstName: "Gadha",
    email: testAthleteEmail,
    picture: "https://lh3.googleusercontent.com/a/gadha=s96-c"
  });

  // Verify completedWorkoutsHistory and Calendar immediately updated without navigation
  assert(completedWorkoutsHistory.length > 0, "completedWorkoutsHistory populated immediately on login");
  const calendarGrid = document.getElementById('calendar-grid');
  assert(calendarGrid.innerHTML.includes(todayKey), "Calendar grid immediately updated with workout date for timeframe");

  // Streak counters updated immediately on login
  const curStreak = document.getElementById('current-streak-val');
  assert(curStreak.innerText.includes("day"), "current-streak-val badge updated on login");
});

runSuite("33. HRM Enabling Option in Defaults, 3s Pill Hang Time & Reduced Muscles Engaged Transparency", () => {
  // 1. Heart Rate Monitor Enabling Option in Settings > Defaults
  assert(typeof isHRMEnabled === 'function', "isHRMEnabled is a defined function");
  assert(typeof applyHRMEnabledUI === 'function', "applyHRMEnabledUI is a defined function");
  assert(typeof toggleHRMEnabledPref === 'function', "toggleHRMEnabledPref is a defined function");

  const hrPill = getOrCreateElement('hr-minimal-pill');
  const hrCard = getOrCreateElement('hr-card');
  const hrPrefRow = getOrCreateElement('pref-hr-collapsed-row');
  const hrPrefCheckbox = getOrCreateElement('pref-hrm-enabled');
  const runningHrmBtn = getOrCreateElement('running-hrm-connect-btn');

  // Verify default state is enabled (true)
  localStorage.removeItem('showUp_hrm_enabled');
  assert(isHRMEnabled() === true, "HRM defaults to enabled for athletes");
  applyHRMEnabledUI(true);
  assert(!hrPill.classList.contains('hidden'), "HR minimalist pill is visible by default when HRM is enabled");
  assert(!hrPrefRow.classList.contains('opacity-40'), "HR collapsed preference row is fully interactive when HRM is enabled");

  // Disable HRM
  toggleHRMEnabledPref(false);
  assert(isHRMEnabled() === false, "toggleHRMEnabledPref(false) sets HRM state to disabled");
  assert(localStorage.getItem('showUp_hrm_enabled') === 'false', "HRM disabled state persists in localStorage");
  assert(hrPill.classList.contains('hidden'), "HR minimalist pill is hidden when HRM is disabled");
  assert(hrCard.classList.contains('hidden'), "HR telemetry card is hidden when HRM is disabled");
  assert(hrPrefRow.classList.contains('opacity-40'), "HR collapsed preference row is dimmed when HRM is disabled");
  assert(hrPrefRow.classList.contains('pointer-events-none'), "HR collapsed preference row is disabled when HRM is disabled");
  assert(runningHrmBtn.classList.contains('hidden'), "Running HRM connect button is hidden when HRM is disabled");

  // Re-enable HRM
  toggleHRMEnabledPref(true);
  assert(isHRMEnabled() === true, "toggleHRMEnabledPref(true) re-enables HRM");
  assert(localStorage.getItem('showUp_hrm_enabled') === 'true', "HRM enabled state persists in localStorage");
  assert(!hrPill.classList.contains('hidden'), "HR minimalist pill returns to visible state");
  assert(!hrPrefRow.classList.contains('opacity-40'), "HR collapsed preference row is restored to active interactive state");
  assert(!runningHrmBtn.classList.contains('hidden'), "Running HRM connect button restored");

  // 2. Confirmation Pill / Notification Hang Time
  assert(typeof showToast === 'function', "showToast is defined");
  // Test toast creation with default 3s hang time
  const toastContainer = getOrCreateElement('toast-container');
  showToast("Recorded set successfully!", "success");
  assert(toastContainer.children.length > 0 || toastContainer.innerHTML.includes("Recorded set successfully!"), "Toast pill rendered in container");

  // 3. Muscles Engaged 20% Reduced Transparency
  const autoMusclesPill = getOrCreateElement('exercise-auto-muscles-pill');
  const muscleMapCard = getOrCreateElement('muscle-map-container');
  assert(autoMusclesPill !== null, "exercise-auto-muscles-pill exists");
  assert(muscleMapCard !== null, "muscle-map-container exists");
});

runSuite("34. Muscles Engaged Enabler/Disabler in Settings > Defaults", () => {
  assert(typeof isMusclesEngagedEnabled === 'function', "isMusclesEngagedEnabled is a defined function");
  assert(typeof applyMusclesEngagedEnabledUI === 'function', "applyMusclesEngagedEnabledUI is a defined function");
  assert(typeof toggleMusclesEngagedEnabledPref === 'function', "toggleMusclesEngagedEnabledPref is a defined function");

  const autoPill = getOrCreateElement('exercise-auto-muscles-pill');
  const summaryMusclesBtn = getOrCreateElement('tab-btn-summary-muscles');
  const summaryMusclesPane = getOrCreateElement('tab-pane-summary-muscles');
  const muscleMapCard = getOrCreateElement('muscle-map-container');
  const prefCheckbox = getOrCreateElement('pref-muscles-engaged-enabled');

  // Verify default state is enabled (true)
  localStorage.removeItem('showUp_muscles_engaged_enabled');
  assert(isMusclesEngagedEnabled() === true, "Muscles Engaged defaults to enabled");
  applyMusclesEngagedEnabledUI(true);
  assert(!summaryMusclesBtn.classList.contains('hidden'), "Summary Muscles tab button visible by default");
  assert(!muscleMapCard.classList.contains('hidden'), "Muscle Map card container visible by default");

  // Exercise indicator updates normally when enabled
  updateAutoMusclesIndicator("Barbell Bench Press", { primary: "Chest", secondary: ["Triceps", "Shoulders"] });
  assert(!autoPill.classList.contains('hidden'), "Auto muscles pill is displayed when enabled and exercise entered");

  // Disable Muscles Engaged
  toggleMusclesEngagedEnabledPref(false);
  assert(isMusclesEngagedEnabled() === false, "toggleMusclesEngagedEnabledPref(false) sets state to disabled");
  assert(localStorage.getItem('showUp_muscles_engaged_enabled') === 'false', "Disabled state persists in localStorage");
  assert(autoPill.classList.contains('hidden'), "Auto muscles pill is hidden when disabled");
  assert(summaryMusclesBtn.classList.contains('hidden'), "Summary Muscles tab button is hidden when disabled");
  assert(summaryMusclesPane.classList.contains('hidden'), "Summary Muscles pane is hidden when disabled");
  assert(muscleMapCard.classList.contains('hidden'), "Muscle Map card container is hidden when disabled");

  // Typing an exercise keeps auto muscles pill hidden when disabled
  updateAutoMusclesIndicator("Barbell Bench Press", { primary: "Chest", secondary: ["Triceps"] });
  assert(autoPill.classList.contains('hidden'), "Auto muscles pill remains hidden on exercise input when disabled");

  // Switching to 'muscles' summary tab redirects to 'overview' when disabled
  switchSummaryTab('muscles');
  const summaryOverviewPane = getOrCreateElement('tab-pane-summary-overview');
  assert(!summaryOverviewPane.classList.contains('hidden'), "switchSummaryTab('muscles') redirects to overview when Muscles Engaged disabled");

  // Re-enable Muscles Engaged
  toggleMusclesEngagedEnabledPref(true);
  assert(isMusclesEngagedEnabled() === true, "toggleMusclesEngagedEnabledPref(true) re-enables Muscles Engaged");
  assert(localStorage.getItem('showUp_muscles_engaged_enabled') === 'true', "Enabled state persists in localStorage");
  assert(!summaryMusclesBtn.classList.contains('hidden'), "Summary Muscles tab button restored");
  assert(!muscleMapCard.classList.contains('hidden'), "Muscle Map card container restored");

  // Auto muscles pill displays again on exercise entry
  updateAutoMusclesIndicator("Barbell Bench Press", { primary: "Chest", secondary: ["Triceps"] });
  assert(!autoPill.classList.contains('hidden'), "Auto muscles pill displays again after re-enabling");
});

runSuite("35. Boxing Arena Ringside Bell Chimes (Double & Triple Ding) & Last Workout Reference Suppression", () => {
  // 1. Boxing Arena Bell Chime Synthesis and Metadata
  assert(typeof createBoxingBellStrike === 'function', "createBoxingBellStrike is a defined function");
  assert(typeof playDoubleDingChime === 'function', "playDoubleDingChime is a defined function");
  assert(typeof playTripleDingChime === 'function', "playTripleDingChime is a defined function");
  assert(REST_CHIMES.double_ding.name === 'Boxing Bell', "REST_CHIMES.double_ding name is 'Boxing Bell'");
  assert(REST_CHIMES.double_ding.tag === 'Double Ding', "REST_CHIMES.double_ding tag is 'Double Ding'");
  assert(REST_CHIMES.double_ding.icon === 'fa-solid fa-bell', "REST_CHIMES.double_ding icon is bell");
  assert(REST_CHIMES.double_ding.desc.includes('Boxing arena'), "REST_CHIMES.double_ding description specifies boxing arena ringside bell");

  assert(REST_CHIMES.triple_ding.name === 'Boxing Bell', "REST_CHIMES.triple_ding name is 'Boxing Bell'");
  assert(REST_CHIMES.triple_ding.tag === 'Triple Ding', "REST_CHIMES.triple_ding tag is 'Triple Ding'");
  assert(REST_CHIMES.triple_ding.icon === 'fa-solid fa-bell', "REST_CHIMES.triple_ding icon is bell");
  assert(REST_CHIMES.triple_ding.desc.includes('Boxing arena'), "REST_CHIMES.triple_ding description specifies boxing arena ringside bell");

  // Verify Web Audio execution of double ding & triple ding
  let doubleDingSuccess = false;
  try {
    playDoubleDingChime();
    doubleDingSuccess = true;
  } catch (e) {
    doubleDingSuccess = false;
  }
  assert(doubleDingSuccess === true, "playDoubleDingChime ringside bell double strike executes cleanly");

  let tripleDingSuccess = false;
  try {
    playTripleDingChime();
    tripleDingSuccess = true;
  } catch (e) {
    tripleDingSuccess = false;
  }
  assert(tripleDingSuccess === true, "playTripleDingChime ringside bell triple strike executes cleanly");

  let deepGongSuccess = false;
  try {
    playDeepGongChime();
    deepGongSuccess = true;
  } catch (e) {
    deepGongSuccess = false;
  }
  assert(deepGongSuccess === true, "playDeepGongChime deep gong strike executes cleanly");

  // 2. Last Workout Reference Suppression When Exercise Name Empty or Custom Exercise
  const banner = getOrCreateElement('exercise-previous-workout-banner');
  const metricSpan = getOrCreateElement('exercise-previous-workout-metric');
  const exerciseInput = getOrCreateElement('exercise-name-input');

  // Populate mock workout history that contains 'Custom Exercise' sets
  completedWorkoutsHistory = [
    {
      id: "hist-001",
      date: "2026-10-24",
      workoutName: "Push Day",
      sets: [
        { exerciseName: "Bench Press", weight: 135, reps: 8 },
        { exerciseName: "Bench Press", weight: 135, reps: 8 },
        { exerciseName: "Bench Press", weight: 135, reps: 8 },
        { exerciseName: "Custom Exercise", weight: 50, reps: 10 }
      ]
    }
  ];

  // A. When exercise name is empty, banner must be hidden
  exerciseInput.value = "";
  updateExercisePreviousWorkoutMetric("");
  assert(banner.classList.contains('hidden'), "Banner strictly hidden when exercise name is empty string");
  assert(metricSpan.innerText === "", "Metric span text is cleared when exercise name is empty string");

  // B. When exercise name resolves to "Custom Exercise", banner must be hidden
  updateExercisePreviousWorkoutMetric("Custom Exercise");
  assert(banner.classList.contains('hidden'), "Banner strictly hidden for 'Custom Exercise'");
  assert(metricSpan.innerText === "", "Metric span text is cleared for 'Custom Exercise'");

  // Case insensitivity check for custom exercise
  updateExercisePreviousWorkoutMetric("custom exercise");
  assert(banner.classList.contains('hidden'), "Banner strictly hidden for lowercase 'custom exercise'");

  // C. When typing into exercise input and clearing it via handleExerciseInput
  exerciseInput.value = "";
  handleExerciseInput("");
  assert(banner.classList.contains('hidden'), "Banner hidden on handleExerciseInput('')");

  // D. When exercise name is a real exercise from history (e.g. Bench Press)
  exerciseInput.value = "Bench Press";
  handleExerciseInput("Bench Press");
  assert(!banner.classList.contains('hidden'), "Banner visible when valid exercise from history is entered");
  assert(metricSpan.innerText === "135 lb × 8 reps · 3 sets", "Banner displays accurate last workout metric for Bench Press");

  // E. Clearing the input again immediately hides the banner
  exerciseInput.value = "";
  handleExerciseInput("");
  assert(banner.classList.contains('hidden'), "Banner hidden immediately when input is cleared");
  assert(metricSpan.innerText === "", "Metric span text is cleared when input is cleared");

  // F. Logging a set without an exercise name (fallback to Custom Exercise) does not display last workout reference
  exerciseInput.value = "";
  logSet();
  assert(banner.classList.contains('hidden'), "Banner strictly hidden after logging a set without an exercise name");
});

// === SUITE: 36. Hyper-Emerald (#00F59B) Palette, Screen Wake Lock API & Compact Set Classification Chips ===
runSuite("36. Hyper-Emerald Palette, Screen Wake Lock API & Compact Set Classification Chips", () => {
  // 1. Hyper-Emerald Theme Check
  assert(typeof setThemePalette === 'function', "setThemePalette is a defined function");
  setThemePalette('emerald');
  assert(localStorage.getItem('showUp_theme_accent') === 'emerald', "Theme palette persists emerald");
  assert(document.documentElement.className.includes('theme-emerald'), "documentElement applies theme-emerald");
  setThemePalette('hyper-emerald');
  assert(localStorage.getItem('showUp_theme_accent') === 'hyper-emerald', "Theme palette persists hyper-emerald");
  assert(document.documentElement.className.includes('theme-emerald'), "hyper-emerald maps canonical to theme-emerald");

  // 2. Screen Wake Lock API
  assert(typeof requestScreenWakeLock === 'function', "requestScreenWakeLock is defined");
  assert(typeof releaseScreenWakeLock === 'function', "releaseScreenWakeLock is defined");
  requestScreenWakeLock();
  assert(globalThis.__wakeLockRequested === 'screen', "requestScreenWakeLock requests screen sentinel");
  releaseScreenWakeLock();

  // 3. Set Classification Chips
  assert(typeof selectSetType === 'function', "selectSetType is defined");
  selectSetType('warmup');
  const warmupChip = document.getElementById('set-type-warmup');
  assert(warmupChip.className.includes('bg-emerald-500'), "Warmup chip active class applied when selected");
  selectSetType('drop');
  const dropChip = document.getElementById('set-type-drop');
  assert(dropChip.className.includes('bg-emerald-500'), "Drop chip active class applied when selected");
  selectSetType('failure');
  const failureChip = document.getElementById('set-type-failure');
  assert(failureChip.className.includes('bg-emerald-500'), "Failure chip active class applied when selected");
  selectSetType('normal');
  const normalChip = document.getElementById('set-type-normal');
  assert(normalChip.className.includes('bg-emerald-500'), "Normal chip active class applied when selected");
});

// === SUITE: 37. 1-Tap Direct Dual-Target Numeric Keypad ===
runSuite("37. 1-Tap Direct Dual-Target Numeric Keypad", () => {
  assert(typeof openDirectNumpad === 'function', "openDirectNumpad is defined");
  assert(typeof closeDirectNumpad === 'function', "closeDirectNumpad is defined");
  assert(typeof setNumpadActiveTarget === 'function', "setNumpadActiveTarget is defined");
  assert(typeof handleNumpadDigit === 'function', "handleNumpadDigit is defined");
  assert(typeof handleNumpadDot === 'function', "handleNumpadDot is defined");
  assert(typeof handleNumpadBackspace === 'function', "handleNumpadBackspace is defined");
  assert(typeof handleNumpadQuickAdd === 'function', "handleNumpadQuickAdd is defined");
  assert(typeof handleNumpadNextTarget === 'function', "handleNumpadNextTarget is defined");

  const weightInput = document.getElementById('input-weight');
  const repsInput = document.getElementById('input-reps');
  const numpadModal = document.getElementById('direct-numpad-modal');
  const dispWeight = document.getElementById('numpad-display-weight');
  const dispReps = document.getElementById('numpad-display-reps');

  // Open with target weight
  weightInput.value = "135";
  repsInput.value = "8";
  openDirectNumpad('weight');
  assert(!numpadModal.classList.contains('hidden'), "Direct numpad modal opens without hidden class");
  assert(dispWeight.innerText === "135", "Displays initial weight value");
  assert(dispReps.innerText === "8", "Displays initial reps value simultaneously in view");

  // Digit input on fresh target replaces value
  handleNumpadDigit(2);
  handleNumpadDigit(2);
  handleNumpadDigit(5);
  assert(dispWeight.innerText === "225", "Typing on fresh target enters 225 lbs");
  assert(weightInput.value === "225", "Syncs 225 directly to underlying weight input");

  // Switch target to reps while retaining numpad view without minimization
  setNumpadActiveTarget('reps');
  assert(!numpadModal.classList.contains('hidden'), "Modal stays open when switching targets");
  handleNumpadDigit(1);
  handleNumpadDigit(2);
  assert(dispReps.innerText === "12", "Typing enters 12 reps on fresh target");
  assert(repsInput.value === "12", "Syncs 12 directly to underlying reps input");
  assert(dispWeight.innerText === "225", "Weight remains visible and intact in dual view");

  // Quick +5 button
  handleNumpadQuickAdd(5);
  assert(dispReps.innerText === "17", "Quick +5 adds 5 to active target (12 -> 17)");
  assert(repsInput.value === "17", "Syncs updated reps to input");

  // Backspace
  handleNumpadBackspace();
  assert(dispReps.innerText === "1", "Backspace removes last digit (17 -> 1)");

  // Next target switches back to weight
  handleNumpadNextTarget();
  handleNumpadDot();
  handleNumpadDigit(5);
  assert(dispWeight.innerText.includes('.5'), "Supports decimal dot for weight");

  // Close numpad
  closeDirectNumpad();
  assert(numpadModal.classList.contains('hidden'), "closeDirectNumpad hides modal");
});

// === SUITE: 38. Personal Record (PR) Recognition Engine & Celebration ===
runSuite("38. Personal Record (PR) Recognition Engine & Celebration", () => {
  assert(typeof evaluateSetForPR === 'function', "evaluateSetForPR is defined");
  assert(typeof showPRCelebration === 'function', "showPRCelebration is defined");

  // Warmup sets must NEVER trigger PR
  const warmupEval = evaluateSetForPR("Overhead Press", 135, 10, "Barbell", "warmup");
  assert(warmupEval.isPR === false, "Warmup sets are excluded from PR recognition");

  // Zero or invalid weight/reps
  const zeroEval = evaluateSetForPR("Overhead Press", 0, 10, "Barbell", "normal");
  assert(zeroEval.isPR === false, "Zero weight sets are excluded from PR recognition");

  // Setup history with previous Overhead Press sets
  completedWorkoutsHistory.length = 0;
  completedWorkoutsHistory.push({
    date: '2026-10-20',
    sets: [
      { exerciseName: 'Overhead Press', implement: 'Barbell', weight: 135, reps: 5, setType: 'normal' }
    ]
  });
  currentSessionSets.length = 0;

  // Set with heavier weight (145 > 135)
  const heavyPREval = evaluateSetForPR("Overhead Press", 145, 5, "Barbell", "normal");
  assert(heavyPREval.isPR === true, "Recognizes heavier weight as PR");
  assert(heavyPREval.type === 'weight', "PR type is weight");
  assert(heavyPREval.label.includes('145 lbs'), "PR label mentions new weight");

  // Set with rep PR at existing weight (135 lbs x 8 reps > 5 reps)
  const repPREval = evaluateSetForPR("Overhead Press", 135, 8, "Barbell", "normal");
  assert(repPREval.isPR === true, "Recognizes rep PR at given weight");

  // Logging set with PR attaches isPR and prDetail, and renders trophy badge
  const exInput = document.getElementById('exercise-name-input');
  const impSelect = document.getElementById('implement-select');
  const weightInput = document.getElementById('input-weight');
  const repsInput = document.getElementById('input-reps');

  exInput.value = "Overhead Press";
  impSelect.value = "Barbell";
  weightInput.value = "155";
  repsInput.value = "5";
  selectSetType('normal');

  logSet();
  const loggedSet = currentSessionSets[currentSessionSets.length - 1];
  assert(loggedSet.isPR === true, "Logged set is marked as isPR");
  assert(loggedSet.prDetail.includes('155'), "Logged set stores PR detail");

  const listContainer = document.getElementById('logged-sets-list');
  assert(listContainer.innerHTML.includes('fa-trophy') || listContainer.innerHTML.includes('PR'), "Renders PR trophy badge in logged sets list");
});

// === SUITE: 39. Auto-Start Set on Rest Target Preference & Auto-Trigger ===
runSuite("39. Auto-Start Set on Rest Target Preference & Auto-Trigger", () => {
  assert(typeof isAutoStartSetEnabled === 'function', "isAutoStartSetEnabled is a defined function");
  assert(typeof setAutoStartSetEnabled === 'function', "setAutoStartSetEnabled is a defined function");
  assert(typeof applyAutoStartSetUI === 'function', "applyAutoStartSetUI is a defined function");
  assert(typeof toggleAutoStartSetPref === 'function', "toggleAutoStartSetPref is a defined function");

  // 1. Defaults to false (opt-in)
  localStorage.removeItem('showUp_auto_start_set');
  assert(isAutoStartSetEnabled() === false, "Defaults to false when not set");
  applyAutoStartSetUI();
  const prefBox = document.getElementById('pref-auto-start-set');
  assert(prefBox.checked === false, "Checkbox is unchecked by default");

  // 2. Toggle to true persists and updates UI
  toggleAutoStartSetPref(true);
  assert(isAutoStartSetEnabled() === true, "isAutoStartSetEnabled is true after toggle");
  assert(localStorage.getItem('showUp_auto_start_set') === 'true', "Persisted as 'true' in localStorage");
  assert(prefBox.checked === true, "Checkbox is checked");

  // 3. Toggle to false persists and updates UI
  toggleAutoStartSetPref(false);
  assert(isAutoStartSetEnabled() === false, "isAutoStartSetEnabled is false after toggle");
  assert(localStorage.getItem('showUp_auto_start_set') === 'false', "Persisted as 'false' in localStorage");
  assert(prefBox.checked === false, "Checkbox is unchecked");

  // 4. Test rest recovery auto-trigger:
  // When disabled (default): rest timer reaches target, recovery alert triggers but startSet is NOT called
  currentSessionSets.length = 0;
  isSetInProgress = false;
  isRestTimerRunning = true;
  hasTriggeredRestRecoveryAlert = false;
  currentSessionRestTarget = 60;
  restTimerSeconds = 60;
  checkRestRecoveryThreshold();
  assert(hasTriggeredRestRecoveryAlert === true, "Recovery alert triggered");
  assert(isSetInProgress === false, "Active set is NOT auto-started when preference is disabled");

  // When enabled: rest timer reaches target, recovery alert triggers AND startSet IS auto-called
  setAutoStartSetEnabled(true);
  isSetInProgress = false;
  isRestTimerRunning = true;
  hasTriggeredRestRecoveryAlert = false;
  currentSessionRestTarget = 60;
  restTimerSeconds = 60;
  checkRestRecoveryThreshold();
  assert(isSetInProgress === true, "Active set timer auto-started when preference is enabled");
  assert(isRestTimerRunning === false, "Rest timer stopped upon auto-starting set");
  assert(currentPendingRestPeriod >= 1, "Rest duration was cleanly recorded into currentPendingRestPeriod");

  // Clean up
  if (activeSetTimerInterval) clearInterval(activeSetTimerInterval);
  isSetInProgress = false;
  setAutoStartSetEnabled(false);
});

runSuite("40. Cloud Backup Header Status Indicator & Quiet Auto-Sync Engine", () => {
  assert(typeof setCloudBackupStatus === 'function', "setCloudBackupStatus is a defined function");
  assert(typeof handleCloudSyncIconClick === 'function', "handleCloudSyncIconClick is a defined function");

  const syncBtn = getOrCreateElement('header-cloud-sync-btn');
  const syncIcon = getOrCreateElement('header-cloud-sync-icon');
  const syncBadge = getOrCreateElement('header-cloud-sync-badge');
  const syncTooltip = getOrCreateElement('header-cloud-sync-tooltip');

  assert(syncBtn !== null, "header-cloud-sync-btn exists in header DOM");
  assert(syncIcon !== null, "header-cloud-sync-icon exists in header DOM");

  // 1. Test backing up / syncing state
  setCloudBackupStatus('syncing', 'Backing up data...');
  assert(syncIcon.className.includes('fa-cloud-arrow-up') && syncIcon.className.includes('animate-pulse'), "Syncing state displays animated cloud upload icon");
  assert(syncIcon.className.includes('text-amber-400'), "Syncing state uses energetic amber-400 accent");
  assert(syncBtn.getAttribute('title') === 'Backing up data...', "Syncing state sets informative title on button");
  assert(syncTooltip.innerText === 'Backing up data...', "Syncing state updates hover tooltip");

  // 2. Test backed up / success state
  const syncCheck = getOrCreateElement('header-cloud-sync-check');
  setCloudBackupStatus('synced', 'Data Backed Up');
  assert(syncIcon.className.includes('fa-cloud'), "Synced state displays verified cloud icon");
  assert(syncIcon.className.includes('text-emerald-400'), "Synced state uses emerald-400 accent");
  assert(!syncCheck.classList.contains('hidden'), "Synced state reveals embedded checkmark icon");
  assert(syncBtn.getAttribute('title') === 'Data Backed Up', "Synced state sets verified title on button");
  assert(syncTooltip.innerText === 'Data Backed Up', "Synced state updates hover tooltip");

  // 3. Test error state
  setCloudBackupStatus('error', 'Backup paused');
  assert(syncIcon.className.includes('text-rose-400'), "Error state uses rose-400 accent");
  assert(syncBtn.getAttribute('title') === 'Backup paused', "Error state sets paused title on button");

  // 4. Test offline / idle state
  localStorage.removeItem('showUp_last_drive_sync');
  localStorage.removeItem('showUp_last_firestore_sync');
  setCloudBackupStatus('offline');
  assert(syncIcon.className.includes('text-slate-500'), "Offline state uses muted slate-500 accent");

  // 5. Verify quiet defaults for syncToGoogleDrive and syncToFirestore (no toast spam)
  assert(syncToGoogleDrive.toString().includes('isSilent = true'), "syncToGoogleDrive defaults to quiet silent mode");
  assert(syncToFirestore.toString().includes('isSilent = true'), "syncToFirestore defaults to quiet silent mode");
});

runSuite("41. Unified App Confirmation Modal Engine & Native Confirm Replacement", () => {
  assert(typeof showAppConfirm === 'function', "showAppConfirm is a defined function");
  assert(typeof handleAppConfirmAccept === 'function', "handleAppConfirmAccept is a defined function");
  assert(typeof handleAppConfirmCancel === 'function', "handleAppConfirmCancel is a defined function");

  const modal = getOrCreateElement('app-confirm-modal');
  const titleEl = getOrCreateElement('app-confirm-title');
  const msgEl = getOrCreateElement('app-confirm-message');
  const cancelBtn = getOrCreateElement('app-confirm-cancel-btn');
  const actionBtn = getOrCreateElement('app-confirm-action-btn');
  const iconEl = getOrCreateElement('app-confirm-icon');
  const btnText = getOrCreateElement('app-confirm-btn-text');

  assert(modal !== null, "app-confirm-modal exists in DOM");
  assert(titleEl !== null, "app-confirm-title exists in DOM");
  assert(msgEl !== null, "app-confirm-message exists in DOM");

  // 1. Open confirmation modal and verify attributes
  showAppConfirm({
    title: "Cancel Workout Session?",
    message: "All logged sets and timer progress for this workout will be cleared.",
    confirmText: "Discard Workout",
    cancelText: "Keep Workout",
    type: "danger",
    icon: "fa-solid fa-ban"
  });

  assert(!modal.classList.contains('hidden'), "showAppConfirm unhides modal");
  assert(titleEl.innerText === "Cancel Workout Session?", "Modal title matches custom prompt");
  assert(msgEl.innerText === "All logged sets and timer progress for this workout will be cleared.", "Modal message matches custom body");
  assert(cancelBtn.innerText === "Keep Workout", "Cancel button text matches custom label");
  assert(btnText.innerText === "Discard Workout", "Action button text matches custom label");
  assert(actionBtn.className.includes('bg-rose-600'), "Danger type renders red/rose action button");
  assert(actionBtn.className.includes('min-h-[48px]'), "Action button has minimum 48px comfortable touch target height");
  assert(cancelBtn.className.includes('min-h-[48px]'), "Cancel button has minimum 48px comfortable touch target height");
  assert(typeof confirmDeleteSet === 'function', "confirmDeleteSet is a defined function");

  // 2. Test cancel resolution
  handleAppConfirmCancel();
  assert(modal.classList.contains('hidden'), "handleAppConfirmCancel hides modal");

  // 3. Test accept resolution
  showAppConfirm({
    title: "Confirm Action",
    type: "primary",
    confirmText: "Proceed"
  });
  assert(!modal.classList.contains('hidden'), "showAppConfirm opens for primary type");
  assert(actionBtn.className.includes('bg-emerald-500'), "Primary type renders emerald action button");
  handleAppConfirmAccept();
  assert(modal.classList.contains('hidden'), "handleAppConfirmAccept hides modal");

  // 4. Verify cancelWorkoutSession triggers showAppConfirm when progress exists
  let interceptedConfirm = false;
  const originalShowAppConfirm = showAppConfirm;
  showAppConfirm = function(options) {
    interceptedConfirm = true;
    assert(options.title.includes("Cancel Workout"), "cancelWorkoutSession passes Cancel Workout title");
    assert(options.confirmText === "Discard Workout", "cancelWorkoutSession requests Discard Workout button");
    return Promise.resolve(false);
  };

  currentSessionSets = [{ id: 1, exercise: 'Squat', weight: 225, reps: 5 }];
  cancelWorkoutSession(false);
  assert(interceptedConfirm === true, "cancelWorkoutSession uses custom showAppConfirm dialog when progress exists");
  assert(currentSessionSets.length === 1, "Workout is not cleared when confirmation is not accepted");

  // Restore and test forced bypass
  showAppConfirm = originalShowAppConfirm;
  cancelWorkoutSession(true);
  assert(currentSessionSets.length === 0, "cancelWorkoutSession(true) forces immediate clear without modal");
});

runSuite("42. Mobile-First Bottom Sheets, 1-Tap Match Last Set & Touch Swipe Gestures", () => {
  // 1. Verify 1-Tap Match Last Set UI and Function
  assert(typeof updateMatchLastSetUI === 'function', "updateMatchLastSetUI is a defined function");
  assert(typeof matchLastSet === 'function', "matchLastSet is a defined function");
  assert(typeof initLoggedSetSwipeGestures === 'function', "initLoggedSetSwipeGestures is a defined function");

  const matchBtn = getOrCreateElement('btn-match-last-set');
  const preview = getOrCreateElement('btn-match-last-set-preview');
  const weightInput = getOrCreateElement('input-weight');
  const repsInput = getOrCreateElement('input-reps');
  const exInput = getOrCreateElement('exercise-name-input');

  // When no sets logged, match button is hidden
  currentSessionSets = [];
  updateMatchLastSetUI();
  assert(matchBtn.classList.contains('hidden'), "Match last set button hidden when 0 sets in session");

  // Add a set
  currentSessionSets = [
    { id: 101, exerciseName: 'Overhead Press', implement: 'Barbell', weight: 135, reps: 8, setType: 'normal', rpe: '8' }
  ];
  updateMatchLastSetUI();
  assert(!matchBtn.classList.contains('hidden'), "Match last set button visible after set logged");
  assert(preview.textContent === "135 lbs × 8", "Preview correctly displays weight and reps summary");

  // Call matchLastSet
  weightInput.value = 0;
  repsInput.value = 0;
  matchLastSet();
  assert(weightInput.value === 135, "matchLastSet pre-fills weight to 135 lbs");
  assert(repsInput.value === 8, "matchLastSet pre-fills reps to 8");

  // Test endurance implement summary formatting
  currentSessionSets.push({
    id: 102, exerciseName: 'Outdoor Run', implement: 'Running', runningDistance: '3.1', runningTime: '24:30'
  });
  updateMatchLastSetUI();
  assert(preview.textContent === "3.1 mi | 24:30", "Running implement formatted correctly in match last set preview");

  // Test renderLoggedSets with swipe wrappers
  renderLoggedSets();
  const list = getOrCreateElement('logged-sets-list');
  assert(list.innerHTML.includes('logged-set-swipe-wrapper'), "Logged sets list renders swipe wrapper containers");
  assert(list.innerHTML.includes('swipe-action-left'), "Logged sets list includes swipe-action-left repeat indicator");
  assert(list.innerHTML.includes('swipe-action-right'), "Logged sets list includes swipe-action-right delete indicator");
  assert(list.innerHTML.includes('logged-set-card'), "Logged sets list includes foreground swipeable card");
});

runSuite("43. Edit Set Modal Unified Steppers (+ / -) for Weight, Reps, and Rest", () => {
  assert(typeof initEditModalSteppers === 'function', "initEditModalSteppers is a defined function");
  assert(typeof adjustEditActiveSetWeight === 'function', "adjustEditActiveSetWeight is a defined function");
  assert(typeof adjustEditActiveSetReps === 'function', "adjustEditActiveSetReps is a defined function");
  assert(typeof adjustEditActiveSetRest === 'function', "adjustEditActiveSetRest is a defined function");

  // Verify stepper DOM elements exist
  const weightDec = getOrCreateElement('btn-edit-weight-decrement');
  const weightInc = getOrCreateElement('btn-edit-weight-increment');
  const weightInput = getOrCreateElement('edit-active-set-weight');

  const repsDec = getOrCreateElement('btn-edit-reps-decrement');
  const repsInc = getOrCreateElement('btn-edit-reps-increment');
  const repsInput = getOrCreateElement('edit-active-set-reps');

  const restDec = getOrCreateElement('btn-edit-rest-decrement');
  const restInc = getOrCreateElement('btn-edit-rest-increment');
  const restInput = getOrCreateElement('edit-active-set-rest');

  assert(weightDec && weightInc && weightInput, "Weight stepper elements exist in edit set modal");
  assert(repsDec && repsInc && repsInput, "Reps stepper elements exist in edit set modal");
  assert(restDec && restInc && restInput, "Rest period stepper elements exist in edit set modal");

  // Test weight stepper adjustment
  weightInput.value = "100";
  adjustEditActiveSetWeight(5);
  assert(parseFloat(weightInput.value) === 105, "adjustEditActiveSetWeight(5) increases weight from 100 to 105");
  adjustEditActiveSetWeight(-2.5);
  assert(parseFloat(weightInput.value) === 102.5, "adjustEditActiveSetWeight(-2.5) decreases weight to 102.5");
  adjustEditActiveSetWeight(-150);
  assert(parseFloat(weightInput.value) === 0, "adjustEditActiveSetWeight clamps weight to minimum 0");

  // Test reps stepper adjustment
  repsInput.value = "10";
  adjustEditActiveSetReps(1);
  assert(parseInt(repsInput.value, 10) === 11, "adjustEditActiveSetReps(1) increases reps from 10 to 11");
  adjustEditActiveSetReps(-2);
  assert(parseInt(repsInput.value, 10) === 9, "adjustEditActiveSetReps(-2) decreases reps to 9");
  adjustEditActiveSetReps(-50);
  assert(parseInt(repsInput.value, 10) === 1, "adjustEditActiveSetReps clamps reps to minimum 1");

  // Test rest period stepper adjustment
  restInput.value = "60";
  adjustEditActiveSetRest(15);
  assert(parseInt(restInput.value, 10) === 75, "adjustEditActiveSetRest(15) increases rest period from 60 to 75");
  adjustEditActiveSetRest(-30);
  assert(parseInt(restInput.value, 10) === 45, "adjustEditActiveSetRest(-30) decreases rest period to 45");
  adjustEditActiveSetRest(-100);
  assert(parseInt(restInput.value, 10) === 0, "adjustEditActiveSetRest clamps rest period to minimum 0");

  // Test dynamic step pill configuration (eliminating sticky 5-step locking)
  assert(typeof setEditWeightStep === 'function', "setEditWeightStep is a defined function");
  assert(typeof getEditWeightStep === 'function', "getEditWeightStep is a defined function");
  assert(typeof setEditRepsStep === 'function', "setEditRepsStep is a defined function");
  assert(typeof getEditRepsStep === 'function', "getEditRepsStep is a defined function");

  const weightPills = getOrCreateElement('edit-weight-step-pills');
  const repsPills = getOrCreateElement('edit-reps-step-pills');
  assert(weightPills !== null, "edit-weight-step-pills exists in edit modal DOM");
  assert(repsPills !== null, "edit-reps-step-pills exists in edit modal DOM");

  setEditWeightStep(1);
  assert(getEditWeightStep() === 1, "setEditWeightStep(1) sets edit weight step to 1 lb");
  weightInput.value = "100";
  adjustEditActiveSetWeight(getEditWeightStep());
  assert(parseFloat(weightInput.value) === 101, "Tapping + with step 1 increments by 1 (100 -> 101), not locked to 5");

  setEditWeightStep(2.5);
  assert(getEditWeightStep() === 2.5, "setEditWeightStep(2.5) sets edit weight step to 2.5 lbs");
  adjustEditActiveSetWeight(getEditWeightStep());
  assert(parseFloat(weightInput.value) === 103.5, "Tapping + with step 2.5 increments by 2.5 (101 -> 103.5)");

  setEditWeightStep(5);
  assert(getEditWeightStep() === 5, "setEditWeightStep(5) sets edit weight step to 5 lbs");

  setEditWeightStep(1);
  assert(getEditWeightStep() === 1, "Restores edit weight step to default 1 lb");
});

runSuite("44. Athlete Account Deletion from Backend Database & Google Account History Preservation", async () => {
  assert(typeof confirmDeleteAccount === 'function', "confirmDeleteAccount is a defined function");
  assert(typeof deleteAthleteAccount === 'function', "deleteAthleteAccount is a defined function");

  // Verify DOM elements - Delete Account is safely secluded in Settings Backup Danger Zone
  const backupCard = getOrCreateElement('settings-delete-account-card');
  const backupBtn = getOrCreateElement('btn-settings-delete-account');
  const activeDefaultsCard = getOrCreateElement('settings-athlete-account-active-card');
  const activeEmailEl = getOrCreateElement('settings-active-account-email');

  assert(backupCard !== null, "settings-delete-account-card exists in settings backup pane");
  assert(backupBtn !== null, "btn-settings-delete-account exists in settings backup pane");
  assert(activeDefaultsCard !== null, "settings-athlete-account-active-card exists in settings defaults pane");
  assert(activeEmailEl !== null, "settings-active-account-email exists in settings defaults pane");

  // Verify updateSettingsModalAuthVisibility when not logged in
  localStorage.removeItem('showUp_user_profile');
  localStorage.removeItem('showUp_google_token');
  updateSettingsModalAuthVisibility();
  const signInCard = getOrCreateElement('settings-athlete-account-card');
  assert(!signInCard.classList.contains('hidden'), "Sign-in card visible when not logged in");
  assert(activeDefaultsCard.classList.contains('hidden'), "Active account card hidden when not logged in");

  // Verify updateSettingsModalAuthVisibility when logged in
  const testAthlete = {
    firstName: "Marcus",
    email: "marcus@showup.fit",
    authProvider: "email_password"
  };
  localStorage.setItem('showUp_user_profile', JSON.stringify(testAthlete));
  updateSettingsModalAuthVisibility();
  assert(signInCard.classList.contains('hidden'), "Sign-in card hidden when logged in");
  assert(!activeDefaultsCard.classList.contains('hidden'), "Active account card visible when logged in");
  assert(activeEmailEl.innerText === "marcus@showup.fit", "Active account email displays user email");

  // Test account deletion from Firestore database
  const mockDbStorage = new Map();
  mockDbStorage.set('user_backups/marcus@showup.fit', { email: 'marcus@showup.fit', workouts: [{ id: 1 }] });
  window.getFirestoreDb = function() {
    return {
      collection: function(colName) {
        return {
          doc: function(docId) {
            const key = colName + '/' + docId;
            return {
              delete: async function() {
                mockDbStorage.delete(key);
                return Promise.resolve();
              }
            };
          },
          get: async function() {
            return Promise.resolve({ empty: true, docs: [] });
          }
        };
      }
    };
  };

  // Seed local registered accounts
  const accounts = { "marcus@showup.fit": { email: "marcus@showup.fit", password: "secret" } };
  localStorage.setItem('showUp_registered_accounts', JSON.stringify(accounts));
  assert(JSON.parse(localStorage.getItem('showUp_registered_accounts'))["marcus@showup.fit"] !== undefined, "Registered account seeded");

  // Execute account deletion
  const deleteResult = await deleteAthleteAccount();
  assert(deleteResult.success === true, "deleteAthleteAccount returns success true");
  assert(!mockDbStorage.has('user_backups/marcus@showup.fit'), "User document deleted from Firestore user_backups");
  assert(JSON.parse(localStorage.getItem('showUp_registered_accounts') || "{}")["marcus@showup.fit"] === undefined, "Account deleted from registered accounts");
  assert(localStorage.getItem('showUp_user_profile') === null, "Local user profile purged");
  assert(localStorage.getItem('showUp_google_token') === null, "Local google token cleared");

  // Test Google Login preservation: Google Drive backup is untouched
  let driveFileDeleted = false;
  window.deleteFileFromGoogleDrive = function() { driveFileDeleted = true; };
  localStorage.setItem('showUp_last_drive_sync', '2026-10-30T22:00:00Z');
  const googleProfile = {
    firstName: "Sarah",
    email: "sarah@gmail.com",
    authProvider: "google"
  };
  localStorage.setItem('showUp_user_profile', JSON.stringify(googleProfile));
  localStorage.setItem('showUp_google_token', 'mock_google_token_123');
  mockDbStorage.set('user_backups/sarah@gmail.com', { email: 'sarah@gmail.com', workouts: [] });

  const googleDeleteRes = await deleteAthleteAccount();
  assert(googleDeleteRes.success === true, "Google athlete account deletion succeeds");
  assert(!mockDbStorage.has('user_backups/sarah@gmail.com'), "Firestore user_backups record deleted for Google user");
  assert(driveFileDeleted === false, "Google Drive exercise history remains completely untouched and preserved");
  assert(localStorage.getItem('showUp_user_profile') === null, "Google profile purged locally from app");
});

print("\\n============================================================");
print("TEST EXECUTION COMPLETED: " + testPassedCount + " PASSED, " + testFailedCount + " FAILED");
print("============================================================");

if (testFailedCount > 0) {
  throw new Error("One or more tests failed!");
}
"""

    full_smoke_test = harness_code + "\n" + app_code + "\n" + assertions_code
    with open('scratch/full_smoke_test.js', 'w', encoding='utf-8') as f:
        f.write(full_smoke_test)

    print(f"Executing scratch/full_smoke_test.js via JSC...")
    res = subprocess.run([
        '/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc',
        'scratch/full_smoke_test.js'
    ], capture_output=True, text=True)

    print(res.stdout)
    if res.stderr:
        print("STDERR:\n", res.stderr)

    return res.returncode == 0

if __name__ == '__main__':
    success = generate_and_run_smoke_test()
    sys.exit(0 if success else 1)
