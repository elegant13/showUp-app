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

  // Workout Data & Analytics
  ACTIVE_SETS: 'showUp_active_workout_sets',
  SYNCED_WORKOUTS: 'showUp_synced_workouts',
  WEIGHT_HISTORY: 'showUp_weight_history',

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

  // Global Telemetry & Visitor Tracking
  GLOBAL_COUNTER_COUNT: 'showUp_global_counter_count',
  GLOBAL_COUNTER_ET_DATE: 'showUp_global_counter_et_date',
  GLOBAL_VISITORS_LOG: 'showUp_global_visitors_log_v1',
  VISITOR_ID: 'showUp_unique_visitor_id',
  VISITOR_COUNT: 'showUp_unique_visitor_count',
  VISITOR_FIRST_SEEN: 'showUp_visitor_first_seen',
  VISITOR_COUNTED: 'showUp_unique_counted_v4',

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
