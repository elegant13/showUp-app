/* ==========================================================================
   showUp Application Configuration & Shared State
   ========================================================================== */

    const GOOGLE_CLIENT_ID = "115199141886-1a64f9jbjrg9c09q97pgl01348ou7dvk.apps.googleusercontent.com";
    const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 1 week active session (7 days)

    let currentSessionSets = JSON.parse(localStorage.getItem('showUp_active_workout_sets') || '[]');
    let completedWorkoutsHistory = JSON.parse(localStorage.getItem('showUp_synced_workouts') || '[]');
    let weightHistory = JSON.parse(localStorage.getItem('showUp_weight_history') || '[]');
    
    let userHeight = parseFloat(localStorage.getItem('showUp_user_height')) || 70; // inches
    let userWeight = parseFloat(localStorage.getItem('showUp_user_weight')) || 175; // lbs

    let lastEvaluatedSummary = null;
    let hrHistory = [];
    let currentHR = 0;
    let hrSimInterval = null;
    let calendarDate = new Date();
    let googleAccessToken = localStorage.getItem('showUp_google_token') || null;
    let selectedWorkoutDate = new Date().toISOString().slice(0, 10);

    const defaultCatalog = [
      { name: "Swimming (Laps / Open Water)", implement: "Swimming", muscle: "Full Body", secondary: ["Shoulders", "Back", "Core/Abs", "Quads"] },
      { name: "Walking", implement: "Walking", muscle: "Quads", secondary: ["Hamstrings/Glutes", "Core/Abs"] },
      { name: "Hiking", implement: "Hiking", muscle: "Full Body", secondary: ["Quads", "Hamstrings/Glutes", "Core/Abs"] },
      { name: "Outdoor Biking / Cycling", implement: "Biking", muscle: "Quads", secondary: ["Hamstrings/Glutes", "Core/Abs"] },
      { name: "Stationary Bike Sprint", implement: "Biking", muscle: "Quads", secondary: ["Hamstrings/Glutes", "Core/Abs"] },
      { name: "Sapaate (Indian Burpees)", implement: "Bodyweight", muscle: "Full Body", secondary: ["Chest", "Quads", "Shoulders", "Core/Abs", "Hamstrings/Glutes", "Triceps"] },
      { name: "Rowing (Concept2 / Erg)", implement: "Row Erg", muscle: "Back", secondary: ["Biceps", "Core/Abs", "Hamstrings/Glutes", "Quads"] },
      { name: "Kettlebell Clean & Press", implement: "Kettlebell", muscle: "Full Body", secondary: ["Shoulders", "Back", "Hamstrings/Glutes", "Quads"] },
      { name: "Bethak (Hindu Squats)", implement: "Bodyweight", muscle: "Quads", secondary: ["Hamstrings/Glutes", "Core/Abs"] },
      { name: "Dand (Hindu Push-Ups)", implement: "Bodyweight", muscle: "Chest", secondary: ["Shoulders", "Triceps", "Core/Abs", "Back"] },
      { name: "Gada Swings (Mace 360)", implement: "Macebell / Gada", muscle: "Shoulders", secondary: ["Back", "Core/Abs", "Biceps"] },
      { name: "Barbell Back Squat", implement: "Barbell", muscle: "Quads", secondary: ["Hamstrings/Glutes", "Core/Abs"] },
      { name: "Barbell Deadlift", implement: "Barbell", muscle: "Full Body", secondary: ["Hamstrings/Glutes", "Back", "Core/Abs"] }
    ];


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
