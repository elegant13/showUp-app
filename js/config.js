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
