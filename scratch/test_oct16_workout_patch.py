import subprocess

with open('js/storage.js', 'r') as f:
    storage_code = f.read()

test_script = f"""
// Mock localStorage
const store = {{}};
var localStorage = {{
  getItem: function(k) {{ return store[k] !== undefined ? store[k] : null; }},
  setItem: function(k, v) {{ store[k] = String(v); }},
  removeItem: function(k) {{ delete store[k]; }},
  clear: function() {{ Object.keys(store).forEach(function(k) {{ delete store[k]; }}); }}
}};

var window = this;
var document = {{
  getElementById: function() {{ return null; }},
  addEventListener: function() {{}}
}};
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

{storage_code}

// Seed mock existing data with 16th and 17th oct workouts
var initialWorkouts = [
  {{ date: '2026-10-17', workoutName: 'Accidental Oct 17 Workout', totalVolume: 100, sets: [] }},
  {{ date: '2026-10-16', workoutName: 'Old Oct 16 Workout', totalVolume: 200, sets: [] }},
  {{ date: '2026-10-15', workoutName: 'Leg Day Oct 15', totalVolume: 3500, sets: [] }}
];
localStorage.setItem('showUp_synced_workouts', JSON.stringify(initialWorkouts));

// Run migration
AppStorage.applyPendingMigrations();

var updatedWorkouts = AppStorage.getAthleteWorkouts();

console.log("Total workouts after migration:", updatedWorkouts.length);
console.assert(!updatedWorkouts.some(function(w) {{ return w.date === '2026-10-17'; }}), "Oct 17 workout was removed");
console.assert(updatedWorkouts.some(function(w) {{ return w.date === '2026-10-16'; }}), "Oct 16 workout exists");
console.assert(updatedWorkouts.some(function(w) {{ return w.date === '2026-10-15'; }}), "Oct 15 workout retained");

var oct16 = updatedWorkouts.find(function(w) {{ return w.date === '2026-10-16'; }});
console.assert(oct16.sets.length === 12, "Oct 16 has exactly 12 sets");
console.assert(oct16.totalVolume === 6155, "Oct 16 total volume is 6155 lbs");

console.log("Set 1:", oct16.sets[0].exerciseName, oct16.sets[0].reps, "reps");
console.assert(oct16.sets[0].exerciseName === "Jump Rope" && oct16.sets[0].reps === 1000, "Jump rope is 1000 reps");

var squats = oct16.sets.filter(function(s) {{ return s.exerciseName === "Barbell Back Squat"; }});
console.log("Squat sets count:", squats.length);
console.assert(squats.length === 5, "5 Barbell Back Squat sets");
console.assert(squats[0].reps === 15 && squats[0].weight === 65, "Squat 1: 15 reps with 65lb");
console.assert(squats[1].reps === 10 && squats[1].weight === 65, "Squat 2: 10 reps with 65lb");
console.assert(squats[2].reps === 10 && squats[2].weight === 85, "Squat 3: 10 reps with 85lb");
console.assert(squats[3].reps === 10 && squats[3].weight === 95, "Squat 4: 10 reps with 95lb");
console.assert(squats[4].reps === 10 && squats[4].weight === 115, "Squat 5: 10 reps with 115lb");

var rdls = oct16.sets.filter(function(s) {{ return s.exerciseName === "Kickstand KB RDL"; }});
console.log("RDL sets count:", rdls.length);
console.assert(rdls.length === 4, "4 Kickstand KB RDL sets");
console.assert(rdls[0].weight === 35 && rdls[1].weight === 35, "RDL 35lb sets");
console.assert(rdls[2].weight === 44 && rdls[3].weight === 44, "RDL 44lb sets");

var facePulls = oct16.sets.filter(function(s) {{ return s.exerciseName === "Face Pull"; }});
console.log("Face Pull sets count:", facePulls.length);
console.assert(facePulls.length === 2, "2 Face Pull sets");

// Verify tombstone prevents incoming cloud restore from resurrecting Oct 17
var incomingFromCloud = [
  {{ date: '2026-10-17', workoutName: 'Zombie Oct 17 Workout', sets: [] }},
  {{ date: '2026-10-14', workoutName: 'Cloud Past Workout', sets: [] }}
];
var merged = AppStorage.mergeWorkouts(updatedWorkouts, incomingFromCloud);
console.assert(!merged.some(function(w) {{ return w.date === '2026-10-17'; }}), "Tombstone prevented Oct 17 resurrection");
console.assert(merged.some(function(w) {{ return w.date === '2026-10-14'; }}), "Legitimate cloud workout merged");

console.log("ALL PATCH VERIFICATIONS PASSED!");
"""

with open("scratch/test_patch.js", "w") as f:
    f.write(test_script)

res = subprocess.run([
    '/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc',
    'scratch/test_patch.js'
], capture_output=True, text=True)

print(res.stdout)
if res.stderr:
    print("STDERR:", res.stderr)
assert res.returncode == 0, "Test script failed"
