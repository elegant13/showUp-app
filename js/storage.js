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

