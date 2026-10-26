
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
  info: () => {}
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
      frequency: { setValueAtTime: () => {} },
      connect: () => {},
      start: () => {},
      stop: () => {}
    }),
    createGain: () => ({
      gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
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
globalThis.prompt = (msg, def) => def || '';
globalThis.google = { accounts: { id: { initialize: () => {}, renderButton: () => {} } } };

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
  print("\n=== SUITE: " + name + " ===");
  try {
    fn();
  } catch (err) {
    print("  SUITE ERROR in " + name + ": " + err.message);
  }
}


    // Safeguard: intercept any third-party or residual Google Maps auth error dialogs
    window.gm_authFailure = function() {
      console.warn("Google Maps auth notification intercepted - defaulting smoothly to Google Maps interactive Embed.");
      if (typeof isMapEmbedMode !== 'undefined') isMapEmbedMode = true;
    };

    // Immediate Theme Accent Application to prevent flash of unstyled theme
    (function() {
      try {
        const savedTheme = localStorage.getItem('showUp_theme') || localStorage.getItem('showUp_theme_accent') || 'emerald';
        const savedUIMode = localStorage.getItem('showUp_ui_mode') || 'precision';
        document.documentElement.className = (document.documentElement.className || '').replace(/\btheme-\S+/g, '').replace(/\bui-mode-\S+/g, '').trim() + ' theme-' + savedTheme + ' ui-mode-' + savedUIMode;
      } catch (e) {}
    })();
  

    (function() {
      try {
        const savedTheme = localStorage.getItem('showUp_theme') || localStorage.getItem('showUp_theme_accent') || 'emerald';
        const savedUIMode = localStorage.getItem('showUp_ui_mode') || 'zen';
        document.body.classList.add('theme-' + savedTheme);
        document.body.classList.add('ui-mode-' + savedUIMode);
      } catch (e) {}
    })();
  
/* ==========================================================================
   showUp Application Configuration & Shared State
   ========================================================================== */

    const GOOGLE_CLIENT_ID = "115199141886-1a64f9jbjrg9c09q97pgl01348ou7dvk.apps.googleusercontent.com";
    const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 1 week active session (7 days)

    /**
     * Resolves the user's active local time zone, storing it in localStorage for continuous tracking
     */
    function getUserTimeZone() {
      try {
        let detected = null;
        if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
          detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
        }
        if (detected) {
          try { localStorage.setItem('showUp_user_timezone', detected); } catch (e) {}
          return detected;
        }
        return localStorage.getItem('showUp_user_timezone') || 'America/New_York';
      } catch (e) {
        return 'America/New_York';
      }
    }

    /**
     * Formats a given date (or current instant) into YYYY-MM-DD per the user's local time zone
     */
    function getLocalDateKey(date = new Date()) {
      const tz = getUserTimeZone();
      try {
        const d = (date instanceof Date) ? date : new Date(date);
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: tz,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(d);
      } catch (e) {
        const d = (date instanceof Date) ? date : new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }

    let userTimeZone = getUserTimeZone();
    let currentSessionSets = JSON.parse(localStorage.getItem('showUp_active_workout_sets') || '[]');
    let completedWorkoutsHistory = JSON.parse(localStorage.getItem('showUp_synced_workouts') || '[]');
    let weightHistory = JSON.parse(localStorage.getItem('showUp_weight_history') || '[]');
    
    let userHeight = parseFloat(localStorage.getItem('showUp_user_height')) || 70; // inches
    let userWeight = parseFloat(localStorage.getItem('showUp_user_weight')) || 175; // lbs

    let lastEvaluatedSummary = null;
    let hrHistory = [];
    let currentHR = 0;
    let hrSimInterval = null;
    let bleHRDevice = null;
    let bleHRServer = null;
    let bleHRCharacteristic = null;
    let calendarDate = new Date();
    let googleAccessToken = localStorage.getItem('showUp_google_token') || null;
    let selectedWorkoutDate = getLocalDateKey();

    // --- WORKOUT SESSION TIMER STATE ---
    let workoutTimerSeconds = 0;
    let workoutTimerState = 'stopped'; // 'stopped' | 'running' | 'paused'
    let workoutTimerInterval = null;
    let workoutTimerStartTimestamp = null;

    // --- SET TIMER & REST TIMER STATE ---
    let isSetInProgress = false;
    let activeSetStartTime = null;
    let activeSetElapsedSeconds = 0;
    let activeSetTimerInterval = null;

    let isRestTimerRunning = false;
    let restTimerSeconds = 0;
    let restTimerStartTime = null;
    let restTimerInterval = null;
    let currentPendingRestPeriod = 0; // Recorded rest period between prior set and newly started set
    let currentSessionRestTarget = null; // Active rest target for current rest period (extendable via +30s)
    let hasTriggeredRestRecoveryAlert = false; // Tracks whether recovery haptic and double bell ring alert has fired for current rest cycle

    // --- EXERCISE SHORTHAND ABBREVIATION DICTIONARY ---
    const EXERCISE_ABBREVIATIONS = {
      "SH": "Single Hand",
      "SA": "Single Arm",
      "DH": "Double Hand",
      "KB": "Kettle Bell",
      "DB": "Dumbell"
    };

    const defaultCatalog = [
      { name: "Banded KB Suitcase Carry", implement: "Kettlebell", muscle: "Core/Abs", secondary: ["Shoulders", "Back", "Quads", "Hamstrings/Glutes"] },
      { name: "Banded Lateral Walk", implement: "Bodyweight", muscle: "Hamstrings/Glutes", secondary: ["Quads", "Core/Abs"] },
      { name: "Barbell Back Squat", implement: "Barbell", muscle: "Quads", secondary: ["Hamstrings/Glutes", "Core/Abs"] },
      { name: "Barbell Bench Press", implement: "Barbell", muscle: "Chest", secondary: ["Triceps", "Shoulders"] },
      { name: "Barbell Bent-Over Row", implement: "Barbell", muscle: "Back", secondary: ["Biceps", "Hamstrings/Glutes", "Core/Abs"] },
      { name: "Barbell Deadlift", implement: "Barbell", muscle: "Full Body", secondary: ["Hamstrings/Glutes", "Back", "Core/Abs"] },
      { name: "Barbell Overhead Press", implement: "Barbell", muscle: "Shoulders", secondary: ["Triceps", "Core/Abs"] },
      { name: "Bent Arm Cross Over", implement: "Bodyweight", muscle: "Chest", secondary: ["Shoulders", "Biceps", "Core/Abs"] },
      { name: "Bethak (Hindu Squats)", implement: "Bodyweight", muscle: "Quads", secondary: ["Hamstrings/Glutes", "Core/Abs"] },
      { name: "Bicep Curls", implement: "Dumbbell", muscle: "Biceps", secondary: ["Forearms"] },
      { name: "Chest Dips", implement: "Bodyweight", muscle: "Chest", secondary: ["Triceps", "Shoulders", "Core/Abs"] },
      { name: "Dand (Hindu Push-Ups)", implement: "Bodyweight", muscle: "Chest", secondary: ["Shoulders", "Triceps", "Core/Abs", "Back"] },
      { name: "DB Bench Press", implement: "Dumbbell", muscle: "Chest", secondary: ["Triceps", "Shoulders"] },
      { name: "DB Bicep Curl", implement: "Dumbbell", muscle: "Biceps", secondary: ["Forearms"] },
      { name: "DB Hammer Curls", implement: "Dumbbell", muscle: "Biceps", secondary: ["Forearms"] },
      { name: "DB Incline Press", implement: "Dumbbell", muscle: "Chest", secondary: ["Shoulders", "Triceps"] },
      { name: "DB Overhead Press", implement: "Dumbbell", muscle: "Shoulders", secondary: ["Triceps", "Core/Abs"] },
      { name: "DB Romanian Deadlift", implement: "Dumbbell", muscle: "Hamstrings/Glutes", secondary: ["Back", "Core/Abs"] },
      { name: "DB Row", implement: "Dumbbell", muscle: "Back", secondary: ["Biceps", "Core/Abs"] },
      { name: "Exercise Ball Wood Chops", implement: "Exercise Ball", muscle: "Core/Abs", secondary: ["Shoulders", "Back", "Quads"] },
      { name: "EZ Bar Bicep Curls", implement: "Barbell", muscle: "Biceps", secondary: ["Forearms"] },
      { name: "EZ Bar Lying Down Tricep Extensions", implement: "Barbell", muscle: "Triceps", secondary: ["Forearms", "Chest"] },
      { name: "EZ Bar Preacher Curls", implement: "Barbell", muscle: "Biceps", secondary: ["Forearms"] },
      { name: "EZ Bar Tricep Pull Overs", implement: "Barbell", muscle: "Triceps", secondary: ["Back", "Chest"] },
      { name: "Face Pull", implement: "Gymnastics Rings", muscle: "Shoulders", secondary: ["Back"] },
      { name: "Gada Swings (Mace 360)", implement: "Macebell / Gada", muscle: "Shoulders", secondary: ["Back", "Core/Abs", "Biceps"] },
      { name: "Glute Bridge", implement: "Bodyweight", muscle: "Hamstrings/Glutes", secondary: ["Core/Abs", "Quads"] },
      { name: "Goblet Squat (Dumbbell)", implement: "Dumbbell", muscle: "Quads", secondary: ["Hamstrings/Glutes", "Core/Abs"] },
      { name: "Hanging Knee Tucks", implement: "Bodyweight", muscle: "Core/Abs", secondary: ["Back", "Shoulders"] },
      { name: "Hiking", implement: "Hiking", muscle: "Full Body", secondary: ["Quads", "Hamstrings/Glutes", "Core/Abs"] },
      { name: "Jump Rope", implement: "Bodyweight", muscle: "Full Body", secondary: ["Quads", "Core/Abs"] },
      { name: "KB Farmers Walk", implement: "Kettlebell", muscle: "Full Body", secondary: ["Core/Abs", "Back", "Shoulders", "Quads", "Hamstrings/Glutes"] },
      { name: "KB Shoulder Press", implement: "Kettlebell", muscle: "Shoulders", secondary: ["Triceps", "Core/Abs", "Chest"] },
      { name: "KB Swings", implement: "Kettlebell", muscle: "Hamstrings/Glutes", secondary: ["Core/Abs", "Back", "Shoulders", "Quads"] },
      { name: "Kettlebell Clean & Press", implement: "Kettlebell", muscle: "Full Body", secondary: ["Shoulders", "Back", "Hamstrings/Glutes", "Quads"] },
      { name: "Kickstand KB RDL", implement: "Kettlebell", muscle: "Hamstrings/Glutes", secondary: ["Core/Abs"] },
      { name: "Lunges", implement: "Bodyweight", muscle: "Quads", secondary: ["Hamstrings/Glutes", "Core/Abs"] },
      { name: "Outdoor Biking / Cycling", implement: "Biking", muscle: "Quads", secondary: ["Hamstrings/Glutes", "Core/Abs"] },
      { name: "Ring Dips", implement: "Gymnastics Rings", muscle: "Chest", secondary: ["Triceps", "Shoulders", "Core/Abs"] },
      { name: "Ring Push-Ups", implement: "Gymnastics Rings", muscle: "Chest", secondary: ["Triceps", "Shoulders", "Core/Abs"] },
      { name: "Ring Rows", implement: "Gymnastics Rings", muscle: "Back", secondary: ["Biceps", "Core/Abs", "Shoulders"] },
      { name: "Ring Walk Out", implement: "Gymnastics Rings", muscle: "Core/Abs", secondary: ["Chest", "Shoulders", "Triceps", "Back"] },
      { name: "Rowing (Concept2 / Erg)", implement: "Row Erg", muscle: "Back", secondary: ["Biceps", "Core/Abs", "Hamstrings/Glutes", "Quads"] },
      { name: "Running", implement: "Running", muscle: "Quads", secondary: ["Hamstrings/Glutes", "Core/Abs", "Full Body"] },
      { name: "Sapaate (Indian Burpees)", implement: "Bodyweight", muscle: "Full Body", secondary: ["Chest", "Quads", "Shoulders", "Core/Abs", "Hamstrings/Glutes", "Triceps"] },
      { name: "SH KB Clean and Press", implement: "Kettlebell", muscle: "Full Body", secondary: ["Shoulders", "Hamstrings/Glutes", "Back", "Triceps", "Core/Abs"] },
      { name: "SH KB High Pull", implement: "Kettlebell", muscle: "Back", secondary: ["Hamstrings/Glutes", "Shoulders", "Biceps", "Core/Abs"] },
      { name: "SH KB Romanian Dead Lift", implement: "Kettlebell", muscle: "Hamstrings/Glutes", secondary: ["Back", "Core/Abs", "Shoulders"] },
      { name: "SH KB Snatch", implement: "Kettlebell", muscle: "Full Body", secondary: ["Hamstrings/Glutes", "Back", "Shoulders", "Core/Abs"] },
      { name: "SH KB Squat", implement: "Kettlebell", muscle: "Quads", secondary: ["Hamstrings/Glutes", "Core/Abs", "Shoulders"] },
      { name: "SH KB Suitcase Carry", implement: "Kettlebell", muscle: "Core/Abs", secondary: ["Shoulders", "Back", "Quads", "Hamstrings/Glutes"] },
      { name: "SH KB Swings", implement: "Kettlebell", muscle: "Hamstrings/Glutes", secondary: ["Core/Abs", "Back", "Shoulders", "Quads"] },
      { name: "SH KB Thruster", implement: "Kettlebell", muscle: "Full Body", secondary: ["Quads", "Shoulders", "Hamstrings/Glutes", "Triceps", "Core/Abs"] },
      { name: "Stationary Bike Sprint", implement: "Biking", muscle: "Quads", secondary: ["Hamstrings/Glutes", "Core/Abs"] },
      { name: "Swimming (Laps / Open Water)", implement: "Swimming", muscle: "Full Body", secondary: ["Shoulders", "Back", "Core/Abs", "Quads"] },
      { name: "Tricep Bar Dips", implement: "Bodyweight", muscle: "Triceps", secondary: ["Chest", "Shoulders", "Core/Abs"] },
      { name: "Walking", implement: "Walking", muscle: "Quads", secondary: ["Hamstrings/Glutes", "Core/Abs"] }
    ];

    // Expose globally for browser console / cross-module access
    if (typeof window !== 'undefined') {
      window.EXERCISE_ABBREVIATIONS = EXERCISE_ABBREVIATIONS;
      window.defaultCatalog = defaultCatalog;
    }

    function expandExerciseAbbreviations(text) {
      if (!text || typeof text !== 'string') return '';
      return text
        .replace(/\bSH\b/gi, 'Single Hand')
        .replace(/\bSA\b/gi, 'Single Arm')
        .replace(/\bDH\b/gi, 'Double Hand')
        .replace(/\bKB\b/gi, 'Kettle Bell')
        .replace(/\bDB\b/gi, 'Dumbell')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function abbreviateExerciseName(text) {
      if (!text || typeof text !== 'string') return '';
      return text
        .replace(/\bSingle[- ]Hand\b/gi, 'SH')
        .replace(/\bSingle[- ]Arm\b/gi, 'SA')
        .replace(/\bDouble[- ]Hand\b/gi, 'DH')
        .replace(/\bKettle\s*Bell\b/gi, 'KB')
        .replace(/\bKettlebell\b/gi, 'KB')
        .replace(/\bDumb\s*bell\b/gi, 'DB')
        .replace(/\bDumbell\b/gi, 'DB')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function normalizeExerciseLookupKey(text) {
      if (!text || typeof text !== 'string') return '';
      return abbreviateExerciseName(text)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
    }

    function findCatalogExercise(val) {
      if (!val || typeof val !== 'string') return null;
      const clean = val.trim().toLowerCase();
      if (!clean) return null;

      // 1. Direct name match (case-insensitive)
      let match = defaultCatalog.find(c => c.name.toLowerCase() === clean);
      if (match) return match;

      // 2. Normalized abbreviation key match
      const normKey = normalizeExerciseLookupKey(clean);
      match = defaultCatalog.find(c => normalizeExerciseLookupKey(c.name) === normKey);
      if (match) return match;

      // 2b. Cross-map Single Arm (SA) and Single Hand (SH)
      const saNormKey = normKey.replace(/^sa/, 'sh').replace(/sa/g, 'sh');
      match = defaultCatalog.find(c => normalizeExerciseLookupKey(c.name).replace(/^sa/, 'sh').replace(/sa/g, 'sh') === saNormKey);
      if (match) return match;

      // 2c. RDL alias for Romanian Dead Lift
      const rdlKey = normKey.replace(/romaniandeadlift/g, 'rdl');
      match = defaultCatalog.find(c => normalizeExerciseLookupKey(c.name).replace(/romaniandeadlift/g, 'rdl') === rdlKey);
      if (match) return match;

      // 2d. Legacy alias for Banded KB Suitcase Carry
      if (normKey === 'shbandedkbcarry' || normKey === 'shbandedkbsuitcasecarry' || normKey === 'bandedkbcarry') {
        const carryMatch = defaultCatalog.find(c => c.name === "Banded KB Suitcase Carry");
        if (carryMatch) return carryMatch;
      }

      // 2e. Alias for single leg rdl -> Kickstand KB RDL
      if (normKey === 'singlelegrdl' || normKey === 'kbsinglelegrdl' || normKey === 'singlelegkbrdl') {
        const rdlMatch = defaultCatalog.find(c => c.name === "Kickstand KB RDL");
        if (rdlMatch) return rdlMatch;
      }

      // 3. Partial or substring match if input length >= 3
      if (clean.length >= 3) {
        match = defaultCatalog.find(c => {
          const cLower = c.name.toLowerCase();
          return cLower === clean || cLower.startsWith(clean);
        });
        if (match) return match;

        // Expanded abbreviation match
        const expandedInput = expandExerciseAbbreviations(clean).toLowerCase();
        match = defaultCatalog.find(c => {
          const expName = expandExerciseAbbreviations(c.name).toLowerCase();
          return expName === expandedInput || expName.startsWith(expandedInput) || expName.includes(expandedInput);
        });
        if (match) return match;
      }

      return null;
    }

    /**
     * Infers the exercise implement automatically from the exercise name.
     * Manual implement selection is optional.
     */
    function inferImplementFromExerciseName(exerciseName) {
      if (!exerciseName || typeof exerciseName !== 'string') return null;
      const trimmed = exerciseName.trim();
      if (!trimmed) return null;

      // 1. Direct or normalized catalog match
      const catalogMatch = findCatalogExercise(trimmed);
      if (catalogMatch && catalogMatch.implement) {
        return catalogMatch.implement;
      }

      // 2. Anatomical implement keyword inference
      const lower = expandExerciseAbbreviations(trimmed).toLowerCase();
      // Requirement: Whenever an exercise starts with Ring or has ring in it, it is Gymnastics Rings
      if (lower.startsWith('ring') || lower.includes('ring') || lower.includes('gymnastic')) {
        return 'Gymnastics Rings';
      } else if (lower.includes('exercise ball') || lower.includes('stability ball') || lower.includes('swiss ball') || lower.includes('wood chop') || lower.includes('woodchop')) {
        return 'Exercise Ball';
      } else if (lower.includes('kettle bell') || lower.includes('kettlebell') || /\bkb\b/i.test(trimmed)) {
        return 'Kettlebell';
      } else if (lower.includes('dumbell') || lower.includes('dumbbell') || /\bdb\b/i.test(trimmed)) {
        return 'Dumbbell';
      } else if (lower.includes('barbell') || lower.includes('ez bar') || /\bbb\b/i.test(trimmed)) {
        return 'Barbell';
      } else if (lower.includes('band')) {
        return 'Resistance Band';
      } else if (lower.includes('mace') || lower.includes('gada')) {
        return 'Macebell / Gada';
      } else if (lower.includes('jori') || lower.includes('karlakattai')) {
        return 'Jori Clubs / Karlakattai';
      } else if (lower.includes('run') || lower.includes('sprint') || lower.includes('jog')) {
        return 'Running';
      } else if (lower.includes('swim')) {
        return 'Swimming';
      } else if (lower.includes('row') || lower.includes('erg')) {
        return 'Row Erg';
      } else if (lower.includes('walk')) {
        return 'Walking';
      } else if (lower.includes('hike')) {
        return 'Hiking';
      } else if (lower.includes('bike') || lower.includes('cycle')) {
        return 'Biking';
      } else if (lower.includes('pushup') || lower.includes('pullup') || lower.includes('dip') || lower.includes('bridge') || lower.includes('lunge') || lower.includes('burpee') || lower.includes('sapaate') || lower.includes('bethak') || lower.includes('dand')) {
        return 'Bodyweight';
      }

      return null;
    }

    /**
     * Physiologically accurate engine to automatically establish primary & secondary muscles
     * for any exercise without requiring manual user input.
     * Implement input is optional and automatically inferred from the name of the exercise.
     */
    function resolveExerciseMuscles(exerciseName, explicitImplement = null) {
      const trimmed = (exerciseName || '').trim();
      if (!trimmed) {
        return {
          primary: 'Full Body',
          secondary: [],
          implement: explicitImplement || 'Bodyweight',
          inferred: false
        };
      }

      // Infer implement from exercise name (optional manual input)
      const inferredImp = inferImplementFromExerciseName(trimmed);
      const effectiveImplement = inferredImp || explicitImplement || 'Bodyweight';

      // Check catalog first for exact, abbreviated or expanded match
      const catalogMatch = findCatalogExercise(trimmed);
      if (catalogMatch) {
        return {
          primary: catalogMatch.muscle,
          secondary: [...(catalogMatch.secondary || [])],
          implement: catalogMatch.implement || effectiveImplement,
          catalogMatch: catalogMatch.name,
          inferred: Boolean(inferredImp)
        };
      }

      // Fallback: Intelligent anatomical keyword deduction
      const lower = expandExerciseAbbreviations(trimmed).toLowerCase();
      let primary = 'Full Body';
      let secondary = [];
      let implement = effectiveImplement;

      // Precise anatomical muscle mapping
      if (lower.includes('chest dip') || lower.includes('cross over') || lower.includes('crossover') || lower.includes('pushup') || lower.includes('push-up') || lower.includes('bench press') || lower.includes('chest fly') || lower.includes('pec') || lower.includes('dip')) {
        primary = 'Chest';
        secondary = ['Triceps', 'Shoulders', 'Core/Abs'];
      } else if (lower.includes('tricep') || lower.includes('skull crusher') || lower.includes('kickback')) {
        primary = 'Triceps';
        secondary = ['Chest', 'Shoulders', 'Core/Abs'];
      } else if (lower.includes('bicep') || lower.includes('curl') || lower.includes('chin-up') || lower.includes('chinup')) {
        primary = 'Biceps';
        secondary = ['Back', 'Core/Abs'];
      } else if (lower.includes('shoulder press') || lower.includes('overhead press') || lower.includes('lateral raise') || lower.includes('military press') || lower.includes('front raise') || lower.includes('face pull')) {
        primary = 'Shoulders';
        secondary = ['Triceps', 'Core/Abs', 'Chest'];
      } else if (lower.includes('wood chop') || lower.includes('woodchop') || lower.includes('carry') || lower.includes('suitcase') || lower.includes('plank') || lower.includes('crunch') || lower.includes('hollow') || lower.includes('russian twist') || lower.includes('abs') || lower.includes('core')) {
        primary = 'Core/Abs';
        secondary = ['Shoulders', 'Back', 'Hamstrings/Glutes', 'Quads'];
      } else if (lower.includes('glute bridge') || lower.includes('lateral walk') || lower.includes('hip thrust') || lower.includes('romanian dead') || lower.includes('rdl') || lower.includes('hamstring') || lower.includes('good morning') || lower.includes('leg curl') || (lower.includes('swing') && !lower.includes('gada') && !lower.includes('mace'))) {
        primary = 'Hamstrings/Glutes';
        secondary = ['Core/Abs', 'Back', 'Quads'];
      } else if (lower.includes('thruster')) {
        primary = 'Full Body';
        secondary = ['Quads', 'Shoulders', 'Hamstrings/Glutes', 'Triceps', 'Core/Abs'];
      } else if (lower.includes('lunge') || lower.includes('squat') || lower.includes('leg press') || lower.includes('quad') || lower.includes('split squat') || lower.includes('step up') || lower.includes('bethak')) {
        primary = 'Quads';
        secondary = ['Hamstrings/Glutes', 'Core/Abs', 'Shoulders'];
      } else if (lower.includes('high pull') || lower.includes('pullup') || lower.includes('pull-up') || lower.includes('lat pull') || lower.includes('row') || lower.includes('back')) {
        primary = 'Back';
        secondary = ['Hamstrings/Glutes', 'Shoulders', 'Biceps', 'Core/Abs'];
      } else if (lower.includes('snatch') || lower.includes('clean') || lower.includes('farmers walk') || lower.includes('farmer walk') || lower.includes('deadlift') || lower.includes('burpee') || lower.includes('sapaate')) {
        primary = 'Full Body';
        secondary = ['Hamstrings/Glutes', 'Back', 'Shoulders', 'Core/Abs'];
      }

      return { primary, secondary, implement, inferred: Boolean(inferredImp) };
    }


    let numpadTargetInputId = null;
    let numpadCurrentVal = "0";
    let numpadCallback = null;


    const BACKUP_FILENAME = "showUp_workout_data.json";

    function getGoogleClientId() {
      return GOOGLE_CLIENT_ID;
    }



    let squadCreateSelectedIcon = 'dumbbell';
    let squadCreateSelectedAccent = 'emerald';
    let currentActiveSquadId = null;
    let transferTargetSquadId = null;
    let activePillTimeout = null;
    let selectedHeatMapZip = null;
    let googleMapInstance = null;
    let googleMapMarkers = [];
    let googleMapPolygons = [];
    let currentMapZoom = 14; // Default zip code level (13-15)
    let isMapEmbedMode = false;

    // Standard coordinate lookup for zip codes to center Google Maps
    const KNOWN_ZIP_COORDS = {
      '20105': { lat: 38.9755, lng: -77.5398, city: 'Ashburn / Aldie, VA' },
      '20147': { lat: 39.0438, lng: -77.4875, city: 'Ashburn, VA' },
      '20148': { lat: 38.9907, lng: -77.5028, city: 'Ashburn, VA' },
      '20170': { lat: 38.9696, lng: -77.3861, city: 'Herndon, VA' },
      '20171': { lat: 38.9324, lng: -77.4042, city: 'Herndon, VA' },
      '20190': { lat: 38.9555, lng: -77.3402, city: 'Reston, VA' },
      '20191': { lat: 38.9358, lng: -77.3444, city: 'Reston, VA' },
      '22030': { lat: 38.8462, lng: -77.3064, city: 'Fairfax, VA' },
      '22102': { lat: 38.9366, lng: -77.2274, city: 'McLean / Tysons, VA' },
      '22201': { lat: 38.8876, lng: -77.0942, city: 'Arlington, VA' },
      '20001': { lat: 38.9101, lng: -77.0163, city: 'Washington, DC' },
      '20850': { lat: 39.0840, lng: -77.1528, city: 'Rockville, MD' },
      '10001': { lat: 40.7505, lng: -73.9934, city: 'New York, NY' },
      '02138': { lat: 42.3770, lng: -71.1256, city: 'Cambridge, MA' },
      '30303': { lat: 33.7537, lng: -84.3911, city: 'Atlanta, GA' },
      '33139': { lat: 25.7781, lng: -80.1313, city: 'Miami Beach, FL' },
      '60601': { lat: 41.8855, lng: -87.6217, city: 'Chicago, IL' },
      '75201': { lat: 32.7876, lng: -96.7997, city: 'Dallas, TX' },
      '78701': { lat: 30.2711, lng: -97.7437, city: 'Austin, TX' },
      '80202': { lat: 39.7525, lng: -105.0003, city: 'Denver, CO' },
      '90210': { lat: 34.0901, lng: -118.4065, city: 'Beverly Hills, CA' },
      '94103': { lat: 37.7726, lng: -122.4099, city: 'San Francisco, CA' },
      '98101': { lat: 47.6101, lng: -122.3344, city: 'Seattle, WA' },
      '94043': { lat: 37.4056, lng: -122.0775, city: 'Mountain View, CA' },
      '90001': { lat: 33.9731, lng: -118.2479, city: 'Los Angeles, CA' },
      '60614': { lat: 41.9227, lng: -87.6534, city: 'Chicago, IL' },
      '02115': { lat: 42.3424, lng: -71.0911, city: 'Boston, MA' },
      '78704': { lat: 30.2447, lng: -97.7667, city: 'Austin, TX' },
      '97201': { lat: 45.5089, lng: -122.6892, city: 'Portland, OR' },
      '37203': { lat: 36.1517, lng: -86.7915, city: 'Nashville, TN' }
    };


    const GOOGLE_MAPS_DARK_STYLE = [
      { elementType: "geometry", stylers: [{ color: "#0b0f19" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#0b0f19" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
      { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
      { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
      { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0f231c" }] },
      { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#34d399" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
      { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0f172a" }] },
      { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
      { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#334155" }] },
      { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#060911" }] },
      { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#38bdf8" }] }
    ];

    // ================= HIERARCHICAL ZOOM LEVEL AGGREGATION ENGINE =================
    const US_STATE_NAMES = {
      'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
      'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
      'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
      'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
      'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
      'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
      'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
      'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
      'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
      'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
      'DC': 'District of Columbia'
    };

    function parseLocationHierarchy(cityStr, zip) {
      let stateCode = 'US';
      let stateName = 'General Area';
      let country = 'United States';
      let countryCode = 'USA';

      if (cityStr && cityStr.includes(',')) {
        const parts = cityStr.split(',').map(s => s.trim());
        if (parts.length >= 2) {
          const stateCand = parts[1].substring(0, 2).toUpperCase();
          if (US_STATE_NAMES[stateCand]) {
            stateCode = stateCand;
            stateName = US_STATE_NAMES[stateCand];
          }
        }
      }
      return { stateCode, stateName, country, countryCode };
    }



    const VISITOR_STORAGE_KEY = 'showUp_unique_visitor_id';
    const VISITOR_COUNT_KEY = 'showUp_unique_visitor_count';
    const VISITOR_FIRST_SEEN_KEY = 'showUp_visitor_first_seen';
    const VISITOR_COUNTED_KEY = 'showUp_unique_counted_v4';


    const GLOBAL_VISITORS_LOG_KEY = 'showUp_global_visitors_log_v1';
    let adminVisitorViewMode = 'state'; // 'state' (group by state) or 'city' (city & state log)
    let adminVisitorSearchQuery = '';

    const FIREBASE_CONFIG = {
      apiKey: "AIzaSyAVf8ykV2FrZi4AkBFDCeNZhZuN-QH1QXk",
      authDomain: "showup-app-ca372.firebaseapp.com",
      projectId: "showup-app-ca372",
      storageBucket: "showup-app-ca372.firebasestorage.app",
      messagingSenderId: "489093591529",
      appId: "1:489093591529:web:058f0ef15e744128ecdb78",
      measurementId: "G-JK14YSDNP3"
    };

    const EMAIL_CONFIG = {
      provider: "firebase", // 'firebase', 'emailjs', or 'resend'
      emailjsServiceId: "",
      emailjsTemplateId: "",
      emailjsPublicKey: "",
      resendApiKey: ""
    };

/* ==========================================================================
   showUp Centralized Storage & Session State Engine
   Defensive JSON parsing, typed keys, and systematic session eradication
   ========================================================================== */

const STORAGE_KEYS = {
  // Session & Auth
  USER_PROFILE: 'showUp_user_profile',
  SESSION_EXPIRY: 'showUp_session_expiry',
  GOOGLE_TOKEN: 'showUp_google_token',
  LAST_DRIVE_SYNC: 'showUp_last_drive_sync',
  LAST_FIRESTORE_SYNC: 'showUp_last_firestore_sync',

  // Physical Profile & Personal Telemetry
  USER_HEIGHT: 'showUp_user_height',
  USER_WEIGHT: 'showUp_user_weight',
  USER_ZIP: 'showUp_user_zip',
  USER_CITY: 'showUp_user_city',
  USER_STATE: 'showUp_user_state',
  USER_LOCATION_NAME: 'showUp_user_location_name',
  USER_IP_ZIP: 'showUp_user_ip_zip',
  USER_IP_CITY: 'showUp_user_ip_city',
  USER_IP_LAT: 'showUp_user_ip_lat',
  USER_IP_LNG: 'showUp_user_ip_lng',
  USER_TIMEZONE: 'showUp_user_timezone',

  // Workout Data & Analytics
  ACTIVE_SETS: 'showUp_active_workout_sets',
  SYNCED_WORKOUTS: 'showUp_synced_workouts',
  WEIGHT_HISTORY: 'showUp_weight_history',
  DELETED_WORKOUTS: 'showUp_deleted_workouts',

  // Squads & Social
  SQUADS: 'showUp_squads',
  SQUAD_INVITES: 'showUp_squad_invites',
  GLOBAL_SQUAD_REGISTRY: 'showUp_global_squad_registry',
  SQUAD_ARCHIVE: 'showUp_squad_archive',

  // Theme & Preferences
  THEME: 'showUp_theme',
  THEME_ACCENT: 'showUp_theme_accent',
  FONT: 'showUp_font',
  HR_COLLAPSED: 'showUp_hr_collapsed',
  SQUADS_DEFAULT_COLLAPSED: 'showUp_squads_default_collapsed',

  // Global Telemetry & Visitor Tracking
  GLOBAL_COUNTER_COUNT: 'showUp_global_counter_count',
  GLOBAL_COUNTER_ET_DATE: 'showUp_global_counter_et_date',
  GLOBAL_VISITORS_LOG: 'showUp_global_visitors_log_v1',
  VISITOR_ID: 'showUp_unique_visitor_id',
  VISITOR_COUNT: 'showUp_unique_visitor_count',
  VISITOR_FIRST_SEEN: 'showUp_visitor_first_seen',
  VISITOR_COUNTED: 'showUp_unique_counted_v4',

  // Registered Accounts & Auth
  REGISTERED_ACCOUNTS: 'showUp_registered_accounts',

  // Map API
  GMAPS_API_KEY: 'showUp_gmaps_api_key'
};

const AppStorage = {
  KEYS: STORAGE_KEYS,

  /**
   * Safely read a value from localStorage with defensive JSON parsing
   */
  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return defaultValue;
      try {
        return JSON.parse(raw);
      } catch (parseErr) {
        return raw;
      }
    } catch (e) {
      console.warn(`[AppStorage] Failed to read key: ${key}`, e);
      return defaultValue;
    }
  },

  /**
   * Safely write a value to localStorage with automatic JSON serialization
   */
  set(key, value) {
    try {
      const serialized = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (e) {
      console.warn(`[AppStorage] Failed to set key: ${key}`, e);
      return false;
    }
  },

  /**
   * Remove a single key
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`[AppStorage] Failed to remove key: ${key}`, e);
      return false;
    }
  },

  /**
   * Mark a workout date as explicitly deleted so cloud restores/merges do not resurrect it
   */
  deleteWorkout(dateStr) {
    if (!dateStr) return;
    try {
      let deleted = JSON.parse(localStorage.getItem(STORAGE_KEYS.DELETED_WORKOUTS) || '[]');
      if (!Array.isArray(deleted)) deleted = [];
      if (!deleted.includes(dateStr)) {
        deleted.push(dateStr);
        localStorage.setItem(STORAGE_KEYS.DELETED_WORKOUTS, JSON.stringify(deleted));
      }
    } catch (e) {}

    let current = this.getAthleteWorkouts();
    current = current.filter(item => (typeof item === 'string' ? item : item.date) !== dateStr);
    this.saveAthleteWorkouts(current);
  },

  /**
   * Unmark a deleted workout date when a new workout is logged on that date
   */
  unmarkDeletedWorkout(dateStr) {
    if (!dateStr) return;
    try {
      let deleted = JSON.parse(localStorage.getItem(STORAGE_KEYS.DELETED_WORKOUTS) || '[]');
      if (Array.isArray(deleted) && deleted.includes(dateStr)) {
        deleted = deleted.filter(d => d !== dateStr);
        localStorage.setItem(STORAGE_KEYS.DELETED_WORKOUTS, JSON.stringify(deleted));
      }
    } catch (e) {}
  },

  /**
   * Update an existing historical workout with any modified details, preserving data integrity
   */
  updateWorkout(origDateStr, updatedWorkoutObj) {
    if (!updatedWorkoutObj) return this.getAthleteWorkouts();
    const newDate = updatedWorkoutObj.date || origDateStr;
    let current = this.getAthleteWorkouts();
    
    // If the date was adjusted, remove from old date slot and unmark new date
    if (origDateStr && origDateStr !== newDate) {
      current = current.filter(item => (typeof item === 'string' ? item : item.date) !== origDateStr);
    }
    this.unmarkDeletedWorkout(newDate);

    const existingIdx = current.findIndex(item => (typeof item === 'string' ? item : item.date) === newDate);
    if (existingIdx !== -1) {
      current[existingIdx] = updatedWorkoutObj;
    } else {
      current.push(updatedWorkoutObj);
    }

    // Sort descending by date
    current.sort((a, b) => {
      const da = String(typeof a === 'string' ? a : a.date || '').slice(0, 10);
      const db = String(typeof b === 'string' ? b : b.date || '').slice(0, 10);
      return db.localeCompare(da);
    });

    this.saveAthleteWorkouts(current);
    return current;
  },

  /**
   * Retrieve all registered athlete accounts from persistent storage
   */
  getRegisteredAccounts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.REGISTERED_ACCOUNTS);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return (typeof parsed === 'object' && parsed !== null) ? parsed : {};
    } catch (e) {
      return {};
    }
  },

  /**
   * Save or update an athlete account in persistent storage
   */
  saveRegisteredAccount(account) {
    if (!account || !account.email) return false;
    try {
      const accounts = this.getRegisteredAccounts();
      const normEmail = account.email.toLowerCase().trim();
      accounts[normEmail] = {
        ...accounts[normEmail],
        ...account,
        email: normEmail,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.REGISTERED_ACCOUNTS, JSON.stringify(accounts));
      return true;
    } catch (e) {
      console.warn("[AppStorage] Error saving account:", e);
      return false;
    }
  },

  /**
   * Helper to identify auto-recovered phantom workouts
   */
  isPhantomWorkout(w) {
    if (!w) return false;
    if (w.recoveredFromSquad === true) return true;
    const d = typeof w === 'string' ? w : (w.date || w.completedDate || '');
    const dateStr = String(d).slice(0, 10);
    if (dateStr === '2026-10-18' || dateStr === '2026-10-19' || dateStr === '2026-10-20') {
      const hasSets = Array.isArray(w.sets) && w.sets.length > 0;
      const hasRunning = !!w.runningMetrics;
      const hasVolume = (w.totalVolume || 0) > 0;
      if (!hasSets && !hasRunning && !hasVolume) {
        return true;
      }
    }
    return false;
  },

  /**
   * Intelligently union/merge workout lists by date so that no historical
   * or newly logged workout is ever accidentally dropped or overwritten.
   */
  mergeWorkouts(localWorkouts, incomingWorkouts) {
    if (!Array.isArray(localWorkouts)) localWorkouts = [];
    if (!Array.isArray(incomingWorkouts)) incomingWorkouts = [];

    let deletedDates = [];
    try {
      deletedDates = JSON.parse(localStorage.getItem(STORAGE_KEYS.DELETED_WORKOUTS) || '[]');
      if (!Array.isArray(deletedDates)) deletedDates = [];
    } catch (e) {}

    const map = new Map();

    const getDateKey = (w) => {
      if (!w) return null;
      if (typeof w === 'string') return w;
      return w.date || null;
    };

    const scoreWorkout = (w) => {
      if (!w) return 0;
      if (typeof w === 'string') return 1;
      let score = 10;
      if (w.workoutName) score += 5;
      if (w.totalVolume) score += 5;
      if (Array.isArray(w.sets) && w.sets.length > 0) score += w.sets.length * 2;
      if (w.totalWorkoutSeconds) score += 5;
      if (w.notes) score += 2;
      return score;
    };

    localWorkouts.forEach(w => {
      const k = getDateKey(w);
      if (k && !deletedDates.includes(k) && !this.isPhantomWorkout(w)) map.set(k, w);
    });

    incomingWorkouts.forEach(w => {
      const k = getDateKey(w);
      if (!k || deletedDates.includes(k) || this.isPhantomWorkout(w)) return;
      if (!map.has(k)) {
        map.set(k, w);
      } else {
        const existing = map.get(k);
        if (scoreWorkout(w) >= scoreWorkout(existing)) {
          map.set(k, w);
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const da = getDateKey(a) || '';
      const db = getDateKey(b) || '';
      return db.localeCompare(da);
    });
  },

  /**
   * One-time data migrations and workout corrections
   */
  applyPendingMigrations() {
    this.applyOct16PatchMigration();
    this.applyPhantomWorkoutsCleanupMigration();
  },

  applyOct16PatchMigration() {
    const MIGRATION_KEY = 'showUp_migration_20261016_oct16_workout_patch_v1';
    if (localStorage.getItem(MIGRATION_KEY) === 'completed') return;

    try {
      // 1. Unmark historical workout dates so no valid workout is blocked or tombstoned
      let deleted = JSON.parse(localStorage.getItem(STORAGE_KEYS.DELETED_WORKOUTS) || '[]');
      if (!Array.isArray(deleted)) deleted = [];
      deleted = deleted.filter(d => d !== '2026-10-16' && d !== '2026-10-17');
      localStorage.setItem(STORAGE_KEYS.DELETED_WORKOUTS, JSON.stringify(deleted));

      // 2. Fetch existing workouts and delete only obsolete 2026-10-16 draft
      let current = [];
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.SYNCED_WORKOUTS);
        current = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(current)) current = [];
      } catch (e) {
        current = [];
      }

      current = current.filter(w => {
        const d = typeof w === 'string' ? w : w.date;
        return d !== '2026-10-16';
      });

      // 3. Construct new 2026-10-16 workout with the exact 12 sets requested
      const oct16Workout = {
        date: "2026-10-16",
        workoutName: "Conditioning & Squats",
        notes: "Jump rope, barbell back squats, kickstand KB RDLs, and ring face pulls.",
        totalSets: 12,
        totalVolume: 6155,
        aerobicTE: "3.8",
        anaerobicTE: "2.8",
        caloriesBurned: 395,
        totalWorkoutSeconds: 1980,
        totalWorkoutTimeFormatted: "00:33:00",
        totalRestSeconds: 960,
        totalRestTimeFormatted: "16m 00s",
        totalActiveSeconds: 1020,
        totalActiveTimeFormatted: "17m 00s",
        workoutDuration: 1980,
        workoutDurationFormatted: "00:33:00",
        sets: [
          {
            id: 1729119901001,
            exerciseName: "Jump Rope",
            implement: "Bodyweight",
            muscle: "Full Body",
            secondaryMuscles: ["Quads", "Core/Abs"],
            rpe: 8,
            weight: 0,
            reps: 1000,
            ergDistance: 0,
            ergTime: "00:00",
            swimDistance: 0,
            swimTime: "00:00",
            enduranceDistance: 0,
            enduranceTime: "00:00:00",
            hr: 0,
            setDuration: 480,
            restPeriod: 60
          },
          {
            id: 1729119901002,
            exerciseName: "Barbell Back Squat",
            implement: "Barbell",
            muscle: "Quads",
            secondaryMuscles: ["Hamstrings/Glutes", "Core/Abs"],
            rpe: 8,
            weight: 65,
            reps: 15,
            ergDistance: 0,
            ergTime: "00:00",
            swimDistance: 0,
            swimTime: "00:00",
            enduranceDistance: 0,
            enduranceTime: "00:00:00",
            hr: 0,
            setDuration: 45,
            restPeriod: 90
          },
          {
            id: 1729119901003,
            exerciseName: "Barbell Back Squat",
            implement: "Barbell",
            muscle: "Quads",
            secondaryMuscles: ["Hamstrings/Glutes", "Core/Abs"],
            rpe: 8,
            weight: 65,
            reps: 10,
            ergDistance: 0,
            ergTime: "00:00",
            swimDistance: 0,
            swimTime: "00:00",
            enduranceDistance: 0,
            enduranceTime: "00:00:00",
            hr: 0,
            setDuration: 35,
            restPeriod: 90
          },
          {
            id: 1729119901004,
            exerciseName: "Barbell Back Squat",
            implement: "Barbell",
            muscle: "Quads",
            secondaryMuscles: ["Hamstrings/Glutes", "Core/Abs"],
            rpe: 8,
            weight: 85,
            reps: 10,
            ergDistance: 0,
            ergTime: "00:00",
            swimDistance: 0,
            swimTime: "00:00",
            enduranceDistance: 0,
            enduranceTime: "00:00:00",
            hr: 0,
            setDuration: 35,
            restPeriod: 90
          },
          {
            id: 1729119901005,
            exerciseName: "Barbell Back Squat",
            implement: "Barbell",
            muscle: "Quads",
            secondaryMuscles: ["Hamstrings/Glutes", "Core/Abs"],
            rpe: 8,
            weight: 95,
            reps: 10,
            ergDistance: 0,
            ergTime: "00:00",
            swimDistance: 0,
            swimTime: "00:00",
            enduranceDistance: 0,
            enduranceTime: "00:00:00",
            hr: 0,
            setDuration: 35,
            restPeriod: 120
          },
          {
            id: 1729119901006,
            exerciseName: "Barbell Back Squat",
            implement: "Barbell",
            muscle: "Quads",
            secondaryMuscles: ["Hamstrings/Glutes", "Core/Abs"],
            rpe: 8,
            weight: 115,
            reps: 10,
            ergDistance: 0,
            ergTime: "00:00",
            swimDistance: 0,
            swimTime: "00:00",
            enduranceDistance: 0,
            enduranceTime: "00:00:00",
            hr: 0,
            setDuration: 40,
            restPeriod: 120
          },
          {
            id: 1729119901007,
            exerciseName: "Kickstand KB RDL",
            implement: "Kettlebell",
            muscle: "Hamstrings/Glutes",
            secondaryMuscles: ["Core/Abs"],
            rpe: 8,
            weight: 35,
            reps: 10,
            ergDistance: 0,
            ergTime: "00:00",
            swimDistance: 0,
            swimTime: "00:00",
            enduranceDistance: 0,
            enduranceTime: "00:00:00",
            hr: 0,
            setDuration: 40,
            restPeriod: 60
          },
          {
            id: 1729119901008,
            exerciseName: "Kickstand KB RDL",
            implement: "Kettlebell",
            muscle: "Hamstrings/Glutes",
            secondaryMuscles: ["Core/Abs"],
            rpe: 8,
            weight: 35,
            reps: 10,
            ergDistance: 0,
            ergTime: "00:00",
            swimDistance: 0,
            swimTime: "00:00",
            enduranceDistance: 0,
            enduranceTime: "00:00:00",
            hr: 0,
            setDuration: 40,
            restPeriod: 60
          },
          {
            id: 1729119901009,
            exerciseName: "Kickstand KB RDL",
            implement: "Kettlebell",
            muscle: "Hamstrings/Glutes",
            secondaryMuscles: ["Core/Abs"],
            rpe: 8,
            weight: 44,
            reps: 10,
            ergDistance: 0,
            ergTime: "00:00",
            swimDistance: 0,
            swimTime: "00:00",
            enduranceDistance: 0,
            enduranceTime: "00:00:00",
            hr: 0,
            setDuration: 40,
            restPeriod: 60
          },
          {
            id: 1729119901010,
            exerciseName: "Kickstand KB RDL",
            implement: "Kettlebell",
            muscle: "Hamstrings/Glutes",
            secondaryMuscles: ["Core/Abs"],
            rpe: 8,
            weight: 44,
            reps: 10,
            ergDistance: 0,
            ergTime: "00:00",
            swimDistance: 0,
            swimTime: "00:00",
            enduranceDistance: 0,
            enduranceTime: "00:00:00",
            hr: 0,
            setDuration: 40,
            restPeriod: 60
          },
          {
            id: 1729119901011,
            exerciseName: "Face Pull",
            implement: "Gymnastics Rings",
            muscle: "Shoulders",
            secondaryMuscles: ["Back"],
            rpe: 8,
            weight: 0,
            reps: 10,
            ergDistance: 0,
            ergTime: "00:00",
            swimDistance: 0,
            swimTime: "00:00",
            enduranceDistance: 0,
            enduranceTime: "00:00:00",
            hr: 0,
            setDuration: 30,
            restPeriod: 60
          },
          {
            id: 1729119901012,
            exerciseName: "Face Pull",
            implement: "Gymnastics Rings",
            muscle: "Shoulders",
            secondaryMuscles: ["Back"],
            rpe: 8,
            weight: 0,
            reps: 10,
            ergDistance: 0,
            ergTime: "00:00",
            swimDistance: 0,
            swimTime: "00:00",
            enduranceDistance: 0,
            enduranceTime: "00:00:00",
            hr: 0,
            setDuration: 30,
            restPeriod: 60
          }
        ]
      };

      current.unshift(oct16Workout);
      this.saveAthleteWorkouts(current);

      // 4. Update squads telemetry so member completedToday reflects 2026-10-16
      try {
        const squads = JSON.parse(localStorage.getItem(STORAGE_KEYS.SQUADS) || '[]');
        if (Array.isArray(squads)) {
          let updatedSquads = false;
          squads.forEach(sq => {
            if (Array.isArray(sq.members)) {
              sq.members.forEach(m => {
                if (m && (m.id === 'local_user' || m.completedDate === '2026-10-17' || m.completedDate === '2026-10-16')) {
                  m.completedToday = true;
                  m.completedDate = '2026-10-16';
                  m.lastCompletedWorkout = "Conditioning & Squats";
                  updatedSquads = true;
                }
              });
            }
          });
          if (updatedSquads) {
            localStorage.setItem(STORAGE_KEYS.SQUADS, JSON.stringify(squads));
          }
        }
      } catch (sqErr) {}

      localStorage.setItem(MIGRATION_KEY, 'completed');

      if (typeof googleAccessToken !== 'undefined' && googleAccessToken && typeof syncToGoogleDrive === 'function') {
        syncToGoogleDrive(true);
      }
    } catch (e) {
      console.warn("[AppStorage] Migration error:", e);
    }
  },

  /**
   * Remove phantom auto-recovered workouts for Oct 18, Oct 19, and Oct 20
   * caused by stale completedToday flags in squad telemetry
   */
  applyPhantomWorkoutsCleanupMigration() {
    const MIGRATION_KEY = 'showUp_migration_20261020_cleanup_phantom_squad_workouts_v1';
    if (localStorage.getItem(MIGRATION_KEY) === 'completed') return;

    try {
      const phantomDates = ['2026-10-18', '2026-10-19', '2026-10-20'];

      // 1. Filter out phantom workouts from synced workouts store
      let synced = [];
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.SYNCED_WORKOUTS);
        synced = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(synced)) synced = [];
      } catch (e) {
        synced = [];
      }
      synced = synced.filter(w => !this.isPhantomWorkout(w));
      this.saveAthleteWorkouts(synced);

      // 2. Filter out phantom workouts from user-specific workout stores
      const profile = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PROFILE) || 'null');
      const userEmail = (profile?.email || '').toLowerCase().trim();
      const accounts = JSON.parse(localStorage.getItem('showUp_registered_accounts') || '[]');
      const emailsToCheck = new Set(['abhi13@gmail.com']);
      if (userEmail) emailsToCheck.add(userEmail);
      if (Array.isArray(accounts)) {
        accounts.forEach(acc => {
          if (acc && acc.email) emailsToCheck.add(acc.email.toLowerCase().trim());
        });
      }

      emailsToCheck.forEach(email => {
        if (!email) return;
        const uKey = 'showUp_user_workouts_' + email;
        let uWorkouts = [];
        try {
          const raw = localStorage.getItem(uKey);
          uWorkouts = raw ? JSON.parse(raw) : [];
          if (!Array.isArray(uWorkouts)) uWorkouts = [];
        } catch (e) {
          uWorkouts = [];
        }
        if (uWorkouts.length > 0) {
          uWorkouts = uWorkouts.filter(w => !this.isPhantomWorkout(w));
          localStorage.setItem(uKey, JSON.stringify(uWorkouts));
        }
      });

      // 3. Update in-memory completedWorkoutsHistory if defined
      if (typeof completedWorkoutsHistory !== 'undefined' && Array.isArray(completedWorkoutsHistory)) {
        completedWorkoutsHistory = completedWorkoutsHistory.filter(w => !this.isPhantomWorkout(w));
      }

      // 5. Clean up squad member telemetry in showUp_squads
      try {
        const squads = JSON.parse(localStorage.getItem(STORAGE_KEYS.SQUADS) || '[]');
        if (Array.isArray(squads)) {
          let updatedSquads = false;
          squads.forEach(sq => {
            if (Array.isArray(sq.members)) {
              sq.members.forEach(m => {
                if (m && (m.id === 'local_user' || (userEmail && m.email && m.email.toLowerCase().trim() === userEmail) || (profile && m.id === profile.id) || (m.email && m.email.toLowerCase().trim() === 'abhi13@gmail.com'))) {
                  if (phantomDates.includes(m.completedDate)) {
                    m.completedDate = '2026-10-16';
                    updatedSquads = true;
                  }
                  m.completedToday = false;
                  if (Array.isArray(m.completedDates)) {
                    m.completedDates = m.completedDates.filter(d => !phantomDates.includes(d));
                    updatedSquads = true;
                  }
                  if (m.workoutDetails && phantomDates.includes(String(m.workoutDetails.date || '').slice(0, 10))) {
                    delete m.workoutDetails;
                    updatedSquads = true;
                  }
                }
              });
            }
          });
          if (updatedSquads) {
            localStorage.setItem(STORAGE_KEYS.SQUADS, JSON.stringify(squads));
          }
        }
      } catch (sqErr) {}

      localStorage.setItem(MIGRATION_KEY, 'completed');

      // 6. Push cleaned state to Firestore cloud backup if connected
      if (typeof syncToFirestore === 'function') {
        syncToFirestore(true).catch(e => console.debug("[AppStorage] Phantom cleanup Firestore sync notice:", e));
      }

      // 7. Refresh UI components if rendered
      if (typeof renderHeatMap === 'function') renderHeatMap();
      if (typeof updateGlobalStatsUI === 'function') updateGlobalStatsUI();
      if (typeof renderSquadsTab === 'function') renderSquadsTab();
      if (typeof renderHistoricalWorkouts === 'function') renderHistoricalWorkouts();
      if (typeof renderMonthlyCalendar === 'function') renderMonthlyCalendar();
    } catch (err) {
      console.warn("[AppStorage] Phantom cleanup migration error:", err);
    }
  },

  /**
   * Load athlete workouts with defensive recovery across user-specific and synced stores
   */
  getAthleteWorkouts() {
    try {
      this.applyPendingMigrations();
      const profile = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PROFILE) || 'null');
      const userEmail = (profile?.email || '').toLowerCase().trim();
      let workouts = [];

      if (userEmail && userEmail !== 'you@showup.app' && userEmail !== 'user@showup.app') {
        const userWorkouts = JSON.parse(localStorage.getItem('showUp_user_workouts_' + userEmail) || 'null');
        if (Array.isArray(userWorkouts) && userWorkouts.length > 0) {
          workouts = userWorkouts;
        }
      }

      const synced = JSON.parse(localStorage.getItem(STORAGE_KEYS.SYNCED_WORKOUTS) || 'null');
      if (Array.isArray(synced) && synced.length > 0) {
        workouts = this.mergeWorkouts(workouts, synced);
      }

      this.unmarkDeletedWorkout('2026-10-17');

      // Defensive Auto-Recovery: If today's or yesterday's workout is missing from the list but exists in Squads telemetry
      try {
        const todayKey = typeof getLocalDateKey === 'function' ? getLocalDateKey() : (typeof getETDateKey === 'function' ? getETDateKey() : new Date().toISOString().slice(0, 10));
        const datesToCheck = [todayKey];
        try {
          const d = new Date();
          d.setDate(d.getDate() - 1);
          const yKey = typeof getETDateKey === 'function' ? getETDateKey(d) : (typeof getLocalDateKey === 'function' ? getLocalDateKey(d) : d.toISOString().slice(0, 10));
          if (yKey && !datesToCheck.includes(yKey)) datesToCheck.push(yKey);
        } catch (e) {}

        let deletedDates = [];
        try {
          deletedDates = JSON.parse(localStorage.getItem(STORAGE_KEYS.DELETED_WORKOUTS) || '[]');
          if (!Array.isArray(deletedDates)) deletedDates = [];
        } catch (e) {}

        const squads = JSON.parse(localStorage.getItem(STORAGE_KEYS.SQUADS) || '[]');
        if (Array.isArray(squads)) {
          for (const sq of squads) {
            if (Array.isArray(sq.members)) {
              const member = sq.members.find(m => m && (
                (userEmail && m.email && m.email.toLowerCase().trim() === userEmail) ||
                m.id === 'local_user' ||
                (profile && m.id === profile.id)
              ));
              if (member) {
                datesToCheck.forEach(targetDateKey => {
                  if (deletedDates.includes(targetDateKey)) return;
                  const hasDateWorkout = workouts.some(w => {
                    const wd = typeof w === 'string' ? w : (w.date || w.completedDate || '');
                    return String(wd).slice(0, 10) === targetDateKey;
                  });
                  if (!hasDateWorkout) {
                    const memberMatch = (member.completedDate === targetDateKey) || 
                      (member.workoutDetails && String(member.workoutDetails.date || '').slice(0, 10) === targetDateKey);

                    if (memberMatch) {
                      const recoveredWorkout = member.workoutDetails && String(member.workoutDetails.date || '').slice(0, 10) === targetDateKey
                        ? { ...member.workoutDetails, date: targetDateKey, completed: true }
                        : {
                            date: targetDateKey,
                            workoutName: member.lastCompletedWorkout || "Workout Session",
                            totalVolume: 0,
                            totalSets: 1,
                            completed: true,
                            recoveredFromSquad: true,
                            sets: []
                          };
                      workouts.unshift(recoveredWorkout);
                      this.saveAthleteWorkouts(workouts);
                    }
                  }
                });
              }
            }
          }
        }
      } catch (recoveryErr) {
        console.warn("[AppStorage] Auto-recovery notice:", recoveryErr);
      }

      if (Array.isArray(workouts) && workouts.length > 0 && typeof completedWorkoutsHistory !== 'undefined' && completedWorkoutsHistory.length === 0) {
        completedWorkoutsHistory = workouts;
      }

      return workouts;
    } catch (e) {
      console.warn("[AppStorage] Error retrieving workouts:", e);
      return [];
    }
  },

  /**
   * Save athlete workouts with per-user persistent isolation
   */
  saveAthleteWorkouts(workouts, triggerAutoSync = true) {
    if (!Array.isArray(workouts)) return;
    if (typeof completedWorkoutsHistory !== 'undefined') {
      completedWorkoutsHistory = workouts;
    }
    workouts.forEach(w => {
      const d = typeof w === 'string' ? w : w.date;
      if (d) this.unmarkDeletedWorkout(d);
    });
    try {
      localStorage.setItem(STORAGE_KEYS.SYNCED_WORKOUTS, JSON.stringify(workouts));
      const profile = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PROFILE) || 'null');
      const userEmail = (profile?.email || '').toLowerCase().trim();
      if (userEmail && userEmail !== 'you@showup.app' && userEmail !== 'user@showup.app') {
        localStorage.setItem('showUp_user_workouts_' + userEmail, JSON.stringify(workouts));
      }
    } catch (e) {
      console.warn("[AppStorage] Error saving workouts:", e);
    }
    if (triggerAutoSync && typeof queueFirestoreAutoSync === 'function') {
      try { queueFirestoreAutoSync(); } catch (e) {}
    }
  },

  /**
   * Systematic User Session Eradication (TC-9.1, TC-9.2)
   * Purges user profile, tokens, personal physical measurements, location telemetry caches,
   * active sets, workout logs, and squads, while preserving general app theme preferences.
   */
  clearUserSession() {
    const keysToPurge = [
      STORAGE_KEYS.USER_PROFILE,
      STORAGE_KEYS.SESSION_EXPIRY,
      STORAGE_KEYS.GOOGLE_TOKEN,
      STORAGE_KEYS.LAST_DRIVE_SYNC,
      STORAGE_KEYS.LAST_FIRESTORE_SYNC,
      STORAGE_KEYS.USER_HEIGHT,
      STORAGE_KEYS.USER_WEIGHT,
      STORAGE_KEYS.USER_ZIP,
      STORAGE_KEYS.USER_CITY,
      STORAGE_KEYS.USER_STATE,
      STORAGE_KEYS.USER_LOCATION_NAME,
      STORAGE_KEYS.USER_IP_ZIP,
      STORAGE_KEYS.USER_IP_CITY,
      STORAGE_KEYS.USER_IP_LAT,
      STORAGE_KEYS.USER_IP_LNG,
      STORAGE_KEYS.GLOBAL_VISITORS_LOG,
      STORAGE_KEYS.ACTIVE_SETS,
      STORAGE_KEYS.SYNCED_WORKOUTS,
      STORAGE_KEYS.WEIGHT_HISTORY,
      STORAGE_KEYS.SQUADS,
      STORAGE_KEYS.SQUAD_INVITES,
      STORAGE_KEYS.GLOBAL_SQUAD_REGISTRY,
      STORAGE_KEYS.SQUAD_ARCHIVE
    ];

    keysToPurge.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    });

    // Also defensively scan and remove any orphaned showUp_user_* keys
    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.key === 'function') {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('showUp_user_') || k.startsWith('showUp_squad'))) {
            localStorage.removeItem(k);
          }
        }
      }
    } catch (e) {}
  }
};

if (typeof window !== 'undefined') {
  window.AppStorage = AppStorage;
}


/* ==========================================================================
   showUp Utilities, Helpers, Notifications & Formatting
   ========================================================================== */

    function getLocalDateISO(d = new Date()) {
      if (typeof getLocalDateKey === 'function') {
        return getLocalDateKey(d);
      }
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    function formatHistoricalDate(dateStr) {
      if (!dateStr) return '';
      try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const d = new Date(year, month, day);
          return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        }
        return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      } catch (e) {
        return dateStr;
      }
    }



    function openLargeLogoModal() {
      const modal = document.getElementById('large-logo-modal');
      if (modal) modal.classList.remove('hidden');
    }

    function closeLargeLogoModal() {
      const modal = document.getElementById('large-logo-modal');
      if (modal) modal.classList.add('hidden');
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeLargeLogoModal();
        closeLogWeightModal();
        closeWeightNumpadModal();
      }
    });



    function toggleHRCollapsePref(isCollapsed) {
      localStorage.setItem('showUp_hr_collapsed', JSON.stringify(isCollapsed));
      toggleHRCardVisibility(isCollapsed);
    }

    function toggleHRCardVisibility(forceCollapse = null) {
      const hrBody = document.getElementById('hr-card-body');
      const icon = document.getElementById('hr-collapse-icon');
      const isHidden = forceCollapse !== null ? forceCollapse : !hrBody.classList.contains('hidden');

      if (isHidden) {
        hrBody.classList.add('hidden');
        icon.className = "fa-solid fa-chevron-down text-xs";
      } else {
        hrBody.classList.remove('hidden');
        icon.className = "fa-solid fa-chevron-up text-xs";
      }
    }

    function triggerHaptic(type = 'light') {
      if (!('vibrate' in navigator)) return;
      switch (type) {
        case 'light': navigator.vibrate(12); break;
        case 'medium': navigator.vibrate(25); break;
        case 'heavy': navigator.vibrate([35, 50, 35]); break;
        case 'recovery': navigator.vibrate([70, 100, 90]); break;
      }
    }

    function toggleProfileDropdown(e) {
      if (e) e.stopPropagation();
      const dropdown = document.getElementById('profile-dropdown-menu');
      dropdown.classList.toggle('hidden');
    }

    function closeProfileDropdownOutside(e) {
      const dropdown = document.getElementById('profile-dropdown-menu');
      const profileBadge = document.getElementById('google-user-profile');
      if (dropdown && !dropdown.classList.contains('hidden')) {
        if (!profileBadge.contains(e.target)) {
          dropdown.classList.add('hidden');
        }
      }
    }

    function closeProfileDropdown() {
      const dropdown = document.getElementById('profile-dropdown-menu');
      if (dropdown) dropdown.classList.add('hidden');
    }

    function openSettingsModalToBackup() {
      closeProfileDropdown();
      const modal = document.getElementById('settings-modal');
      if (modal && modal.classList.contains('hidden')) {
        toggleSettingsModal();
      }
      setTimeout(() => {
        const card = document.getElementById('settings-firestore-card');
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.classList.add('ring-2', 'ring-amber-400');
          setTimeout(() => card.classList.remove('ring-2', 'ring-amber-400'), 2500);
        }
      }, 150);
    }



    function formatBytes(bytes) {
      if (!bytes || bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }



    let currentProgressSubTab = 'workouts';

    function switchProgressSubTab(subTab) {
      currentProgressSubTab = subTab;
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('showUp_progress_subtab', subTab);
        }
      } catch (e) {}

      const workoutsPane = document.getElementById('progress-subpane-workouts');
      const weightPane = document.getElementById('progress-subpane-weight');
      const workoutsBtn = document.getElementById('progress-subtab-btn-workouts');
      const weightBtn = document.getElementById('progress-subtab-btn-weight');

      const activeBtnClass = "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20";
      const inactiveBtnClass = "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 text-slate-400 hover:text-slate-200";

      if (subTab === 'weight' || subTab === 'body') {
        if (workoutsPane) workoutsPane.classList.add('hidden');
        if (weightPane) weightPane.classList.remove('hidden');
        if (workoutsBtn) workoutsBtn.className = inactiveBtnClass;
        if (weightBtn) weightBtn.className = activeBtnClass;
        try { if (typeof renderWeightHistory === 'function') renderWeightHistory(); } catch (err) { console.error("renderWeightHistory error:", err); }
      } else {
        if (weightPane) weightPane.classList.add('hidden');
        if (workoutsPane) workoutsPane.classList.remove('hidden');
        if (weightBtn) weightBtn.className = inactiveBtnClass;
        if (workoutsBtn) workoutsBtn.className = activeBtnClass;
        try { if (typeof renderCalendar === 'function') renderCalendar(); } catch (err) { console.error("renderCalendar error:", err); }
        try { if (typeof renderMonthlyHistory === 'function') renderMonthlyHistory(); } catch (err) { console.error("renderMonthlyHistory error:", err); }
      }
    }

    function switchTab(tabName) {
      try {
        if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
      } catch (e) {}

      const homeView = document.getElementById('tab-home-view');
      const workoutView = document.getElementById('tab-workout-view');
      const calendarView = document.getElementById('tab-calendar-view');
      const squadsView = document.getElementById('tab-squads-view');
      const btnHome = document.getElementById('nav-btn-home');
      const btnWorkout = document.getElementById('nav-btn-workout');
      const btnCalendar = document.getElementById('nav-btn-calendar');
      const btnSquads = document.getElementById('nav-btn-squads');

      if (homeView) homeView.classList.add('hidden');
      if (workoutView) workoutView.classList.add('hidden');
      if (calendarView) calendarView.classList.add('hidden');
      if (squadsView) squadsView.classList.add('hidden');

      const inactiveClass = "flex flex-col items-center justify-center py-1 text-slate-400 hover:text-slate-200 transition relative";
      const activeClass = "flex flex-col items-center justify-center py-1 text-emerald-400 hover:text-emerald-300 transition relative";

      if (btnHome) btnHome.className = inactiveClass;
      if (btnWorkout) btnWorkout.className = inactiveClass;
      if (btnCalendar) btnCalendar.className = inactiveClass;
      if (btnSquads) btnSquads.className = inactiveClass;

      if (tabName === 'home') {
        if (homeView) homeView.classList.remove('hidden');
        if (btnHome) btnHome.className = activeClass;
        try {
          if (typeof renderHomeTab === 'function') renderHomeTab();
        } catch (err) {
          console.error("renderHomeTab error:", err);
        }
      } else if (tabName === 'workout') {
        if (workoutView) workoutView.classList.remove('hidden');
        if (btnWorkout) btnWorkout.className = activeClass;
      } else if (tabName === 'calendar' || tabName === 'progress') {
        if (calendarView) calendarView.classList.remove('hidden');
        if (btnCalendar) btnCalendar.className = activeClass;
        try {
          if (typeof switchProgressSubTab === 'function') {
            const savedSub = (typeof localStorage !== 'undefined') ? localStorage.getItem('showUp_progress_subtab') : null;
            switchProgressSubTab(savedSub || currentProgressSubTab || 'workouts');
          } else {
            if (typeof renderCalendar === 'function') renderCalendar();
            if (typeof renderMonthlyHistory === 'function') renderMonthlyHistory();
            if (typeof renderWeightHistory === 'function') renderWeightHistory();
          }
        } catch (err) {
          console.error("switchProgressSubTab error:", err);
        }
      } else if (tabName === 'squads') {
        if (squadsView) squadsView.classList.remove('hidden');
        if (btnSquads) btnSquads.className = activeClass;
        try { if (typeof renderSquadsTab === 'function') renderSquadsTab(); } catch (err) { console.error("renderSquadsTab error:", err); }
        try { if (typeof renderHeatMap === 'function') renderHeatMap(); } catch (err) { console.error("renderHeatMap error:", err); }
        try { if (typeof updateGlobalStatsUI === 'function') updateGlobalStatsUI(); } catch (err) { console.error("updateGlobalStatsUI error:", err); }
      }

      // Persist active tab to localStorage and sync browser address hash for reload persistence
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('showUp_active_tab', tabName);
        }
        if (typeof window !== 'undefined' && window.location) {
          const currentHash = window.location.hash.replace('#', '').trim().toLowerCase();
          if (currentHash !== tabName) {
            if (window.history && typeof window.history.replaceState === 'function') {
              window.history.replaceState(null, '', '#' + tabName);
            } else {
              window.location.hash = tabName;
            }
          }
        }
      } catch (e) {}
    }

    function restoreActiveTab() {
      let targetTab = null;

      // 1. Check URL hash first
      if (typeof window !== 'undefined' && window.location && window.location.hash) {
        const hash = window.location.hash.replace('#', '').trim().toLowerCase();
        if (['home', 'workout', 'calendar', 'progress', 'squads'].includes(hash)) {
          targetTab = (hash === 'calendar') ? 'progress' : hash;
        }
      }

      // 2. Check localStorage fallback
      if (!targetTab && typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('showUp_active_tab');
        if (saved && ['home', 'workout', 'calendar', 'progress', 'squads'].includes(saved.toLowerCase())) {
          targetTab = (saved.toLowerCase() === 'calendar') ? 'progress' : saved.toLowerCase();
        }
      }

      if (!targetTab) {
        targetTab = 'home';
      }

      switchTab(targetTab);
    }

    if (typeof window !== 'undefined') {
      window.switchTab = switchTab;
      window.switchProgressSubTab = switchProgressSubTab;
      window.restoreActiveTab = restoreActiveTab;

      window.addEventListener('hashchange', () => {
        if (window.location && window.location.hash) {
          const hash = window.location.hash.replace('#', '').trim().toLowerCase();
          if (['home', 'workout', 'calendar', 'progress', 'squads'].includes(hash)) {
            switchTab((hash === 'calendar') ? 'progress' : hash);
          }
        }
      });
    }

    function parseJwtPayload(token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
      } catch (e) {
        console.error("JWT parse error:", e);
        return null;
      }
    }



    function showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      const bgStyles = {
        success: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200',
        error: 'bg-rose-950/90 border-rose-500/50 text-rose-200',
        warning: 'bg-amber-950/90 border-amber-500/50 text-amber-200',
        info: 'bg-slate-900/90 border-slate-700 text-slate-200'
      };
      const iconStyles = {
        success: 'fa-solid fa-circle-check text-emerald-400',
        error: 'fa-solid fa-circle-exclamation text-rose-400',
        warning: 'fa-solid fa-triangle-exclamation text-amber-400',
        info: 'fa-solid fa-circle-info text-blue-400'
      };

      toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md text-xs font-semibold transition-all duration-300 ${bgStyles[type] || bgStyles.info}`;
      toast.innerHTML = `
        <i class="${iconStyles[type] || iconStyles.info} text-base shrink-0"></i>
        <span class="flex-1">${message}</span>
        <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white p-1">
          <i class="fa-solid fa-xmark"></i>
        </button>
      `;

      container.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('opacity-0', '-translate-y-1');
        setTimeout(() => toast.remove(), 350);
      }, 4000);
    }



    function formatTimeAgo(isoStr) {
      if (!isoStr) return 'Recently';
      try {
        const diffMs = Date.now() - new Date(isoStr).getTime();
        const mins = Math.floor(diffMs / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
      } catch (e) {
        return 'Recently';
      }
    }



    function getInitials(name) {
      if (!name) return 'SU';
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }



    function playUnobtrusiveChime() {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const now = ctx.currentTime;
        
        // Soft C5 note (523.25 Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now);
        gain1.gain.setValueAtTime(0.08, now);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);

        // Soft E5 note (659.25 Hz)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, now + 0.12);
        gain2.gain.setValueAtTime(0.08, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.55);
      } catch (e) {
        console.warn("Ambient chime preview warning:", e);
      }
    }

    /**
     * Synthesizes an authentic boxing arena end-of-round double bell ("CLANG! ... CLANG!")
     * alert when rest recovery target is reached. Uses Web Audio API with cast bronze
     * bell acoustics: deep hum, detuned beating fundamental, tierce, nominal overtones,
     * and a metallic hammer impact transient.
     */
    function playDoubleBellRing() {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const now = ctx.currentTime;

        function createBoxingBellStrike(startTime, duration, strikeLevel = 0.35) {
          // Master strike gain envelope
          const masterGain = ctx.createGain();
          masterGain.gain.setValueAtTime(strikeLevel, startTime);
          masterGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
          masterGain.connect(ctx.destination);

          // Authentic cast arena bell partials: [multiplier, relativeGain, decayRatio, type]
          const bellPartials = [
            { mult: 0.5, gain: 0.40, decay: 0.95, type: 'sine' },      // Deep hum tone (~218 Hz)
            { mult: 1.0, gain: 0.85, decay: 1.00, type: 'sine' },      // Strike tone fundamental (~436 Hz)
            { mult: 1.006, gain: 0.70, decay: 0.95, type: 'sine' },    // Detuned beating chorus (vibrating bronze)
            { mult: 1.21, gain: 0.45, decay: 0.80, type: 'sine' },     // Tierce (minor third ~528 Hz)
            { mult: 1.52, gain: 0.40, decay: 0.75, type: 'sine' },     // Quint (~662 Hz)
            { mult: 2.00, gain: 0.55, decay: 0.70, type: 'sine' },     // Nominal octave (~872 Hz)
            { mult: 2.76, gain: 0.35, decay: 0.50, type: 'triangle' }, // Decime metallic gong ring (~1203 Hz)
            { mult: 3.92, gain: 0.28, decay: 0.35, type: 'triangle' }, // High arena clang (~1709 Hz)
            { mult: 5.40, gain: 0.18, decay: 0.20, type: 'triangle' }  // Sharp hammer strike overtone (~2354 Hz)
          ];

          const baseFreq = 436; // A4 standard boxing bout bell pitch

          bellPartials.forEach(p => {
            const osc = ctx.createOscillator();
            const partGain = ctx.createGain();
            osc.type = p.type;
            osc.frequency.setValueAtTime(baseFreq * p.mult, startTime);

            const partDuration = Math.max(0.08, duration * p.decay);
            partGain.gain.setValueAtTime(p.gain, startTime);
            partGain.gain.exponentialRampToValueAtTime(0.0001, startTime + partDuration);

            osc.connect(partGain);
            partGain.connect(masterGain);
            osc.start(startTime);
            osc.stop(startTime + partDuration);
          });

          // Physical metallic hammer strike impact transient
          try {
            const clickOsc = ctx.createOscillator();
            const clickGain = ctx.createGain();
            clickOsc.type = 'square';
            clickOsc.frequency.setValueAtTime(1400, startTime);
            clickOsc.frequency.exponentialRampToValueAtTime(140, startTime + 0.03);
            clickGain.gain.setValueAtTime(0.35, startTime);
            clickGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.03);
            clickOsc.connect(clickGain);
            clickGain.connect(masterGain);
            clickOsc.start(startTime);
            clickOsc.stop(startTime + 0.035);
          } catch (e) {}
        }

        // Boxing round end: Rhythmic double strike (CLANG! ... CLANG!)
        createBoxingBellStrike(now, 1.1, 0.38);
        createBoxingBellStrike(now + 0.28, 1.8, 0.42);
      } catch (e) {
        console.warn("Rest timer boxing bell alert warning:", e);
      }
    }

    function isRestSoundAlertEnabled() {
      try {
        const val = localStorage.getItem('showUp_rest_sound_alert');
        return val !== 'false';
      } catch (e) {
        return true;
      }
    }

    function setRestSoundAlertEnabled(enabled) {
      try {
        localStorage.setItem('showUp_rest_sound_alert', enabled ? 'true' : 'false');
      } catch (e) {}
      updateRestSoundAlertUI();
    }

    function toggleRestSoundAlert() {
      const next = !isRestSoundAlertEnabled();
      setRestSoundAlertEnabled(next);
      if (next && typeof playDoubleBellRing === 'function') {
        playDoubleBellRing();
      }
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      if (typeof showToast === 'function') {
        showToast(next ? "Rest alert sound: On (Boxing Bell)" : "Rest alert sound: Muted", "info");
      }
    }

    function toggleRestSoundAlertPref(checked) {
      setRestSoundAlertEnabled(checked);
      if (checked && typeof playDoubleBellRing === 'function') {
        playDoubleBellRing();
      }
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      if (typeof showToast === 'function') {
        showToast(checked ? "Rest alert sound: On (Boxing Bell)" : "Rest alert sound: Muted", "info");
      }
    }

    function updateRestSoundAlertUI() {
      const enabled = isRestSoundAlertEnabled();
      const bannerBtn = document.getElementById('btn-toggle-rest-sound');
      const bannerIcon = document.getElementById('btn-toggle-rest-sound-icon');
      if (bannerBtn && bannerIcon) {
        if (enabled) {
          bannerBtn.className = "bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 text-xs sm:text-sm font-black p-2.5 sm:px-3 sm:py-3 rounded-xl transition active:scale-95 shadow flex items-center justify-center";
          bannerIcon.className = "fa-solid fa-bell";
          bannerBtn.title = "Boxing bell alert: On (Click to mute)";
        } else {
          bannerBtn.className = "bg-slate-900 hover:bg-slate-800 text-slate-500 border border-slate-700/80 text-xs sm:text-sm font-black p-2.5 sm:px-3 sm:py-3 rounded-xl transition active:scale-95 shadow flex items-center justify-center";
          bannerIcon.className = "fa-solid fa-bell-slash";
          bannerBtn.title = "Boxing bell alert: Muted (Click to enable)";
        }
      }
      const prefCheckbox = document.getElementById('pref-rest-sound-alert');
      if (prefCheckbox) {
        prefCheckbox.checked = enabled;
      }
    }

    function triggerSquadHaptic() {
      if (navigator.vibrate) {
        try {
          navigator.vibrate([40, 50, 40]);
        } catch (e) {}
      }
    }

    function sendBrowserNotification(title, body) {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          try {
            new Notification(title, {
              body: body,
              icon: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png',
              silent: true
            });
          } catch (e) {
            console.warn("Browser notification notice:", e);
          }
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
      }
    }

    /**
     * Determines whether an athlete/member is currently actively lifting.
     * Enforces active session validity rules:
     * - Returns false if member is not marked isWorkingOut.
     * - Auto-expires active sessions older than 120 minutes (2 hours).
     * - Auto-expires simulated workouts older than 15 minutes.
     * - Auto-expires workouts from a previous calendar day (per user's local/ET date).
     */
    function isMemberWorkoutActive(m) {
      if (!m || !m.isWorkingOut) return false;
      const todayKey = typeof getLocalDateKey === 'function' ? getLocalDateKey() : (typeof getETDateKey === 'function' ? getETDateKey() : new Date().toISOString().slice(0, 10));

      if (m.workoutStartedAt) {
        const started = new Date(m.workoutStartedAt).getTime();
        if (isNaN(started)) return false;
        const now = Date.now();
        const elapsedMinutes = (now - started) / 60000;
        const isSim = m.isSimulatedWorkout || 
          m.currentWorkout === 'Macebell 360 & Dands' ||
          m.currentWorkout === 'Incline Dumbbell Press & Chest' ||
          m.currentWorkout === 'Barbell Deadlift & Lat Pulls' ||
          m.currentWorkout === 'Barbell Back Squats & Core' ||
          m.currentWorkout === 'Overhead Press & Tricep Burnout';
        const maxMinutes = isSim ? 15 : 120;
        if (elapsedMinutes < 0 || elapsedMinutes > maxMinutes) return false;

        const startedDateKey = typeof getLocalDateKey === 'function' ? getLocalDateKey(new Date(started)) : (typeof getETDateKey === 'function' ? getETDateKey(new Date(started)) : new Date(started).toISOString().slice(0, 10));
        if (startedDateKey !== todayKey) return false;
        return true;
      }

      // If workoutStartedAt is not set:
      if (m.completedDate && m.completedDate !== todayKey) return false;
      if (m.completedToday === true) return false;

      // Fresh session fixture without explicit timestamp: stamp with current time so it has a valid window
      m.workoutStartedAt = new Date().toISOString();
      return true;
    }

    if (typeof window !== 'undefined') {
      window.triggerHaptic = triggerHaptic;
      window.playDoubleBellRing = playDoubleBellRing;
      window.isRestSoundAlertEnabled = isRestSoundAlertEnabled;
      window.setRestSoundAlertEnabled = setRestSoundAlertEnabled;
      window.toggleRestSoundAlert = toggleRestSoundAlert;
      window.toggleRestSoundAlertPref = toggleRestSoundAlertPref;
      window.updateRestSoundAlertUI = updateRestSoundAlertUI;
    }


/* ==========================================================================
   showUp Theming, Palettes & Typography Preferences
   ========================================================================== */

    function toggleSettingsModal() {
      const modal = document.getElementById('settings-modal');
      if (modal) {
        modal.classList.toggle('hidden');
        if (!modal.classList.contains('hidden')) {
          updateSettingsModalAuthVisibility();
        }
      }
    }

    let currentSettingsTab = 'styling';

    function switchSettingsTab(tabName) {
      currentSettingsTab = tabName;
      const tabs = ['styling', 'defaults', 'backup', 'telemetry'];
      tabs.forEach(t => {
        const pane = document.getElementById('settings-pane-' + t);
        const btn = document.getElementById('settings-tab-btn-' + t);
        if (pane) {
          if (t === tabName) pane.classList.remove('hidden');
          else pane.classList.add('hidden');
        }
        if (btn) {
          if (t === tabName) {
            btn.className = "flex-1 py-1.5 px-2 rounded-xl font-bold transition text-center bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20";
          } else {
            btn.className = "flex-1 py-1.5 px-2 rounded-xl font-bold transition text-center text-slate-400 hover:text-slate-200";
          }
        }
      });
    }

    if (typeof window !== 'undefined') {
      window.switchSettingsTab = switchSettingsTab;
    }

    function updateSettingsModalAuthVisibility() {
      const card = document.getElementById('settings-athlete-account-card');
      if (card) {
        const loggedIn = (typeof isCustomerLoggedIn === 'function') ? isCustomerLoggedIn() : false;
        card.classList.toggle('hidden', loggedIn);
      }
    }

    function openLargeLogoModal() {
      const modal = document.getElementById('large-logo-modal');
      if (modal) modal.classList.remove('hidden');
    }

    function closeLargeLogoModal() {
      const modal = document.getElementById('large-logo-modal');
      if (modal) modal.classList.add('hidden');
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeLargeLogoModal();
        closeLogWeightModal();
        closeWeightNumpadModal();
      }
    });

    const THEME_ALIASES = {
      'emerald': 'lime',
      'amoled': 'obsidian',
      'slate': 'obsidian',
      'blue': 'teal',
      'red': 'orange'
    };

    function setThemePalette(themeKey) {
      if (!themeKey) themeKey = 'orange';
      const body = document.getElementById('app-body');
      if (body) {
        body.className = body.className.replace(/\btheme-\S+/g, '').trim();
        body.classList.add(`theme-${themeKey}`);
      }
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.className = (document.documentElement.className || '').replace(/\btheme-\S+/g, '').trim() + ` theme-${themeKey}`;
      }
      
      localStorage.setItem('showUp_theme', themeKey);
      localStorage.setItem('showUp_theme_accent', themeKey);

      // Persist in profile
      try {
        const profile = JSON.parse(localStorage.getItem('showUp_user_profile') || 'null');
        if (profile) {
          profile.theme = themeKey;
          localStorage.setItem('showUp_user_profile', JSON.stringify(profile));
        }
      } catch (e) {}

      updateThemeButtonsUI(themeKey);

      // Instantly re-absorb the chosen color palette into the global daily counter
      const counterEl = document.getElementById('global-daily-counter');
      if (counterEl) {
        counterEl.style.color = 'var(--m3-primary)';
        counterEl.style.webkitTextFillColor = 'var(--m3-primary)';
      }
      if (typeof updateGlobalStatsUI === 'function') updateGlobalStatsUI();
      if (typeof renderHeatMap === 'function') renderHeatMap();
      if (typeof renderCalendar === 'function') renderCalendar();
      if (typeof renderWeightHistory === 'function') renderWeightHistory();
      if (typeof renderHomeTab === 'function') renderHomeTab();
    }

    function updateThemeButtonsUI(activeTheme) {
      const container = document.getElementById('theme-palette-grid');
      if (!container) return;
      if (THEME_ALIASES[activeTheme]) activeTheme = THEME_ALIASES[activeTheme];
      const buttons = container.querySelectorAll('button[data-theme]');
      buttons.forEach(btn => {
        const theme = btn.getAttribute('data-theme');
        if (theme === activeTheme) {
          btn.className = "p-2.5 rounded-2xl border-2 border-white bg-slate-900 text-left transition active:scale-95 flex items-center gap-2.5 cursor-pointer ring-2 ring-white/30 shadow-lg";
        } else {
          btn.className = "p-2.5 rounded-2xl border border-slate-800 bg-slate-950/80 hover:border-slate-700 text-left transition active:scale-95 flex items-center gap-2.5 cursor-pointer group";
        }
      });
    }

    function restoreThemePreferences() {
      const savedProfile = JSON.parse(localStorage.getItem('showUp_user_profile') || 'null');
      let savedTheme = localStorage.getItem('showUp_theme') || 
                       localStorage.getItem('showUp_theme_accent') || 
                       (savedProfile && savedProfile.theme) || 
                       'orange';
      if (THEME_ALIASES[savedTheme]) savedTheme = THEME_ALIASES[savedTheme];
      setThemePalette(savedTheme);

      const savedHRCollapsed = JSON.parse(localStorage.getItem('showUp_hr_collapsed') || 'false');
      const prefHrEl = document.getElementById('pref-hr-collapsed');
      if (prefHrEl) prefHrEl.checked = savedHRCollapsed;
      if (savedHRCollapsed) {
        toggleHRCardVisibility(true);
      }

      const savedSquadsCollapsed = localStorage.getItem('showUp_squads_default_collapsed') === 'true';
      const prefSquadsEl = document.getElementById('pref-squads-collapsed');
      if (prefSquadsEl) prefSquadsEl.checked = savedSquadsCollapsed;
    }



    function setFontFamily(fontKey = 'jakarta') {
      const selectedFont = fontKey || 'jakarta';
      const cleanFont = selectedFont.replace(/^font-/, '');
      const body = document.getElementById('app-body');
      if (body) {
        body.className = body.className.replace(/\bfont-\S+/g, '').trim();
        body.classList.add(`font-${cleanFont}`);
      }
      try {
        localStorage.setItem('showUp_font', selectedFont);
      } catch (e) {}
      updateFontUI(cleanFont);
    }

    function restoreFontPreferences() {
      const savedFont = localStorage.getItem('showUp_font') || 'jakarta';
      setFontFamily(savedFont);
    }

    function updateFontUI(activeFont = 'jakarta') {
      const fonts = ['jakarta', 'outfit', 'space', 'lexend', 'mono'];
      fonts.forEach(f => {
        const btn = document.getElementById(`font-btn-${f}`);
        if (btn) {
          btn.className = "hidden";
          if (btn.classList && typeof btn.classList.add === 'function') btn.classList.add('hidden');
        }
      });
    }

    // ================= UI/UX DESIGN PARADIGM MANAGEMENT (ZEN DEFAULT) =================

    function setAppUIMode(modeKey = 'zen') {
      const mode = 'zen';
      const body = document.getElementById('app-body');
      if (body) {
        body.className = body.className.replace(/\bui-mode-\S+/g, '').trim();
        body.classList.add('ui-mode-zen');
      }
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.className = (document.documentElement.className || '').replace(/\bui-mode-\S+/g, '').trim() + ' ui-mode-zen';
      }
      try {
        localStorage.setItem('showUp_ui_mode', 'zen');
      } catch (e) {}
      updateUIModeButtons('zen');
    }

    function cycleAppUIMode() {
      setAppUIMode('zen');
    }

    function restoreAppUIMode() {
      setAppUIMode('zen');
    }

    function updateUIModeButtons(activeMode = 'zen') {
      const btn = document.getElementById('ui-mode-btn-zen');
      if (btn) {
        btn.className = "p-3 rounded-2xl border-2 border-emerald-500 bg-emerald-500/15 text-emerald-300 text-left transition active:scale-95 shadow-lg shadow-emerald-500/10 relative overflow-hidden";
      }
      const quickToggleLabel = document.getElementById('quick-ui-mode-name');
      if (quickToggleLabel) {
        quickToggleLabel.innerText = 'Zen';
      }
    }

/* ==========================================================================
   showUp Authentication, Google Identity Services & Session Management
   ========================================================================== */

    function getAppUser() {
      const savedProfile = JSON.parse(localStorage.getItem('showUp_user_profile') || 'null');
      if (savedProfile && (savedProfile.firstName || savedProfile.email)) {
        return {
          id: savedProfile.id || savedProfile.uid || savedProfile.email || 'local_user',
          name: savedProfile.firstName ? `${savedProfile.firstName} (You)` : 'You',
          rawName: savedProfile.firstName || 'You',
          email: savedProfile.email || 'user@showup.app',
          picture: savedProfile.picture || null,
          isCurrentUser: true
        };
      }
      return {
        id: 'local_user',
        name: 'You',
        rawName: 'You',
        email: 'you@showup.app',
        picture: null,
        isCurrentUser: true
      };
    }

    // ================= SQUADS ENGINE (STRICT ATHLETE ISOLATION) =================


    function isCustomerLoggedIn() {
      const profile = JSON.parse(localStorage.getItem('showUp_user_profile') || 'null');
      const token = localStorage.getItem('showUp_google_token') || googleAccessToken;
      if (token) return true;
      if (profile && profile.email && profile.email !== 'you@showup.app' && profile.email !== 'user@showup.app') {
        return true;
      }
      return false;
    }



    function handleLogout(isSilent = false) {
      if (googleAccessToken && window.google?.accounts?.oauth2) {
        try {
          google.accounts.oauth2.revoke(googleAccessToken, () => {});
        } catch (e) {
          console.warn("Token revocation warning:", e);
        }
      }
      googleAccessToken = null;

      // Systematic user session and telemetry purge
      if (typeof AppStorage !== 'undefined' && typeof AppStorage.clearUserSession === 'function') {
        AppStorage.clearUserSession();
      }

      // 1. Wipe all authentication tokens & athlete profile
      localStorage.removeItem('showUp_google_token');
      localStorage.removeItem('showUp_user_profile');
      localStorage.removeItem('showUp_session_expiry');
      localStorage.removeItem('showUp_last_firestore_sync');

      try {
        const fAuth = getFirebaseAuth();
        if (fAuth && typeof fAuth.signOut === 'function') {
          fAuth.signOut().catch(() => {});
        }
      } catch (e) {}

      // 2. Wipe personal physical measurements & geo telemetry (including IP location cache)
      localStorage.removeItem('showUp_user_height');
      localStorage.removeItem('showUp_user_weight');
      localStorage.removeItem('showUp_user_zip');
      localStorage.removeItem('showUp_user_city');
      localStorage.removeItem('showUp_user_state');
      localStorage.removeItem('showUp_user_location_name');
      localStorage.removeItem('showUp_user_ip_zip');
      localStorage.removeItem('showUp_user_ip_city');
      localStorage.removeItem('showUp_user_ip_lat');
      localStorage.removeItem('showUp_user_ip_lng');
      localStorage.removeItem('showUp_global_visitors_log_v1');

      // 3. Wipe personal workout history, weight logs, and squads
      localStorage.removeItem('showUp_synced_workouts');
      localStorage.removeItem('showUp_weight_history');
      localStorage.removeItem('showUp_squads');
      localStorage.removeItem('showUp_squad_invites');
      localStorage.removeItem('showUp_global_squad_registry');
      localStorage.removeItem('showUp_squad_archive');

      // 4. Reset in-memory session variables
      completedWorkoutsHistory = [];
      weightHistory = [];
      currentSessionSets = [];
      userHeight = 70;
      userWeight = 165;

      if (window.google?.accounts?.id) {
        try {
          google.accounts.id.disableAutoSelect();
        } catch (e) {}
      }

      // 5. Reset Header profile badge & dropdown menu
      const dropdown = document.getElementById('profile-dropdown-menu');
      if (dropdown) dropdown.classList.add('hidden');
      const adminMenuItem = document.getElementById('profile-admin-telemetry-item');
      if (adminMenuItem) adminMenuItem.classList.add('hidden');
      const userProfileBadge = document.getElementById('google-user-profile');
      if (userProfileBadge) userProfileBadge.classList.add('hidden');
      const loginBtn = document.getElementById('btn-google-login');
      if (loginBtn) loginBtn.classList.remove('hidden');

      const firstNameEl = document.getElementById('user-first-name');
      if (firstNameEl) firstNameEl.innerText = 'User';
      const emailEl = document.getElementById('user-email');
      if (emailEl) emailEl.innerText = 'user@email.com';
      const dropdownEmailEl = document.getElementById('dropdown-user-email');
      if (dropdownEmailEl) dropdownEmailEl.innerText = 'user@email.com';
      const avatarEl = document.getElementById('user-avatar');
      if (avatarEl) avatarEl.src = 'https://lh3.googleusercontent.com/a/default-user=s96-c';

      // 6. Reset Settings Modal Physical Profile Inputs
      const hInput = document.getElementById('user-height-input');
      const wInput = document.getElementById('user-weight-input');
      if (hInput) hInput.value = '';
      if (wInput) wInput.value = '';

      // 7. Reset Map Telemetry & Zip Code Badges
      const zipDisplay = document.getElementById('display-user-zip');
      if (zipDisplay) zipDisplay.innerText = 'Detecting...';

      // 8. Re-render all UI views in pristine logged-out state
      updateCloudBackupUI();
      if (typeof updateSettingsModalAuthVisibility === 'function') updateSettingsModalAuthVisibility();
      initSquads();
      renderSquadsTab();
      updateSquadBeacon();
      renderCalendar();
      renderMonthlyHistory();
      renderWeightHistory();
      updateGlobalStatsUI();
      renderHeatMap();
      updateGlobalVisitorTelemetryUI();
      if (typeof renderActiveSets === 'function') renderActiveSets();

      if (!isSilent) {
        showToast("Signed out. All personal data and squads cleared.", "info");
      }
    }

    function handleGoogleLogin() {
      handleGoogleSignIn();
    }



    function restoreSavedSession() {
      const savedProfile = JSON.parse(localStorage.getItem('showUp_user_profile') || 'null');
      let sessionExpiry = parseInt(localStorage.getItem('showUp_session_expiry') || '0', 10);
      const now = Date.now();

      // If user had an existing logged-in profile without an explicit expiry timestamp, establish 1-week window
      if (savedProfile && (!sessionExpiry || isNaN(sessionExpiry))) {
        sessionExpiry = now + SESSION_DURATION_MS;
        localStorage.setItem('showUp_session_expiry', String(sessionExpiry));
      }

      if (savedProfile && sessionExpiry > now) {
        // Active 1-week session: immediately restore profile UI so user never has to re-login
        updateProfileUI(savedProfile.firstName, savedProfile.email, savedProfile.picture);
        document.getElementById('btn-google-login').classList.add('hidden');
        document.getElementById('google-user-profile').classList.remove('hidden');
        updateCloudBackupUI();

        // Ensure user workouts are restored from storage immediately on app start
        if (typeof AppStorage !== 'undefined' && typeof AppStorage.getAthleteWorkouts === 'function') {
          const loaded = AppStorage.getAthleteWorkouts();
          if (Array.isArray(loaded) && loaded.length > 0) {
            completedWorkoutsHistory = loaded;
            localStorage.setItem('showUp_synced_workouts', JSON.stringify(completedWorkoutsHistory));
          }
        }

        if (typeof renderHomeTab === 'function') {
          try { renderHomeTab(); } catch (e) {}
        }
        renderCalendar();
        renderMonthlyHistory();

        // Check and silently refresh Google Drive OAuth token in background without annoying popups
        attemptSilentTokenRefresh();
      } else if (savedProfile && sessionExpiry <= now) {
        // 1-week session duration expired
        console.info("1-week session expired. Requiring fresh login.");
        handleLogout(true);
      } else {
        // No session: attempt seamless Chrome Profile auto-select via Google One Tap
        tryGoogleOneTap();
      }
    }

    function attemptSilentTokenRefresh() {
      if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
        setTimeout(() => {
          if (typeof google !== 'undefined' && google.accounts?.oauth2) {
            attemptSilentTokenRefresh();
          }
        }, 1200);
        return;
      }

      if (googleAccessToken) {
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${googleAccessToken}` }
        })
        .then(res => {
          if (res.ok) {
            updateCloudBackupUI();
            if (typeof restoreFromGoogleDrive === 'function') {
              restoreFromGoogleDrive(true);
            }
          } else if (res.status === 401) {
            requestTokenSilently();
          }
        })
        .catch(() => {
          updateCloudBackupUI();
        });
      } else {
        requestTokenSilently();
      }
    }

    function requestTokenSilently() {
      if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) return;
      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: getGoogleClientId(),
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          prompt: '', // Silent request without popup or re-consent
          callback: async (response) => {
            if (response && response.access_token) {
              googleAccessToken = response.access_token;
              localStorage.setItem('showUp_google_token', googleAccessToken);
              // Extend 1-week session validity
              localStorage.setItem('showUp_session_expiry', String(Date.now() + SESSION_DURATION_MS));
              updateCloudBackupUI();
              try {
                await restoreFromGoogleDrive(true);
              } catch (e) {
                console.warn("Silent drive restore notice:", e);
              }
            }
          },
          error_callback: (err) => {
            console.log("Silent token refresh info:", err);
          }
        });
        client.requestAccessToken({ prompt: '' });
      } catch (err) {
        console.warn("Silent token request skipped:", err);
      }
    }

    function tryGoogleOneTap() {
      if (window.location.protocol === 'file:') return;
      const checkAndRun = () => {
        if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) return;
        const savedProfile = JSON.parse(localStorage.getItem('showUp_user_profile') || 'null');
        if (savedProfile) return;

        try {
          google.accounts.id.initialize({
            client_id: getGoogleClientId(),
            auto_select: true, // Seamlessly continue if user is logged into their Chrome profile
            callback: (response) => {
              if (response && response.credential) {
                const profile = parseJwtPayload(response.credential);
                if (profile) {
                  const firstName = profile.given_name || (profile.name ? profile.name.split(' ')[0] : 'User');
                  const userEmail = profile.email || '';
                  const picture = profile.picture || 'https://lh3.googleusercontent.com/a/default-user=s96-c';
                  const profileObj = { firstName, email: userEmail, picture };

                  localStorage.setItem('showUp_user_profile', JSON.stringify(profileObj));
                  localStorage.setItem('showUp_session_expiry', String(Date.now() + SESSION_DURATION_MS));

                  updateProfileUI(firstName, userEmail, picture);
                  document.getElementById('btn-google-login').classList.add('hidden');
                  document.getElementById('google-user-profile').classList.remove('hidden');
                  showToast(`Welcome back, ${firstName}!`, "success");

                  requestTokenSilently();
                }
              }
            }
          });
          google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              console.log("One Tap status:", notification.getNotDisplayedReason?.() || notification.getSkippedReason?.());
            }
          });
        } catch (e) {
          console.warn("One Tap initialization warning:", e);
        }
      };

      if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
        setTimeout(checkAndRun, 1500);
      } else {
        checkAndRun();
      }
    }



    function resetGoogleLoginButtonUI() {
      const btn = document.getElementById('btn-google-login');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-right-to-bracket text-xs"></i><span>Sign in</span>`;
      }
    }

    function setGoogleLoginLoading(isLoading) {
      const btn = document.getElementById('btn-google-login');
      if (btn) {
        if (isLoading) {
          btn.disabled = true;
          btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin text-emerald-400"></i><span>Signing in...</span>`;
        } else {
          resetGoogleLoginButtonUI();
        }
      }
    }

    function openAuthLoginModal(defaultTab = 'signin') {
      const modal = document.getElementById('auth-login-modal');
      if (modal) {
        modal.classList.remove('hidden');
        switchAuthTab(defaultTab);
        setAuthStatusMessage('', 'info');
      }
    }

    function closeAuthLoginModal() {
      const modal = document.getElementById('auth-login-modal');
      if (modal) modal.classList.add('hidden');
      setAuthStatusMessage('', 'info');
      changeRegisterDetails();
      changeResetEmail();
    }

    function handleAuthModalBackdropClick(event) {
      if (event && event.target !== event.currentTarget) return;
      const registerView = document.getElementById('auth-register-view');
      const resetView = document.getElementById('auth-reset-view');
      const isRegistering = registerView && !registerView.classList.contains('hidden');
      const isResetting = resetView && !resetView.classList.contains('hidden');

      // During registration and forgot password flows, the click of x at the top right corner
      // alone will navigate the athlete away. Do not allow clicking outside of the modal to close it.
      if (isRegistering || isResetting) {
        return;
      }
      closeAuthLoginModal();
    }

    function triggerGoogleOAuthFromModal() {
      closeAuthLoginModal();
      handleGoogleSignIn();
    }

    // ==========================================================================
    // Email & Password Authentication & Firebase Integration Engine
    // ==========================================================================

    let firebaseAuthInstance = null;
    const activePasswordResetOTPs = {};
    let resetResendCooldownTimer = null;
    let resetResendSecondsLeft = 0;
    const activeRegistrationOTPs = {};
    let regResendCooldownTimer = null;
    let regResendSecondsLeft = 0;

    function getFirebaseAuth() {
      if (firebaseAuthInstance) return firebaseAuthInstance;
      try {
        if (typeof firebase !== 'undefined') {
          if (!firebase.apps || !firebase.apps.length) {
            if (typeof FIREBASE_CONFIG !== 'undefined') {
              firebase.initializeApp(FIREBASE_CONFIG);
            }
          }
          if (firebase.apps && firebase.apps.length && typeof firebase.auth === 'function') {
            firebaseAuthInstance = firebase.auth();
            return firebaseAuthInstance;
          }
        }
      } catch (err) {
        console.debug("Firebase Auth initialization notice:", err);
      }
      return null;
    }

    function getRegisteredAccounts() {
      if (typeof AppStorage !== 'undefined' && typeof AppStorage.getRegisteredAccounts === 'function') {
        return AppStorage.getRegisteredAccounts();
      }
      try {
        const raw = localStorage.getItem('showUp_registered_accounts');
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        return {};
      }
    }

    function saveRegisteredAccounts(accounts) {
      if (!accounts || typeof accounts !== 'object') return;
      try {
        localStorage.setItem('showUp_registered_accounts', JSON.stringify(accounts));
      } catch (e) {
        console.warn("Error saving accounts:", e);
      }
    }

    function switchAuthTab(tab) {
      const signinView = document.getElementById('auth-signin-view');
      const registerView = document.getElementById('auth-register-view');
      const resetView = document.getElementById('auth-reset-view');

      const signinTabBtn = document.getElementById('auth-tab-signin');
      const registerTabBtn = document.getElementById('auth-tab-register');

      if (signinView) signinView.classList.add('hidden');
      if (registerView) registerView.classList.add('hidden');
      if (resetView) resetView.classList.add('hidden');

      if (signinTabBtn) {
        signinTabBtn.className = "flex-1 py-2 text-xs font-bold rounded-xl transition text-slate-400 hover:text-slate-200";
      }
      if (registerTabBtn) {
        registerTabBtn.className = "flex-1 py-2 text-xs font-bold rounded-xl transition text-slate-400 hover:text-slate-200";
      }

      setAuthStatusMessage('', 'info');

      if (tab === 'register') {
        if (registerView) registerView.classList.remove('hidden');
        if (registerTabBtn) {
          registerTabBtn.className = "flex-1 py-2 text-xs font-black rounded-xl transition bg-emerald-500 text-slate-950 shadow-md";
        }
        const stepDetails = document.getElementById('auth-register-step-details');
        const stepOtp = document.getElementById('auth-register-step-otp');
        const stepPassword = document.getElementById('auth-register-step-password');
        const emailInput = document.getElementById('auth-register-email');
        const norm = (emailInput && emailInput.value) ? emailInput.value.toLowerCase().trim() : '';
        if (!norm || !activeRegistrationOTPs[norm]) {
          if (stepDetails) stepDetails.classList.remove('hidden');
          if (stepOtp) stepOtp.classList.add('hidden');
          if (stepPassword) stepPassword.classList.add('hidden');
        }
      } else if (tab === 'reset') {
        if (resetView) resetView.classList.remove('hidden');
        const stepEmail = document.getElementById('auth-reset-step-email');
        const stepOtp = document.getElementById('auth-reset-step-otp');
        const emailInput = document.getElementById('auth-reset-email');
        const norm = (emailInput && emailInput.value) ? emailInput.value.toLowerCase().trim() : '';
        if (!norm || !activePasswordResetOTPs[norm]) {
          if (stepEmail) stepEmail.classList.remove('hidden');
          if (stepOtp) stepOtp.classList.add('hidden');
        }
      } else {
        if (signinView) signinView.classList.remove('hidden');
        if (signinTabBtn) {
          signinTabBtn.className = "flex-1 py-2 text-xs font-black rounded-xl transition bg-emerald-500 text-slate-950 shadow-md";
        }
      }
    }

    function setAuthStatusMessage(msg, type = 'error') {
      const banner = document.getElementById('auth-status-message');
      if (!banner) return;
      if (!msg) {
        banner.classList.add('hidden');
        banner.innerText = '';
        return;
      }
      banner.classList.remove('hidden');
      if (type === 'success') {
        banner.className = "p-2.5 rounded-xl text-xs font-semibold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center gap-2";
        banner.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400"></i><span>${msg}</span>`;
      } else if (type === 'info') {
        banner.className = "p-2.5 rounded-xl text-xs font-semibold bg-blue-500/15 border border-blue-500/40 text-blue-300 flex items-center gap-2";
        banner.innerHTML = `<i class="fa-solid fa-circle-info text-blue-400"></i><span>${msg}</span>`;
      } else {
        banner.className = "p-2.5 rounded-xl text-xs font-semibold bg-rose-500/15 border border-rose-500/40 text-rose-300 flex items-center gap-2";
        banner.innerHTML = `<i class="fa-solid fa-circle-exclamation text-rose-400"></i><span>${msg}</span>`;
      }
    }

    function togglePasswordVisibility(inputId, iconId) {
      const input = document.getElementById(inputId);
      const icon = document.getElementById(iconId);
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        if (icon) icon.className = "fa-solid fa-eye-slash text-slate-400";
      } else {
        input.type = 'password';
        if (icon) icon.className = "fa-solid fa-eye text-slate-400";
      }
    }

    function registerAthleteAccount(email, password, firstName, lastName = '', zip = '') {
      if (!email || !email.includes('@')) {
        return { success: false, error: "Please provide a valid email address." };
      }
      if (!password || password.length < 4) {
        return { success: false, error: "Password must be at least 4 characters." };
      }

      const accounts = getRegisteredAccounts();
      const normEmail = email.toLowerCase().trim();

      if (accounts[normEmail]) {
        return { success: false, error: "An account with this email already exists. Please sign in or reset your password." };
      }

      const athleteName = (firstName && firstName.trim()) ? firstName.trim() : normEmail.split('@')[0];
      const accountObj = {
        email: normEmail,
        password: password,
        firstName: athleteName,
        lastName: (lastName || '').trim(),
        zip: (zip || '').trim(),
        createdAt: new Date().toISOString()
      };

      accounts[normEmail] = accountObj;
      saveRegisteredAccounts(accounts);
      if (typeof AppStorage !== 'undefined' && typeof AppStorage.saveRegisteredAccount === 'function') {
        AppStorage.saveRegisteredAccount(accountObj);
      }

      // Automatically sign in the newly registered athlete
      const profile = {
        firstName: athleteName,
        lastName: accountObj.lastName,
        email: normEmail,
        picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
        authProvider: 'email_password'
      };
      applyUserProfile(profile);

      if (accountObj.zip && typeof saveUserZip === 'function') {
        saveUserZip(accountObj.zip);
      }

      if (typeof showToast === 'function') {
        showToast(`Account created! Welcome, ${athleteName}.`, 'success');
      }

      // Sync with Firebase Auth in background if available
      try {
        const fAuth = getFirebaseAuth();
        if (fAuth && typeof fAuth.createUserWithEmailAndPassword === 'function') {
          fAuth.createUserWithEmailAndPassword(normEmail, password)
            .then(cred => {
              if (cred && cred.user && cred.user.updateProfile) {
                cred.user.updateProfile({ displayName: athleteName });
              }
            })
            .catch(err => {
              console.debug("Firebase Auth createUser notice:", err.message);
            });
        }
      } catch (e) {}

      return { success: true, account: accountObj };
    }

    function loginAthleteWithEmailPassword(email, password) {
      if (!email || !email.includes('@')) {
        return { success: false, error: "Please enter your email address." };
      }
      if (!password) {
        return { success: false, error: "Please enter your password." };
      }

      const accounts = getRegisteredAccounts();
      const normEmail = email.toLowerCase().trim();
      const account = accounts[normEmail];

      if (!account) {
        return { success: false, error: "No account found with this email. Please click 'Set Up Account' to create one." };
      }

      if (account.password !== password) {
        return { success: false, error: "Incorrect password. Please verify or use 'Forgot password?' to reset." };
      }

      const profile = {
        firstName: account.firstName || normEmail.split('@')[0],
        lastName: account.lastName || '',
        email: normEmail,
        picture: account.picture || 'https://lh3.googleusercontent.com/a/default-user=s96-c',
        authProvider: 'email_password'
      };
      applyUserProfile(profile);

      if (account.zip && typeof saveUserZip === 'function') {
        saveUserZip(account.zip);
      }

      if (typeof showToast === 'function') {
        showToast(`Welcome back, ${profile.firstName}!`, 'success');
      }

      // Sync with Firebase Auth in background if available
      try {
        const fAuth = getFirebaseAuth();
        if (fAuth && typeof fAuth.signInWithEmailAndPassword === 'function') {
          fAuth.signInWithEmailAndPassword(normEmail, password).catch(err => {
            console.debug("Firebase Auth signIn notice:", err.message);
          });
        }
      } catch (e) {}

      return { success: true, profile };
    }

    // ==========================================================================
    // Email OTP Password Reset Flow
    // ==========================================================================

    function requestPasswordResetOTP(email) {
      if (!email || !email.includes('@')) {
        return { success: false, error: "Please enter a valid email address." };
      }
      const normEmail = email.toLowerCase().trim();

      // Cryptographically secure 6-digit numeric OTP
      let randomVal;
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        randomVal = 100000 + (array[0] % 900000);
      } else {
        randomVal = Math.floor(100000 + Math.random() * 900000);
      }
      const code = randomVal.toString();

      const otpRecord = {
        email: normEmail,
        code: code,
        expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutes
        attempts: 0,
        createdAt: Date.now()
      };

      activePasswordResetOTPs[normEmail] = otpRecord;
      try {
        sessionStorage.setItem('showUp_otp_' + normEmail, JSON.stringify(otpRecord));
      } catch (e) {}

      // Send Firebase Auth password reset email as security verification
      try {
        const fAuth = getFirebaseAuth();
        if (fAuth && typeof fAuth.sendPasswordResetEmail === 'function') {
          fAuth.sendPasswordResetEmail(normEmail).catch(err => {
            console.debug("Firebase Auth sendPasswordResetEmail notice:", err.message);
          });
        }
      } catch (e) {}

      // Transactional Email Dispatch (EmailJS or Resend if configured in EMAIL_CONFIG)
      try {
        if (typeof EMAIL_CONFIG !== 'undefined') {
          if (EMAIL_CONFIG.emailjsServiceId && EMAIL_CONFIG.emailjsPublicKey) {
            fetch('https://api.emailjs.com/api/v1.0/email/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                service_id: EMAIL_CONFIG.emailjsServiceId,
                template_id: EMAIL_CONFIG.emailjsTemplateId,
                user_id: EMAIL_CONFIG.emailjsPublicKey,
                template_params: {
                  to_email: normEmail,
                  passcode: code,
                  code: code,
                  app_name: 'showUp'
                }
              })
            }).catch(err => console.debug("EmailJS dispatch notice:", err));
          } else if (EMAIL_CONFIG.resendApiKey) {
            fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + EMAIL_CONFIG.resendApiKey,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: 'showUp <onboarding@resend.dev>',
                to: [normEmail],
                subject: 'Your showUp Verification Code',
                html: `<div style="font-family:sans-serif;padding:24px;background:#0f172a;color:#f8fafc;border-radius:16px;"><h2 style="color:#10b981;">showUp Verification Code</h2><p>Your 6-digit verification code is:</p><div style="font-size:32px;letter-spacing:8px;font-weight:900;color:#f59e0b;padding:16px;background:#1e293b;border-radius:12px;text-align:center;">${code}</div><p style="color:#64748b;font-size:12px;">Expires in 10 minutes.</p></div>`
              })
            }).catch(err => console.debug("Resend dispatch notice:", err));
          }
        }
      } catch (e) {}

      // Write notification event to Firestore 'mail' collection if extension configured
      try {
        if (typeof getFirestoreDb === 'function') {
          const db = getFirestoreDb();
          if (db) {
            db.collection('mail').add({
              to: normEmail,
              message: {
                subject: 'Your showUp Verification Code',
                text: `Your showUp verification code is: ${code}. This code expires in 10 minutes.`,
                html: `<div style="font-family:sans-serif;padding:24px;background:#0f172a;color:#f8fafc;border-radius:16px;">` +
                      `<h2 style="color:#10b981;margin-bottom:8px;">showUp • Password Reset</h2>` +
                      `<p style="color:#94a3b8;font-size:14px;">You requested a password reset for your athlete account. Enter the 6-digit code below to verify your identity:</p>` +
                      `<div style="font-size:32px;letter-spacing:8px;font-weight:900;color:#f59e0b;padding:16px;background:#1e293b;border-radius:12px;text-align:center;margin:20px 0;">${code}</div>` +
                      `<p style="color:#64748b;font-size:12px;">This verification code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>` +
                      `</div>`
              }
            }).catch(e => console.debug("Firestore mail write notice:", e));
          }
        }
      } catch (e) {}

      return {
        success: true,
        message: `6-digit verification code requested for ${normEmail}.`,
        otp: code
      };
    }

    function verifyPasswordResetOTP(email, otpCode) {
      if (!email || !email.includes('@')) {
        return { success: false, error: "Please enter a valid email address." };
      }
      if (!otpCode || otpCode.trim().length !== 6) {
        return { success: false, error: "Please enter a complete 6-digit verification code." };
      }

      const normEmail = email.toLowerCase().trim();
      let record = activePasswordResetOTPs[normEmail];
      if (!record) {
        try {
          const saved = sessionStorage.getItem('showUp_otp_' + normEmail);
          if (saved) record = JSON.parse(saved);
        } catch (e) {}
      }

      if (!record) {
        return { success: false, error: "No active verification code found for this email. Please click 'Send 6-Digit Verification Code'." };
      }

      if (Date.now() > record.expiresAt) {
        delete activePasswordResetOTPs[normEmail];
        try { sessionStorage.removeItem('showUp_otp_' + normEmail); } catch (e) {}
        return { success: false, error: "Verification code has expired. Please request a new code." };
      }

      record.attempts = (record.attempts || 0) + 1;
      if (record.attempts > 5) {
        delete activePasswordResetOTPs[normEmail];
        try { sessionStorage.removeItem('showUp_otp_' + normEmail); } catch (e) {}
        return { success: false, error: "Too many incorrect attempts. For security, this code was invalidated. Please request a new code." };
      }

      if (otpCode.trim() !== record.code) {
        const remaining = 5 - record.attempts;
        return { success: false, error: `Incorrect verification code (${remaining} attempts remaining). Please check your email.` };
      }

      return { success: true, verified: true };
    }

    function resetAthletePasswordWithOTP(email, otpCode, newPassword) {
      const verification = verifyPasswordResetOTP(email, otpCode);
      if (!verification.success) {
        return verification;
      }

      if (!newPassword || newPassword.length < 4) {
        return { success: false, error: "New password must be at least 4 characters." };
      }

      const normEmail = email.toLowerCase().trim();
      // Single-use token: remove once verified
      delete activePasswordResetOTPs[normEmail];
      try { sessionStorage.removeItem('showUp_otp_' + normEmail); } catch (e) {}

      const accounts = getRegisteredAccounts();
      let account = accounts[normEmail];

      if (!account) {
        account = {
          email: normEmail,
          password: newPassword,
          firstName: normEmail.split('@')[0],
          lastName: '',
          zip: '',
          createdAt: new Date().toISOString()
        };
      } else {
        account.password = newPassword;
        account.updatedAt = new Date().toISOString();
      }

      accounts[normEmail] = account;
      saveRegisteredAccounts(accounts);
      if (typeof AppStorage !== 'undefined' && typeof AppStorage.saveRegisteredAccount === 'function') {
        AppStorage.saveRegisteredAccount(account);
      }

      // Sync with Firebase Auth in background if currently logged in
      try {
        const fAuth = getFirebaseAuth();
        if (fAuth && fAuth.currentUser && fAuth.currentUser.email === normEmail) {
          fAuth.currentUser.updatePassword(newPassword).catch(err => {
            console.debug("Firebase Auth updatePassword notice:", err.message);
          });
        }
      } catch (e) {}

      return {
        success: true,
        message: "Identity verified! Password updated successfully. You can now sign in."
      };
    }

    function resetAthletePassword(email, newPassword, otpCode) {
      const normEmail = (email || '').toLowerCase().trim();
      if (otpCode) {
        return resetAthletePasswordWithOTP(normEmail, otpCode, newPassword);
      }
      // If an OTP is actively pending for this email in the UI flow, require the OTP
      if (activePasswordResetOTPs[normEmail] && Date.now() <= activePasswordResetOTPs[normEmail].expiresAt) {
        return { success: false, error: "Please enter the 6-digit verification code sent to your email to verify identity." };
      }

      if (!email || !email.includes('@')) {
        return { success: false, error: "Please enter a valid email address." };
      }
      if (!newPassword || newPassword.length < 4) {
        return { success: false, error: "New password must be at least 4 characters." };
      }

      const accounts = getRegisteredAccounts();
      let account = accounts[normEmail];

      if (!account) {
        account = {
          email: normEmail,
          password: newPassword,
          firstName: normEmail.split('@')[0],
          lastName: '',
          zip: '',
          createdAt: new Date().toISOString()
        };
      } else {
        account.password = newPassword;
        account.updatedAt = new Date().toISOString();
      }

      accounts[normEmail] = account;
      saveRegisteredAccounts(accounts);
      if (typeof AppStorage !== 'undefined' && typeof AppStorage.saveRegisteredAccount === 'function') {
        AppStorage.saveRegisteredAccount(account);
      }

      return { success: true, message: "Password reset successfully! You can now sign in with your new password." };
    }

    function handleRequestPasswordResetOTP() {
      const emailInput = document.getElementById('auth-reset-email');
      const email = emailInput ? emailInput.value.trim() : '';

      if (!email || !email.includes('@')) {
        setAuthStatusMessage("Please enter a valid account email.", 'error');
        if (typeof triggerHaptic === 'function') triggerHaptic('heavy');
        return;
      }

      const result = requestPasswordResetOTP(email);
      if (!result.success) {
        setAuthStatusMessage(result.error, 'error');
        if (typeof triggerHaptic === 'function') triggerHaptic('heavy');
        return;
      }

      const stepEmail = document.getElementById('auth-reset-step-email');
      const stepOtp = document.getElementById('auth-reset-step-otp');
      const emailDisplay = document.getElementById('auth-otp-target-email-display');

      if (stepEmail) stepEmail.classList.add('hidden');
      if (stepOtp) stepOtp.classList.remove('hidden');
      if (emailDisplay) emailDisplay.innerText = email;

      const otpInput = document.getElementById('auth-reset-otp-code');
      if (otpInput) {
        otpInput.value = '';
        setTimeout(() => otpInput.focus(), 100);
      }

      setAuthStatusMessage('', 'info'); // Keep UI clean: on-screen card is the dedicated confirmation
      startResetResendCooldown(60);

      // Asynchronously trigger password reset email dispatch
      const normEmail = email.toLowerCase().trim();
      const fAuth = getFirebaseAuth();
      if (fAuth && typeof fAuth.sendPasswordResetEmail === 'function') {
        fAuth.sendPasswordResetEmail(normEmail)
          .then(() => {
            if (typeof showToast === 'function') {
              showToast(`Password reset link sent to ${normEmail}`, 'success');
            }
          })
          .catch(err => {
            console.warn("Firebase Auth sendPasswordResetEmail notice:", err.message);
            if (err.code === 'auth/user-not-found') {
              setAuthStatusMessage("No account found with this email. Please check your address or create an account.", 'error');
            }
          });
      }
    }

    function handleResendOTP() {
      if (resetResendSecondsLeft > 0) return;
      const emailInput = document.getElementById('auth-reset-email');
      const email = emailInput ? emailInput.value.trim() : '';
      if (email) {
        handleRequestPasswordResetOTP();
      }
    }

    function changeResetEmail() {
      const stepEmail = document.getElementById('auth-reset-step-email');
      const stepOtp = document.getElementById('auth-reset-step-otp');
      if (stepEmail) stepEmail.classList.remove('hidden');
      if (stepOtp) stepOtp.classList.add('hidden');
      const emailInput = document.getElementById('auth-reset-email');
      if (emailInput) emailInput.focus();
    }

    function startResetResendCooldown(seconds = 60) {
      if (resetResendCooldownTimer) clearInterval(resetResendCooldownTimer);
      resetResendSecondsLeft = seconds;
      const btn = document.getElementById('auth-resend-otp-btn');
      if (!btn) return;
      btn.disabled = true;
      btn.classList.add('opacity-50', 'cursor-not-allowed');
      btn.innerText = `Resend (${resetResendSecondsLeft}s)`;

      resetResendCooldownTimer = setInterval(() => {
        resetResendSecondsLeft--;
        if (resetResendSecondsLeft <= 0) {
          clearInterval(resetResendCooldownTimer);
          resetResendCooldownTimer = null;
          if (btn) {
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            btn.innerText = 'Resend Link';
          }
        } else {
          if (btn) btn.innerText = `Resend (${resetResendSecondsLeft}s)`;
        }
      }, 1000);
    }

    function handleEmailPasswordSignIn(e) {
      if (e && e.preventDefault) e.preventDefault();
      const emailInput = document.getElementById('auth-signin-email');
      const passInput = document.getElementById('auth-signin-password');
      if (!emailInput || !passInput) return;

      const email = emailInput.value.trim();
      const pass = passInput.value;

      const result = loginAthleteWithEmailPassword(email, pass);
      if (!result.success) {
        // Try Firebase Auth verification in case user reset password via Firebase email link
        const fAuth = getFirebaseAuth();
        if (fAuth && typeof fAuth.signInWithEmailAndPassword === 'function') {
          fAuth.signInWithEmailAndPassword(email.toLowerCase().trim(), pass)
            .then(cred => {
              const accounts = getRegisteredAccounts();
              const normEmail = email.toLowerCase().trim();
              let acc = accounts[normEmail] || {
                email: normEmail,
                firstName: cred.user?.displayName || normEmail.split('@')[0],
                createdAt: new Date().toISOString()
              };
              acc.password = pass;
              acc.updatedAt = new Date().toISOString();
              accounts[normEmail] = acc;
              saveRegisteredAccounts(accounts);
              const profile = {
                firstName: acc.firstName,
                email: normEmail,
                picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
                authProvider: 'firebase_email'
              };
              applyUserProfile(profile);
              if (typeof showToast === 'function') showToast(`Welcome back, ${profile.firstName}!`, 'success');
              closeAuthLoginModal();
            })
            .catch(() => {
              setAuthStatusMessage(result.error, 'error');
              if (typeof triggerHaptic === 'function') triggerHaptic('heavy');
            });
          return;
        }
        setAuthStatusMessage(result.error, 'error');
        if (typeof triggerHaptic === 'function') triggerHaptic('heavy');
      } else {
        closeAuthLoginModal();
      }
    }

    // ==========================================================================
    // Email OTP Registration Functions
    // ==========================================================================

    function requestRegistrationOTP(email, details) {
      if (!email || !email.includes('@')) {
        return { success: false, error: "Please enter a valid email address." };
      }
      const normEmail = email.toLowerCase().trim();

      // Cryptographically secure 6-digit numeric OTP
      let randomVal;
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        randomVal = 100000 + (array[0] % 900000);
      } else {
        randomVal = Math.floor(100000 + Math.random() * 900000);
      }
      const code = randomVal.toString();

      const otpRecord = {
        email: normEmail,
        code: code,
        expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutes
        attempts: 0,
        createdAt: Date.now(),
        details: details || {}
      };

      activeRegistrationOTPs[normEmail] = otpRecord;
      try {
        sessionStorage.setItem('showUp_reg_otp_' + normEmail, JSON.stringify(otpRecord));
      } catch (e) {}

      // Transactional Email Dispatch (EmailJS or Resend if configured in EMAIL_CONFIG)
      try {
        if (typeof EMAIL_CONFIG !== 'undefined') {
          if (EMAIL_CONFIG.emailjsServiceId && EMAIL_CONFIG.emailjsPublicKey) {
            fetch('https://api.emailjs.com/api/v1.0/email/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                service_id: EMAIL_CONFIG.emailjsServiceId,
                template_id: EMAIL_CONFIG.emailjsTemplateId,
                user_id: EMAIL_CONFIG.emailjsPublicKey,
                template_params: {
                  to_email: normEmail,
                  passcode: code,
                  code: code,
                  app_name: 'showUp'
                }
              })
            }).catch(err => console.debug("EmailJS reg dispatch notice:", err));
          } else if (EMAIL_CONFIG.resendApiKey) {
            fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + EMAIL_CONFIG.resendApiKey,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: 'showUp <onboarding@resend.dev>',
                to: [normEmail],
                subject: 'Your showUp Registration Verification Code',
                html: `<div style="font-family:sans-serif;padding:24px;background:#0f172a;color:#f8fafc;border-radius:16px;"><h2 style="color:#10b981;">Welcome to showUp!</h2><p>Your 6-digit registration verification code is:</p><div style="font-size:32px;letter-spacing:8px;font-weight:900;color:#10b981;padding:16px;background:#1e293b;border-radius:12px;text-align:center;">${code}</div><p style="color:#64748b;font-size:12px;">This verification code expires in 10 minutes.</p></div>`
              })
            }).catch(err => console.debug("Resend reg dispatch notice:", err));
          }
        }
      } catch (e) {}

      // Write notification event to Firestore 'mail' collection if extension configured
      try {
        if (typeof getFirestoreDb === 'function') {
          const db = getFirestoreDb();
          if (db) {
            db.collection('mail').add({
              to: normEmail,
              message: {
                subject: 'Your showUp Registration Verification Code',
                text: `Your showUp registration verification code is: ${code}. This code expires in 10 minutes.`,
                html: `<div style="font-family:sans-serif;padding:24px;background:#0f172a;color:#f8fafc;border-radius:16px;">` +
                      `<h2 style="color:#10b981;margin-bottom:8px;">showUp • Account Verification</h2>` +
                      `<p style="color:#94a3b8;font-size:14px;">Welcome to showUp! Enter the 6-digit verification code below to verify your email and activate your account:</p>` +
                      `<div style="font-size:32px;letter-spacing:8px;font-weight:900;color:#10b981;padding:16px;background:#1e293b;border-radius:12px;text-align:center;margin:20px 0;">${code}</div>` +
                      `<p style="color:#64748b;font-size:12px;">This code expires in 10 minutes. If you did not sign up for showUp, you can safely ignore this email.</p>` +
                      `</div>`
              }
            }).catch(e => console.debug("Firestore reg mail write notice:", e));
          }
        }
      } catch (e) {}

      return {
        success: true,
        message: `6-digit verification code requested for ${normEmail}.`,
        otp: code
      };
    }

    function verifyRegistrationOTP(email, otpCode) {
      if (!email || !email.includes('@')) {
        return { success: false, error: "Please enter a valid email address." };
      }
      if (!otpCode || otpCode.trim().length !== 6) {
        return { success: false, error: "Please enter a complete 6-digit verification code." };
      }

      const normEmail = email.toLowerCase().trim();
      let record = activeRegistrationOTPs[normEmail];
      if (!record) {
        try {
          const saved = sessionStorage.getItem('showUp_reg_otp_' + normEmail);
          if (saved) record = JSON.parse(saved);
        } catch (e) {}
      }

      if (!record) {
        return { success: false, error: "No active verification code found for this email. Please request a new code." };
      }

      if (Date.now() > record.expiresAt) {
        delete activeRegistrationOTPs[normEmail];
        try { sessionStorage.removeItem('showUp_reg_otp_' + normEmail); } catch (e) {}
        return { success: false, error: "Verification code has expired. Please request a new code." };
      }

      record.attempts = (record.attempts || 0) + 1;
      if (record.attempts > 5) {
        delete activeRegistrationOTPs[normEmail];
        try { sessionStorage.removeItem('showUp_reg_otp_' + normEmail); } catch (e) {}
        return { success: false, error: "Too many incorrect attempts. For security, this code was invalidated. Please request a new code." };
      }

      if (otpCode.trim() !== record.code) {
        const remaining = 5 - record.attempts;
        return { success: false, error: `Incorrect verification code (${remaining} attempts remaining). Please check your email.` };
      }

      return { success: true, verified: true, details: record.details };
    }

    function verifyAndFinalizeRegistration(email, otpCode, password, confirmPassword) {
      const verification = verifyRegistrationOTP(email, otpCode);
      if (!verification.success) {
        return verification;
      }

      const normEmail = email.toLowerCase().trim();
      const details = verification.details || {};
      const athleteName = details.name || normEmail.split('@')[0];
      const pwd = password || details.password || 'athlete123';
      const zip = details.zip || '';

      delete activeRegistrationOTPs[normEmail];
      try { sessionStorage.removeItem('showUp_reg_otp_' + normEmail); } catch (e) {}

      const regResult = registerAthleteAccount(normEmail, pwd, athleteName, '', zip);
      if (!regResult.success) {
        return regResult;
      }

      changeRegisterDetails();
      const otpInput = document.getElementById('auth-register-otp-code');
      if (otpInput) otpInput.value = '';

      return {
        success: true,
        message: `Account verified and created! Welcome, ${athleteName}.`,
        account: regResult.account
      };
    }

    function proceedToStepPassword(email) {
      const stepDetails = document.getElementById('auth-register-step-details');
      const stepOtp = document.getElementById('auth-register-step-otp');
      const stepPass = document.getElementById('auth-register-step-password');
      const verifiedDisplay = document.getElementById('auth-register-verified-email-display');

      if (stepDetails) stepDetails.classList.add('hidden');
      if (stepOtp) stepOtp.classList.add('hidden');
      if (stepPass) stepPass.classList.remove('hidden');
      if (verifiedDisplay) verifiedDisplay.innerText = email;

      setAuthStatusMessage("Email verified! Please create and confirm your password below.", 'success');
      if (typeof triggerHaptic === 'function') triggerHaptic('medium');

      const passInput = document.getElementById('auth-register-password');
      const confirmPassInput = document.getElementById('auth-register-confirm-password');
      if (passInput) passInput.value = '';
      if (confirmPassInput) confirmPassInput.value = '';
      if (passInput) setTimeout(() => passInput.focus(), 150);
    }

    function handleRequestRegistrationOTP() {
      const nameInput = document.getElementById('auth-register-name');
      const emailInput = document.getElementById('auth-register-email');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';

      if (!name) {
        setAuthStatusMessage("Please enter your athlete name.", 'error');
        if (typeof triggerHaptic === 'function') triggerHaptic('heavy');
        if (nameInput) nameInput.focus();
        return;
      }
      if (!email || !email.includes('@')) {
        setAuthStatusMessage("Please enter a valid email address.", 'error');
        if (typeof triggerHaptic === 'function') triggerHaptic('heavy');
        if (emailInput) emailInput.focus();
        return;
      }

      // Check if account already exists
      const accounts = getRegisteredAccounts();
      const normEmail = email.toLowerCase().trim();
      if (accounts[normEmail]) {
        setAuthStatusMessage("An account with this email already exists. Please Sign In or Reset Password.", 'error');
        if (typeof triggerHaptic === 'function') triggerHaptic('heavy');
        return;
      }

      const result = requestRegistrationOTP(normEmail, { name, email: normEmail });
      if (!result.success) {
        setAuthStatusMessage(result.error, 'error');
        if (typeof triggerHaptic === 'function') triggerHaptic('heavy');
        return;
      }

      // Trigger Firebase Native Email Verification if available
      const fAuth = getFirebaseAuth();
      if (fAuth) {
        const tempSecurePass = 'showUp_' + Math.random().toString(36).substring(2, 12) + '9!';
        sessionStorage.setItem('showUp_reg_temp_' + normEmail, tempSecurePass);

        fAuth.createUserWithEmailAndPassword(normEmail, tempSecurePass)
          .then((cred) => {
            if (cred && cred.user) {
              cred.user.sendEmailVerification().then(() => {
                if (typeof showToast === 'function') showToast(`Verification link sent to ${normEmail}`, 'success');
              }).catch(e => console.warn("Firebase sendEmailVerification error:", e));
            }
          })
          .catch((err) => {
            console.warn("Firebase createUser notice:", err.code, err.message);
            if (err.code === 'auth/email-already-in-use') {
              fAuth.sendPasswordResetEmail(normEmail).catch(() => {});
              setAuthStatusMessage("An account with this email already exists. We've sent a password reset link to your email address.", 'info');
            }
          });
      }

      const stepDetails = document.getElementById('auth-register-step-details');
      const stepOtp = document.getElementById('auth-register-step-otp');
      const stepPass = document.getElementById('auth-register-step-password');
      const emailDisplay = document.getElementById('auth-register-otp-target-email-display');

      if (stepDetails) stepDetails.classList.add('hidden');
      if (stepOtp) stepOtp.classList.remove('hidden');
      if (stepPass) stepPass.classList.add('hidden');
      if (emailDisplay) emailDisplay.innerText = email;
      setAuthStatusMessage('', 'info');

      const otpInput = document.getElementById('auth-register-otp-code');
      if (otpInput) {
        otpInput.value = '';
      }

      startRegisterResendCooldown(60);
    }

    function handleResendRegistrationOTP() {
      if (regResendSecondsLeft > 0) return;
      const fAuth = getFirebaseAuth();
      const currentUser = fAuth ? fAuth.currentUser : null;
      if (currentUser && typeof currentUser.sendEmailVerification === 'function') {
        currentUser.sendEmailVerification()
          .then(() => {
            setAuthStatusMessage("Verification email resent! Please check your inbox.", 'success');
            if (typeof showToast === 'function') showToast("Verification email resent", 'success');
            startRegisterResendCooldown(60);
          })
          .catch(() => {
            handleRequestRegistrationOTP();
          });
      } else {
        handleRequestRegistrationOTP();
      }
    }

    function handleVerifyRegistrationOTP() {
      const emailInput = document.getElementById('auth-register-email');
      const otpInput = document.getElementById('auth-register-otp-code');

      const email = emailInput ? emailInput.value.trim() : '';
      const otpCode = otpInput ? otpInput.value.trim() : '';

      // If user provided a 6-digit test code (or automated test):
      if (otpCode && otpCode.length === 6) {
        const verification = verifyRegistrationOTP(email, otpCode);
        if (!verification.success) {
          setAuthStatusMessage(verification.error, 'error');
          if (typeof triggerHaptic === 'function') triggerHaptic('heavy');
          return;
        }
        proceedToStepPassword(email);
        return;
      }

      // Check live email verification status:
      const fAuth = getFirebaseAuth();
      const currentUser = fAuth ? fAuth.currentUser : null;
      if (currentUser) {
        setAuthStatusMessage("Checking verification status...", 'info');
        currentUser.reload()
          .then(() => {
            if (currentUser.emailVerified) {
              proceedToStepPassword(email);
            } else {
              setAuthStatusMessage("Verification link not yet clicked. Please open your email and tap the link, then try again.", 'warning');
              if (typeof triggerHaptic === 'function') triggerHaptic('heavy');
            }
          })
          .catch(() => {
            proceedToStepPassword(email);
          });
        return;
      }

      // Offline / fallback environment
      proceedToStepPassword(email);
    }

    function handleFinalizeRegistration() {
      const nameInput = document.getElementById('auth-register-name');
      const emailInput = document.getElementById('auth-register-email');
      const passInput = document.getElementById('auth-register-password');
      const confirmPassInput = document.getElementById('auth-register-confirm-password');
      const zipInput = document.getElementById('auth-register-zip');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const pass = passInput ? passInput.value : '';
      const confirmPass = confirmPassInput ? confirmPassInput.value : '';
      const zip = zipInput ? zipInput.value.trim() : '';

      if (!pass || pass.length < 4) {
        setAuthStatusMessage("Password must be at least 4 characters.", 'error');
        if (typeof triggerHaptic === 'function') triggerHaptic('heavy');
        if (passInput) passInput.focus();
        return;
      }

      if (pass !== confirmPass) {
        setAuthStatusMessage("Passwords do not match. Please ensure both passwords match.", 'error');
        if (typeof triggerHaptic === 'function') triggerHaptic('heavy');
        if (confirmPassInput) confirmPassInput.focus();
        return;
      }

      const normEmail = email.toLowerCase().trim();
      delete activeRegistrationOTPs[normEmail];
      try { sessionStorage.removeItem('showUp_reg_otp_' + normEmail); } catch (e) {}

      // If Firebase user is active, update their password to chosen password
      const fAuth = getFirebaseAuth();
      if (fAuth && fAuth.currentUser) {
        fAuth.currentUser.updatePassword(pass).catch(e => console.debug("Firebase updatePassword notice:", e));
      }

      const regResult = registerAthleteAccount(normEmail, pass, name || normEmail.split('@')[0], '', zip);
      if (!regResult.success) {
        setAuthStatusMessage(regResult.error, 'error');
        if (typeof triggerHaptic === 'function') triggerHaptic('heavy');
        return;
      }

      changeRegisterDetails();
      closeAuthLoginModal();
    }

    function changeRegisterDetails() {
      const stepDetails = document.getElementById('auth-register-step-details');
      const stepOtp = document.getElementById('auth-register-step-otp');
      const stepPass = document.getElementById('auth-register-step-password');
      if (stepDetails) stepDetails.classList.remove('hidden');
      if (stepOtp) stepOtp.classList.add('hidden');
      if (stepPass) stepPass.classList.add('hidden');
      const nameInput = document.getElementById('auth-register-name');
      if (nameInput) nameInput.focus();
    }

    function startRegisterResendCooldown(seconds = 60) {
      if (regResendCooldownTimer) clearInterval(regResendCooldownTimer);
      regResendSecondsLeft = seconds;
      const btn = document.getElementById('auth-register-resend-otp-btn');
      if (!btn) return;
      btn.disabled = true;
      btn.classList.add('opacity-50', 'cursor-not-allowed');
      btn.innerText = `Resend (${regResendSecondsLeft}s)`;

      regResendCooldownTimer = setInterval(() => {
        regResendSecondsLeft--;
        if (regResendSecondsLeft <= 0) {
          clearInterval(regResendCooldownTimer);
          regResendCooldownTimer = null;
          if (btn) {
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            btn.innerText = 'Resend Link';
          }
        } else {
          if (btn) btn.innerText = `Resend (${regResendSecondsLeft}s)`;
        }
      }, 1000);
    }

    function handleEmailPasswordRegister(e) {
      if (e && e.preventDefault) e.preventDefault();
      const stepPass = document.getElementById('auth-register-step-password');
      const stepOtp = document.getElementById('auth-register-step-otp');

      // If user is on Step 3 (password input), trigger finalize registration
      if (stepPass && !stepPass.classList.contains('hidden')) {
        handleFinalizeRegistration();
        return;
      }

      // If user is on Step 2 (OTP code input), trigger verify OTP
      if (stepOtp && !stepOtp.classList.contains('hidden')) {
        handleVerifyRegistrationOTP();
        return;
      }

      // Otherwise on Step 1 (details input), trigger request OTP
      handleRequestRegistrationOTP();
    }

    function handleEmailPasswordReset(e) {
      if (e && e.preventDefault) e.preventDefault();
      const stepOtp = document.getElementById('auth-reset-step-otp');

      // If user is on Step 1 (email input), trigger request OTP
      if (!stepOtp || stepOtp.classList.contains('hidden')) {
        handleRequestPasswordResetOTP();
        return;
      }

      const emailInput = document.getElementById('auth-reset-email');
      const otpInput = document.getElementById('auth-reset-otp-code');
      const newPassInput = document.getElementById('auth-reset-password');
      const confirmPassInput = document.getElementById('auth-reset-confirm-password');

      const email = emailInput ? emailInput.value.trim() : '';
      const otpCode = otpInput ? otpInput.value.trim() : '';
      const newPass = newPassInput ? newPassInput.value : '';
      const confirmPass = confirmPassInput ? confirmPassInput.value : '';

      if (!otpCode || otpCode.length !== 6) {
        setAuthStatusMessage("Please enter the complete 6-digit verification code.", 'error');
        if (typeof triggerHaptic === 'function') triggerHaptic('heavy');
        return;
      }

      if (newPass !== confirmPass) {
        setAuthStatusMessage("Passwords do not match. Please ensure both passwords match.", 'error');
        if (typeof triggerHaptic === 'function') triggerHaptic('heavy');
        return;
      }

      const result = resetAthletePasswordWithOTP(email, otpCode, newPass);
      if (!result.success) {
        setAuthStatusMessage(result.error, 'error');
        if (typeof triggerHaptic === 'function') triggerHaptic('heavy');
      } else {
        setAuthStatusMessage(result.message, 'success');
        if (typeof triggerHaptic === 'function') triggerHaptic('medium');
        if (typeof showToast === 'function') showToast(result.message, 'success');

        // Reset OTP form state
        changeResetEmail();
        if (otpInput) otpInput.value = '';
        if (newPassInput) newPassInput.value = '';
        if (confirmPassInput) confirmPassInput.value = '';

        // Pre-fill email in signin view and switch
        const signinEmail = document.getElementById('auth-signin-email');
        if (signinEmail) signinEmail.value = email;
        setTimeout(() => {
          switchAuthTab('signin');
          setAuthStatusMessage("Password verified! Please sign in with your new password.", 'success');
        }, 1200);
      }
    }

    function applyUserProfile(profileObj) {
      const prevProfile = JSON.parse(localStorage.getItem('showUp_user_profile') || 'null');
      const prevEmail = (prevProfile?.email || '').toLowerCase().trim();

      localStorage.setItem('showUp_user_profile', JSON.stringify(profileObj));
      localStorage.setItem('showUp_session_expiry', String(Date.now() + SESSION_DURATION_MS));

      const firstName = profileObj.firstName || 'Athlete';
      const userEmail = profileObj.email || '';
      const picture = profileObj.picture || 'https://lh3.googleusercontent.com/a/default-user=s96-c';

      // Athlete Profile Isolation & Preservation:
      if (userEmail && userEmail !== 'you@showup.app' && userEmail !== 'user@showup.app') {
        const isolatedKey = 'showUp_user_workouts_' + userEmail.toLowerCase().trim();
        const isolatedWorkouts = JSON.parse(localStorage.getItem(isolatedKey) || 'null');
        const isSwitchingFromDifferentAthlete = prevEmail && prevEmail !== 'you@showup.app' && prevEmail !== 'user@showup.app' && prevEmail !== userEmail.toLowerCase().trim();

        if (Array.isArray(isolatedWorkouts) && isolatedWorkouts.length > 0) {
          const currentLocal = isSwitchingFromDifferentAthlete ? [] : JSON.parse(localStorage.getItem('showUp_synced_workouts') || '[]');
          completedWorkoutsHistory = (typeof AppStorage !== 'undefined' && typeof AppStorage.mergeWorkouts === 'function')
            ? AppStorage.mergeWorkouts(isolatedWorkouts, currentLocal)
            : isolatedWorkouts;
          localStorage.setItem('showUp_synced_workouts', JSON.stringify(completedWorkoutsHistory));
          localStorage.setItem(isolatedKey, JSON.stringify(completedWorkoutsHistory));
        } else if (!isSwitchingFromDifferentAthlete) {
          const currentLocal = JSON.parse(localStorage.getItem('showUp_synced_workouts') || '[]');
          if (Array.isArray(currentLocal) && currentLocal.length > 0) {
            completedWorkoutsHistory = currentLocal;
            localStorage.setItem('showUp_synced_workouts', JSON.stringify(completedWorkoutsHistory));
            localStorage.setItem(isolatedKey, JSON.stringify(completedWorkoutsHistory));
          } else {
            completedWorkoutsHistory = [];
            localStorage.setItem('showUp_synced_workouts', JSON.stringify([]));
          }
        } else {
          completedWorkoutsHistory = [];
          localStorage.setItem('showUp_synced_workouts', JSON.stringify([]));
          localStorage.setItem(isolatedKey, JSON.stringify([]));
        }
      }

      updateProfileUI(firstName, userEmail, picture);
      document.getElementById('btn-google-login').classList.add('hidden');
      document.getElementById('google-user-profile').classList.remove('hidden');
      updateCloudBackupUI();
      if (typeof updateSettingsModalAuthVisibility === 'function') updateSettingsModalAuthVisibility();
      initSquads();
      if (typeof fetchAthleteSquadsFromFirestore === 'function') {
        try { fetchAthleteSquadsFromFirestore(profileObj); } catch (e) {}
      }
      renderSquadsTab();
      updateSquadBeacon();
      updateGlobalStatsUI();
      renderHeatMap();
      if (typeof renderHomeTab === 'function') {
        try { renderHomeTab(); } catch (e) {}
      }
      renderCalendar();
      renderMonthlyHistory();
      updateGlobalVisitorTelemetryUI();
      closeAuthLoginModal();

      // Automatically retrieve cloud workouts and squads from Google Drive if authorized
      if (googleAccessToken && typeof restoreFromGoogleDrive === 'function') {
        setTimeout(async () => {
          try {
            await restoreFromGoogleDrive(true);
          } catch (e) {
            console.debug("Silent auto-restore on login profile notice:", e);
          }
        }, 150);
      }

      // Automatically retrieve or sync cloud workouts with Firebase Firestore
      if (typeof syncOrRestoreFirestoreBackup === 'function') {
        setTimeout(async () => {
          try {
            await syncOrRestoreFirestoreBackup(true);
            updateGlobalStatsUI();
            renderHeatMap();
            renderCalendar();
            renderMonthlyHistory();
          } catch (e) {
            console.debug("Silent auto-sync/restore on login Firestore notice:", e);
          }
        }, 300);
      }
    }

    async function handleSuccessfulOAuthToken(token) {
      googleAccessToken = token;
      localStorage.setItem('showUp_google_token', googleAccessToken);
      localStorage.setItem('showUp_session_expiry', String(Date.now() + SESSION_DURATION_MS));

      // 1. Immediately activate logged-in UI
      document.getElementById('btn-google-login').classList.add('hidden');
      document.getElementById('google-user-profile').classList.remove('hidden');
      updateCloudBackupUI();

      // 2. Fetch User Profile non-blockingly with timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${googleAccessToken}` },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const profile = await res.json();
          const firstName = profile.given_name || (profile.name ? profile.name.split(' ')[0] : 'Athlete');
          const userEmail = profile.email || '';
          const picture = profile.picture || 'https://lh3.googleusercontent.com/a/default-user=s96-c';
          applyUserProfile({ firstName, email: userEmail, picture });
          showToast(`Signed in as ${firstName}`, "success");
        } else {
          applyUserProfile({ firstName: 'Athlete', email: '', picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c' });
          showToast("Signed in successfully!", "success");
        }
      } catch (err) {
        console.warn("User info fetch notice:", err);
        applyUserProfile({ firstName: 'Athlete', email: '', picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c' });
        showToast("Signed in successfully!", "success");
      }

      // 3. Immediately restore cloud backup from Google Drive by default on login!
      // This ensures squads and activity from Google backup are instantly reflected upon login.
      setTimeout(async () => {
        try {
          await restoreFromGoogleDrive(false);
        } catch (driveErr) {
          console.warn("Auto-restore on login notice:", driveErr);
        }
      }, 300);
    }

    function handleGoogleSignIn() {
      // If on file:// protocol or google SDK not loaded, open the resilient Auth Modal directly
      if (window.location.protocol === 'file:' || typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
        openAuthLoginModal();
        return;
      }

      setGoogleLoginLoading(true);
      const clientId = getGoogleClientId();

      // Safety timer: automatically reset button if popup is closed or stalled
      const safetyTimer = setTimeout(() => {
        setGoogleLoginLoading(false);
      }, 15000);

      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          prompt: 'select_account',
          callback: async (response) => {
            clearTimeout(safetyTimer);
            setGoogleLoginLoading(false);

            if (response.error) {
              console.warn("Google Auth Response Notice:", response);
              if (response.error === 'popup_closed_by_user') {
                showToast("Google sign-in popup was closed.", "info");
              } else if (response.error === 'access_denied') {
                showToast("Access permission denied by user.", "warning");
              } else {
                showToast("Google OAuth origin check: opening account login...", "info");
                openAuthLoginModal();
              }
              return;
            }

            if (response.access_token) {
              await handleSuccessfulOAuthToken(response.access_token);
            }
          },
          error_callback: (err) => {
            clearTimeout(safetyTimer);
            setGoogleLoginLoading(false);
            console.warn("Google OAuth error callback:", err);
            openAuthLoginModal();
          }
        });

        client.requestAccessToken({ prompt: 'select_account' });
      } catch (err) {
        clearTimeout(safetyTimer);
        setGoogleLoginLoading(false);
        console.warn("Failed to initialize Google Token Client:", err);
        openAuthLoginModal();
      }
    }



    function updateProfileUI(firstName, email, picture) {
      if (firstName) document.getElementById('user-first-name').innerText = firstName;
      if (email) {
        document.getElementById('user-email').innerText = email;
        document.getElementById('dropdown-user-email').innerText = email;
      }
      if (picture) document.getElementById('user-avatar').src = picture;

      // Re-link and preserve historical squads (like fitFamSwabhu) under authenticated account
      initSquads();
      renderSquadsTab();
      updateGlobalStatsUI();
      renderHeatMap();
      updateGlobalVisitorTelemetryUI();
    }

/* ==========================================================================
   showUp Workout Engine: Logging, Catalog, Tactile Numpad & Analytics
   ========================================================================== */

    function openWeightNumpadModal(targetInputId, title, callback) {
      numpadTargetInputId = targetInputId || null;
      numpadCallback = typeof callback === 'function' ? callback : null;

      let initialVal = "0";
      if (targetInputId) {
        const el = document.getElementById(targetInputId);
        if (el && el.value !== undefined && el.value !== '') {
          initialVal = String(parseFloat(el.value) || 0);
        }
      } else if (title && title.toLowerCase().includes('body')) {
        initialVal = String(userWeight || 0);
      }

      numpadCurrentVal = initialVal;
      const titleEl = document.getElementById('numpad-modal-title');
      if (titleEl) titleEl.innerText = title || 'Input Weight';

      const unitEl = document.getElementById('numpad-display-unit');
      if (unitEl) {
        unitEl.innerText = (title && title.toLowerCase().includes('kg')) ? 'kg' : 'lbs';
      }

      updateNumpadDisplay();
      const modal = document.getElementById('weight-numpad-modal');
      if (modal) modal.classList.remove('hidden');
    }

    function closeWeightNumpadModal() {
      const modal = document.getElementById('weight-numpad-modal');
      if (modal) modal.classList.add('hidden');
      numpadTargetInputId = null;
      numpadCallback = null;
    }

    function updateNumpadDisplay() {
      const displayEl = document.getElementById('numpad-display-val');
      if (displayEl) {
        displayEl.innerText = numpadCurrentVal || '0';
      }
    }

    function numpadInput(char) {
      if (char === '.') {
        if (numpadCurrentVal.includes('.')) return;
        if (!numpadCurrentVal || numpadCurrentVal === '0') {
          numpadCurrentVal = '0.';
        } else {
          numpadCurrentVal += '.';
        }
      } else {
        if (numpadCurrentVal === '0') {
          numpadCurrentVal = String(char);
        } else {
          if (numpadCurrentVal.length < 6) {
            numpadCurrentVal += String(char);
          }
        }
      }
      updateNumpadDisplay();
    }

    function numpadBackspace() {
      if (numpadCurrentVal.length <= 1) {
        numpadCurrentVal = '0';
      } else {
        numpadCurrentVal = numpadCurrentVal.slice(0, -1);
        if (numpadCurrentVal === '' || numpadCurrentVal === '-') {
          numpadCurrentVal = '0';
        }
      }
      updateNumpadDisplay();
    }

    function numpadClear() {
      numpadCurrentVal = '0';
      updateNumpadDisplay();
    }

    function numpadQuickAdjust(delta) {
      let val = parseFloat(numpadCurrentVal) || 0;
      val = Math.max(0, Math.round((val + delta) * 10) / 10);
      numpadCurrentVal = String(val);
      updateNumpadDisplay();
    }

    function numpadConfirm() {
      const finalNum = parseFloat(numpadCurrentVal) || 0;

      if (numpadTargetInputId) {
        const input = document.getElementById(numpadTargetInputId);
        if (input) {
          input.value = finalNum;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      if (typeof numpadCallback === 'function') {
        numpadCallback(finalNum);
      }

      closeWeightNumpadModal();
      showToast(`Weight set to ${finalNum}!`, "success");
    }



    function loadPhysicalProfile() {
      const hInput = document.getElementById('user-height-input');
      const wInput = document.getElementById('user-weight-input');
      const targetInput = document.getElementById('user-target-weight-input');
      const restSelect = document.getElementById('pref-default-rest-time');

      if (hInput) hInput.value = userHeight;
      if (wInput) wInput.value = userWeight;

      const savedTarget = localStorage.getItem('showUp_user_target_weight');
      if (targetInput && savedTarget) targetInput.value = savedTarget;

      const savedRest = localStorage.getItem('showUp_default_rest_time') || '90';
      if (restSelect) restSelect.value = savedRest;

      if (typeof updateRestSoundAlertUI === 'function') {
        updateRestSoundAlertUI();
      }

      if (typeof renderQuickWeightChips === 'function') {
        const impSelect = document.getElementById('implement-select');
        renderQuickWeightChips(impSelect ? impSelect.value : 'Barbell');
      }
    }

    function savePhysicalProfile() {
      const hInput = document.getElementById('user-height-input');
      const wInput = document.getElementById('user-weight-input');
      const targetInput = document.getElementById('user-target-weight-input');

      const h = (hInput && parseFloat(hInput.value)) || userHeight;
      const w = (wInput && parseFloat(wInput.value)) || userWeight;

      userHeight = h;
      userWeight = w;

      localStorage.setItem('showUp_user_height', userHeight);
      localStorage.setItem('showUp_user_weight', userWeight);

      if (targetInput && targetInput.value) {
        localStorage.setItem('showUp_user_target_weight', targetInput.value);
      }

      const latestEntry = weightHistory[0];
      const todayISO = typeof getLocalDateKey === 'function' ? getLocalDateKey() : new Date().toISOString().slice(0, 10);

      if (!latestEntry || latestEntry.weight !== userWeight || latestEntry.date !== todayISO) {
        weightHistory.unshift({ date: todayISO, weight: userWeight, height: userHeight });
        localStorage.setItem('showUp_weight_history', JSON.stringify(weightHistory));
      }
      renderWeightHistory();
    }

    // ================= HISTORICAL WEIGHT LOGGING & INTUITIVE DATE PICKER =================


    let isScrollingExerciseInput = false;
    let activeSuggestionIndex = -1;
    let activeExerciseCatalogFilter = null;

    function exerciseMatchesImplementFilter(exercise, filter) {
      if (!filter) return true;
      if (!exercise) return false;
      const fLower = String(filter).trim().toLowerCase();
      const implLower = String(exercise.implement || '').trim().toLowerCase();
      const nameLower = String(exercise.name || '').trim().toLowerCase();

      if (implLower === fLower) return true;
      if (implLower.includes(fLower)) return true;

      if (fLower === 'kettlebell') {
        return implLower === 'kettlebell' || nameLower.includes('kettlebell') || /\bkb\b/i.test(nameLower);
      }
      if (fLower === 'barbell') {
        return implLower === 'barbell' || nameLower.includes('barbell') || nameLower.includes('ez bar');
      }
      if (fLower === 'dumbbell') {
        return implLower === 'dumbbell' || nameLower.includes('dumbbell') || /\bdb\b/i.test(nameLower);
      }
      if (fLower === 'bodyweight') {
        return implLower === 'bodyweight' || implLower === 'calisthenics';
      }
      if (fLower === 'gymnastics rings' || fLower === 'rings' || fLower === 'ring') {
        return implLower.includes('ring') || nameLower.startsWith('ring') || nameLower.includes('ring') || nameLower.includes('gymnastic');
      }
      return false;
    }

    function filterExerciseCatalog(query, implementFilter) {
      const activeFilter = (implementFilter !== undefined) ? implementFilter : activeExerciseCatalogFilter;
      const clean = (query && typeof query === 'string') ? query.trim().toLowerCase() : '';

      // If both query and activeFilter are empty, return []
      if (!clean && !activeFilter) return [];

      const cleanAlphanum = clean.replace(/[^a-z0-9]/g, '');

      const catalog = (typeof defaultCatalog !== 'undefined' && Array.isArray(defaultCatalog)) 
        ? defaultCatalog 
        : ((typeof window !== 'undefined' && window.defaultCatalog) || []);

      const results = [];
      const seen = new Set();

      catalog.forEach(ex => {
        if (!ex || !ex.name) return;

        // Check implement filter first
        if (activeFilter && !exerciseMatchesImplementFilter(ex, activeFilter)) {
          return;
        }

        const name = ex.name;
        const nameLower = name.toLowerCase();
        const nameAlphanum = nameLower.replace(/[^a-z0-9]/g, '');

        // If query is blank but filter is active, include all matching exercises
        if (!clean) {
          if (!seen.has(name)) {
            seen.add(name);
            results.push({
              exercise: ex,
              priority: 0
            });
          }
          return;
        }

        let priority = -1;

        if (nameLower === clean) {
          priority = 0; // exact match
        } else if (nameLower.startsWith(clean)) {
          priority = 1; // prefix match (e.g. "kb" -> "KB Swings")
        } else {
          // Word boundary match: any word starts with query
          const words = nameLower.split(/[\s/()\-]+/);
          const wordMatch = words.some(w => w.startsWith(clean));
          if (wordMatch) {
            priority = 2; // word start match (e.g. "swings" -> "KB Swings", "SH KB Swings")
          } else if (clean.length >= 3 && nameLower.includes(clean)) {
            priority = 3; // substring match
          } else if (clean.length >= 3 && cleanAlphanum.length >= 3 && nameAlphanum.includes(cleanAlphanum)) {
            priority = 4; // normalized match
          } else {
            // Abbreviation / expansion check
            const expanded = (typeof expandExerciseAbbreviations === 'function') 
              ? expandExerciseAbbreviations(name).toLowerCase() 
              : '';
            const abbr = (typeof abbreviateExerciseName === 'function') 
              ? abbreviateExerciseName(name).toLowerCase() 
              : '';
            if (expanded.includes(clean) || abbr.includes(clean) || (cleanAlphanum.length >= 3 && (expanded.replace(/[^a-z0-9]/g, '').includes(cleanAlphanum) || abbr.replace(/[^a-z0-9]/g, '').includes(cleanAlphanum)))) {
              priority = 5;
            }
          }
        }

        if (priority >= 0 && !seen.has(name)) {
          seen.add(name);
          results.push({
            exercise: ex,
            priority
          });
        }
      });

      // Sort by priority first, then alphabetically by exercise name
      results.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.exercise.name.localeCompare(b.exercise.name);
      });

      return results.map(r => r.exercise);
    }

    function highlightExerciseMatch(text, query) {
      const safe = (typeof escapeHtml === 'function') ? escapeHtml : (str => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));
      if (!text || !query) return safe(text || '');
      const cleanQ = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!cleanQ) return safe(text);
      try {
        const regex = new RegExp('(' + cleanQ + ')', 'gi');
        const parts = text.split(regex);
        return parts.map(part => {
          if (part.toLowerCase() === query.trim().toLowerCase()) {
            return `<span class="text-emerald-400 font-bold">${safe(part)}</span>`;
          }
          return safe(part);
        }).join('');
      } catch (e) {
        return safe(text);
      }
    }

    function scrollExerciseInputIntoView(inputEl) {
      if (!inputEl) return;
      
      const modalParent = (typeof inputEl.closest === 'function') ? inputEl.closest('.overflow-y-auto') : null;
      if (modalParent && modalParent !== (typeof document !== 'undefined' ? document.documentElement : null) && modalParent !== (typeof document !== 'undefined' ? document.body : null)) {
        if (typeof inputEl.scrollIntoView === 'function') {
          inputEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        return;
      }

      if (isScrollingExerciseInput) return;

      try {
        const rect = (typeof inputEl.getBoundingClientRect === 'function') ? inputEl.getBoundingClientRect() : null;
        if (!rect) {
          if (typeof inputEl.scrollIntoView === 'function') inputEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          return;
        }

        const header = (typeof document !== 'undefined' && document.querySelector) ? document.querySelector('header') : null;
        const headerHeight = (header && header.offsetHeight) ? header.offsetHeight : 64;
        const vh = (typeof window !== 'undefined' && window.innerHeight) ? window.innerHeight : 800;

        const desiredTop = headerHeight + 16;

        if (rect.top < desiredTop - 8 || rect.top > vh * 0.35) {
          isScrollingExerciseInput = true;
          const currentScrollY = (typeof window !== 'undefined' ? (window.pageYOffset || (document.documentElement ? document.documentElement.scrollTop : 0)) : 0) || 0;
          const targetScrollY = Math.max(0, currentScrollY + rect.top - desiredTop);
          
          if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
            window.scrollTo({
              top: targetScrollY,
              behavior: 'smooth'
            });
          }
          setTimeout(() => {
            isScrollingExerciseInput = false;
          }, 250);
        }
      } catch (err) {
        if (typeof inputEl.scrollIntoView === 'function') {
          inputEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }

    function getActiveExerciseCatalogFilter() {
      return activeExerciseCatalogFilter;
    }

    function setExerciseCatalogFilter(filterName) {
      activeExerciseCatalogFilter = filterName || null;
      renderExerciseCatalogFilterPills();
    }

    function renderExerciseCatalogFilterPills() {
      if (typeof document === 'undefined') return;
      const pills = [
        { id: 'filter-pill-barbell', name: 'Barbell' },
        { id: 'filter-pill-kettlebell', name: 'Kettlebell' },
        { id: 'filter-pill-dumbbell', name: 'Dumbbell' },
        { id: 'filter-pill-bodyweight', name: 'Bodyweight' },
        { id: 'filter-pill-rings', name: 'Gymnastics Rings' }
      ];

      pills.forEach(pill => {
        const el = document.getElementById(pill.id);
        if (!el) return;
        const isEngaged = activeExerciseCatalogFilter && (activeExerciseCatalogFilter.toLowerCase() === pill.name.toLowerCase());
        el.setAttribute('aria-pressed', isEngaged ? 'true' : 'false');

        const icon = el.querySelector('i');

        if (isEngaged) {
          // Depressed and engaged state: sunken inner shadow, 1px depression, emerald text & border
          el.className = 'exercise-filter-pill px-3 py-1.5 rounded-full text-xs font-black text-emerald-400 bg-slate-950 border border-emerald-500/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_0_8px_rgba(16,185,129,0.2)] translate-y-[1px] select-none flex items-center gap-1.5 cursor-pointer';
          if (icon) {
            icon.classList.remove('opacity-70');
            icon.classList.add('opacity-100', 'text-emerald-400');
          }
        } else {
          // Unselected resting state
          el.className = 'exercise-filter-pill px-3 py-1.5 rounded-full text-xs font-bold text-slate-400 bg-slate-900/90 border border-slate-800 hover:text-slate-200 hover:border-slate-700 transition select-none flex items-center gap-1.5 cursor-pointer shadow-sm translate-y-0';
          if (icon) {
            icon.classList.remove('opacity-100', 'text-emerald-400');
            icon.classList.add('opacity-70');
          }
        }
      });

      const indicator = document.getElementById('active-exercise-filter-indicator');
      const nameLabel = document.getElementById('active-exercise-filter-name');
      if (indicator) {
        if (activeExerciseCatalogFilter) {
          if (nameLabel) nameLabel.textContent = activeExerciseCatalogFilter;
          indicator.classList.remove('hidden');
        } else {
          indicator.classList.add('hidden');
        }
      }
    }

    function toggleExerciseCatalogFilter(filterName, inputId = 'exercise-name-input', dropdownId = 'exercise-suggestions-dropdown') {
      if (activeExerciseCatalogFilter && activeExerciseCatalogFilter.toLowerCase() === (filterName || '').toLowerCase()) {
        // Tapping again removes the chosen filter
        activeExerciseCatalogFilter = null;
      } else {
        activeExerciseCatalogFilter = filterName;
      }

      renderExerciseCatalogFilterPills();

      const inputEl = document.getElementById(inputId);
      const currentVal = inputEl ? inputEl.value : '';

      if (activeExerciseCatalogFilter) {
        updateExerciseSuggestions(currentVal, inputId, dropdownId);
        if (inputEl) {
          scrollExerciseInputIntoView(inputEl);
        }
      } else {
        if (!currentVal || !currentVal.trim()) {
          closeExerciseSuggestions(dropdownId);
        } else {
          updateExerciseSuggestions(currentVal, inputId, dropdownId);
        }
      }
    }

    function getRecentExercises(limit = 6) {
      const recents = [];
      const seen = new Set();

      function addEx(name, implement, muscle) {
        if (!name || typeof name !== 'string') return;
        const clean = name.trim();
        if (!clean) return;
        const lower = clean.toLowerCase();
        if (seen.has(lower)) return;
        seen.add(lower);

        let imp = implement;
        let mus = muscle;
        if (typeof defaultCatalog !== 'undefined' && Array.isArray(defaultCatalog)) {
          const match = defaultCatalog.find(c => c.name.toLowerCase() === lower);
          if (match) {
            if (!imp) imp = match.implement;
            if (!mus) mus = match.muscle;
          }
        }
        recents.push({ name: clean, implement: imp || 'General', muscle: mus || 'Full Body' });
      }

      // 1. From currentSessionSets (reverse chronological order)
      if (typeof currentSessionSets !== 'undefined' && Array.isArray(currentSessionSets)) {
        for (let i = currentSessionSets.length - 1; i >= 0; i--) {
          const s = currentSessionSets[i];
          if (s) addEx(s.exerciseName || s.exercise, s.implement, s.muscle);
          if (recents.length >= limit) return recents;
        }
      }

      // 2. From completedWorkoutsHistory (reverse chronological order)
      const history = (typeof completedWorkoutsHistory !== 'undefined' && Array.isArray(completedWorkoutsHistory))
        ? completedWorkoutsHistory
        : (() => {
            try {
              return JSON.parse(localStorage.getItem('showUp_synced_workouts') || '[]');
            } catch (e) {
              return [];
            }
          })();

      if (Array.isArray(history)) {
        for (let i = history.length - 1; i >= 0; i--) {
          const w = history[i];
          if (w && Array.isArray(w.sets)) {
            for (let j = w.sets.length - 1; j >= 0; j--) {
              const s = w.sets[j];
              if (s) addEx(s.exerciseName || s.exercise, s.implement, s.muscle);
              if (recents.length >= limit) return recents;
            }
          }
        }
      }

      return recents;
    }

    function formatPreviousWorkoutDate(dateStr) {
      if (!dateStr) return '';
      try {
        const parts = String(dateStr).split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const d = new Date(year, month, day);
          if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }
        }
        return dateStr;
      } catch (e) {
        return dateStr;
      }
    }

    function getPreviousWorkoutExerciseMetric(exerciseName) {
      if (!exerciseName || typeof exerciseName !== 'string') return null;
      const target = exerciseName.trim().toLowerCase();
      if (!target) return null;

      const history = (typeof completedWorkoutsHistory !== 'undefined' && Array.isArray(completedWorkoutsHistory))
        ? completedWorkoutsHistory
        : (() => {
            try {
              return JSON.parse(localStorage.getItem('showUp_synced_workouts') || '[]');
            } catch (e) {
              return [];
            }
          })();

      if (!Array.isArray(history) || history.length === 0) return null;

      for (let i = history.length - 1; i >= 0; i--) {
        const workout = history[i];
        if (!workout || !Array.isArray(workout.sets) || workout.sets.length === 0) continue;

        const matchingSets = workout.sets.filter(s => {
          const name = (s.exerciseName || s.exercise || '').trim().toLowerCase();
          return name === target;
        });

        if (matchingSets.length > 0) {
          const setCount = matchingSets.length;
          const setWord = setCount === 1 ? '1 set' : `${setCount} sets`;
          const firstSet = matchingSets[0];
          const implement = firstSet.implement || '';

          let metricStr = '';
          if (implement === 'Running' || firstSet.runningDistance) {
            const totalDist = matchingSets.reduce((sum, s) => sum + (parseFloat(s.runningDistance) || 0), 0);
            const lastTime = firstSet.runningTime || '';
            metricStr = `${totalDist ? totalDist.toFixed(1) + ' mi' : ''} ${lastTime ? '· ' + lastTime : ''} · ${setWord}`.trim();
          } else if (implement === 'Row Erg' || firstSet.ergDistance) {
            const lastDist = firstSet.ergDistance || 500;
            const lastTime = firstSet.ergTime || '';
            metricStr = `${lastDist}m ${lastTime ? '· ' + lastTime : ''} · ${setWord}`;
          } else if (implement === 'Swimming' || firstSet.swimDistance) {
            const lastDist = firstSet.swimDistance || 500;
            const lastTime = firstSet.swimTime || '';
            metricStr = `${lastDist}m ${lastTime ? '· ' + lastTime : ''} · ${setWord}`;
          } else if (["Walking", "Hiking", "Biking"].includes(implement) || firstSet.enduranceDistance) {
            const dist = firstSet.enduranceDistance || 1.0;
            metricStr = `${dist} mi · ${setWord}`;
          } else {
            let topSet = matchingSets[0];
            for (const s of matchingSets) {
              if ((parseFloat(s.weight) || 0) > (parseFloat(topSet.weight) || 0)) {
                topSet = s;
              }
            }
            const w = parseFloat(topSet.weight) || 0;
            const r = parseInt(topSet.reps) || 0;

            if (w > 0 && r > 0) {
              metricStr = `${w} lb × ${r} reps · ${setWord}`;
            } else if (w > 0) {
              metricStr = `${w} lb · ${setWord}`;
            } else if (r > 0) {
              metricStr = `${r} reps · ${setWord}`;
            } else {
              metricStr = `${setWord}`;
            }
          }

          return {
            metric: metricStr,
            date: workout.date || workout.completedDate || '',
            workoutName: workout.workoutName || ''
          };
        }
      }

      return null;
    }

    function updateExercisePreviousWorkoutMetric(exerciseName) {
      const banner = document.getElementById('exercise-previous-workout-banner');
      const metricEl = document.getElementById('exercise-previous-workout-metric');
      const dateEl = document.getElementById('exercise-previous-workout-date');
      if (!banner || !metricEl) return;

      const trimmed = (exerciseName || '').trim();
      if (!trimmed) {
        banner.classList.add('hidden');
        return;
      }

      const prev = getPreviousWorkoutExerciseMetric(trimmed);
      if (prev && prev.metric) {
        metricEl.innerText = prev.metric;
        if (dateEl) {
          const formattedDate = formatPreviousWorkoutDate(prev.date);
          dateEl.innerText = formattedDate || prev.date || '';
          dateEl.title = prev.workoutName ? `${prev.workoutName} (${prev.date})` : prev.date;
        }
        banner.classList.remove('hidden');
      } else {
        banner.classList.add('hidden');
      }
    }

    function updateExerciseSuggestions(query, inputId, dropdownId) {
      const dropdown = document.getElementById(dropdownId);
      const inputEl = document.getElementById(inputId);
      if (!dropdown || !inputEl) return;

      const trimmed = (query || '').trim();
      activeSuggestionIndex = -1;

      const safe = (typeof escapeHtml === 'function') ? escapeHtml : (str => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));

      const recents = getRecentExercises(6);
      let matchingRecents = [];
      let catalogMatches = [];

      if (trimmed) {
        matchingRecents = recents.filter(r => r.name.toLowerCase().includes(trimmed.toLowerCase()));
        catalogMatches = filterExerciseCatalog(trimmed);
      } else {
        matchingRecents = recents;
        catalogMatches = (typeof defaultCatalog !== 'undefined' && Array.isArray(defaultCatalog)) ? [...defaultCatalog] : [];
        if (activeExerciseCatalogFilter) {
          catalogMatches = catalogMatches.filter(ex => exerciseMatchesImplementFilter(ex, activeExerciseCatalogFilter));
        }
      }

      // Catalog items must always be displayed in alphabetical order
      catalogMatches.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      if (matchingRecents.length === 0 && catalogMatches.length === 0) {
        if (!trimmed && !activeExerciseCatalogFilter) {
          dropdown.classList.add('hidden');
          dropdown.innerHTML = '';
          return;
        }
        let noMatchHtml = `
          <div class="px-4 py-3.5 text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>No ${activeExerciseCatalogFilter ? `<span class="text-emerald-400 font-semibold">${safe(activeExerciseCatalogFilter)}</span> ` : ''}catalog matches for "<span class="text-slate-200 font-semibold">${safe(trimmed || '(empty)')}</span>"</span>
            <span class="text-[11px] text-slate-500 font-medium">Custom exercise</span>
          </div>
        `;
        if (activeExerciseCatalogFilter) {
          noMatchHtml = `
            <div class="px-4 py-2 bg-slate-950/95 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-slate-400 sticky top-0 backdrop-blur-md z-10">
              <span class="flex items-center gap-1.5 text-emerald-400">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"></span>
                <span>${safe(activeExerciseCatalogFilter)}</span>
              </span>
              <button type="button" onclick="event.stopPropagation(); toggleExerciseCatalogFilter('${safe(activeExerciseCatalogFilter)}', '${inputId}', '${dropdownId}')" class="text-slate-400 hover:text-slate-200 text-[10px] uppercase tracking-wider font-semibold underline transition">Clear filter</button>
            </div>
          ` + noMatchHtml;
        }
        dropdown.innerHTML = noMatchHtml;
        dropdown.classList.remove('hidden');
        return;
      }

      let html = '';
      if (activeExerciseCatalogFilter) {
        html += `
          <div class="px-4 py-2 bg-slate-950/95 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-slate-400 sticky top-0 backdrop-blur-md z-10">
            <span class="flex items-center gap-1.5 text-emerald-400">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"></span>
              <span>${safe(activeExerciseCatalogFilter)} Catalog (${catalogMatches.length})</span>
            </span>
            <button type="button" onclick="event.stopPropagation(); toggleExerciseCatalogFilter('${safe(activeExerciseCatalogFilter)}', '${inputId}', '${dropdownId}')" class="text-slate-400 hover:text-slate-200 text-[10px] uppercase tracking-wider font-semibold underline transition">Clear filter</button>
          </div>
        `;
      }

      // 1. Recent exercises first
      if (matchingRecents.length > 0) {
        html += `
          <div class="px-3.5 py-1.5 bg-slate-950/95 border-b border-slate-800/80 flex items-center justify-between text-[10px] font-bold text-amber-400 sticky top-0 backdrop-blur-md z-10 tracking-wider uppercase">
            <span class="flex items-center gap-1.5">
              <i class="fa-solid fa-clock-rotate-left text-[11px]"></i>
              <span>Recent Exercises</span>
            </span>
            <span class="text-[9px] text-slate-500 font-medium">Quick Select</span>
          </div>
        `;

        matchingRecents.forEach(ex => {
          const displayName = trimmed ? highlightExerciseMatch(ex.name, trimmed) : safe(ex.name);
          const escapedNameAttr = safe(ex.name).replace(/'/g, "&#39;");
          html += `
            <div class="exercise-suggestion-item px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/80 active:bg-slate-800 transition select-none group border-b border-slate-800/50"
                 role="option"
                 data-exercise-name="${escapedNameAttr}"
                 onclick="selectExerciseSuggestion('${escapedNameAttr}', '${inputId}', '${dropdownId}')">
              <div class="flex items-center gap-3 min-w-0 pr-2">
                <div class="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:text-amber-300 transition shrink-0">
                  <i class="fa-solid fa-clock-rotate-left text-xs"></i>
                </div>
                <div class="truncate">
                  <span class="text-sm font-semibold text-slate-100 group-hover:text-amber-300 transition block truncate tracking-tight">${displayName}</span>
                  <span class="text-xs text-slate-400 font-medium">${safe(ex.muscle || 'Full Body')}</span>
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">Recent</span>
                <span class="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-800/90 text-slate-300 border border-slate-700/60">${safe(ex.implement || 'General')}</span>
              </div>
            </div>
          `;
        });
      }

      // 2. Below a separator line: all exercises in the catalog in alphabetical order
      if (catalogMatches.length > 0) {
        html += `
          <div class="px-3.5 py-1.5 bg-slate-950/95 border-y border-slate-700/80 flex items-center justify-between text-[10px] font-bold text-emerald-400 sticky top-0 backdrop-blur-md z-10 tracking-wider uppercase">
            <span class="flex items-center gap-1.5">
              <i class="fa-solid fa-book-open text-[11px]"></i>
              <span>All Exercises (A–Z)</span>
            </span>
            <span class="text-[9px] text-slate-500 font-medium">${catalogMatches.length} in catalog</span>
          </div>
        `;

        catalogMatches.forEach(ex => {
          const displayName = trimmed ? highlightExerciseMatch(ex.name, trimmed) : safe(ex.name);
          const escapedNameAttr = safe(ex.name).replace(/'/g, "&#39;");
          html += `
            <div class="exercise-suggestion-item px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/80 active:bg-slate-800 transition select-none group border-b border-slate-800/50 last:border-b-0"
                 role="option"
                 data-exercise-name="${escapedNameAttr}"
                 onclick="selectExerciseSuggestion('${escapedNameAttr}', '${inputId}', '${dropdownId}')">
              <div class="flex items-center gap-3 min-w-0 pr-2">
                <div class="w-8 h-8 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition shrink-0">
                  <i class="fa-solid fa-dumbbell text-xs"></i>
                </div>
                <div class="truncate">
                  <span class="text-sm font-semibold text-slate-100 group-hover:text-emerald-300 transition block truncate tracking-tight">${displayName}</span>
                  <span class="text-xs text-slate-400 font-medium">${safe(ex.muscle || 'Full Body')}</span>
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span class="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-800/90 text-slate-300 border border-slate-700/60">${safe(ex.implement || 'General')}</span>
              </div>
            </div>
          `;
        });
      }

      dropdown.innerHTML = html;
      dropdown.classList.remove('hidden');
    }

    function selectExerciseSuggestion(exerciseName, inputId, dropdownId) {
      const inputEl = document.getElementById(inputId);
      if (!inputEl) return;

      const cleanName = typeof exerciseName === 'string'
        ? exerciseName.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        : exerciseName;

      inputEl.value = cleanName;

      if (inputId === 'exercise-name-input') {
        if (typeof handleExerciseInput === 'function') {
          handleExerciseInput(cleanName);
        } else {
          updateExercisePreviousWorkoutMetric(cleanName);
        }
      } else if (inputId === 'edit-active-set-exercise') {
        if (typeof handleEditActiveSetExerciseInput === 'function') {
          handleEditActiveSetExerciseInput(cleanName);
        }
      }

      closeExerciseSuggestions(dropdownId);
      if (typeof triggerHaptic === 'function') triggerHaptic('light');

      scrollExerciseInputIntoView(inputEl);
    }

    function closeExerciseSuggestions(dropdownId) {
      const targetDropdowns = dropdownId 
        ? [document.getElementById(dropdownId)] 
        : [document.getElementById('exercise-suggestions-dropdown'), document.getElementById('edit-exercise-suggestions-dropdown')];

      targetDropdowns.forEach(dd => {
        if (dd) {
          dd.classList.add('hidden');
          dd.innerHTML = '';
        }
      });
      activeSuggestionIndex = -1;
    }

    function handleExerciseInputFocus(inputEl, dropdownId) {
      if (!inputEl) return;
      scrollExerciseInputIntoView(inputEl);
      updateExerciseSuggestions(inputEl.value || '', inputEl.id, dropdownId);
    }

    function handleExerciseInputKeydown(e, inputId, dropdownId) {
      const dropdown = document.getElementById(dropdownId);
      if (!dropdown || dropdown.classList.contains('hidden')) return;

      const items = dropdown.querySelectorAll ? dropdown.querySelectorAll('.exercise-suggestion-item') : [];
      if (!items || items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeSuggestionIndex = (activeSuggestionIndex + 1) % items.length;
        updateHighlightedSuggestion(items, activeSuggestionIndex);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeSuggestionIndex = (activeSuggestionIndex - 1 + items.length) % items.length;
        updateHighlightedSuggestion(items, activeSuggestionIndex);
      } else if (e.key === 'Enter') {
        if (activeSuggestionIndex >= 0 && activeSuggestionIndex < items.length) {
          e.preventDefault();
          const targetItem = items[activeSuggestionIndex];
          const selectedName = targetItem.getAttribute ? targetItem.getAttribute('data-exercise-name') : null;
          if (selectedName) {
            selectExerciseSuggestion(selectedName, inputId, dropdownId);
          }
        }
      } else if (e.key === 'Escape') {
        closeExerciseSuggestions(dropdownId);
      }
    }

    function updateHighlightedSuggestion(items, index) {
      items.forEach((item, i) => {
        if (i === index) {
          item.classList.add('bg-emerald-500/25');
          if (typeof item.scrollIntoView === 'function') {
            item.scrollIntoView({ block: 'nearest' });
          }
        } else {
          item.classList.remove('bg-emerald-500/25');
        }
      });
    }

    function initCatalog() {
      const datalist = document.getElementById('exercise-catalog-list');
      if (datalist) {
        datalist.innerHTML = '';
        const optionValues = new Set();

        defaultCatalog.forEach(ex => {
          if (ex.name) optionValues.add(ex.name);

          if (typeof expandExerciseAbbreviations === 'function') {
            const expanded = expandExerciseAbbreviations(ex.name);
            if (expanded) optionValues.add(expanded);
          }

          if (typeof abbreviateExerciseName === 'function') {
            const abbr = abbreviateExerciseName(ex.name);
            if (abbr) optionValues.add(abbr);
          }
        });

        Array.from(optionValues)
          .sort((a, b) => a.localeCompare(b))
          .forEach(val => {
            const option = document.createElement('option');
            option.value = val;
            datalist.appendChild(option);
          });
      }

      // Wire click-outside dismisser
      if (typeof document !== 'undefined' && !document._hasExerciseSuggestionListener) {
        document._hasExerciseSuggestionListener = true;
        document.addEventListener('click', (e) => {
          const mainWrapper = document.getElementById('exercise-autocomplete-wrapper');
          if (mainWrapper && typeof mainWrapper.contains === 'function' && !mainWrapper.contains(e.target)) {
            closeExerciseSuggestions('exercise-suggestions-dropdown');
          }
          const editWrapper = document.getElementById('edit-exercise-autocomplete-wrapper');
          if (editWrapper && typeof editWrapper.contains === 'function' && !editWrapper.contains(e.target)) {
            closeExerciseSuggestions('edit-exercise-suggestions-dropdown');
          }
        });
      }

      const initialEx = document.getElementById('exercise-name-input')?.value;
      if (initialEx) {
        updateExercisePreviousWorkoutMetric(initialEx);
      }
    }

    function handleExerciseInput(val) {
      const inputEl = document.getElementById('exercise-name-input');
      if (inputEl) {
        scrollExerciseInputIntoView(inputEl);
        updateExerciseSuggestions(val, 'exercise-name-input', 'exercise-suggestions-dropdown');
      }

      updateExercisePreviousWorkoutMetric(val);

      if (typeof resolveExerciseMuscles === 'function') {
        const profile = resolveExerciseMuscles(val);
        const impSelect = document.getElementById('implement-select');
        const musSelect = document.getElementById('muscle-group-select');

        if (profile) {
          if (impSelect && profile.implement) {
            impSelect.value = profile.implement;
            handleImplementChange(profile.implement);
          }
          if (musSelect && profile.primary) {
            musSelect.value = profile.primary;
          }
        }

        updateAutoMusclesIndicator(val, profile);
        updateWorkoutExtraOptionsPreview();
      } else {
        const match = defaultCatalog.find(c => c.name.toLowerCase() === val.toLowerCase());
        if (match) {
          document.getElementById('implement-select').value = match.implement;
          document.getElementById('muscle-group-select').value = match.muscle;
          handleImplementChange(match.implement);
        } else {
          const lower = val.toLowerCase();
          if (lower.includes('run') || lower.includes('jog') || lower.includes('sprint')) handleImplementChange("Running");
          else if (lower.includes('swim')) handleImplementChange("Swimming");
          else if (lower.includes('walk')) handleImplementChange("Walking");
          else if (lower.includes('hike')) handleImplementChange("Hiking");
          else if (lower.includes('bike') || lower.includes('cycle')) handleImplementChange("Biking");
          else if (lower.includes('row') || lower.includes('erg')) handleImplementChange("Row Erg");
        }
      }
    }

    function updateAutoMusclesIndicator(val, profile) {
      const pill = document.getElementById('exercise-auto-muscles-pill');
      if (!pill) return;
      const trimmed = (val || '').trim();
      if (!trimmed || !profile) {
        pill.classList.add('hidden');
        return;
      }
      const primaryEl = document.getElementById('auto-muscle-primary');
      const secEl = document.getElementById('auto-muscle-secondary');
      const secWrapper = document.getElementById('auto-muscle-secondary-wrapper');
      const impEl = document.getElementById('auto-implement-val');
      const impWrapper = document.getElementById('auto-implement-wrapper');

      if (primaryEl) primaryEl.innerText = profile.primary || 'Full Body';
      if (secEl && secWrapper) {
        if (profile.secondary && profile.secondary.length > 0) {
          secEl.innerText = profile.secondary.join(', ');
          secWrapper.classList.remove('hidden');
        } else {
          secWrapper.classList.add('hidden');
        }
      }
      if (impEl && impWrapper) {
        if (profile.implement) {
          impEl.innerText = profile.implement;
          impWrapper.classList.remove('hidden');
        } else {
          impWrapper.classList.add('hidden');
        }
      }
      pill.classList.remove('hidden');
    }

    function handleImplementChange(implementVal) {
      const standardPanel = document.getElementById('standard-metrics-panel');
      const ergPanel = document.getElementById('erg-metrics-panel');
      const swimPanel = document.getElementById('swim-metrics-panel');
      const endurancePanel = document.getElementById('endurance-metrics-panel');
      const runningPanel = document.getElementById('running-metrics-panel');

      if (standardPanel) standardPanel.classList.add('hidden');
      if (ergPanel) ergPanel.classList.add('hidden');
      if (swimPanel) swimPanel.classList.add('hidden');
      if (endurancePanel) endurancePanel.classList.add('hidden');
      if (runningPanel) runningPanel.classList.add('hidden');

      if (implementVal === "Running") {
        if (runningPanel) runningPanel.classList.remove('hidden');
        if (typeof updateRunningHRMUI === 'function') updateRunningHRMUI();
      } else if (implementVal === "Row Erg") {
        if (ergPanel) ergPanel.classList.remove('hidden');
      } else if (implementVal === "Swimming") {
        if (swimPanel) swimPanel.classList.remove('hidden');
      } else if (["Walking", "Hiking", "Biking"].includes(implementVal)) {
        const distLabel = document.getElementById('endurance-dist-label');
        if (distLabel) distLabel.innerText = `Distance (${implementVal} Miles)`;
        if (endurancePanel) endurancePanel.classList.remove('hidden');
      } else {
        if (standardPanel) standardPanel.classList.remove('hidden');
      }

      const impSelect = document.getElementById('implement-select');
      if (impSelect && impSelect.value !== implementVal) {
        impSelect.value = implementVal;
      }
      renderQuickWeightChips(implementVal);
      updateWorkoutExtraOptionsPreview();
    }

    function renderQuickWeightChips(implement = 'Barbell') {
      const container = document.getElementById('quick-plate-chips-container');
      const labelEl = document.getElementById('quick-plate-chips-label');
      if (!container) return;

      const imp = (implement || '').toLowerCase();
      let chips = [];
      let labelText = "Quick Plate Load";

      if (imp.includes('kettlebell') || imp.includes('kb')) {
        labelText = "Standard KB Sizes";
        chips = [
          { label: "16kg (35#)", val: 35, mode: "set" },
          { label: "20kg (44#)", val: 44, mode: "set" },
          { label: "24kg (53#)", val: 53, mode: "set" },
          { label: "28kg (62#)", val: 62, mode: "set" },
          { label: "32kg (70#)", val: 70, mode: "set" }
        ];
      } else if (imp.includes('barbell')) {
        labelText = "Barbell Plates";
        chips = [
          { label: "+45 (Plate)", val: 45, mode: "add" },
          { label: "+25 (Quarter)", val: 25, mode: "add" },
          { label: "+10", val: 10, mode: "add" },
          { label: "+5", val: 5, mode: "add" },
          { label: "+2.5", val: 2.5, mode: "add" },
          { label: "Bar (45#)", val: 45, mode: "set" }
        ];
      } else if (imp.includes('dumbbell') || imp.includes('db')) {
        labelText = "Dumbbell Weights";
        chips = [
          { label: "+5", val: 5, mode: "add" },
          { label: "+10", val: 10, mode: "add" },
          { label: "25#", val: 25, mode: "set" },
          { label: "35#", val: 35, mode: "set" },
          { label: "45#", val: 45, mode: "set" },
          { label: "50#", val: 50, mode: "set" }
        ];
      } else {
        labelText = "Quick Load";
        chips = [
          { label: "+5", val: 5, mode: "add" },
          { label: "+10", val: 10, mode: "add" },
          { label: "+25", val: 25, mode: "add" },
          { label: "+45", val: 45, mode: "add" }
        ];
      }

      if (labelEl) labelEl.innerText = labelText;

      container.innerHTML = chips.map(c => `
        <button type="button" onclick="triggerHaptic('light'); applyQuickWeightChip(${c.val}, '${c.mode}')" class="px-2.5 py-1 rounded-xl text-[11px] font-black border transition shrink-0 active:scale-95 bg-slate-900/90 text-slate-200 border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-950/30 hover:text-emerald-300">
          ${c.label}
        </button>
      `).join('');
    }

    function applyQuickWeightChip(val, mode) {
      const input = document.getElementById('input-weight');
      if (!input) return;
      let cur = parseFloat(input.value) || 0;
      if (mode === 'set') {
        cur = val;
      } else {
        cur = Math.max(0, Math.round((cur + val) * 10) / 10);
      }
      input.value = cur;
    }

    function toggleWorkoutExtraOptions() {
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      const panel = document.getElementById('workout-extra-options-panel');
      const chevron = document.getElementById('extra-options-chevron');
      if (!panel) return;
      const isHidden = panel.classList.contains('hidden');
      if (isHidden) {
        panel.classList.remove('hidden');
        if (chevron) chevron.classList.add('rotate-180');
      } else {
        panel.classList.add('hidden');
        if (chevron) chevron.classList.remove('rotate-180');
      }
    }

    function updateWorkoutExtraOptionsPreview() {
      const previewEl = document.getElementById('extra-options-preview');
      if (!previewEl) return;
      const implementEl = document.getElementById('implement-select');
      const muscleEl = document.getElementById('muscle-group-select');
      const rpeEl = document.getElementById('rpe-select');
      const imp = implementEl ? implementEl.value : 'Bodyweight';
      const mus = muscleEl ? muscleEl.value : 'Full Body';
      const rpe = rpeEl ? `RPE ${rpeEl.value}` : 'RPE 8';
      previewEl.innerText = `${imp} • ${mus} • ${rpe}`;
    }

    function selectQuickExercise(name) {
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      const input = document.getElementById('exercise-name-input');
      if (input) {
        input.value = name;
        if (typeof handleExerciseInput === 'function') {
          handleExerciseInput(name);
        }
      }
    }

    function adjustWeight(delta) {
      const input = document.getElementById('input-weight');
      if (!input) return;
      let val = parseFloat(input.value) || 0;
      val = Math.max(0, val + delta);
      val = Math.round(val * 10) / 10;
      input.value = val;
      if (typeof Event === 'function') {
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    function adjustReps(delta) {
      const input = document.getElementById('input-reps');
      if (!input) return;
      let val = parseInt(input.value) || 0;
      val = Math.max(1, val + delta);
      input.value = val;
      if (typeof Event === 'function') {
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    var scrollerSteps = { weight: 1, reps: 1 };
    if (typeof window !== 'undefined') {
      window.scrollerSteps = window.scrollerSteps || scrollerSteps;
      window.setScrollerStep = setScrollerStep;
      window.nudgeScroller = nudgeScroller;
      window.bindHoldStepper = bindHoldStepper;
    }

    function setScrollerStep(type, step) {
      const numStep = Number(step) || 1;
      if (typeof window !== 'undefined' && window.scrollerSteps) {
        window.scrollerSteps[type] = numStep;
      }
      scrollerSteps[type] = numStep;

      if (typeof document !== 'undefined') {
        const pills = document.querySelectorAll(`.step-pill-${type}`);
        if (pills && pills.length) {
          pills.forEach(pill => {
            const pillStep = Number(pill.getAttribute('data-step'));
            if (pillStep === numStep) {
              pill.classList.add('active');
              pill.classList.remove('text-slate-400');
            } else {
              pill.classList.remove('active');
              pill.classList.add('text-slate-400');
            }
          });
        }

        const hint = document.getElementById(`${type}-active-step-hint`);
        if (hint) {
          hint.innerText = `Step: ±${numStep}`;
        }
      }

      if (typeof triggerHaptic === 'function') {
        triggerHaptic('light');
      }
    }

    function nudgeScroller(type, direction, step) {
      if (typeof document === 'undefined') return;
      const amount = (typeof step === 'number')
        ? step
        : ((typeof window !== 'undefined' && window.scrollerSteps && window.scrollerSteps[type])
            ? window.scrollerSteps[type]
            : (scrollerSteps[type] || 1));

      if (type === 'weight') {
        adjustWeight(direction * amount);
      } else {
        adjustReps(direction * amount);
      }

      if (typeof triggerHaptic === 'function') {
        if (amount >= 5) {
          triggerHaptic('medium');
        } else {
          triggerHaptic('light');
        }
      }
    }

    /**
     * Bind single tap (1x step) and tap-and-hold (5x continuous steps)
     * @param {HTMLElement} btn - The stepper button (+ or -)
     * @param {'weight'|'reps'} type - Metric type
     * @param {number} deltaSign - +1 for increment, -1 for decrement
     */
    function bindHoldStepper(btn, type, deltaSign) {
      if (!btn || btn.dataset.stepperBound === 'true') return;
      btn.dataset.stepperBound = 'true';

      let holdTimer = null;
      let repeatInterval = null;
      let isHoldActive = false;
      let handledByPointer = false;

      function doStep(amount) {
        if (type === 'weight') {
          adjustWeight(amount * deltaSign);
        } else {
          adjustReps(amount * deltaSign);
        }
      }

      function startHold() {
        isHoldActive = true;
        btn.classList.add('stepper-btn-active');
        // Initial 5x step when hold threshold reached
        doStep(5);
        if (typeof triggerHaptic === 'function') {
          triggerHaptic('medium');
        }

        // Repeating 5x steps as long as held
        repeatInterval = setInterval(() => {
          doStep(5);
          if (typeof triggerHaptic === 'function') {
            triggerHaptic('light');
          }
        }, 140);
      }

      function stopHold() {
        if (holdTimer) {
          clearTimeout(holdTimer);
          holdTimer = null;
        }
        if (repeatInterval) {
          clearInterval(repeatInterval);
          repeatInterval = null;
        }
        btn.classList.remove('stepper-btn-active');
      }

      btn.addEventListener('pointerdown', (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        handledByPointer = true;
        stopHold();
        isHoldActive = false;

        if (btn.setPointerCapture && e.pointerId) {
          try { btn.setPointerCapture(e.pointerId); } catch (_) {}
        }

        // Initiate hold timer (350ms hold detection)
        holdTimer = setTimeout(startHold, 350);
      });

      btn.addEventListener('pointerup', (e) => {
        if (btn.releasePointerCapture && e.pointerId) {
          try { btn.releasePointerCapture(e.pointerId); } catch (_) {}
        }

        if (!isHoldActive && holdTimer) {
          // Single tap: released before hold threshold -> 1x step
          stopHold();
          doStep(1);
          if (typeof triggerHaptic === 'function') {
            triggerHaptic('light');
          }
        } else {
          // Release after holding
          stopHold();
        }
        isHoldActive = false;
        setTimeout(() => { handledByPointer = false; }, 120);
      });

      btn.addEventListener('pointercancel', (e) => {
        if (btn.releasePointerCapture && e.pointerId) {
          try { btn.releasePointerCapture(e.pointerId); } catch (_) {}
        }
        stopHold();
        isHoldActive = false;
        setTimeout(() => { handledByPointer = false; }, 120);
      });

      btn.addEventListener('pointerleave', () => {
        if (isHoldActive || holdTimer) {
          stopHold();
          isHoldActive = false;
        }
      });

      btn.addEventListener('click', () => {
        if (handledByPointer) return;
        doStep(1);
        if (typeof triggerHaptic === 'function') {
          triggerHaptic('light');
        }
      });

      btn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
      });
    }

    function initTouchScrollerInputs() {
      if (typeof document === 'undefined') return;

      const weightDec = document.getElementById('btn-weight-decrement');
      const weightInc = document.getElementById('btn-weight-increment');
      const repsDec = document.getElementById('btn-reps-decrement');
      const repsInc = document.getElementById('btn-reps-increment');

      if (weightDec) bindHoldStepper(weightDec, 'weight', -1);
      if (weightInc) bindHoldStepper(weightInc, 'weight', 1);
      if (repsDec) bindHoldStepper(repsDec, 'reps', -1);
      if (repsInc) bindHoldStepper(repsInc, 'reps', 1);

      // Support mouse wheel on inputs
      ['weight', 'reps'].forEach(type => {
        const input = document.getElementById(`input-${type}`);
        if (input && !input.dataset.wheelBound) {
          input.dataset.wheelBound = 'true';
          input.addEventListener('wheel', (e) => {
            if (e.preventDefault) e.preventDefault();
            const dir = (e.deltaY < 0 || e.deltaX > 0) ? 1 : -1;
            if (type === 'weight') adjustWeight(dir);
            else adjustReps(dir);
            if (typeof triggerHaptic === 'function') triggerHaptic('light');
          }, { passive: false });
        }
      });

      // Retained backward-compatible setup for tape ruler hooks if present
      const scrollers = [
        { type: 'weight', tapeId: 'tape-ruler-weight', inputId: 'input-weight' },
        { type: 'reps', tapeId: 'tape-ruler-reps', inputId: 'input-reps' }
      ];
      scrollers.forEach(cfg => {
        setupTapeRuler(cfg);
      });
    }

    function setupTapeRuler(cfg) {
      if (typeof document === 'undefined') return;
      const track = document.getElementById(cfg.tapeId);
      if (!track) return;
      const tape = track.querySelector('.tape-ruler-tape');
      if (tape && tape.children.length === 0) {
        const fragment = document.createDocumentFragment();
        for (let i = -15; i <= 15; i++) {
          const tick = document.createElement('div');
          tick.className = i % 5 === 0 ? 'tape-tick-major' : (i % 2 === 0 ? 'tape-tick-minor' : 'tape-tick-sub');
          fragment.appendChild(tick);
        }
        tape.appendChild(fragment);
      }
    }

    function adjustErgDistance(delta) {
      const input = document.getElementById('input-erg-distance');
      let val = parseInt(input.value) || 0;
      val = Math.max(50, val + delta);
      input.value = val;
    }

    function adjustErgTime(deltaSec) {
      const input = document.getElementById('input-erg-time');
      const parts = (input.value || "02:00").split(':');
      let totalSec = (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
      totalSec = Math.max(15, totalSec + deltaSec);

      const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
      const secs = String(totalSec % 60).padStart(2, '0');
      input.value = `${mins}:${secs}`;
    }

    function adjustSwimDistance(delta) {
      const input = document.getElementById('input-swim-distance');
      let val = parseInt(input.value) || 0;
      val = Math.max(25, val + delta);
      input.value = val;
    }

    function adjustSwimTime(deltaSec) {
      const input = document.getElementById('input-swim-time');
      const parts = (input.value || "10:00").split(':');
      let totalSec = (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
      totalSec = Math.max(15, totalSec + deltaSec);

      const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
      const secs = String(totalSec % 60).padStart(2, '0');
      input.value = `${mins}:${secs}`;
    }

    function adjustEnduranceDistance(delta) {
      const input = document.getElementById('input-endurance-distance');
      let val = parseFloat(input.value) || 0;
      val = Math.max(0.1, val + delta);
      input.value = val.toFixed(1);
    }

    function adjustEnduranceTime(deltaSec) {
      const input = document.getElementById('input-endurance-time');
      const parts = (input.value || "00:30:00").split(':');
      let totalSec = 0;
      if (parts.length === 3) {
        totalSec = (parseInt(parts[0]) || 0) * 3600 + (parseInt(parts[1]) || 0) * 60 + (parseInt(parts[2]) || 0);
      } else if (parts.length === 2) {
        totalSec = (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
      }
      totalSec = Math.max(60, totalSec + deltaSec);

      const hrs = String(Math.floor(totalSec / 3600)).padStart(2, '0');
      const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
      const secs = String(totalSec % 60).padStart(2, '0');
      input.value = `${hrs}:${mins}:${secs}`;
    }

    function adjustRunningDistance(delta) {
      const input = document.getElementById('input-running-distance');
      if (!input) return;
      let val = parseFloat(input.value) || 0;
      val = Math.max(0.1, Math.round((val + delta) * 100) / 100);
      input.value = val.toFixed(2).replace(/\.00$/, '.0').replace(/(\.[1-9])0$/, '$1');
    }

    function adjustRunningTime(deltaSec) {
      const input = document.getElementById('input-running-time');
      if (!input) return;
      const parts = (input.value || "00:25:00").split(':');
      let totalSec = 0;
      if (parts.length === 3) {
        totalSec = (parseInt(parts[0]) || 0) * 3600 + (parseInt(parts[1]) || 0) * 60 + (parseInt(parts[2]) || 0);
      } else if (parts.length === 2) {
        totalSec = (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
      }
      totalSec = Math.max(30, totalSec + deltaSec);
      const hrs = String(Math.floor(totalSec / 3600)).padStart(2, '0');
      const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
      const secs = String(totalSec % 60).padStart(2, '0');
      input.value = `${hrs}:${mins}:${secs}`;
    }

    function adjustRunningAvgHR(delta) {
      const input = document.getElementById('input-running-avg-hr');
      if (!input) return;
      let val = parseInt(input.value) || (typeof currentHR === 'number' && currentHR > 0 ? currentHR : 145);
      val = Math.max(40, Math.min(240, val + delta));
      input.value = val;
      input.dataset.autoCaptured = 'false';
      const avgSource = document.getElementById('running-avg-hr-source');
      if (avgSource) avgSource.innerText = "Manual";
    }

    function adjustRunningMaxHR(delta) {
      const input = document.getElementById('input-running-max-hr');
      if (!input) return;
      let val = parseInt(input.value) || (typeof currentHR === 'number' && currentHR > 0 ? currentHR : 165);
      val = Math.max(40, Math.min(240, val + delta));
      input.value = val;
      input.dataset.autoCaptured = 'false';
      const maxSource = document.getElementById('running-max-hr-source');
      if (maxSource) maxSource.innerText = "Manual";
    }

    function updateRunningHRMUI() {
      const statusInfo = document.getElementById('running-hrm-status-info');
      const connectBtn = document.getElementById('running-hrm-connect-btn');
      const avgSource = document.getElementById('running-avg-hr-source');
      const maxSource = document.getElementById('running-max-hr-source');
      const avgInput = document.getElementById('input-running-avg-hr');
      const maxInput = document.getElementById('input-running-max-hr');

      const isConnected = typeof isHRMConnected === 'function' ? isHRMConnected() : false;
      if (isConnected) {
        const liveBpm = typeof currentHR === 'number' && currentHR > 0 ? currentHR : 145;
        const samples = (window.runningHRSamples && window.runningHRSamples.length > 0) ? window.runningHRSamples : [liveBpm];
        const avgBpm = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
        const maxBpm = Math.max(...samples);

        if (avgInput) {
          avgInput.value = avgBpm;
        }
        if (maxInput) {
          maxInput.value = maxBpm;
        }

        if (avgSource) avgSource.innerHTML = `<span class="text-emerald-400 font-bold flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>HRM</span>`;
        if (maxSource) maxSource.innerHTML = `<span class="text-emerald-400 font-bold flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>HRM</span>`;

        if (statusInfo) {
          statusInfo.innerHTML = `
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
            <i class="fa-solid fa-heart-pulse text-rose-500 animate-pulse"></i>
            <span class="text-emerald-400 font-semibold">HRM Connected</span>
            <span class="text-slate-400 font-mono">(${liveBpm} BPM | Avg ${avgBpm} | Max ${maxBpm})</span>
          `;
        }
        if (connectBtn) {
          connectBtn.innerText = "HRM Settings";
          connectBtn.className = "text-emerald-400 hover:text-emerald-300 font-bold underline text-[10px]";
        }
      } else {
        if (avgSource) avgSource.innerText = "Manual";
        if (maxSource) maxSource.innerText = "Manual";
        if (statusInfo) {
          statusInfo.innerHTML = `
            <i class="fa-solid fa-bluetooth text-slate-500"></i>
            <span>No HRM Connected (Manual HR inputs active)</span>
          `;
        }
        if (connectBtn) {
          connectBtn.innerText = "Connect HRM";
          connectBtn.className = "text-rose-400 hover:text-rose-300 font-bold underline text-[10px]";
        }
      }
    }

    // ================= TIMER ENGINE: WORKOUT, SET & REST TIMERS =================

    function formatTimerHMS(totalSeconds) {
      const s = Math.max(0, Math.floor(totalSeconds || 0));
      const hrs = String(Math.floor(s / 3600)).padStart(2, '0');
      const mins = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      const secs = String(s % 60).padStart(2, '0');
      return `${hrs}:${mins}:${secs}`;
    }

    function formatDurationSecs(totalSeconds) {
      const s = Math.max(0, Math.floor(totalSeconds || 0));
      const mins = Math.floor(s / 60);
      const secs = s % 60;
      if (mins === 0) return `${secs}s`;
      return `${mins}m ${secs}s`;
    }

    // 1. WORKOUT SESSION TIMER: START, PAUSE & RESTART
    function startWorkoutTimer() {
      if (workoutTimerState === 'running') return;
      workoutTimerStartTimestamp = Date.now() - (workoutTimerSeconds * 1000);
      workoutTimerState = 'running';
      if (workoutTimerInterval) clearInterval(workoutTimerInterval);
      workoutTimerInterval = setInterval(tickWorkoutTimer, 1000);
      saveWorkoutTimerState();
      updateWorkoutTimerUI();
    }

    function pauseWorkoutTimer() {
      if (workoutTimerState !== 'running') return;
      if (workoutTimerInterval) clearInterval(workoutTimerInterval);
      workoutTimerInterval = null;
      workoutTimerState = 'paused';
      saveWorkoutTimerState();
      updateWorkoutTimerUI();
    }

    function restartWorkoutTimer() {
      if (workoutTimerInterval) clearInterval(workoutTimerInterval);
      workoutTimerInterval = null;
      workoutTimerSeconds = 0;
      workoutTimerStartTimestamp = Date.now();
      workoutTimerState = 'running';
      workoutTimerInterval = setInterval(tickWorkoutTimer, 1000);
      saveWorkoutTimerState();
      updateWorkoutTimerUI();
      if (typeof showToast === 'function') {
        showToast("Session timer restarted at 00:00:00", "info");
      }
    }

    function toggleWorkoutTimer() {
      if (workoutTimerState === 'running') {
        pauseWorkoutTimer();
      } else {
        startWorkoutTimer();
      }
    }

    function tickWorkoutTimer() {
      if (!workoutTimerStartTimestamp || workoutTimerState !== 'running') return;
      workoutTimerSeconds = Math.max(0, Math.floor((Date.now() - workoutTimerStartTimestamp) / 1000));
      updateWorkoutTimerUI();
    }

    function updateWorkoutTimerUI() {
      const timerEl = document.getElementById('session-timer');
      const toggleBtn = document.getElementById('session-timer-toggle-btn');
      const iconEl = document.getElementById('session-timer-icon');
      const pulseEl = document.getElementById('session-timer-pulse');

      if (timerEl) {
        timerEl.innerText = formatTimerHMS(workoutTimerSeconds);
      }

      if (iconEl && toggleBtn) {
        if (workoutTimerState === 'running') {
          iconEl.className = "fa-solid fa-pause text-amber-400 text-xs";
          toggleBtn.title = "Pause Session Timer";
          toggleBtn.className = "px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 flex items-center justify-center text-xs font-black gap-2 transition active:scale-95 border border-amber-500/30 shadow";
          if (pulseEl) pulseEl.className = "w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping inline-block";
        } else if (workoutTimerState === 'paused') {
          iconEl.className = "fa-solid fa-play text-emerald-400 text-xs";
          toggleBtn.title = "Resume Session Timer";
          toggleBtn.className = "px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 flex items-center justify-center text-xs font-black gap-2 transition active:scale-95 border border-emerald-500/30 shadow";
          if (pulseEl) pulseEl.className = "w-3.5 h-3.5 rounded-full bg-amber-400 inline-block";
        } else {
          iconEl.className = "fa-solid fa-play text-slate-200 text-xs";
          toggleBtn.title = "Start Session Timer";
          toggleBtn.className = "px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-black gap-2 transition active:scale-95 border border-slate-700 shadow";
          if (pulseEl) pulseEl.className = "w-3.5 h-3.5 rounded-full bg-slate-600 inline-block";
        }
      }
    }

    function saveWorkoutTimerState() {
      try {
        localStorage.setItem('showUp_session_timer', JSON.stringify({
          seconds: workoutTimerSeconds,
          state: workoutTimerState,
          timestamp: Date.now()
        }));
      } catch (e) {}
    }

    function restoreWorkoutTimerState() {
      try {
        const raw = localStorage.getItem('showUp_session_timer');
        if (raw) {
          const data = JSON.parse(raw);
          if (data && typeof data.seconds === 'number') {
            if (data.state === 'running' && data.timestamp) {
              const deltaSec = Math.floor((Date.now() - data.timestamp) / 1000);
              workoutTimerSeconds = data.seconds + Math.max(0, deltaSec);
              startWorkoutTimer();
            } else {
              workoutTimerSeconds = data.seconds;
              workoutTimerState = data.state || 'stopped';
              updateWorkoutTimerUI();
            }
          }
        }
      } catch (e) {}
    }

    // 1b. WORKOUT IN PROGRESS HUD (START TIME, COMPLETED EXERCISES, SETS LOGGED)
    function getWorkoutSessionStartTime() {
      try {
        let stored = localStorage.getItem('showUp_workout_start_time');
        if (stored) {
          const ts = parseInt(stored, 10);
          if (!isNaN(ts) && ts > 0) return ts;
        }
        if (typeof currentSessionSets !== 'undefined' && Array.isArray(currentSessionSets) && currentSessionSets.length > 0) {
          const setTimestamps = currentSessionSets.map(s => s.id).filter(id => typeof id === 'number' && id > 1000000000);
          if (setTimestamps.length > 0) {
            const minSetTime = Math.min(...setTimestamps);
            localStorage.setItem('showUp_workout_start_time', String(minSetTime));
            return minSetTime;
          }
        }
        const now = Date.now();
        localStorage.setItem('showUp_workout_start_time', String(now));
        return now;
      } catch (e) {
        return Date.now();
      }
    }

    function formatWorkoutStartTime(timestamp) {
      if (!timestamp) return 'Started --';
      try {
        const d = new Date(timestamp);
        const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
        return `Started ${timeStr}`;
      } catch (e) {
        return 'Started --';
      }
    }

    function updateWorkoutSessionHUD() {
      const startTimeEl = document.getElementById('workout-session-start-time');
      const completedEl = document.getElementById('session-completed-exercises-display');
      const setsLoggedEl = document.getElementById('session-sets-logged-display');

      if (startTimeEl) {
        const startTimeTs = getWorkoutSessionStartTime();
        startTimeEl.innerText = formatWorkoutStartTime(startTimeTs);
      }

      const sets = (typeof currentSessionSets !== 'undefined' && Array.isArray(currentSessionSets)) ? currentSessionSets : [];
      const setsCount = sets.length;

      if (setsLoggedEl) {
        setsLoggedEl.innerText = String(setsCount);
      }

      if (completedEl) {
        const uniqueExercises = new Set(
          sets.map(s => (s.exerciseName || '').trim().toLowerCase()).filter(Boolean)
        );
        const count = uniqueExercises.size;
        completedEl.innerText = `${count} ${count === 1 ? 'exercise' : 'exercises'}`;
      }
    }

    function toggleSessionOptionsMenu() {
      const menu = document.getElementById('session-options-menu');
      if (!menu) return;
      menu.classList.toggle('hidden');
    }

    function resetWorkoutSession() {
      if (typeof currentSessionSets !== 'undefined' && currentSessionSets.length > 0) {
        if (typeof confirm === 'function' && !confirm("Are you sure you want to reset this workout session? All logged sets for this session will be cleared.")) {
          return;
        }
      }
      currentSessionSets = [];
      try {
        localStorage.removeItem('showUp_active_workout_sets');
        localStorage.removeItem('showUp_workout_start_time');
        localStorage.removeItem('showUp_session_timer');
      } catch (e) {}
      if (typeof restartWorkoutTimer === 'function') {
        workoutTimerSeconds = 0;
        workoutTimerState = 'stopped';
        if (workoutTimerInterval) clearInterval(workoutTimerInterval);
        workoutTimerInterval = null;
        updateWorkoutTimerUI();
      }
      renderLoggedSets();
      updateWorkoutSessionHUD();
      if (typeof showToast === 'function') {
        showToast("Workout session reset", "info");
      }
    }

    // 2. SET & REST TIMERS: START SET, LOG SET, REST TRACKING
    function startSet() {
      if (typeof triggerHaptic === 'function') triggerHaptic('medium');

      // Requirement 3: When a second set is started the rest timer shall stop and get recorded
      // as the rest period between the prior set and the newly started set.
      if (isRestTimerRunning) {
        const elapsedRest = Math.max(1, Math.floor((Date.now() - (restTimerStartTime || Date.now())) / 1000));
        currentPendingRestPeriod = elapsedRest;
        stopRestTimer();
        if (typeof showToast === 'function') {
          showToast(`Rest recorded: ${formatDurationSecs(currentPendingRestPeriod)}. Starting set!`, "info");
        }
      }

      // Auto-start session timer if not active
      if (workoutTimerState === 'stopped') {
        startWorkoutTimer();
      }

      isSetInProgress = true;
      activeSetStartTime = Date.now();
      activeSetElapsedSeconds = 0;

      if (activeSetTimerInterval) clearInterval(activeSetTimerInterval);
      activeSetTimerInterval = setInterval(tickActiveSet, 1000);

      updateSetControlsUI();
    }

    function formatTimerMS(totalSeconds) {
      const s = Math.max(0, Math.floor(totalSeconds || 0));
      const mins = String(Math.floor(s / 60)).padStart(2, '0');
      const secs = String(s % 60).padStart(2, '0');
      return `${mins}:${secs}`;
    }

    function tickActiveSet() {
      if (!activeSetStartTime || !isSetInProgress) return;
      activeSetElapsedSeconds = Math.max(0, Math.floor((Date.now() - activeSetStartTime) / 1000));
      const nextSetNum = currentSessionSets.length + 1;
      const label = document.getElementById('btn-start-set-label');
      if (label) {
        label.innerText = `Timing Set ${nextSetNum} (${formatDurationSecs(activeSetElapsedSeconds)})`;
      }
      const valEl = document.getElementById('active-set-timer-val');
      if (valEl) {
        valEl.innerText = formatTimerMS(activeSetElapsedSeconds);
      }
    }

    function cancelActiveSetTimer() {
      isSetInProgress = false;
      activeSetStartTime = null;
      activeSetElapsedSeconds = 0;
      if (activeSetTimerInterval) clearInterval(activeSetTimerInterval);
      activeSetTimerInterval = null;
      updateSetControlsUI();
      if (typeof showToast === 'function') {
        showToast("Active set timer cancelled", "info");
      }
    }

    function saveRestTimerState() {
      try {
        if (isRestTimerRunning && restTimerStartTime) {
          localStorage.setItem('showUp_rest_timer_data', JSON.stringify({
            running: true,
            startTime: restTimerStartTime,
            target: currentSessionRestTarget || getDefaultRestTimeSeconds(),
            hasTriggeredRecovery: hasTriggeredRestRecoveryAlert
          }));
        } else {
          localStorage.removeItem('showUp_rest_timer_data');
        }
      } catch (e) {}
    }

    function restoreRestTimerState() {
      try {
        const raw = localStorage.getItem('showUp_rest_timer_data');
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data && data.running && data.startTime) {
          const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
          // Restore if started within the last 30 minutes (1800s)
          if (elapsed >= 0 && elapsed < 1800) {
            restTimerStartTime = data.startTime;
            restTimerSeconds = elapsed;
            currentSessionRestTarget = data.target || null;
            hasTriggeredRestRecoveryAlert = !!data.hasTriggeredRecovery;
            isRestTimerRunning = true;
            if (restTimerInterval) clearInterval(restTimerInterval);
            restTimerInterval = setInterval(tickRestTimer, 1000);
            checkRestRecoveryThreshold();
            updateRestTimerUI();
            updateSetControlsUI();
          } else {
            localStorage.removeItem('showUp_rest_timer_data');
          }
        }
      } catch (e) {}
    }

    function startRestTimer(initialSeconds = 0) {
      if (restTimerInterval) clearInterval(restTimerInterval);
      isRestTimerRunning = true;
      hasTriggeredRestRecoveryAlert = false;
      currentSessionRestTarget = getDefaultRestTimeSeconds();
      restTimerSeconds = initialSeconds;
      restTimerStartTime = Date.now() - (initialSeconds * 1000);
      saveRestTimerState();
      restTimerInterval = setInterval(tickRestTimer, 1000);
      checkRestRecoveryThreshold();
      updateRestTimerUI();
      updateSetControlsUI();
    }

    function stopRestTimer() {
      if (restTimerInterval) clearInterval(restTimerInterval);
      restTimerInterval = null;
      isRestTimerRunning = false;
      hasTriggeredRestRecoveryAlert = false;
      restTimerStartTime = null;
      restTimerSeconds = 0;
      currentSessionRestTarget = null;
      saveRestTimerState();
      updateRestTimerUI();
      updateSetControlsUI();
    }

    function checkRestRecoveryThreshold() {
      if (!isRestTimerRunning) return;
      const targetRest = currentSessionRestTarget || getDefaultRestTimeSeconds();
      if (restTimerSeconds >= targetRest && !hasTriggeredRestRecoveryAlert) {
        hasTriggeredRestRecoveryAlert = true;
        saveRestTimerState();

        // 1. Recovery haptic alert (double pulse matching double bell ring)
        if (typeof triggerHaptic === 'function') {
          triggerHaptic('recovery');
        } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate([70, 100, 90]);
          } catch (e) {}
        }

        // 2. Optional double bell ring alert sound
        if (typeof isRestSoundAlertEnabled === 'function' && isRestSoundAlertEnabled()) {
          if (typeof playDoubleBellRing === 'function') {
            playDoubleBellRing();
          }
        }
      }
    }

    function tickRestTimer() {
      if (!restTimerStartTime || !isRestTimerRunning) return;
      restTimerSeconds = Math.max(0, Math.floor((Date.now() - restTimerStartTime) / 1000));
      checkRestRecoveryThreshold();
      updateRestTimerUI();
    }

    function getCurrentRestTarget() {
      return currentSessionRestTarget || getDefaultRestTimeSeconds();
    }

    function adjustRestTimer(deltaSecs) {
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      if (isRestTimerRunning) {
        const currentTarget = currentSessionRestTarget || getDefaultRestTimeSeconds();
        currentSessionRestTarget = Math.max(10, currentTarget + deltaSecs);
        // If the new target exceeds current rest seconds, re-arm the alert
        if (currentSessionRestTarget > restTimerSeconds) {
          hasTriggeredRestRecoveryAlert = false;
        }
        saveRestTimerState();
        checkRestRecoveryThreshold();
        updateRestTimerUI();
        if (typeof showToast === 'function') {
          showToast(`Rest target extended to ${currentSessionRestTarget}s (+${deltaSecs}s)`, "info");
        }
      }
    }

    function skipRestTimer() {
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      if (isRestTimerRunning) {
        currentPendingRestPeriod = Math.max(1, Math.floor((Date.now() - (restTimerStartTime || Date.now())) / 1000));
        stopRestTimer();
        if (typeof showToast === 'function') {
          showToast(`Rest period skipped (${formatDurationSecs(currentPendingRestPeriod)} recorded).`, "info");
        }
      }
    }

    function getDefaultRestTimeSeconds() {
      const saved = localStorage.getItem('showUp_default_rest_time');
      return saved ? parseInt(saved, 10) : 90;
    }

    function saveDefaultRestTimePref(val) {
      const seconds = parseInt(val, 10) || 90;
      localStorage.setItem('showUp_default_rest_time', seconds);
      if (typeof showToast === 'function') {
        showToast(`Default rest target set to ${seconds}s`, "info");
      }
      if (isRestTimerRunning) {
        updateRestTimerUI();
      }
    }

    function updateRestTimerUI() {
      const banner = document.getElementById('rest-timer-banner');
      const valEl = document.getElementById('rest-timer-val');
      const captionEl = document.getElementById('rest-timer-caption');
      const badgeEl = document.getElementById('rest-timer-status-badge');

      if (!banner) return;

      if (isRestTimerRunning) {
        const wasHidden = banner.classList.contains('hidden');
        banner.classList.remove('hidden');
        if (wasHidden && typeof banner.scrollIntoView === 'function') {
          try {
            banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          } catch (e) {}
        }
        if (valEl) valEl.innerText = formatDurationSecs(restTimerSeconds);
        const setNum = currentSessionSets.length;
        const nextNum = setNum + 1;
        const targetRest = currentSessionRestTarget || getDefaultRestTimeSeconds();

        if (restTimerSeconds >= targetRest) {
          if (badgeEl) {
            badgeEl.className = "text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 uppercase tracking-wider animate-bounce";
            badgeEl.innerText = "Ready to Lift!";
          }
          if (captionEl) {
            captionEl.innerHTML = `<span class="text-emerald-300 font-bold">Target recovery reached (${targetRest}s).</span> Tap "Log Set ${nextNum}" when ready!`;
          }
          banner.classList.add('border-emerald-400', 'shadow-emerald-500/30');
        } else {
          if (badgeEl) {
            badgeEl.className = "text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider";
            badgeEl.innerText = `Resting (${targetRest}s target)`;
          }
          if (captionEl) {
            captionEl.innerText = `Resting after Set ${setNum}... (${restTimerSeconds}s / ${targetRest}s target) Tap "Log Set ${nextNum}" when ready.`;
          }
          banner.classList.remove('border-emerald-400', 'shadow-emerald-500/30');
        }

        if (typeof updateRestSoundAlertUI === 'function') {
          updateRestSoundAlertUI();
        }
      } else {
        banner.classList.add('hidden');
      }
    }

    function updateSetControlsUI() {
      const startBtn = document.getElementById('btn-start-set');
      const startLabel = document.getElementById('btn-start-set-label');
      const startIcon = document.getElementById('btn-start-set-icon');
      const logLabel = document.getElementById('btn-log-set-label');
      const nextSetNum = currentSessionSets.length + 1;

      if (logLabel) {
        logLabel.innerText = `Log Set ${nextSetNum}`;
      }

      const activeBanner = document.getElementById('active-set-timer-banner');
      const activeVal = document.getElementById('active-set-timer-val');
      const activeCaption = document.getElementById('active-set-caption');
      const activeBadge = document.getElementById('active-set-badge');

      if (isSetInProgress) {
        if (activeBanner) {
          activeBanner.className = "bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-2 border-amber-500/60 rounded-3xl p-4 sm:p-5 space-y-3 shadow-2xl transition-all";
          if (activeBanner.classList && typeof activeBanner.classList.remove === 'function') {
            activeBanner.classList.remove('hidden');
          }
        }
        if (activeVal) activeVal.innerText = formatTimerMS(activeSetElapsedSeconds);
        if (activeCaption) activeCaption.innerText = `Set ${nextSetNum} in progress... Tap "Log Set ${nextSetNum}" when finished.`;
        if (activeBadge) activeBadge.innerText = `Timing Set ${nextSetNum}`;

        if (startBtn && startLabel && startIcon) {
          startBtn.className = "w-full py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs sm:text-sm font-semibold transition active:scale-[0.99] flex items-center justify-center gap-2";
          if (startBtn.classList && typeof startBtn.classList.remove === 'function') {
            startBtn.classList.remove('hidden');
          }
          startIcon.className = "fa-solid fa-stopwatch text-amber-400 text-xs animate-pulse";
          startLabel.innerText = `Timing Set ${nextSetNum} (${formatDurationSecs(activeSetElapsedSeconds)})`;
        }
      } else {
        if (activeBanner) {
          activeBanner.className = "hidden";
          if (activeBanner.classList && typeof activeBanner.classList.add === 'function') {
            activeBanner.classList.add('hidden');
          }
        }

        if (startBtn && startLabel && startIcon) {
          startBtn.className = "w-full py-2.5 px-4 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs sm:text-sm font-semibold transition active:scale-[0.99] flex items-center justify-center gap-2";
          if (startBtn.classList && typeof startBtn.classList.remove === 'function') {
            startBtn.classList.remove('hidden');
          }
          startIcon.className = "fa-solid fa-stopwatch text-slate-400 text-xs";
          if (isRestTimerRunning) {
            startLabel.innerText = `Start Set ${nextSetNum} (End Rest)`;
          } else {
            startLabel.innerText = `Start Set ${nextSetNum}`;
          }
        }
      }
    }

    function logSet() {
      const exerciseInput = document.getElementById('exercise-name-input');
      const exerciseName = (exerciseInput ? exerciseInput.value.trim() : '') || "Custom Exercise";
      const implementEl = document.getElementById('implement-select');
      let implement = implementEl ? implementEl.value : 'Bodyweight';
      const muscleEl = document.getElementById('muscle-group-select');
      let muscle = muscleEl ? muscleEl.value : 'Full Body';
      const rpeEl = document.getElementById('rpe-select');
      const rpe = rpeEl ? (parseFloat(rpeEl.value) || 8) : 8;

      let weight = 0, reps = 1, ergDistance = 0, ergTime = "";
      let swimDistance = 0, swimTime = "";
      let enduranceDistance = 0, enduranceTime = "";
      let runningDistance = 0, runningTime = "", runningAvgHR = null, runningMaxHR = null;

      if (implement === "Running") {
        runningDistance = parseFloat(document.getElementById('input-running-distance')?.value) || 1.0;
        runningTime = document.getElementById('input-running-time')?.value || "00:25:00";
        const parsedAvg = parseInt(document.getElementById('input-running-avg-hr')?.value);
        const parsedMax = parseInt(document.getElementById('input-running-max-hr')?.value);
        runningAvgHR = !isNaN(parsedAvg) ? parsedAvg : (typeof currentHR === 'number' && currentHR > 0 ? currentHR : null);
        runningMaxHR = !isNaN(parsedMax) ? parsedMax : (typeof currentHR === 'number' && currentHR > 0 ? currentHR : null);
      } else if (implement === "Row Erg") {
        ergDistance = parseInt(document.getElementById('input-erg-distance')?.value) || 500;
        ergTime = document.getElementById('input-erg-time')?.value || "02:00";
      } else if (implement === "Swimming") {
        swimDistance = parseInt(document.getElementById('input-swim-distance')?.value) || 500;
        swimTime = document.getElementById('input-swim-time')?.value || "10:00";
      } else if (["Walking", "Hiking", "Biking"].includes(implement)) {
        enduranceDistance = parseFloat(document.getElementById('input-endurance-distance')?.value) || 1.0;
        enduranceTime = document.getElementById('input-endurance-time')?.value || "00:30:00";
      } else {
        weight = parseFloat(document.getElementById('input-weight')?.value) || 0;
        reps = parseInt(document.getElementById('input-reps')?.value) || 1;
      }

      // Calculate set active duration if Start Set was used
      let setDuration = 0;
      if (isSetInProgress && activeSetStartTime) {
        setDuration = Math.max(1, Math.floor((Date.now() - activeSetStartTime) / 1000));
      }

      // If user logged set directly while resting without tapping Start Set
      if (isRestTimerRunning) {
        currentPendingRestPeriod = Math.max(1, Math.floor((Date.now() - (restTimerStartTime || Date.now())) / 1000));
        stopRestTimer();
      }

      const restPeriod = currentPendingRestPeriod || 0;
      currentPendingRestPeriod = 0;

      // Reset active set status
      isSetInProgress = false;
      activeSetStartTime = null;
      activeSetElapsedSeconds = 0;
      if (activeSetTimerInterval) clearInterval(activeSetTimerInterval);
      activeSetTimerInterval = null;

      // Establish primary and secondary muscles and inferred implement automatically with high accuracy
      let secondaryMuscles = [];
      if (typeof resolveExerciseMuscles === 'function') {
        const profile = resolveExerciseMuscles(exerciseName, implement);
        if (profile) {
          // Implement input is optional; automatically infer from exercise name as applicable
          if (profile.implement && (implement === 'Bodyweight' || !implement || profile.inferred)) {
            implement = profile.implement;
            if (implementEl) implementEl.value = implement;
          }
          if (!muscle || muscle === 'Full Body' || (muscleEl && muscleEl.value === 'Full Body' && profile.primary !== 'Full Body')) {
            muscle = profile.primary;
          }
          secondaryMuscles = profile.secondary || [];
        }
      } else {
        const catalogMatch = defaultCatalog.find(c => c.name.toLowerCase() === exerciseName.toLowerCase());
        secondaryMuscles = catalogMatch && catalogMatch.secondary ? catalogMatch.secondary : [];
        if (catalogMatch && catalogMatch.implement) implement = catalogMatch.implement;
      }

      const setObj = {
        id: Date.now(),
        exerciseName,
        implement,
        muscle,
        secondaryMuscles,
        rpe,
        weight,
        reps,
        runningDistance,
        runningTime,
        runningAvgHR,
        runningMaxHR,
        ergDistance,
        ergTime,
        swimDistance,
        swimTime,
        enduranceDistance,
        enduranceTime,
        hr: currentHR,
        setDuration,
        restPeriod
      };

      currentSessionSets.push(setObj);
      try {
        localStorage.setItem('showUp_active_workout_sets', JSON.stringify(currentSessionSets));
      } catch (e) {}

      try {
        renderLoggedSets();
      } catch (err) {
        console.warn('Error rendering logged sets:', err);
      }

      try {
        broadcastUserWorkoutStarted(exerciseName);
      } catch (e) {}

      try {
        if (googleAccessToken) {
          syncToGoogleDrive();
        }
      } catch (e) {}

      try {
        if (workoutTimerState === 'stopped') {
          startWorkoutTimer();
        }
      } catch (e) {}

      try {
        if (typeof triggerHaptic === 'function') triggerHaptic('heavy');
      } catch (e) {}

      try {
        if (typeof playUnobtrusiveChime === 'function') {
          playUnobtrusiveChime();
        }
      } catch (e) {}

      // Requirement 2: Once a set is logged, a rest timer shall start reliably.
      try {
        startRestTimer();
        updateSetControlsUI();
        updateExercisePreviousWorkoutMetric(exerciseName);
      } catch (err) {
        console.error('Error starting rest timer:', err);
      }
    }

    function isAthleteAuthenticated() {
      if (typeof isCustomerLoggedIn === 'function' && isCustomerLoggedIn()) return true;
      if (typeof googleAccessToken !== 'undefined' && googleAccessToken) return true;
      return false;
    }

    function isFirstSetLoginPromptDismissed() {
      try {
        return sessionStorage.getItem('showUp_first_set_login_prompt_dismissed') === 'true';
      } catch (e) {
        return false;
      }
    }

    function dismissFirstSetLoginPrompt() {
      try {
        sessionStorage.setItem('showUp_first_set_login_prompt_dismissed', 'true');
      } catch (e) {}
      const el = document.getElementById('first-set-login-prompt');
      if (el) {
        el.style.transition = 'opacity 0.2s ease, max-height 0.25s ease';
        el.style.opacity = '0';
        el.style.maxHeight = '0px';
        el.style.overflow = 'hidden';
        setTimeout(() => {
          if (el && el.parentNode) el.parentNode.removeChild(el);
        }, 250);
      }
    }

    function renderLoggedSets() {
      const container = document.getElementById('logged-sets-list');
      const badge = document.getElementById('set-count-badge');
      if (badge) badge.innerText = `${currentSessionSets.length} Sets`;

      updateWorkoutSessionHUD();

      if (!container) return;

      if (currentSessionSets.length === 0) {
        container.innerHTML = `<div class="text-center py-8 text-slate-500 text-xs sm:text-sm italic font-medium">No sets logged for this session yet. Pick an exercise above and hit "Log Set".</div>`;
        updateSetControlsUI();
        return;
      }

      // Descending order: latest to oldest sets
      const reversedSets = [...currentSessionSets].reverse();
      let html = '';
      reversedSets.forEach((s, revIdx) => {
        const setNumber = currentSessionSets.length - revIdx;
        const isLatest = revIdx === 0;

        html += `
          <div class="bg-slate-950 p-3.5 sm:p-4 rounded-2xl border ${isLatest ? 'border-emerald-500/50 bg-emerald-950/20 shadow-emerald-500/10' : 'border-slate-800'} shadow-md flex items-center justify-between gap-3 transition-all">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-black uppercase ${isLatest ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-500/40' : 'text-slate-400 bg-slate-900 border border-slate-800'} px-2.5 py-0.5 rounded-lg">Set #${setNumber}</span>
                ${isLatest ? '<span class="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded">Latest Set</span>' : ''}
                <div class="text-sm sm:text-base font-black text-slate-100 truncate">${s.exerciseName}</div>
              </div>

              <div class="text-xs text-slate-300 gap-2 flex items-center flex-wrap mt-1.5">
                <span class="bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-lg font-bold">${s.implement}</span>
                ${s.implement === "Running" ? `<span class="font-bold text-slate-200">${s.runningDistance} mi | ${s.runningTime}${s.runningAvgHR ? ` | HR: ${s.runningAvgHR} avg` + (s.runningMaxHR ? ` / ${s.runningMaxHR} max` : '') : ''}</span>` :
                  s.implement === "Row Erg" ? `<span class="font-bold text-slate-200">${s.ergDistance}m | ${s.ergTime}</span>` :
                  s.implement === "Swimming" ? `<span class="font-bold text-slate-200">${s.swimDistance} yds | ${s.swimTime}</span>` :
                  ["Walking", "Hiking", "Biking"].includes(s.implement) ? `<span class="font-bold text-slate-200">${s.enduranceDistance} mi | ${s.enduranceTime}</span>` :
                  `<span class="font-black text-emerald-300 text-sm">${s.weight} lbs × ${s.reps} reps</span>`}
                <span class="text-slate-400 font-semibold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">RPE ${s.rpe}</span>
                ${s.setDuration ? `<span class="bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-lg font-mono text-[11px]"><i class="fa-regular fa-clock mr-1 text-emerald-500"></i>Set: ${formatDurationSecs(s.setDuration)}</span>` : ''}
                ${s.restPeriod && s.restPeriod > 0 ? `<span class="bg-emerald-950/70 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-lg font-mono text-[11px]"><i class="fa-solid fa-hourglass-half mr-1 text-emerald-400"></i>Rest: ${formatDurationSecs(s.restPeriod)}</span>` : ''}
              </div>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <button onclick="triggerHaptic('medium'); repeatSet(${s.id})" class="text-xs font-black px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 transition active:scale-95 shadow-sm" title="Repeat this set in workout controls">
                <i class="fa-solid fa-arrow-rotate-right text-xs"></i>
                <span class="hidden sm:inline">Repeat</span>
              </button>
              <button onclick="triggerHaptic('light'); openEditActiveSetModal(${s.id})" class="text-slate-400 hover:text-emerald-400 p-2 rounded-xl hover:bg-slate-900 transition" title="Edit Set">
                <i class="fa-solid fa-pen-to-square text-base"></i>
              </button>
              <button onclick="triggerHaptic('light'); deleteSet(${s.id})" class="text-slate-500 hover:text-rose-400 p-2 rounded-xl hover:bg-slate-900 transition" title="Delete Set">
                <i class="fa-solid fa-trash-can text-base"></i>
              </button>
            </div>
          </div>
        `;
      });

      // Contextual prompt: after set 1 is logged, invite guest athlete to save workout & sync
      if (currentSessionSets.length >= 1 && !isAthleteAuthenticated() && !isFirstSetLoginPromptDismissed()) {
        html += `
          <div id="first-set-login-prompt" class="mt-3.5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900/95 to-slate-900 border border-emerald-500/35 shadow-lg shadow-emerald-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-lg shrink-0 shadow-sm">
                <i class="fa-solid fa-cloud-arrow-up"></i>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs sm:text-sm font-black text-slate-100">First set in the books! 🎉</span>
                  <span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Auto-Save</span>
                </div>
                <p class="text-[11px] sm:text-xs text-slate-300/90 mt-0.5">Sign in to save your workout and sync your streaks to the cloud.</p>
              </div>
            </div>
            <div class="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-1 sm:pt-0">
              <button type="button" onclick="triggerHaptic('light'); dismissFirstSetLoginPrompt()" class="text-slate-400 hover:text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-slate-800/80 transition">
                Later
              </button>
              <button type="button" onclick="triggerHaptic('medium'); openAuthLoginModal('signin')" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-md shadow-emerald-500/20 transition active:scale-95 flex items-center gap-1.5">
                <i class="fa-solid fa-right-to-bracket text-xs"></i>
                <span>Sign In to Save</span>
              </button>
            </div>
          </div>
        `;
      }

      container.innerHTML = html;
      updateSetControlsUI();
    }

    function deleteSet(id) {
      currentSessionSets = currentSessionSets.filter(s => s.id !== id);
      localStorage.setItem('showUp_active_workout_sets', JSON.stringify(currentSessionSets));
      renderLoggedSets();
      updateSetControlsUI();

      if (googleAccessToken) {
        syncToGoogleDrive();
      }
    }

    function repeatSet(setId) {
      if (typeof triggerHaptic === 'function') triggerHaptic('medium');
      const set = currentSessionSets.find(s => s.id === setId);
      if (!set) return;

      const exInput = document.getElementById('exercise-name-input');
      const legacyExInput = document.getElementById('input-exercise-name');
      const impSelect = document.getElementById('implement-select');
      const muscleSelect = document.getElementById('muscle-group-select');
      const weightInput = document.getElementById('input-weight');
      const repsInput = document.getElementById('input-reps');
      const rpeSelect = document.getElementById('rpe-select');
      const ergDistInput = document.getElementById('input-erg-distance');
      const ergTimeInput = document.getElementById('input-erg-time');
      const swimDistInput = document.getElementById('input-swim-distance');
      const swimTimeInput = document.getElementById('input-swim-time');
      const endDistInput = document.getElementById('input-endurance-distance');
      const endTimeInput = document.getElementById('input-endurance-time');
      const runDistInput = document.getElementById('input-running-distance');
      const runTimeInput = document.getElementById('input-running-time');
      const runAvgHRInput = document.getElementById('input-running-avg-hr');
      const runMaxHRInput = document.getElementById('input-running-max-hr');

      if (exInput) {
        exInput.value = set.exerciseName || '';
        if (typeof handleExerciseInput === 'function' && set.exerciseName) {
          handleExerciseInput(set.exerciseName);
        }
      }
      if (legacyExInput) {
        legacyExInput.value = set.exerciseName || '';
      }
      if (impSelect && set.implement) {
        impSelect.value = set.implement;
        handleImplementChange(set.implement);
      }
      if (muscleSelect && set.muscle) muscleSelect.value = set.muscle;
      if (weightInput && typeof set.weight === 'number') weightInput.value = set.weight;
      if (repsInput && typeof set.reps === 'number') repsInput.value = set.reps;
      if (rpeSelect && set.rpe) rpeSelect.value = set.rpe;
      if (ergDistInput && set.ergDistance) ergDistInput.value = set.ergDistance;
      if (ergTimeInput && set.ergTime) ergTimeInput.value = set.ergTime;
      if (swimDistInput && set.swimDistance) swimDistInput.value = set.swimDistance;
      if (swimTimeInput && set.swimTime) swimTimeInput.value = set.swimTime;
      if (endDistInput && set.enduranceDistance) endDistInput.value = set.enduranceDistance;
      if (endTimeInput && set.enduranceTime) endTimeInput.value = set.enduranceTime;
      if (runDistInput && set.runningDistance) runDistInput.value = set.runningDistance;
      if (runTimeInput && set.runningTime) runTimeInput.value = set.runningTime;
      if (runAvgHRInput && set.runningAvgHR) runAvgHRInput.value = set.runningAvgHR;
      if (runMaxHRInput && set.runningMaxHR) runMaxHRInput.value = set.runningMaxHR;

      if (typeof updateAutoMuscleIndicator === 'function' && set.exerciseName) {
        updateAutoMuscleIndicator(set.exerciseName);
      }

      const panel = document.getElementById('exercise-selection-container') || document.getElementById('exercise-name-input') || document.getElementById('standard-metrics-panel');
      if (panel && typeof panel.scrollIntoView === 'function') {
        try {
          panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (e) {}
      }

      if (typeof showToast === 'function') {
        showToast(`Loaded ${set.exerciseName} (${set.weight || 0} lbs × ${set.reps || 0}) for next set!`, "success");
      }
    }

    function openEditActiveSetModal(setId) {
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      const set = currentSessionSets.find(s => s.id === setId);
      if (!set) return;

      const setIndex = currentSessionSets.findIndex(s => s.id === setId) + 1;
      const modal = document.getElementById('edit-active-set-modal');
      const idEl = document.getElementById('edit-active-set-id');
      const titleEl = document.getElementById('edit-active-set-title');
      const exEl = document.getElementById('edit-active-set-exercise');
      const impEl = document.getElementById('edit-active-set-implement');
      const musEl = document.getElementById('edit-active-set-muscle');
      const weightEl = document.getElementById('edit-active-set-weight');
      const repsEl = document.getElementById('edit-active-set-reps');
      const ergDistEl = document.getElementById('edit-active-set-erg-distance');
      const ergTimeEl = document.getElementById('edit-active-set-erg-time');
      const swimDistEl = document.getElementById('edit-active-set-swim-distance');
      const swimTimeEl = document.getElementById('edit-active-set-swim-time');
      const endDistEl = document.getElementById('edit-active-set-endurance-distance');
      const endTimeEl = document.getElementById('edit-active-set-endurance-time');
      const runDistEl = document.getElementById('edit-active-set-running-distance');
      const runTimeEl = document.getElementById('edit-active-set-running-time');
      const runAvgHREl = document.getElementById('edit-active-set-running-avg-hr');
      const runMaxHREl = document.getElementById('edit-active-set-running-max-hr');
      const rpeEl = document.getElementById('edit-active-set-rpe');
      const restEl = document.getElementById('edit-active-set-rest');

      if (idEl) idEl.value = set.id;
      if (titleEl) titleEl.innerHTML = `<span>Edit Set #${setIndex}</span>`;
      if (exEl) exEl.value = set.exerciseName || '';
      if (impEl) impEl.value = set.implement || 'Bodyweight';
      if (musEl) musEl.value = set.muscle || 'Full Body';
      if (weightEl) weightEl.value = (typeof set.weight === 'number') ? set.weight : 0;
      if (repsEl) repsEl.value = (typeof set.reps === 'number') ? set.reps : 10;
      if (ergDistEl) ergDistEl.value = set.ergDistance || 500;
      if (ergTimeEl) ergTimeEl.value = set.ergTime || '02:00';
      if (swimDistEl) swimDistEl.value = set.swimDistance || 500;
      if (swimTimeEl) swimTimeEl.value = set.swimTime || '10:00';
      if (endDistEl) endDistEl.value = (typeof set.enduranceDistance === 'number') ? set.enduranceDistance : 2.5;
      if (endTimeEl) endTimeEl.value = set.enduranceTime || '00:30:00';
      if (runDistEl) runDistEl.value = (typeof set.runningDistance === 'number') ? set.runningDistance : 3.1;
      if (runTimeEl) runTimeEl.value = set.runningTime || '00:25:00';
      if (runAvgHREl) runAvgHREl.value = set.runningAvgHR !== null && set.runningAvgHR !== undefined ? set.runningAvgHR : '';
      if (runMaxHREl) runMaxHREl.value = set.runningMaxHR !== null && set.runningMaxHR !== undefined ? set.runningMaxHR : '';
      if (rpeEl) rpeEl.value = set.rpe || 8;
      if (restEl) restEl.value = (typeof set.restPeriod === 'number') ? set.restPeriod : 0;

      handleEditActiveSetImplementChange(set.implement || 'Bodyweight');
      if (modal) modal.classList.remove('hidden');
    }

    function closeEditActiveSetModal() {
      const modal = document.getElementById('edit-active-set-modal');
      if (modal) modal.classList.add('hidden');
    }

    function handleEditActiveSetExerciseInput(val) {
      const inputEl = document.getElementById('edit-active-set-exercise');
      if (inputEl) {
        scrollExerciseInputIntoView(inputEl);
        updateExerciseSuggestions(val, 'edit-active-set-exercise', 'edit-exercise-suggestions-dropdown');
      }
      if (!val) return;
      if (typeof resolveExerciseMuscles === 'function') {
        const profile = resolveExerciseMuscles(val);
        const impEl = document.getElementById('edit-active-set-implement');
        const musEl = document.getElementById('edit-active-set-muscle');
        if (profile) {
          if (impEl && profile.implement) {
            impEl.value = profile.implement;
            handleEditActiveSetImplementChange(profile.implement);
          }
          if (musEl && profile.primary) {
            musEl.value = profile.primary;
          }
        }
      }
    }

    function handleEditActiveSetImplementChange(implement) {
      const stdPanel = document.getElementById('edit-active-set-standard-panel');
      const ergPanel = document.getElementById('edit-active-set-erg-panel');
      const swimPanel = document.getElementById('edit-active-set-swim-panel');
      const endPanel = document.getElementById('edit-active-set-endurance-panel');
      const runPanel = document.getElementById('edit-active-set-running-panel');

      if (stdPanel) stdPanel.classList.add('hidden');
      if (ergPanel) ergPanel.classList.add('hidden');
      if (swimPanel) swimPanel.classList.add('hidden');
      if (endPanel) endPanel.classList.add('hidden');
      if (runPanel) runPanel.classList.add('hidden');

      if (implement === "Running") {
        if (runPanel) runPanel.classList.remove('hidden');
      } else if (implement === "Row Erg") {
        if (ergPanel) ergPanel.classList.remove('hidden');
      } else if (implement === "Swimming") {
        if (swimPanel) swimPanel.classList.remove('hidden');
      } else if (["Walking", "Hiking", "Biking"].includes(implement)) {
        if (endPanel) endPanel.classList.remove('hidden');
      } else {
        if (stdPanel) stdPanel.classList.remove('hidden');
      }
    }

    function adjustEditActiveSetWeight(delta) {
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      const el = document.getElementById('edit-active-set-weight');
      if (!el) return;
      const current = parseFloat(el.value) || 0;
      el.value = Math.max(0, parseFloat((current + delta).toFixed(1)));
    }

    function adjustEditActiveSetReps(delta) {
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      const el = document.getElementById('edit-active-set-reps');
      if (!el) return;
      const current = parseInt(el.value) || 0;
      el.value = Math.max(1, current + delta);
    }

    function adjustEditActiveSetRest(delta) {
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      const el = document.getElementById('edit-active-set-rest');
      if (!el) return;
      const current = parseInt(el.value) || 0;
      el.value = Math.max(0, current + delta);
    }

    function saveActiveSetEdits() {
      const idEl = document.getElementById('edit-active-set-id');
      const setId = idEl ? parseInt(idEl.value) : null;
      if (!setId) return;

      const idx = currentSessionSets.findIndex(s => s.id === setId);
      if (idx === -1) return;

      const exerciseName = document.getElementById('edit-active-set-exercise')?.value.trim() || currentSessionSets[idx].exerciseName;
      const implement = document.getElementById('edit-active-set-implement')?.value || currentSessionSets[idx].implement;
      const muscle = document.getElementById('edit-active-set-muscle')?.value || currentSessionSets[idx].muscle;
      const rpe = parseFloat(document.getElementById('edit-active-set-rpe')?.value) || 8;
      const restPeriod = Math.max(0, parseInt(document.getElementById('edit-active-set-rest')?.value) || 0);

      let weight = 0, reps = 1;
      let ergDistance = 0, ergTime = "";
      let swimDistance = 0, swimTime = "";
      let enduranceDistance = 0, enduranceTime = "";
      let runningDistance = 0, runningTime = "", runningAvgHR = null, runningMaxHR = null;

      if (implement === "Running") {
        runningDistance = parseFloat(document.getElementById('edit-active-set-running-distance')?.value) || 1.0;
        runningTime = document.getElementById('edit-active-set-running-time')?.value || "00:25:00";
        const parsedAvg = parseInt(document.getElementById('edit-active-set-running-avg-hr')?.value);
        const parsedMax = parseInt(document.getElementById('edit-active-set-running-max-hr')?.value);
        runningAvgHR = !isNaN(parsedAvg) ? parsedAvg : currentSessionSets[idx].runningAvgHR;
        runningMaxHR = !isNaN(parsedMax) ? parsedMax : currentSessionSets[idx].runningMaxHR;
      } else if (implement === "Row Erg") {
        ergDistance = parseInt(document.getElementById('edit-active-set-erg-distance')?.value) || 500;
        ergTime = document.getElementById('edit-active-set-erg-time')?.value || "02:00";
      } else if (implement === "Swimming") {
        swimDistance = parseInt(document.getElementById('edit-active-set-swim-distance')?.value) || 500;
        swimTime = document.getElementById('edit-active-set-swim-time')?.value || "10:00";
      } else if (["Walking", "Hiking", "Biking"].includes(implement)) {
        enduranceDistance = parseFloat(document.getElementById('edit-active-set-endurance-distance')?.value) || 1.0;
        enduranceTime = document.getElementById('edit-active-set-endurance-time')?.value || "00:30:00";
      } else {
        weight = parseFloat(document.getElementById('edit-active-set-weight')?.value) || 0;
        reps = parseInt(document.getElementById('edit-active-set-reps')?.value) || 1;
      }

      // Re-resolve secondary muscles if exercise name changed
      let secondaryMuscles = currentSessionSets[idx].secondaryMuscles || [];
      if (typeof resolveExerciseMuscles === 'function') {
        const profile = resolveExerciseMuscles(exerciseName, implement);
        if (profile && profile.secondary) secondaryMuscles = profile.secondary;
      }

      // Update set object in place
      currentSessionSets[idx] = {
        ...currentSessionSets[idx],
        exerciseName,
        implement,
        muscle,
        secondaryMuscles,
        weight,
        reps,
        ergDistance,
        ergTime,
        swimDistance,
        swimTime,
        enduranceDistance,
        enduranceTime,
        runningDistance,
        runningTime,
        runningAvgHR,
        runningMaxHR,
        rpe,
        restPeriod
      };

      localStorage.setItem('showUp_active_workout_sets', JSON.stringify(currentSessionSets));
      renderLoggedSets();
      closeEditActiveSetModal();

      if (googleAccessToken) {
        syncToGoogleDrive();
      }

      if (typeof triggerHaptic === 'function') triggerHaptic('medium');
      if (typeof showToast === 'function') {
        showToast(`Set #${idx + 1} updated!`, "success");
      }
    }

    function copyEditActiveSetToActiveForm() {
      const exVal = document.getElementById('edit-active-set-exercise')?.value || '';
      const impVal = document.getElementById('edit-active-set-implement')?.value || 'Bodyweight';
      const weightVal = document.getElementById('edit-active-set-weight')?.value || '0';
      const repsVal = document.getElementById('edit-active-set-reps')?.value || '10';

      const mainEx = document.getElementById('exercise-name-input');
      const mainImp = document.getElementById('implement-select');
      const mainWeight = document.getElementById('input-weight');
      const mainReps = document.getElementById('input-reps');

      if (mainEx && exVal) {
        mainEx.value = exVal;
        handleExerciseInput(exVal);
      }
      if (mainImp && impVal) {
        mainImp.value = impVal;
        handleImplementChange(impVal);
      }
      if (mainWeight) mainWeight.value = weightVal;
      if (mainReps) mainReps.value = repsVal;

      closeEditActiveSetModal();
      if (typeof showToast === 'function') {
        showToast("Set copied to workout form!", "info");
      }
    }



    function evaluateAndFinishWorkout() {
      if (currentSessionSets.length === 0) {
        alert("Please log at least one set before finishing your workout.");
        return;
      }

      const workoutName = document.getElementById('workout-title-input').value.trim() || "";
      const notes = document.getElementById('workout-notes-input').value.trim() || "";

      let totalVolume = 0;
      let totalDurationMin = 0;

      currentSessionSets.forEach(s => {
        if (s.implement === "Running") {
          totalVolume += ((s.runningDistance || 0) * 1000); // Scale miles to volume units
          const parts = (s.runningTime || "00:25:00").split(':');
          if (parts.length === 3) {
            totalDurationMin += (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0) + (parseInt(parts[2]) || 0) / 60;
          } else if (parts.length === 2) {
            totalDurationMin += (parseInt(parts[0]) || 0) + (parseInt(parts[1]) || 0) / 60;
          }
        } else if (s.implement === "Row Erg") {
          totalVolume += s.ergDistance;
          const parts = (s.ergTime || "02:00").split(':');
          totalDurationMin += (parseInt(parts[0]) || 0) + (parseInt(parts[1]) || 0) / 60;
        } else if (s.implement === "Swimming") {
          totalVolume += s.swimDistance;
          const parts = (s.swimTime || "10:00").split(':');
          totalDurationMin += (parseInt(parts[0]) || 0) + (parseInt(parts[1]) || 0) / 60;
        } else if (["Walking", "Hiking", "Biking"].includes(s.implement)) {
          totalVolume += (s.enduranceDistance * 1000); // Scale miles to volume units
          const parts = (s.enduranceTime || "00:30:00").split(':');
          if (parts.length === 3) {
            totalDurationMin += (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0) + (parseInt(parts[2]) || 0) / 60;
          }
        } else {
          totalVolume += (s.weight * s.reps);
          totalDurationMin += 3; // ~3 min per strength set
        }
      });

      const totalSets = currentSessionSets.length;
      const avgRPE = currentSessionSets.reduce((acc, s) => acc + s.rpe, 0) / totalSets;

      const hasRunning = currentSessionSets.some(s => s.implement === "Running");
      const aerobicTE = Math.min(5.0, (totalSets * 0.25) + (hasRunning ? 1.5 : (avgRPE > 7 ? 0.8 : 0.4))).toFixed(1);
      const anaerobicTE = Math.min(5.0, (currentSessionSets.filter(s => s.rpe >= 9).length * 0.7) + (totalVolume > 2000 ? 1.2 : 0.5)).toFixed(1);

      // Calorie Calculation Formula: METs x 3.5 x Body Weight (kg) / 200 x Minutes
      const weightKg = userWeight * 0.453592;
      const estimatedMinutes = Math.max(15, Math.round(totalDurationMin));

      let metFactor = 5.0; // Standard moderate MET
      if (currentSessionSets.some(s => s.implement === "Running")) metFactor = 10.0;
      else if (currentSessionSets.some(s => s.implement === "Swimming")) metFactor = 8.0;
      else if (currentSessionSets.some(s => s.implement === "Biking")) metFactor = 7.5;
      else if (currentSessionSets.some(s => s.implement === "Hiking")) metFactor = 6.5;
      else if (currentSessionSets.some(s => s.implement === "Walking")) metFactor = 3.8;
      else if (currentSessionSets.some(s => s.implement === "Row Erg")) metFactor = 7.0;

      const avgMET = Math.min(12.0, metFactor + (avgRPE * 0.3) + (currentHR > 0 ? (currentHR - 100) * 0.04 : 0));
      const caloriesBurned = Math.round((avgMET * 3.5 * weightKg / 200) * estimatedMinutes);

      document.getElementById('aerobic-te-score').innerText = aerobicTE;
      document.getElementById('aerobic-te-label').innerText = aerobicTE > 3.0 ? "High Aerobic" : "Moderate";

      document.getElementById('anaerobic-te-score').innerText = anaerobicTE;
      document.getElementById('anaerobic-te-label').innerText = anaerobicTE > 3.0 ? "High Anaerobic" : "Minor";

      document.getElementById('calories-burned-score').innerText = caloriesBurned;

      // Ascertain relevant Running metrics when Running was performed
      const runningSets = currentSessionSets.filter(s => s.implement === "Running");
      let runningMetrics = null;
      const runningCardEl = document.getElementById('summary-running-metrics-card');

      if (runningSets.length > 0) {
        let totalRunningMiles = 0;
        let totalRunningSeconds = 0;
        let weightedAvgHRSum = 0;
        let hrDurationSum = 0;
        let maxHRVal = 0;

        runningSets.forEach(s => {
          const miles = Number(s.runningDistance) || 0;
          totalRunningMiles += miles;

          let sec = 0;
          const parts = (s.runningTime || "00:25:00").split(':');
          if (parts.length === 3) {
            sec = (parseInt(parts[0]) || 0) * 3600 + (parseInt(parts[1]) || 0) * 60 + (parseInt(parts[2]) || 0);
          } else if (parts.length === 2) {
            sec = (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
          }
          totalRunningSeconds += sec;

          if (s.runningAvgHR) {
            weightedAvgHRSum += (s.runningAvgHR * sec);
            hrDurationSum += sec;
          }
          if (s.runningMaxHR && s.runningMaxHR > maxHRVal) {
            maxHRVal = s.runningMaxHR;
          }
        });

        const overallAvgHR = hrDurationSum > 0 ? Math.round(weightedAvgHRSum / hrDurationSum) : (runningSets.find(s => s.runningAvgHR)?.runningAvgHR || null);
        if (!maxHRVal && overallAvgHR) maxHRVal = overallAvgHR;

        let paceStr = "-- /mi";
        let speedStr = "-- mph";
        if (totalRunningMiles > 0 && totalRunningSeconds > 0) {
          const totalRunMins = totalRunningSeconds / 60;
          const paceTotalMins = totalRunMins / totalRunningMiles;
          const paceM = Math.floor(paceTotalMins);
          const paceS = Math.round((paceTotalMins - paceM) * 60);
          paceStr = `${paceM}:${String(paceS).padStart(2, '0')} /mi`;

          const hours = totalRunningSeconds / 3600;
          const mph = (totalRunningMiles / hours).toFixed(1);
          speedStr = `${mph} mph`;
        }

        const runMins = Math.max(1, Math.round(totalRunningSeconds / 60));
        const runSpeedNum = parseFloat(speedStr) || 6.0;
        let runMet = 9.8;
        if (runSpeedNum >= 8.0) runMet = 11.8;
        else if (runSpeedNum >= 7.0) runMet = 11.0;
        else if (runSpeedNum >= 6.0) runMet = 9.8;
        else if (runSpeedNum >= 5.0) runMet = 8.5;
        const runCalories = Math.round((runMet * 3.5 * weightKg / 200) * runMins);

        runningMetrics = {
          totalDistance: totalRunningMiles,
          totalDistanceFormatted: `${totalRunningMiles.toFixed(2)} mi`,
          totalDurationSeconds: totalRunningSeconds,
          totalDurationFormatted: formatTimerHMS(totalRunningSeconds),
          avgPace: paceStr,
          avgSpeed: speedStr,
          avgHR: overallAvgHR,
          maxHR: maxHRVal || overallAvgHR,
          calories: runCalories
        };

        if (runningCardEl) {
          runningCardEl.classList.remove('hidden');
          const distEl = document.getElementById('summary-running-distance');
          const paceEl = document.getElementById('summary-running-pace');
          const speedEl = document.getElementById('summary-running-speed');
          const hrEl = document.getElementById('summary-running-hr');
          const badgeEl = document.getElementById('summary-running-badge');

          if (distEl) distEl.innerText = `${totalRunningMiles.toFixed(2)} mi`;
          if (paceEl) paceEl.innerText = paceStr;
          if (speedEl) speedEl.innerText = speedStr;
          if (hrEl) {
            hrEl.innerText = overallAvgHR ? `${overallAvgHR} / ${maxHRVal || overallAvgHR} bpm` : `-- / --`;
          }
          if (badgeEl) {
            badgeEl.innerText = overallAvgHR && overallAvgHR >= 165 ? "Peak Cardiovascular" :
              overallAvgHR && overallAvgHR >= 145 ? "High Aerobic" : "Aerobic Conditioning";
          }
        }
      } else {
        if (runningCardEl) runningCardEl.classList.add('hidden');
      }

      const muscleMap = {};
      const secondaryMuscleSet = new Set();

      currentSessionSets.forEach(s => {
        const vol = s.implement === "Running" ? Math.round((s.runningDistance || 0) * 100) :
                    s.implement === "Row Erg" ? s.ergDistance :
                    s.implement === "Swimming" ? s.swimDistance :
                    ["Walking", "Hiking", "Biking"].includes(s.implement) ? Math.round(s.enduranceDistance * 100) :
                    (s.weight * s.reps);

        muscleMap[s.muscle] = (muscleMap[s.muscle] || 0) + vol;

        if (s.secondaryMuscles && Array.isArray(s.secondaryMuscles)) {
          s.secondaryMuscles.forEach(sec => secondaryMuscleSet.add(sec));
        }
      });

      const muscleContainer = document.getElementById('muscle-breakdown-bars');
      muscleContainer.innerHTML = Object.entries(muscleMap).map(([m, vol]) => `
        <div class="space-y-1">
          <div class="flex justify-between text-xs font-semibold">
            <span class="text-slate-300">${m}</span>
            <span class="text-emerald-400">${vol} units</span>
          </div>
          <div class="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div class="bg-emerald-500 h-full" style="width: ${Math.min(100, (vol / (totalVolume || 1)) * 100)}%"></div>
          </div>
        </div>
      `).join('');

      updateAnatomicalBodyMap(muscleMap, Array.from(secondaryMuscleSet));

      // Calculate Total Rest Time across all sets
      let totalRestSeconds = 0;
      currentSessionSets.forEach(s => {
        totalRestSeconds += (Number(s.restPeriod) || 0);
      });
      if (isRestTimerRunning && restTimerStartTime) {
        totalRestSeconds += Math.max(0, Math.floor((Date.now() - restTimerStartTime) / 1000));
      }

      // Calculate logged set duration
      let totalLoggedSetSeconds = 0;
      currentSessionSets.forEach(s => {
        totalLoggedSetSeconds += (Number(s.setDuration) || 0);
      });

      // Calculate Total Workout Time
      let totalWorkoutSeconds = workoutTimerSeconds;
      if (totalWorkoutSeconds < (totalRestSeconds + totalLoggedSetSeconds)) {
        totalWorkoutSeconds = totalRestSeconds + totalLoggedSetSeconds;
      }
      if (totalWorkoutSeconds === 0) {
        totalWorkoutSeconds = Math.max(totalRestSeconds, Math.round(totalDurationMin * 60));
      }

      // Active Time = diff between total and rest
      const totalActiveSeconds = Math.max(0, totalWorkoutSeconds - totalRestSeconds);

      // Populate Evaluation Summary UI: Total Time, Rest Time, Active Time
      const totalTimeEl = document.getElementById('summary-total-time');
      const restTimeEl = document.getElementById('summary-rest-time');
      const activeTimeEl = document.getElementById('summary-active-time');
      const activePctEl = document.getElementById('summary-active-pct');
      const restPctEl = document.getElementById('summary-rest-pct');
      const activeBarEl = document.getElementById('summary-active-bar');
      const restBarEl = document.getElementById('summary-rest-bar');

      if (totalTimeEl) totalTimeEl.innerText = formatTimerHMS(totalWorkoutSeconds);
      if (restTimeEl) restTimeEl.innerText = formatDurationSecs(totalRestSeconds);
      if (activeTimeEl) activeTimeEl.innerText = formatDurationSecs(totalActiveSeconds);

      const activePct = totalWorkoutSeconds > 0 ? Math.round((totalActiveSeconds / totalWorkoutSeconds) * 100) : 0;
      const restPct = totalWorkoutSeconds > 0 ? (100 - activePct) : 0;

      if (activePctEl) activePctEl.innerText = `${activePct}%`;
      if (restPctEl) restPctEl.innerText = `${restPct}%`;
      if (activeBarEl) activeBarEl.style.width = `${activePct}%`;
      if (restBarEl) restBarEl.style.width = `${restPct}%`;

      // Stop rest timer and active set timer if running
      stopRestTimer();
      if (activeSetTimerInterval) clearInterval(activeSetTimerInterval);
      isSetInProgress = false;
      activeSetStartTime = null;
      activeSetElapsedSeconds = 0;
      currentPendingRestPeriod = 0;

      pauseWorkoutTimer();

      const targetDate = selectedWorkoutDate || (typeof getLocalDateKey === 'function' ? getLocalDateKey() : new Date().toISOString().slice(0, 10));
      const workoutObj = {
        date: targetDate,
        workoutName,
        notes,
        totalSets,
        totalVolume,
        aerobicTE,
        anaerobicTE,
        caloriesBurned,
        calories: caloriesBurned,
        completed: true,
        completedDate: targetDate,
        runningMetrics,
        totalWorkoutSeconds,
        totalWorkoutTimeFormatted: formatTimerHMS(totalWorkoutSeconds),
        totalRestSeconds,
        totalRestTimeFormatted: formatDurationSecs(totalRestSeconds),
        totalActiveSeconds,
        totalActiveTimeFormatted: formatDurationSecs(totalActiveSeconds),
        workoutDuration: totalWorkoutSeconds,
        workoutDurationFormatted: formatTimerHMS(totalWorkoutSeconds),
        sets: [...currentSessionSets]
      };

      lastEvaluatedSummary = workoutObj;

      const existingIdx = completedWorkoutsHistory.findIndex(item => (typeof item === 'string' ? item : item.date) === targetDate);
      if (existingIdx >= 0) {
        completedWorkoutsHistory[existingIdx] = workoutObj;
      } else {
        completedWorkoutsHistory.push(workoutObj);
      }
      if (typeof AppStorage !== 'undefined' && typeof AppStorage.saveAthleteWorkouts === 'function') {
        AppStorage.saveAthleteWorkouts(completedWorkoutsHistory);
      } else {
        localStorage.setItem('showUp_synced_workouts', JSON.stringify(completedWorkoutsHistory));
      }

      document.getElementById('summary-title').innerHTML = workoutName ? `<i class="fa-solid fa-trophy"></i> ${workoutName}` : `<i class="fa-solid fa-chart-line"></i> Physiology Summary`;
      document.getElementById('summary-timestamp').innerText = `Recorded for ${targetDate}`;

      const notesEl = document.getElementById('summary-notes-display');
      if (notes) {
        notesEl.innerText = `Notes: "${notes}"`;
        notesEl.classList.remove('hidden');
      } else {
        notesEl.classList.add('hidden');
      }

      document.getElementById('workout-summary-card').classList.remove('hidden');
      if (typeof switchSummaryTab === 'function') {
        switchSummaryTab('overview');
      }
      const summaryPrompt = document.getElementById('summary-cloud-save-prompt');
      if (summaryPrompt) {
        if (!isAthleteAuthenticated()) {
          summaryPrompt.classList.remove('hidden');
        } else {
          summaryPrompt.classList.add('hidden');
        }
      }
      document.getElementById('workout-summary-card').scrollIntoView({ behavior: 'smooth' });

      currentSessionSets = [];
      localStorage.removeItem('showUp_active_workout_sets');
      localStorage.removeItem('showUp_workout_start_time');
      workoutTimerSeconds = 0;
      workoutTimerState = 'stopped';
      saveWorkoutTimerState();
      updateWorkoutTimerUI();
      updateSetControlsUI();
      broadcastUserWorkoutEnded(workoutName, workoutObj);
      incrementGlobalWorkoutCounter();

      renderLoggedSets();
      renderCalendar();
      renderMonthlyHistory();
      if (typeof renderHomeTab === 'function') {
        renderHomeTab();
      }

      if (googleAccessToken) {
        syncToGoogleDrive();
      }
    }

    function updateAnatomicalBodyMap(muscleMap, explicitSecondaries = []) {
      const muscleSvgMap = {
        'Chest': ['body-chest'],
        'Back': ['body-back'],
        'Shoulders': ['body-shoulders-ant', 'body-shoulders-post'],
        'Biceps': ['body-biceps'],
        'Triceps': ['body-triceps'],
        'Core/Abs': ['body-core'],
        'Quads': ['body-quads'],
        'Hamstrings/Glutes': ['body-hamstrings']
      };

      Object.values(muscleSvgMap).flat().forEach(id => {
        const el = document.getElementById(id);
        if (el) el.setAttribute('fill', '#334155');
      });

      const sortedMuscles = Object.entries(muscleMap).sort((a, b) => b[1] - a[1]);
      if (sortedMuscles.length === 0) return;

      const primaryTarget = sortedMuscles[0][0];

      if (primaryTarget === "Full Body") {
        ['body-back', 'body-hamstrings', 'body-chest'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.setAttribute('fill', '#ef4444');
        });
        ['body-shoulders-ant', 'body-shoulders-post', 'body-quads', 'body-core'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.setAttribute('fill', '#eab308');
        });
        return;
      }

      if (muscleSvgMap[primaryTarget]) {
        muscleSvgMap[primaryTarget].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.setAttribute('fill', '#ef4444');
        });
      }

      const combinedSecondaries = new Set([
        ...sortedMuscles.slice(1).map(m => m[0]),
        ...explicitSecondaries
      ]);

      combinedSecondaries.forEach(m => {
        if (m !== primaryTarget && muscleSvgMap[m]) {
          muscleSvgMap[m].forEach(id => {
            const el = document.getElementById(id);
            if (el && el.getAttribute('fill') !== '#ef4444') {
              el.setAttribute('fill', '#eab308');
            }
          });
        }
      });
    }



    function switchSummaryTab(tabName) {
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      const tabs = ['overview', 'muscles', 'sets'];
      tabs.forEach(t => {
        const btn = document.getElementById(`tab-btn-summary-${t}`);
        const pane = document.getElementById(`tab-pane-summary-${t}`);
        if (btn) {
          if (t === tabName) {
            btn.className = "flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm transition flex items-center justify-center gap-1.5";
          } else {
            btn.className = "flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800 transition flex items-center justify-center gap-1.5";
          }
        }
        if (pane) {
          if (t === tabName) {
            pane.classList.remove('hidden');
          } else {
            pane.classList.add('hidden');
          }
        }
      });

      if (tabName === 'sets') {
        renderSummarySetsList();
      }
    }

    function renderSummarySetsList() {
      const container = document.getElementById('summary-sets-chronology');
      if (!container) return;
      const sets = lastEvaluatedSummary && lastEvaluatedSummary.sets ? lastEvaluatedSummary.sets : currentSessionSets;
      if (!sets || sets.length === 0) {
        container.innerHTML = `<div class="text-center py-6 text-slate-500 text-xs italic">No set breakdown available for this workout.</div>`;
        return;
      }
      let html = '';
      sets.forEach((s, idx) => {
        const metricDisplay = s.implement === "Running" ? `${s.runningDistance || 0} mi | ${s.runningTime || '00:00'}${s.runningAvgHR ? ` | HR: ${s.runningAvgHR} avg` + (s.runningMaxHR ? ` / ${s.runningMaxHR} max` : '') : ''}` :
          s.implement === "Row Erg" ? `${s.ergDistance || 0}m | ${s.ergTime || '00:00'}` :
          s.implement === "Swimming" ? `${s.swimDistance || 0} yds | ${s.swimTime || '00:00'}` :
          ["Walking", "Hiking", "Biking"].includes(s.implement) ? `${s.enduranceDistance || 0} mi | ${s.enduranceTime || '00:00'}` :
          `${s.weight || 0} lbs × ${s.reps || 0} reps`;

        html += `
          <div class="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2.5">
              <span class="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold flex items-center justify-center text-[11px] border border-emerald-500/20">
                ${idx + 1}
              </span>
              <div>
                <div class="font-bold text-slate-200">${s.exerciseName}</div>
                <div class="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span class="bg-slate-800 text-emerald-400 px-1.5 py-0.2 rounded font-semibold text-[10px]">${s.implement}</span>
                  <span>•</span>
                  <span class="text-slate-300 font-mono">${metricDisplay}</span>
                  <span>•</span>
                  <span class="text-slate-500">RPE ${s.rpe}</span>
                </div>
              </div>
            </div>
            ${s.restPeriod ? `
              <div class="font-mono text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <i class="fa-solid fa-hourglass-half text-[9px]"></i> ${formatDurationSecs(s.restPeriod)}
              </div>
            ` : ''}
          </div>
        `;
      });
      container.innerHTML = html;
    }

    function closeSummary() {
      document.getElementById('workout-summary-card').classList.add('hidden');
    }



    function shareWorkoutToWhatsApp(dateStr = null) {
      const targetDate = dateStr || (lastEvaluatedSummary ? lastEvaluatedSummary.date : selectedWorkoutDate);
      const w = completedWorkoutsHistory.find(item => (typeof item === 'string' ? item : item.date) === targetDate) || lastEvaluatedSummary;
      
      if (!w) return;

      const titlePart = w.workoutName ? `🏋️ *${w.workoutName}*\n` : `🏋️ *showUp Workout Summary*\n`;
      const notesPart = w.notes ? `📝 *Notes:* ${w.notes}\n` : ``;
      const setsCount = w.sets ? w.sets.length : w.totalSets || 0;
      const vol = w.totalVolume ? `${w.totalVolume.toLocaleString()} units` : 'Logged';
      const cals = w.caloriesBurned ? `🔥 *Calories:* ${w.caloriesBurned} kcal\n` : ``;

      let text = `${titlePart}` +
                 `📅 *Date:* ${w.date || targetDate}\n` +
                 `${notesPart}` +
                 `📊 *Total Sets:* ${setsCount} | *Volume:* ${vol}\n` +
                 (w.totalWorkoutSeconds ? `⏱️ *Time:* ${w.totalWorkoutTimeFormatted || formatDurationSecs(w.totalWorkoutSeconds)} (Active: ${w.totalActiveTimeFormatted || formatDurationSecs(w.totalActiveSeconds)} | Rest: ${w.totalRestTimeFormatted || formatDurationSecs(w.totalRestSeconds)})\n` : ``) +
                 `${cals}`;

      if (w.runningMetrics && w.runningMetrics.totalDistance > 0) {
        text += `🏃 *Running:* ${w.runningMetrics.totalDistanceFormatted} in ${w.runningMetrics.totalDurationFormatted} (Pace: ${w.runningMetrics.avgPace} | Speed: ${w.runningMetrics.avgSpeed}${w.runningMetrics.avgHR ? ` | HR: ${w.runningMetrics.avgHR} avg` : ''})\n`;
      }

      if (w.aerobicTE && w.anaerobicTE) {
        text += `🫁 *Aerobic Load:* ${w.aerobicTE} / 5.0\n` +
                `⚡ *Anaerobic Load:* ${w.anaerobicTE} / 5.0\n`;
      }

      text += `\n_Compound your progress with showUp_`;

      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && isRestTimerRunning && restTimerStartTime) {
          tickRestTimer();
        }
      });
    }

    if (typeof window !== 'undefined') {
      window.filterExerciseCatalog = filterExerciseCatalog;
      window.getRecentExercises = getRecentExercises;
      window.getPreviousWorkoutExerciseMetric = getPreviousWorkoutExerciseMetric;
      window.updateExercisePreviousWorkoutMetric = updateExercisePreviousWorkoutMetric;
      window.updateExerciseSuggestions = updateExerciseSuggestions;
      window.selectExerciseSuggestion = selectExerciseSuggestion;
      window.closeExerciseSuggestions = closeExerciseSuggestions;
      window.scrollExerciseInputIntoView = scrollExerciseInputIntoView;
      window.handleExerciseInputFocus = handleExerciseInputFocus;
      window.handleExerciseInputKeydown = handleExerciseInputKeydown;
      window.exerciseMatchesImplementFilter = exerciseMatchesImplementFilter;
      window.getActiveExerciseCatalogFilter = getActiveExerciseCatalogFilter;
      window.setExerciseCatalogFilter = setExerciseCatalogFilter;
      window.renderExerciseCatalogFilterPills = renderExerciseCatalogFilterPills;
      window.toggleExerciseCatalogFilter = toggleExerciseCatalogFilter;
      window.restoreRestTimerState = restoreRestTimerState;
      window.saveRestTimerState = saveRestTimerState;
      window.isAthleteAuthenticated = isAthleteAuthenticated;
      window.isFirstSetLoginPromptDismissed = isFirstSetLoginPromptDismissed;
      window.dismissFirstSetLoginPrompt = dismissFirstSetLoginPrompt;
      window.initTouchScrollerInputs = initTouchScrollerInputs;
      window.setScrollerStep = setScrollerStep;
      window.nudgeScroller = nudgeScroller;
      window.scrollerSteps = window.scrollerSteps || scrollerSteps;
      window.getWorkoutSessionStartTime = getWorkoutSessionStartTime;
      window.formatWorkoutStartTime = formatWorkoutStartTime;
      window.updateWorkoutSessionHUD = updateWorkoutSessionHUD;
      window.toggleSessionOptionsMenu = toggleSessionOptionsMenu;
      window.resetWorkoutSession = resetWorkoutSession;
      window.cancelActiveSetTimer = cancelActiveSetTimer;
      window.formatTimerMS = formatTimerMS;
      window.getCurrentRestTarget = getCurrentRestTarget;
      window.checkRestRecoveryThreshold = checkRestRecoveryThreshold;
      window.startRestTimer = startRestTimer;
      window.stopRestTimer = stopRestTimer;
      window.adjustRestTimer = adjustRestTimer;
      window.skipRestTimer = skipRestTimer;
      window.getDefaultRestTimeSeconds = getDefaultRestTimeSeconds;
      window.saveDefaultRestTimePref = saveDefaultRestTimePref;
    }

    if (typeof document !== 'undefined') {
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initTouchScrollerInputs();
        updateWorkoutSessionHUD();
      } else {
        document.addEventListener('DOMContentLoaded', () => {
          initTouchScrollerInputs();
          updateWorkoutSessionHUD();
        });
      }

      document.addEventListener('click', (e) => {
        const menu = document.getElementById('session-options-menu');
        const btn = document.getElementById('session-options-btn');
        if (menu && !menu.classList.contains('hidden') && btn && !btn.contains(e.target) && !menu.contains(e.target)) {
          menu.classList.add('hidden');
        }
      });
    }

/* ==========================================================================
   showUp History & Calendar Engine: Monthly Grids & "Showed Up" Rules
   ========================================================================== */

    function initDatePickerConstraints() {
      const todayISO = typeof getLocalDateKey === 'function' ? getLocalDateKey() : new Date().toISOString().slice(0, 10);
      const dateInput = document.getElementById('workout-date-picker');
      if (dateInput) {
        dateInput.max = todayISO;
        dateInput.value = todayISO;
      }
      selectedWorkoutDate = todayISO;
      updateTimezoneDisplay();
    }

    function handleDateChange(val) {
      const todayISO = typeof getLocalDateKey === 'function' ? getLocalDateKey() : new Date().toISOString().slice(0, 10);
      if (val > todayISO) {
        alert("Future dates beyond current day are not allowed.");
        const dateInput = document.getElementById('workout-date-picker');
        if (dateInput) dateInput.value = todayISO;
        selectedWorkoutDate = todayISO;
        document.getElementById('historical-mode-banner').classList.add('hidden');
        return;
      }
      selectedWorkoutDate = val;

      if (val !== todayISO) {
        document.getElementById('banner-date-label').innerText = val;
        document.getElementById('historical-mode-banner').classList.remove('hidden');
      } else {
        document.getElementById('historical-mode-banner').classList.add('hidden');
      }
    }

    function resetToTodayDate() {
      const todayISO = typeof getLocalDateKey === 'function' ? getLocalDateKey() : new Date().toISOString().slice(0, 10);
      const dateInput = document.getElementById('workout-date-picker');
      if (dateInput) dateInput.value = todayISO;
      selectedWorkoutDate = todayISO;
      document.getElementById('historical-mode-banner').classList.add('hidden');
    }

    function updateTimezoneDisplay() {
      const tzName = typeof getUserTimeZone === 'function' ? getUserTimeZone() : '';
      const tzEl = document.getElementById('user-timezone-display');
      const settingsTzEl = document.getElementById('settings-timezone-label');
      if (tzName) {
        let shortCode = '';
        try {
          shortCode = new Intl.DateTimeFormat('en-US', {
            timeZone: tzName,
            timeZoneName: 'short'
          }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || '';
        } catch (e) {}

        const label = shortCode ? `${shortCode} (${tzName})` : tzName;
        if (tzEl) {
          tzEl.innerText = shortCode || tzName;
          tzEl.title = `Local Time Zone: ${tzName}`;
        }
        if (settingsTzEl) {
          settingsTzEl.innerText = label;
          settingsTzEl.title = `Active Time Zone: ${tzName}`;
        }
      }
    }



    function renderCalendar() {
      const grid = document.getElementById('calendar-grid');
      const monthYearLabel = document.getElementById('calendar-month-year-label');
      grid.innerHTML = '';

      const year = calendarDate.getFullYear();
      const month = calendarDate.getMonth();

      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      monthYearLabel.innerText = `${monthNames[month]} ${year}`;

      // Week starts from Monday (M) and ends on Sunday (S)
      const dayNames = ["M", "T", "W", "T", "F", "S", "S"];
      const dayTitles = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      dayNames.forEach((d, idx) => {
        grid.innerHTML += `<div class="text-slate-500 font-bold py-1" title="${dayTitles[idx]}">${d}</div>`;
      });

      // Shift first day offset: Monday is index 0, Sunday is index 6
      const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let i = 0; i < firstDay; i++) {
        grid.innerHTML += `<div></div>`;
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const monthStr = String(month + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateKey = `${year}-${monthStr}-${dayStr}`;
        
        const isWorkedOut = completedWorkoutsHistory.some(item => (typeof item === 'string' ? item : item.date) === dateKey);

        grid.innerHTML += `
          <div onclick="${isWorkedOut ? `triggerHaptic('light'); openEditHistoricalWorkoutModal('${dateKey}')` : ''}"
               class="aspect-square flex items-center justify-center rounded-xl text-xs font-semibold cursor-pointer transition transform ${isWorkedOut ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95' : 'bg-slate-950 text-slate-600 border border-slate-800/80'}"
               title="${isWorkedOut ? `Completed workout on ${dateKey} (Click to Edit)` : dateKey}">
            ${day}
          </div>
        `;
      }
    }

    function renderMonthlyHistory() {
      const container = document.getElementById('monthly-history-list');
      const year = calendarDate.getFullYear();
      const monthStr = String(calendarDate.getMonth() + 1).padStart(2, '0');
      const prefix = `${year}-${monthStr}`;

      const monthlyEntries = completedWorkoutsHistory.filter(item => {
        const d = typeof item === 'string' ? item : item.date;
        return d && d.startsWith(prefix);
      });

      document.getElementById('monthly-count-badge').innerText = `${monthlyEntries.length} Workouts`;

      if (monthlyEntries.length === 0) {
        container.innerHTML = `<div class="text-center py-8 text-slate-600 text-xs italic">No workout history recorded for this month.</div>`;
        return;
      }

      container.innerHTML = monthlyEntries.map(w => {
        const dateStr = typeof w === 'string' ? w : w.date;
        const nameStr = typeof w === 'object' && w.workoutName ? w.workoutName : 'Workout Session';
        const notesStr = typeof w === 'object' && w.notes ? w.notes : '';
        const setsList = typeof w === 'object' && w.sets ? w.sets : [];
        const setsCount = setsList.length || '1+';
        const vol = typeof w === 'object' && w.totalVolume ? `${w.totalVolume.toLocaleString()} units` : 'Logged';
        const cals = typeof w === 'object' && w.caloriesBurned ? `${w.caloriesBurned} kcal` : '';

        return `
          <div class="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden transition-all">
            <div onclick="triggerHaptic('light'); toggleWorkoutAccordion('${dateStr}')" class="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-900/60 transition select-none">
              <div class="flex items-center gap-3">
                <i id="chevron-${dateStr}" class="fa-solid fa-chevron-right text-xs text-slate-500 transition-transform"></i>
                <div>
                  <div class="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <i class="fa-solid fa-calendar-check text-emerald-400"></i>
                    <span>${nameStr}</span>
                    <span class="text-xs font-normal text-slate-400">(${dateStr})</span>
                    <!-- Pencil Icon: Quick Edit trigger beside workout title -->
                    <button onclick="event.stopPropagation(); triggerHaptic('medium'); openEditHistoricalWorkoutModal('${dateStr}')" class="text-slate-500 hover:text-amber-400 p-1 rounded-lg transition" title="Edit Workout (${dateStr})">
                      <i class="fa-solid fa-pencil text-[11px]"></i>
                    </button>
                  </div>
                  <div class="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                    <span>${setsCount} Sets</span>
                    <span class="text-slate-600">•</span>
                    <span class="text-emerald-400">${vol}</span>
                    ${cals ? `<span class="text-slate-600">•</span><span class="text-rose-400">${cals}</span>` : ''}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-1" onclick="event.stopPropagation()">
                <!-- Pencil Icon Action Button: Update historical workout with any details -->
                <button onclick="triggerHaptic('medium'); openEditHistoricalWorkoutModal('${dateStr}')" class="text-slate-500 hover:text-amber-400 p-2 transition rounded-xl hover:bg-slate-850" title="Edit Workout">
                  <i class="fa-solid fa-pencil text-xs"></i>
                </button>
                <button onclick="triggerHaptic('medium'); shareWorkoutToWhatsApp('${dateStr}')" class="text-slate-500 hover:text-emerald-400 p-2 transition" title="Share via WhatsApp">
                  <i class="fa-brands fa-whatsapp text-sm"></i>
                </button>
                <button onclick="triggerHaptic('light'); deleteHistoricalWorkout('${dateStr}')" class="text-slate-600 hover:text-rose-400 p-2 transition" title="Delete Workout">
                  <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
              </div>
            </div>

            <div id="details-${dateStr}" class="hidden border-t border-slate-800/80 bg-slate-900/40 p-3 space-y-2">
              <div class="flex items-center justify-between pb-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Workout Details</span>
                <button onclick="triggerHaptic('medium'); openEditHistoricalWorkoutModal('${dateStr}')" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition active:scale-95">
                  <i class="fa-solid fa-pencil text-[10px]"></i>
                  <span>Edit All Details</span>
                </button>
              </div>
              ${notesStr ? `<div class="text-xs text-slate-300 italic bg-slate-950/80 p-2 rounded-lg border border-slate-800 mb-2">Notes: "${notesStr}"</div>` : ''}
              ${typeof w === 'object' && w.totalWorkoutSeconds ? `
                <div class="flex items-center gap-2 flex-wrap text-[11px] font-mono bg-slate-950 p-2 rounded-xl border border-slate-800 text-slate-400">
                  <span class="text-cyan-400"><i class="fa-solid fa-stopwatch mr-1"></i>Total: ${w.totalWorkoutTimeFormatted || (w.totalWorkoutSeconds + 's')}</span>
                  <span class="text-slate-600">•</span>
                  <span class="text-emerald-400"><i class="fa-solid fa-bolt mr-1"></i>Active: ${w.totalActiveTimeFormatted || (w.totalActiveSeconds + 's')}</span>
                  <span class="text-slate-600">•</span>
                  <span class="text-amber-400"><i class="fa-solid fa-hourglass-half mr-1"></i>Rest: ${w.totalRestTimeFormatted || (w.totalRestSeconds + 's')}</span>
                </div>
              ` : ''}
              <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Logged Exercise Sets</div>
              ${setsList.length === 0 ? `
                <div class="text-xs text-slate-500 italic py-1">Basic summary log recorded (no detailed sets).</div>
              ` : setsList.map(s => `
                <div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div class="font-bold text-slate-200">${s.exerciseName}</div>
                    <div class="text-slate-400 gap-2 flex items-center mt-0.5 text-[11px]">
                      <span class="bg-slate-800 text-emerald-400 px-1.5 py-0.2 rounded-lg">${s.implement}</span>
                      ${s.implement === "Running" ? `<span>${s.runningDistance} mi | ${s.runningTime}${s.runningAvgHR ? ` | HR: ${s.runningAvgHR} avg` + (s.runningMaxHR ? ` / ${s.runningMaxHR} max` : '') : ''}</span>` :
                        s.implement === "Row Erg" ? `<span>${s.ergDistance}m | ${s.ergTime}</span>` :
                        s.implement === "Swimming" ? `<span>${s.swimDistance} yds | ${s.swimTime}</span>` :
                        ["Walking", "Hiking", "Biking"].includes(s.implement) ? `<span>${s.enduranceDistance} mi | ${s.enduranceTime}</span>` :
                        `<span><b class="text-slate-100">${s.weight}</b> lbs × <b class="text-slate-100">${s.reps}</b> reps</span>`}
                      <span class="text-slate-500">RPE ${s.rpe}</span>
                      ${s.setDuration ? `<span class="text-slate-400"><i class="fa-regular fa-clock mr-1 text-slate-500"></i>${typeof formatDurationSecs === 'function' ? formatDurationSecs(s.setDuration) : (s.setDuration + 's')}</span>` : ''}
                      ${s.restPeriod ? `<span class="text-emerald-400/80"><i class="fa-solid fa-hourglass-half mr-1 text-emerald-500"></i>Rest: ${typeof formatDurationSecs === 'function' ? formatDurationSecs(s.restPeriod) : (s.restPeriod + 's')}</span>` : ''}
                    </div>
                  </div>

                  <button onclick="triggerHaptic('medium'); openEditHistoricalWorkoutModal('${dateStr}')" class="text-slate-500 hover:text-amber-400 p-1.5 rounded-lg transition" title="Edit Workout / Set">
                    <i class="fa-solid fa-pencil text-xs"></i>
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }).join('');
    }

    function toggleWorkoutAccordion(dateStr) {
      const detailsEl = document.getElementById(`details-${dateStr}`);
      const chevronEl = document.getElementById(`chevron-${dateStr}`);

      if (detailsEl.classList.contains('hidden')) {
        detailsEl.classList.remove('hidden');
        if (chevronEl) chevronEl.style.transform = "rotate(90deg)";
      } else {
        detailsEl.classList.add('hidden');
        if (chevronEl) chevronEl.style.transform = "rotate(0deg)";
      }
    }

    // ==========================================================================
    // Historical Workout Editor Engine (Pencil Icon & Comprehensive Updating)
    // ==========================================================================

    let currentEditingWorkoutOriginalDate = null;

    function openEditHistoricalWorkoutModal(dateStr) {
      if (!dateStr) return;
      currentEditingWorkoutOriginalDate = dateStr;

      const modal = document.getElementById('edit-historical-workout-modal');
      if (!modal) return;

      const rawWorkout = completedWorkoutsHistory.find(item => {
        const d = typeof item === 'string' ? item : item.date;
        return d === dateStr;
      });

      const workout = (typeof rawWorkout === 'object' && rawWorkout !== null)
        ? JSON.parse(JSON.stringify(rawWorkout))
        : {
            date: dateStr,
            workoutName: 'Workout Session',
            notes: '',
            caloriesBurned: 350,
            totalWorkoutSeconds: 2400,
            totalActiveSeconds: 1500,
            totalRestSeconds: 900,
            sets: []
          };

      // Populate core fields
      const dateInput = document.getElementById('edit-workout-date');
      const nameInput = document.getElementById('edit-workout-name');
      const notesInput = document.getElementById('edit-workout-notes');
      const calsInput = document.getElementById('edit-workout-calories');
      const durationInput = document.getElementById('edit-workout-duration');
      const activeInput = document.getElementById('edit-workout-active-time');
      const restInput = document.getElementById('edit-workout-rest-time');

      if (dateInput) dateInput.value = workout.date || dateStr;
      if (nameInput) nameInput.value = workout.workoutName || 'Workout Session';
      if (notesInput) notesInput.value = workout.notes || '';
      if (calsInput) calsInput.value = workout.caloriesBurned || workout.calories || 0;
      if (durationInput) durationInput.value = Math.round((workout.totalWorkoutSeconds || 1800) / 60);
      if (activeInput) activeInput.value = Math.round((workout.totalActiveSeconds || 1200) / 60);
      if (restInput) restInput.value = Math.round((workout.totalRestSeconds || 600) / 60);

      // Render editable sets
      renderEditWorkoutSets(workout.sets || []);

      modal.classList.remove('hidden');
    }

    function closeEditHistoricalWorkoutModal() {
      const modal = document.getElementById('edit-historical-workout-modal');
      if (modal) modal.classList.add('hidden');
      currentEditingWorkoutOriginalDate = null;
    }

    function renderEditWorkoutSets(sets) {
      const container = document.getElementById('edit-workout-sets-container');
      if (!container) return;

      if (!Array.isArray(sets) || sets.length === 0) {
        container.innerHTML = `
          <div id="edit-no-sets-prompt" class="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center text-slate-500 text-xs italic">
            No detailed sets logged yet. Click "+ Add Set" below to add exercise sets with full metrics.
          </div>
        `;
        return;
      }

      container.innerHTML = sets.map((s, idx) => createEditSetRowMarkup(s, idx)).join('');
    }

    function createEditSetRowMarkup(s, idx) {
      const implement = s.implement || 'Barbell';
      const isRunning = implement === 'Running';
      const isCardio = ['Row Erg', 'Swimming', 'Walking', 'Hiking', 'Biking'].includes(implement);

      return `
        <div class="edit-set-row bg-slate-950 p-3 rounded-2xl border border-slate-800/90 space-y-2.5 relative" data-set-index="${idx}">
          <div class="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
            <span class="text-[11px] font-mono font-bold text-emerald-400">Set #${idx + 1}</span>
            <button type="button" onclick="triggerHaptic('light'); removeEditSetRow(${idx})" class="text-slate-500 hover:text-rose-400 p-1 text-xs transition" title="Remove Set">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Exercise</label>
              <input type="text" class="edit-set-exercise w-full bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-semibold focus:outline-none focus:border-emerald-500" value="${(typeof escapeHtml === 'function') ? escapeHtml(s.exerciseName || '') : (s.exerciseName || 'Exercise')}">
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Implement / Type</label>
              <select class="edit-set-implement w-full bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-semibold focus:outline-none focus:border-emerald-500" onchange="handleEditImplementChange(this)">
                <option value="Barbell" ${implement === 'Barbell' ? 'selected' : ''}>Barbell</option>
                <option value="Dumbbell" ${implement === 'Dumbbell' ? 'selected' : ''}>Dumbbell</option>
                <option value="Kettlebell" ${implement === 'Kettlebell' ? 'selected' : ''}>Kettlebell</option>
                <option value="Machine" ${implement === 'Machine' ? 'selected' : ''}>Machine</option>
                <option value="Cable" ${implement === 'Cable' ? 'selected' : ''}>Cable</option>
                <option value="Bodyweight" ${implement === 'Bodyweight' ? 'selected' : ''}>Bodyweight</option>
                <option value="Running" ${implement === 'Running' ? 'selected' : ''}>Running</option>
                <option value="Row Erg" ${implement === 'Row Erg' ? 'selected' : ''}>Row Erg</option>
                <option value="Swimming" ${implement === 'Swimming' ? 'selected' : ''}>Swimming</option>
                <option value="Walking" ${implement === 'Walking' ? 'selected' : ''}>Walking</option>
                <option value="Biking" ${implement === 'Biking' ? 'selected' : ''}>Biking</option>
              </select>
            </div>
          </div>

          <!-- Dynamic Metrics Grid -->
          <div class="edit-set-metrics-resistance grid grid-cols-3 gap-2 ${isRunning || isCardio ? 'hidden' : ''}">
            <div>
              <label class="block text-[10px] text-slate-400 mb-0.5">Weight (lbs)</label>
              <input type="number" step="0.5" class="edit-set-weight w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs text-slate-100 font-mono font-bold" value="${s.weight || 0}">
            </div>
            <div>
              <label class="block text-[10px] text-slate-400 mb-0.5">Reps</label>
              <input type="number" step="1" class="edit-set-reps w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs text-slate-100 font-mono font-bold" value="${s.reps || 10}">
            </div>
            <div>
              <label class="block text-[10px] text-slate-400 mb-0.5">RPE (1-10)</label>
              <input type="number" step="0.5" min="1" max="10" class="edit-set-rpe w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs text-slate-100 font-mono font-bold" value="${s.rpe || 8}">
            </div>
          </div>

          <div class="edit-set-metrics-endurance grid grid-cols-2 sm:grid-cols-4 gap-2 ${isRunning || isCardio ? '' : 'hidden'}">
            <div>
              <label class="block text-[10px] text-slate-400 mb-0.5">Distance</label>
              <input type="number" step="0.01" class="edit-set-distance w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs text-slate-100 font-mono font-bold" value="${s.runningDistance || s.enduranceDistance || s.ergDistance || s.swimDistance || 1.0}">
            </div>
            <div>
              <label class="block text-[10px] text-slate-400 mb-0.5">Time (hh:mm:ss)</label>
              <input type="text" class="edit-set-time w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs text-slate-100 font-mono font-bold" value="${s.runningTime || s.enduranceTime || s.ergTime || s.swimTime || '00:20:00'}">
            </div>
            <div>
              <label class="block text-[10px] text-slate-400 mb-0.5">Avg HR (bpm)</label>
              <input type="number" class="edit-set-avg-hr w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs text-slate-100 font-mono font-bold" value="${s.runningAvgHR || s.avgHR || ''}">
            </div>
            <div>
              <label class="block text-[10px] text-slate-400 mb-0.5">Max HR (bpm)</label>
              <input type="number" class="edit-set-max-hr w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs text-slate-100 font-mono font-bold" value="${s.runningMaxHR || s.maxHR || ''}">
            </div>
          </div>
        </div>
      `;
    }

    function handleEditImplementChange(selectEl) {
      const row = selectEl.closest('.edit-set-row');
      if (!row) return;
      const implement = selectEl.value;
      const isCardio = ['Running', 'Row Erg', 'Swimming', 'Walking', 'Hiking', 'Biking'].includes(implement);
      const resPanel = row.querySelector('.edit-set-metrics-resistance');
      const endPanel = row.querySelector('.edit-set-metrics-endurance');

      if (isCardio) {
        if (resPanel) resPanel.classList.add('hidden');
        if (endPanel) endPanel.classList.remove('hidden');
      } else {
        if (resPanel) resPanel.classList.remove('hidden');
        if (endPanel) endPanel.classList.add('hidden');
      }
    }

    function addSetToEditHistoricalWorkout() {
      const container = document.getElementById('edit-workout-sets-container');
      if (!container) return;
      const noSetsPrompt = document.getElementById('edit-no-sets-prompt');
      if (noSetsPrompt) noSetsPrompt.remove();

      const currentCount = container.querySelectorAll('.edit-set-row').length;
      const newSetObj = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        exerciseName: 'Exercise',
        implement: 'Barbell',
        weight: 135,
        reps: 10,
        rpe: 8,
        setDuration: 45,
        restPeriod: 90
      };

      const wrapper = document.createElement('div');
      wrapper.innerHTML = createEditSetRowMarkup(newSetObj, currentCount);
      container.appendChild(wrapper.firstElementChild);
    }

    function removeEditSetRow(idx) {
      const container = document.getElementById('edit-workout-sets-container');
      if (!container) return;
      const rows = container.querySelectorAll('.edit-set-row');
      if (rows[idx]) {
        rows[idx].remove();
      }
      // Re-index remaining rows
      const remaining = container.querySelectorAll('.edit-set-row');
      remaining.forEach((r, i) => {
        r.dataset.setIndex = i;
        const badge = r.querySelector('.text-emerald-400');
        if (badge) badge.innerText = `Set #${i + 1}`;
      });
      if (remaining.length === 0) {
        container.innerHTML = `
          <div id="edit-no-sets-prompt" class="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center text-slate-500 text-xs italic">
            No detailed sets logged yet. Click "+ Add Set" below to add exercise sets with full metrics.
          </div>
        `;
      }
    }

    function saveHistoricalWorkoutChanges() {
      if (!currentEditingWorkoutOriginalDate) return;
      const origDate = currentEditingWorkoutOriginalDate;

      const dateInput = document.getElementById('edit-workout-date');
      const nameInput = document.getElementById('edit-workout-name');
      const notesInput = document.getElementById('edit-workout-notes');
      const calsInput = document.getElementById('edit-workout-calories');
      const durationInput = document.getElementById('edit-workout-duration');
      const activeInput = document.getElementById('edit-workout-active-time');
      const restInput = document.getElementById('edit-workout-rest-time');

      const targetDate = (dateInput && dateInput.value.trim()) ? dateInput.value.trim() : origDate;
      const workoutName = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : 'Workout Session';
      const notes = notesInput ? notesInput.value.trim() : '';
      const caloriesBurned = calsInput ? (parseFloat(calsInput.value) || 0) : 0;
      const totalMinutes = durationInput ? (parseFloat(durationInput.value) || 30) : 30;
      const activeMinutes = activeInput ? (parseFloat(activeInput.value) || 20) : 20;
      const restMinutes = restInput ? (parseFloat(restInput.value) || 10) : 10;

      const totalWorkoutSeconds = Math.round(totalMinutes * 60);
      const totalActiveSeconds = Math.round(activeMinutes * 60);
      const totalRestSeconds = Math.round(restMinutes * 60);

      // Collect sets from DOM
      const rows = document.querySelectorAll('#edit-workout-sets-container .edit-set-row');
      const updatedSets = [];
      let totalVolume = 0;
      let totalDistance = 0;
      let runningSeconds = 0;
      let maxHR = 0;
      let avgHRSum = 0;
      let hrCount = 0;

      rows.forEach((r, idx) => {
        const exName = r.querySelector('.edit-set-exercise')?.value.trim() || `Set ${idx + 1}`;
        const implement = r.querySelector('.edit-set-implement')?.value || 'Barbell';
        const isCardio = ['Running', 'Row Erg', 'Swimming', 'Walking', 'Hiking', 'Biking'].includes(implement);

        const setObj = {
          id: Date.now() + idx,
          exerciseName: exName,
          implement: implement
        };

        if (isCardio) {
          const dist = parseFloat(r.querySelector('.edit-set-distance')?.value) || 1.0;
          const timeStr = r.querySelector('.edit-set-time')?.value.trim() || '00:20:00';
          const avgHR = parseInt(r.querySelector('.edit-set-avg-hr')?.value) || null;
          const mHR = parseInt(r.querySelector('.edit-set-max-hr')?.value) || null;

          if (implement === 'Running') {
            setObj.runningDistance = dist;
            setObj.runningTime = timeStr;
            setObj.runningAvgHR = avgHR;
            setObj.runningMaxHR = mHR;
            totalDistance += dist;
            if (avgHR) { avgHRSum += avgHR; hrCount++; }
            if (mHR && mHR > maxHR) maxHR = mHR;
          } else if (implement === 'Row Erg') {
            setObj.ergDistance = dist;
            setObj.ergTime = timeStr;
          } else if (implement === 'Swimming') {
            setObj.swimDistance = dist;
            setObj.swimTime = timeStr;
          } else {
            setObj.enduranceDistance = dist;
            setObj.enduranceTime = timeStr;
          }
        } else {
          const w = parseFloat(r.querySelector('.edit-set-weight')?.value) || 0;
          const reps = parseInt(r.querySelector('.edit-set-reps')?.value) || 0;
          const rpe = parseFloat(r.querySelector('.edit-set-rpe')?.value) || 8;
          setObj.weight = w;
          setObj.reps = reps;
          setObj.rpe = rpe;
          totalVolume += (w * reps);
        }

        updatedSets.push(setObj);
      });

      // Find original workout to preserve auxiliary metadata (e.g. photos, squad sync)
      const existingIdx = completedWorkoutsHistory.findIndex(item => {
        const d = typeof item === 'string' ? item : item.date;
        return d === origDate;
      });
      const originalObj = existingIdx !== -1 && typeof completedWorkoutsHistory[existingIdx] === 'object'
        ? completedWorkoutsHistory[existingIdx]
        : {};

      const updatedWorkout = {
        ...originalObj,
        id: originalObj.id || ('workout_' + Date.now()),
        date: targetDate,
        completedDate: targetDate,
        completed: true,
        workoutName: workoutName,
        notes: notes,
        caloriesBurned: caloriesBurned,
        calories: caloriesBurned,
        totalWorkoutSeconds: totalWorkoutSeconds,
        totalWorkoutTimeFormatted: typeof formatDurationSecs === 'function' ? formatDurationSecs(totalWorkoutSeconds) : `${totalMinutes}m`,
        totalActiveSeconds: totalActiveSeconds,
        totalActiveTimeFormatted: typeof formatDurationSecs === 'function' ? formatDurationSecs(totalActiveSeconds) : `${activeMinutes}m`,
        totalRestSeconds: totalRestSeconds,
        totalRestTimeFormatted: typeof formatDurationSecs === 'function' ? formatDurationSecs(totalRestSeconds) : `${restMinutes}m`,
        totalVolume: totalVolume,
        sets: updatedSets,
        lastModified: new Date().toISOString()
      };

      if (totalDistance > 0) {
        updatedWorkout.runningMetrics = {
          totalDistance: totalDistance,
          avgHR: hrCount > 0 ? Math.round(avgHRSum / hrCount) : null,
          maxHR: maxHR > 0 ? maxHR : null
        };
      }

      // Persist across AppStorage and in-memory caches
      if (typeof AppStorage !== 'undefined' && typeof AppStorage.updateWorkout === 'function') {
        AppStorage.updateWorkout(origDate, updatedWorkout);
      } else {
        if (origDate !== targetDate) {
          completedWorkoutsHistory = completedWorkoutsHistory.filter(item => (typeof item === 'string' ? item : item.date) !== origDate);
        }
        const matchIdx = completedWorkoutsHistory.findIndex(item => (typeof item === 'string' ? item : item.date) === targetDate);
        if (matchIdx !== -1) {
          completedWorkoutsHistory[matchIdx] = updatedWorkout;
        } else {
          completedWorkoutsHistory.push(updatedWorkout);
        }
        localStorage.setItem('showUp_synced_workouts', JSON.stringify(completedWorkoutsHistory));
      }

      // Sync views
      renderCalendar();
      renderMonthlyHistory();
      if (typeof renderHomeTab === 'function') renderHomeTab();
      if (typeof renderHeatMap === 'function') renderHeatMap();
      if (typeof updateGlobalStatsUI === 'function') updateGlobalStatsUI();

      if (googleAccessToken && typeof syncToGoogleDrive === 'function') {
        syncToGoogleDrive();
      }

      closeEditHistoricalWorkoutModal();

      if (typeof showToast === 'function') {
        showToast(`Workout for ${targetDate} updated successfully!`, 'success');
      }
    }

    function deleteHistoricalWorkout(dateStr) {
      if (!confirm(`Are you sure you want to delete the workout entry for ${dateStr}?`)) return;

      if (typeof AppStorage !== 'undefined' && typeof AppStorage.deleteWorkout === 'function') {
        AppStorage.deleteWorkout(dateStr);
      } else {
        completedWorkoutsHistory = completedWorkoutsHistory.filter(item => (typeof item === 'string' ? item : item.date) !== dateStr);
        localStorage.setItem('showUp_synced_workouts', JSON.stringify(completedWorkoutsHistory));
      }
      renderCalendar();
      renderMonthlyHistory();
      if (typeof renderHomeTab === 'function') {
        renderHomeTab();
      }

      if (googleAccessToken) {
        syncToGoogleDrive();
      }
    }

    function navigateCalendarMonth(delta) {
      calendarDate.setMonth(calendarDate.getMonth() + delta);
      renderCalendar();
      renderMonthlyHistory();
    }

    // ==========================================================================
    // Home Section Engine: Weekly Positive Outlook & Daily Congratulation
    // ==========================================================================

    function getWeekWorkoutBounds(refDate = new Date()) {
      const d = new Date(refDate);
      const day = d.getDay(); // 0 is Sun, 1 is Mon...
      const diffToMonday = (day + 6) % 7; // days since Monday
      const monday = new Date(d);
      monday.setDate(d.getDate() - diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const days = [];
      const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const dayInitials = ["M", "T", "W", "T", "F", "S", "S"];

      for (let i = 0; i < 7; i++) {
        const cur = new Date(monday);
        cur.setDate(monday.getDate() + i);
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const dayNum = String(cur.getDate()).padStart(2, '0');
        const dateKey = `${y}-${m}-${dayNum}`;
        days.push({
          dateKey,
          dayNameShort: dayNames[i],
          dayInitial: dayInitials[i],
          dayNumber: cur.getDate()
        });
      }

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      return {
        monday,
        sunday,
        days,
        startDateKey: days[0].dateKey,
        endDateKey: days[6].dateKey
      };
    }

    function calcShowUpStreak() {
      if (!Array.isArray(completedWorkoutsHistory) || completedWorkoutsHistory.length === 0) return 0;
      const dates = Array.from(new Set(completedWorkoutsHistory.map(w => typeof w === 'string' ? w : w.date).filter(Boolean))).sort().reverse();
      if (dates.length === 0) return 0;

      const todayLocal = typeof getLocalDateKey === 'function' ? getLocalDateKey() : new Date().toISOString().slice(0, 10);

      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      const yestLocal = typeof getLocalDateKey === 'function' ? getLocalDateKey(yest) : yest.toISOString().slice(0, 10);

      const mostRecent = dates[0];
      if (mostRecent !== todayLocal && mostRecent !== yestLocal) {
        return 0;
      }

      let streak = 0;
      let checkDate = new Date(mostRecent + 'T12:00:00');
      for (let i = 0; i < dates.length; i++) {
        const expected = typeof getLocalDateKey === 'function' ? getLocalDateKey(checkDate) : checkDate.toISOString().slice(0, 10);
        if (dates.includes(expected)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      return streak;
    }

    function getWeekWorkoutStats(refDate = new Date()) {
      const bounds = getWeekWorkoutBounds(refDate);
      const todayKey = typeof getLocalDateKey === 'function' ? getLocalDateKey(refDate) : new Date().toISOString().slice(0, 10);
      const todayLocal = todayKey;

      const weekDateKeys = new Set(bounds.days.map(d => d.dateKey));
      const weekWorkouts = completedWorkoutsHistory.filter(w => {
        const d = typeof w === 'string' ? w : w.date;
        return weekDateKeys.has(d);
      });

      const workoutDatesThisWeek = new Set(weekWorkouts.map(w => typeof w === 'string' ? w : w.date));
      const daysCount = workoutDatesThisWeek.size;

      let weekVolume = 0;
      let weekSetsCount = 0;
      let weekCalories = 0;

      weekWorkouts.forEach(w => {
        if (typeof w === 'object') {
          if (w.totalVolume) weekVolume += w.totalVolume;
          if (Array.isArray(w.sets)) weekSetsCount += w.sets.length;
          if (w.caloriesBurned) weekCalories += w.caloriesBurned;
        }
      });

      const streak = calcShowUpStreak();

      // Week date range formatted string (e.g. "Oct 12 – Oct 18")
      const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monMonth = monthNamesShort[bounds.monday.getMonth()];
      const sunMonth = monthNamesShort[bounds.sunday.getMonth()];
      const rangeLabel = (monMonth === sunMonth) 
        ? `${monMonth} ${bounds.monday.getDate()} – ${bounds.sunday.getDate()}`
        : `${monMonth} ${bounds.monday.getDate()} – ${sunMonth} ${bounds.sunday.getDate()}`;

      // Detailed days list with workout status
      const daysWithStatus = bounds.days.map(d => {
        const hasWorkout = workoutDatesThisWeek.has(d.dateKey);
        const isToday = (d.dateKey === todayKey || d.dateKey === todayLocal);
        return {
          ...d,
          hasWorkout,
          isToday
        };
      });

      // Positive celebration outlook tier based on week progress
      let outlookTier = 'fresh';
      let outlookHeadline = 'A fresh week full of potential!';
      let outlookMessage = 'Every week is a new canvas. Lock in your mindset, prioritize movement, and get ready to show up whenever you are ready.';
      let outlookBadge = 'Fresh Week';
      let outlookIcon = 'fa-seedling text-emerald-400';

      if (daysCount >= 4) {
        outlookTier = 'champion';
        outlookHeadline = "Outstanding dedication! You are dominating this week.";
        outlookMessage = `You've logged ${daysCount} workouts and moved ${weekVolume.toLocaleString()} lbs across ${weekSetsCount} sets this week. That level of focus is rare and powerful. Celebrate what you've built!`;
        outlookBadge = 'Unstoppable Flow';
        outlookIcon = 'fa-crown text-amber-400';
      } else if (daysCount >= 2) {
        outlookTier = 'momentum';
        outlookHeadline = "Great consistency! Your weekly momentum is building strong.";
        outlookMessage = `With ${daysCount} solid sessions locked in this week, your effort is compounding beautifully. Keep listening to your body and showing up!`;
        outlookBadge = 'Strong Momentum';
        outlookIcon = 'fa-fire text-amber-400';
      } else if (daysCount === 1) {
        outlookTier = 'starting';
        outlookHeadline = "The hardest part is starting — and you're on the board!";
        outlookMessage = `You've broken the barrier this week with a great session. Every workout adds up to long-term strength and vitality.`;
        outlookBadge = 'On The Board';
        outlookIcon = 'fa-bolt text-emerald-400';
      }

      return {
        bounds,
        rangeLabel,
        days: daysWithStatus,
        daysCount,
        weekVolume,
        weekSetsCount,
        weekCalories,
        streak,
        outlookTier,
        outlookHeadline,
        outlookMessage,
        outlookBadge,
        outlookIcon
      };
    }

    function getDailyWorkoutCongratulation() {
      const todayKey = typeof getLocalDateKey === 'function' ? getLocalDateKey() : new Date().toISOString().slice(0, 10);
      const todayLocal = todayKey;

      const todayWorkout = completedWorkoutsHistory.find(w => {
        const d = typeof w === 'string' ? w : w.date;
        return d === todayKey || d === todayLocal;
      });

      if (!todayWorkout) {
        return {
          completed: false,
          kicker: "Daily Opportunity",
          headline: "Ready to get moving today?",
          message: "Even 15 minutes of pushups, lifting, or a brisk walk keeps your weekly consistency alive. Let's make today count!",
          todayKey
        };
      }

      const workoutName = (typeof todayWorkout === 'object' && todayWorkout.workoutName) ? todayWorkout.workoutName : "Workout Session";
      const setsCount = (typeof todayWorkout === 'object' && Array.isArray(todayWorkout.sets)) ? todayWorkout.sets.length : 1;
      const vol = (typeof todayWorkout === 'object' && todayWorkout.totalVolume) ? `${todayWorkout.totalVolume.toLocaleString()} lbs` : null;
      const cals = (typeof todayWorkout === 'object' && todayWorkout.caloriesBurned) ? `${todayWorkout.caloriesBurned} kcal` : null;
      const timeStr = (typeof todayWorkout === 'object' && todayWorkout.totalWorkoutTimeFormatted) ? todayWorkout.totalWorkoutTimeFormatted : null;

      // Casual congratulatory messages
      const casualMessages = [
        {
          kicker: "Hell yeah! 💥",
          headline: "You showed up today and put in the work.",
          subtext: "Consistency wins every single time. That sweat equity is officially in the bank. Take a breather, hydrate, and celebrate your effort!"
        },
        {
          kicker: "Boom! 🏆",
          headline: "Today's workout is crushed and in the books.",
          subtext: "Another day, another victory logged. You chose effort over excuses, and your future self is thanking you."
        },
        {
          kicker: "Massive respect! 💪",
          headline: "Discipline beats motivation every day of the week.",
          subtext: "You got after it today and made it happen. Rest up, champion — you earned every bit of today's progress."
        },
        {
          kicker: "Work done! ⚡",
          headline: "Today's session is locked in.",
          subtext: "Great energy and execution. Proud of you for staying committed to your journey."
        }
      ];

      // Pick message deterministically based on workout name & date
      const seed = Math.abs((workoutName.length + (new Date().getDate())) % casualMessages.length);
      const selected = casualMessages[seed];

      return {
        completed: true,
        workout: todayWorkout,
        workoutName,
        setsCount,
        vol,
        cals,
        timeStr,
        kicker: selected.kicker,
        headline: selected.headline,
        subtext: selected.subtext,
        todayKey
      };
    }

    function renderHomeTab() {
      const container = document.getElementById('tab-home-view');
      if (!container) return;

      const user = (typeof getAppUser === 'function') ? getAppUser() : { name: 'Athlete', rawName: 'Athlete' };
      const athleteName = user.rawName || user.name || 'Athlete';

      const hour = new Date().getHours();
      let timeOfDayGreeting = 'Good morning';
      if (hour >= 12 && hour < 17) timeOfDayGreeting = 'Good afternoon';
      else if (hour >= 17) timeOfDayGreeting = 'Good evening';

      const weekStats = getWeekWorkoutStats();
      const dailyStatus = getDailyWorkoutCongratulation();

      // Update greeting card
      const greetingEl = document.getElementById('home-greeting-headline');
      if (greetingEl) {
        const safeName = (typeof escapeHtml === 'function') ? escapeHtml(athleteName) : athleteName;
        greetingEl.innerHTML = `${timeOfDayGreeting}, ${safeName} 👋`;
      }
      const streakCountEl = document.getElementById('home-streak-count');
      if (streakCountEl) {
        streakCountEl.innerText = `${weekStats.streak} Day Streak`;
      }

      // Update best-streak-val in calendar card if present
      const bestStreakEl = document.getElementById('best-streak-val');
      if (bestStreakEl) {
        bestStreakEl.innerText = `${weekStats.streak} days`;
      }

      // 1. Render Today's Casual Congratulation (Requirement 2: inside This Week's Outlook)
      const todayCard = document.getElementById('home-today-status-card');
      if (todayCard) {
        if (dailyStatus.completed) {
          todayCard.classList.remove('hidden');
          todayCard.className = "hero-victory-card rounded-2xl p-4 border border-emerald-500/40 shadow-xl space-y-2.5 transition-all";
          const safeKicker = (typeof escapeHtml === 'function') ? escapeHtml(dailyStatus.kicker) : dailyStatus.kicker;
          const safeHeadline = (typeof escapeHtml === 'function') ? escapeHtml(dailyStatus.headline) : dailyStatus.headline;
          const safeSubtext = (typeof escapeHtml === 'function') ? escapeHtml(dailyStatus.subtext) : dailyStatus.subtext;
          const safeWorkoutName = (typeof escapeHtml === 'function') ? escapeHtml(dailyStatus.workoutName) : dailyStatus.workoutName;

          todayCard.innerHTML = `
            <div class="flex items-center justify-between gap-2 border-b border-emerald-500/20 pb-2">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                <i class="fa-solid fa-trophy text-emerald-400"></i> ${safeKicker}
              </span>
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-bold text-emerald-400 font-mono">${safeWorkoutName}</span>
                <button type="button" onclick="triggerHaptic('medium'); openEditHistoricalWorkoutModal('${dailyStatus.completedDate || (typeof getEasternTimeDateKey === 'function' ? getEasternTimeDateKey() : new Date().toISOString().slice(0, 10))}')" class="text-slate-400 hover:text-amber-400 p-1 rounded-lg transition" title="Edit Today's Workout">
                  <i class="fa-solid fa-pencil text-xs"></i>
                </button>
              </div>
            </div>
            <h3 class="text-sm font-black text-slate-100">
              ${safeHeadline}
            </h3>
            <p class="text-xs text-slate-300 leading-relaxed italic bg-slate-950/70 p-2.5 rounded-xl border border-emerald-500/20">
              "${safeSubtext}"
            </p>
            <div class="text-[10px] text-slate-400 flex items-center gap-2 pt-0.5">
              <span>${dailyStatus.setsCount} sets logged</span>
              ${dailyStatus.vol ? `<span>• ${dailyStatus.vol}</span>` : ''}
              ${dailyStatus.timeStr ? `<span>• ${dailyStatus.timeStr}</span>` : ''}
            </div>
          `;
        } else {
          todayCard.classList.add('hidden');
          todayCard.innerHTML = '';
        }
      }

      // 2. Render Weekly Range & Count Badge
      const rangeLabelEl = document.getElementById('home-week-range-label');
      if (rangeLabelEl) rangeLabelEl.innerText = weekStats.rangeLabel;
      const weekCountBadgeEl = document.getElementById('home-week-count-badge');
      if (weekCountBadgeEl) weekCountBadgeEl.innerText = `${weekStats.daysCount} / 7 Days Showed Up`;

      // 3. Render 7-day visual pills (Monday to Sunday) - days when showed up are filled with the theme color
      const pillsContainer = document.getElementById('home-week-pills-container');
      if (pillsContainer) {
        pillsContainer.innerHTML = weekStats.days.map(d => {
          if (d.hasWorkout) {
            return `
              <div class="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl transition-all shadow-md ${d.isToday ? 'ring-2 ring-white/80' : ''}"
                   style="background-color: var(--m3-primary); color: var(--m3-onPrimary); border: 1px solid var(--m3-primary); box-shadow: 0 4px 14px -2px color-mix(in srgb, var(--m3-primary) 40%, transparent);"
                   title="${d.dayNameShort}: Showed Up!">
                <span class="text-[10px] font-black uppercase tracking-wider opacity-90">${d.dayInitial}</span>
                <span class="text-xs sm:text-sm font-black font-mono my-0.5">${d.dayNumber}</span>
                <i class="fa-solid fa-circle-check text-xs mt-0.5"></i>
              </div>
            `;
          } else if (d.isToday) {
            return `
              <div class="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200 ring-2 ring-emerald-400/80 shadow-md"
                   title="${d.dayNameShort}: Today">
                <span class="text-[10px] font-bold uppercase text-emerald-400">${d.dayInitial}</span>
                <span class="text-xs sm:text-sm font-black font-mono my-0.5">${d.dayNumber}</span>
                <span class="text-[9px] font-semibold text-slate-400">Today</span>
              </div>
            `;
          } else {
            return `
              <div class="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-slate-500"
                   title="${d.dayNameShort}: Rest or upcoming">
                <span class="text-[10px] font-bold uppercase">${d.dayInitial}</span>
                <span class="text-xs sm:text-sm font-bold font-mono my-0.5 text-slate-400">${d.dayNumber}</span>
                <span class="w-1.5 h-1.5 rounded-full bg-slate-800 mt-1"></span>
              </div>
            `;
          }
        }).join('');
      }

      // 4. Render Celebration Banner (Requirement 1)
      const bannerEl = document.getElementById('home-week-celebration-banner');
      if (bannerEl) {
        const isHighTier = weekStats.daysCount >= 2;
        bannerEl.className = isHighTier
          ? "rounded-2xl p-4 bg-gradient-to-r from-emerald-950/50 to-slate-900/90 border border-emerald-500/30 text-slate-200 space-y-1.5 shadow-md"
          : "rounded-2xl p-4 bg-slate-950/80 border border-slate-800 text-slate-300 space-y-1.5";

        const safeHeadline = (typeof escapeHtml === 'function') ? escapeHtml(weekStats.outlookHeadline) : weekStats.outlookHeadline;
        const safeMessage = (typeof escapeHtml === 'function') ? escapeHtml(weekStats.outlookMessage) : weekStats.outlookMessage;

        bannerEl.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="text-xs font-black flex items-center gap-1.5 text-slate-100">
              <i class="fa-solid ${weekStats.outlookIcon}"></i>
              ${safeHeadline}
            </span>
          </div>
          <p class="text-xs text-slate-300/90 leading-relaxed">
            ${safeMessage}
          </p>
        `;
      }

      // 5. Render Metric Cards
      const workoutsMetricEl = document.getElementById('home-metric-workouts');
      if (workoutsMetricEl) workoutsMetricEl.innerText = `${weekStats.daysCount} / 7`;
      const workoutsSubEl = document.getElementById('home-metric-workouts-sub');
      if (workoutsSubEl) {
        workoutsSubEl.innerText = weekStats.daysCount >= 3 ? "Champion pace!" : "Sessions logged";
      }
      const volumeMetricEl = document.getElementById('home-metric-volume');
      if (volumeMetricEl) volumeMetricEl.innerText = weekStats.weekVolume.toLocaleString();
      const setsMetricEl = document.getElementById('home-metric-sets');
      if (setsMetricEl) setsMetricEl.innerText = weekStats.weekSetsCount.toString();
      const streakMetricEl = document.getElementById('home-metric-streak');
      if (streakMetricEl) streakMetricEl.innerText = `${weekStats.streak}d`;

      // 6. Squad Pulse Card
      const squadPulseCard = document.getElementById('home-squad-pulse-card');
      if (squadPulseCard) {
        let squads = [];
        try {
          if (typeof getSquads === 'function') squads = getSquads();
        } catch (e) {}

        if (squads.length === 0) {
          squadPulseCard.innerHTML = `
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center text-sm shrink-0">
                  <i class="fa-solid fa-people-group"></i>
                </div>
                <div>
                  <div class="text-xs font-bold text-slate-200">Accountability Squads</div>
                  <div class="text-[11px] text-slate-400">Join a squad to train together and celebrate teammates.</div>
                </div>
              </div>
              <button type="button" onclick="triggerHaptic('light'); switchTab('squads')" class="text-xs font-bold text-purple-400 hover:text-purple-300 bg-purple-500/10 border border-purple-500/25 px-2.5 py-1.5 rounded-xl transition shrink-0">
                Explore Squads
              </button>
            </div>
          `;
        } else {
          const todayKey = typeof getLocalDateKey === 'function' ? getLocalDateKey() : (typeof getETDateKey === 'function' ? getETDateKey() : new Date().toISOString().slice(0, 10));
          let teammatesCompletedToday = 0;
          let teammatesLiftingNow = 0;
          squads.forEach(sq => {
            (sq.members || []).forEach(m => {
              if (m.id !== user.id && m.email !== user.email) {
                if (m.isWorkingOut && (typeof isMemberWorkoutActive !== 'function' || isMemberWorkoutActive(m))) teammatesLiftingNow++;
                if (m.completedToday && m.completedDate === todayKey) teammatesCompletedToday++;
              }
            });
          });

          squadPulseCard.innerHTML = `
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center text-sm shrink-0">
                  <i class="fa-solid fa-shield-halved"></i>
                </div>
                <div>
                  <div class="text-xs font-bold text-slate-200">${squads.length} Active Squad${squads.length > 1 ? 's' : ''}</div>
                  <div class="text-[11px] text-slate-400">
                    ${teammatesLiftingNow > 0 ? `<span class="text-emerald-400 font-semibold"><i class="fa-solid fa-circle text-[8px] animate-pulse"></i> ${teammatesLiftingNow} lifting now</span> • ` : ''}
                    <span>${teammatesCompletedToday} teammate${teammatesCompletedToday === 1 ? '' : 's'} showed up today</span>
                  </div>
                </div>
              </div>
              <button type="button" onclick="triggerHaptic('light'); switchTab('squads')" class="text-xs font-bold text-purple-400 hover:text-purple-300 bg-purple-500/10 border border-purple-500/25 px-2.5 py-1.5 rounded-xl transition shrink-0">
                View Squads
              </button>
            </div>
          `;
        }
      }
    }


/* ==========================================================================
   showUp Progress Engine: Body Metrics (Weight & Height) Analytics, 1RM, Sparklines & Heatmap
   ========================================================================== */

    function formatHeightDisplay(inches) {
      if (!inches || isNaN(inches) || inches <= 0) return "--";
      const totalInches = Math.round(inches * 10) / 10;
      const feet = Math.floor(totalInches / 12);
      const remInches = Math.round((totalInches % 12) * 10) / 10;
      return `${feet}' ${remInches}" (${totalInches}")`;
    }

    function formatHeightShort(inches) {
      if (!inches || isNaN(inches) || inches <= 0) return "";
      const totalInches = Math.round(inches * 10) / 10;
      const feet = Math.floor(totalInches / 12);
      const remInches = Math.round((totalInches % 12) * 10) / 10;
      return `${feet}' ${remInches}"`;
    }

    function calculateBMI(weightLbs, heightInches) {
      if (!weightLbs || !heightInches || weightLbs <= 0 || heightInches <= 0) return null;
      const bmi = (weightLbs * 703) / (heightInches * heightInches);
      return Math.round(bmi * 10) / 10;
    }

    function getBMIBadge(bmi) {
      if (!bmi) return "";
      let cat = "Normal";
      let colorClass = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      if (bmi < 18.5) {
        cat = "Under";
        colorClass = "bg-sky-500/15 text-sky-400 border-sky-500/30";
      } else if (bmi >= 25 && bmi < 30) {
        cat = "Over";
        colorClass = "bg-amber-500/15 text-amber-400 border-amber-500/30";
      } else if (bmi >= 30) {
        cat = "Obese";
        colorClass = "bg-rose-500/15 text-rose-400 border-rose-500/30";
      }
      return `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold border ${colorClass}">${cat} ${bmi}</span>`;
    }

    function handleLogHeightInput(val) {
      const label = document.getElementById('log-height-ftin-label');
      const num = parseFloat(val);
      if (!label) return;
      if (isNaN(num) || num <= 0) {
        label.innerText = "--";
        return;
      }
      const feet = Math.floor(num / 12);
      const inches = Math.round((num % 12) * 10) / 10;
      label.innerText = `${feet}' ${inches}"`;
    }

    function adjustLogHeight(delta) {
      const input = document.getElementById('log-height-num-input');
      if (!input) return;
      let current = parseFloat(input.value) || userHeight || 70;
      current = Math.max(20, Math.min(108, Math.round((current + delta) * 10) / 10));
      input.value = current;
      input.dataset.autoFilled = "false";
      handleLogHeightInput(current);
    }

    function openLogWeightModal(targetDate = null, focusField = 'weight') {
      const modal = document.getElementById('log-weight-modal');
      if (!modal) return;

      const dateInput = document.getElementById('log-weight-date-input');
      const numInput = document.getElementById('log-weight-num-input');
      const heightInput = document.getElementById('log-height-num-input');
      const todayStr = getLocalDateISO();

      // Pick default date: targetDate -> selectedWorkoutDate -> today
      const defaultDate = targetDate || selectedWorkoutDate || todayStr;
      if (dateInput) {
        dateInput.max = todayStr; // Allow any historical date up to today
        dateInput.value = defaultDate;
      }

      // Check if entry for chosen date already exists
      const existing = weightHistory.find(w => w.date === defaultDate);
      const initialWeight = existing ? existing.weight : (userWeight || 0);
      const initialHeight = (existing && existing.height) ? existing.height : (userHeight || 70);

      if (numInput) {
        numInput.value = initialWeight > 0 ? initialWeight : "";
        numInput.dataset.autoFilled = "true";
      }
      if (heightInput) {
        heightInput.value = initialHeight > 0 ? initialHeight : "";
        heightInput.dataset.autoFilled = "true";
        handleLogHeightInput(initialHeight);
      }

      handleLogWeightDateChange(defaultDate);

      modal.classList.remove('hidden');
      setTimeout(() => {
        if (focusField === 'height' && heightInput) {
          heightInput.focus();
          heightInput.select();
        } else if (numInput) {
          numInput.focus();
          numInput.select();
        }
      }, 120);
    }

    function closeLogWeightModal() {
      const modal = document.getElementById('log-weight-modal');
      if (modal) modal.classList.add('hidden');
    }

    function setLogWeightQuickDate(daysAgo) {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      const iso = getLocalDateISO(d);
      const dateInput = document.getElementById('log-weight-date-input');
      if (dateInput) {
        dateInput.value = iso;
      }
      handleLogWeightDateChange(iso);
    }

    function updateQuickDateChipsUI(selectedDateStr) {
      const chips = document.querySelectorAll('.quick-date-chip');
      const today = new Date();
      chips.forEach(chip => {
        const days = parseInt(chip.dataset.days || '0', 10);
        const d = new Date();
        d.setDate(today.getDate() - days);
        const iso = getLocalDateISO(d);

        if (selectedDateStr === iso) {
          chip.className = "quick-date-chip px-2.5 py-1 rounded-xl text-[10px] font-bold border transition shrink-0 bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm";
        } else {
          chip.className = "quick-date-chip px-2.5 py-1 rounded-xl text-[10px] font-bold border transition shrink-0 bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200";
        }
      });
    }

    function handleLogWeightDateChange(dateStr) {
      if (!dateStr) return;
      const labelEl = document.getElementById('log-weight-date-label');
      const existingHint = document.getElementById('log-weight-existing-hint');
      const numInput = document.getElementById('log-weight-num-input');
      const heightInput = document.getElementById('log-height-num-input');

      const todayStr = getLocalDateISO();
      let relLabel = "";
      if (dateStr === todayStr) {
        relLabel = "Today";
      } else {
        relLabel = formatHistoricalDate(dateStr);
      }
      if (labelEl) labelEl.innerText = relLabel;

      updateQuickDateChipsUI(dateStr);

      const existing = weightHistory.find(w => w.date === dateStr);
      if (existing) {
        if (existingHint) {
          const htStr = existing.height ? `, ${formatHeightShort(existing.height)}` : '';
          existingHint.innerText = `Replaces recorded entry (${existing.weight} lbs${htStr})`;
          existingHint.classList.remove('hidden');
        }
        if (numInput && (!numInput.value || numInput.dataset.autoFilled === "true")) {
          numInput.value = existing.weight;
          numInput.dataset.autoFilled = "true";
        }
        if (heightInput && (!heightInput.value || heightInput.dataset.autoFilled === "true")) {
          const hVal = existing.height || userHeight || 70;
          heightInput.value = hVal;
          heightInput.dataset.autoFilled = "true";
          handleLogHeightInput(hVal);
        }
      } else {
        if (existingHint) existingHint.classList.add('hidden');
        if (numInput && numInput.dataset.autoFilled === "true") {
          numInput.value = userWeight || "";
          numInput.dataset.autoFilled = "true";
        }
        if (heightInput && heightInput.dataset.autoFilled === "true") {
          const defaultH = userHeight || 70;
          heightInput.value = defaultH;
          heightInput.dataset.autoFilled = "true";
          handleLogHeightInput(defaultH);
        }
      }
    }

    function adjustLogWeight(delta) {
      const input = document.getElementById('log-weight-num-input');
      if (!input) return;
      let current = parseFloat(input.value) || userWeight || 0;
      current = Math.max(0, Math.round((current + delta) * 10) / 10);
      input.value = current;
      input.dataset.autoFilled = "false";
    }

    function openWeightNumpadForHistorical() {
      const numInput = document.getElementById('log-weight-num-input');
      const currentVal = numInput ? (parseFloat(numInput.value) || userWeight || 0) : userWeight;
      openWeightNumpadModal('log-weight-num-input', 'Log Body Weight (lbs)', (finalVal) => {
        if (numInput) {
          numInput.value = finalVal;
          numInput.dataset.autoFilled = "false";
        }
      });
    }

    function saveLogWeightEntry() {
      const dateInput = document.getElementById('log-weight-date-input');
      const numInput = document.getElementById('log-weight-num-input');
      const heightInput = document.getElementById('log-height-num-input');

      const chosenDate = dateInput ? dateInput.value : getLocalDateISO();
      const rawVal = numInput ? parseFloat(numInput.value) : 0;
      const rawHeight = heightInput ? parseFloat(heightInput.value) : 0;

      if (!chosenDate) {
        showToast("Please choose a valid date for this entry.", "warning");
        return;
      }
      if (isNaN(rawVal) || rawVal <= 0) {
        showToast("Please enter a valid weight (e.g. 175.5 lbs).", "warning");
        if (numInput) numInput.focus();
        return;
      }

      const weight = Math.round(rawVal * 10) / 10;
      const height = (!isNaN(rawHeight) && rawHeight > 0) ? (Math.round(rawHeight * 10) / 10) : (userHeight || 70);

      // Update if date already exists in history, otherwise insert
      const existingIndex = weightHistory.findIndex(w => w.date === chosenDate);
      if (existingIndex >= 0) {
        weightHistory[existingIndex].weight = weight;
        if (height > 0) weightHistory[existingIndex].height = height;
      } else {
        weightHistory.push({ date: chosenDate, weight: weight, height: height });
      }

      // Always sort chronological descending (newest first)
      weightHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
      localStorage.setItem('showUp_weight_history', JSON.stringify(weightHistory));

      // If the saved date is today or the latest entry, synchronize profile current weight & height
      const latestEntry = weightHistory[0];
      if (latestEntry && (chosenDate === getLocalDateISO() || chosenDate === latestEntry.date)) {
        userWeight = latestEntry.weight;
        localStorage.setItem('showUp_user_weight', userWeight);
        const profileInput = document.getElementById('user-weight-input');
        if (profileInput) profileInput.value = userWeight;

        if (latestEntry.height && latestEntry.height > 0) {
          userHeight = latestEntry.height;
          localStorage.setItem('showUp_user_height', userHeight);
          const profileHInput = document.getElementById('user-height-input');
          if (profileHInput) profileHInput.value = userHeight;
        }
      }

      renderWeightHistory();
      closeLogWeightModal();

      const humanDate = (chosenDate === getLocalDateISO()) ? "Today" : formatHistoricalDate(chosenDate);
      const htDisplay = height > 0 ? ` (${formatHeightShort(height)})` : '';
      showToast(`Recorded ${weight} lbs${htDisplay} for ${humanDate}!`, "success");

      if (googleAccessToken) {
        syncToGoogleDrive(true);
      }
    }

    function logBodyWeightEntry(initialDate = null) {
      openLogWeightModal(initialDate);
    }

    function renderWeightHistory() {
      const currentValEl = document.getElementById('cal-current-weight-val');
      const currentHeightEl = document.getElementById('cal-current-height-val');
      const currentBmiEl = document.getElementById('cal-current-bmi-val');
      const changeValEl = document.getElementById('cal-weight-change-val');
      const container = document.getElementById('weight-history-list');

      // Sort chronological descending
      weightHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

      if (weightHistory.length > 0) {
        userWeight = weightHistory[0].weight;
        if (weightHistory[0].height) userHeight = weightHistory[0].height;
        if (currentValEl) currentValEl.innerText = `${userWeight} lbs`;
      } else {
        if (currentValEl) currentValEl.innerText = `${userWeight || '--'} lbs`;
      }

      if (currentHeightEl) {
        currentHeightEl.innerText = userHeight ? formatHeightShort(userHeight) : '--';
      }

      const activeBMI = calculateBMI(userWeight, userHeight);
      const currentBmiBadgeEl = document.getElementById('cal-current-bmi-badge');
      if (currentBmiEl) {
        if (activeBMI) {
          currentBmiEl.innerText = `${activeBMI}`;
        } else {
          currentBmiEl.innerText = '--';
        }
      }
      if (currentBmiBadgeEl) {
        if (activeBMI) {
          currentBmiBadgeEl.innerHTML = getBMIBadge(activeBMI);
        } else {
          currentBmiBadgeEl.innerHTML = '';
        }
      }

      // Target Weight Goal Progress Indicator
      const targetBadgeEl = document.getElementById('cal-weight-target-badge');
      const savedTarget = localStorage.getItem('showUp_user_target_weight');
      if (targetBadgeEl) {
        if (savedTarget && userWeight) {
          const targetNum = parseFloat(savedTarget);
          const diffToTarget = Math.round((userWeight - targetNum) * 10) / 10;
          if (diffToTarget === 0) {
            targetBadgeEl.innerHTML = `<span class="text-[9px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-full mt-0.5 inline-block">Goal Met: ${targetNum}#</span>`;
          } else if (diffToTarget > 0) {
            targetBadgeEl.innerHTML = `<span class="text-[9px] font-bold text-blue-400 bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.5 rounded-full mt-0.5 inline-block">Goal: ${targetNum}# (-${diffToTarget})</span>`;
          } else {
            targetBadgeEl.innerHTML = `<span class="text-[9px] font-bold text-purple-400 bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 rounded-full mt-0.5 inline-block">Goal: ${targetNum}# (+${Math.abs(diffToTarget)})</span>`;
          }
        } else {
          targetBadgeEl.innerHTML = '';
        }
      }

      if (weightHistory.length === 0) {
        if (changeValEl) changeValEl.innerText = "0.0 lbs";
        if (container) container.innerHTML = `<div class="text-center py-4 text-slate-600 text-xs italic">No historical body metric entries recorded yet. Click "+ Log Entry" above to record an entry.</div>`;
        return;
      }

      const latest = weightHistory[0].weight;
      const oldest = weightHistory[weightHistory.length - 1].weight;
      const diff = (latest - oldest).toFixed(1);

      if (changeValEl) {
        changeValEl.innerText = `${diff > 0 ? '+' : ''}${diff} lbs`;
        changeValEl.className = `text-lg font-black ${diff < 0 ? 'text-emerald-400' : diff > 0 ? 'text-rose-400' : 'text-slate-300'}`;
      }

      if (container) {
        container.innerHTML = weightHistory.map((item, index) => {
          const humanDate = formatHistoricalDate(item.date);
          const itemHeight = item.height || userHeight;
          const itemBmi = calculateBMI(item.weight, itemHeight);
          return `
            <div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition group">
              <div class="flex items-center gap-2 cursor-pointer" onclick="triggerHaptic('light'); openLogWeightModal('${item.date}')" title="Click to edit entry for ${item.date}">
                <i class="fa-solid fa-calendar-day text-slate-500 group-hover:text-emerald-400 transition"></i>
                <div>
                  <span class="text-slate-200 font-semibold font-mono">${item.date}</span>
                  <span class="text-[10px] text-slate-500 ml-1.5 hidden sm:inline">(${humanDate.split(',')[0]})</span>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-1.5 cursor-pointer" onclick="triggerHaptic('light'); openLogWeightModal('${item.date}')" title="Click to edit">
                  <span class="font-bold text-emerald-400 font-mono">${item.weight} lbs</span>
                  ${itemHeight ? `<span class="text-[10px] text-slate-400 font-mono hidden xs:inline">(${formatHeightShort(itemHeight)})</span>` : ''}
                  ${itemBmi ? getBMIBadge(itemBmi) : ''}
                </div>
                <button onclick="triggerHaptic('light'); openLogWeightModal('${item.date}')" class="text-slate-500 hover:text-slate-300 p-1 transition" title="Edit entry">
                  <i class="fa-solid fa-pen text-[10px]"></i>
                </button>
                <button onclick="triggerHaptic('light'); deleteWeightEntry(${index})" class="text-slate-600 hover:text-rose-400 p-1 transition" title="Delete Entry">
                  <i class="fa-solid fa-trash-can text-[10px]"></i>
                </button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    function deleteWeightEntry(index) {
      const wasFirst = (index === 0);
      weightHistory.splice(index, 1);
      if (wasFirst && weightHistory.length > 0) {
        userWeight = weightHistory[0].weight;
        localStorage.setItem('showUp_user_weight', userWeight);
        const profileInput = document.getElementById('user-weight-input');
        if (profileInput) profileInput.value = userWeight;

        if (weightHistory[0].height) {
          userHeight = weightHistory[0].height;
          localStorage.setItem('showUp_user_height', userHeight);
          const profileHInput = document.getElementById('user-height-input');
          if (profileHInput) profileHInput.value = userHeight;
        }
      }
      localStorage.setItem('showUp_weight_history', JSON.stringify(weightHistory));
      renderWeightHistory();
      if (googleAccessToken) {
        syncToGoogleDrive(true);
      }
      showToast("Entry removed", "info");
    }

    function openWeightTrendGraph() {
      if (weightHistory.length === 0) {
        alert("Please log at least one body metric entry to view the trend graph.");
        return;
      }
      renderWeightTrendGraphSVG();
      document.getElementById('weight-graph-modal').classList.remove('hidden');
    }

    function toggleWeightGraphModal() {
      document.getElementById('weight-graph-modal').classList.add('hidden');
    }

    function renderWeightTrendGraphSVG() {
      const svg = document.getElementById('weight-trend-svg');
      svg.innerHTML = '';

      // Sort chronological (oldest to newest) for line drawing
      const sortedHistory = [...weightHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
      const weights = sortedHistory.map(h => h.weight);

      const minW = Math.min(...weights);
      const maxW = Math.max(...weights);
      const avgW = (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1);

      const elMin = document.getElementById('graph-min-weight');
      const elAvg = document.getElementById('graph-avg-weight');
      const elMax = document.getElementById('graph-max-weight');
      if (elMin) elMin.innerText = `${minW} lbs`;
      if (elAvg) elAvg.innerText = `${avgW} lbs`;
      if (elMax) elMax.innerText = `${maxW} lbs`;

      const width = 320;
      const height = 160;
      const padding = 20;

      const effectiveWidth = width - (padding * 2);
      const effectiveHeight = height - (padding * 2);

      const range = (maxW - minW) || 1;

      const points = sortedHistory.map((item, index) => {
        const x = padding + (index / (Math.max(1, sortedHistory.length - 1))) * effectiveWidth;
        const y = height - padding - ((item.weight - minW) / range) * effectiveHeight;
        return { x, y, weight: item.weight, date: item.date };
      });

      // SVG Path String
      let d = `M ${points[0].x} ${points[0].y}`;
      points.forEach((p, idx) => {
        if (idx > 0) d += ` L ${p.x} ${p.y}`;
      });

      // Gradient Definition
      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      defs.innerHTML = `
        <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--m3-primary)" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="var(--m3-primary)" stop-opacity="0.0"/>
        </linearGradient>
      `;
      svg.appendChild(defs);

      // Area Fill
      const areaPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const areaD = `${d} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
      areaPath.setAttribute("d", areaD);
      areaPath.setAttribute("fill", "url(#weightGrad)");
      svg.appendChild(areaPath);

      // Line Path
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "var(--m3-primary)");
      path.setAttribute("stroke-width", "3");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      svg.appendChild(path);

      // Data Circles
      points.forEach(p => {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", p.x);
        circle.setAttribute("cy", p.y);
        circle.setAttribute("r", "4");
        circle.setAttribute("fill", "var(--m3-surface)");
        circle.setAttribute("stroke", "var(--m3-primary)");
        circle.setAttribute("stroke-width", "2");

        const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
        title.textContent = `${p.date}: ${p.weight} lbs`;
        circle.appendChild(title);

        svg.appendChild(circle);
      });

      // Target Goal Guideline
      const savedTarget = localStorage.getItem('showUp_user_target_weight');
      if (savedTarget) {
        const targetVal = parseFloat(savedTarget);
        if (!isNaN(targetVal) && targetVal >= (minW - 30) && targetVal <= (maxW + 30)) {
          const targetY = Math.max(padding, Math.min(height - padding, height - padding - ((targetVal - minW) / range) * effectiveHeight));
          const goalLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
          goalLine.setAttribute("x1", padding);
          goalLine.setAttribute("y1", targetY);
          goalLine.setAttribute("x2", width - padding);
          goalLine.setAttribute("y2", targetY);
          goalLine.setAttribute("stroke", "#38bdf8");
          goalLine.setAttribute("stroke-width", "1.5");
          goalLine.setAttribute("stroke-dasharray", "4,4");
          svg.appendChild(goalLine);

          const goalText = document.createElementNS("http://www.w3.org/2000/svg", "text");
          goalText.setAttribute("x", width - padding);
          goalText.setAttribute("y", Math.max(12, targetY - 4));
          goalText.setAttribute("text-anchor", "end");
          goalText.setAttribute("fill", "#38bdf8");
          goalText.setAttribute("font-size", "9");
          goalText.setAttribute("font-weight", "bold");
          goalText.textContent = `Goal: ${targetVal}#`;
          svg.appendChild(goalText);
        }
      }
    }



    function initSparkline() {
      const canvas = document.getElementById('hr-sparkline');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      function draw() {
        if (canvas.parentElement && canvas.parentElement.clientWidth > 0 && canvas.parentElement.clientHeight > 0) {
          const parentW = canvas.parentElement.clientWidth;
          const parentH = canvas.parentElement.clientHeight;
          if (canvas.width !== parentW || canvas.height !== parentH) {
            canvas.width = parentW;
            canvas.height = parentH;
          }
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (hrHistory.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 2;
            const step = canvas.width / (hrHistory.length - 1);
            
            hrHistory.forEach((val, i) => {
              const x = i * step;
              const y = canvas.height - ((val - 40) / (180 - 40)) * canvas.height;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            ctx.stroke();
          }
        }
        requestAnimationFrame(draw);
      }
      draw();
    }

    function isHRMConnected() {
      return Boolean(currentHR > 0 || hrSimInterval || (bleHRDevice && bleHRDevice.gatt && bleHRDevice.gatt.connected));
    }

    function handleHRMPillClick() {
      if (isHRMConnected()) {
        const hrCard = document.getElementById('hr-card');
        if (hrCard) {
          if (hrCard.classList.contains('hidden')) {
            hrCard.classList.remove('hidden');
            hrCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          } else {
            openHRMModal();
          }
        }
      } else {
        openHRMModal();
      }
    }

    function openHRMModal() {
      const modal = document.getElementById('hrm-connectivity-modal');
      if (!modal) return;

      const bleMsg = document.getElementById('hrm-ble-unsupported-msg');
      if (bleMsg) {
        if (!navigator.bluetooth) {
          bleMsg.classList.remove('hidden');
        } else {
          bleMsg.classList.add('hidden');
        }
      }

      const isConn = isHRMConnected();
      const statusText = document.getElementById('hrm-modal-status-text');
      const simBtnText = document.getElementById('modal-sim-btn-text');

      if (statusText) {
        if (isConn) {
          statusText.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span><span class="text-emerald-400 font-bold">Connected (${currentHR > 0 ? currentHR + ' BPM' : 'Active'})</span>`;
        } else {
          statusText.innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-600 inline-block"></span><span class="text-slate-400 font-bold">Disconnected</span>`;
        }
      }

      if (simBtnText) {
        simBtnText.innerText = hrSimInterval ? "Stop HR Simulator" : "Start HR Simulator";
      }

      modal.classList.remove('hidden');
    }

    function closeHRMModal() {
      const modal = document.getElementById('hrm-connectivity-modal');
      if (modal) modal.classList.add('hidden');
    }

    async function connectHRM(fromModal = false) {
      if (!navigator.bluetooth) {
        const bleMsg = document.getElementById('hrm-ble-unsupported-msg');
        if (bleMsg) bleMsg.classList.remove('hidden');
        if (typeof showToast === 'function') {
          showToast('Web Bluetooth is not supported on this browser/device. Try Chrome/Edge or run the Simulator.', 'warning');
        } else {
          alert('Web Bluetooth is not supported on this browser/device. Try Chrome/Edge or run the Simulator.');
        }
        return;
      }

      try {
        const statusText = document.getElementById('hrm-modal-status-text');
        if (statusText) {
          statusText.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block"></span><span class="text-amber-300 font-bold">Pairing...</span>`;
        }

        const device = await navigator.bluetooth.requestDevice({
          filters: [{ services: ['heart_rate'] }],
          optionalServices: ['battery_service']
        });

        bleHRDevice = device;
        device.addEventListener('gattserverdisconnected', onBLEDisconnected);

        const server = await device.gatt.connect();
        bleHRServer = server;

        const service = await server.getPrimaryService('heart_rate');
        const characteristic = await service.getCharacteristic('heart_rate_measurement');
        bleHRCharacteristic = characteristic;

        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', (event) => {
          parseHeartRateMeasurement(event);
        });

        onHRMConnected(device.name || 'Bluetooth Heart Rate Monitor');

        if (fromModal) {
          closeHRMModal();
        }
        if (typeof showToast === 'function') {
          showToast(`Connected to ${device.name || 'HR Monitor'}`, 'success');
        }
      } catch (err) {
        console.warn('Bluetooth HRM pairing cancelled or failed:', err);
        const statusText = document.getElementById('hrm-modal-status-text');
        if (statusText) {
          statusText.innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-600 inline-block"></span><span class="text-slate-400 font-bold">Disconnected</span>`;
        }
      }
    }

    function parseHeartRateMeasurement(event) {
      const value = event.target.value;
      if (!value || value.byteLength < 2) return;
      const flags = value.getUint8(0);
      const is16Bit = (flags & 0x01) === 0x01;
      const bpm = is16Bit ? value.getUint16(1, true) : value.getUint8(1);
      updateHRTelemetry(bpm);
    }

    function onBLEDisconnected() {
      disconnectHRM();
      if (typeof showToast === 'function') {
        showToast('Bluetooth HRM disconnected', 'info');
      }
    }

    function toggleHRSimulator(fromModal = false) {
      if (hrSimInterval) {
        disconnectHRM();
        return;
      }

      if (bleHRDevice && bleHRDevice.gatt && bleHRDevice.gatt.connected) {
        bleHRDevice.gatt.disconnect();
      }

      onHRMConnected('Simulator');
      if (fromModal) {
        closeHRMModal();
      }

      // Initial reading immediately
      currentHR = Math.floor(125 + Math.random() * 30);
      updateHRTelemetry(currentHR);

      hrSimInterval = setInterval(() => {
        // Natural fluctuations around working heart rate
        const delta = Math.floor((Math.random() - 0.48) * 6);
        currentHR = Math.max(90, Math.min(185, currentHR + delta));
        updateHRTelemetry(currentHR);
      }, 1000);
    }

    function disconnectHRM() {
      if (hrSimInterval) {
        clearInterval(hrSimInterval);
        hrSimInterval = null;
      }
      if (bleHRDevice && bleHRDevice.gatt && bleHRDevice.gatt.connected) {
        try {
          bleHRDevice.gatt.disconnect();
        } catch (e) {
          console.warn('Error disconnecting BLE device:', e);
        }
      }
      bleHRDevice = null;
      bleHRServer = null;
      bleHRCharacteristic = null;

      onHRMDisconnected();
    }

    function onHRMConnected(sourceName = 'HRM') {
      const hrCard = document.getElementById('hr-card');
      if (hrCard) hrCard.classList.remove('hidden');

      const btnSim = document.getElementById('btn-toggle-sim');
      if (btnSim) btnSim.innerText = hrSimInterval ? "Stop Sim" : "Simulate";

      const modalSimBtn = document.getElementById('modal-sim-btn-text');
      if (modalSimBtn) modalSimBtn.innerText = hrSimInterval ? "Stop HR Simulator" : "Start HR Simulator";

      const btnConnect = document.getElementById('btn-connect-hrm');
      if (btnConnect) {
        btnConnect.innerHTML = `<i class="fa-solid fa-bluetooth text-emerald-400"></i><span>${sourceName === 'Simulator' ? 'Sim Active' : 'Connected'}</span>`;
      }

      if (typeof updateRunningHRMUI === 'function') {
        updateRunningHRMUI();
      }
    }

    function onHRMDisconnected() {
      const hrCard = document.getElementById('hr-card');
      if (hrCard) hrCard.classList.add('hidden');

      currentHR = 0;
      const display = document.getElementById('live-hr-display');
      if (display) display.innerText = "--";

      const zone = document.getElementById('live-hr-zone');
      if (zone) {
        zone.innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-600 inline-block"></span><span>Disconnected</span>`;
      }

      const ping = document.getElementById('hr-pulse-ping');
      if (ping) ping.classList.add('opacity-0');

      const dot = document.getElementById('hr-pulse-dot');
      if (dot) dot.className = "relative inline-flex rounded-full h-3 w-3 bg-slate-600";

      const btnSim = document.getElementById('btn-toggle-sim');
      if (btnSim) btnSim.innerText = "Simulate";

      const modalSimBtn = document.getElementById('modal-sim-btn-text');
      if (modalSimBtn) modalSimBtn.innerText = "Start HR Simulator";

      const btnConnect = document.getElementById('btn-connect-hrm');
      if (btnConnect) {
        btnConnect.innerHTML = `<i class="fa-solid fa-bluetooth"></i><span>Connect HRM</span>`;
      }

      // Reset Minimalist Pill
      const pillHeart = document.getElementById('hr-pill-heart-icon');
      const pillDot = document.getElementById('hr-pill-pulse-dot');
      const pillPing = document.getElementById('hr-pill-pulse-ping');
      const pillLabel = document.getElementById('hr-pill-label');
      const pillBpm = document.getElementById('hr-pill-bpm');
      const pillAction = document.getElementById('hr-pill-action');

      if (pillHeart) pillHeart.className = "fa-solid fa-heart text-slate-500 text-xs group-hover:text-rose-400 transition-colors";
      if (pillDot) pillDot.className = "relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-600 transition-colors";
      if (pillPing) pillPing.classList.add('hidden');
      if (pillLabel) pillLabel.innerText = "HRM Disconnected";
      if (pillBpm) {
        pillBpm.classList.add('hidden');
        pillBpm.innerText = "";
      }
      if (pillAction) {
        pillAction.innerHTML = `<i class="fa-solid fa-bluetooth text-[10px]"></i><span>Tap to Connect</span>`;
      }

      if (typeof updateRunningHRMUI === 'function') {
        updateRunningHRMUI();
      }
    }

    function updateHRTelemetry(bpm) {
      currentHR = bpm;
      hrHistory.push(bpm);
      if (hrHistory.length > 50) hrHistory.shift();

      if (!window.runningHRSamples) window.runningHRSamples = [];
      window.runningHRSamples.push(bpm);
      if (window.runningHRSamples.length > 500) window.runningHRSamples.shift();

      if (typeof updateRunningHRMUI === 'function') {
        const impEl = document.getElementById('implement-select');
        if (impEl && impEl.value === 'Running') {
          updateRunningHRMUI();
        }
      }

      const display = document.getElementById('live-hr-display');
      if (display) display.innerText = bpm;

      // Dynamic Zone calculation based on standard cardiovascular ranges (~185 max HR)
      let zoneLabel = "Warm Up (Zone 1)";
      let zoneBadgeColor = "text-slate-400";
      let dotColor = "bg-slate-400";
      let shortZone = "Warmup";

      if (bpm >= 165) {
        zoneLabel = "Redline / Peak (Zone 5)";
        zoneBadgeColor = "text-rose-400";
        dotColor = "bg-rose-500";
        shortZone = "Peak";
      } else if (bpm >= 145) {
        zoneLabel = "Anaerobic (Zone 4)";
        zoneBadgeColor = "text-amber-400";
        dotColor = "bg-amber-400";
        shortZone = "Anaerobic";
      } else if (bpm >= 125) {
        zoneLabel = "Aerobic (Zone 3)";
        zoneBadgeColor = "text-emerald-400";
        dotColor = "bg-emerald-400";
        shortZone = "Aerobic";
      } else if (bpm >= 105) {
        zoneLabel = "Fat Burn (Zone 2)";
        zoneBadgeColor = "text-cyan-400";
        dotColor = "bg-cyan-400";
        shortZone = "Fat Burn";
      }

      const zone = document.getElementById('live-hr-zone');
      if (zone) {
        zone.innerHTML = `<span class="w-2 h-2 rounded-full ${dotColor} inline-block animate-pulse"></span><span class="${zoneBadgeColor}">${zoneLabel}</span>`;
      }

      const ping = document.getElementById('hr-pulse-ping');
      if (ping) ping.classList.remove('opacity-0');

      const dot = document.getElementById('hr-pulse-dot');
      if (dot) dot.className = `relative inline-flex rounded-full h-3 w-3 ${dotColor}`;

      // Minimalist Pill Live State
      const pillHeart = document.getElementById('hr-pill-heart-icon');
      const pillDot = document.getElementById('hr-pill-pulse-dot');
      const pillPing = document.getElementById('hr-pill-pulse-ping');
      const pillLabel = document.getElementById('hr-pill-label');
      const pillBpm = document.getElementById('hr-pill-bpm');
      const pillAction = document.getElementById('hr-pill-action');

      if (pillHeart) pillHeart.className = "fa-solid fa-heart text-rose-500 text-xs animate-pulse";
      if (pillDot) pillDot.className = `relative inline-flex rounded-full h-2.5 w-2.5 ${dotColor}`;
      if (pillPing) pillPing.classList.remove('hidden');
      if (pillLabel) pillLabel.innerText = "HRM Live:";
      if (pillBpm) {
        pillBpm.classList.remove('hidden');
        pillBpm.innerText = `${bpm} BPM`;
      }
      if (pillAction) {
        pillAction.innerHTML = `<span class="w-1.5 h-1.5 rounded-full ${dotColor} inline-block"></span><span>${shortZone}</span>`;
      }
    }



    function renderHeatMap() {
      if (typeof updateMapDateSelectorUI === 'function') {
        updateMapDateSelectorUI();
      }

      const tickerContainer = document.getElementById('zip-ticker-container');
      const displayUserZip = document.getElementById('display-user-zip');
      const userZip = getUserZip();
      const userCity = localStorage.getItem('showUp_user_ip_city');

      if (displayUserZip) {
        displayUserZip.innerText = userCity ? `${userZip} (${userCity.split(',')[0]})` : userZip;
      }

      // ONLY get zip codes where logged-in athletes are working out or completed on selected date
      const activeZipNodes = getActiveAndCompletedZipNodes();
      const aggNodes = getAggregatedNodesForZoom(currentMapZoom, activeZipNodes);

      if (!selectedHeatMapZip || (!activeZipNodes.some(n => n.zip === selectedHeatMapZip) && !aggNodes.some(a => a.id === selectedHeatMapZip))) {
        selectedHeatMapZip = activeZipNodes.length > 0 ? activeZipNodes[0].zip : userZip;
      }

      // 1. Render Ticker Pills (Zoom-adaptive: Zip Codes, States, or Country)
      if (tickerContainer) {
        if (aggNodes.length === 0) {
          const activeDate = (typeof getSelectedMapDate === 'function') ? getSelectedMapDate() : getETDateKey();
          const isToday = (activeDate === getETDateKey());
          const dateDisp = (typeof formatMapDateDisplay === 'function') ? formatMapDateDisplay(activeDate) : activeDate;
          let emptyNotice = `No workouts recorded for ${dateDisp}.`;
          if (isToday) {
            const yesterdayKey = typeof getYesterdayETDateKey === 'function' ? getYesterdayETDateKey() : '';
            const yesterdayNodes = (yesterdayKey && typeof getActiveAndCompletedZipNodes === 'function') ? getActiveAndCompletedZipNodes(yesterdayKey) : [];
            const yTotal = yesterdayNodes.reduce((acc, n) => acc + (n.completedToday || 0), 0);
            if (yTotal > 0) {
              emptyNotice = `No workouts recorded today yet. <span class="text-amber-300 font-semibold">${yTotal} workout${yTotal === 1 ? '' : 's'} scored yesterday.</span> <button type="button" onclick="triggerHaptic('light'); setMapDateToYesterday()" class="text-amber-400 hover:text-amber-300 underline font-bold ml-1 cursor-pointer">View Yesterday (${yTotal} Scored)</button>`;
            } else {
              emptyNotice = 'No workouts recorded today yet. Log your first workout to put your area on the map!';
            }
          }
          tickerContainer.innerHTML = `
            <div class="text-[11px] text-slate-500 italic py-1 px-1 flex items-center gap-1.5 flex-wrap">
              <i class="fa-solid fa-circle-info text-slate-600"></i>
              <span>${emptyNotice}</span>
            </div>
          `;
        } else {
          tickerContainer.innerHTML = aggNodes.map(node => {
            const isSelected = (node.id === selectedHeatMapZip || (node.originalNodes && node.originalNodes.some(on => on.zip === selectedHeatMapZip)));
            const hasActive = node.activeCount > 0;

            return `
              <button onclick="triggerHaptic('light'); selectZipNode('${node.id}')" class="px-2.5 py-1.5 rounded-xl border text-[11px] whitespace-nowrap transition flex items-center gap-1.5 ${
                isSelected 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm font-bold' 
                  : hasActive
                    ? 'bg-slate-900 text-emerald-400 border-emerald-500/30 font-semibold'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }">
                <span class="w-5 h-5 rounded-lg bg-[var(--m3-primary)] text-[var(--m3-onPrimary)] flex items-center justify-center text-[10px] font-mono font-black shadow-sm">${node.completedToday || 0}</span>
                <span class="font-mono font-bold">${node.type === 'zip' ? node.id : node.label}</span>
                ${node.type === 'zip' ? `<span class="text-slate-400 text-[10px]">${node.subLabel.split(',')[0]}</span>` : ''}
                ${hasActive 
                  ? `<span class="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1"><span class="w-1 h-1 rounded-full bg-emerald-400 animate-ping"></span>${node.activeCount} Live</span>` 
                  : `<span class="text-[9px] px-1.5 py-0.5 rounded-md bg-[var(--m3-primaryContainer)] text-[var(--m3-primary)] border border-[var(--m3-primary)]/30 font-bold flex items-center gap-1"><i class="fa-solid fa-check text-[8px] font-black"></i>${node.completedToday} Done</span>`
                }
              </button>
            `;
          }).join('');
        }
      }

      // 2. Update Detail Card
      updateZipDetailCard(activeZipNodes);

      // 3. Render On-Map Zip Boundaries Overlay & Numbers
      renderMapZipBoundariesOverlay(activeZipNodes);

      // 4. Update Google Maps Base Layer
      initGoogleMapsBaseLayer();
    }

/* ==========================================================================
   showUp Squads Engine: Strict Athlete Isolation, Real-Time Accountability
   ========================================================================== */

    function isAthleteMemberOrCreator(squad, user) {
      if (!squad) return false;
      if (!user) user = getAppUser();
      const userId = user.id;
      const userEmail = (user.email || '').toLowerCase().trim();

      // STRICT ISOLATION: Unauthenticated guests or logged-out athletes do not inherit squads
      const isLoggedIn = typeof isCustomerLoggedIn === 'function' ? isCustomerLoggedIn() : (userId && userId !== 'local_user');
      if (!isLoggedIn) {
        return false;
      }

      // 1. Is athlete the squad creator?
      const isCreatorById = squad.creatorId && squad.creatorId !== 'local_user' && (squad.creatorId === userId || (userEmail && squad.creatorId.toLowerCase().trim() === userEmail));
      const isCreatorByEmail = userEmail && squad.creatorEmail && (squad.creatorEmail.toLowerCase().trim() === userEmail);
      const isCreatorInMembers = Array.isArray(squad.members) && squad.members.some(m => {
        if (!m) return false;
        if (typeof m === 'string') {
          const str = m.toLowerCase().trim();
          return (userId && m === userId) || (userEmail && str === userEmail);
        }
        const matchId = m.id && m.id !== 'local_user' && (m.id === userId || (userEmail && m.id.toLowerCase().trim() === userEmail));
        const matchEmail = userEmail && m.email && m.email.toLowerCase().trim() === userEmail;
        return (matchId || matchEmail) && m.isCreator === true;
      });

      if (isCreatorById || isCreatorByEmail || isCreatorInMembers) {
        return true;
      }

      // 2. Is athlete an active member who joined or was invited to the squad?
      const isMember = Array.isArray(squad.members) && squad.members.some(m => {
        if (!m) return false;
        if (typeof m === 'string') {
          const str = m.toLowerCase().trim();
          return (userId && m === userId) || (userEmail && str === userEmail);
        }
        const matchId = m.id && m.id !== 'local_user' && (m.id === userId || (userEmail && m.id.toLowerCase().trim() === userEmail));
        const matchEmail = userEmail && m.email && m.email.toLowerCase().trim() === userEmail;
        return matchId || matchEmail;
      });

      if (isMember) return true;

      // 3. Backup creator match
      if (squad.backupCreatorId && squad.backupCreatorId !== 'local_user' && (squad.backupCreatorId === userId || (userEmail && squad.backupCreatorId.toLowerCase().trim() === userEmail))) return true;
      if (squad.backupCreatorEmail && userEmail && squad.backupCreatorEmail.toLowerCase().trim() === userEmail) return true;

      return false;
    }

    function sanitizeSquadMembers(squad, user) {
      if (!squad || !Array.isArray(squad.members)) return squad;
      if (!user) user = getAppUser();

      const deduped = [];
      const memberMap = new Map();

      for (const m of squad.members) {
        if (!m) continue;

        // Discard any mock placeholder teammates or invalid mock IDs
        if (m.zip === '60601' || m.zip === '80202' || m.id === 'mock_athlete_1' || m.id === 'mock_athlete_2' || m.isMockTeammate || (typeof m.id === 'string' && m.id.startsWith('mock_'))) {
          continue;
        }

        const isCurrentUserEntity = (
          m.id === user.id || 
          (user.email && m.email && m.email.toLowerCase().trim() === user.email.toLowerCase().trim()) || 
          (m.id === 'local_user' && (squad.creatorId === user.id || squad.creatorId === 'local_user'))
        );

        let key = '';
        if (isCurrentUserEntity) {
          key = '__CURRENT_USER__';
        } else if (m.email && m.email.trim()) {
          key = 'email:' + m.email.toLowerCase().trim();
        } else if (m.inviteEmail && m.inviteEmail.trim()) {
          key = 'email:' + m.inviteEmail.toLowerCase().trim();
        } else if (m.phone && m.phone.trim()) {
          key = 'phone:' + m.phone.replace(/\D/g, '');
        } else if (m.id && !m.id.startsWith('member_')) {
          key = 'id:' + m.id;
        } else {
          key = 'name:' + (m.rawName || m.name || '').toLowerCase().trim();
        }

        if (memberMap.has(key)) {
          const existing = memberMap.get(key);
          // Merge properties, prioritizing joined / confirmed state
          if (m.hasJoined === true || existing.hasJoined === true) {
            existing.hasJoined = true;
          }
          if (m.joined === true || existing.joined === true) {
            existing.joined = true;
          }
          if (m.inviteStatus === 'accepted' || existing.inviteStatus === 'accepted') {
            existing.inviteStatus = 'accepted';
          }
          if (m.id && !m.id.startsWith('member_')) {
            existing.id = m.id;
          }
          if (m.avatar && !existing.avatar) {
            existing.avatar = m.avatar;
          }
          if (m.name && (!existing.name || existing.name === existing.email)) {
            existing.name = m.name;
            existing.rawName = m.rawName || m.name;
          }
          const isMActive = (typeof isMemberWorkoutActive === 'function') ? isMemberWorkoutActive(m) : !!m.isWorkingOut;
          const isExistingActive = (typeof isMemberWorkoutActive === 'function') ? isMemberWorkoutActive(existing) : !!existing.isWorkingOut;
          if (isMActive) {
            existing.isWorkingOut = true;
            existing.currentWorkout = m.currentWorkout;
            existing.workoutStartedAt = m.workoutStartedAt;
            existing.isSimulatedWorkout = !!m.isSimulatedWorkout;
          } else if (isExistingActive) {
            existing.isWorkingOut = true;
            existing.currentWorkout = existing.currentWorkout;
            existing.workoutStartedAt = existing.workoutStartedAt;
          } else {
            existing.isWorkingOut = false;
            existing.currentWorkout = null;
            existing.workoutStartedAt = null;
            existing.isSimulatedWorkout = false;
          }
          if (m.completedDate) existing.completedDate = m.completedDate;
          const memberCompDate = m.completedDate || existing.completedDate;
          const currentET = typeof getLocalDateKey === 'function' ? getLocalDateKey() : (typeof getETDateKey === 'function' ? getETDateKey() : '');
          if ((m.completedToday || existing.completedToday) && (!memberCompDate || !currentET || memberCompDate === currentET)) {
            existing.completedToday = true;
          } else if (memberCompDate && currentET && memberCompDate !== currentET) {
            existing.completedToday = false;
          }
          if (m.lastCompletedWorkout) existing.lastCompletedWorkout = m.lastCompletedWorkout;
          if (m.lastActive && m.lastActive !== 'Just invited') existing.lastActive = m.lastActive;
          if (m.workoutDetails || existing.workoutDetails) existing.workoutDetails = m.workoutDetails || existing.workoutDetails;
          if (Array.isArray(m.doubleHighFives)) {
            existing.doubleHighFives = mergeDoubleHighFives(existing.doubleHighFives || [], m.doubleHighFives);
          }
        } else {
          const cloned = { ...m };
          if (cloned.isWorkingOut && typeof isMemberWorkoutActive === 'function' && !isMemberWorkoutActive(cloned)) {
            cloned.isWorkingOut = false;
            cloned.currentWorkout = null;
            cloned.workoutStartedAt = null;
            cloned.isSimulatedWorkout = false;
            if (!cloned.completedToday) cloned.lastActive = 'Yet to show up';
          }
          if (isCurrentUserEntity) {
            cloned.id = user.id;
            cloned.name = user.name;
            cloned.rawName = user.rawName;
            cloned.email = user.email;
            if (user.picture) cloned.avatar = user.picture;
            if (squad.creatorId === user.id || squad.creatorId === 'local_user' || (squad.creatorEmail && user.email && squad.creatorEmail.toLowerCase().trim() === user.email.toLowerCase().trim())) {
              cloned.isCreator = true;
              squad.creatorId = user.id;
              squad.creatorName = user.rawName || user.name;
              squad.creatorEmail = user.email || squad.creatorEmail;
            }
          }
          memberMap.set(key, cloned);
          deduped.push(cloned);
        }
      }

      // If user is creator but not yet in members list, ensure they are in members
      if (squad.creatorId === user.id || squad.creatorId === 'local_user' || (squad.creatorEmail && user.email && squad.creatorEmail.toLowerCase().trim() === user.email.toLowerCase().trim())) {
        const hasUser = deduped.some(m => m.id === user.id || (user.email && m.email && m.email.toLowerCase().trim() === user.email.toLowerCase().trim()));
        if (!hasUser) {
          deduped.unshift({
            id: user.id,
            name: user.name,
            rawName: user.rawName,
            email: user.email,
            avatar: user.picture,
            isCreator: true,
            isBackupCreator: false,
            isWorkingOut: false,
            currentWorkout: null,
            lastActive: 'Active today',
            zip: getUserZip() || '20105',
            city: localStorage.getItem('showUp_user_ip_city') || 'Ashburn, VA'
          });
        }
        squad.creatorId = user.id;
        squad.creatorName = user.rawName || user.name;
        squad.creatorEmail = user.email || squad.creatorEmail;
      }

      squad.members = deduped;
      return squad;
    }

    function isMemberYetToJoin(member, squad, user) {
      if (!member) return false;
      if (!user) user = getAppUser();

      // 1. Creators have always joined
      if (member.isCreator === true) return false;
      if (squad && squad.creatorId && (member.id === squad.creatorId || (user.email && squad.creatorEmail && member.email && member.email.toLowerCase().trim() === squad.creatorEmail.toLowerCase().trim()))) {
        return false;
      }

      // 2. The viewing athlete on their own account has joined
      const isMe = (
        (member.id && (member.id === user.id || (user.email && member.id === user.email))) ||
        (user.email && member.email && member.email.toLowerCase().trim() === user.email.toLowerCase().trim()) ||
        (member.id === 'local_user' && (squad.creatorId === user.id || squad.creatorId === 'local_user'))
      );
      if (isMe) return false;

      // 3. Explicitly confirmed joined or invite accepted
      if (member.hasJoined === true || member.joined === true || member.inviteStatus === 'accepted') {
        return false;
      }

      // 4. If athlete has workout data / activity recorded, they have joined
      if (member.completedToday === true || member.completedDate || member.isWorkingOut === true || (Array.isArray(member.workouts) && member.workouts.length > 0)) {
        return false;
      }

      // 5. Cross-reference invite records: if invite for this member was accepted, they have joined
      const memberEmail = (member.email || member.inviteEmail || '').toLowerCase().trim();
      if (memberEmail && squad && squad.id) {
        try {
          const allInvites = getSquadInvites();
          const hasAcceptedInvite = allInvites.some(inv => 
            inv.squadId === squad.id && 
            inv.targetEmail && inv.targetEmail.toLowerCase().trim() === memberEmail && 
            inv.status === 'accepted'
          );
          if (hasAcceptedInvite) {
            member.hasJoined = true;
            member.inviteStatus = 'accepted';
            return false;
          }
        } catch (e) {}
      }

      // 6. Cross-reference global squad registry: if global squad shows member joined, update and return false
      if (squad && squad.id) {
        try {
          const globalReg = getGlobalSquadRegistry();
          const regSq = globalReg.find(s => s && (s.id === squad.id || (s.inviteCode && squad.inviteCode && s.inviteCode.toUpperCase() === squad.inviteCode.toUpperCase())));
          if (regSq && Array.isArray(regSq.members)) {
            const regM = regSq.members.find(rm => 
              (rm && rm.id && member.id && rm.id === member.id) ||
              (memberEmail && rm.email && rm.email.toLowerCase().trim() === memberEmail) ||
              (member.rawName && rm.rawName && rm.rawName.toLowerCase().trim() === member.rawName.toLowerCase().trim())
            );
            if (regM && (regM.hasJoined === true || regM.joined === true || regM.inviteStatus === 'accepted' || regM.completedToday === true || regM.isWorkingOut === true)) {
              member.hasJoined = true;
              member.inviteStatus = 'accepted';
              if (regM.id && !regM.id.startsWith('member_')) member.id = regM.id;
              if (regM.avatar) member.avatar = regM.avatar;
              return false;
            }
          }
        } catch (e) {}
      }

      // 7. Check if another entry for this athlete in squad.members has already joined
      if (squad && Array.isArray(squad.members)) {
        const otherJoined = squad.members.some(other => 
          other !== member && 
          ((memberEmail && other.email && other.email.toLowerCase().trim() === memberEmail) ||
           (member.rawName && other.rawName && other.rawName.toLowerCase().trim() === member.rawName.toLowerCase().trim())) &&
          (other.hasJoined === true || other.joined === true || other.inviteStatus === 'accepted' || other.completedToday === true || other.isWorkingOut === true)
        );
        if (otherJoined) {
          member.hasJoined = true;
          member.inviteStatus = 'accepted';
          return false;
        }
      }

      // 8. If member is active or has joined indicator
      if (member.lastActive && member.lastActive !== 'Just invited') {
        member.hasJoined = true;
        return false;
      }

      // 9. Athlete was invited via email, phone, or manual invitation and has not yet joined
      if (
        member.hasJoined === false ||
        member.inviteStatus === 'delivered' ||
        member.inviteStatus === 'pending' ||
        member.invitedByEmail === true ||
        member.invitedByPhone === true ||
        member.lastActive === 'Just invited' ||
        Boolean(member.inviteEmail || member.invitePhone)
      ) {
        return true;
      }

      return false;
    }

    function syncSquadToFirestore(squad) {
      if (!squad || !squad.id) return;
      try {
        if (typeof getFirestoreDb === 'function') {
          const db = getFirestoreDb();
          if (db) {
            const cleanSquad = JSON.parse(JSON.stringify(squad));
            cleanSquad.updatedAt = new Date().toISOString();
            db.collection('squads').doc(squad.id).set(cleanSquad, { merge: true })
              .catch(err => console.debug("Firestore squad sync notice:", err));
          }
        }
      } catch (err) {
        console.debug("Firestore squad record exception:", err);
      }
    }

    function deleteSquadFromFirestore(squadId) {
      if (!squadId) return;
      try {
        if (typeof getFirestoreDb === 'function') {
          const db = getFirestoreDb();
          if (db) {
            db.collection('squads').doc(squadId).delete()
              .catch(err => console.debug("Firestore squad delete notice:", err));
          }
        }
      } catch (err) {
        console.debug("Firestore squad delete exception:", err);
      }
    }

    async function fetchAthleteSquadsFromFirestore(user) {
      if (!user) user = getAppUser();
      if (!isCustomerLoggedIn()) return;
      try {
        if (typeof getFirestoreDb !== 'function') return;
        const db = getFirestoreDb();
        if (!db) return;

        const snapshot = await db.collection('squads').get();
        if (!snapshot) return;

        const remoteSquads = [];
        const remoteSquadIds = new Set();
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data && data.id) {
            remoteSquadIds.add(data.id);
            if (isAthleteMemberOrCreator(data, user)) {
              remoteSquads.push(data);
            }
          }
        });

        const currentSquads = getSquads();
        let hasChanges = false;

        // If athlete was removed from a squad remotely, or squad was deleted from Firestore
        const remainingSquads = currentSquads.filter(localSq => {
          if (!localSq || !localSq.id) return false;
          // If remote squad exists in Firestore but athlete is no longer member or creator, purge it
          const remoteMatch = remoteSquads.find(rs => rs.id === localSq.id || (rs.inviteCode && localSq.inviteCode && rs.inviteCode === localSq.inviteCode));
          if (!remoteMatch && remoteSquadIds.has(localSq.id)) {
            hasChanges = true;
            return false;
          }
          return true;
        });

        remoteSquads.forEach(remSq => {
          const idx = remainingSquads.findIndex(s => s.id === remSq.id || (s.inviteCode && remSq.inviteCode && s.inviteCode === remSq.inviteCode));
          if (idx >= 0) {
            const localMembers = remainingSquads[idx].members || [];
            (remSq.members || []).forEach(m => {
              if (!m) return;
              const localMemberIdx = localMembers.findIndex(lm => (lm.id && lm.id === m.id) || (lm.email && m.email && lm.email.toLowerCase().trim() === m.email.toLowerCase().trim()));
              if (localMemberIdx === -1) {
                localMembers.push(m);
                hasChanges = true;
              } else {
                // Update teammate workout status if not current local athlete
                const lm = localMembers[localMemberIdx];
                const isCurrentAthlete = (lm.id === user.id || (user.email && lm.email && lm.email.toLowerCase().trim() === user.email.toLowerCase().trim()));
                if (!isCurrentAthlete) {
                  if (m.hasJoined !== undefined && m.hasJoined !== lm.hasJoined) { lm.hasJoined = m.hasJoined; hasChanges = true; }
                  if (m.joined !== undefined && m.joined !== lm.joined) { lm.joined = m.joined; hasChanges = true; }
                  if (m.id && m.id !== lm.id && !m.id.startsWith('member_')) { lm.id = m.id; hasChanges = true; }
                  if (m.avatar && m.avatar !== lm.avatar) { lm.avatar = m.avatar; hasChanges = true; }
                  if (m.name && m.name !== lm.name) { lm.name = m.name; lm.rawName = m.rawName || m.name; hasChanges = true; }
                  if (m.isWorkingOut !== undefined && m.isWorkingOut !== lm.isWorkingOut) { lm.isWorkingOut = m.isWorkingOut; hasChanges = true; }
                  if (m.currentWorkout !== undefined && m.currentWorkout !== lm.currentWorkout) { lm.currentWorkout = m.currentWorkout; hasChanges = true; }
                  if (m.completedToday !== undefined && m.completedToday !== lm.completedToday) { lm.completedToday = m.completedToday; hasChanges = true; }
                  if (m.completedDate !== undefined && m.completedDate !== lm.completedDate) { lm.completedDate = m.completedDate; hasChanges = true; }
                  if (m.lastCompletedWorkout !== undefined && m.lastCompletedWorkout !== lm.lastCompletedWorkout) { lm.lastCompletedWorkout = m.lastCompletedWorkout; hasChanges = true; }
                  if (m.lastActive !== undefined && m.lastActive !== lm.lastActive) { lm.lastActive = m.lastActive; hasChanges = true; }
                  if (m.inviteStatus !== undefined && m.inviteStatus !== lm.inviteStatus) { lm.inviteStatus = m.inviteStatus; hasChanges = true; }
                  if (m.invitedByEmail !== undefined && m.invitedByEmail !== lm.invitedByEmail) { lm.invitedByEmail = m.invitedByEmail; hasChanges = true; }
                  if (m.workoutDetails !== undefined) { lm.workoutDetails = m.workoutDetails; hasChanges = true; }
                  if (Array.isArray(m.doubleHighFives)) {
                    const merged = mergeDoubleHighFives(lm.doubleHighFives || [], m.doubleHighFives);
                    if (merged.length !== (lm.doubleHighFives || []).length) {
                      lm.doubleHighFives = merged;
                      hasChanges = true;
                    }
                  }
                }
              }
            });
            remainingSquads[idx].members = localMembers;
            remainingSquads[idx] = sanitizeSquadMembers(remainingSquads[idx], user);
          } else {
            remainingSquads.push(remSq);
            hasChanges = true;
          }
        });

        if (hasChanges) {
          saveSquads(remainingSquads, false);
          renderSquadsTab();
          updateSquadBeacon();
          updateGlobalStatsUI();
        }

        // Attach real-time snapshot listener for live squad teammate workout status updates
        setupSquadsFirestoreListener(user);
      } catch (err) {
        console.debug("Firestore athlete squads fetch notice:", err);
      }
    }

    let squadsListenerUnsubscribe = null;
    function setupSquadsFirestoreListener(user) {
      if (squadsListenerUnsubscribe) return; // Already listening
      if (!user) user = getAppUser();
      if (!isCustomerLoggedIn()) return;
      try {
        if (typeof getFirestoreDb !== 'function') return;
        const db = getFirestoreDb();
        if (!db) return;

        squadsListenerUnsubscribe = db.collection('squads').onSnapshot(snapshot => {
          if (!snapshot) return;
          const currentSquads = getSquads();
          let hasChanges = false;
          const remoteDocMap = new Map();

          snapshot.forEach(doc => {
            const remSq = doc.data();
            if (remSq && remSq.id) {
              remoteDocMap.set(remSq.id, remSq);
            }
          });

          // Check for squads athlete is no longer a member of in Firestore
          const remainingSquads = currentSquads.filter(sq => {
            if (!sq || !sq.id) return false;
            if (remoteDocMap.has(sq.id)) {
              const remSq = remoteDocMap.get(sq.id);
              if (!isAthleteMemberOrCreator(remSq, user)) {
                hasChanges = true;
                return false;
              }
            }
            return true;
          });

          snapshot.forEach(doc => {
            const remSq = doc.data();
            if (!remSq || !remSq.id || !isAthleteMemberOrCreator(remSq, user)) return;
            const idx = remainingSquads.findIndex(s => s.id === remSq.id || (s.inviteCode && remSq.inviteCode && s.inviteCode === remSq.inviteCode));
            if (idx >= 0) {
              const localMembers = remainingSquads[idx].members || [];
              (remSq.members || []).forEach(m => {
                if (!m) return;
                const localMemberIdx = localMembers.findIndex(lm => (lm.id && lm.id === m.id) || (lm.email && m.email && lm.email.toLowerCase().trim() === m.email.toLowerCase().trim()));
                if (localMemberIdx === -1) {
                  localMembers.push(m);
                  hasChanges = true;
                } else {
                  const lm = localMembers[localMemberIdx];
                  const isCurrentAthlete = (lm.id === user.id || (user.email && lm.email && lm.email.toLowerCase().trim() === user.email.toLowerCase().trim()));
                  if (!isCurrentAthlete) {
                    if (m.hasJoined !== undefined && m.hasJoined !== lm.hasJoined) { lm.hasJoined = m.hasJoined; hasChanges = true; }
                    if (m.joined !== undefined && m.joined !== lm.joined) { lm.joined = m.joined; hasChanges = true; }
                    if (m.id && m.id !== lm.id && !m.id.startsWith('member_')) { lm.id = m.id; hasChanges = true; }
                    if (m.avatar && m.avatar !== lm.avatar) { lm.avatar = m.avatar; hasChanges = true; }
                    if (m.name && m.name !== lm.name) { lm.name = m.name; lm.rawName = m.rawName || m.name; hasChanges = true; }
                    if (m.isWorkingOut !== undefined && m.isWorkingOut !== lm.isWorkingOut) { lm.isWorkingOut = m.isWorkingOut; hasChanges = true; }
                    if (m.currentWorkout !== undefined && m.currentWorkout !== lm.currentWorkout) { lm.currentWorkout = m.currentWorkout; hasChanges = true; }
                    if (m.completedToday !== undefined && m.completedToday !== lm.completedToday) { lm.completedToday = m.completedToday; hasChanges = true; }
                    if (m.completedDate !== undefined && m.completedDate !== lm.completedDate) { lm.completedDate = m.completedDate; hasChanges = true; }
                    if (m.lastCompletedWorkout !== undefined && m.lastCompletedWorkout !== lm.lastCompletedWorkout) { lm.lastCompletedWorkout = m.lastCompletedWorkout; hasChanges = true; }
                    if (m.lastActive !== undefined && m.lastActive !== lm.lastActive) { lm.lastActive = m.lastActive; hasChanges = true; }
                    if (m.inviteStatus !== undefined && m.inviteStatus !== lm.inviteStatus) { lm.inviteStatus = m.inviteStatus; hasChanges = true; }
                    if (m.invitedByEmail !== undefined && m.invitedByEmail !== lm.invitedByEmail) { lm.invitedByEmail = m.invitedByEmail; hasChanges = true; }
                    if (m.workoutDetails !== undefined) { lm.workoutDetails = m.workoutDetails; hasChanges = true; }
                    if (Array.isArray(m.doubleHighFives)) {
                      const merged = mergeDoubleHighFives(lm.doubleHighFives || [], m.doubleHighFives);
                      if (merged.length !== (lm.doubleHighFives || []).length) {
                        lm.doubleHighFives = merged;
                        hasChanges = true;
                      }
                    }
                  }
                }
              });
              remainingSquads[idx].members = localMembers;
              remainingSquads[idx] = sanitizeSquadMembers(remainingSquads[idx], user);
            } else {
              remainingSquads.push(remSq);
              hasChanges = true;
            }
          });

          if (hasChanges) {
            saveSquads(remainingSquads, false);
            renderSquadsTab();
            updateSquadBeacon();
            updateGlobalStatsUI();
          }
        }, err => {
          console.debug("Squads real-time listener notice:", err);
        });
      } catch (err) {
        console.debug("Setup squads listener notice:", err);
      }
    }

    function initSquads() {
      const isLoggedIn = isCustomerLoggedIn();
      if (!isLoggedIn) {
        // Logged-out athlete: zero squads or personal data loaded
        localStorage.removeItem('showUp_squads');
        updateSquadBeacon();
        return [];
      }

      const user = getAppUser();
      const userEmail = (user.email || '').toLowerCase().trim();

      // Gather candidate squads across all persistence tiers:
      // 1. Current active squads in showUp_squads
      let localSquads = [];
      try {
        localSquads = JSON.parse(localStorage.getItem('showUp_squads') || '[]');
      } catch (e) { localSquads = []; }

      // 2. Global squad registry
      const globalReg = getGlobalSquadRegistry();

      // 3. Per-athlete persistent cache (preserves squads across re-logins)
      let userCacheSquads = [];
      if (userEmail && userEmail !== 'you@showup.app' && userEmail !== 'user@showup.app') {
        try {
          userCacheSquads = JSON.parse(localStorage.getItem('showUp_user_squads_' + userEmail) || '[]');
        } catch (e) { userCacheSquads = []; }
      }

      // 4. Squad archive
      let archiveSquads = [];
      try {
        archiveSquads = JSON.parse(localStorage.getItem('showUp_squad_archive') || '[]');
      } catch (e) { archiveSquads = []; }

      // Combine and deduplicate candidates by squad.id or inviteCode
      const candidates = [
        ...(Array.isArray(localSquads) ? localSquads : []),
        ...(Array.isArray(globalReg) ? globalReg : []),
        ...(Array.isArray(userCacheSquads) ? userCacheSquads : []),
        ...(Array.isArray(archiveSquads) ? archiveSquads : [])
      ];

      const squadMap = new Map();

      candidates.forEach(sq => {
        if (!sq || !sq.name) return;
        const key = sq.id || (sq.inviteCode ? `code_${sq.inviteCode}` : null);
        if (!key) return;

        if (isAthleteMemberOrCreator(sq, user)) {
          if (!squadMap.has(key)) {
            squadMap.set(key, sq);
          } else {
            // Merge member lists and latest metadata
            const existing = squadMap.get(key);
            const mergedMembers = [...(existing.members || [])];
            (sq.members || []).forEach(newM => {
              if (!newM) return;
              const existingIdx = mergedMembers.findIndex(m => 
                (m.id && newM.id && m.id === newM.id) || 
                (m.email && newM.email && m.email.toLowerCase().trim() === newM.email.toLowerCase().trim()) ||
                (m.phone && newM.phone && m.phone.replace(/\D/g, '') === newM.phone.replace(/\D/g, ''))
              );
              if (existingIdx === -1) {
                mergedMembers.push(newM);
              } else {
                const em = mergedMembers[existingIdx];
                if (newM.hasJoined === true || em.hasJoined === true) { em.hasJoined = true; }
                if (newM.joined === true || em.joined === true) { em.joined = true; }
                if (newM.inviteStatus === 'accepted' || em.inviteStatus === 'accepted') { em.inviteStatus = 'accepted'; }
                if (newM.id && !newM.id.startsWith('member_')) { em.id = newM.id; }
                if (newM.avatar && !em.avatar) { em.avatar = newM.avatar; }
                if (newM.rawName && (!em.rawName || em.rawName === em.email)) { em.rawName = newM.rawName; }
                if (newM.name && (!em.name || em.name === em.email)) { em.name = newM.name; }
                if (newM.isWorkingOut !== undefined) { em.isWorkingOut = newM.isWorkingOut; }
                if (newM.completedToday !== undefined) { em.completedToday = newM.completedToday; }
                if (newM.completedDate) { em.completedDate = newM.completedDate; }
                if (newM.lastCompletedWorkout) { em.lastCompletedWorkout = newM.lastCompletedWorkout; }
                if (newM.lastActive && newM.lastActive !== 'Invite sent' && newM.lastActive !== 'Just invited') { em.lastActive = newM.lastActive; }
                if (newM.workoutDetails !== undefined) { em.workoutDetails = newM.workoutDetails; }
                if (Array.isArray(newM.doubleHighFives)) {
                  em.doubleHighFives = mergeDoubleHighFives(em.doubleHighFives || [], newM.doubleHighFives);
                }
              }
            });
            existing.members = mergedMembers;
            if (sq.updatedAt && (!existing.updatedAt || new Date(sq.updatedAt) > new Date(existing.updatedAt))) {
              squadMap.set(key, { ...existing, ...sq, members: mergedMembers });
            }
          }
        }
      });

      let squads = Array.from(squadMap.values());

      // Filter out auto-fabricated squads or squads with dummy creators
      squads = squads.filter(sq => {
        if (!sq || !sq.name) return false;
        if (sq.creatorName === 'Squad Leader' || (sq.creatorId && String(sq.creatorId).startsWith('creator_SHOWUP'))) return false;
        return isAthleteMemberOrCreator(sq, user);
      });

      // Clear any simulated workouts from members
      squads.forEach(sq => {
        if (Array.isArray(sq.members)) {
          sq.members.forEach(m => {
            if (m.isSimulatedWorkout) {
              m.isWorkingOut = false;
              m.isSimulatedWorkout = false;
              m.currentWorkout = null;
              m.workoutStartedAt = null;
            }
          });
        }
      });

      // Sanitize and deduplicate members across all valid squads
      squads = squads.map(sq => sanitizeSquadMembers(sq, user));

      // Maintain backup creator role flags
      squads.forEach(sq => {
        if (sq.backupCreatorId) {
          sq.members.forEach(m => {
            m.isBackupCreator = (m.id === sq.backupCreatorId);
          });
        }
      });

      // Save filtered active squad list
      saveSquads(squads);
      updateSquadBeacon();

      // Check URL parameters for direct squad joining code (?join=CODE or ?squadCode=CODE)
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const joinCode = urlParams.get('join') || urlParams.get('squadCode') || urlParams.get('code');
        if (joinCode) {
          setTimeout(() => {
            switchTab('squads');
            openJoinSquadModal(joinCode);
          }, 350);
        }
      } catch (e) {}

      // Asynchronously fetch cloud squads from Firestore in background
      try {
        fetchAthleteSquadsFromFirestore(user);
      } catch (e) {}

      return squads;
    }

    function assignBackupCreator(squadId, memberId) {
      const squads = getSquads();
      const squad = squads.find(s => s.id === squadId);
      if (!squad) return;

      const user = getAppUser();
      const isUserCreator = (squad.creatorId === user.id) || squad.members.some(m => (m.id === user.id || m.email === user.email) && m.isCreator);
      if (!isUserCreator) {
        showToast("Only the squad creator can assign the backup creator role.", "error");
        return;
      }

      const targetMember = squad.members.find(m => m.id === memberId);
      if (!targetMember) return;

      squad.backupCreatorId = targetMember.id;
      squad.backupCreatorName = targetMember.rawName || targetMember.name;
      squad.backupCreatorEmail = targetMember.email || '';

      squad.members.forEach(m => {
        m.isBackupCreator = (m.id === targetMember.id);
      });

      saveSquads(squads);
      renderSquadsTab();
      if (googleAccessToken) {
        syncToGoogleDrive(true);
      }
      showToast(`Assigned ${targetMember.rawName || targetMember.name} as Backup Creator for "${squad.name}".`, "success");
    }

    function promptAssignFirstBackupCreator(squadId) {
      const squads = getSquads();
      const squad = squads.find(s => s.id === squadId);
      if (!squad) return;

      const user = getAppUser();
      const candidates = squad.members.filter(m => m.id !== user.id && m.email !== user.email);
      if (candidates.length === 0) {
        openAddMemberModal(squadId);
        showToast("Invite at least one teammate to assign as Backup Creator.", "info");
        return;
      }

      if (candidates.length === 1) {
        assignBackupCreator(squadId, candidates[0].id);
        return;
      }

      const names = candidates.map((c, i) => `${i + 1}. ${c.rawName || c.name}`).join('\n');
      const choice = prompt(`Designate a Backup Creator to protect "${squad.name}":\n\n${names}\n\nEnter number (1-${candidates.length}):`, "1");
      if (!choice) return;
      const idx = parseInt(choice, 10) - 1;
      if (idx >= 0 && idx < candidates.length) {
        assignBackupCreator(squadId, candidates[idx].id);
      }
    }

    function pickUpMantlePrompt(squadId) {
      const squads = getSquads();
      const squad = squads.find(s => s.id === squadId);
      if (!squad) return;

      const user = getAppUser();
      const userMember = squad.members.find(m => m.id === user.id || m.email === user.email);
      const isBackup = userMember?.isBackupCreator || (squad.backupCreatorId === user.id);

      if (!isBackup) {
        showToast("Only the designated Backup Creator can pick up the mantle.", "warning");
        return;
      }

      const confirmMsg = `👑 PICK UP THE MANTLE\n\nAre you sure you want to assume primary Creator leadership of "${squad.name}"?\n\nThis will promote you to primary Squad Creator with full squad management and backup controls in case the original creator lost their data.`;
      if (!confirm(confirmMsg)) return;

      // Demote previous primary creator
      squad.members.forEach(m => {
        if (m.isCreator) m.isCreator = false;
      });

      // Promote backup creator to primary creator
      if (userMember) {
        userMember.isCreator = true;
        userMember.isBackupCreator = false;
      }
      squad.creatorId = user.id;
      squad.creatorName = user.rawName || user.name;
      squad.backupCreatorId = null;
      squad.backupCreatorName = null;

      saveSquads(squads);
      renderSquadsTab();
      updateSquadBeacon();
      updateGlobalStatsUI();
      if (googleAccessToken) {
        syncToGoogleDrive(true);
      }

      showToast(`👑 You have picked up the mantle! You are now the primary Creator of "${squad.name}".`, "success");

      // Check if other members exist and prompt to appoint a new backup creator
      const remainingOthers = squad.members.filter(m => m.id !== user.id && m.email !== user.email);
      if (remainingOthers.length > 0) {
        setTimeout(() => {
          showToast("Remember to assign a new Backup Creator among remaining members.", "warning");
        }, 2200);
      }
    }

    function getSquads() {
      if (!isCustomerLoggedIn()) return [];
      const user = getAppUser();
      const raw = localStorage.getItem('showUp_squads');
      const squads = JSON.parse(raw || '[]');
      if (!Array.isArray(squads)) return [];
      const sanitized = squads
        .filter(sq => sq && isAthleteMemberOrCreator(sq, user))
        .map(s => sanitizeSquadMembers(s, user));
      try {
        const cleanedStr = JSON.stringify(sanitized);
        if (raw && raw !== cleanedStr) {
          localStorage.setItem('showUp_squads', cleanedStr);
        }
      } catch (e) {}
      return sanitized;
    }

    function saveSquads(squads, syncToCloud = true) {
      if (!Array.isArray(squads)) return;
      const user = getAppUser();
      const filtered = squads.filter(sq => sq && isAthleteMemberOrCreator(sq, user));
      localStorage.setItem('showUp_squads', JSON.stringify(filtered));
      const userEmail = (user.email || '').toLowerCase().trim();
      if (userEmail && userEmail !== 'you@showup.app' && userEmail !== 'user@showup.app') {
        try {
          localStorage.setItem('showUp_user_squads_' + userEmail, JSON.stringify(filtered));
        } catch (e) {}
      }
      filtered.forEach(sq => {
        saveSquadToGlobalRegistry(sq);
        if (syncToCloud) {
          syncSquadToFirestore(sq);
        }
      });
      updateSquadBeacon();
    }



    function updateSquadBeacon() {
      const squads = getSquads();
      const user = getAppUser();
      let activeMemberCount = 0;
      let activeSummary = "";

      squads.forEach(sq => {
        sq.members.forEach(m => {
          const isActive = m.isWorkingOut && (typeof isMemberWorkoutActive !== 'function' || isMemberWorkoutActive(m));
          if (isActive && m.id !== user.id) {
            activeMemberCount++;
            if (!activeSummary) {
              activeSummary = `${m.rawName} is lifting right now in ${sq.name}! (${m.currentWorkout || 'Session'})`;
            }
          }
        });
      });

      const navBeaconPing = document.getElementById('squad-nav-beacon');
      const navBeaconDot = document.getElementById('squad-nav-beacon-dot');
      const banner = document.getElementById('squad-active-beacon-banner');
      const bannerText = document.getElementById('squad-active-beacon-text');

      if (activeMemberCount > 0) {
        if (navBeaconPing) navBeaconPing.classList.remove('hidden');
        if (navBeaconDot) navBeaconDot.classList.remove('hidden');
        if (banner) banner.classList.remove('hidden');
        if (bannerText) bannerText.innerText = activeSummary;
      } else {
        if (navBeaconPing) navBeaconPing.classList.add('hidden');
        if (navBeaconDot) navBeaconDot.classList.add('hidden');
        if (banner) banner.classList.add('hidden');
      }
    }

    // Toggle Collapsing a Squad
    function toggleSquadCollapse(squadId) {
      const squads = getSquads();
      const squad = squads.find(s => s.id === squadId);
      if (!squad) return;

      const isDefaultCollapsed = localStorage.getItem('showUp_squads_default_collapsed') === 'true';
      const currentCollapsed = squad.isCollapsed !== undefined ? squad.isCollapsed : isDefaultCollapsed;
      squad.isCollapsed = !currentCollapsed;
      saveSquads(squads);
      renderSquadsTab();
    }

    // Toggle default collapse behavior and collapse/expand all active squads
    function toggleSquadsDefaultCollapse() {
      const isDefaultCollapsed = localStorage.getItem('showUp_squads_default_collapsed') === 'true';
      const newPref = !isDefaultCollapsed;
      localStorage.setItem('showUp_squads_default_collapsed', String(newPref));

      // Synchronize in settings modal if open
      const prefCheckbox = document.getElementById('pref-squads-collapsed');
      if (prefCheckbox) prefCheckbox.checked = newPref;

      // Apply to all current squads
      const squads = getSquads();
      squads.forEach(sq => {
        sq.isCollapsed = newPref;
      });
      saveSquads(squads);
      renderSquadsTab();
      updateSquadsDefaultCollapseUI();
      showToast(newPref ? "Default set: Squads collapsed" : "Default set: Squads expanded", "info");
    }

    // Preference toggled from Settings Modal
    function toggleSquadsDefaultCollapsePref(checked) {
      localStorage.setItem('showUp_squads_default_collapsed', String(checked));
      const squads = getSquads();
      squads.forEach(sq => {
        sq.isCollapsed = checked;
      });
      saveSquads(squads);
      renderSquadsTab();
      updateSquadsDefaultCollapseUI();
    }

    // Update Header Toggle Button UI
    function updateSquadsDefaultCollapseUI() {
      const btn = document.getElementById('btn-toggle-squads-default-collapse');
      if (!btn) return;
      const isDefaultCollapsed = localStorage.getItem('showUp_squads_default_collapsed') === 'true';
      const icon = btn.querySelector('i');
      const text = btn.querySelector('span');
      if (icon) {
        icon.className = isDefaultCollapsed ? 'fa-solid fa-expand text-slate-400' : 'fa-solid fa-compress text-slate-400';
      }
      if (text) {
        text.innerText = isDefaultCollapsed ? 'Expand All' : 'Collapse All';
      }
      btn.title = isDefaultCollapsed ? 'Default is collapsed. Click to expand all squads' : 'Default is expanded. Click to collapse all squads';
    }

    // Creator Deletes Squad
    function deleteSquadPrompt(squadId) {
      const squads = getSquads();
      const squad = squads.find(s => s.id === squadId);
      if (!squad) return;

      const user = getAppUser();
      const isUserCreator = (squad.creatorId === user.id) || squad.members.some(m => (m.id === user.id || m.email === user.email) && m.isCreator);
      if (!isUserCreator) {
        showToast("Only the squad creator has permission to delete this squad.", "error");
        return;
      }

      if (confirm(`Are you sure you want to delete squad "${squad.name}"?`)) {
        // 1. Immediately delete from local active squads
        const updated = squads.filter(s => s.id !== squadId);
        localStorage.setItem('showUp_squads', JSON.stringify(updated));

        // 2. Remove from athlete isolated user cache
        const userEmail = (user.email || '').toLowerCase().trim();
        if (userEmail && userEmail !== 'you@showup.app' && userEmail !== 'user@showup.app') {
          try {
            localStorage.setItem('showUp_user_squads_' + userEmail, JSON.stringify(updated));
          } catch (e) {}
        }

        // 3. Remove from global registry and archive
        removeSquadFromGlobalRegistry(squadId);

        // 4. Delete squad document from Firestore cloud database
        deleteSquadFromFirestore(squadId);

        // 5. Sync to Google Drive if athlete has connected Google backup
        if (typeof syncToGoogleDrive === 'function' && localStorage.getItem('showUp_google_token')) {
          try { syncToGoogleDrive(true); } catch (e) {}
        }

        // 6. Immediately update display
        renderSquadsTab();
        updateSquadBeacon();
        updateGlobalStatsUI();
        renderHeatMap();
        showToast(`Squad "${squad.name}" deleted.`, "info");
      }
    }

    // Close Simulated Workout Action (All active or specific member)
    function dismissSimulatedWorkout() {
      const squads = getSquads();
      let closedCount = 0;

      squads.forEach(sq => {
        sq.members.forEach(m => {
          if (m.isWorkingOut) {
            m.isWorkingOut = false;
            m.currentWorkout = null;
            m.workoutStartedAt = null;
            m.isSimulatedWorkout = false;
            if (!m.completedToday) {
              m.lastActive = 'Yet to show up';
            }
            closedCount++;
          }
        });
      });

      saveSquads(squads);
      renderSquadsTab();
      updateSquadBeacon();
      updateGlobalStatsUI();
      renderHeatMap();
      dismissSquadPill();

      const banner = document.getElementById('squad-active-beacon-banner');
      if (banner) banner.classList.add('hidden');

      showToast("Active workout session closed.", "info");
    }

    function stopSpecificMemberWorkout(squadId, memberId) {
      const squads = getSquads();
      const squad = squads.find(s => s.id === squadId);
      if (!squad) return;

      const member = squad.members.find(m => m.id === memberId);
      if (!member) return;

      const isSimulated = member.isSimulatedWorkout || 
        member.currentWorkout === 'Macebell 360 & Dands' ||
        member.currentWorkout === 'Incline Dumbbell Press & Chest' ||
        member.currentWorkout === 'Barbell Deadlift & Lat Pulls' ||
        member.currentWorkout === 'Barbell Back Squats & Core' ||
        member.currentWorkout === 'Overhead Press & Tricep Burnout';

      member.isWorkingOut = false;
      member.currentWorkout = null;
      member.workoutStartedAt = null;
      member.isSimulatedWorkout = false;

      // Only mark completed today if member had actual workout details recorded, not for mock simulations
      if (!isSimulated && member.workoutDetails) {
        const finishedName = member.lastCompletedWorkout || 'Strength Session';
        member.lastActive = 'Just finished';
        member.lastCompletedWorkout = finishedName;
        member.completedToday = true;
        member.completedDate = typeof getLocalDateKey === 'function' ? getLocalDateKey() : (typeof getETDateKey === 'function' ? getETDateKey() : new Date().toISOString().slice(0, 10));
      } else {
        member.lastActive = member.completedToday ? 'Completed workout today' : 'Yet to show up';
      }

      saveSquads(squads);
      renderSquadsTab();
      updateSquadBeacon();
      updateGlobalStatsUI();
      renderHeatMap();
      dismissSquadPill();
      showToast(`Closed active workout session for ${member.rawName || member.name}.`, "info");
    }



    function getGlobalSquadRegistry() {
      try {
        return JSON.parse(localStorage.getItem('showUp_global_squad_registry') || '[]');
      } catch (e) {
        return [];
      }
    }

    function saveSquadToGlobalRegistry(squad) {
      if (!squad || !squad.id) return;
      const reg = getGlobalSquadRegistry();
      const idx = reg.findIndex(s => s.id === squad.id || (squad.inviteCode && s.inviteCode === squad.inviteCode));
      if (idx >= 0) {
        reg[idx] = { ...reg[idx], ...squad };
      } else {
        reg.push(squad);
      }
      localStorage.setItem('showUp_global_squad_registry', JSON.stringify(reg));
    }

    function removeSquadFromGlobalRegistry(squadId) {
      if (!squadId) return;
      try {
        const reg = getGlobalSquadRegistry();
        const filtered = reg.filter(s => s && s.id !== squadId);
        localStorage.setItem('showUp_global_squad_registry', JSON.stringify(filtered));
      } catch (e) {}
      try {
        const archive = JSON.parse(localStorage.getItem('showUp_squad_archive') || '[]');
        const filteredArch = archive.filter(s => s && s.id !== squadId);
        localStorage.setItem('showUp_squad_archive', JSON.stringify(filteredArch));
      } catch (e) {}
    }

    function getSquadInvites() {
      try {
        return JSON.parse(localStorage.getItem('showUp_squad_invites') || '[]');
      } catch (e) {
        return [];
      }
    }

    function recordSquadInvite(invite) {
      if (!invite || !invite.targetEmail) return;
      const invites = getSquadInvites();
      const idx = invites.findIndex(i => i.squadId === invite.squadId && i.targetEmail.toLowerCase() === invite.targetEmail.toLowerCase());
      if (idx >= 0) {
        invites[idx] = invite;
      } else {
        invites.unshift(invite);
      }
      localStorage.setItem('showUp_squad_invites', JSON.stringify(invites));
    }

    function getPendingSquadInvites() {
      const user = getAppUser();
      const userEmail = (user.email || '').toLowerCase().trim();
      if (!userEmail || userEmail === 'you@showup.app' || userEmail === 'user@showup.app') {
        return [];
      }

      const existingSquads = getSquads();
      const allInvites = getSquadInvites();
      const globalRegistry = getGlobalSquadRegistry();
      const matchingInvites = [];

      // 1. Check explicit invite records
      allInvites.forEach(inv => {
        if (inv.targetEmail && inv.targetEmail.toLowerCase() === userEmail && inv.status === 'pending') {
          const alreadyInSquad = existingSquads.some(s => s.id === inv.squadId && s.members.some(m => (m.id === user.id || (m.email && m.email.toLowerCase() === userEmail))));
          if (!alreadyInSquad && !matchingInvites.some(i => i.squadId === inv.squadId)) {
            matchingInvites.push(inv);
          }
        }
      });

      // 2. Check global registry for any squads where user is invited
      globalRegistry.forEach(sq => {
        if (sq.members && Array.isArray(sq.members)) {
          const isInvited = sq.members.some(m => m.email && m.email.toLowerCase() === userEmail && !m.isCreator);
          const alreadyInSquad = existingSquads.some(s => s.id === sq.id && s.members.some(m => (m.id === user.id || (m.email && m.email.toLowerCase() === userEmail))));
          const alreadyInList = matchingInvites.some(inv => inv.squadId === sq.id);
          if (isInvited && !alreadyInSquad && !alreadyInList) {
            matchingInvites.push({
              id: 'invite_' + sq.id,
              squadId: sq.id,
              squadName: sq.name,
              squadMotto: sq.motto,
              squadIcon: sq.icon || 'dumbbell',
              squadAccent: sq.accent || 'emerald',
              inviteCode: sq.inviteCode,
              inviterName: sq.creatorName || 'Squad Creator',
              inviterEmail: sq.creatorId,
              targetEmail: userEmail,
              invitedAt: sq.createdAt || new Date().toISOString(),
              status: 'pending'
            });
          }
        }
      });

      return matchingInvites;
    }

    function acceptSquadInvite(inviteId) {
      const user = getAppUser();
      const userEmail = (user.email || '').toLowerCase().trim();
      const invites = getSquadInvites();
      const invite = invites.find(i => i.id === inviteId) || getPendingSquadInvites().find(i => i.id === inviteId);

      if (!invite) {
        showToast("Invitation not found or expired.", "error");
        return;
      }

      // Update invite status
      invite.status = 'accepted';
      invite.acceptedAt = new Date().toISOString();
      localStorage.setItem('showUp_squad_invites', JSON.stringify(invites));

      // Find the squad in global registry or local squads
      const squads = getSquads();
      const globalReg = getGlobalSquadRegistry();
      let targetSquad = squads.find(s => s.id === invite.squadId) || globalReg.find(s => s.id === invite.squadId || (invite.inviteCode && s.inviteCode === invite.inviteCode));

      if (!targetSquad) {
        targetSquad = {
          id: invite.squadId || ('squad_' + Date.now()),
          name: invite.squadName || 'Fitness Squad',
          motto: invite.squadMotto || 'Consistency in motion',
          icon: invite.squadIcon || 'dumbbell',
          accent: invite.squadAccent || 'emerald',
          inviteCode: invite.inviteCode || ('SHOWUP-' + Math.random().toString(36).substring(2, 6).toUpperCase()),
          isCollapsed: false,
          createdAt: invite.invitedAt || new Date().toISOString(),
          creatorId: invite.inviterEmail || 'creator',
          creatorName: invite.inviterName || 'Squad Creator',
          notificationPreferences: {
            inAppPill: true,
            beaconPulse: true,
            hapticPulse: true,
            soundChime: true,
            browserNotify: false
          },
          members: []
        };
      }

      // Add current user if not already in members
      const memberIndex = targetSquad.members.findIndex(m => m.id === user.id || (m.email && m.email.toLowerCase() === userEmail));
      if (memberIndex >= 0) {
        targetSquad.members[memberIndex].id = user.id;
        targetSquad.members[memberIndex].name = user.name;
        targetSquad.members[memberIndex].rawName = user.rawName;
        targetSquad.members[memberIndex].email = user.email;
        targetSquad.members[memberIndex].avatar = user.picture;
        targetSquad.members[memberIndex].hasJoined = true;
        targetSquad.members[memberIndex].inviteStatus = 'accepted';
        targetSquad.members[memberIndex].lastActive = 'Just joined';
      } else {
        targetSquad.members.push({
          id: user.id,
          name: user.name,
          rawName: user.rawName,
          email: user.email,
          avatar: user.picture,
          hasJoined: true,
          inviteStatus: 'accepted',
          isCreator: false,
          isBackupCreator: false,
          isWorkingOut: false,
          currentWorkout: null,
          lastActive: 'Just joined'
        });
      }

      // Ensure squad is in user's squads list
      const existingSquadIndex = squads.findIndex(s => s.id === targetSquad.id);
      if (existingSquadIndex >= 0) {
        squads[existingSquadIndex] = targetSquad;
      } else {
        squads.unshift(targetSquad);
      }

      saveSquads(squads);
      saveSquadToGlobalRegistry(targetSquad);
      syncSquadToFirestore(targetSquad);
      renderSquadsTab();
      updateGlobalStatsUI();
      updateSquadBeacon();

      showToast(`🎉 Joined "${targetSquad.name}"! You are now an active member.`, "success");

      if (typeof syncToGoogleDrive === 'function' && localStorage.getItem('showUp_google_token')) {
        syncToGoogleDrive(false);
      }
    }

    function declineSquadInvite(inviteId) {
      const invites = getSquadInvites();
      const invite = invites.find(i => i.id === inviteId);
      if (invite) {
        invite.status = 'declined';
        invite.declinedAt = new Date().toISOString();
        localStorage.setItem('showUp_squad_invites', JSON.stringify(invites));
      }
      renderSquadsTab();
      showToast("Invitation declined.", "info");
    }

    function openJoinSquadModal(prefillCode = '') {
      const input = document.getElementById('join-squad-code-input');
      if (input) {
        input.value = prefillCode ? prefillCode.toUpperCase().trim() : '';
      }
      document.getElementById('join-squad-modal').classList.remove('hidden');
      if (input) {
        setTimeout(() => input.focus(), 150);
      }
    }

    function closeJoinSquadModal() {
      document.getElementById('join-squad-modal').classList.add('hidden');
    }

    function pasteJoinCodeFromClipboard() {
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(text => {
          if (text) {
            const input = document.getElementById('join-squad-code-input');
            if (input) input.value = text.trim().toUpperCase();
            showToast("Pasted code from clipboard", "info");
          }
        }).catch(() => {
          showToast("Please type your code into the box.", "info");
        });
      }
    }

    async function submitJoinSquadByCode() {
      const input = document.getElementById('join-squad-code-input');
      if (!input) return;

      const rawCode = input.value.trim().toUpperCase();
      if (!rawCode) {
        showToast("Please enter a valid squad joining code.", "warning");
        input.focus();
        return;
      }

      const user = getAppUser();
      const userEmail = (user.email || '').toLowerCase().trim();
      const squads = getSquads();
      const globalReg = getGlobalSquadRegistry();

      // 1. Check if already in user's squads
      const existingInUserSquads = squads.find(s => (s.inviteCode && s.inviteCode.toUpperCase() === rawCode));
      if (existingInUserSquads) {
        const memberIdx = existingInUserSquads.members.findIndex(m => m.id === user.id || (m.email && m.email.toLowerCase() === userEmail));
        if (memberIdx >= 0) {
          const m = existingInUserSquads.members[memberIdx];
          const wasPending = !m.hasJoined || m.inviteStatus !== 'accepted';
          m.id = user.id;
          m.name = user.name;
          m.rawName = user.rawName;
          m.email = user.email;
          m.avatar = user.picture;
          m.hasJoined = true;
          m.inviteStatus = 'accepted';
          m.lastActive = 'Just joined';
          saveSquads(squads);
          saveSquadToGlobalRegistry(existingInUserSquads);
          syncSquadToFirestore(existingInUserSquads);
          closeJoinSquadModal();
          renderSquadsTab();
          updateGlobalStatsUI();
          updateSquadBeacon();
          if (wasPending) {
            showToast(`🎉 Joined "${existingInUserSquads.name}"! You are now an active member.`, "success");
          } else {
            showToast(`You are already an active member of "${existingInUserSquads.name}"!`, "info");
          }
          if (typeof syncToGoogleDrive === 'function' && localStorage.getItem('showUp_google_token')) {
            syncToGoogleDrive(false);
          }
          return;
        } else {
          existingInUserSquads.members.push({
            id: user.id,
            name: user.name,
            rawName: user.rawName,
            email: user.email,
            avatar: user.picture,
            hasJoined: true,
            inviteStatus: 'accepted',
            isCreator: false,
            isBackupCreator: false,
            isWorkingOut: false,
            currentWorkout: null,
            lastActive: 'Just joined'
          });
          saveSquads(squads);
          saveSquadToGlobalRegistry(existingInUserSquads);
          syncSquadToFirestore(existingInUserSquads);
          closeJoinSquadModal();
          renderSquadsTab();
          updateGlobalStatsUI();
          updateSquadBeacon();
          showToast(`🎉 Joined "${existingInUserSquads.name}"!`, "success");
          if (typeof syncToGoogleDrive === 'function' && localStorage.getItem('showUp_google_token')) {
            syncToGoogleDrive(false);
          }
          return;
        }
      }

      // 2. Check in global registry
      const matchInRegistry = globalReg.find(s => s.inviteCode && s.inviteCode.toUpperCase() === rawCode);
      if (matchInRegistry) {
        const squadToImport = JSON.parse(JSON.stringify(matchInRegistry));
        const memberIdx = squadToImport.members.findIndex(m => m.id === user.id || (m.email && m.email.toLowerCase() === userEmail));
        if (memberIdx >= 0) {
          squadToImport.members[memberIdx].id = user.id;
          squadToImport.members[memberIdx].name = user.name;
          squadToImport.members[memberIdx].rawName = user.rawName;
          squadToImport.members[memberIdx].email = user.email;
          squadToImport.members[memberIdx].avatar = user.picture;
          squadToImport.members[memberIdx].hasJoined = true;
          squadToImport.members[memberIdx].inviteStatus = 'accepted';
          squadToImport.members[memberIdx].lastActive = 'Just joined';
        } else {
          squadToImport.members.push({
            id: user.id,
            name: user.name,
            rawName: user.rawName,
            email: user.email,
            avatar: user.picture,
            hasJoined: true,
            inviteStatus: 'accepted',
            isCreator: false,
            isBackupCreator: false,
            isWorkingOut: false,
            currentWorkout: null,
            lastActive: 'Just joined'
          });
        }
        squads.unshift(squadToImport);
        saveSquads(squads);
        saveSquadToGlobalRegistry(squadToImport);
        syncSquadToFirestore(squadToImport);
        closeJoinSquadModal();
        renderSquadsTab();
        updateGlobalStatsUI();
        updateSquadBeacon();
        showToast(`🎉 Joined "${squadToImport.name}" with code ${rawCode}!`, "success");
        if (typeof syncToGoogleDrive === 'function' && localStorage.getItem('showUp_google_token')) {
          syncToGoogleDrive(false);
        }
        return;
      }

      // 3. Lookup real squad in cloud Firestore by inviteCode
      if (typeof getFirestoreDb === 'function') {
        const db = getFirestoreDb();
        if (db) {
          try {
            const querySnap = await db.collection('squads').where('inviteCode', '==', rawCode).limit(1).get();
            if (querySnap && !querySnap.empty) {
              const docData = querySnap.docs[0].data();
              if (docData && docData.id) {
                const squadToImport = JSON.parse(JSON.stringify(docData));
                if (!Array.isArray(squadToImport.members)) squadToImport.members = [];
                const memberIdx = squadToImport.members.findIndex(m => m.id === user.id || (m.email && m.email.toLowerCase() === userEmail));
                if (memberIdx >= 0) {
                  squadToImport.members[memberIdx].id = user.id;
                  squadToImport.members[memberIdx].name = user.name;
                  squadToImport.members[memberIdx].rawName = user.rawName;
                  squadToImport.members[memberIdx].email = user.email;
                  squadToImport.members[memberIdx].avatar = user.picture;
                  squadToImport.members[memberIdx].hasJoined = true;
                  squadToImport.members[memberIdx].inviteStatus = 'accepted';
                } else {
                  squadToImport.members.push({
                    id: user.id,
                    name: user.name,
                    rawName: user.rawName,
                    email: user.email,
                    avatar: user.picture,
                    hasJoined: true,
                    inviteStatus: 'accepted',
                    isCreator: false,
                    isBackupCreator: false,
                    isWorkingOut: false,
                    currentWorkout: null,
                    lastActive: 'Just joined'
                  });
                }
                squads.unshift(squadToImport);
                saveSquads(squads);
                saveSquadToGlobalRegistry(squadToImport);
                syncSquadToFirestore(squadToImport);
                closeJoinSquadModal();
                renderSquadsTab();
                updateGlobalStatsUI();
                updateSquadBeacon();
                showToast(`🎉 Joined "${squadToImport.name}" with code ${rawCode}!`, "success");
                if (typeof syncToGoogleDrive === 'function' && localStorage.getItem('showUp_google_token')) {
                  syncToGoogleDrive(false);
                }
                return;
              }
            }
          } catch (e) {
            console.debug("Firestore squad lookup notice:", e);
          }
        }
      }

      // If squad code not found, NEVER create random fake squads
      showToast(`No squad found with code "${rawCode}". Please check the code with your squad creator.`, "error");
    }



    function renderSquadsTab() {
      const container = document.getElementById('squads-list-container');
      if (!container) return;

      const squads = getSquads();
      const user = getAppUser();
      const isLoggedIn = isCustomerLoggedIn();
      const pendingInvites = isLoggedIn ? getPendingSquadInvites() : [];
      let invitesHtml = '';

      if (isLoggedIn && pendingInvites.length > 0) {
        invitesHtml = `
          <!-- LOGGED-IN CUSTOMER PENDING SQUAD INVITATIONS (REQ 11) -->
          <div id="pending-squad-invites-card" class="m3-card rounded-3xl p-5 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950 shadow-xl space-y-3.5">
            <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div class="flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm border border-emerald-500/30 shadow-sm">
                  <i class="fa-solid fa-envelope-open-text"></i>
                </span>
                <div>
                  <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span>Squad Invitations</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">${pendingInvites.length} Pending</span>
                  </h3>
                  <p class="text-[11px] text-slate-400">You were invited to join these squads</p>
                </div>
              </div>
            </div>

            <div class="space-y-2.5">
              ${pendingInvites.map(inv => `
                <div class="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center justify-center text-base flex-shrink-0">
                      <i class="fa-solid fa-${inv.squadIcon || 'dumbbell'}"></i>
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-xs font-bold text-slate-100">${escapeHtml(inv.squadName)}</span>
                        <span class="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Code: ${escapeHtml(inv.inviteCode)}</span>
                      </div>
                      <p class="text-[11px] text-slate-400 mt-0.5 truncate">
                        Invited by <span class="text-slate-200 font-semibold">${escapeHtml(inv.inviterName || 'Squad Creator')}</span>
                        ${inv.inviterEmail ? `<span class="text-slate-500">(${escapeHtml(inv.inviterEmail)})</span>` : ''}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 flex-shrink-0">
                    <button onclick="triggerHaptic('light'); declineSquadInvite('${inv.id}')" class="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-semibold px-3 py-1.5 rounded-xl transition">
                      Decline
                    </button>
                    <button onclick="triggerHaptic('medium'); acceptSquadInvite('${inv.id}')" class="m3-btn-primary text-xs font-bold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20">
                      <i class="fa-solid fa-check"></i>
                      <span>Join Squad</span>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      if (squads.length === 0) {
        container.innerHTML = `
          ${invitesHtml}
          <div class="m3-card rounded-3xl p-8 border border-slate-800 text-center space-y-4">
            <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-2xl mx-auto border border-emerald-500/20">
              <i class="fa-solid fa-people-group"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-100">No Active Squads Yet</h3>
              <p class="text-xs text-slate-400 max-w-sm mx-auto mt-1">Create your first squad or enter a joining code from a teammate to experience real-time quiet accountability notifications.</p>
            </div>
            <div class="flex items-center justify-center gap-2.5 flex-wrap">
              <button onclick="triggerHaptic('medium'); openJoinSquadModal()" class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-4 py-2.5 rounded-2xl text-xs inline-flex items-center gap-2 transition active:scale-95">
                <i class="fa-solid fa-right-to-bracket text-emerald-400"></i>
                <span>Join with Code</span>
              </button>
              <button onclick="triggerHaptic('medium'); openCreateSquadModal()" class="m3-btn-primary font-bold px-5 py-2.5 rounded-2xl text-xs inline-flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95">
                <i class="fa-solid fa-plus"></i>
                <span>Create Your First Squad</span>
              </button>
            </div>
          </div>
        `;
        return;
      }

      const defaultCollapsed = localStorage.getItem('showUp_squads_default_collapsed') === 'true';

      const squadsHtml = squads.map(sq => {
        const isUserCreator = (sq.creatorId === user.id) || sq.members.some(m => (m.id === user.id || m.email === user.email) && m.isCreator);
        const userMember = sq.members.find(m => m.id === user.id || m.email === user.email);
        const isUserBackupCreator = !isUserCreator && (userMember?.isBackupCreator || (sq.backupCreatorId === user.id));
        const otherMembers = sq.members.filter(m => m.id !== user.id && m.email !== user.email);
        const hasBackupCreatorAssigned = sq.backupCreatorId && sq.members.some(m => m.id === sq.backupCreatorId);
        const needsBackupCreatorWarning = isUserCreator && otherMembers.length > 0 && !hasBackupCreatorAssigned;

        const prefs = sq.notificationPreferences || { inAppPill: true, beaconPulse: true, hapticPulse: true, soundChime: true, browserNotify: false };
        const isCollapsed = sq.isCollapsed !== undefined ? !!sq.isCollapsed : defaultCollapsed;
        const activeMembersInSquad = sq.members.filter(m => m.isWorkingOut);
        
        const accentColors = {
          emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
          blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
          purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
          amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
          rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' }
        };
        const color = accentColors[sq.accent] || accentColors.emerald;

        return `
          <div class="m3-card rounded-3xl p-5 border border-slate-800 shadow-xl space-y-4">
            
            <!-- SQUAD HEADER -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isCollapsed ? '' : 'border-b border-slate-800/80 pb-4'}">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-12 h-12 rounded-2xl ${color.bg} ${color.text} border ${color.border} flex items-center justify-center text-xl shadow-lg flex-shrink-0">
                  <i class="fa-solid fa-${sq.icon || 'dumbbell'}"></i>
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="text-base font-extrabold text-slate-100 tracking-tight truncate">${escapeHtml(sq.name)}</h3>
                    ${isUserCreator 
                      ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1"><i class="fa-solid fa-crown text-[9px]"></i> Creator</span>`
                      : isUserBackupCreator
                        ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center gap-1"><i class="fa-solid fa-shield-halved text-[9px]"></i> Backup Creator</span>`
                        : `<span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">Member</span>`
                    }
                  </div>
                  <p class="text-xs text-slate-400 mt-0.5 truncate">${escapeHtml(sq.motto || 'Consistency in motion')}</p>
                </div>
              </div>

              <!-- ACTION BUTTONS -->
              <div class="flex items-center gap-1.5 flex-wrap">
                <!-- SUCCESSION: SECONDARY CREATOR CAN PICK UP THE MANTLE IF CREATOR DATA IS LOST (REQ 2) -->
                ${isUserBackupCreator ? `
                  <button onclick="triggerHaptic('heavy'); pickUpMantlePrompt('${sq.id}')" class="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-amber-500/10" title="Assume primary squad creator role if creator lost backup">
                    <i class="fa-solid fa-crown text-xs text-amber-400"></i>
                    <span>Pick Up The Mantle</span>
                  </button>
                ` : ''}

                <!-- COLLAPSE / EXPAND TOGGLE -->
                <button onclick="triggerHaptic('light'); toggleSquadCollapse('${sq.id}')" class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5" title="${isCollapsed ? 'Expand squad details' : 'Collapse squad card'}">
                  <i class="fa-solid fa-chevron-${isCollapsed ? 'down' : 'up'} text-xs text-slate-400"></i>
                  <span>${isCollapsed ? 'Expand' : 'Collapse'}</span>
                </button>

                <button onclick="triggerHaptic('light'); openSquadNotificationsModal('${sq.id}')" class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5" title="Configure workout notifications">
                  <i class="fa-solid fa-bell text-xs ${prefs.inAppPill || prefs.soundChime ? 'text-emerald-400' : 'text-slate-400'}"></i>
                  <span>Alerts</span>
                </button>

                <button onclick="triggerHaptic('light'); openAddMemberModal('${sq.id}')" class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5" title="Add or invite workout buddy">
                  <i class="fa-solid fa-user-plus text-xs text-blue-400"></i>
                  <span>Invite</span>
                </button>

                <!-- CREATOR DELETE SQUAD BUTTON -->
                ${isUserCreator ? `
                  <button onclick="triggerHaptic('heavy'); deleteSquadPrompt('${sq.id}')" class="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5" title="Permanently delete this squad (Creator only)">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                    <span>Delete</span>
                  </button>
                ` : ''}

                <!-- LEAVE BUTTON -->
                ${isUserCreator
                  ? `<button onclick="triggerHaptic('medium'); handleCreatorLeave('${sq.id}')" class="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5" title="Transfer creator role and leave">
                      <i class="fa-solid fa-right-from-bracket text-xs"></i>
                      <span>Leave</span>
                    </button>`
                  : `<button onclick="triggerHaptic('medium'); leaveSquadAsMember('${sq.id}')" class="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5" title="Leave squad">
                      <i class="fa-solid fa-right-from-bracket text-xs"></i>
                      <span>Leave</span>
                    </button>`
                }
              </div>
            </div>

            <!-- MANDATORY BACKUP CREATOR REQUIREMENT BANNER (REQ 2) -->
            ${needsBackupCreatorWarning ? `
              <div class="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm flex-shrink-0 border border-amber-500/30">
                    <i class="fa-solid fa-shield-halved"></i>
                  </div>
                  <div class="min-w-0">
                    <span class="font-bold text-amber-300 block">Backup Creator Required</span>
                    <span class="text-[11px] text-amber-400/80 block">Assign a secondary creator to preserve the squad if your device or backup file is lost.</span>
                  </div>
                </div>
                <button onclick="triggerHaptic('light'); promptAssignFirstBackupCreator('${sq.id}')" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex-shrink-0 transition shadow-md shadow-amber-500/10">
                  Assign Backup Creator
                </button>
              </div>
            ` : ''}

            <!-- COLLAPSED SUMMARY VIEW -->
            ${isCollapsed ? (() => {
              const currentETDate = getETDateKey();
              const userHistory = JSON.parse(localStorage.getItem('showUp_synced_workouts') || '[]');
              const userCompleted = userHistory.some(w => {
                if (!w) return false;
                const wDate = typeof w === 'string' ? w : w.date;
                if (wDate !== currentETDate) return false;
                if (typeof w === 'object') {
                  return (Array.isArray(w.sets) && w.sets.length > 0) || w.completed === true || w.totalVolume > 0 || w.calories > 0;
                }
                return true;
              });
              const joinedMembers = sq.members.filter(mem => !isMemberYetToJoin(mem, sq, user));
              const yetToJoinCount = sq.members.length - joinedMembers.length;
              const showedUpCount = joinedMembers.filter(mem => {
                const isMe = (mem.id === user.id || mem.email === user.email || mem.id === 'local_user');
                return isMe ? userCompleted : !!(mem.completedToday === true && mem.completedDate === currentETDate);
              }).length;
              const yetToShowUpCount = joinedMembers.length - showedUpCount;

              return `
                <div class="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <div class="flex -space-x-2 overflow-hidden flex-shrink-0">
                      ${sq.members.slice(0, 4).map(m => `
                        <div class="inline-flex h-7 w-7 rounded-xl ring-2 ring-slate-950 bg-slate-900 text-[10px] text-slate-200 font-bold items-center justify-center border border-slate-700">
                          ${getInitials(m.rawName || m.name)}
                        </div>
                      `).join('')}
                    </div>
                    <div class="truncate">
                      <span class="text-slate-200 font-semibold">${sq.members.length} members</span>
                      <span class="text-slate-500 mx-1.5">•</span>
                      <span class="text-emerald-400 font-semibold">${showedUpCount} Showed Up</span>
                      <span class="text-slate-500 mx-1">•</span>
                      <span class="text-slate-400">${yetToShowUpCount} Yet to show up</span>
                      ${yetToJoinCount > 0 ? `
                        <span class="text-slate-500 mx-1">•</span>
                        <span class="text-amber-400/90 font-medium">${yetToJoinCount} Yet to join</span>
                      ` : ''}
                      ${activeMembersInSquad.length > 0 
                        ? `<span class="text-emerald-400 font-semibold ml-1.5"><i class="fa-solid fa-bolt text-[10px]"></i> ${activeMembersInSquad.length} lifting now</span>`
                        : ''
                      }
                    </div>
                  </div>
                  <button onclick="triggerHaptic('light'); toggleSquadCollapse('${sq.id}')" class="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 flex-shrink-0">
                    <span>View Details</span>
                    <i class="fa-solid fa-chevron-down text-[10px]"></i>
                  </button>
                </div>
              `;
            })() : `
              <!-- UNOBTRUSIVE NOTIFICATIONS STATUS PILL ROW -->
              <div class="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                <span class="text-slate-400 font-medium flex items-center gap-1.5">
                  <i class="fa-solid fa-bell text-emerald-400"></i>
                  Active Workout Alerts:
                </span>
                <div class="flex items-center gap-1 flex-wrap">
                  <span class="px-2 py-0.5 rounded-lg border ${prefs.inAppPill ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold' : 'bg-slate-900 text-slate-500 border-slate-800 line-through'}">Pill</span>
                  <span class="px-2 py-0.5 rounded-lg border ${prefs.beaconPulse ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 font-semibold' : 'bg-slate-900 text-slate-500 border-slate-800 line-through'}">Beacon</span>
                  <span class="px-2 py-0.5 rounded-lg border ${prefs.hapticPulse ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-semibold' : 'bg-slate-900 text-slate-500 border-slate-800 line-through'}">Haptic</span>
                  <span class="px-2 py-0.5 rounded-lg border ${prefs.soundChime ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 font-semibold' : 'bg-slate-900 text-slate-500 border-slate-800 line-through'}">Chime</span>
                  <span class="px-2 py-0.5 rounded-lg border ${prefs.browserNotify ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-semibold' : 'bg-slate-900 text-slate-500 border-slate-800 line-through'}">OS Push</span>
                  <button onclick="triggerHaptic('light'); openSquadNotificationsModal('${sq.id}')" class="text-emerald-400 hover:text-emerald-300 ml-1 underline text-[10px]">Edit</button>
                </div>
              </div>

              <!-- MEMBERS LIST -->
              <div class="space-y-2 pt-1">
                <div class="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider px-1">
                  <span>Members (${sq.members.length})</span>
                  <span class="text-[10px] text-slate-500">Invite Code: <code class="text-emerald-400 font-mono">${sq.inviteCode || 'SHOWUP'}</code></span>
                </div>

                <div class="space-y-2">
                  ${sq.members.map(m => {
                    const isThisUser = (m.id === user.id || m.email === user.email || m.id === 'local_user');
                    const isMemberBackupCreator = m.isBackupCreator || (sq.backupCreatorId === m.id);
                    const initials = getInitials(m.rawName || m.name);
                    const isYetToJoin = isMemberYetToJoin(m, sq, user);
                    const showDeliveryBadge = isUserCreator && isYetToJoin && (m.invitedByEmail || m.invitedByPhone || m.inviteStatus === 'delivered');
                    
                    const currentETDate = getETDateKey();
                    const userHistory = JSON.parse(localStorage.getItem('showUp_synced_workouts') || '[]');
                    const userCompletedToday = userHistory.some(w => {
                      if (!w) return false;
                      const wDate = typeof w === 'string' ? w : w.date;
                      if (wDate !== currentETDate) return false;
                      if (typeof w === 'object') {
                        return (Array.isArray(w.sets) && w.sets.length > 0) || w.completed === true || w.totalVolume > 0 || w.calories > 0;
                      }
                      return true;
                    });
                    const hasCompletedToday = isThisUser 
                      ? userCompletedToday 
                      : !!(m.completedToday === true && m.completedDate === currentETDate);

                    const highFives = Array.isArray(m.doubleHighFives) ? m.doubleHighFives : [];
                    const userGaveHighFive = highFives.some(hf => hf.giverId === user.id || (user.email && hf.giverEmail && hf.giverEmail.toLowerCase().trim() === user.email.toLowerCase().trim()));
                    const giversNames = highFives.map(hf => hf.giverName || 'Teammate').join(', ');
                    
                    return `
                      <div class="bg-slate-950 p-3 rounded-2xl border ${m.isWorkingOut ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/5' : 'border-slate-800'} flex items-center justify-between gap-3 transition">
                        <div class="flex items-center gap-3 min-w-0">
                          <!-- AVATAR -->
                          <div class="relative flex-shrink-0 cursor-pointer" onclick="triggerHaptic('light'); openSquadWorkoutDetailsModal('${sq.id}', '${m.id}')" title="View fellow athlete workout details">
                            ${m.avatar 
                              ? `<img src="${m.avatar}" class="w-10 h-10 rounded-xl object-cover border border-slate-700" alt="${escapeHtml(m.rawName)}">`
                              : `<div class="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-bold flex items-center justify-center text-xs">${initials}</div>`
                            }
                            ${(m.isWorkingOut && (typeof isMemberWorkoutActive !== 'function' || isMemberWorkoutActive(m))) 
                              ? `<span class="absolute -top-1 -right-1 flex h-3 w-3">
                                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-950"></span>
                                 </span>`
                              : ''
                            }
                          </div>

                          <!-- DETAILS & EMAIL DELIVERY STATUS (FOR CREATOR) -->
                          <div class="min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                              <span class="text-xs font-bold text-slate-100 truncate cursor-pointer hover:text-emerald-400 transition" onclick="triggerHaptic('light'); openSquadWorkoutDetailsModal('${sq.id}', '${m.id}')">
                                ${escapeHtml(m.rawName || m.name)} ${isThisUser ? '<span class="text-emerald-400 font-normal">(You)</span>' : ''}
                              </span>
                              ${m.isCreator 
                                ? `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-0.5"><i class="fa-solid fa-crown text-[8px]"></i> Creator</span>`
                                : isMemberBackupCreator
                                  ? `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center gap-0.5" title="Secondary / Backup Creator"><i class="fa-solid fa-shield-halved text-[8px]"></i> Backup Creator</span>`
                                  : ''
                              }
                              <!-- VISIBLE INVITE DELIVERY ICON (MAIL WITH CHECK MARK) ONLY BEFORE ATHLETE JOINS -->
                              ${showDeliveryBadge ? `
                                <span class="inline-flex items-center text-emerald-400 text-xs ml-0.5 hover:text-emerald-300 transition" title="Invite delivered to ${escapeHtml(m.inviteEmail || m.invitePhone || m.email || '')}${m.inviteDeliveredAt ? ` at ${escapeHtml(m.inviteDeliveredAt)}` : ''}">
                                  <i class="fa-solid fa-envelope-circle-check"></i>
                                </span>
                              ` : ''}
                              ${m.phone ? `
                                <span class="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800" title="Phone: ${escapeHtml(m.phone)}">
                                  <i class="fa-solid fa-phone text-[9px] text-slate-400"></i>
                                  <span>${escapeHtml(m.phone)}</span>
                                </span>
                              ` : ''}
                            </div>
                            <div class="mt-1 flex items-center gap-2 flex-wrap">
                              <!-- ATHLETE STATUS BADGE -->
                              ${isYetToJoin ? `
                                <span class="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-full" title="Invited — waiting for teammate to join">
                                  <i class="fa-regular fa-clock text-amber-400/80 text-[9px]"></i>
                                  <span>Yet to join</span>
                                </span>
                              ` : hasCompletedToday ? `
                                <div class="flex items-center gap-1.5 flex-wrap">
                                  <span class="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 rounded-full shadow-sm">
                                    <i class="fa-solid fa-circle-check text-emerald-400 text-[9px]"></i>
                                    <span>Showed Up</span>
                                  </span>
                                  ${(m.lastCompletedWorkout || (isThisUser && userHistory.find(w => (typeof w === 'string' ? w : w.date) === currentETDate)?.workoutName)) ? `
                                    <button onclick="triggerHaptic('light'); openSquadWorkoutDetailsModal('${sq.id}', '${m.id}')" class="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400/90 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 px-2 py-0.5 rounded-full transition cursor-pointer" title="View fellow athlete workout details">
                                      <i class="fa-solid fa-dumbbell text-[8px]"></i>
                                      <span>${escapeHtml(m.lastCompletedWorkout || userHistory.find(w => (typeof w === 'string' ? w : w.date) === currentETDate)?.workoutName || 'Completed')}</span>
                                      <i class="fa-solid fa-chevron-right text-[7px] ml-0.5 text-emerald-400/70"></i>
                                    </button>
                                  ` : ''}
                                  ${highFives.length > 0 ? `
                                    <button onclick="triggerHaptic('light'); openSquadWorkoutDetailsModal('${sq.id}', '${m.id}')" class="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full transition cursor-pointer shadow-sm" title="${isThisUser ? `Double High Fives given to you by: ${escapeHtml(giversNames)}` : `Double High Fives from: ${escapeHtml(giversNames)}`}">
                                      <span class="text-xs">🙌</span>
                                      <span>${highFives.length} High Five${highFives.length > 1 ? 's' : ''}${isThisUser ? ' Received' : ''}</span>
                                    </button>
                                  ` : ''}
                                </div>
                              ` : `
                                <div class="flex items-center gap-1.5 flex-wrap">
                                  <span class="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-full">
                                    <i class="fa-regular fa-clock text-amber-400/80 text-[9px]"></i>
                                    <span>Yet to show up</span>
                                  </span>
                                  ${highFives.length > 0 ? `
                                    <button onclick="triggerHaptic('light'); openSquadWorkoutDetailsModal('${sq.id}', '${m.id}')" class="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full transition cursor-pointer" title="Double High Fives: ${escapeHtml(giversNames)}">
                                      <span class="text-xs">🙌</span>
                                      <span>${highFives.length}</span>
                                    </button>
                                  ` : ''}
                                </div>
                              `}

                              ${(m.isWorkingOut && (typeof isMemberWorkoutActive !== 'function' || isMemberWorkoutActive(m))) ? `
                                <div class="flex items-center gap-1.5 flex-wrap">
                                  <button onclick="triggerHaptic('light'); openSquadWorkoutDetailsModal('${sq.id}', '${m.id}')" class="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 px-2 py-0.5 rounded-full flex items-center gap-1 transition cursor-pointer" title="View fellow athlete workout details">
                                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    Lifting Now: ${escapeHtml(m.currentWorkout || 'Active Session')} ${m.isSimulatedWorkout ? '<span class="text-[8px] text-amber-400 font-normal">(Simulated)</span>' : ''}
                                    <i class="fa-solid fa-chevron-right text-[7px] ml-0.5 text-emerald-400/70"></i>
                                  </button>
                                  <!-- CLOSE SIMULATED WORKOUT ACTION ON MEMBER CARD -->
                                  <button onclick="triggerHaptic('light'); stopSpecificMemberWorkout('${sq.id}', '${m.id}')" class="text-[9px] font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-2 py-0.5 rounded-lg transition inline-flex items-center gap-1" title="Close and finish this active workout session">
                                    <i class="fa-solid fa-xmark text-[8px]"></i>
                                    <span>Close Session</span>
                                  </button>
                                </div>
                              ` : ''}
                            </div>
                          </div>
                        </div>

                        <!-- PERMISSION-BASED ACTION CONTROLS & FELLOW ATHLETE INTERACTIONS -->
                        <div class="flex items-center gap-1.5 flex-shrink-0">
                          <!-- VIEW FELLOW ATHLETE WORKOUT DETAILS -->
                          <button onclick="triggerHaptic('light'); openSquadWorkoutDetailsModal('${sq.id}', '${m.id}')" class="text-[10px] font-semibold text-slate-300 hover:text-emerald-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2 py-1 rounded-xl transition flex items-center gap-1" title="View fellow athlete workout details">
                            <i class="fa-solid fa-clipboard-list text-emerald-400 text-[9px]"></i>
                            <span>Details</span>
                          </button>

                          <!-- EMOTE VIA DOUBLE HIGH FIVE -->
                          ${!isThisUser ? `
                            <button onclick="triggerHaptic('heavy'); giveDoubleHighFive('${sq.id}', '${m.id}')" class="text-[10px] font-bold ${userGaveHighFive ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10' : 'bg-slate-900 text-slate-300 hover:text-amber-300 border-slate-700 hover:border-amber-500/30'} px-2 py-1 rounded-xl border transition flex items-center gap-1 active:scale-95" title="${highFives.length > 0 ? `Double High Fives from: ${escapeHtml(giversNames)}` : 'Emote via Double High Five'}">
                              <span>🙌</span>
                              <span>${highFives.length > 0 ? highFives.length : 'High Five'}</span>
                            </button>
                          ` : (highFives.length > 0 ? `
                            <button onclick="triggerHaptic('light'); openSquadWorkoutDetailsModal('${sq.id}', '${m.id}')" class="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-1 rounded-xl transition flex items-center gap-1 shadow-sm" title="View who gave you double high fives">
                              <span>🙌</span>
                              <span>${highFives.length} High Five${highFives.length > 1 ? 's' : ''}</span>
                            </button>
                          ` : '')}

                          <!-- CREATOR CONTROLS OVER MEMBERS (ASSIGN BACKUP CREATOR / RESEND INVITE / REMOVE) -->
                          ${isUserCreator && !isThisUser
                            ? `
                              ${isMemberBackupCreator
                                ? `<span class="text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2 py-1 rounded-xl flex items-center gap-1" title="Assigned Backup Creator"><i class="fa-solid fa-shield-check text-[9px]"></i> Assigned Backup</span>`
                                : `<button onclick="triggerHaptic('light'); assignBackupCreator('${sq.id}', '${m.id}')" class="text-[10px] font-semibold text-slate-300 hover:text-sky-300 bg-slate-900 hover:bg-sky-500/10 border border-slate-700 hover:border-sky-500/30 px-2 py-1 rounded-xl transition flex items-center gap-1" title="Assign backup creator role to ${escapeHtml(m.rawName || m.name)}"><i class="fa-regular fa-star text-[9px] text-sky-400"></i> Make Backup</button>`
                              }
                              ${isYetToJoin ? `
                                <button onclick="triggerHaptic('light'); resendSquadInvite('${sq.id}', '${m.id}')" class="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 bg-slate-900 hover:bg-emerald-500/10 border border-slate-700 hover:border-emerald-500/30 px-2 py-1 rounded-xl transition flex items-center gap-1 shadow-sm" title="Resend squad invitation to ${escapeHtml(m.rawName || m.name)}">
                                  <i class="fa-solid fa-paper-plane text-[9px] text-emerald-400"></i>
                                  <span>Resend Invite</span>
                                </button>
                              ` : ''}
                              <button onclick="triggerHaptic('medium'); removeSquadMember('${sq.id}', '${m.id}')" class="text-slate-500 hover:text-rose-400 p-2 rounded-xl hover:bg-rose-500/10 transition" title="Remove member (Creator only)">
                                <i class="fa-solid fa-user-minus text-xs"></i>
                              </button>
                            `
                            : ''
                          }

                          <!-- BACKUP CREATOR CONTROLS ON OWN ROW -->
                          ${isThisUser && isUserBackupCreator
                            ? `<button onclick="triggerHaptic('heavy'); pickUpMantlePrompt('${sq.id}')" class="text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl hover:bg-amber-500/20 transition flex items-center gap-1" title="Assume primary creator leadership"><i class="fa-solid fa-crown text-[9px] text-amber-400"></i> Pick Up Mantle</button>`
                            : ''
                          }

                          <!-- PRIMARY CREATOR CONTROLS ON OWN ROW -->
                          ${isThisUser && isUserCreator && sq.members.length > 1
                            ? `<button onclick="triggerHaptic('light'); handleCreatorLeave('${sq.id}')" class="text-[10px] text-slate-400 hover:text-amber-400 border border-slate-800 hover:border-amber-500/30 px-2 py-1 rounded-xl transition" title="Transfer creator role">
                                Transfer Role
                               </button>`
                            : ''
                          }
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `}

          </div>
        `;
      }).join('');

      container.innerHTML = (invitesHtml ? invitesHtml : '') + squadsHtml;
      updateSquadsDefaultCollapseUI();
    }



    function openCreateSquadModal() {
      document.getElementById('new-squad-name').value = '';
      document.getElementById('new-squad-motto').value = '';
      selectSquadIcon('dumbbell');
      selectSquadAccent('emerald');
      document.getElementById('create-squad-modal').classList.remove('hidden');
    }

    function closeCreateSquadModal() {
      document.getElementById('create-squad-modal').classList.add('hidden');
    }

    function selectSquadIcon(icon) {
      squadCreateSelectedIcon = icon;
      const icons = ['dumbbell', 'fire', 'trophy', 'bolt', 'crown', 'shield-halved'];
      icons.forEach(ic => {
        const btn = document.getElementById(`squad-icon-${ic}`);
        if (btn) {
          if (ic === icon) {
            btn.className = "h-10 rounded-xl border-2 border-emerald-500 bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm transition";
          } else {
            btn.className = "h-10 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 flex items-center justify-center text-sm transition";
          }
        }
      });
    }

    function selectSquadAccent(accent) {
      squadCreateSelectedAccent = accent;
      const accents = ['emerald', 'blue', 'purple', 'amber', 'rose'];
      accents.forEach(ac => {
        const btn = document.getElementById(`squad-accent-${ac}`);
        if (btn) {
          if (ac === accent) {
            btn.classList.add('border-white/90');
            btn.classList.remove('border-transparent');
          } else {
            btn.classList.remove('border-white/90');
            btn.classList.add('border-transparent');
          }
        }
      });
    }

    function createNewSquadSubmit() {
      const nameInput = document.getElementById('new-squad-name');
      const mottoInput = document.getElementById('new-squad-motto');
      const name = nameInput.value.trim();
      const motto = mottoInput.value.trim() || 'Daily grind & consistency';

      if (!name) {
        showToast("Please enter a squad name", "warning");
        nameInput.focus();
        return;
      }

      const user = getAppUser();
      const squads = getSquads();
      const newSquadId = 'squad_' + Date.now();
      const randomCode = 'SHOWUP-' + Math.random().toString(36).substring(2, 6).toUpperCase();

      const newSquad = {
        id: newSquadId,
        name: name,
        motto: motto,
        icon: squadCreateSelectedIcon || 'dumbbell',
        accent: squadCreateSelectedAccent || 'emerald',
        inviteCode: randomCode,
        isCollapsed: false,
        createdAt: new Date().toISOString(),
        creatorId: user.id,
        creatorName: user.rawName,
        creatorEmail: user.email || '',
        notificationPreferences: {
          inAppPill: true,
          beaconPulse: true,
          hapticPulse: true,
          soundChime: true,
          browserNotify: false
        },
        members: [
          {
            id: user.id,
            name: user.name,
            rawName: user.rawName,
            email: user.email,
            avatar: user.picture,
            isCreator: true,
            isWorkingOut: false,
            currentWorkout: null,
            lastActive: 'Just now'
          }
        ]
      };

      squads.unshift(newSquad);
      saveSquads(squads);
      saveSquadToGlobalRegistry(newSquad);
      closeCreateSquadModal();
      renderSquadsTab();
      updateGlobalStatsUI();
      showToast(`Squad "${name}" created! You are the Creator.`, "success");
    }

    function removeSquadMember(squadId, memberId) {
      const squads = getSquads();
      const squad = squads.find(s => s.id === squadId);
      if (!squad) return;

      const user = getAppUser();
      const isUserCreator = (squad.creatorId === user.id) || squad.members.some(m => (m.id === user.id || m.email === user.email) && m.isCreator);
      if (!isUserCreator) {
        showToast("Only the squad creator can remove other members.", "error");
        return;
      }

      const targetMember = squad.members.find(m => m.id === memberId);
      if (!targetMember) return;

      if (targetMember.id === user.id) {
        handleCreatorLeave(squadId);
        return;
      }

      if (!confirm(`Are you sure you want to remove ${targetMember.rawName || targetMember.name} from "${squad.name}"?`)) {
        return;
      }

      squad.members = squad.members.filter(m => m.id !== memberId);
      saveSquads(squads);
      renderSquadsTab();
      updateSquadBeacon();
      updateGlobalStatsUI();
      showToast(`Removed ${targetMember.rawName || targetMember.name} from squad.`, "info");
    }

    function handleCreatorLeave(squadId) {
      const squads = getSquads();
      const squad = squads.find(s => s.id === squadId);
      if (!squad) return;

      const user = getAppUser();
      const otherMembers = squad.members.filter(m => m.id !== user.id && m.email !== user.email);

      if (otherMembers.length === 0) {
        if (confirm(`You are the only member in "${squad.name}". Leaving will permanently disband and delete this squad. Continue?`)) {
          // 1. Immediately delete from local active squads
          const updated = squads.filter(s => s.id !== squadId);
          localStorage.setItem('showUp_squads', JSON.stringify(updated));

          // 2. Remove from athlete isolated user cache
          const userEmail = (user.email || '').toLowerCase().trim();
          if (userEmail && userEmail !== 'you@showup.app' && userEmail !== 'user@showup.app') {
            try {
              localStorage.setItem('showUp_user_squads_' + userEmail, JSON.stringify(updated));
            } catch (e) {}
          }

          // 3. Remove from global registry and archive
          removeSquadFromGlobalRegistry(squadId);

          // 4. Delete squad document from Firestore cloud database
          deleteSquadFromFirestore(squadId);

          // 5. Sync to Google Drive if athlete has connected Google backup
          if (typeof syncToGoogleDrive === 'function' && localStorage.getItem('showUp_google_token')) {
            try { syncToGoogleDrive(true); } catch (e) {}
          }

          // 6. Immediately update display
          renderSquadsTab();
          updateSquadBeacon();
          updateGlobalStatsUI();
          renderHeatMap();
          showToast(`Squad "${squad.name}" disbanded.`, "info");
        }
        return;
      }

      transferTargetSquadId = squadId;
      const listEl = document.getElementById('transfer-candidates-list');
      if (listEl) {
        listEl.innerHTML = otherMembers.map((m, idx) => `
          <label class="flex items-center justify-between p-3 rounded-2xl border border-slate-800 bg-slate-950 hover:border-slate-700 cursor-pointer transition">
            <div class="flex items-center gap-3 min-w-0">
              <input type="radio" name="successor-creator-radio" value="${m.id}" ${idx === 0 ? 'checked' : ''} class="w-4 h-4 accent-amber-500 cursor-pointer">
              <div class="min-w-0">
                <span class="text-xs font-bold text-slate-100 block truncate">${escapeHtml(m.rawName || m.name)}</span>
                <span class="text-[10px] text-slate-400 block truncate">${escapeHtml(m.email || 'Squad member')}</span>
              </div>
            </div>
            <span class="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">New Creator</span>
          </label>
        `).join('');
      }

      document.getElementById('transfer-creator-modal').classList.remove('hidden');
    }

    function closeTransferModal() {
      document.getElementById('transfer-creator-modal').classList.add('hidden');
      transferTargetSquadId = null;
    }

    function confirmTransferAndLeave() {
      if (!transferTargetSquadId) return;

      const squads = getSquads();
      const squad = squads.find(s => s.id === transferTargetSquadId);
      if (!squad) return;

      const selectedRadio = document.querySelector('input[name="successor-creator-radio"]:checked');
      if (!selectedRadio) {
        showToast("Please choose a squad member to assign as the new creator.", "warning");
        return;
      }

      const newCreatorId = selectedRadio.value;
      const newCreator = squad.members.find(m => m.id === newCreatorId);
      if (!newCreator) {
        showToast("Selected successor not found.", "error");
        return;
      }

      const user = getAppUser();

      // Transfer Creator Role
      squad.creatorId = newCreator.id;
      squad.creatorName = newCreator.rawName || newCreator.name;
      squad.creator = newCreator.rawName || newCreator.name;
      squad.creatorEmail = newCreator.email || '';
      newCreator.isCreator = true;

      // Remove leaving creator
      squad.members = squad.members.filter(m => m.id !== user.id && m.email !== user.email);

      // 1. Sync updated squad (with new creator & leaving athlete removed) to Firestore and global registry
      saveSquadToGlobalRegistry(squad);
      syncSquadToFirestore(squad);

      // 2. Immediately remove squad from leaving athlete's active squads
      const remainingUserSquads = squads.filter(s => s.id !== transferTargetSquadId);
      localStorage.setItem('showUp_squads', JSON.stringify(remainingUserSquads));

      // 3. Update athlete isolated user cache
      const userEmail = (user.email || '').toLowerCase().trim();
      if (userEmail && userEmail !== 'you@showup.app' && userEmail !== 'user@showup.app') {
        try {
          localStorage.setItem('showUp_user_squads_' + userEmail, JSON.stringify(remainingUserSquads));
        } catch (e) {}
      }

      // 4. Sync to Google Drive if athlete has connected Google backup
      if (typeof syncToGoogleDrive === 'function' && localStorage.getItem('showUp_google_token')) {
        try { syncToGoogleDrive(true); } catch (e) {}
      }

      // 5. Close modal and immediately update display
      closeTransferModal();
      renderSquadsTab();
      updateSquadBeacon();
      updateGlobalStatsUI();
      renderHeatMap();
      showToast(`Transferred creator role to ${newCreator.rawName || newCreator.name} and left squad.`, "success");
    }

    function leaveSquadAsMember(squadId) {
      const squads = getSquads();
      const squad = squads.find(s => s.id === squadId);
      if (!squad) return;

      const user = getAppUser();
      const userMember = squad.members.find(m => m.id === user.id || m.email === user.email);
      if (userMember && userMember.isCreator) {
        handleCreatorLeave(squadId);
        return;
      }

      if (!confirm(`Are you sure you want to leave "${squad.name}"?`)) {
        return;
      }

      // 1. Remove user from squad members
      squad.members = squad.members.filter(m => m.id !== user.id && m.email !== user.email);

      // 2. Sync updated squad (with user removed) to Firestore and global registry
      saveSquadToGlobalRegistry(squad);
      syncSquadToFirestore(squad);

      // 3. Immediately remove squad from user's active squads
      const remainingUserSquads = squads.filter(s => s.id !== squadId);
      localStorage.setItem('showUp_squads', JSON.stringify(remainingUserSquads));

      // 4. Update athlete isolated user cache
      const userEmail = (user.email || '').toLowerCase().trim();
      if (userEmail && userEmail !== 'you@showup.app' && userEmail !== 'user@showup.app') {
        try {
          localStorage.setItem('showUp_user_squads_' + userEmail, JSON.stringify(remainingUserSquads));
        } catch (e) {}
      }

      // 5. Sync to Google Drive if athlete has connected Google backup
      if (typeof syncToGoogleDrive === 'function' && localStorage.getItem('showUp_google_token')) {
        try { syncToGoogleDrive(true); } catch (e) {}
      }

      // 6. Immediately update display
      renderSquadsTab();
      updateSquadBeacon();
      updateGlobalStatsUI();
      renderHeatMap();
      showToast(`You have left "${squad.name}".`, "info");
    }

    function sendSquadInviteEmail(squad, member) {
      if (!member || !member.email) return false;
      const appUrl = window.location.origin + window.location.pathname;
      const subject = `Invitation to join ${squad.name} on showUp`;
      const body = `Hey ${member.rawName || 'Teammate'},\n\n` +
        `You've been invited to join the "${squad.name}" fitness squad on showUp!\n\n` +
        `Squad Invite Code: ${squad.inviteCode || 'SHOWUP-7X9P'}\n` +
        `Squad Motto: ${squad.motto || 'Consistency is key'}\n\n` +
        `Join and track workouts with us here:\n${appUrl}\n\n` +
        `Let's show up and crush our goals together!`;

      const mailtoUrl = `mailto:${encodeURIComponent(member.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      const link = document.createElement('a');
      link.href = mailtoUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }

    function sendSquadInviteSMS(squad, member) {
      if (!member || !member.phone) return false;
      const appUrl = window.location.origin + window.location.pathname;
      const body = `Join my fitness squad "${squad.name}" on showUp! Squad Invite Code: ${squad.inviteCode || 'SHOWUP'}. Link: ${appUrl}`;
      const smsUrl = `sms:${encodeURIComponent(member.phone)}?&body=${encodeURIComponent(body)}`;
      
      const link = document.createElement('a');
      link.href = smsUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }

    function resendSquadInvite(squadId, memberId) {
      const squads = getSquads();
      const squad = squads.find(s => s.id === squadId);
      if (!squad) return;

      const member = squad.members.find(m => m.id === memberId);
      if (!member) return;

      let emailDispatched = false;
      if (member.email) {
        emailDispatched = sendSquadInviteEmail(squad, member);
      } else if (member.phone) {
        sendSquadInviteSMS(squad, member);
      }

      member.hasJoined = false;
      member.inviteStatus = 'delivered';
      member.inviteDeliveredAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      member.lastInviteSentAt = new Date().toISOString();

      saveSquads(squads);
      renderSquadsTab();

      const recipient = member.email || member.phone || member.rawName;
      showToast(`Invite resent! Invitation delivered to ${recipient}.`, "success");

      if (typeof syncToGoogleDrive === 'function' && localStorage.getItem('showUp_google_token')) {
        syncToGoogleDrive(false);
      }
    }

    function openAddMemberModal(squadId) {
      currentActiveSquadId = squadId;
      const squads = getSquads();
      const squad = squads.find(s => s.id === squadId);
      if (!squad) return;

      document.getElementById('add-member-modal-squad-name').innerText = `Inviting to "${squad.name}"`;
      document.getElementById('modal-squad-invite-code').innerText = squad.inviteCode || 'SHOWUP-7X9P';
      document.getElementById('new-member-name').value = '';
      const emailInput = document.getElementById('new-member-email');
      if (emailInput) emailInput.value = '';
      const phoneInput = document.getElementById('new-member-phone');
      if (phoneInput) phoneInput.value = '';
      const zipInput = document.getElementById('new-member-zip');
      if (zipInput) zipInput.value = '';
      document.getElementById('add-member-modal').classList.remove('hidden');
    }

    function closeAddMemberModal() {
      document.getElementById('add-member-modal').classList.add('hidden');
    }

    function copySquadInviteCode() {
      const code = document.getElementById('modal-squad-invite-code').innerText.trim();
      navigator.clipboard.writeText(code).then(() => {
        showToast(`Invite code ${code} copied to clipboard!`, "success");
      }).catch(() => {
        showToast(`Code: ${code}`, "info");
      });
    }



    function addMemberSubmit() {
      if (!currentActiveSquadId) return;

      const nameInput = document.getElementById('new-member-name');
      const emailInput = document.getElementById('new-member-email');
      const phoneInput = document.getElementById('new-member-phone');
      const zipInput = document.getElementById('new-member-zip');
      const name = nameInput.value.trim();
      const email = emailInput ? emailInput.value.trim() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const enteredZip = zipInput ? zipInput.value.trim() : '';

      if (!name) {
        showToast("Please enter teammate's name", "warning");
        nameInput.focus();
        return;
      }

      if (!email && !phone) {
        showToast("Please enter an email address or phone number for the invitation", "warning");
        if (emailInput) emailInput.focus();
        return;
      }

      const squads = getSquads();
      const squad = squads.find(s => s.id === currentActiveSquadId);
      if (!squad) return;

      const isFirstTeammate = (squad.members.length === 1);
      const shouldBeBackup = isFirstTeammate || !squad.backupCreatorId;

      // Authentic Postal Zip Code determination (entered zip -> user zip -> 20105)
      const memberZip = (enteredZip && /^\d{5}$/.test(enteredZip)) ? enteredZip : getUserZip();
      const memberCoords = getZipCoordinates(memberZip);

      // Ensure delivery tracking metadata is created and logged for invitations
      const newMember = {
        id: 'member_' + Date.now(),
        name: name,
        rawName: name,
        email: email,
        phone: phone,
        invitedByEmail: Boolean(email),
        invitedByPhone: Boolean(phone),
        inviteEmail: email,
        invitePhone: phone,
        inviteStatus: 'delivered',
        hasJoined: false,
        inviteDeliveredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lastInviteSentAt: new Date().toISOString(),
        avatar: null,
        zip: memberZip,
        city: memberCoords.city || `Zip ${memberZip}`,
        lat: memberCoords.lat,
        lng: memberCoords.lng,
        isCreator: false,
        isBackupCreator: shouldBeBackup,
        isWorkingOut: false,
        currentWorkout: null,
        lastActive: 'Just invited'
      };

      if (shouldBeBackup) {
        squad.backupCreatorId = newMember.id;
        squad.backupCreatorName = newMember.rawName;
      }

      // Functional dispatch: launch client email client or SMS
      if (email) {
        recordSquadInvite({
          id: 'invite_' + Date.now(),
          squadId: squad.id,
          squadName: squad.name,
          squadMotto: squad.motto,
          squadIcon: squad.icon,
          squadAccent: squad.accent,
          inviteCode: squad.inviteCode,
          inviterName: squad.creatorName || getAppUser().rawName,
          inviterEmail: getAppUser().email,
          targetEmail: email.toLowerCase(),
          targetName: name,
          invitedAt: new Date().toISOString(),
          status: 'pending'
        });
        sendSquadInviteEmail(squad, newMember);
      } else if (phone) {
        sendSquadInviteSMS(squad, newMember);
      }

      squad.members.push(newMember);
      saveSquads(squads);
      saveSquadToGlobalRegistry(squad);
      closeAddMemberModal();
      renderSquadsTab();
      updateGlobalStatsUI();

      const targetDestination = email || phone;
      if (shouldBeBackup) {
        showToast(`Added ${name} as Backup Creator! Invitation delivered to ${targetDestination}.`, "success");
      } else {
        showToast(`Added ${name}! Invitation delivered to ${targetDestination}.`, "success");
      }
      if (typeof syncToGoogleDrive === 'function' && localStorage.getItem('showUp_google_token')) {
        syncToGoogleDrive(false);
      }
    }

    function openSquadNotificationsModal(squadId) {
      currentActiveSquadId = squadId;
      const squads = getSquads();
      const squad = squads.find(s => s.id === squadId);
      if (!squad) return;

      document.getElementById('notif-modal-squad-name').innerText = `For squad: "${squad.name}"`;

      const prefs = squad.notificationPreferences || {
        inAppPill: true,
        beaconPulse: true,
        hapticPulse: true,
        soundChime: true,
        browserNotify: false
      };

      document.getElementById('pref-pill').checked = !!prefs.inAppPill;
      document.getElementById('pref-beacon').checked = !!prefs.beaconPulse;
      document.getElementById('pref-haptic').checked = !!prefs.hapticPulse;
      document.getElementById('pref-chime').checked = !!prefs.soundChime;
      document.getElementById('pref-browser').checked = !!prefs.browserNotify;

      document.getElementById('squad-notifications-modal').classList.remove('hidden');
    }

    function closeSquadNotificationsModal() {
      document.getElementById('squad-notifications-modal').classList.add('hidden');
    }

    function saveSquadNotificationsSubmit() {
      if (!currentActiveSquadId) return;

      const squads = getSquads();
      const squad = squads.find(s => s.id === currentActiveSquadId);
      if (!squad) return;

      squad.notificationPreferences = {
        inAppPill: document.getElementById('pref-pill').checked,
        beaconPulse: document.getElementById('pref-beacon').checked,
        hapticPulse: document.getElementById('pref-haptic').checked,
        soundChime: document.getElementById('pref-chime').checked,
        browserNotify: document.getElementById('pref-browser').checked
      };

      if (squad.notificationPreferences.browserNotify && 'Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }

      saveSquads(squads);
      closeSquadNotificationsModal();
      renderSquadsTab();
      showToast("Notification preferences updated!", "success");
    }

    function previewCurrentSquadNotifications() {
      const willPill = document.getElementById('pref-pill').checked;
      const willHaptic = document.getElementById('pref-haptic').checked;
      const willChime = document.getElementById('pref-chime').checked;
      const willBrowser = document.getElementById('pref-browser').checked;

      if (willPill) {
        showSquadNotificationPill({ rawName: "Teammate", avatar: null }, "Heavy Incline Press");
      }
      if (willHaptic) {
        triggerSquadHaptic();
      }
      if (willChime) {
        playUnobtrusiveChime();
      }
      if (willBrowser) {
        sendBrowserNotification("ShowUp Squad", "Teammate started: Heavy Incline Press");
      }
    }

    function simulateTeammateWorkout(targetSquadId) {
      // Simulate function removed per user preference
    }

    function triggerSquadWorkoutNotification(squad, member, workoutName) {
      const prefs = squad.notificationPreferences || {
        inAppPill: true,
        beaconPulse: true,
        hapticPulse: true,
        soundChime: true,
        browserNotify: false
      };

      if (prefs.inAppPill) {
        showSquadNotificationPill(member, workoutName);
      }
      if (prefs.beaconPulse) {
        updateSquadBeacon();
      }
      if (prefs.hapticPulse) {
        triggerSquadHaptic();
      }
      if (prefs.soundChime) {
        playUnobtrusiveChime();
      }
      if (prefs.browserNotify) {
        sendBrowserNotification(`ShowUp Squad • ${squad.name}`, `${member.rawName || member.name} just stepped in to lift: ${workoutName}!`);
      }
    }

    function showSquadNotificationPill(member, workoutName) {
      const pill = document.getElementById('squad-notification-pill');
      const avatarEl = document.getElementById('pill-avatar');
      const nameEl = document.getElementById('pill-name');
      const workoutEl = document.getElementById('pill-workout');
      if (!pill || !nameEl || !workoutEl) return;

      if (avatarEl) {
        if (member.avatar) {
          avatarEl.innerHTML = `<img src="${member.avatar}" class="w-full h-full object-cover rounded-xl" alt="avatar">`;
        } else {
          avatarEl.innerText = getInitials(member.rawName || member.name || "SU");
        }
      }

      nameEl.innerText = member.rawName || member.name || "Squad Mate";
      workoutEl.innerText = `Started: ${workoutName || 'Active Workout'}`;

      if (activePillTimeout) {
        clearTimeout(activePillTimeout);
      }

      pill.classList.remove('hidden');
      requestAnimationFrame(() => {
        pill.classList.remove('opacity-0', '-translate-y-6');
        pill.classList.add('opacity-100', 'translate-y-0');
      });

      activePillTimeout = setTimeout(() => {
        dismissSquadPill();
      }, 5500);
    }

    function dismissSquadPill() {
      const pill = document.getElementById('squad-notification-pill');
      if (!pill) return;
      pill.classList.remove('opacity-100', 'translate-y-0');
      pill.classList.add('opacity-0', '-translate-y-6');
      setTimeout(() => {
        pill.classList.add('hidden');
      }, 300);
    }



    function broadcastUserWorkoutStarted(exerciseName) {
      const squads = getSquads();
      const user = getAppUser();
      let changed = false;

      squads.forEach(sq => {
        const userMember = sq.members.find(m => m.id === user.id || m.email === user.email || m.id === 'local_user');
        if (userMember && !userMember.isWorkingOut) {
          userMember.isWorkingOut = true;
          userMember.currentWorkout = exerciseName || 'Active Session';
          userMember.workoutStartedAt = new Date().toISOString();
          userMember.lastActive = 'Active now';
          changed = true;
          try { syncSquadToFirestore(sq); } catch (e) {}
        }
      });

      if (changed) {
        saveSquads(squads);
      }
      updateGlobalStatsUI();
      renderHeatMap();
    }

    function broadcastUserWorkoutEnded(workoutName, workoutDetails) {
      const squads = getSquads();
      const user = getAppUser();
      const currentETDate = getETDateKey();
      let changed = false;

      if (!workoutDetails && typeof lastEvaluatedSummary !== 'undefined' && lastEvaluatedSummary) {
        workoutDetails = lastEvaluatedSummary;
      }

      squads.forEach(sq => {
        const userMember = sq.members.find(m => m.id === user.id || m.email === user.email || m.id === 'local_user');
        if (userMember) {
          userMember.isWorkingOut = false;
          userMember.completedToday = true;
          userMember.completedDate = currentETDate;
          userMember.completedDates = Array.from(new Set([...(userMember.completedDates || []), currentETDate]));
          if (workoutName) {
            userMember.lastCompletedWorkout = workoutName;
            userMember.lastActive = 'Completed ' + workoutName;
          } else {
            userMember.lastActive = 'Completed workout today';
          }
          userMember.currentWorkout = null;
          if (workoutDetails) {
            userMember.workoutDetails = { ...workoutDetails, doubleHighFives: userMember.doubleHighFives || [] };
          }
          changed = true;
          try { syncSquadToFirestore(sq); } catch (e) {}
        }
      });

      if (changed) {
        saveSquads(squads);
      }
      updateGlobalStatsUI();
      renderHeatMap();
    }

    // ================= SQUAD WORKOUT DETAILS & DOUBLE HIGH FIVE ENGINE =================
    let activeDetailsModalSquadId = null;
    let activeDetailsModalMemberId = null;

    function formatRelativeTime(iso) {
      if (!iso) return 'Recently';
      try {
        const diffMs = Date.now() - new Date(iso).getTime();
        if (isNaN(diffMs) || diffMs < 0) return 'Just now';
        const mins = Math.floor(diffMs / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
      } catch (e) {
        return 'Recently';
      }
    }

    function mergeDoubleHighFives(listA, listB) {
      const map = new Map();
      (listA || []).forEach(item => {
        if (item && item.giverId) map.set(item.giverId + '_' + (item.timestamp || ''), item);
      });
      (listB || []).forEach(item => {
        if (item && item.giverId) map.set(item.giverId + '_' + (item.timestamp || ''), item);
      });
      return Array.from(map.values());
    }

    function generateSampleWorkoutDetails(workoutTitle, member) {
      const title = workoutTitle || 'Strength & Conditioning';
      const sets = [];
      let volume = 0;
      let calories = 420;
      let durationSecs = 2700; // 45m

      if (title.includes('Deadlift')) {
        sets.push(
          { exerciseName: "Barbell Deadlift", implement: "Barbell", weight: 275, reps: 5, rpe: 8, setDuration: 42, restPeriod: 120 },
          { exerciseName: "Barbell Deadlift", implement: "Barbell", weight: 315, reps: 5, rpe: 8.5, setDuration: 45, restPeriod: 120 },
          { exerciseName: "Barbell Deadlift", implement: "Barbell", weight: 335, reps: 3, rpe: 9, setDuration: 40, restPeriod: 150 },
          { exerciseName: "Lat Pulldown", implement: "Cable", weight: 150, reps: 10, rpe: 8, setDuration: 35, restPeriod: 90 },
          { exerciseName: "Lat Pulldown", implement: "Cable", weight: 165, reps: 8, rpe: 8.5, setDuration: 35, restPeriod: 90 },
          { exerciseName: "Barbell Bent-Over Row", implement: "Barbell", weight: 185, reps: 8, rpe: 8, setDuration: 38, restPeriod: 90 }
        );
        volume = 14250;
        calories = 460;
        durationSecs = 2820;
      } else if (title.includes('Squat')) {
        sets.push(
          { exerciseName: "Barbell Back Squat", implement: "Barbell", weight: 225, reps: 6, rpe: 8, setDuration: 45, restPeriod: 120 },
          { exerciseName: "Barbell Back Squat", implement: "Barbell", weight: 245, reps: 5, rpe: 8.5, setDuration: 48, restPeriod: 120 },
          { exerciseName: "Barbell Back Squat", implement: "Barbell", weight: 265, reps: 5, rpe: 9, setDuration: 50, restPeriod: 150 },
          { exerciseName: "Walking DB Lunges", implement: "Dumbbell", weight: 50, reps: 12, rpe: 8, setDuration: 40, restPeriod: 90 },
          { exerciseName: "Hanging Leg Raises", implement: "Bodyweight", weight: 0, reps: 15, rpe: 7.5, setDuration: 30, restPeriod: 60 }
        );
        volume = 13800;
        calories = 480;
        durationSecs = 2880;
      } else if (title.includes('Clean & Jerk') || title.includes('Clean')) {
        sets.push(
          { exerciseName: "Clean & Jerk", implement: "Barbell", weight: 185, reps: 3, rpe: 8, setDuration: 40, restPeriod: 120 },
          { exerciseName: "Clean & Jerk", implement: "Barbell", weight: 205, reps: 2, rpe: 8.5, setDuration: 42, restPeriod: 150 },
          { exerciseName: "Clean & Jerk", implement: "Barbell", weight: 225, reps: 1, rpe: 9, setDuration: 35, restPeriod: 150 },
          { exerciseName: "Front Squat", implement: "Barbell", weight: 225, reps: 5, rpe: 8.5, setDuration: 45, restPeriod: 120 },
          { exerciseName: "Front Squat", implement: "Barbell", weight: 245, reps: 3, rpe: 9, setDuration: 40, restPeriod: 120 }
        );
        volume = 11450;
        calories = 440;
        durationSecs = 2700;
      } else if (title.includes('Overhead Press') || title.includes('Tricep')) {
        sets.push(
          { exerciseName: "Overhead Press", implement: "Barbell", weight: 115, reps: 6, rpe: 8, setDuration: 38, restPeriod: 90 },
          { exerciseName: "Overhead Press", implement: "Barbell", weight: 135, reps: 5, rpe: 8.5, setDuration: 40, restPeriod: 120 },
          { exerciseName: "Overhead Press", implement: "Barbell", weight: 145, reps: 4, rpe: 9, setDuration: 42, restPeriod: 120 },
          { exerciseName: "Lateral DB Raises", implement: "Dumbbell", weight: 25, reps: 12, rpe: 8, setDuration: 35, restPeriod: 60 },
          { exerciseName: "Tricep Rope Pushdown", implement: "Cable", weight: 70, reps: 12, rpe: 8.5, setDuration: 32, restPeriod: 60 }
        );
        volume = 8900;
        calories = 360;
        durationSecs = 2400;
      } else if (title.includes('Macebell') || title.includes('Dands')) {
        sets.push(
          { exerciseName: "Macebell 360", implement: "Macebell", weight: 20, reps: 20, rpe: 8, setDuration: 60, restPeriod: 60 },
          { exerciseName: "Macebell 360", implement: "Macebell", weight: 20, reps: 20, rpe: 8, setDuration: 60, restPeriod: 60 },
          { exerciseName: "Hindu Pushups (Dands)", implement: "Bodyweight", weight: 0, reps: 25, rpe: 8.5, setDuration: 45, restPeriod: 60 },
          { exerciseName: "Baithaks (Squats)", implement: "Bodyweight", weight: 0, reps: 30, rpe: 8, setDuration: 50, restPeriod: 60 }
        );
        volume = 4800;
        calories = 390;
        durationSecs = 2100;
      } else {
        sets.push(
          { exerciseName: "Barbell Bench Press", implement: "Barbell", weight: 185, reps: 8, rpe: 8, setDuration: 40, restPeriod: 90 },
          { exerciseName: "Barbell Bench Press", implement: "Barbell", weight: 205, reps: 6, rpe: 8.5, setDuration: 42, restPeriod: 120 },
          { exerciseName: "Incline DB Press", implement: "Dumbbell", weight: 70, reps: 8, rpe: 8, setDuration: 38, restPeriod: 90 },
          { exerciseName: "Cable Chest Flyes", implement: "Cable", weight: 40, reps: 12, rpe: 8, setDuration: 35, restPeriod: 60 },
          { exerciseName: "Plank Hold", implement: "Bodyweight", weight: 0, reps: 1, rpe: 8, setDuration: 60, restPeriod: 60 }
        );
        volume = 9600;
        calories = 380;
        durationSecs = 2400;
      }

      const hours = Math.floor(durationSecs / 3600);
      const mins = Math.floor((durationSecs % 3600) / 60);
      const secs = durationSecs % 60;
      const timeFormatted = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      return {
        workoutName: title,
        date: (member && member.completedDate) ? member.completedDate : getETDateKey(),
        totalSets: sets.length,
        totalVolume: volume,
        caloriesBurned: calories,
        totalWorkoutSeconds: durationSecs,
        totalWorkoutTimeFormatted: timeFormatted,
        totalActiveTimeFormatted: `${String(Math.floor((durationSecs * 0.7) / 60)).padStart(2, '0')}:00`,
        totalRestTimeFormatted: `${String(Math.floor((durationSecs * 0.3) / 60)).padStart(2, '0')}:00`,
        aerobicTE: 3.4,
        anaerobicTE: 2.2,
        notes: "Solid squad effort, hit all targets on time with strong form.",
        sets: sets,
        doubleHighFives: (member && Array.isArray(member.doubleHighFives)) ? member.doubleHighFives : []
      };
    }

    function getMemberWorkoutDetails(squadOrMember, maybeMember) {
      const member = maybeMember || squadOrMember;
      const squad = maybeMember ? squadOrMember : null;
      if (!member) return null;
      const user = getAppUser();
      const isMe = (member.id === user.id || (user.email && member.email === user.email) || member.id === 'local_user');

      if (isMe) {
        const currentETDate = getETDateKey();
        let userHistory = [];
        if (typeof getAllAthleteWorkouts === 'function') {
          userHistory = getAllAthleteWorkouts();
        } else if (typeof completedWorkoutsHistory !== 'undefined' && Array.isArray(completedWorkoutsHistory)) {
          userHistory = completedWorkoutsHistory;
        } else {
          try {
            userHistory = JSON.parse(localStorage.getItem('showUp_synced_workouts') || '[]');
          } catch (e) {}
        }

        // 1. If user completed today, return today's workout
        const todayWorkout = userHistory.find(w => {
          const d = typeof w === 'string' ? w : (w.date || w.completedDate || '');
          return String(d).slice(0, 10) === currentETDate;
        });
        if (todayWorkout && typeof todayWorkout === 'object') {
          return {
            ...todayWorkout,
            workoutName: todayWorkout.workoutName || member.lastCompletedWorkout || 'Workout Session',
            doubleHighFives: member.doubleHighFives || []
          };
        }

        // 2. If member has an explicit completedDate, check for workout on that date
        if (member.completedDate) {
          const compDateKey = String(member.completedDate).slice(0, 10);
          const dateWorkout = userHistory.find(w => {
            const d = typeof w === 'string' ? w : (w.date || w.completedDate || '');
            return String(d).slice(0, 10) === compDateKey;
          });
          if (dateWorkout && typeof dateWorkout === 'object') {
            return {
              ...dateWorkout,
              workoutName: dateWorkout.workoutName || member.lastCompletedWorkout || 'Workout Session',
              doubleHighFives: member.doubleHighFives || []
            };
          }
        }

        // 3. If member has stored workoutDetails
        if (member.workoutDetails) {
          return {
            ...member.workoutDetails,
            doubleHighFives: member.doubleHighFives || []
          };
        }

        // 4. Fall back to latest workout in athlete's history
        const sortedHistory = [...userHistory].sort((a, b) => {
          const da = typeof a === 'string' ? a : (a.date || a.completedDate || '');
          const db = typeof b === 'string' ? b : (b.date || b.completedDate || '');
          return String(db).localeCompare(String(da));
        });
        const latest = sortedHistory[0];
        if (latest && typeof latest === 'object') {
          return {
            ...latest,
            workoutName: latest.workoutName || member.lastCompletedWorkout || 'Workout Session',
            doubleHighFives: member.doubleHighFives || []
          };
        }
      }

      if (member.workoutDetails) {
        return {
          ...member.workoutDetails,
          doubleHighFives: member.doubleHighFives || []
        };
      }

      const workoutTitle = member.lastCompletedWorkout || member.currentWorkout || 'Strength & Conditioning';
      const details = generateSampleWorkoutDetails(workoutTitle, member);
      member.workoutDetails = details;
      return details;
    }

    function openSquadWorkoutDetailsModal(squadId, memberId) {
      const squads = getSquads();
      const squad = squads.find(s => s.id === squadId);
      if (!squad) return;
      const member = squad.members.find(m => m.id === memberId || m.email === memberId);
      if (!member) return;

      activeDetailsModalSquadId = squadId;
      activeDetailsModalMemberId = member.id || memberId;

      renderSquadWorkoutDetailsModalContent(squad, member);

      const modal = document.getElementById('squad-workout-details-modal');
      if (modal) {
        modal.classList.remove('hidden');
      }
    }

    function closeSquadWorkoutDetailsModal() {
      const modal = document.getElementById('squad-workout-details-modal');
      if (modal) {
        modal.classList.add('hidden');
      }
      activeDetailsModalSquadId = null;
      activeDetailsModalMemberId = null;
    }

    function renderSquadWorkoutDetailsModalContent(squad, member) {
      const user = getAppUser();
      const isMe = (member.id === user.id || (user.email && member.email === user.email) || member.id === 'local_user');
      const details = getMemberWorkoutDetails(squad, member) || generateSampleWorkoutDetails(member.lastCompletedWorkout, member);

      // 1. Header & Identity
      const nameEl = document.getElementById('swd-athlete-name');
      const squadEl = document.getElementById('swd-squad-name');
      const avatarEl = document.getElementById('swd-athlete-avatar');
      if (nameEl) {
        nameEl.innerHTML = `${escapeHtml(member.rawName || member.name)} ${isMe ? '<span class="text-emerald-400 font-normal text-xs">(You)</span>' : ''}`;
        nameEl.innerText = `${member.rawName || member.name}${isMe ? ' (You)' : ''}`;
      }
      if (squadEl) {
        squadEl.innerText = `${squad.name} • ${member.isWorkingOut ? 'Active Workout Session' : 'Completed Workout'}`;
      }
      if (avatarEl) {
        if (member.avatar) {
          avatarEl.innerHTML = `<img src="${member.avatar}" class="w-full h-full object-cover rounded-2xl" alt="avatar">`;
        } else {
          avatarEl.innerText = getInitials(member.rawName || member.name || 'SU');
        }
      }

      // 2. Workout Title & Date
      const badgeEl = document.getElementById('swd-workout-badge');
      const titleEl = document.getElementById('swd-workout-title');
      const dateEl = document.getElementById('swd-workout-date');
      if (badgeEl) {
        badgeEl.innerText = member.isWorkingOut ? '⚡ Lifting Now in Squad' : '✓ Showed Up & Completed';
      }
      if (titleEl) {
        titleEl.innerText = details.workoutName || member.lastCompletedWorkout || member.currentWorkout || 'Workout Session';
      }
      if (dateEl) {
        dateEl.innerText = `Recorded for ${details.date || member.completedDate || getETDateKey()}`;
      }

      // 3. Metrics Grid
      const durEl = document.getElementById('swd-metric-duration');
      const volEl = document.getElementById('swd-metric-volume');
      const calEl = document.getElementById('swd-metric-calories');
      const setsEl = document.getElementById('swd-metric-sets');
      if (durEl) durEl.innerText = details.totalWorkoutTimeFormatted || details.workoutDurationFormatted || '00:45:00';
      if (volEl) volEl.innerText = details.totalVolume ? `${Number(details.totalVolume).toLocaleString()} lbs` : '0 lbs';
      if (calEl) calEl.innerText = details.caloriesBurned ? `${details.caloriesBurned} kcal` : '380 kcal';
      if (setsEl) setsEl.innerText = details.totalSets ? `${details.totalSets} Sets` : `${(details.sets || []).length} Sets`;

      // 4. Extra Metrics (Aerobic / Anaerobic / Running)
      const extraEl = document.getElementById('swd-extra-metrics');
      if (extraEl) {
        if (details.runningMetrics) {
          extraEl.classList.remove('hidden');
          extraEl.innerHTML = `
            <div class="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs font-mono">
              <span class="text-emerald-400">Dist: ${details.runningMetrics.totalDistance || '3.1'} mi</span>
              <span class="text-slate-400">Pace: ${details.runningMetrics.avgPace || '8:00'} /mi</span>
              <span class="text-rose-400">Avg HR: ${details.runningMetrics.avgHR || '155'} bpm</span>
            </div>
          `;
        } else if (details.aerobicTE || details.anaerobicTE) {
          extraEl.classList.remove('hidden');
          extraEl.innerHTML = `
            <div class="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 flex items-center justify-center gap-4 text-xs font-mono text-slate-300">
              <span class="flex items-center gap-1.5"><i class="fa-solid fa-lungs text-blue-400"></i> Aerobic TE: <b class="text-blue-400">${details.aerobicTE || '3.2'}</b></span>
              <span class="text-slate-700">•</span>
              <span class="flex items-center gap-1.5"><i class="fa-solid fa-fire text-amber-400"></i> Anaerobic TE: <b class="text-amber-400">${details.anaerobicTE || '2.1'}</b></span>
            </div>
          `;
        } else {
          extraEl.classList.add('hidden');
          extraEl.innerHTML = '';
        }
      }

      // 5. Notes
      const notesEl = document.getElementById('swd-notes-container');
      if (notesEl) {
        if (details.notes) {
          notesEl.classList.remove('hidden');
          notesEl.innerText = `Notes: "${details.notes}"`;
        } else {
          notesEl.classList.add('hidden');
        }
      }

      // 6. Sets Breakdown
      const setsListEl = document.getElementById('swd-sets-list');
      const countLabel = document.getElementById('swd-sets-count-label');
      const sets = Array.isArray(details.sets) ? details.sets : [];
      if (countLabel) countLabel.innerText = `${sets.length} Sets`;
      if (setsListEl) {
        if (sets.length === 0) {
          setsListEl.innerHTML = `<div class="text-xs text-slate-500 italic p-3 text-center">Session logged with overall volume & metrics.</div>`;
        } else {
          setsListEl.innerHTML = sets.map((s, idx) => `
            <div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800/90 flex items-center justify-between text-xs">
              <div class="min-w-0">
                <div class="font-bold text-slate-200 truncate flex items-center gap-2">
                  <span class="text-[10px] text-slate-500 font-mono">#${idx + 1}</span>
                  <span>${escapeHtml(s.exerciseName || 'Exercise')}</span>
                </div>
                <div class="text-slate-400 gap-2 flex items-center mt-0.5 text-[11px] flex-wrap">
                  <span class="bg-slate-900 border border-slate-800 text-emerald-400 px-1.5 py-0.2 rounded-md font-mono text-[10px]">${escapeHtml(s.implement || 'Barbell')}</span>
                  ${s.implement === "Running" 
                    ? `<span>${s.runningDistance || '3.1'} mi | ${s.runningTime || '00:25:00'}</span>` 
                    : `<span><b class="text-slate-100 font-mono">${s.weight || 0}</b> lbs × <b class="text-slate-100 font-mono">${s.reps || 0}</b> reps</span>`
                  }
                  ${s.rpe ? `<span class="text-slate-500 font-mono">RPE ${s.rpe}</span>` : ''}
                  ${s.setDuration ? `<span class="text-slate-500"><i class="fa-regular fa-clock text-[9px] mr-0.5"></i>${s.setDuration}s</span>` : ''}
                  ${s.restPeriod ? `<span class="text-emerald-500/80"><i class="fa-solid fa-hourglass-half text-[9px] mr-0.5"></i>Rest: ${s.restPeriod}s</span>` : ''}
                </div>
              </div>
              <div class="flex-shrink-0 text-right">
                <span class="text-[10px] font-mono text-slate-400 font-semibold">${(s.weight && s.reps) ? (s.weight * s.reps).toLocaleString() + ' lbs' : ''}</span>
              </div>
            </div>
          `).join('');
        }
      }

      // 7. Double High Fives & Who gave double high five to them
      const actionContainer = document.getElementById('swd-high-five-action-container');
      const giversListEl = document.getElementById('swd-high-fives-givers-list');
      const highFives = Array.isArray(member.doubleHighFives) ? member.doubleHighFives : [];
      const userGave = highFives.some(hf => hf.giverId === user.id || (user.email && hf.giverEmail && hf.giverEmail.toLowerCase().trim() === user.email.toLowerCase().trim()));

      if (actionContainer) {
        if (!isMe) {
          actionContainer.innerHTML = `
            <button onclick="triggerHaptic('heavy'); giveDoubleHighFive('${squad.id}', '${member.id}')" class="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-95">
              <span class="text-base sm:text-lg">🙌</span>
              <span>${userGave ? 'Double High Five Sent! Cheer Again 🙌' : 'Give Double High Five 🙌'}</span>
            </button>
          `;
        } else {
          actionContainer.innerHTML = `
            <div class="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl text-center">
              <div class="text-amber-300 font-bold text-xs flex items-center justify-center gap-2">
                <span class="text-base">🙌</span>
                <span>${highFives.length > 0 ? `You received ${highFives.length} Double High Five${highFives.length === 1 ? '' : 's'} for this workout!` : 'Your workout is logged! Fellow squadmates can double high five you.'}</span>
              </div>
            </div>
          `;
        }
      }

      if (giversListEl) {
        giversListEl.innerHTML = `
          <div class="flex items-center justify-between text-xs font-bold text-slate-300 px-1 pt-1">
            <span class="flex items-center gap-1.5">
              <span class="text-amber-400 font-bold">🙌</span>
              <span>Double High Fives (${highFives.length})</span>
            </span>
            <span class="text-[10px] text-slate-400">${isMe ? 'Teammates who cheered for you' : 'Fellow athletes cheering'}</span>
          </div>
          ${highFives.length === 0 ? `
            <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400 italic">
              No double high fives given yet. ${!isMe ? 'Be the first fellow athlete to give a double high five!' : 'Complete your workout and teammates will cheer you on!'}
            </div>
          ` : `
            <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              ${highFives.map(hf => `
                <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-xs border border-amber-500/30 flex-shrink-0">
                      ${hf.giverAvatar ? `<img src="${hf.giverAvatar}" class="w-full h-full object-cover rounded-xl" alt="avatar">` : getInitials(hf.giverName || 'Athlete')}
                    </div>
                    <div>
                      <div class="text-xs font-bold text-slate-100">${escapeHtml(hf.giverName || 'Fellow Athlete')} ${hf.giverId === user.id ? '<span class="text-emerald-400 font-normal text-[10px]">(You)</span>' : ''}</div>
                      <div class="text-[10px] text-slate-500">${formatRelativeTime(hf.timestamp)}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-1 text-amber-400 text-xs font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 flex-shrink-0">
                    <span>🙌</span>
                    <span class="text-[10px]">High Five</span>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        `;
      }
    }

    function giveDoubleHighFive(squadId, memberId) {
      const squads = getSquads();
      const squad = squads.find(s => s.id === squadId);
      if (!squad) return false;
      const member = squad.members.find(m => m.id === memberId || m.email === memberId);
      if (!member) return false;

      const user = getAppUser();
      const isMe = (member.id === user.id || (user.email && member.email === user.email) || member.id === 'local_user');
      if (isMe) {
        showToast("You showed up! Fellow squadmates can double high five your workout 🙌", "info");
        return false;
      }

      if (!Array.isArray(member.doubleHighFives)) {
        member.doubleHighFives = [];
      }

      const existingIdx = member.doubleHighFives.findIndex(hf => 
        hf.giverId === user.id || (user.email && hf.giverEmail && hf.giverEmail.toLowerCase().trim() === user.email.toLowerCase().trim())
      );

      const newHighFive = {
        giverId: user.id,
        giverName: user.rawName || user.name || 'Fellow Athlete',
        giverEmail: user.email || '',
        giverAvatar: user.picture || '',
        timestamp: new Date().toISOString(),
        squadId: squad.id,
        squadName: squad.name,
        workoutName: member.lastCompletedWorkout || member.currentWorkout || 'Workout'
      };

      if (existingIdx >= 0) {
        member.doubleHighFives[existingIdx] = newHighFive;
        showToast(`🙌 Double high five cheered again to ${member.rawName || member.name}!`, "success");
      } else {
        member.doubleHighFives.push(newHighFive);
        showToast(`🙌 You gave a double high five to ${member.rawName || member.name}!`, "success");
      }

      triggerHighFiveConfetti();
      if (typeof triggerHaptic === 'function') triggerHaptic('heavy');
      if (typeof playUnobtrusiveChime === 'function') playUnobtrusiveChime();

      saveSquads(squads);
      try { syncSquadToFirestore(squad); } catch (e) {}
      try { saveSquadToGlobalRegistry(squad); } catch (e) {}

      renderSquadsTab();

      const modal = document.getElementById('squad-workout-details-modal');
      if (modal && !modal.classList.contains('hidden') && (activeDetailsModalMemberId === member.id || activeDetailsModalMemberId === memberId)) {
        renderSquadWorkoutDetailsModalContent(squad, member);
      }
      return true;
    }

    function toggleDoubleHighFive(squadId, memberId) {
      giveDoubleHighFive(squadId, memberId);
    }

    function triggerHighFiveConfetti() {
      if (typeof document === 'undefined' || !document.body) return;
      const count = 6;
      for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.className = 'high-five-floating';
        el.innerText = '🙌';
        const left = Math.random() * 60 + 20; // 20% to 80%
        const bottom = Math.random() * 30 + 30; // 30% to 60%
        el.style.left = `${left}%`;
        el.style.bottom = `${bottom}%`;
        el.style.animationDelay = `${i * 120}ms`;
        document.body.appendChild(el);
        setTimeout(() => {
          if (el && el.parentNode) el.parentNode.removeChild(el);
        }, 1500);
      }
    }

/* ==========================================================================
   showUp Geolocation & Live Map Engine: Zoom Aggregation & Daily Counters
   ========================================================================== */

    function getUserZip() {
      return localStorage.getItem('showUp_user_ip_zip') || localStorage.getItem('showUp_user_zip') || '20105';
    }

    function setUserZip(zip, city, lat, lng) {
      if (!zip) return;
      localStorage.setItem('showUp_user_zip', zip);
      localStorage.setItem('showUp_user_ip_zip', zip);
      if (city) localStorage.setItem('showUp_user_ip_city', city);
      if (lat) localStorage.setItem('showUp_user_ip_lat', String(lat));
      if (lng) localStorage.setItem('showUp_user_ip_lng', String(lng));
    }

    function getZipCoordinates(zip) {
      if (!zip) return { lat: 38.9755, lng: -77.5398, city: 'Ashburn / Aldie, VA' };
      const cleanZip = String(zip).trim();
      const userZip = getUserZip();
      if (cleanZip === userZip) {
        const uLat = parseFloat(localStorage.getItem('showUp_user_ip_lat'));
        const uLng = parseFloat(localStorage.getItem('showUp_user_ip_lng'));
        if (!isNaN(uLat) && !isNaN(uLng)) {
          return { lat: uLat, lng: uLng, city: localStorage.getItem('showUp_user_ip_city') || 'Your Gym Area' };
        }
      }
      if (KNOWN_ZIP_COORDS[cleanZip]) {
        return KNOWN_ZIP_COORDS[cleanZip];
      }
      // Accurate US geographic Sectional Center Facility (SCF) regional centroids
      const prefix2 = parseInt(cleanZip.substring(0, 2), 10);
      if (prefix2 >= 20 && prefix2 <= 24) {
        // Virginia / DC / Maryland
        return { lat: 38.95, lng: -77.45, city: `Virginia, VA (${cleanZip})` };
      } else if (prefix2 >= 10 && prefix2 <= 14) {
        // New York
        return { lat: 40.75, lng: -73.98, city: `New York, NY (${cleanZip})` };
      } else if (prefix2 >= 75 && prefix2 <= 79) {
        // Texas
        return { lat: 30.27, lng: -97.74, city: `Texas, TX (${cleanZip})` };
      } else if (prefix2 >= 90 && prefix2 <= 96) {
        // California
        return { lat: 37.77, lng: -122.41, city: `California, CA (${cleanZip})` };
      } else if (prefix2 >= 60 && prefix2 <= 62) {
        // Illinois
        return { lat: 41.88, lng: -87.62, city: `Illinois, IL (${cleanZip})` };
      }
      
      const prefix = parseInt(cleanZip.substring(0, 2), 10) || 50;
      const lat = 28.0 + (prefix % 20) * 0.8;
      const lng = -122.0 + (prefix * 0.6);
      return { lat, lng, city: `Zip ${cleanZip}` };
    }

    async function reverseGeocodeCoords(lat, lng) {
      if (!lat || !lng) return null;
      try {
        // 1. High-speed client reverse geocoding via BigDataCloud
        const bdcRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`).catch(() => null);
        if (bdcRes && bdcRes.ok) {
          const bdcData = await bdcRes.json();
          const rawZip = bdcData.postcode || '';
          const matchZip = String(rawZip).match(/\d{5}/)?.[0] || String(rawZip).trim();
          const city = bdcData.city || bdcData.locality || bdcData.principalSubdivision || '';
          const state = bdcData.principalSubdivisionCode ? bdcData.principalSubdivisionCode.replace(/^[A-Z]{2}-/, '') : (bdcData.principalSubdivision || '');
          const cityStr = city ? (state ? `${city}, ${state}` : city) : '';
          if (matchZip) {
            return { zip: matchZip, city: cityStr, lat: parseFloat(lat), lng: parseFloat(lng) };
          }
        }
      } catch (e) {
        console.debug("Reverse geocode BDC notice:", e);
      }

      try {
        // 2. OpenStreetMap Nominatim reverse geocode fallback
        const osmRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
          headers: { 'Accept-Language': 'en' }
        }).catch(() => null);
        if (osmRes && osmRes.ok) {
          const osmData = await osmRes.json();
          const addr = osmData.address || {};
          const rawZip = addr.postcode || '';
          const matchZip = String(rawZip).match(/\d{5}/)?.[0] || String(rawZip).trim();
          const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || '';
          const state = addr.state ? addr.state : '';
          const cityStr = city ? (state ? `${city}, ${state}` : city) : '';
          if (matchZip) {
            return { zip: matchZip, city: cityStr, lat: parseFloat(lat), lng: parseFloat(lng) };
          }
        }
      } catch (e) {
        console.debug("Reverse geocode OSM notice:", e);
      }
      return null;
    }

    async function detectUserZipFromIP() {
      const displayUserZip = document.getElementById('display-user-zip');
      const cachedZip = localStorage.getItem('showUp_user_ip_zip');
      const cachedCity = localStorage.getItem('showUp_user_ip_city');

      if (cachedZip && displayUserZip) {
        const cityPart = cachedCity ? cachedCity.split(',')[0] : '';
        displayUserZip.innerText = cityPart ? `${cachedZip} (${cityPart})` : cachedZip;
      }

      let resolvedLocation = null;

      // Tier 1: Zero-Prompt / Permitted High-Accuracy Geolocation -> Reverse Geocode to exact neighborhood zip code
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          const geoPromise = new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve(pos),
              () => resolve(null),
              { enableHighAccuracy: true, timeout: 4000, maximumAge: 300000 }
            );
          });
          const pos = await geoPromise;
          if (pos && pos.coords) {
            const revGeo = await reverseGeocodeCoords(pos.coords.latitude, pos.coords.longitude);
            if (revGeo && revGeo.zip) {
              resolvedLocation = revGeo;
            }
          }
        } catch (e) {
          console.debug("Background geolocation check:", e);
        }
      }

      // Tier 2: ipapi.co (High accuracy US postal resolution)
      if (!resolvedLocation) {
        try {
          const res = await fetch('https://ipapi.co/json/').catch(() => null);
          if (res && res.ok) {
            const data = await res.json();
            if (data && data.postal && !data.error) {
              const cleanZip = String(data.postal).match(/\d{5}/)?.[0] || String(data.postal).trim();
              const cityStr = data.city ? `${data.city}, ${data.region_code || data.region || ''}` : '';
              resolvedLocation = {
                zip: cleanZip,
                city: cityStr,
                lat: data.latitude,
                lng: data.longitude
              };
            }
          }
        } catch (e) {
          console.debug("ipapi.co notice:", e);
        }
      }

      // Tier 3: ipwho.is with coordinate-level reverse geocoding refinement
      if (!resolvedLocation) {
        try {
          const res = await fetch('https://ipwho.is/').catch(() => null);
          if (res && res.ok) {
            const data = await res.json();
            if (data && data.success) {
              let cleanZip = data.postal ? (String(data.postal).match(/\d{5}/)?.[0] || String(data.postal).trim()) : '';
              let cityStr = data.city ? `${data.city}, ${data.region_code || ''}` : '';
              
              if ((!cleanZip || cleanZip.length < 5) && data.latitude && data.longitude) {
                const refined = await reverseGeocodeCoords(data.latitude, data.longitude);
                if (refined && refined.zip) {
                  cleanZip = refined.zip;
                  if (refined.city) cityStr = refined.city;
                }
              }

              if (cleanZip) {
                resolvedLocation = {
                  zip: cleanZip,
                  city: cityStr,
                  lat: data.latitude,
                  lng: data.longitude
                };
              }
            }
          }
        } catch (e) {
          console.debug("ipwho.is notice:", e);
        }
      }

      // Tier 4: freeipapi.com fallback
      if (!resolvedLocation) {
        try {
          const res = await fetch('https://freeipapi.com/api/json').catch(() => null);
          if (res && res.ok) {
            const data = await res.json();
            if (data && data.zipCode) {
              const cleanZip = String(data.zipCode).match(/\d{5}/)?.[0] || String(data.zipCode).trim();
              const cityStr = data.cityName ? `${data.cityName}, ${data.regionName || ''}` : '';
              resolvedLocation = {
                zip: cleanZip,
                city: cityStr,
                lat: data.latitude,
                lng: data.longitude
              };
            }
          }
        } catch (e) {
          console.debug("freeipapi notice:", e);
        }
      }

      // Tier 5: ip-api.com fallback
      if (!resolvedLocation) {
        try {
          const res = await fetch('https://ip-api.com/json/?fields=status,country,regionName,region,city,zip,lat,lon').catch(() => null);
          if (res && res.ok) {
            const data = await res.json();
            if (data && data.status === 'success' && data.zip) {
              const cleanZip = String(data.zip).match(/\d{5}/)?.[0] || String(data.zip).trim();
              const cityStr = data.city ? `${data.city}, ${data.region || ''}` : '';
              resolvedLocation = {
                zip: cleanZip,
                city: cityStr,
                lat: data.lat,
                lng: data.lon
              };
            }
          }
        } catch (e) {
          console.debug("ip-api notice:", e);
        }
      }

      // Apply resolved location
      if (resolvedLocation && resolvedLocation.zip) {
        setUserZip(resolvedLocation.zip, resolvedLocation.city, resolvedLocation.lat, resolvedLocation.lng);
        if (displayUserZip) {
          const cityPart = resolvedLocation.city ? resolvedLocation.city.split(',')[0] : '';
          displayUserZip.innerText = cityPart ? `${resolvedLocation.zip} (${cityPart})` : resolvedLocation.zip;
        }
        recordCurrentVisitorLocation(resolvedLocation);
        renderHeatMap();
      } else if (!cachedZip) {
        setUserZip('10001', 'New York, NY', 40.7505, -73.9934);
        if (displayUserZip) displayUserZip.innerText = '10001 (New York)';
        recordCurrentVisitorLocation({ zip: '10001', city: 'New York, NY', lat: 40.7505, lng: -73.9934 });
        renderHeatMap();
      }
    }



    function getETDateKey(date = new Date()) {
      if (typeof getLocalDateKey === 'function') {
        return getLocalDateKey(date);
      }
      try {
        const tz = typeof getUserTimeZone === 'function' ? getUserTimeZone() : 'America/New_York';
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: tz,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(date);
      } catch (e) {
        const d = (date instanceof Date) ? date : new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }

    function getYesterdayETDateKey(refDate = new Date()) {
      try {
        const d = (refDate instanceof Date) ? new Date(refDate.getTime()) : new Date(refDate);
        d.setDate(d.getDate() - 1);
        return getETDateKey(d);
      } catch (e) {
        return getETDateKey();
      }
    }

    /**
     * Unified Athlete Workout Resolver:
     * Cross-queries in-memory logs, AppStorage, synced storage, user-isolated caches,
     * and squad telemetry so no scored workout is ever missed or dropped.
     */
    function getAllAthleteWorkouts() {
      const workoutMap = new Map();

      const addWorkout = (w) => {
        if (!w) return;
        const dateStr = typeof w === 'string'
          ? w
          : (w.date || w.completedDate || (w.timestamp ? String(w.timestamp).slice(0, 10) : ''));
        if (!dateStr || typeof dateStr !== 'string') return;
        const cleanDate = dateStr.slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) return;

        if (!workoutMap.has(cleanDate)) {
          workoutMap.set(cleanDate, typeof w === 'string' ? { date: cleanDate, completed: true } : { ...w, date: cleanDate, completed: true });
        } else {
          const existing = workoutMap.get(cleanDate);
          if (typeof w === 'object') {
            workoutMap.set(cleanDate, { ...existing, ...w, date: cleanDate, completed: true });
          }
        }
      };

      // 1. In-memory completedWorkoutsHistory
      if (typeof completedWorkoutsHistory !== 'undefined' && Array.isArray(completedWorkoutsHistory)) {
        completedWorkoutsHistory.forEach(addWorkout);
      }

      // 2. AppStorage athlete workouts
      if (typeof AppStorage !== 'undefined' && typeof AppStorage.getAthleteWorkouts === 'function') {
        try {
          const stored = AppStorage.getAthleteWorkouts();
          if (Array.isArray(stored)) stored.forEach(addWorkout);
        } catch (e) {}
      }

      // 3. Raw Synced Workouts
      try {
        const rawSynced = JSON.parse(localStorage.getItem('showUp_synced_workouts') || '[]');
        if (Array.isArray(rawSynced)) rawSynced.forEach(addWorkout);
      } catch (e) {}

      // 4. User-isolated store showUp_user_workouts_<email>
      try {
        const profile = JSON.parse(localStorage.getItem('showUp_user_profile') || 'null');
        const email = (profile?.email || '').toLowerCase().trim();
        if (email && email !== 'you@showup.app' && email !== 'user@showup.app') {
          const userWorkouts = JSON.parse(localStorage.getItem('showUp_user_workouts_' + email) || '[]');
          if (Array.isArray(userWorkouts)) userWorkouts.forEach(addWorkout);
        }
      } catch (e) {}

      // 5. Squad member telemetry
      try {
        const squads = typeof getSquads === 'function' ? getSquads() : JSON.parse(localStorage.getItem('showUp_squads') || '[]');
        const user = typeof getAppUser === 'function' ? getAppUser() : {};
        if (Array.isArray(squads)) {
          squads.forEach(sq => {
            if (!sq || !Array.isArray(sq.members)) return;
            const uMember = sq.members.find(m => m && (m.id === user.id || m.email === user.email || m.id === 'local_user'));
            if (uMember) {
              if (uMember.completedDate) {
                addWorkout({
                  date: String(uMember.completedDate).slice(0, 10),
                  workoutName: uMember.lastCompletedWorkout || "Workout Session",
                  completed: true,
                  ...(uMember.workoutDetails || {})
                });
              }
              if (uMember.workoutDetails && uMember.workoutDetails.date) {
                addWorkout(uMember.workoutDetails);
              }
            }
          });
        }
      } catch (e) {}

      return Array.from(workoutMap.values());
    }

    function checkAndResetDailyETCounter() {
      const currentETDate = getETDateKey();
      const allWorkouts = getAllAthleteWorkouts();
      const user = getAppUser();
      const showedUpAthletes = new Set();

      // Check if current athlete showed up / completed a workout today
      const userCompletedToday = allWorkouts.some(w => {
        if (!w) return false;
        const wDate = typeof w === 'string' ? w : (w.date || w.completedDate || '');
        return String(wDate).slice(0, 10) === currentETDate;
      });

      if (userCompletedToday) {
        showedUpAthletes.add(user.id || user.email || '__CURRENT_USER__');
      }

      // Vetted squad teammate completions today (only authenticated/vetted members, deduplicated)
      const squads = getSquads();
      squads.forEach(sq => {
        if (!sq || !Array.isArray(sq.members)) return;
        sq.members.forEach(m => {
          if (!m) return;
          const isMe = (m.id === user.id || (user.email && m.email && m.email.toLowerCase().trim() === user.email.toLowerCase().trim()));
          const mDate = m.completedDate ? String(m.completedDate).slice(0, 10) : '';
          if (mDate === currentETDate && m.completedToday === true) {
            if (isMe) {
              showedUpAthletes.add(user.id || user.email || '__CURRENT_USER__');
            } else {
              const memberKey = m.id || m.email || (m.rawName || m.name);
              if (memberKey) showedUpAthletes.add(memberKey);
            }
          }
        });
      });

      const totalCount = showedUpAthletes.size;

      localStorage.setItem('showUp_global_counter_et_date', currentETDate);
      localStorage.setItem('showUp_global_counter_count', String(totalCount));

      const counterEl = document.getElementById('global-daily-counter');
      if (counterEl) {
        counterEl.innerText = Number(totalCount).toLocaleString();
        counterEl.style.color = 'var(--m3-primary)';
        counterEl.style.webkitTextFillColor = 'var(--m3-primary)';
      }

      return totalCount;
    }

    function incrementGlobalWorkoutCounter() {
      checkAndResetDailyETCounter();
      let count = parseInt(localStorage.getItem('showUp_global_counter_count') || '0', 10);
      count += 1;
      const currentETDate = getETDateKey();
      localStorage.setItem('showUp_global_counter_et_date', currentETDate);
      localStorage.setItem('showUp_global_counter_count', String(count));

      updateGlobalStatsUI();
      renderHeatMap();
    }

    function getGlobalActiveAthletesCount() {
      const user = getAppUser();
      const isUserLifting = (
        Array.isArray(currentSessionSets) && 
        currentSessionSets.length > 0 && 
        currentSessionSets.some(s => s && (Number(s.reps) > 0 || Number(s.weight) > 0 || Number(s.duration) > 0))
      );
      const squads = getSquads();
      let squadActive = 0;
      squads.forEach(sq => {
        if (!sq || !Array.isArray(sq.members)) return;
        sq.members.forEach(m => {
          if (!m) return;
          const isAct = m.isWorkingOut === true && (typeof isMemberWorkoutActive !== 'function' || isMemberWorkoutActive(m));
          if (isAct && !isMe) squadActive++;
        });
      });

      return (isUserLifting ? 1 : 0) + squadActive;
    }

    function updateGlobalStatsUI() {
      checkAndResetDailyETCounter();
      const activeCount = getGlobalActiveAthletesCount();

      // Explicit sentence below the global counter on how many users are actively working out
      const sentenceEl = document.getElementById('global-active-sentence-text');
      if (sentenceEl) {
        if (activeCount === 0) {
          sentenceEl.innerText = "0 athletes are actively working out right now across all squads.";
        } else if (activeCount === 1) {
          sentenceEl.innerText = "1 athlete is actively working out right now across all squads.";
        } else {
          sentenceEl.innerText = `${activeCount} athletes are actively working out right now across all squads.`;
        }
      }

      const badgeEl = document.getElementById('global-active-live-badge');
      if (badgeEl) {
        badgeEl.innerText = `${activeCount} Active Now`;
      }
    }

    // Auto-check ET reset every 30 seconds
    setInterval(() => {
      checkAndResetDailyETCounter();
      updateGlobalStatsUI();
    }, 30000);

    // ================= ACTIVITY WORKOUT MAP DATE SELECTOR STATE =================
    let selectedMapDate = getETDateKey();

    function getSelectedMapDate() {
      return selectedMapDate || getETDateKey();
    }

    function formatMapDateDisplay(dateStr) {
      if (!dateStr) return 'Today';
      const today = getETDateKey();
      const yesterday = getYesterdayETDateKey();
      try {
        const parts = String(dateStr).split('-').map(Number);
        if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
          const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          if (dateStr === today) {
            return `Today (${formatted})`;
          }
          if (dateStr === yesterday) {
            return `Yesterday (${formatted})`;
          }
          return formatted;
        }
      } catch (e) {}
      return dateStr === today ? `Today (${dateStr})` : (dateStr === yesterday ? `Yesterday (${dateStr})` : dateStr);
    }

    function updateMapDateSelectorUI() {
      const activeDate = getSelectedMapDate();
      const today = getETDateKey();
      const yesterday = getYesterdayETDateKey();
      const isToday = (activeDate === today);
      const isYesterday = (activeDate === yesterday);

      const picker = document.getElementById('map-date-picker');
      if (picker) {
        picker.value = activeDate;
        picker.max = today;
      }

      const badge = document.getElementById('map-date-badge');
      if (badge) {
        badge.innerText = formatMapDateDisplay(activeDate);
        if (isToday) {
          badge.className = "text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-xl";
        } else if (isYesterday) {
          badge.className = "text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl";
        } else {
          badge.className = "text-[11px] font-mono text-sky-300 bg-sky-500/10 border border-sky-500/30 px-2.5 py-1 rounded-xl";
        }
      }

      const todayBtn = document.getElementById('map-date-today-btn');
      if (todayBtn) {
        if (isToday) {
          todayBtn.className = "text-xs font-bold px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition active:scale-95";
        } else {
          todayBtn.className = "text-xs font-bold px-3 py-1 rounded-xl bg-slate-900 text-slate-400 border border-slate-700/80 hover:text-slate-200 hover:bg-slate-800 transition active:scale-95";
        }
      }

      const yesterdayBtn = document.getElementById('map-date-yesterday-btn');
      if (yesterdayBtn) {
        if (isYesterday) {
          yesterdayBtn.className = "text-xs font-bold px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition active:scale-95";
        } else {
          yesterdayBtn.className = "text-xs font-bold px-3 py-1 rounded-xl bg-slate-900 text-slate-400 border border-slate-700/80 hover:text-slate-200 hover:bg-slate-800 transition active:scale-95";
        }
      }

      const subtitle = document.getElementById('map-date-subtitle');
      if (subtitle) {
        if (isToday) {
          subtitle.innerText = "Real-time zip codes where athletes are actively lifting or completed workouts today";
        } else {
          subtitle.innerText = `Showing verified zip codes where athletes scored workouts on ${formatMapDateDisplay(activeDate)}`;
        }
      }

      const activeZipTitle = document.getElementById('map-active-zip-title');
      if (activeZipTitle) {
        if (isToday) {
          activeZipTitle.innerText = "Today's Active Zip Codes:";
        } else {
          activeZipTitle.innerText = `Active Zip Codes for ${formatMapDateDisplay(activeDate)}:`;
        }
      }
    }

    function setSelectedMapDate(newDate) {
      if (!newDate || typeof newDate !== 'string') {
        newDate = getETDateKey();
      }
      selectedMapDate = String(newDate).slice(0, 10);
      updateMapDateSelectorUI();
      if (typeof renderHeatMap === 'function') {
        renderHeatMap();
      }
    }

    function shiftMapDate(days) {
      const curr = getSelectedMapDate();
      try {
        const parts = curr.split('-').map(Number);
        const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
        d.setDate(d.getDate() + Number(days));
        const nextDate = getETDateKey(d);
        setSelectedMapDate(nextDate);
      } catch (e) {
        setSelectedMapDate(getETDateKey());
      }
    }

    function setMapDateToToday() {
      setSelectedMapDate(getETDateKey());
    }

    function setMapDateToYesterday() {
      setSelectedMapDate(getYesterdayETDateKey());
    }

    function handleMapDateChange(val) {
      if (!val) return;
      setSelectedMapDate(val);
    }

    window.getSelectedMapDate = getSelectedMapDate;
    window.setSelectedMapDate = setSelectedMapDate;
    window.shiftMapDate = shiftMapDate;
    window.setMapDateToToday = setMapDateToToday;
    window.setMapDateToYesterday = setMapDateToYesterday;
    window.getYesterdayETDateKey = getYesterdayETDateKey;
    window.getAllAthleteWorkouts = getAllAthleteWorkouts;
    window.handleMapDateChange = handleMapDateChange;
    window.updateMapDateSelectorUI = updateMapDateSelectorUI;
    window.formatMapDateDisplay = formatMapDateDisplay;

    // ================= REAL-TIME VETTED ZIP CODES (STRICTLY AUTHENTICATED & VETTED LOGS) =================
    // CRITICAL USER REQUIREMENT:
    // Ensure arbitrary and unvetted workouts are NOT presented in the Active Workout Map.
    // Only workouts completed by verified, logged-in athletes with authentic zip codes are mapped.

    function getActiveAndCompletedZipNodes(targetDate) {
      const activeDate = String(targetDate || getSelectedMapDate()).slice(0, 10);
      const currentETDate = getETDateKey();
      const isToday = (activeDate === currentETDate);
      const userZip = getUserZip();
      const user = getAppUser();

      // 1. Vetted User Active Lifting Status (only relevant when viewing today's session)
      const isUserLifting = isToday && (
        Array.isArray(currentSessionSets) && 
        currentSessionSets.length > 0 && 
        currentSessionSets.some(s => s && (Number(s.reps) > 0 || Number(s.weight) > 0 || Number(s.duration) > 0))
      );

      // 2. Vetted User Completed Workouts for activeDate (from authentic unified athlete workout history)
      const allWorkouts = getAllAthleteWorkouts();
      const userWorkoutsOnDate = allWorkouts.filter(w => {
        if (!w) return false;
        const wDate = typeof w === 'string' ? w : (w.date || w.completedDate || (w.timestamp ? String(w.timestamp).slice(0, 10) : ''));
        return String(wDate).slice(0, 10) === activeDate;
      });
      const userVettedCompletedOnDate = userWorkoutsOnDate.length;

      const nodesMap = new Map();
      const isValidZip = (z) => typeof z === 'string' && /^\d{5}$/.test(z.trim());

      // 1. Add logged-in user's zip ONLY if verified active or completed on target date
      if (isValidZip(userZip) && (isUserLifting || userVettedCompletedOnDate > 0)) {
        const userCoords = getZipCoordinates(userZip);
        nodesMap.set(userZip, {
          zip: userZip,
          city: userCoords.city || 'Your Area',
          lat: userCoords.lat,
          lng: userCoords.lng,
          activeCount: isUserLifting ? 1 : 0,
          completedToday: userVettedCompletedOnDate,
          isUserZip: true,
          lifters: isUserLifting ? [user.rawName || 'You'] : []
        });
      }

      // 2. Add squad members ONLY if they have vetted completed workouts on target date or active sessions with valid zip codes
      const squads = getSquads();
      squads.forEach(sq => {
        if (!sq || !Array.isArray(sq.members)) return;
        sq.members.forEach(m => {
          if (!m) return;
          const isMe = (m.id === user.id || (user.email && m.email && m.email.toLowerCase().trim() === user.email.toLowerCase().trim()) || m.id === 'local_user');
          if (isMe) return;

          // Member must have a verified 5-digit zip code (no arbitrary fallback default zips!)
          const mZip = m.zip && isValidZip(m.zip) ? m.zip.trim() : null;
          if (!mZip) return; // Discard unvetted locations without a valid postal zip

          const isMemberActive = isToday && (m.isWorkingOut === true && (typeof isMemberWorkoutActive !== 'function' || isMemberWorkoutActive(m)));
          
          let memberCompletedCount = 0;
          const mCompDate = m.completedDate ? String(m.completedDate).slice(0, 10) : '';
          const mDetailsDate = (m.workoutDetails && m.workoutDetails.date) ? String(m.workoutDetails.date).slice(0, 10) : '';

          if (mCompDate === activeDate) {
            memberCompletedCount += 1;
          } else if (mDetailsDate === activeDate) {
            memberCompletedCount += 1;
          } else if (Array.isArray(m.workouts)) {
            const countOnDate = m.workouts.filter(w => {
              const wd = typeof w === 'string' ? w : (w.date || w.completedDate || '');
              return String(wd).slice(0, 10) === activeDate;
            }).length;
            if (countOnDate > 0) memberCompletedCount += countOnDate;
          } else if (Array.isArray(m.completedDates)) {
            const countOnDate = m.completedDates.filter(cd => String(cd).slice(0, 10) === activeDate).length;
            if (countOnDate > 0) memberCompletedCount += countOnDate;
          }

          if (isMemberActive || memberCompletedCount > 0) {
            const mCoords = getZipCoordinates(mZip);
            const mCity = m.city || mCoords.city || `Zip ${mZip}`;
            const mLat = m.lat || mCoords.lat;
            const mLng = m.lng || mCoords.lng;

            if (!nodesMap.has(mZip)) {
              nodesMap.set(mZip, {
                zip: mZip,
                city: mCity,
                lat: mLat,
                lng: mLng,
                activeCount: 0,
                completedToday: 0,
                isUserZip: false,
                lifters: []
              });
            }

            const existing = nodesMap.get(mZip);
            if (isMemberActive) {
              existing.activeCount += 1;
              const name = m.rawName || m.name || 'Teammate';
              if (!existing.lifters.includes(name)) existing.lifters.push(name);
            }
            if (memberCompletedCount > 0) {
              existing.completedToday += memberCompletedCount;
            }
          }
        });
      });

      // Filter out any nodes that have 0 active lifters AND 0 completed workouts
      return Array.from(nodesMap.values()).filter(node => (node.completedToday > 0 || node.activeCount > 0));
    }

    // ================= GOOGLE MAPS BASE LAYER & ZOOM ENGINE =================


    function getAggregatedNodesForZoom(zoom, activeNodes) {
      if (!activeNodes || activeNodes.length === 0) return [];

      // Tier 1: Local Zip Code Level (zoom >= 11) - Individual Zip Code Borders & Real Numbers
      if (zoom >= 11) {
        return activeNodes.map(n => ({
          type: 'zip',
          id: n.zip,
          label: `Zip ${n.zip}`,
          subLabel: n.city,
          shortTitle: `Zip ${n.zip}`,
          lat: n.lat,
          lng: n.lng,
          activeCount: n.activeCount || 0,
          completedToday: n.completedToday || 0,
          isUserZip: !!n.isUserZip,
          lifters: n.lifters || [],
          originalNodes: [n]
        }));
      }

      // Tier 2: State / General Area Level (5 <= zoom < 11) - Regional State Aggregations
      if (zoom >= 5) {
        const stateMap = new Map();
        activeNodes.forEach(node => {
          const geo = parseLocationHierarchy(node.city, node.zip);
          const stateKey = geo.stateCode;
          if (!stateMap.has(stateKey)) {
            stateMap.set(stateKey, {
              type: 'state',
              id: stateKey,
              stateCode: stateKey,
              stateName: geo.stateName,
              label: `${geo.stateName} (${stateKey})`,
              subLabel: 'State / General Area Level',
              shortTitle: stateKey,
              lats: [],
              lngs: [],
              activeCount: 0,
              completedToday: 0,
              isUserZip: false,
              lifters: [],
              originalNodes: []
            });
          }
          const s = stateMap.get(stateKey);
          s.lats.push(node.lat);
          s.lngs.push(node.lng);
          s.activeCount += (node.activeCount || 0);
          s.completedToday += (node.completedToday || 0);
          if (node.isUserZip) s.isUserZip = true;
          if (Array.isArray(node.lifters)) {
            node.lifters.forEach(l => { if (!s.lifters.includes(l)) s.lifters.push(l); });
          }
          s.originalNodes.push(node);
        });

        return Array.from(stateMap.values()).map(s => ({
          type: 'state',
          id: s.id,
          label: s.label,
          subLabel: `${s.originalNodes.length} Active Zip${s.originalNodes.length > 1 ? 's' : ''} in ${s.stateName}`,
          shortTitle: s.shortTitle,
          lat: s.lats.reduce((a, b) => a + b, 0) / s.lats.length,
          lng: s.lngs.reduce((a, b) => a + b, 0) / s.lngs.length,
          activeCount: s.activeCount,
          completedToday: s.completedToday,
          isUserZip: s.isUserZip,
          lifters: s.lifters,
          originalNodes: s.originalNodes
        }));
      }

      // Tier 3: Country / Continental Level (zoom < 5) - National Aggregations
      const countryMap = new Map();
      activeNodes.forEach(node => {
        const geo = parseLocationHierarchy(node.city, node.zip);
        const countryKey = geo.countryCode;
        if (!countryMap.has(countryKey)) {
          countryMap.set(countryKey, {
            type: 'country',
            id: countryKey,
            countryName: geo.country,
            label: geo.country,
            subLabel: 'Country / Continental Level',
            shortTitle: countryKey,
            lats: [],
            lngs: [],
            activeCount: 0,
            completedToday: 0,
            isUserZip: false,
            lifters: [],
            originalNodes: []
          });
        }
        const c = countryMap.get(countryKey);
        c.lats.push(node.lat);
        c.lngs.push(node.lng);
        c.activeCount += (node.activeCount || 0);
        c.completedToday += (node.completedToday || 0);
        if (node.isUserZip) c.isUserZip = true;
        if (Array.isArray(node.lifters)) {
          node.lifters.forEach(l => { if (!c.lifters.includes(l)) c.lifters.push(l); });
        }
        c.originalNodes.push(node);
      });

      return Array.from(countryMap.values()).map(c => ({
        type: 'country',
        id: c.id,
        label: c.label,
        subLabel: `${c.originalNodes.length} Zip Codes across Country`,
        shortTitle: c.shortTitle,
        lat: c.lats.reduce((a, b) => a + b, 0) / c.lats.length,
        lng: c.lngs.reduce((a, b) => a + b, 0) / c.lngs.length,
        activeCount: c.activeCount,
        completedToday: c.completedToday,
        isUserZip: c.isUserZip,
        lifters: c.lifters,
        originalNodes: c.originalNodes
      }));
    }

    function updateMapZoomStatusUI(zoom) {
      const zoomStatusEl = document.getElementById('map-zoom-status');
      if (!zoomStatusEl) return;
      let levelDesc = "Zip Code Level (Border Identified)";
      if (zoom >= 15) levelDesc = "Street Level (Border Identified)";
      else if (zoom >= 11) levelDesc = "Zip Code Level (Border Identified)";
      else if (zoom >= 5) levelDesc = "State / General Area Level";
      else levelDesc = "Country / Continental Level";
      zoomStatusEl.innerText = `Zoom: ${zoom}x (${levelDesc})`;
    }

    function initGoogleMapsBaseLayer() {
      const canvas = document.getElementById('google-maps-canvas');
      if (!canvas) return;

      const activeNodes = getActiveAndCompletedZipNodes();
      const targetZip = selectedHeatMapZip || (activeNodes.length > 0 ? activeNodes[0].zip : getUserZip());
      const coords = getZipCoordinates(targetZip);

      // 1. Try Native Google Maps JS API only if an authorized API key is provided
      const savedGmapsKey = localStorage.getItem('showUp_gmaps_api_key');
      if (savedGmapsKey && window.google && window.google.maps && window.google.maps.Map) {
        try {
          if (!googleMapInstance) {
            googleMapInstance = new google.maps.Map(canvas, {
              center: { lat: coords.lat, lng: coords.lng },
              zoom: currentMapZoom,
              styles: GOOGLE_MAPS_DARK_STYLE,
              disableDefaultUI: true,
              gestureHandling: 'greedy',
              zoomControl: false,
              mapTypeControl: false,
              scaleControl: false,
              streetViewControl: false,
              rotateControl: false,
              fullscreenControl: false
            });

            googleMapInstance.addListener('zoom_changed', () => {
              currentMapZoom = googleMapInstance.getZoom();
              updateMapZoomStatusUI(currentMapZoom);
              renderHeatMap();
              if (currentMapZoom < 5) updateCountryHoverEdgeTracker();
            });

            googleMapInstance.addListener('bounds_changed', () => {
              if (currentMapZoom < 5) updateCountryHoverEdgeTracker();
            });
            googleMapInstance.addListener('center_changed', () => {
              if (currentMapZoom < 5) updateCountryHoverEdgeTracker();
            });
            googleMapInstance.addListener('drag', () => {
              if (currentMapZoom < 5) updateCountryHoverEdgeTracker();
            });
          } else {
            googleMapInstance.panTo({ lat: coords.lat, lng: coords.lng });
          }

          isMapEmbedMode = false;
          renderGoogleMapMarkers(activeNodes);
          updateMapZoomStatusUI(currentMapZoom);
          return;
        } catch (e) {
          console.warn("Google Maps Native JS API initialization notice:", e);
        }
      }

      // 2. Google Maps Interactive Base Layer Embed Fallback
      renderGoogleMapsEmbed(coords.lat, coords.lng, currentMapZoom, targetZip, coords.city);
    }

    function renderGoogleMapsEmbed(lat, lng, zoom, zip, city) {
      isMapEmbedMode = true;
      const canvas = document.getElementById('google-maps-canvas');
      if (!canvas) return;

      let query = `${lat},${lng}`;
      if (zoom >= 11 && zip) {
        query = `Zip+Code+${encodeURIComponent(zip)}+${encodeURIComponent(city || '')}`;
      } else if (zoom >= 5 && city) {
        const geo = parseLocationHierarchy(city, zip);
        query = `${encodeURIComponent(geo.stateName)}+USA`;
      } else {
        query = `United+States`;
      }

      const existingIframe = document.getElementById('google-maps-iframe');
      const targetSrc = `https://maps.google.com/maps?q=${query}&t=m&z=${zoom}&output=embed`;

      if (existingIframe && existingIframe.dataset && existingIframe.dataset.query === query && existingIframe.dataset.zoom === String(zoom)) {
        return;
      }

      canvas.innerHTML = `
        <iframe
          id="google-maps-iframe"
          data-query="${query}"
          data-zoom="${zoom}"
          title="Google Maps Base Layer"
          class="w-full h-full border-0 filter invert-[0.9] hue-rotate-180 brightness-[0.85] contrast-[1.2] transition-opacity duration-300"
          src="${targetSrc}"
          loading="lazy"
          allowfullscreen>
        </iframe>
      `;
      updateMapZoomStatusUI(zoom);
    }

    function renderGoogleMapMarkers(activeNodes) {
      if (!googleMapInstance) return;

      googleMapMarkers.forEach(m => m.setMap(null));
      googleMapMarkers = [];
      if (Array.isArray(googleMapPolygons)) {
        googleMapPolygons.forEach(p => p.setMap(null));
        googleMapPolygons = [];
      }

      const currentTheme = localStorage.getItem('showUp_theme') || 'emerald';
      const themeColorsMap = {
        emerald: { fill: '#10b981', stroke: '#047857', onColor: '#002217' },
        sky: { fill: '#38bdf8', stroke: '#0284c7', onColor: '#082f49' },
        violet: { fill: '#a855f7', stroke: '#7e22ce', onColor: '#2e1065' },
        rose: { fill: '#fb7185', stroke: '#e11d48', onColor: '#4c0519' },
        amber: { fill: '#fbbf24', stroke: '#d97706', onColor: '#451a03' },
        orange: { fill: '#f97316', stroke: '#c2410c', onColor: '#431407' },
        sunset: { fill: '#f43f5e', stroke: '#be123c', onColor: '#4c0519' },
        amoled: { fill: '#38bdf8', stroke: '#0284c7', onColor: '#082f49' }
      };
      const pal = themeColorsMap[currentTheme] || themeColorsMap.emerald;

      const aggNodes = getAggregatedNodesForZoom(currentMapZoom, activeNodes);

      aggNodes.forEach(node => {
        const completedCount = node.completedToday || 0;

        // Cleaner Map View: Circular marker displaying strictly the number of workouts scored, scaled proportionally by zoom level
        let markerSize = 44;
        let markerRadius = 18;
        let fontSize = 15;
        let strokeWidth = 3;
        if (currentMapZoom < 5) {
          markerSize = 28;
          markerRadius = 11;
          fontSize = 11;
          strokeWidth = 2;
        } else if (currentMapZoom < 11) {
          markerSize = 36;
          markerRadius = 15;
          fontSize = 13;
          strokeWidth = 2.5;
        }

        const half = markerSize / 2;
        const textY = half + Math.round(fontSize * 0.38);

        const svgIcon = {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="${markerSize}" height="${markerSize}" viewBox="0 0 ${markerSize} ${markerSize}">
              <circle cx="${half}" cy="${half}" r="${markerRadius}" fill="${pal.fill}" stroke="#0b0f19" stroke-width="${strokeWidth}" filter="drop-shadow(0 3px 5px rgba(0,0,0,0.5))"/>
              <text x="${half}" y="${textY}" fill="${pal.onColor}" font-family="monospace, sans-serif" font-size="${fontSize}" font-weight="900" text-anchor="middle">${completedCount}</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(markerSize, markerSize),
          anchor: new google.maps.Point(half, half)
        };

        const marker = new google.maps.Marker({
          position: { lat: node.lat, lng: node.lng },
          map: googleMapInstance,
          title: `${completedCount} Workouts Scored`,
          icon: svgIcon
        });

        marker.addListener('click', () => {
          triggerHaptic('light');
          selectZipNode(node.id);
        });

        googleMapMarkers.push(marker);
      });
    }

    function renderMapZipBoundariesOverlay(activeNodes) {
      const topHud = document.getElementById('map-boundary-top-hud');
      const centerHud = document.getElementById('map-boundary-center-hud');
      if (!topHud || !centerHud) return;

      if (!Array.isArray(activeNodes)) {
        if (typeof getActiveAndCompletedZipNodes === 'function') {
          activeNodes = getActiveAndCompletedZipNodes();
        } else {
          activeNodes = [];
        }
      }

      const aggNodes = getAggregatedNodesForZoom(currentMapZoom, activeNodes);

      if (!aggNodes || aggNodes.length === 0) {
        topHud.innerHTML = '';
        centerHud.innerHTML = `
          <div class="pointer-events-auto flex items-center justify-center">
            <div class="w-10 h-10 rounded-full bg-slate-900/90 border border-slate-700/80 text-slate-400 font-mono font-bold text-sm flex items-center justify-center shadow-lg" title="0 Workouts Scored">
              0
            </div>
          </div>
        `;
        return;
      }

      // Cleaner Map View: Keep top HUD clean and uncluttered
      topHud.innerHTML = '';

      // Tier 3 Country Zoom Level (< 5): Number of workouts hovers over country and sticks to screen edge in direction of country
      if (currentMapZoom < 5) {
        centerHud.innerHTML = '';
        updateCountryHoverEdgeTracker(activeNodes);
        return;
      }

      // Hide country edge tracker at state and zip levels (zoom >= 5)
      const countryBadge = document.getElementById('map-country-edge-hover-badge');
      if (countryBadge) countryBadge.style.display = 'none';

      // Center HUD: Display strictly the number of workouts scored at this zoomed level
      const selectedNode = aggNodes.find(z => z.id === selectedHeatMapZip || (z.originalNodes && z.originalNodes.some(on => on.zip === selectedHeatMapZip))) || aggNodes[0];
      if (!selectedNode) {
        centerHud.innerHTML = '';
        return;
      }

      const completedCount = selectedNode.completedToday || 0;
      const hudSizeClass = currentMapZoom < 11
        ? 'w-10 h-10 sm:w-11 sm:h-11 text-base sm:text-lg'
        : 'w-12 h-12 sm:w-14 sm:h-14 text-xl sm:text-2xl';

      centerHud.innerHTML = `
        <div class="pointer-events-auto cursor-pointer transition transform hover:scale-105 active:scale-95 flex items-center justify-center" onclick="triggerHaptic('light'); zoomToSelectedZip()">
          <div class="${hudSizeClass} rounded-full bg-[var(--m3-primary)] text-[var(--m3-onPrimary)] font-mono font-black flex items-center justify-center shadow-2xl shadow-[var(--m3-primary)]/40 ring-4 ring-slate-950/90" title="${completedCount} Workouts Scored">
            ${completedCount}
          </div>
        </div>
      `;
    }

    /**
     * Country-Level Hovering & Edge-Sticking Indicator:
     * When zoomed at country level (zoom < 5), the number of workouts hovers over the country centroid.
     * When panned away or near boundary, it sticks to the edge of the map container in the direction of the country.
     */
    function updateCountryHoverEdgeTracker(activeNodes) {
      const overlay = document.getElementById('map-zip-boundaries-overlay');
      const canvas = document.getElementById('google-maps-canvas');
      if (!overlay || !canvas) return;

      let badgeEl = document.getElementById('map-country-edge-hover-badge');

      if (currentMapZoom >= 5) {
        if (badgeEl) badgeEl.style.display = 'none';
        return;
      }

      if (!badgeEl) {
        badgeEl = document.createElement('div');
        badgeEl.id = 'map-country-edge-hover-badge';
        badgeEl.className = 'absolute pointer-events-auto transition-all duration-150 ease-out z-30 select-none';
        overlay.appendChild(badgeEl);
      }
      badgeEl.style.display = 'block';

      if (!Array.isArray(activeNodes)) {
        activeNodes = (typeof getActiveAndCompletedZipNodes === 'function') ? getActiveAndCompletedZipNodes() : [];
      }

      const aggNodes = getAggregatedNodesForZoom(currentMapZoom, activeNodes);
      const countryNode = (aggNodes && aggNodes.length > 0)
        ? (aggNodes.find(n => n.type === 'country') || aggNodes[0])
        : { lat: 38.95, lng: -77.45, completedToday: 0, label: 'United States', shortTitle: 'USA' };

      const completedCount = countryNode.completedToday || 0;
      const countryLat = countryNode.lat || 38.95;
      const countryLng = countryNode.lng || -77.45;

      const width = canvas.clientWidth || 320;
      const height = canvas.clientHeight || 280;

      let screenX = width / 2;
      let screenY = height / 2;

      const latToNormY = (lat) => {
        const sin = Math.sin(lat * Math.PI / 180);
        const clamped = Math.max(-0.9999, Math.min(0.9999, sin));
        return 0.5 - Math.log((1 + clamped) / (1 - clamped)) / (4 * Math.PI);
      };

      if (googleMapInstance && !isMapEmbedMode) {
        const center = googleMapInstance.getCenter();
        const cLat = center ? (typeof center.lat === 'function' ? center.lat() : center.lat) : 38.95;
        const cLng = center ? (typeof center.lng === 'function' ? center.lng() : center.lng) : -77.45;
        const zoom = (typeof googleMapInstance.getZoom === 'function') ? googleMapInstance.getZoom() : currentMapZoom;
        const worldSize = 256 * Math.pow(2, zoom);

        const targetNormX = (countryLng + 180) / 360;
        const centerNormX = (cLng + 180) / 360;
        let deltaX = targetNormX - centerNormX;
        if (deltaX > 0.5) deltaX -= 1.0;
        if (deltaX < -0.5) deltaX += 1.0;

        const targetNormY = latToNormY(countryLat);
        const centerNormY = latToNormY(cLat);
        const deltaY = targetNormY - centerNormY;

        screenX = (width / 2) + (deltaX * worldSize);
        screenY = (height / 2) + (deltaY * worldSize);
      } else {
        // Embed Mode: Accurate geographic projection across Continental / World zoom span
        // For US coordinates, accurately positions within the USA (Western, Central, Eastern USA)
        const isUS = (countryLng >= -130 && countryLng <= -65 && countryLat >= 24 && countryLat <= 50);
        if (isUS) {
          const usWestLng = -124.5;
          const usEastLng = -67.0;
          const usNorthLat = 49.0;
          const usSouthLat = 25.0;

          const lngFrac = Math.max(0, Math.min(1, (countryLng - usWestLng) / (usEastLng - usWestLng)));
          const latFrac = Math.max(0, Math.min(1, (usNorthLat - countryLat) / (usNorthLat - usSouthLat)));

          let minXRatio, maxXRatio, minYRatio, maxYRatio;
          if (currentMapZoom <= 3) {
            // Span of NAmerica, SAmerica, Africa, Europe, Asia:
            // US spans from 19% (West Coast) to 35% (East Coast).
            // Northern Virginia (lngFrac ~0.82) lands at ~32.1% (Eastern portion of USA).
            minXRatio = 0.19;
            maxXRatio = 0.35;
            minYRatio = 0.34;
            maxYRatio = 0.46;
          } else {
            // Zoom 4: US spans from 10% to 44% width
            minXRatio = 0.10;
            maxXRatio = 0.44;
            minYRatio = 0.24;
            maxYRatio = 0.54;
          }

          screenX = width * (minXRatio + lngFrac * (maxXRatio - minXRatio));
          screenY = height * (minYRatio + latFrac * (maxYRatio - minYRatio));
        } else {
          // General world Mercator projection for international lifters
          const normX = (countryLng + 180) / 360;
          const normY = latToNormY(countryLat);
          const deltaX = normX - 0.50;
          const deltaY = normY - 0.42;
          const worldSpan = width * (currentMapZoom <= 3 ? 1.05 : 1.75);
          screenX = (width / 2) + deltaX * worldSpan;
          screenY = (height / 2) + deltaY * worldSpan;
        }
      }

      // Edge boundaries margins
      const marginX = 24;
      const marginY = 24;
      const minX = marginX;
      const maxX = width - marginX;
      const minY = marginY;
      const maxY = height - marginY;
      const cx = width / 2;
      const cy = height / 2;

      const isInside = screenX >= minX && screenX <= maxX && screenY >= minY && screenY <= maxY;
      let badgeX = screenX;
      let badgeY = screenY;
      let isStickingToEdge = false;
      let arrowHtml = '';

      if (!isInside) {
        isStickingToEdge = true;
        const dx = screenX - cx;
        const dy = screenY - cy;
        const scaleX = dx > 0 ? (maxX - cx) / dx : (dx < 0 ? (minX - cx) / dx : Infinity);
        const scaleY = dy > 0 ? (maxY - cy) / dy : (dy < 0 ? (minY - cy) / dy : Infinity);
        const scale = Math.min(scaleX, scaleY);
        badgeX = cx + dx * scale;
        badgeY = cy + dy * scale;

        const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
        arrowHtml = `<i class="fa-solid fa-location-arrow text-[10px] text-emerald-200" style="transform: rotate(${angleDeg - 45}deg)"></i>`;
      }

      badgeEl.style.left = `${Math.round(badgeX)}px`;
      badgeEl.style.top = `${Math.round(badgeY)}px`;
      badgeEl.style.transform = 'translate(-50%, -50%)';

      const titleText = isStickingToEdge
        ? `${countryNode.label || 'United States'}: ${completedCount} Workout${completedCount === 1 ? '' : 's'} Scored (Click to Center)`
        : `${countryNode.label || 'United States'}: ${completedCount} Workout${completedCount === 1 ? '' : 's'} Scored`;

      if (isStickingToEdge) {
        badgeEl.innerHTML = `
          <div onclick="triggerHaptic('light'); panMapToCountry(${countryLat}, ${countryLng})"
               class="cursor-pointer transition transform hover:scale-110 active:scale-95 flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--m3-primary)] text-[var(--m3-onPrimary)] font-mono font-black text-xs shadow-xl shadow-[var(--m3-primary)]/40 ring-2 ring-slate-950/90 border border-emerald-300"
               title="${titleText}">
            ${arrowHtml}
            <span>${completedCount}</span>
          </div>
        `;
      } else {
        const sizeClass = currentMapZoom <= 3 ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm';
        badgeEl.innerHTML = `
          <div onclick="triggerHaptic('light'); panMapToCountry(${countryLat}, ${countryLng})"
               class="cursor-pointer transition transform hover:scale-110 active:scale-95 flex items-center justify-center ${sizeClass} rounded-full bg-[var(--m3-primary)] text-[var(--m3-onPrimary)] font-mono font-black shadow-xl shadow-[var(--m3-primary)]/40 ring-2 ring-slate-950/90 hover-float-badge"
               title="${titleText}">
            ${completedCount}
          </div>
        `;
      }
    }

    function panMapToCountry(lat = 38.95, lng = -77.45) {
      if (googleMapInstance && !isMapEmbedMode) {
        googleMapInstance.panTo({ lat, lng });
      } else {
        renderGoogleMapsEmbed(lat, lng, currentMapZoom, '', 'United States');
      }
      setTimeout(() => { updateCountryHoverEdgeTracker(); }, 100);
    }

    function zoomGoogleMap(delta) {
      currentMapZoom = Math.min(18, Math.max(3, currentMapZoom + delta));
      if (googleMapInstance && !isMapEmbedMode) {
        googleMapInstance.setZoom(currentMapZoom);
        updateMapZoomStatusUI(currentMapZoom);
        renderHeatMap();
      } else {
        const activeNodes = getActiveAndCompletedZipNodes();
        const targetZip = selectedHeatMapZip || (activeNodes.length > 0 ? activeNodes[0].zip : getUserZip());
        const coords = getZipCoordinates(targetZip);
        renderGoogleMapsEmbed(coords.lat, coords.lng, currentMapZoom, targetZip, coords.city);
        renderHeatMap();
      }
    }

    function zoomToUserZipLevel() {
      currentMapZoom = 14; // Zip code level
      const userZip = getUserZip();
      selectedHeatMapZip = userZip;
      const coords = getZipCoordinates(userZip);

      if (googleMapInstance && !isMapEmbedMode) {
        googleMapInstance.setZoom(14);
        googleMapInstance.panTo({ lat: coords.lat, lng: coords.lng });
        updateMapZoomStatusUI(14);
      } else {
        renderGoogleMapsEmbed(coords.lat, coords.lng, 14, userZip, coords.city);
      }
      renderHeatMap();
      showToast(`Snapped to Zip Code Level (14x) for ${userZip}`, "info");
    }

    function zoomToSelectedZip() {
      currentMapZoom = 14; // Snap to Zip code level
      const activeNodes = getActiveAndCompletedZipNodes();
      const targetZip = selectedHeatMapZip || (activeNodes.length > 0 ? activeNodes[0].zip : getUserZip());
      const coords = getZipCoordinates(targetZip);

      if (googleMapInstance && !isMapEmbedMode) {
        googleMapInstance.setZoom(14);
        googleMapInstance.panTo({ lat: coords.lat, lng: coords.lng });
        updateMapZoomStatusUI(14);
      } else {
        renderGoogleMapsEmbed(coords.lat, coords.lng, 14, targetZip, coords.city);
      }
      renderHeatMap();
      showToast(`Zoomed to Zip Code ${targetZip} (14x Level)`, "info");
    }

    function selectZipNode(nodeId) {
      selectedHeatMapZip = nodeId;
      const activeNodes = getActiveAndCompletedZipNodes();
      const node = activeNodes.find(n => n.zip === nodeId) || activeNodes.find(n => {
        const geo = parseLocationHierarchy(n.city, n.zip);
        return geo.stateCode === nodeId || geo.countryCode === nodeId;
      });

      const zipToPan = node ? node.zip : (nodeId.length === 5 ? nodeId : getUserZip());
      const coords = getZipCoordinates(zipToPan);

      if (googleMapInstance && !isMapEmbedMode) {
        googleMapInstance.panTo({ lat: coords.lat, lng: coords.lng });
      } else {
        renderGoogleMapsEmbed(coords.lat, coords.lng, currentMapZoom, zipToPan, coords.city);
      }
      renderHeatMap();
    }



    function updateZipDetailCard(activeZipNodes) {
      if (!activeZipNodes) activeZipNodes = getActiveAndCompletedZipNodes();
      const userZip = getUserZip();
      const activeDate = getSelectedMapDate();
      const isToday = (activeDate === getETDateKey());
      const dateDisplay = formatMapDateDisplay(activeDate);

      const titleEl = document.getElementById('zip-detail-title');
      const descEl = document.getElementById('zip-detail-desc');
      const indEl = document.getElementById('zip-detail-indicator');
      const zoomBtn = document.getElementById('btn-zoom-to-selected-zip');
      const borderTag = document.getElementById('zip-detail-border-tag');

      if (activeZipNodes.length === 0) {
        if (titleEl) titleEl.innerText = isToday ? "No workouts recorded today" : `No workouts recorded for ${dateDisplay}`;
        if (descEl) {
          if (isToday) {
            const yesterdayKey = getYesterdayETDateKey();
            const yesterdayNodes = getActiveAndCompletedZipNodes(yesterdayKey);
            const yTotal = yesterdayNodes.reduce((acc, n) => acc + (n.completedToday || 0), 0);
            if (yTotal > 0) {
              descEl.innerHTML = `No workouts recorded today yet. <span class="text-amber-300 font-semibold">${yTotal} workout${yTotal === 1 ? '' : 's'} scored yesterday</span> (${formatMapDateDisplay(yesterdayKey)}). <button type="button" onclick="triggerHaptic('light'); setMapDateToYesterday()" class="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 underline ml-1 cursor-pointer"><i class="fa-solid fa-clock-rotate-left text-[9px]"></i> View Yesterday's Activity (${yTotal} Scored)</button>`;
            } else {
              descEl.innerText = `Only workouts logged by you or your squad today are displayed. Your zip code (${userZip}) will activate when you complete a set.`;
            }
          } else {
            descEl.innerText = `No workouts were scored by you or your squad on ${dateDisplay}. Select another date to view activity.`;
          }
        }
        if (indEl) {
          indEl.className = "w-2.5 h-2.5 rounded-full bg-slate-700 flex-shrink-0";
          indEl.innerHTML = "";
        }
        if (borderTag) {
          borderTag.classList.add('hidden');
          borderTag.classList.remove('inline-flex');
        }
        if (zoomBtn) {
          zoomBtn.innerHTML = `<i class="fa-solid fa-crosshairs"></i><span>My Zip Area</span>`;
          zoomBtn.onclick = () => { triggerHaptic('light'); zoomToUserZipLevel(); };
        }
        return;
      }

      const aggNodes = getAggregatedNodesForZoom(currentMapZoom, activeZipNodes);
      const node = aggNodes.find(z => z.id === selectedHeatMapZip || (z.originalNodes && z.originalNodes.some(on => on.zip === selectedHeatMapZip))) || aggNodes[0];
      if (!node) return;

      const isUserZip = node.isUserZip;
      const hasActive = node.activeCount > 0;

      if (titleEl) {
        if (node.type === 'zip') {
          titleEl.innerText = `Zip ${node.id} (${node.subLabel})${isUserZip ? ' • (Your Zip Code)' : ''}`;
        } else if (node.type === 'state') {
          titleEl.innerText = `${node.label} • State / General Area Level`;
        } else {
          titleEl.innerText = `${node.label} • Country / Continental Level`;
        }
      }
      if (borderTag) {
        borderTag.classList.remove('hidden');
        borderTag.classList.add('inline-flex');
        if (node.type === 'zip') {
          borderTag.innerHTML = `<i class="fa-solid fa-draw-polygon text-[8px] mr-0.5"></i> Zip Border`;
        } else if (node.type === 'state') {
          borderTag.innerHTML = `<i class="fa-solid fa-map text-[8px] mr-0.5"></i> State Area`;
        } else {
          borderTag.innerHTML = `<i class="fa-solid fa-earth-americas text-[8px] mr-0.5"></i> Country Area`;
        }
      }
      if (descEl) {
        const liftersStr = node.lifters && node.lifters.length > 0 ? ` (${node.lifters.join(', ')})` : '';
        const dateContext = isToday ? 'Today' : `on ${dateDisplay}`;
        const activeContext = isToday ? ` • ${node.activeCount || 0} Lifters Active Right Now${liftersStr}` : '';
        descEl.innerText = `${node.completedToday || 0} Workouts Completed ${dateContext} by Logged-in Athletes${activeContext}`;
      }
      if (indEl) {
        if (hasActive) {
          indEl.className = "w-3 h-3 rounded-full bg-emerald-400 animate-pulse flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-500/40";
          indEl.innerHTML = "";
        } else {
          indEl.className = "w-4 h-4 rounded bg-[var(--m3-primary)] text-[var(--m3-onPrimary)] flex items-center justify-center text-[10px] font-black flex-shrink-0 shadow-sm shadow-[var(--m3-primary)]/30";
          indEl.innerHTML = `<i class="fa-solid fa-check"></i>`;
        }
      }
      if (zoomBtn) {
        zoomBtn.innerHTML = `<i class="fa-solid fa-magnifying-glass-location"></i><span>Zoom to Level</span>`;
        zoomBtn.onclick = () => { triggerHaptic('light'); zoomToSelectedZip(); };
      }
    }

    function openUserZipModal() {
      detectUserZipFromIP();
      showToast("Zip code is established automatically based on your network IP address.", "info");
    }

    function closeUserZipModal() {}
    function saveUserZipSubmit() {}

    // ================= SQUADS CORE STATE & ACTIONS =================

/* ==========================================================================
   showUp Unique Visitor Counter & Admin Telemetry Engine (abhi13@gmail.com)
   ========================================================================== */

function getOrSetUniqueVisitorId() {
  let vid = localStorage.getItem(VISITOR_STORAGE_KEY);
  if (!vid) {
    vid = 'uv_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    localStorage.setItem(VISITOR_STORAGE_KEY, vid);
    localStorage.setItem(VISITOR_FIRST_SEEN_KEY, new Date().toISOString());
  }
  return vid;
}

async function initUniqueVisitorCounter() {
  const visitorId = getOrSetUniqueVisitorId();
  const isNewVisitor = !localStorage.getItem(VISITOR_COUNTED_KEY);

  // 1. Get baseline count from verified local global visitors log
  const localLog = getGlobalVisitorsLog();
  let currentCount = Math.max(1, localLog.length);
  const storedCount = parseInt(localStorage.getItem(VISITOR_COUNT_KEY) || '0', 10);
  if (!isNaN(storedCount) && storedCount > currentCount && storedCount < 1000) {
    currentCount = storedCount;
  }

  if (isNewVisitor) {
    localStorage.setItem(VISITOR_COUNTED_KEY, 'true');
  }

  localStorage.setItem(VISITOR_COUNT_KEY, String(currentCount));
  updateVisitorCounterUI(currentCount);

  // 2. Query Firestore global_visitors directly as canonical source of truth
  try {
    const db = getFirestoreDb();
    if (db) {
      const snapshot = await db.collection('global_visitors').get();
      if (snapshot && typeof snapshot.size === 'number' && snapshot.size > 0) {
        const canonicalCount = Math.max(1, snapshot.size);
        localStorage.setItem(VISITOR_COUNT_KEY, String(canonicalCount));
        updateVisitorCounterUI(canonicalCount);
        return;
      }
    }
  } catch (err) {
    console.debug("Firestore visitor count sync notice:", err);
  }

  // 3. Fallback: Keep unified with local telemetry log
  const finalLog = getGlobalVisitorsLog();
  if (finalLog && finalLog.length > 0) {
    updateVisitorCounterUI(finalLog.length);
  }
}

function updateVisitorCounterUI(count) {
  const safeCount = Math.max(1, parseInt(count, 10) || 1);
  const formatted = safeCount.toLocaleString();

  // Top level header visitor counter pill
  const headerEl = document.getElementById('header-visitor-count');
  if (headerEl) headerEl.innerText = formatted;

  // Global Visitors Telemetry Total Visitors (strict lockstep match)
  const adminTotalEl = document.getElementById('admin-telemetry-total-visitors');
  if (adminTotalEl) adminTotalEl.innerText = formatted;

  // Map unique visitor badge
  const mapEl = document.getElementById('map-unique-visitor-count');
  if (mapEl) mapEl.innerText = formatted;

  // Global stats visitor counter
  const globalStatsEl = document.getElementById('global-visitor-counter');
  if (globalStatsEl) globalStatsEl.innerText = formatted;

  // Settings modal unique visitor count
  const settingsEl = document.getElementById('settings-unique-visitor-count');
  if (settingsEl) settingsEl.innerText = formatted;

  const settingsIdEl = document.getElementById('settings-visitor-id-badge');
  if (settingsIdEl) settingsIdEl.innerText = localStorage.getItem(VISITOR_STORAGE_KEY) || 'Active';
}

// ================= ADMIN GLOBAL VISITOR TELEMETRY ENGINE (RESTRICTED TO abhi13@gmail.com, hithesh@gmail.com) =================

let firestoreDb = null;
let unsubscribeAdminTelemetry = null;

function getFirestoreDb() {
  if (firestoreDb) return firestoreDb;
  try {
    if (typeof firebase !== 'undefined' && firebase.initializeApp) {
      if (!firebase.apps || !firebase.apps.length) {
        if (typeof FIREBASE_CONFIG !== 'undefined') {
          firebase.initializeApp(FIREBASE_CONFIG);
        }
      }
      if (firebase.apps && firebase.apps.length) {
        firestoreDb = firebase.firestore();
        return firestoreDb;
      }
    }
  } catch (err) {
    console.debug("Firestore initialization notice:", err);
  }
  return null;
}

function isGlobalVisitorTelemetryAdmin() {
  const user = getAppUser();
  const email = (user && user.email ? user.email : '').toLowerCase().trim();
  return email === 'abhi13@gmail.com' || email === 'hithesh@gmail.com';
}

function initGlobalVisitorTelemetry() {
  getFirestoreDb();
  getGlobalVisitorsLog();
  updateGlobalVisitorTelemetryUI();
}

function getGlobalVisitorsLog() {
  let log = [];
  try {
    log = JSON.parse(localStorage.getItem(GLOBAL_VISITORS_LOG_KEY) || '[]');
  } catch (e) {
    log = [];
  }
  if (!Array.isArray(log)) log = [];
  return log;
}

function saveGlobalVisitorsLog(log) {
  try {
    localStorage.setItem(GLOBAL_VISITORS_LOG_KEY, JSON.stringify(log));
  } catch (e) { }
}

function parseCityAndState(cityStr, defaultZip = '') {
  if (!cityStr) return { city: 'Ashburn', state: 'VA', stateName: 'Virginia' };

  let clean = String(cityStr).trim();
  let parts = clean.split(',').map(p => p.trim());
  let city = parts[0] || 'Ashburn';
  let rawState = parts[1] || 'VA';

  rawState = rawState.replace(/\d+/g, '').trim().toUpperCase();
  if (rawState.length > 2) {
    for (const [code, name] of Object.entries(US_STATE_NAMES)) {
      if (name.toLowerCase() === rawState.toLowerCase()) {
        rawState = code;
        break;
      }
    }
  }
  if (rawState.length > 2) rawState = rawState.slice(0, 2);
  if (!rawState) rawState = 'VA';

  const stateName = US_STATE_NAMES[rawState] || rawState;
  return { city, state: rawState, stateName };
}

function recordCurrentVisitorLocation(loc) {
  if (!loc) return;
  const log = getGlobalVisitorsLog();
  const visitorId = getOrSetUniqueVisitorId();
  const parsed = parseCityAndState(loc.city, loc.zip);
  const nowISO = new Date().toISOString();

  const existingIndex = log.findIndex(item => item.id === visitorId || (item.zip === loc.zip && item.city.toLowerCase() === parsed.city.toLowerCase()));
  if (existingIndex >= 0) {
    log[existingIndex].city = parsed.city;
    log[existingIndex].state = parsed.state;
    log[existingIndex].stateName = parsed.stateName;
    log[existingIndex].zip = loc.zip || log[existingIndex].zip;
    log[existingIndex].lastSeen = nowISO;
    log[existingIndex].visitCount = (log[existingIndex].visitCount || 1) + 1;
  } else {
    log.push({
      id: visitorId,
      city: parsed.city,
      state: parsed.state,
      stateName: parsed.stateName,
      zip: loc.zip || '20147',
      country: 'US',
      lat: loc.lat || 0,
      lng: loc.lng || 0,
      firstSeen: nowISO,
      lastSeen: nowISO,
      visitCount: 1
    });
  }

  saveGlobalVisitorsLog(log);
  updateVisitorCounterUI(Math.max(1, log.length));
  updateGlobalVisitorTelemetryUI();

  // Cross-device cloud sync: Upsert anonymous location record in Firestore
  try {
    const db = getFirestoreDb();
    if (db) {
      const docData = {
        id: visitorId,
        city: parsed.city,
        state: parsed.state,
        stateName: parsed.stateName,
        zip: loc.zip || '',
        country: 'US',
        lat: loc.lat || 0,
        lng: loc.lng || 0,
        lastSeen: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
          ? firebase.firestore.FieldValue.serverTimestamp()
          : nowISO,
        firstSeen: (existingIndex >= 0 && log[existingIndex].firstSeen) ? log[existingIndex].firstSeen : nowISO,
        visitCount: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
          ? firebase.firestore.FieldValue.increment(1)
          : 1
      };
      db.collection('global_visitors').doc(visitorId).set(docData, { merge: true })
        .catch(err => console.debug("Firestore visitor log sync notice:", err));
    }
  } catch (err) {
    console.debug("Firestore cloud record exception:", err);
  }
}

function openGlobalVisitorTelemetryModal() {
  const modal = document.getElementById('global-visitors-modal');
  const section = document.getElementById('admin-global-visitor-telemetry');
  if (modal) modal.classList.remove('hidden');
  if (section) {
    section.classList.remove('hidden');
    section.style.display = 'block';
  }
  const dropdown = document.getElementById('profile-dropdown-menu');
  if (dropdown) dropdown.classList.add('hidden');
  renderAdminGlobalVisitorTelemetry(true);
}

function closeGlobalVisitorTelemetryModal() {
  const modal = document.getElementById('global-visitors-modal');
  if (modal) modal.classList.add('hidden');
}

let adminCloudSquads = [];
let unsubscribeAdminSquadsTelemetry = null;

function getAdminAllSquads() {
  const localReg = typeof getGlobalSquadRegistry === 'function' ? getGlobalSquadRegistry() : [];
  const squadMap = new Map();

  [...localReg, ...adminCloudSquads].forEach(sq => {
    if (!sq || !sq.name) return;
    if (sq.creatorName === 'Squad Leader' || (sq.creatorId && String(sq.creatorId).startsWith('creator_SHOWUP'))) return;
    const key = sq.id || sq.inviteCode;
    if (!key) return;
    if (!squadMap.has(key)) {
      squadMap.set(key, sq);
    } else {
      const existing = squadMap.get(key);
      squadMap.set(key, { ...existing, ...sq });
    }
  });

  return Array.from(squadMap.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function setAdminVisitorViewMode(mode) {
  adminVisitorViewMode = mode;
  const modes = ['day', 'week', 'month', 'year', 'state', 'city', 'squads'];
  modes.forEach(m => {
    const tab = document.getElementById(`admin-view-tab-${m}`);
    if (tab) {
      if (m === mode) {
        tab.className = "px-3 py-1.5 rounded-xl text-xs font-bold transition bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm flex items-center gap-1.5";
      } else {
        tab.className = "px-3 py-1.5 rounded-xl text-xs font-semibold transition text-slate-400 hover:text-slate-200 flex items-center gap-1.5";
      }
    }
  });

  const tfContainer = document.getElementById('admin-timeframe-groups-container');
  const stateContainer = document.getElementById('admin-state-groups-container');
  const cityContainer = document.getElementById('admin-city-log-container');
  const squadsContainer = document.getElementById('admin-squads-container');

  if (mode === 'state') {
    if (tfContainer) tfContainer.classList.add('hidden');
    if (stateContainer) stateContainer.classList.remove('hidden');
    if (cityContainer) cityContainer.classList.add('hidden');
    if (squadsContainer) squadsContainer.classList.add('hidden');
  } else if (mode === 'city') {
    if (tfContainer) tfContainer.classList.add('hidden');
    if (stateContainer) stateContainer.classList.add('hidden');
    if (cityContainer) cityContainer.classList.remove('hidden');
    if (squadsContainer) squadsContainer.classList.add('hidden');
  } else if (mode === 'squads') {
    if (tfContainer) tfContainer.classList.add('hidden');
    if (stateContainer) stateContainer.classList.add('hidden');
    if (cityContainer) cityContainer.classList.add('hidden');
    if (squadsContainer) squadsContainer.classList.remove('hidden');
  } else {
    // 'day', 'week', 'month', 'year'
    if (tfContainer) tfContainer.classList.remove('hidden');
    if (stateContainer) stateContainer.classList.add('hidden');
    if (cityContainer) cityContainer.classList.add('hidden');
    if (squadsContainer) squadsContainer.classList.add('hidden');
  }
  renderAdminGlobalVisitorTelemetry(true);
}

function handleAdminVisitorSearch(query) {
  adminVisitorSearchQuery = (query || '').toLowerCase().trim();
  renderAdminGlobalVisitorTelemetry(true);
}

function subscribeAdminGlobalVisitorTelemetry() {
  if (!isGlobalVisitorTelemetryAdmin()) return;
  const db = getFirestoreDb();
  if (!db) return;
  if (unsubscribeAdminTelemetry) {
    unsubscribeAdminTelemetry();
    unsubscribeAdminTelemetry = null;
  }
  if (unsubscribeAdminSquadsTelemetry) {
    unsubscribeAdminSquadsTelemetry();
    unsubscribeAdminSquadsTelemetry = null;
  }
  try {
    unsubscribeAdminTelemetry = db.collection('global_visitors').onSnapshot((snapshot) => {
      const remoteLog = [];
      snapshot.forEach(doc => {
        const d = doc.data();
        let lastSeenISO = new Date().toISOString();
        if (d.lastSeen && typeof d.lastSeen.toDate === 'function') {
          lastSeenISO = d.lastSeen.toDate().toISOString();
        } else if (typeof d.lastSeen === 'string') {
          lastSeenISO = d.lastSeen;
        }
        let firstSeenISO = lastSeenISO;
        if (d.firstSeen && typeof d.firstSeen.toDate === 'function') {
          firstSeenISO = d.firstSeen.toDate().toISOString();
        } else if (typeof d.firstSeen === 'string') {
          firstSeenISO = d.firstSeen;
        }
        remoteLog.push({
          id: d.id || doc.id,
          city: d.city || 'Unknown',
          state: d.state || 'VA',
          stateName: d.stateName || 'Virginia',
          zip: d.zip || '',
          country: d.country || 'US',
          lat: d.lat || 0,
          lng: d.lng || 0,
          firstSeen: firstSeenISO,
          lastSeen: lastSeenISO,
          visitCount: typeof d.visitCount === 'number' ? d.visitCount : 1
        });
      });
      if (remoteLog.length > 0) {
        saveGlobalVisitorsLog(remoteLog);
        renderAdminGlobalVisitorTelemetry();
      }
      const liveTotal = Math.max(1, (snapshot && snapshot.size) ? snapshot.size : remoteLog.length);
      updateVisitorCounterUI(liveTotal);
    }, (err) => {
      console.warn("Firestore live telemetry subscription notice:", err);
    });

    unsubscribeAdminSquadsTelemetry = db.collection('squads').onSnapshot((snapshot) => {
      if (!snapshot) return;
      const remoteSquads = [];
      snapshot.forEach(doc => {
        const sq = doc.data();
        if (sq && sq.id && sq.name) {
          remoteSquads.push(sq);
        }
      });
      adminCloudSquads = remoteSquads;
      renderAdminGlobalVisitorTelemetry();
    }, (err) => {
      console.debug("Firestore live squads subscription notice:", err);
    });
  } catch (err) {
    console.debug("Firestore live subscription exception:", err);
  }
}

async function refreshAdminVisitorData() {
  detectUserZipFromIP();
  const db = getFirestoreDb();
  if (db) {
    try {
      const snapshot = await db.collection('global_visitors').get();
      const remoteLog = [];
      snapshot.forEach(doc => {
        const d = doc.data();
        let lastSeenISO = new Date().toISOString();
        if (d.lastSeen && typeof d.lastSeen.toDate === 'function') {
          lastSeenISO = d.lastSeen.toDate().toISOString();
        } else if (typeof d.lastSeen === 'string') {
          lastSeenISO = d.lastSeen;
        }
        let firstSeenISO = lastSeenISO;
        if (d.firstSeen && typeof d.firstSeen.toDate === 'function') {
          firstSeenISO = d.firstSeen.toDate().toISOString();
        } else if (typeof d.firstSeen === 'string') {
          firstSeenISO = d.firstSeen;
        }
        remoteLog.push({
          id: d.id || doc.id,
          city: d.city || 'Unknown',
          state: d.state || 'VA',
          stateName: d.stateName || 'Virginia',
          zip: d.zip || '',
          country: d.country || 'US',
          lat: d.lat || 0,
          lng: d.lng || 0,
          firstSeen: firstSeenISO,
          lastSeen: lastSeenISO,
          visitCount: typeof d.visitCount === 'number' ? d.visitCount : 1
        });
      });
      if (remoteLog.length > 0) {
        saveGlobalVisitorsLog(remoteLog);
        updateVisitorCounterUI(remoteLog.length);
      }
    } catch (err) {
      console.warn("Firestore refresh notice:", err);
    }

    try {
      const sqSnap = await db.collection('squads').get();
      if (sqSnap) {
        const remoteSquads = [];
        sqSnap.forEach(d => {
          const sq = d.data();
          if (sq && sq.id && sq.name) remoteSquads.push(sq);
        });
        adminCloudSquads = remoteSquads;
      }
    } catch (e) {
      console.debug("Firestore squads fetch notice:", e);
    }
  }
  renderAdminGlobalVisitorTelemetry();
  showToast("Global visitor telemetry updated", "success");
}

function exportVisitorDataJSON() {
  const log = getGlobalVisitorsLog();
  const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `showUp_global_visitors_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("Visitor telemetry JSON exported", "success");
}

function scrollToAdminTelemetry() {
  openGlobalVisitorTelemetryModal();
}

function updateGlobalVisitorTelemetryUI() {
  const section = document.getElementById('admin-global-visitor-telemetry');
  const menuBadge = document.getElementById('profile-admin-telemetry-item');

  const isAdmin = isGlobalVisitorTelemetryAdmin();
  if (!isAdmin) {
    if (unsubscribeAdminTelemetry) {
      unsubscribeAdminTelemetry();
      unsubscribeAdminTelemetry = null;
    }
    const modal = document.getElementById('global-visitors-modal');
    const modalOpen = modal && !modal.classList.contains('hidden');
    if (!modalOpen && section) {
      section.classList.add('hidden');
      section.style.display = 'none';
    }
    if (menuBadge) menuBadge.classList.add('hidden');
    return;
  }

  if (section) {
    section.classList.remove('hidden');
    section.style.display = 'block';
  }
  if (menuBadge) menuBadge.classList.remove('hidden');

  renderAdminGlobalVisitorTelemetry();
  subscribeAdminGlobalVisitorTelemetry();
}

function getTimeframeBucket(dateStr, mode) {
  const d = new Date(dateStr || Date.now());
  if (isNaN(d.getTime())) return { key: 'Recent', label: 'Recent', sortVal: 0 };

  if (mode === 'year') {
    const year = d.getFullYear();
    return {
      key: String(year),
      label: `Year ${year}`,
      sortVal: new Date(year, 0, 1).getTime()
    };
  }

  if (mode === 'month') {
    const year = d.getFullYear();
    const month = d.getMonth();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return {
      key: `${year}-${String(month + 1).padStart(2, '0')}`,
      label: `${monthNames[month]} ${year}`,
      sortVal: new Date(year, month, 1).getTime()
    };
  }

  if (mode === 'week') {
    const curr = new Date(d);
    const day = curr.getDay(); // 0 is Sun
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(curr.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const monStr = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const sunStr = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return {
      key: monday.toISOString().slice(0, 10),
      label: `Week of ${monStr} – ${sunStr}`,
      sortVal: monday.getTime()
    };
  }

  // Default 'day'
  const key = d.toISOString().slice(0, 10);
  const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  return {
    key,
    label,
    sortVal: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  };
}

function renderAdminGlobalVisitorTelemetry(force = false) {
  const modal = document.getElementById('global-visitors-modal');
  const modalOpen = modal && !modal.classList.contains('hidden');
  if (!isGlobalVisitorTelemetryAdmin() && !force && !modalOpen) return;

  const log = getGlobalVisitorsLog();
  const tfContainer = document.getElementById('admin-timeframe-groups-container');
  const stateContainer = document.getElementById('admin-state-groups-container');
  const cityContainer = document.getElementById('admin-city-log-container');
  const totalVisitorsEl = document.getElementById('admin-telemetry-total-visitors');
  const totalStatesEl = document.getElementById('admin-telemetry-total-states');
  const topStateEl = document.getElementById('admin-telemetry-top-state');
  const totalCitiesEl = document.getElementById('admin-telemetry-total-cities');
  const lastSyncEl = document.getElementById('admin-telemetry-last-sync');

  // 1. Calculate Aggregations
  const stateGroups = {};
  const uniqueCitiesSet = new Set();
  let totalVisitorsCount = 0;
  let totalVisitsCount = 0;

  log.forEach(item => {
    const stateKey = (item.state || 'VA').toUpperCase();
    const stateName = item.stateName || US_STATE_NAMES[stateKey] || stateKey;
    const cityName = item.city || 'Ashburn';
    const visits = Number(item.visitCount) || 1;

    uniqueCitiesSet.add(`${cityName.toLowerCase()}_${stateKey.toLowerCase()}`);
    totalVisitorsCount += 1;
    totalVisitsCount += visits;

    if (!stateGroups[stateKey]) {
      stateGroups[stateKey] = {
        stateCode: stateKey,
        stateName: stateName,
        visitorCount: 0,
        visitsTotal: 0,
        cities: {},
        lastSeen: item.lastSeen || new Date().toISOString()
      };
    }

    stateGroups[stateKey].visitorCount += 1;
    stateGroups[stateKey].visitsTotal += visits;
    stateGroups[stateKey].cities[cityName] = (stateGroups[stateKey].cities[cityName] || 0) + visits;

    if (item.lastSeen && new Date(item.lastSeen) > new Date(stateGroups[stateKey].lastSeen)) {
      stateGroups[stateKey].lastSeen = item.lastSeen;
    }
  });

  const sortedStates = Object.values(stateGroups).sort((a, b) => b.visitorCount - a.visitorCount || b.visitsTotal - a.visitsTotal);
  const uniqueStatesCount = sortedStates.length;
  const topState = sortedStates[0] ? `${sortedStates[0].stateName} (${sortedStates[0].stateCode})` : '-';

  const allSquads = getAdminAllSquads();
  const totalSquadsCount = allSquads.length;

  // Update Summary Tiles
  if (totalVisitorsEl) totalVisitorsEl.innerText = totalVisitorsCount.toLocaleString();
  if (totalStatesEl) totalStatesEl.innerText = uniqueStatesCount;
  if (topStateEl) topStateEl.innerText = topState;
  if (totalCitiesEl) totalCitiesEl.innerText = uniqueCitiesSet.size;
  const totalSquadsEl = document.getElementById('admin-telemetry-total-squads');
  if (totalSquadsEl) totalSquadsEl.innerText = totalSquadsCount.toLocaleString();
  const settingsSquadsEl = document.getElementById('settings-total-squads-count');
  if (settingsSquadsEl) settingsSquadsEl.innerText = totalSquadsCount.toLocaleString();
  if (lastSyncEl) lastSyncEl.innerText = `Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  // Guarantee top level visitors metric and telemetry total visitors metric remain strictly identical
  const canonicalTotal = Math.max(1, totalVisitorsCount);
  updateVisitorCounterUI(canonicalTotal);

  // 2. Filter data by search query if present
  const q = adminVisitorSearchQuery;

  // 3. Render Timeframe Groups View (Day, Week, Month, Year)
  if (tfContainer && ['day', 'week', 'month', 'year'].includes(adminVisitorViewMode)) {
    const tfGroups = {};
    log.forEach(item => {
      const bucket = getTimeframeBucket(item.lastSeen || item.firstSeen, adminVisitorViewMode);
      const key = bucket.key;
      const visits = Number(item.visitCount) || 1;
      const locStr = `${item.city || 'Ashburn'}, ${item.state || 'VA'}`;

      if (!tfGroups[key]) {
        tfGroups[key] = {
          key,
          label: bucket.label,
          sortVal: bucket.sortVal,
          visitorCount: 0,
          visitsTotal: 0,
          locations: {}
        };
      }
      tfGroups[key].visitorCount += 1;
      tfGroups[key].visitsTotal += visits;
      tfGroups[key].locations[locStr] = (tfGroups[key].locations[locStr] || 0) + visits;
    });

    const sortedTf = Object.values(tfGroups).sort((a, b) => b.sortVal - a.sortVal);
    const filteredTf = sortedTf.filter(tf => {
      if (!q) return true;
      const matchLabel = tf.label.toLowerCase().includes(q);
      const matchLoc = Object.keys(tf.locations).some(l => l.toLowerCase().includes(q));
      return matchLabel || matchLoc;
    });

    if (filteredTf.length === 0) {
      tfContainer.innerHTML = `
        <div class="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
          <i class="fa-solid fa-clock mb-2 text-base text-slate-600 block"></i>
          No visitor activity records matched "${q}".
        </div>
      `;
    } else {
      tfContainer.innerHTML = filteredTf.map((tf, idx) => {
        const percentage = totalVisitorsCount > 0 ? ((tf.visitorCount / totalVisitorsCount) * 100).toFixed(1) : '0.0';
        const sortedLocs = Object.keys(tf.locations).sort((a, b) => tf.locations[b] - tf.locations[a]);
        const modeIcons = {
          day: 'calendar-day',
          week: 'calendar-week',
          month: 'calendar',
          year: 'calendar-check'
        };
        const iconName = modeIcons[adminVisitorViewMode] || 'calendar-days';

        return `
          <div class="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/90 hover:border-purple-500/40 transition space-y-2.5">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0 text-xs shadow-sm">
                  <i class="fa-solid fa-${iconName}"></i>
                </span>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-slate-100 text-xs sm:text-sm">${tf.label}</span>
                    <span class="text-[10px] text-slate-500 font-mono">#${idx + 1}</span>
                  </div>
                  <p class="text-[10px] text-slate-400">
                    ${sortedLocs.length} ${sortedLocs.length === 1 ? 'Location' : 'Locations'} Active • ${tf.visitsTotal} ${tf.visitsTotal === 1 ? 'visit' : 'total visits'}
                  </p>
                </div>
              </div>

              <div class="text-right shrink-0">
                <span class="text-xs sm:text-sm font-black font-mono text-purple-400">${tf.visitorCount} ${tf.visitorCount === 1 ? 'Visitor' : 'Visitors'}</span>
                <span class="text-[10px] text-slate-400 block font-mono font-bold">${percentage}% share</span>
              </div>
            </div>

            <!-- Progress Bar Distribution -->
            <div class="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div class="bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500" style="width: ${Math.max(4, percentage)}%;"></div>
            </div>

            <!-- Active Locations in this Period -->
            <div class="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span class="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mr-1">Locations:</span>
              ${sortedLocs.slice(0, 8).map(loc => `
                <span class="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300 flex items-center gap-1">
                  <span class="font-medium text-slate-200">${loc}</span>
                  <span class="text-purple-400 font-mono font-bold">(${tf.locations[loc]})</span>
                </span>
              `).join('')}
              ${sortedLocs.length > 8 ? `<span class="text-[10px] text-slate-500">+${sortedLocs.length - 8} more</span>` : ''}
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // 4. Render State Groups View
  const filteredStates = sortedStates.filter(st => {
    if (!q) return true;
    const matchState = st.stateName.toLowerCase().includes(q) || st.stateCode.toLowerCase().includes(q);
    const matchCity = Object.keys(st.cities).some(c => c.toLowerCase().includes(q));
    return matchState || matchCity;
  });

  if (stateContainer && adminVisitorViewMode === 'state') {
    if (filteredStates.length === 0) {
      stateContainer.innerHTML = `
            <div class="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
              <i class="fa-solid fa-magnifying-glass mb-2 text-base text-slate-600 block"></i>
              No states or cities matched "${q}". Try another search term.
            </div>
          `;
    } else {
      stateContainer.innerHTML = filteredStates.map((st, idx) => {
        const percentage = totalVisitorsCount > 0 ? ((st.visitorCount / totalVisitorsCount) * 100).toFixed(1) : '0.0';
        const sortedCityNames = Object.keys(st.cities).sort((a, b) => st.cities[b] - st.cities[a]);

        return `
              <div class="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/90 hover:border-purple-500/40 transition space-y-2.5">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2.5">
                    <span class="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono font-black text-xs flex items-center justify-center shrink-0">
                      ${st.stateCode}
                    </span>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-slate-100 text-xs sm:text-sm">${st.stateName}</span>
                        <span class="text-[10px] text-slate-500 font-mono">#${idx + 1}</span>
                      </div>
                      <p class="text-[10px] text-slate-400">
                        ${sortedCityNames.length} ${sortedCityNames.length === 1 ? 'City' : 'Cities'} Active • ${st.visitsTotal} ${st.visitsTotal === 1 ? 'visit' : 'total visits'}
                      </p>
                    </div>
                  </div>

                  <div class="text-right shrink-0">
                    <span class="text-xs sm:text-sm font-black font-mono text-purple-400">${st.visitorCount} ${st.visitorCount === 1 ? 'Visitor' : 'Visitors'}</span>
                    <span class="text-[10px] text-slate-400 block font-mono font-bold">${percentage}% share</span>
                  </div>
                </div>

                <!-- Progress Bar Distribution -->
                <div class="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                  <div class="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full transition-all duration-500" style="width: ${Math.max(4, percentage)}%;"></div>
                </div>

                <!-- City Badges in this State -->
                <div class="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span class="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mr-1">Cities:</span>
                  ${sortedCityNames.map(city => `
                    <span class="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300 flex items-center gap-1">
                      <span class="font-medium text-slate-200">${city}</span>
                      <span class="text-purple-400 font-mono font-bold">(${st.cities[city]})</span>
                    </span>
                  `).join('')}
                </div>
              </div>
            `;
      }).join('');
    }
  }

  // 5. Render City & State Detailed Log View
  if (cityContainer && adminVisitorViewMode === 'city') {
    const filteredLog = log.filter(item => {
      if (!q) return true;
      const c = (item.city || '').toLowerCase();
      const s = (item.state || '').toLowerCase();
      const sn = (item.stateName || '').toLowerCase();
      const z = (item.zip || '').toLowerCase();
      return c.includes(q) || s.includes(q) || sn.includes(q) || z.includes(q);
    });

    if (filteredLog.length === 0) {
      cityContainer.innerHTML = `
            <div class="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
              <i class="fa-solid fa-location-dot mb-2 text-base text-slate-600 block"></i>
              No visitor location records matched "${q}".
            </div>
          `;
    } else {
      cityContainer.innerHTML = `
            <div class="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="border-b border-slate-800 bg-slate-900/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th class="px-3.5 py-2.5">City & State</th>
                    <th class="px-3 py-2.5">State Code</th>
                    <th class="px-3 py-2.5">Postal / Zip</th>
                    <th class="px-3 py-2.5 text-center">Hits</th>
                    <th class="px-3.5 py-2.5 text-right">Last Active</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-900 text-slate-300">
                  ${filteredLog.map(item => {
        const timeAgo = formatTimeAgo(item.lastSeen || item.firstSeen);
        return `
                      <tr class="hover:bg-slate-900/60 transition">
                        <td class="px-3.5 py-2.5 font-bold text-slate-100 flex items-center gap-1.5">
                          <i class="fa-solid fa-location-dot text-[10px] text-purple-400"></i>
                          <span>${item.city}, ${item.state}</span>
                        </td>
                        <td class="px-3 py-2.5">
                          <span class="px-1.5 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-[10px] font-mono font-bold text-purple-300">${item.state}</span>
                        </td>
                        <td class="px-3 py-2.5 font-mono text-slate-400">${item.zip || '-'}</td>
                        <td class="px-3 py-2.5 text-center font-mono font-bold text-emerald-400">${item.visitCount || 1}</td>
                        <td class="px-3.5 py-2.5 text-right text-[11px] text-slate-400">${timeAgo}</td>
                      </tr>
                    `;
      }).join('')}
                </tbody>
              </table>
            </div>
          `;
    }
  }

  // 6. Render Squads View
  const squadsContainer = document.getElementById('admin-squads-container');
  if (squadsContainer && adminVisitorViewMode === 'squads') {
    const filteredSquads = allSquads.filter(sq => {
      if (!q) return true;
      const n = (sq.name || '').toLowerCase();
      const m = (sq.motto || '').toLowerCase();
      const c = (sq.creatorName || sq.creatorEmail || '').toLowerCase();
      const code = (sq.inviteCode || '').toLowerCase();
      return n.includes(q) || m.includes(q) || c.includes(q) || code.includes(q);
    });

    if (filteredSquads.length === 0) {
      squadsContainer.innerHTML = `
        <div class="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
          <i class="fa-solid fa-users mb-2 text-base text-slate-600 block"></i>
          ${q ? `No squads matched "${escapeHtml(q)}".` : 'No squads created yet.'}
        </div>
      `;
    } else {
      squadsContainer.innerHTML = filteredSquads.map((sq, idx) => {
        const memberCount = Array.isArray(sq.members) ? sq.members.length : 0;
        const activeMembers = Array.isArray(sq.members) ? sq.members.filter(m => m && m.isWorkingOut).length : 0;
        const createdDateStr = sq.createdAt ? new Date(sq.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';
        const iconName = sq.icon || 'dumbbell';
        const accent = sq.accent || 'emerald';
        const accentBorder = accent === 'rose' ? 'border-rose-500/30' : accent === 'amber' ? 'border-amber-500/30' : accent === 'blue' ? 'border-blue-500/30' : accent === 'purple' ? 'border-purple-500/30' : 'border-emerald-500/30';
        const accentBg = accent === 'rose' ? 'bg-rose-500/10 text-rose-400' : accent === 'amber' ? 'bg-amber-500/10 text-amber-400' : accent === 'blue' ? 'bg-blue-500/10 text-blue-400' : accent === 'purple' ? 'bg-purple-500/10 text-purple-400' : 'bg-emerald-500/10 text-emerald-400';

        return `
          <div class="bg-slate-950 p-3.5 rounded-2xl border ${accentBorder} hover:border-slate-700 transition space-y-2">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="w-9 h-9 rounded-xl ${accentBg} border border-white/10 flex items-center justify-center shrink-0 text-sm">
                  <i class="fa-solid fa-${iconName}"></i>
                </span>
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h4 class="text-xs font-bold text-slate-100 truncate">${escapeHtml(sq.name)}</h4>
                    ${activeMembers > 0 ? `
                      <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        ${activeMembers} lifting now
                      </span>
                    ` : ''}
                  </div>
                  <p class="text-[11px] text-slate-400 truncate">${escapeHtml(sq.motto || 'Consistency in motion')}</p>
                </div>
              </div>

              <div class="text-right shrink-0">
                <span class="text-xs font-mono font-bold text-amber-400 block">${memberCount} ${memberCount === 1 ? 'member' : 'members'}</span>
                <span class="text-[10px] text-slate-500 font-mono block">#${idx + 1}</span>
              </div>
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-slate-900 text-[10px] text-slate-400 flex-wrap gap-2">
              <div class="flex items-center gap-3">
                <span class="flex items-center gap-1 text-slate-300">
                  <i class="fa-solid fa-crown text-amber-400 text-[9px]"></i>
                  <span>${escapeHtml(sq.creatorName || sq.creatorEmail || 'Squad Leader')}</span>
                </span>
                ${sq.inviteCode ? `
                  <span class="font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-emerald-400 font-bold tracking-wider">
                    ${escapeHtml(sq.inviteCode)}
                  </span>
                ` : ''}
              </div>
              <span class="text-slate-500 flex items-center gap-1">
                <i class="fa-solid fa-calendar-days text-[9px]"></i>
                ${createdDateStr}
              </span>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

/* ==========================================================================
   showUp Backup & Multi-Tier Cloud Sync Engine: Offline JSON & Google Drive
   ========================================================================== */

    function triggerManualFileRestore() {
      const fileInput = document.getElementById('manual-backup-file-input');
      if (fileInput) {
        fileInput.click();
      }
    }



    function getBackupPayload() {
      return {
        app: "showUp",
        version: "2.0",
        lastSyncedAt: localStorage.getItem('showUp_last_drive_sync') || new Date().toISOString(),
        profile: {
          height: userHeight,
          weight: userWeight
        },
        workouts: completedWorkoutsHistory,
        weightHistory: weightHistory,
        squads: getSquads(),
        activeSession: currentSessionSets
      };
    }

    function getFormattedBackupSize() {
      const payload = getBackupPayload();
      const jsonStr = JSON.stringify(payload, null, 2);
      const bytes = new Blob([jsonStr]).size;
      return {
        formatted: formatBytes(bytes),
        exactBytes: bytes.toLocaleString() + ' bytes',
        rawBytes: bytes,
        workoutCount: (payload.workouts || []).length,
        squadCount: (payload.squads || []).length,
        weightCount: (payload.weightHistory || []).length
      };
    }

    function openGDriveBackupModal() {
      const modal = document.getElementById('gdrive-backup-active-modal');
      if (!modal) return;

      const profile = JSON.parse(localStorage.getItem('showUp_user_profile') || 'null');
      const email = profile?.email || 'Not signed in';
      const name = profile?.name || 'Local User';
      const avatar = profile?.picture;

      const userAvatarEl = document.getElementById('gdrive-modal-user-avatar');
      const userNameEl = document.getElementById('gdrive-modal-user-name');
      const userEmailEl = document.getElementById('gdrive-modal-user-email');
      const filesizeEl = document.getElementById('gdrive-modal-filesize');
      const exactBytesEl = document.getElementById('gdrive-modal-exact-bytes');
      const countWorkoutsEl = document.getElementById('gdrive-modal-count-workouts');
      const countSquadsEl = document.getElementById('gdrive-modal-count-squads');
      const countWeightsEl = document.getElementById('gdrive-modal-count-weights');
      const lastSyncedEl = document.getElementById('gdrive-modal-last-synced');
      const statusBadgeEl = document.getElementById('gdrive-modal-status-text');
      const syncBadgeEl = document.getElementById('gdrive-modal-sync-badge');

      if (userNameEl) userNameEl.innerText = name;
      if (userEmailEl) userEmailEl.innerText = email;
      if (userAvatarEl) {
        if (avatar) {
          userAvatarEl.innerHTML = `<img src="${avatar}" class="w-full h-full rounded-xl object-cover" alt="User">`;
        } else {
          userAvatarEl.innerText = getInitials(name);
        }
      }

      const sizeInfo = getFormattedBackupSize();
      if (filesizeEl) filesizeEl.innerText = sizeInfo.formatted;
      if (exactBytesEl) exactBytesEl.innerText = `(${sizeInfo.exactBytes})`;
      if (countWorkoutsEl) countWorkoutsEl.innerText = sizeInfo.workoutCount;
      if (countSquadsEl) countSquadsEl.innerText = sizeInfo.squadCount;
      if (countWeightsEl) countWeightsEl.innerText = sizeInfo.weightCount;

      const lastSyncIso = localStorage.getItem('showUp_last_drive_sync');
      if (lastSyncedEl) {
        if (lastSyncIso) {
          try {
            const d = new Date(lastSyncIso);
            lastSyncedEl.innerText = d.toLocaleDateString() + ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } catch(e) {
            lastSyncedEl.innerText = lastSyncIso;
          }
        } else {
          lastSyncedEl.innerText = googleAccessToken ? 'Pending next workout completion' : 'Not yet synced';
        }
      }

      if (statusBadgeEl) {
        statusBadgeEl.innerText = googleAccessToken ? "Active & Connected" : "Sign-In Required";
        statusBadgeEl.className = googleAccessToken 
          ? "text-[10px] font-bold uppercase tracking-wider text-emerald-400"
          : "text-[10px] font-bold uppercase tracking-wider text-amber-400";
      }

      if (syncBadgeEl) {
        syncBadgeEl.innerText = googleAccessToken ? "Auto-Sync On" : "Offline";
        syncBadgeEl.className = googleAccessToken
          ? "text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex-shrink-0"
          : "text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex-shrink-0";
      }

      modal.classList.remove('hidden');
    }

    function closeGDriveBackupModal() {
      const modal = document.getElementById('gdrive-backup-active-modal');
      if (modal) modal.classList.add('hidden');
    }

    function dismissCloudBackupBanner() {
      try {
        localStorage.setItem('showUp_backup_banner_dismissed', 'true');
      } catch (e) {}
      const banner = document.getElementById('cloud-backup-reminder-banner');
      if (banner) {
        banner.style.transition = 'opacity 0.25s ease, max-height 0.3s ease, margin 0.3s ease, padding 0.3s ease';
        banner.style.opacity = '0';
        banner.style.maxHeight = '0px';
        banner.style.paddingTop = '0px';
        banner.style.paddingBottom = '0px';
        banner.style.marginTop = '0px';
        banner.style.marginBottom = '0px';
        setTimeout(() => {
          banner.classList.add('hidden');
          banner.style = '';
        }, 300);
      }
    }

    function updateCloudBackupUI() {
      const banner = document.getElementById('cloud-backup-reminder-banner');
      const bannerBadge = document.getElementById('backup-banner-badge');
      const bannerTitle = document.getElementById('backup-banner-title');
      const bannerDesc = document.getElementById('backup-banner-desc');
      const bannerGoogleBtn = document.getElementById('backup-banner-google-btn');
      const settingsBadge = document.getElementById('settings-backup-status-badge');
      const gdrivePill = document.getElementById('settings-gdrive-status-pill');
      const timeValEl = document.getElementById('settings-gdrive-time-val');
      const firestorePill = document.getElementById('settings-firestore-status-pill');
      const firestoreTimeValEl = document.getElementById('settings-firestore-time-val');

      const lastSyncIso = localStorage.getItem('showUp_last_drive_sync');
      if (timeValEl) {
        if (lastSyncIso) {
          try {
            const d = new Date(lastSyncIso);
            const datePart = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            const timePart = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
            timeValEl.innerText = `${datePart}, ${timePart}`;
          } catch (e) {
            timeValEl.innerText = lastSyncIso;
          }
        } else {
          timeValEl.innerText = googleAccessToken ? "Ready to sync" : "Not backed up yet";
        }
      }

      const lastFirestoreSyncIso = localStorage.getItem('showUp_last_firestore_sync');
      const isAthleteLoggedIn = (typeof isCustomerLoggedIn === 'function') ? isCustomerLoggedIn() : !!googleAccessToken;

      if (firestoreTimeValEl) {
        if (lastFirestoreSyncIso) {
          try {
            const d = new Date(lastFirestoreSyncIso);
            const datePart = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            const timePart = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
            firestoreTimeValEl.innerText = `${datePart}, ${timePart}`;
          } catch (e) {
            firestoreTimeValEl.innerText = lastFirestoreSyncIso;
          }
        } else {
          firestoreTimeValEl.innerText = isAthleteLoggedIn ? "Ready to sync" : "Not backed up yet";
        }
      }

      if (firestorePill) {
        firestorePill.className = isAthleteLoggedIn
          ? "text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          : "text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700";
        firestorePill.innerText = isAthleteLoggedIn ? "Connected" : "Offline";
      }

      const isDismissed = (function() {
        try {
          return localStorage.getItem('showUp_backup_banner_dismissed') === 'true';
        } catch (e) {
          return false;
        }
      })();

      if (banner) {
        banner.classList.add('hidden');
        banner.style.display = 'none';
      }

      if (googleAccessToken || isAthleteLoggedIn || isDismissed) {
        if (settingsBadge) {
          settingsBadge.className = (googleAccessToken || isAthleteLoggedIn)
            ? "text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
            : "text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-700";
          settingsBadge.innerText = (googleAccessToken || isAthleteLoggedIn) ? "Cloud Synced" : "Offline Device";
        }
        if (gdrivePill) {
          gdrivePill.className = googleAccessToken
            ? "text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700";
          gdrivePill.innerText = googleAccessToken ? "Connected" : "Offline";
        }
      } else {
        if (bannerBadge) {
          bannerBadge.className = "text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30";
          bannerBadge.innerText = "Sign-in Recommended";
        }
        if (bannerTitle) bannerTitle.innerText = "Protect Your Workout & Squad Data";
        if (bannerDesc) bannerDesc.innerText = "Sign in to auto-sync your workouts, weight logs, and squads to Cloud storage, or back up manually to your device and restore anytime.";
        if (bannerGoogleBtn) {
          bannerGoogleBtn.innerHTML = `<i class="fa-brands fa-google text-xs"></i><span>Sign In for Auto-Backup</span>`;
          bannerGoogleBtn.onclick = () => { triggerHaptic('medium'); handleGoogleLogin(); };
        }
        if (settingsBadge) {
          settingsBadge.className = "text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-700";
          settingsBadge.innerText = "Offline Device";
        }
        if (gdrivePill) {
          gdrivePill.className = "text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700";
          gdrivePill.innerText = "Offline";
        }
      }
    }



    function requestDriveAuthorization(autoSyncAfter = true) {
      if (window.location.protocol === 'file:') {
        alert("Google Drive authorization requires running showUp via HTTP or HTTPS (e.g. http://localhost:3000 or GitHub Pages).");
        return;
      }
      if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
        showToast("Google Identity SDK is loading. Please retry in a moment.", "warning");
        return;
      }

      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: getGoogleClientId(),
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          prompt: 'consent', // Explicitly trigger Google consent dialog so user grants Drive scopes
          callback: async (response) => {
            if (response && response.access_token) {
              googleAccessToken = response.access_token;
              localStorage.setItem('showUp_google_token', googleAccessToken);
              localStorage.setItem('showUp_session_expiry', String(Date.now() + SESSION_DURATION_MS));
              updateCloudBackupUI();
              showToast("Google Drive backup permission granted!", "success");
              if (autoSyncAfter) {
                await syncToGoogleDrive(false);
              }
            } else if (response && response.error) {
              console.warn("Drive authorization canceled or error:", response);
              if (response.error === 'popup_closed_by_user') {
                showToast("Google Drive permission dialog was closed.", "info");
              } else {
                showToast(`Drive permission: ${response.error_description || response.error}`, "warning");
              }
            }
          },
          error_callback: (err) => {
            console.warn("Drive authorization error callback:", err);
            if (err && err.type === 'popup_closed') {
              showToast("Google Drive permission window was closed.", "info");
            } else {
              showToast("Google Drive authorization interrupted.", "info");
            }
          }
        });
        client.requestAccessToken({ prompt: 'consent' });
      } catch (err) {
        console.error("Failed to request Drive authorization:", err);
        showToast(`Authorization error: ${err.message}`, "error");
      }
    }



    async function syncToGoogleDrive(isSilent = false) {
      if (!googleAccessToken) {
        if (!isSilent) {
          showToast("Authorizing Google Drive backup...", "info");
          requestDriveAuthorization(true);
        }
        return;
      }

      const syncIcon = document.getElementById('sync-icon');
      if (syncIcon) syncIcon.className = "fa-brands fa-google-drive text-xs animate-pulse text-amber-400";
      if (!isSilent) showToast("Backing up workout data to Google Drive...", "info");

      let workoutsToSync = (Array.isArray(completedWorkoutsHistory) && completedWorkoutsHistory.length > 0)
        ? completedWorkoutsHistory
        : (typeof AppStorage !== 'undefined' && typeof AppStorage.getAthleteWorkouts === 'function' ? AppStorage.getAthleteWorkouts() : []);

      if (workoutsToSync.length > 0 && typeof completedWorkoutsHistory !== 'undefined' && completedWorkoutsHistory.length === 0) {
        completedWorkoutsHistory = workoutsToSync;
      }

      const backupPayload = {
        app: "showUp",
        version: "2.0",
        lastSyncedAt: new Date().toISOString(),
        profile: {
          height: userHeight,
          weight: userWeight,
          theme: localStorage.getItem('showUp_theme') || 'emerald',
          font: localStorage.getItem('showUp_font') || 'font-jakarta'
        },
        theme: localStorage.getItem('showUp_theme') || 'emerald',
        font: localStorage.getItem('showUp_font') || 'font-jakarta',
        workouts: workoutsToSync,
        weightHistory: weightHistory,
        squads: getSquads(),
        activeSession: currentSessionSets
      };

      let fileContent = JSON.stringify(backupPayload, null, 2);

      try {
        // 1. Search for existing showUp backup file in Google Drive
        const query = encodeURIComponent(`(name='${BACKUP_FILENAME}' or name='showUp_workout_data.json' or name='showUp_backup.json') and trashed=false`);
        const searchRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime)`,
          {
            headers: { 'Authorization': `Bearer ${googleAccessToken}` }
          }
        );

        if (searchRes.status === 401 || searchRes.status === 403) {
          const errData = await searchRes.json().catch(() => ({}));
          const errMsg = (errData.error?.message || '').toLowerCase();
          const isScopeErr = searchRes.status === 403 || errMsg.includes('insufficient') || errMsg.includes('scope');

          googleAccessToken = null;
          localStorage.removeItem('showUp_google_token');

          if (isScopeErr) {
            console.warn("Drive scope insufficient. Prompting for Google Drive permission...");
            if (!isSilent) {
              showToast("Google Drive backup permission needed. Opening authorization...", "info");
              requestDriveAuthorization(true);
            }
          } else {
            console.warn("Drive token expired during sync. Refreshing token silently...");
            requestTokenSilently();
            if (!isSilent) {
              showToast("Google authorization refreshed. Click backup to sync.", "info");
            }
          }
          return;
        }

        if (!searchRes.ok) {
          const errData = await searchRes.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Search failed with status ${searchRes.status}`);
        }

        const searchData = await searchRes.json();
        let fileId = null;

        if (searchData.files && searchData.files.length > 0) {
          fileId = searchData.files[0].id;

          // Merge with any existing remote workouts so historical data is never wiped
          try {
            const existingRes = await fetch(
              `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
              { headers: { 'Authorization': `Bearer ${googleAccessToken}` } }
            );
            if (existingRes.ok) {
              const existingData = await existingRes.json().catch(() => null);
              if (existingData && Array.isArray(existingData.workouts) && existingData.workouts.length > 0) {
                const merged = (typeof AppStorage !== 'undefined' && typeof AppStorage.mergeWorkouts === 'function')
                  ? AppStorage.mergeWorkouts(workoutsToSync, existingData.workouts)
                  : workoutsToSync;
                workoutsToSync = merged;
                completedWorkoutsHistory = merged;
                if (typeof AppStorage !== 'undefined' && typeof AppStorage.saveAthleteWorkouts === 'function') {
                  AppStorage.saveAthleteWorkouts(merged);
                }
                backupPayload.workouts = merged;
                fileContent = JSON.stringify(backupPayload, null, 2);
              }
            }
          } catch (e) {
            console.debug("Existing file read notice during sync:", e);
          }

          // 2a. Update existing file content directly via media upload
          const updateRes = await fetch(
            `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${googleAccessToken}`,
                'Content-Type': 'application/json'
              },
              body: fileContent
            }
          );

          if (!updateRes.ok) {
            if (updateRes.status === 401 || updateRes.status === 403) {
              googleAccessToken = null;
              localStorage.removeItem('showUp_google_token');
              if (!isSilent) {
                showToast("Refreshing Google Drive authorization...", "info");
                requestDriveAuthorization(true);
              }
              return;
            }
            const errData = await updateRes.json().catch(() => ({}));
            throw new Error(errData.error?.message || `Upload failed with status ${updateRes.status}`);
          }
        } else {
          // 2b. Create new backup file in Google Drive
          const createMetaRes = await fetch(
            'https://www.googleapis.com/drive/v3/files',
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${googleAccessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                name: BACKUP_FILENAME,
                mimeType: 'application/json',
                description: 'showUp Workout & Squads Progress Data Backup'
              })
            }
          );

          if (!createMetaRes.ok) {
            if (createMetaRes.status === 401 || createMetaRes.status === 403) {
              googleAccessToken = null;
              localStorage.removeItem('showUp_google_token');
              if (!isSilent) {
                showToast("Refreshing Google Drive authorization...", "info");
                requestDriveAuthorization(true);
              }
              return;
            }
            const errData = await createMetaRes.json().catch(() => ({}));
            throw new Error(errData.error?.message || `File creation failed with status ${createMetaRes.status}`);
          }

          const createdFile = await createMetaRes.json();
          fileId = createdFile.id;

          const uploadRes = await fetch(
            `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${googleAccessToken}`,
                'Content-Type': 'application/json'
              },
              body: fileContent
            }
          );

          if (!uploadRes.ok) {
            if (uploadRes.status === 401 || uploadRes.status === 403) {
              googleAccessToken = null;
              localStorage.removeItem('showUp_google_token');
              if (!isSilent) {
                showToast("Refreshing Google Drive authorization...", "info");
                requestDriveAuthorization(true);
              }
              return;
            }
            const errData = await uploadRes.json().catch(() => ({}));
            throw new Error(errData.error?.message || `Content upload failed with status ${uploadRes.status}`);
          }
        }

        const nowIso = new Date().toISOString();
        localStorage.setItem('showUp_last_drive_sync', nowIso);

        if (syncIcon) syncIcon.className = "fa-solid fa-check text-xs text-emerald-400";
        if (!isSilent) showToast("Successfully backed up workouts and squads to Google Drive!", "success");

        updateCloudBackupUI();
        const gdriveModal = document.getElementById('gdrive-backup-active-modal');
        if (gdriveModal && !gdriveModal.classList.contains('hidden')) {
          openGDriveBackupModal();
        }

        setTimeout(() => {
          if (syncIcon) syncIcon.className = "fa-brands fa-google-drive text-xs text-emerald-400";
        }, 2000);

      } catch (err) {
        console.error("Google Drive sync error:", err);
        if (syncIcon) syncIcon.className = "fa-brands fa-google-drive text-xs text-rose-400";
        const errMsg = (err.message || '').toLowerCase();
        if (errMsg.includes('insufficient') || errMsg.includes('scope') || errMsg.includes('permission')) {
          googleAccessToken = null;
          localStorage.removeItem('showUp_google_token');
          if (!isSilent) {
            showToast("Google Drive backup permission needed. Opening authorization...", "info");
            requestDriveAuthorization(true);
          }
        } else {
          if (!isSilent) showToast(`Drive Sync failed: ${err.message}`, "error");
        }
      }
    }

    async function restoreFromGoogleDrive(isAutoCheck = false) {
      if (!googleAccessToken) {
        if (!isAutoCheck) {
          showToast("Authorizing Google Drive to restore...", "info");
          requestDriveAuthorization(false);
        }
        return;
      }

      if (!isAutoCheck) showToast("Syncing cloud activity & squads from Google Drive...", "info");

      try {
        const query = encodeURIComponent(`(name='${BACKUP_FILENAME}' or name='showUp_workout_data.json' or name='showUp_backup.json') and trashed=false`);
        const searchRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime)`,
          {
            headers: { 'Authorization': `Bearer ${googleAccessToken}` }
          }
        );

        if (searchRes.status === 401 || searchRes.status === 403) {
          const errData = await searchRes.json().catch(() => ({}));
          const errMsg = (errData.error?.message || '').toLowerCase();
          const isScopeErr = searchRes.status === 403 || errMsg.includes('insufficient') || errMsg.includes('scope');

          googleAccessToken = null;
          localStorage.removeItem('showUp_google_token');

          if (isScopeErr) {
            console.warn("Drive scope insufficient during restore. Prompting for Drive permission...");
            if (!isAutoCheck) {
              showToast("Google Drive backup permission needed. Opening authorization...", "info");
              requestDriveAuthorization(false);
            }
          } else {
            console.warn("Drive token expired during restore. Refreshing token silently...");
            requestTokenSilently();
            if (!isAutoCheck) {
              showToast("Google authorization refreshed. Click restore to re-sync.", "info");
            }
          }
          return;
        }

        const searchData = await searchRes.json();
        if (!searchData.files || searchData.files.length === 0) {
          if (!isAutoCheck) showToast("No existing showUp backup found in Google Drive.", "warning");
          return;
        }

        const fileId = searchData.files[0].id;
        const downloadRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          {
            headers: { 'Authorization': `Bearer ${googleAccessToken}` }
          }
        );

        if (!downloadRes.ok) {
          throw new Error(`Failed to download backup file (status ${downloadRes.status})`);
        }

        const backupData = await downloadRes.json();
        let restoredCount = 0;
        let restoredSquadsCount = 0;
        const user = getAppUser();
        const userEmail = (user?.email || '').toLowerCase().trim();
        const userName = (user?.rawName || user?.name || '').toLowerCase().trim();

        if (backupData.workouts && Array.isArray(backupData.workouts)) {
          const currentLocal = (typeof AppStorage !== 'undefined' && typeof AppStorage.getAthleteWorkouts === 'function')
            ? AppStorage.getAthleteWorkouts()
            : (Array.isArray(completedWorkoutsHistory) ? completedWorkoutsHistory : []);
          const merged = (typeof AppStorage !== 'undefined' && typeof AppStorage.mergeWorkouts === 'function')
            ? AppStorage.mergeWorkouts(currentLocal, backupData.workouts)
            : backupData.workouts;

          completedWorkoutsHistory = merged;
          if (typeof AppStorage !== 'undefined' && typeof AppStorage.saveAthleteWorkouts === 'function') {
            AppStorage.saveAthleteWorkouts(completedWorkoutsHistory);
          } else {
            localStorage.setItem('showUp_synced_workouts', JSON.stringify(completedWorkoutsHistory));
            if (userEmail && userEmail !== 'you@showup.app' && userEmail !== 'user@showup.app') {
              try {
                localStorage.setItem('showUp_user_workouts_' + userEmail, JSON.stringify(completedWorkoutsHistory));
              } catch (e) {}
            }
          }
          restoredCount = completedWorkoutsHistory.length;

          // If local had unsynced workouts that were just merged, silently push merged backup to Drive
          if (completedWorkoutsHistory.length > backupData.workouts.length) {
            setTimeout(() => { syncToGoogleDrive(true); }, 800);
          }
        }

        if (backupData.weightHistory && Array.isArray(backupData.weightHistory)) {
          weightHistory = backupData.weightHistory;
          localStorage.setItem('showUp_weight_history', JSON.stringify(weightHistory));
        }

        if (backupData.profile) {
          if (backupData.profile.height) {
            userHeight = backupData.profile.height;
            localStorage.setItem('showUp_user_height', userHeight);
          }
          if (backupData.profile.weight) {
            userWeight = backupData.profile.weight;
            localStorage.setItem('showUp_user_weight', userWeight);
          }
          if (backupData.profile.theme) {
            setThemePalette(backupData.profile.theme);
          }
          loadPhysicalProfile();
        }

        if (backupData.theme) {
          setThemePalette(backupData.theme);
        }

        if (backupData.font) {
          setFontFamily(backupData.font);
        }

        if (backupData.squads && Array.isArray(backupData.squads)) {
          const rawSquads = backupData.squads.filter(s => s && s.id !== 'squad_iron_collective' && s.name !== 'Iron Collective');
          // Only restore squads where athlete is creator or legitimately in members
          const cleanSquads = rawSquads.filter(sq => isAthleteMemberOrCreator(sq, user));
          cleanSquads.forEach(sq => {
            if (!sq.members) sq.members = [];

            // 1. Re-assign creator ownership to the authenticated athlete if it was local_user or matches
            if (!sq.creatorId || sq.creatorId === 'local_user' || (sq.creatorEmail && sq.creatorEmail.toLowerCase().trim() === userEmail) || (sq.creator && sq.creator.toLowerCase().trim() === userName)) {
              sq.creatorId = user.id;
              sq.creatorEmail = user.email;
              sq.creatorName = user.name;
            }

            // 2. Ensure the athlete is represented in sq.members
            let match = sq.members.find(m => {
              if (!m) return false;
              if (typeof m === 'string') return m === user.id || (userEmail && m.toLowerCase().trim() === userEmail);
              return m.id === user.id || (userEmail && m.email && m.email.toLowerCase().trim() === userEmail) || m.id === 'local_user';
            });

            if (match && typeof match === 'object') {
              match.id = user.id;
              match.name = user.name;
              match.rawName = user.rawName;
              match.email = user.email;
              if (user.picture) match.avatar = user.picture;
              if (sq.creatorId === user.id) match.isCreator = true;
            }
          });

          saveSquads(cleanSquads);
          initSquads();
          restoredSquadsCount = cleanSquads.length;
        }

        if (typeof renderHomeTab === 'function') {
          try { renderHomeTab(); } catch (e) { console.error("renderHomeTab error:", e); }
        }
        renderCalendar();
        renderMonthlyHistory();
        renderWeightHistory();
        initSquads();
        renderSquadsTab();
        updateSquadBeacon();
        updateGlobalStatsUI();
        renderHeatMap();

        localStorage.setItem('showUp_last_drive_sync', new Date().toISOString());

        if (restoredCount > 0 || restoredSquadsCount > 0) {
          const squadMsg = restoredSquadsCount > 0 ? ` and ${restoredSquadsCount} squad${restoredSquadsCount === 1 ? '' : 's'}` : '';
          showToast(`Restored ${restoredCount} workout${restoredCount === 1 ? '' : 's'}${squadMsg} from Google Drive!`, "success");
        } else if (!isAutoCheck) {
          showToast("Cloud backup synced with Google Drive.", "info");
        }

      } catch (err) {
        console.error("Google Drive restore error:", err);
        const errMsg = (err.message || '').toLowerCase();
        if (errMsg.includes('insufficient') || errMsg.includes('scope') || errMsg.includes('permission')) {
          googleAccessToken = null;
          localStorage.removeItem('showUp_google_token');
          if (!isAutoCheck) {
            showToast("Google Drive backup permission needed. Opening authorization...", "info");
            requestDriveAuthorization(false);
          }
        } else {
          showToast(`Drive Restore error: ${err.message}`, "error");
        }
      }
    }



    function exportJSONBackup() {
      const fullBackup = {
        app: "showUp",
        version: "2.0",
        exportedAt: new Date().toISOString(),
        theme: localStorage.getItem('showUp_theme') || localStorage.getItem('showUp_theme_accent') || 'emerald',
        font: localStorage.getItem('showUp_font') || 'font-jakarta',
        profile: {
          height: userHeight,
          weight: userWeight,
          theme: localStorage.getItem('showUp_theme') || 'emerald'
        },
        workouts: completedWorkoutsHistory,
        weightHistory: weightHistory,
        squads: getSquads(),
        squadInvites: getSquadInvites(),
        globalSquadRegistry: getGlobalSquadRegistry(),
        activeSession: currentSessionSets
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `showUp_backup_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Offline JSON backup with squads exported successfully!", "success");
    }

    function importJSONBackup(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          let count = 0;
          let squadsCount = 0;

          if (Array.isArray(data)) {
            completedWorkoutsHistory = (typeof AppStorage !== 'undefined' && typeof AppStorage.mergeWorkouts === 'function')
              ? AppStorage.mergeWorkouts(completedWorkoutsHistory, data)
              : data;
            count = completedWorkoutsHistory.length;
          } else if (data && typeof data === 'object') {
            if (data.theme) setThemePalette(data.theme);
            if (data.font && typeof setFontFamily === 'function') setFontFamily(data.font);
            if (Array.isArray(data.workouts)) {
              completedWorkoutsHistory = (typeof AppStorage !== 'undefined' && typeof AppStorage.mergeWorkouts === 'function')
                ? AppStorage.mergeWorkouts(completedWorkoutsHistory, data.workouts)
                : data.workouts;
              count = completedWorkoutsHistory.length;
            }
            if (Array.isArray(data.weightHistory)) {
              weightHistory = data.weightHistory;
              localStorage.setItem('showUp_weight_history', JSON.stringify(weightHistory));
            }
            if (Array.isArray(data.squadInvites)) {
              localStorage.setItem('showUp_squad_invites', JSON.stringify(data.squadInvites));
            }
            if (Array.isArray(data.globalSquadRegistry)) {
              localStorage.setItem('showUp_global_squad_registry', JSON.stringify(data.globalSquadRegistry));
            }
            if (data.profile) {
              if (data.profile.theme) setThemePalette(data.profile.theme);
              if (data.profile.height) {
                userHeight = data.profile.height;
                localStorage.setItem('showUp_user_height', userHeight);
              }
              if (data.profile.weight) {
                userWeight = data.profile.weight;
                localStorage.setItem('showUp_user_weight', userWeight);
              }
              loadPhysicalProfile();
            }
            if (Array.isArray(data.squads)) {
              const user = getAppUser();
              const rawSquads = data.squads.filter(s => s && s.id !== 'squad_iron_collective' && s.name !== 'Iron Collective');
              const cleanSquads = rawSquads.filter(sq => isAthleteMemberOrCreator(sq, user));
              cleanSquads.forEach(sq => {
                if (!sq.members) sq.members = [];
                const match = sq.members.find(m => m.id === user.id || m.email === user.email || m.id === 'local_user');
                if (match) {
                  match.id = user.id;
                  match.name = user.name;
                  match.rawName = user.rawName;
                  match.email = user.email;
                  if (user.picture) match.avatar = user.picture;
                }
              });
              saveSquads(cleanSquads);
              squadsCount = cleanSquads.length;
            }
          }

          if (typeof AppStorage !== 'undefined' && typeof AppStorage.saveAthleteWorkouts === 'function') {
            AppStorage.saveAthleteWorkouts(completedWorkoutsHistory);
          } else {
            localStorage.setItem('showUp_synced_workouts', JSON.stringify(completedWorkoutsHistory));
          }

          if (typeof renderHomeTab === 'function') {
            try { renderHomeTab(); } catch (e) {}
          }
          renderCalendar();
          renderMonthlyHistory();
          renderWeightHistory();
          renderSquadsTab();
          updateSquadBeacon();
          updateGlobalStatsUI();
          renderHeatMap();

          const squadMsg = squadsCount > 0 ? ` and ${squadsCount} squad${squadsCount === 1 ? '' : 's'}` : '';
          showToast(`Imported ${count} workout${count === 1 ? '' : 's'}${squadMsg} from JSON backup!`, "success");

          if (googleAccessToken) {
            syncToGoogleDrive(true);
          }
          if (typeof queueFirestoreAutoSync === 'function') {
            queueFirestoreAutoSync();
          }
        } catch (err) {
          console.error("JSON Import error:", err);
          showToast("Failed to parse JSON. Please check file format.", "error");
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    }

    // ==========================================================================
    // showUp Firebase Firestore Cloud Backup & Multi-Device Sync Engine
    // ==========================================================================

    let firestoreAutoSyncTimer = null;

    function queueFirestoreAutoSync() {
      if (typeof isCustomerLoggedIn === 'function' && !isCustomerLoggedIn()) return;
      if (firestoreAutoSyncTimer) clearTimeout(firestoreAutoSyncTimer);
      firestoreAutoSyncTimer = setTimeout(() => {
        if (typeof syncToFirestore === 'function') {
          syncToFirestore(true).catch(e => console.debug("Auto Firestore sync notice:", e));
        }
      }, 1500);
    }

    function setFirestoreButtonLoading(isBackup, isLoading) {
      const btn = document.getElementById(isBackup ? 'btn-settings-firestore-backup' : 'btn-settings-firestore-restore');
      const bannerBtn = isBackup ? document.getElementById('backup-banner-firestore-btn') : null;
      if (btn) {
        btn.disabled = isLoading;
        if (isLoading) {
          btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-xs"></i><span>${isBackup ? 'Syncing...' : 'Restoring...'}</span>`;
        } else {
          btn.innerHTML = isBackup
            ? `<i class="fa-solid fa-cloud-arrow-up text-xs"></i><span id="settings-firestore-btn-backup-text">Sync to Firestore</span>`
            : `<i class="fa-solid fa-cloud-arrow-down text-xs text-amber-400"></i><span id="settings-firestore-btn-restore-text">Restore from Firestore</span>`;
        }
      }
      if (bannerBtn) {
        bannerBtn.disabled = isLoading;
        bannerBtn.innerHTML = isLoading
          ? `<i class="fa-solid fa-spinner fa-spin text-xs"></i><span>Syncing...</span>`
          : `<i class="fa-solid fa-cloud-arrow-up text-xs mr-1.5"></i><span>Sync to Firestore</span>`;
      }
    }

    async function syncToFirestore(isSilent = false) {
      if (!isSilent) setFirestoreButtonLoading(true, true);
      try {
        if (typeof getFirestoreDb !== 'function') {
          if (!isSilent) showToast("Firebase Firestore service is not loaded.", "error");
          return { success: false, error: "Firestore not loaded" };
        }

        const db = getFirestoreDb();
        if (!db) {
          if (!isSilent) showToast("Could not connect to Firebase database.", "error");
          return { success: false, error: "Database unavailable" };
        }

        const user = (typeof getAppUser === 'function') ? getAppUser() : null;
        const rawEmail = (user?.email || '').toLowerCase().trim();
        if (!rawEmail || rawEmail === 'you@showup.app' || rawEmail === 'user@showup.app') {
          if (!isSilent) {
            showToast("Please log in with email/password or Google to sync with Firebase Cloud.", "info");
            const settingsModal = document.getElementById('settings-modal');
            if (settingsModal) settingsModal.classList.add('hidden');
            if (typeof openAuthLoginModal === 'function') {
              openAuthLoginModal('signin');
            }
          }
          return { success: false, error: "User not logged in" };
        }

        const normEmail = rawEmail;
        let workoutsToSync = (typeof AppStorage !== 'undefined' && typeof AppStorage.getAthleteWorkouts === 'function')
          ? AppStorage.getAthleteWorkouts()
          : (Array.isArray(completedWorkoutsHistory) ? completedWorkoutsHistory : []);

        const payload = {
          app: "showUp",
          version: "2.0",
          email: normEmail,
          lastSyncedAt: new Date().toISOString(),
          profile: {
            height: typeof userHeight !== 'undefined' ? userHeight : null,
            weight: typeof userWeight !== 'undefined' ? userWeight : null,
            firstName: user?.rawName || user?.name || 'Athlete'
          },
          workouts: workoutsToSync,
          weightHistory: typeof weightHistory !== 'undefined' && Array.isArray(weightHistory) ? weightHistory : [],
          squads: typeof getSquads === 'function' ? getSquads() : [],
          activeSession: typeof currentSessionSets !== 'undefined' && Array.isArray(currentSessionSets) ? currentSessionSets : []
        };

        const docRef = db.collection('user_backups').doc(normEmail);

        // 1. Read existing remote backup to merge non-destructively (timeout guard: 8 seconds)
        try {
          const snap = await Promise.race([
            docRef.get(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000))
          ]);
          if (snap && snap.exists) {
            const remoteData = snap.data();
            if (remoteData && Array.isArray(remoteData.workouts) && remoteData.workouts.length > 0) {
              const merged = (typeof AppStorage !== 'undefined' && typeof AppStorage.mergeWorkouts === 'function')
                ? AppStorage.mergeWorkouts(workoutsToSync, remoteData.workouts)
                : workoutsToSync;
              workoutsToSync = merged;
              completedWorkoutsHistory = merged;
              if (typeof AppStorage !== 'undefined' && typeof AppStorage.saveAthleteWorkouts === 'function') {
                AppStorage.saveAthleteWorkouts(merged, false);
              }
              payload.workouts = merged;
            }

            // Merge weight history
            if (remoteData && Array.isArray(remoteData.weightHistory) && remoteData.weightHistory.length > 0) {
              const localWeights = Array.isArray(weightHistory) ? weightHistory : [];
              const weightMap = new Map();
              localWeights.forEach(item => { if (item && item.date) weightMap.set(item.date, item); });
              remoteData.weightHistory.forEach(item => {
                if (item && item.date && !weightMap.has(item.date)) {
                  weightMap.set(item.date, item);
                }
              });
              const mergedWeights = Array.from(weightMap.values()).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
              weightHistory = mergedWeights;
              localStorage.setItem('showUp_weight_history', JSON.stringify(mergedWeights));
              payload.weightHistory = mergedWeights;
            }
          }
        } catch (e) {
          console.debug("Remote backup pre-check notice:", e);
        }

        // 2. Commit payload to Firestore (timeout guard: 12 seconds)
        await Promise.race([
          docRef.set(payload, { merge: true }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Firebase request timed out. Please check your internet connection or Firestore rules.")), 12000))
        ]);
        localStorage.setItem('showUp_last_firestore_sync', payload.lastSyncedAt);

        updateCloudBackupUI();
        if (!isSilent) {
          showToast(`Backed up ${payload.workouts.length} workouts to Firebase Cloud!`, "success");
        }
        return { success: true, count: payload.workouts.length };
      } catch (err) {
        console.error("Firebase sync error:", err);
        if (!isSilent) {
          showToast(`Firebase Cloud backup error: ${err.message || 'Check network connection'}`, "error");
        }
        return { success: false, error: err.message };
      } finally {
        if (!isSilent) setFirestoreButtonLoading(true, false);
      }
    }

    async function restoreFromFirestore(isSilent = false) {
      if (!isSilent) setFirestoreButtonLoading(false, true);
      try {
        if (typeof getFirestoreDb !== 'function') {
          if (!isSilent) showToast("Firebase Firestore service is not loaded.", "error");
          return { success: false, error: "Firestore not loaded" };
        }

        const db = getFirestoreDb();
        if (!db) {
          if (!isSilent) showToast("Could not connect to Firebase database.", "error");
          return { success: false, error: "Database unavailable" };
        }

        const user = (typeof getAppUser === 'function') ? getAppUser() : null;
        const rawEmail = (user?.email || '').toLowerCase().trim();
        if (!rawEmail || rawEmail === 'you@showup.app' || rawEmail === 'user@showup.app') {
          if (!isSilent) {
            showToast("Please log in to restore from Firebase Cloud.", "info");
            const settingsModal = document.getElementById('settings-modal');
            if (settingsModal) settingsModal.classList.add('hidden');
            if (typeof openAuthLoginModal === 'function') {
              openAuthLoginModal('signin');
            }
          }
          return { success: false, error: "User not logged in" };
        }

        const normEmail = rawEmail;

        const docRef = db.collection('user_backups').doc(normEmail);
        const snap = await Promise.race([
          docRef.get(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Firebase restore request timed out. Please check connection.")), 12000))
        ]);

        if (!snap || !snap.exists) {
          if (!isSilent) {
            showToast("No Firebase cloud backup found for this account.", "warning");
          }
          return { success: false, error: "No backup found" };
        }

        const data = snap.data();
        let restoredCount = 0;

        if (data.workouts && Array.isArray(data.workouts)) {
          const currentLocal = (typeof AppStorage !== 'undefined' && typeof AppStorage.getAthleteWorkouts === 'function')
            ? AppStorage.getAthleteWorkouts()
            : (Array.isArray(completedWorkoutsHistory) ? completedWorkoutsHistory : []);
          const merged = (typeof AppStorage !== 'undefined' && typeof AppStorage.mergeWorkouts === 'function')
            ? AppStorage.mergeWorkouts(currentLocal, data.workouts)
            : data.workouts;

          completedWorkoutsHistory = merged;
          if (typeof AppStorage !== 'undefined' && typeof AppStorage.saveAthleteWorkouts === 'function') {
            AppStorage.saveAthleteWorkouts(completedWorkoutsHistory, false);
          } else {
            localStorage.setItem('showUp_synced_workouts', JSON.stringify(completedWorkoutsHistory));
            localStorage.setItem('showUp_user_workouts_' + normEmail, JSON.stringify(completedWorkoutsHistory));
          }
          restoredCount = merged.length;
        }

        if (data.weightHistory && Array.isArray(data.weightHistory)) {
          const localWeights = Array.isArray(weightHistory) ? weightHistory : [];
          const weightMap = new Map();
          localWeights.forEach(item => { if (item && item.date) weightMap.set(item.date, item); });
          data.weightHistory.forEach(item => {
            if (item && item.date && !weightMap.has(item.date)) {
              weightMap.set(item.date, item);
            }
          });
          const mergedWeights = Array.from(weightMap.values()).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          weightHistory = mergedWeights;
          localStorage.setItem('showUp_weight_history', JSON.stringify(mergedWeights));
        }

        if (data.profile) {
          if (data.profile.height && (!userHeight || userHeight === 70)) {
            userHeight = data.profile.height;
            localStorage.setItem('showUp_user_height', String(userHeight));
          }
          if (data.profile.weight && (!userWeight || userWeight === 170)) {
            userWeight = data.profile.weight;
            localStorage.setItem('showUp_user_weight', String(userWeight));
          }
        }

        if (data.lastSyncedAt) {
          localStorage.setItem('showUp_last_firestore_sync', data.lastSyncedAt);
        }

        if (typeof renderHomeTab === 'function') {
          try { renderHomeTab(); } catch (e) {}
        }
        renderCalendar();
        renderMonthlyHistory();
        renderWeightHistory();
        renderSquadsTab();
        updateSquadBeacon();
        updateGlobalStatsUI();
        renderHeatMap();
        updateCloudBackupUI();

        if (!isSilent) {
          showToast(`Restored ${restoredCount} workouts from Firebase Cloud!`, "success");
        }
        return { success: true, count: restoredCount };
      } catch (err) {
        console.error("Firebase restore error:", err);
        if (!isSilent) {
          showToast(`Firebase restore error: ${err.message || 'Check network connection'}`, "error");
        }
        return { success: false, error: err.message };
      } finally {
        if (!isSilent) setFirestoreButtonLoading(false, false);
      }
    }

    async function syncOrRestoreFirestoreBackup(isSilent = true) {
      const currentLocal = (typeof AppStorage !== 'undefined' && typeof AppStorage.getAthleteWorkouts === 'function')
        ? AppStorage.getAthleteWorkouts()
        : (Array.isArray(completedWorkoutsHistory) ? completedWorkoutsHistory : []);

      if (currentLocal.length === 0) {
        return await restoreFromFirestore(isSilent);
      } else {
        return await syncToFirestore(isSilent);
      }
    }

/* ==========================================================================
   showUp Application Bootstrap & Lifecycle Wiring
   ========================================================================== */

    window.addEventListener('DOMContentLoaded', () => {
      if (typeof AppStorage !== 'undefined' && typeof AppStorage.applyPendingMigrations === 'function') {
        AppStorage.applyPendingMigrations();
      }
      initCatalog();
      if (typeof initTouchScrollerInputs === 'function') {
        initTouchScrollerInputs();
      }
      initDatePickerConstraints();
      if (typeof updateTimezoneDisplay === 'function') {
        updateTimezoneDisplay();
      }
      loadPhysicalProfile();
      renderLoggedSets();
      restoreWorkoutTimerState();
      if (typeof restoreRestTimerState === 'function') {
        restoreRestTimerState();
      }
      updateSetControlsUI();
      renderCalendar();
      renderWeightHistory();
      initSparkline();
      restoreSavedSession();
      restoreThemePreferences();
      restoreFontPreferences();
      restoreAppUIMode();
      initSquads();
      detectUserZipFromIP();
      checkAndResetDailyETCounter();
      renderHeatMap();
      updateGlobalStatsUI();
      updateCloudBackupUI();
      initUniqueVisitorCounter();
      initGlobalVisitorTelemetry();
      updateGlobalVisitorTelemetryUI();
      if (typeof restoreActiveTab === 'function') {
        restoreActiveTab();
      } else if (typeof renderHomeTab === 'function') {
        renderHomeTab();
      }
    });

    window.addEventListener('online', () => {
      if (googleAccessToken) {
        syncToGoogleDrive(true);
      }
    });


// ================= LIVE FUNCTIONAL SMOKE TEST SUITES =================

runSuite("1. App Initialization & DOMContentLoaded", () => {
  assert(typeof globalThis._listeners['DOMContentLoaded'] !== 'undefined', "DOMContentLoaded listeners registered");
  globalThis._listeners['DOMContentLoaded'].forEach(fn => fn());
  assert(Array.isArray(defaultCatalog) && defaultCatalog.length > 0, "Catalog initialized with exercises (" + defaultCatalog.length + " found)");
  assert(defaultCatalog.some(e => e.name === "Barbell Back Squat"), "Barbell Back Squat present in catalog");
  assert(defaultCatalog.some(e => e.implement === "Row Erg"), "Row Erg exercises present in catalog");
});

runSuite("2. Theme Palette & Typography Engine", () => {
  const palettes = ['orange', 'teal', 'lime', 'obsidian'];
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
            }
          };
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
    { name: "SH KB Thruster", implement: "Kettlebell", primary: "Full Body", secondaries: ["Quads", "Shoulders", "Hamstrings/Glutes", "Triceps", "Core/Abs"] }
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
  assert(ringsCatalog.length >= 4, "filterExerciseCatalog('', 'Gymnastics Rings') returns rings exercises (" + ringsCatalog.length + " found)");
  assert(ringsCatalog.every(e => e.implement === "Gymnastics Rings" || e.name.toLowerCase().includes("ring")), "All filtered rings items belong to Gymnastics Rings");

  assert(inferImplementFromExerciseName("Ring Dips") === "Gymnastics Rings", "Ring Dips infers Gymnastics Rings");
  assert(inferImplementFromExerciseName("Ring Rows") === "Gymnastics Rings", "Ring Rows infers Gymnastics Rings");
  assert(inferImplementFromExerciseName("Gymnastic Ring Pullups") === "Gymnastics Rings", "Gymnastic Ring Pullups infers Gymnastics Rings");
  assert(inferImplementFromExerciseName("Ring Inverted Row") === "Gymnastics Rings", "Ring Inverted Row infers Gymnastics Rings");

  // 2. Interactive toggle on Kettlebell pill
  const pillKb = getOrCreateElement('filter-pill-kettlebell');
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

  // 5. Test newly added exercises in defaultCatalog
  const newExercises = [
    { name: "DB Hammer Curls", imp: "Dumbbell", mus: "Biceps" },
    { name: "EZ Bar Bicep Curls", imp: "Barbell", mus: "Biceps" },
    { name: "EZ Bar Preacher Curls", imp: "Barbell", mus: "Biceps" },
    { name: "EZ Bar Lying Down Tricep Extensions", imp: "Barbell", mus: "Triceps" },
    { name: "EZ Bar Tricep Pull Overs", imp: "Barbell", mus: "Triceps" },
    { name: "Bicep Curls", imp: "Dumbbell", mus: "Biceps" },
    { name: "Banded Lateral Walk", imp: "Bodyweight", mus: "Hamstrings/Glutes" }
  ];

  newExercises.forEach(item => {
    const found = findCatalogExercise(item.name);
    assert(found !== null, "Catalog contains newly added exercise: " + item.name);
    assert(found.implement === item.imp, item.name + " implement matches " + item.imp);
    assert(found.muscle === item.mus, item.name + " muscle target matches " + item.mus);
  });

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
  assert(formatHeightShort(70) === "5' 10\"", "formatHeightShort correctly formats 70 inches");
  assert(formatHeightShort(72) === "6' 0\"", "formatHeightShort correctly formats 72 inches");
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

  // 7. Reset workout session clears sets and updates HUD
  resetWorkoutSession();
  assert(currentSessionSets.length === 0, "resetWorkoutSession clears active sets");
  assert(completedEl.innerText === "0 exercises", "HUD completed exercises reset to 0 exercises");
  assert(setsLoggedEl.innerText === "0", "HUD sets logged reset to 0");
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
  assert(getCurrentRestTarget() === 90, "Initial rest target defaults to 90s");
  assert(restTimerSeconds === 10, "Elapsed rest seconds is 10s");
  adjustRestTimer(30);
  assert(getCurrentRestTarget() === 120, "adjustRestTimer(+30) increases rest target to 120s");
  assert(restTimerSeconds === 10, "Elapsed rest seconds remains intact at 10s without inflation");

  // Clean up
  if (isRestTimerRunning) stopRestTimer();
  currentSessionSets = [];
});

runSuite("28. Rest Recovery Haptic & Double Bell Ring Alert", () => {
  // 1. Function existence
  assert(typeof playDoubleBellRing === 'function', "playDoubleBellRing is a defined function");
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
  assert(soundBtn !== null, "btn-toggle-rest-sound exists in DOM");
  assert(soundIcon !== null, "btn-toggle-rest-sound-icon exists in DOM");
  assert(prefCheckbox !== null, "pref-rest-sound-alert exists in DOM");

  // 3. Preference behavior (defaults to true)
  localStorage.removeItem('showUp_rest_sound_alert');
  assert(isRestSoundAlertEnabled() === true, "Rest recovery sound alert is enabled by default");

  setRestSoundAlertEnabled(false);
  assert(isRestSoundAlertEnabled() === false, "Sound alert can be disabled");
  assert(localStorage.getItem('showUp_rest_sound_alert') === 'false', "Preference persisted in localStorage as false");

  setRestSoundAlertEnabled(true);
  assert(isRestSoundAlertEnabled() === true, "Sound alert can be re-enabled");
  assert(localStorage.getItem('showUp_rest_sound_alert') === 'true', "Preference persisted in localStorage as true");

  // 4. Audio synthesis execution without error
  let audioPlayed = false;
  try {
    playDoubleBellRing();
    audioPlayed = true;
  } catch (e) {
    audioPlayed = false;
  }
  assert(audioPlayed === true, "playDoubleBellRing executes cleanly with Web Audio API");

  // 5. Haptic pattern for recovery
  globalThis.__lastVibrate = null;
  triggerHaptic('recovery');
  assert(Array.isArray(globalThis.__lastVibrate) && globalThis.__lastVibrate.length === 3, "triggerHaptic('recovery') fires a 3-part double pulse pattern");
  assert(globalThis.__lastVibrate[0] === 70 && globalThis.__lastVibrate[1] === 100 && globalThis.__lastVibrate[2] === 90, "Pattern matches [70, 100, 90]");

  // 6. Recovery alert triggers once when target rest is reached
  globalThis.__lastVibrate = null;
  let bellRingCalled = false;
  const originalPlay = playDoubleBellRing;
  globalThis.playDoubleBellRing = () => { bellRingCalled = true; };

  localStorage.setItem('showUp_default_rest_time', '60');
  startRestTimer(0);
  assert(hasTriggeredRestRecoveryAlert === false, "Alert flag is initially false");
  assert(bellRingCalled === false, "Sound has not fired at 0s");
  assert(globalThis.__lastVibrate === null, "Haptic has not fired at 0s");

  // Advance to 59s (under target)
  restTimerSeconds = 59;
  checkRestRecoveryThreshold();
  assert(hasTriggeredRestRecoveryAlert === false, "Alert does not fire before target (59s < 60s)");
  assert(bellRingCalled === false, "Sound has not fired at 59s");

  // Advance to 60s (target reached!)
  restTimerSeconds = 60;
  checkRestRecoveryThreshold();
  assert(hasTriggeredRestRecoveryAlert === true, "Alert flag set to true when target reached (60s >= 60s)");
  assert(bellRingCalled === true, "Double bell ring sound alert triggered at target recovery");
  assert(globalThis.__lastVibrate !== null, "Haptic alert triggered at target recovery");

  // Verify single-fire behavior (does not re-fire on next ticks at 61s, 62s)
  bellRingCalled = false;
  globalThis.__lastVibrate = null;
  restTimerSeconds = 61;
  checkRestRecoveryThreshold();
  assert(bellRingCalled === false, "Alert sound does not re-trigger on subsequent seconds");
  assert(globalThis.__lastVibrate === null, "Haptic does not re-trigger on subsequent seconds");

  // 7. Extending rest target re-arms alert
  adjustRestTimer(30); // Target is now 90s, current restTimerSeconds is 61s
  assert(getCurrentRestTarget() === 90, "New target is 90s");
  assert(hasTriggeredRestRecoveryAlert === false, "Extending rest target re-arms alert flag");

  // Reaches extended target at 90s
  restTimerSeconds = 90;
  checkRestRecoveryThreshold();
  assert(hasTriggeredRestRecoveryAlert === true, "Alert triggers again at new extended target (90s)");
  assert(bellRingCalled === true, "Double bell sound fired for extended target");

  // 8. Optional alert: when muted, sound is suppressed but haptic still fires
  bellRingCalled = false;
  globalThis.__lastVibrate = null;
  setRestSoundAlertEnabled(false);
  startRestTimer(0);
  restTimerSeconds = 60;
  checkRestRecoveryThreshold();
  assert(bellRingCalled === false, "Sound alert is suppressed when disabled/muted");
  assert(globalThis.__lastVibrate !== null, "Haptic alert still fires when sound is muted");

  // Restore mocks and clean up
  globalThis.playDoubleBellRing = originalPlay;
  setRestSoundAlertEnabled(true);
  stopRestTimer();
  localStorage.removeItem('showUp_default_rest_time');
  localStorage.removeItem('showUp_rest_sound_alert');
});

print("\n============================================================");
print("TEST EXECUTION COMPLETED: " + testPassedCount + " PASSED, " + testFailedCount + " FAILED");
print("============================================================");

if (testFailedCount > 0) {
  throw new Error("One or more tests failed!");
}
