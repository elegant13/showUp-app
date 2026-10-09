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
      document.getElementById('user-height-input').value = userHeight;
      document.getElementById('user-weight-input').value = userWeight;
    }

    function savePhysicalProfile() {
      const h = parseFloat(document.getElementById('user-height-input').value) || userHeight;
      const w = parseFloat(document.getElementById('user-weight-input').value) || userWeight;

      userHeight = h;
      userWeight = w;

      localStorage.setItem('showUp_user_height', userHeight);
      localStorage.setItem('showUp_user_weight', userWeight);

      const latestEntry = weightHistory[0];
      const todayISO = new Date().toISOString().slice(0, 10);

      if (!latestEntry || latestEntry.weight !== userWeight || latestEntry.date !== todayISO) {
        weightHistory.unshift({ date: todayISO, weight: userWeight });
        localStorage.setItem('showUp_weight_history', JSON.stringify(weightHistory));
        renderWeightHistory();
      }
    }

    // ================= HISTORICAL WEIGHT LOGGING & INTUITIVE DATE PICKER =================


    function initCatalog() {
      const datalist = document.getElementById('exercise-catalog-list');
      datalist.innerHTML = '';
      defaultCatalog.forEach(ex => {
        const option = document.createElement('option');
        option.value = ex.name;
        datalist.appendChild(option);
      });
    }



    function handleExerciseInput(val) {
      const match = defaultCatalog.find(c => c.name.toLowerCase() === val.toLowerCase());
      if (match) {
        document.getElementById('implement-select').value = match.implement;
        document.getElementById('muscle-group-select').value = match.muscle;
        handleImplementChange(match.implement);
      } else {
        const lower = val.toLowerCase();
        if (lower.includes('swim')) handleImplementChange("Swimming");
        else if (lower.includes('walk')) handleImplementChange("Walking");
        else if (lower.includes('hike')) handleImplementChange("Hiking");
        else if (lower.includes('bike') || lower.includes('cycle')) handleImplementChange("Biking");
        else if (lower.includes('row') || lower.includes('erg')) handleImplementChange("Row Erg");
      }
    }

    function handleImplementChange(implementVal) {
      const standardPanel = document.getElementById('standard-metrics-panel');
      const ergPanel = document.getElementById('erg-metrics-panel');
      const swimPanel = document.getElementById('swim-metrics-panel');
      const endurancePanel = document.getElementById('endurance-metrics-panel');

      standardPanel.classList.add('hidden');
      ergPanel.classList.add('hidden');
      swimPanel.classList.add('hidden');
      endurancePanel.classList.add('hidden');

      if (implementVal === "Row Erg") {
        ergPanel.classList.remove('hidden');
      } else if (implementVal === "Swimming") {
        swimPanel.classList.remove('hidden');
      } else if (["Walking", "Hiking", "Biking"].includes(implementVal)) {
        document.getElementById('endurance-dist-label').innerText = `Distance (${implementVal} Miles)`;
        endurancePanel.classList.remove('hidden');
      } else {
        standardPanel.classList.remove('hidden');
      }
    }

    function adjustWeight(delta) {
      const input = document.getElementById('input-weight');
      let val = parseFloat(input.value) || 0;
      val = Math.max(0, val + delta);
      input.value = val;
    }

    function adjustReps(delta) {
      const input = document.getElementById('input-reps');
      let val = parseInt(input.value) || 0;
      val = Math.max(1, val + delta);
      input.value = val;
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

    function logSet() {
      const exerciseName = document.getElementById('exercise-name-input').value.trim() || "Custom Exercise";
      const implement = document.getElementById('implement-select').value;
      const muscle = document.getElementById('muscle-group-select').value;
      const rpe = parseFloat(document.getElementById('rpe-select').value) || 8;

      let weight = 0, reps = 1, ergDistance = 0, ergTime = "";
      let swimDistance = 0, swimTime = "";
      let enduranceDistance = 0, enduranceTime = "";

      if (implement === "Row Erg") {
        ergDistance = parseInt(document.getElementById('input-erg-distance').value) || 500;
        ergTime = document.getElementById('input-erg-time').value || "02:00";
      } else if (implement === "Swimming") {
        swimDistance = parseInt(document.getElementById('input-swim-distance').value) || 500;
        swimTime = document.getElementById('input-swim-time').value || "10:00";
      } else if (["Walking", "Hiking", "Biking"].includes(implement)) {
        enduranceDistance = parseFloat(document.getElementById('input-endurance-distance').value) || 1.0;
        enduranceTime = document.getElementById('input-endurance-time').value || "00:30:00";
      } else {
        weight = parseFloat(document.getElementById('input-weight').value) || 0;
        reps = parseInt(document.getElementById('input-reps').value) || 1;
      }

      const catalogMatch = defaultCatalog.find(c => c.name.toLowerCase() === exerciseName.toLowerCase());
      const secondaryMuscles = catalogMatch && catalogMatch.secondary ? catalogMatch.secondary : [];

      const setObj = {
        id: Date.now(),
        exerciseName,
        implement,
        muscle,
        secondaryMuscles,
        rpe,
        weight,
        reps,
        ergDistance,
        ergTime,
        swimDistance,
        swimTime,
        enduranceDistance,
        enduranceTime,
        hr: currentHR
      };

      currentSessionSets.push(setObj);
      localStorage.setItem('showUp_active_workout_sets', JSON.stringify(currentSessionSets));
      renderLoggedSets();
      broadcastUserWorkoutStarted(exerciseName);

      if (googleAccessToken) {
        syncToGoogleDrive();
      }
    }



    function renderLoggedSets() {
      const container = document.getElementById('logged-sets-list');
      document.getElementById('set-count-badge').innerText = `${currentSessionSets.length} Sets`;

      if (currentSessionSets.length === 0) {
        container.innerHTML = `<div class="text-center py-8 text-slate-600 text-xs italic">No sets logged for this session yet. Pick an exercise above and hit "Log Set".</div>`;
        return;
      }

      container.innerHTML = currentSessionSets.map((s) => `
        <div class="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div class="text-sm font-bold text-slate-200">${s.exerciseName}</div>
            <div class="text-xs text-slate-400 gap-2 flex items-center mt-0.5">
              <span class="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded-lg">${s.implement}</span>
              ${s.implement === "Row Erg" ? `<span>${s.ergDistance}m | ${s.ergTime}</span>` :
                s.implement === "Swimming" ? `<span>${s.swimDistance} yds | ${s.swimTime}</span>` :
                ["Walking", "Hiking", "Biking"].includes(s.implement) ? `<span>${s.enduranceDistance} mi | ${s.enduranceTime}</span>` :
                `<span>${s.weight} lbs × ${s.reps} reps</span>`}
              <span class="text-slate-500">RPE ${s.rpe}</span>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button onclick="triggerHaptic('light'); deleteSet(${s.id})" class="text-slate-600 hover:text-rose-400 p-2 transition">
              <i class="fa-solid fa-trash-can text-sm"></i>
            </button>
          </div>
        </div>
      `).join('');
    }

    function deleteSet(id) {
      currentSessionSets = currentSessionSets.filter(s => s.id !== id);
      localStorage.setItem('showUp_active_workout_sets', JSON.stringify(currentSessionSets));
      renderLoggedSets();

      if (googleAccessToken) {
        syncToGoogleDrive();
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
        if (s.implement === "Row Erg") {
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

      const aerobicTE = Math.min(5.0, (totalSets * 0.25) + (avgRPE > 7 ? 0.8 : 0.4)).toFixed(1);
      const anaerobicTE = Math.min(5.0, (currentSessionSets.filter(s => s.rpe >= 9).length * 0.7) + (totalVolume > 2000 ? 1.2 : 0.5)).toFixed(1);

      // Calorie Calculation Formula: METs x 3.5 x Body Weight (kg) / 200 x Minutes
      const weightKg = userWeight * 0.453592;
      const estimatedMinutes = Math.max(15, Math.round(totalDurationMin));

      let metFactor = 5.0; // Standard moderate MET
      if (currentSessionSets.some(s => s.implement === "Swimming")) metFactor = 8.0;
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

      const muscleMap = {};
      const secondaryMuscleSet = new Set();

      currentSessionSets.forEach(s => {
        const vol = s.implement === "Row Erg" ? s.ergDistance :
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

      const targetDate = selectedWorkoutDate || new Date().toISOString().slice(0, 10);
      const workoutObj = {
        date: targetDate,
        workoutName,
        notes,
        totalSets,
        totalVolume,
        aerobicTE,
        anaerobicTE,
        caloriesBurned,
        sets: [...currentSessionSets]
      };

      lastEvaluatedSummary = workoutObj;

      const existingIdx = completedWorkoutsHistory.findIndex(item => (typeof item === 'string' ? item : item.date) === targetDate);
      if (existingIdx >= 0) {
        completedWorkoutsHistory[existingIdx] = workoutObj;
      } else {
        completedWorkoutsHistory.push(workoutObj);
      }
      localStorage.setItem('showUp_synced_workouts', JSON.stringify(completedWorkoutsHistory));

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
      document.getElementById('workout-summary-card').scrollIntoView({ behavior: 'smooth' });

      currentSessionSets = [];
      localStorage.removeItem('showUp_active_workout_sets');
      broadcastUserWorkoutEnded();
      incrementGlobalWorkoutCounter();

      renderLoggedSets();
      renderCalendar();
      renderMonthlyHistory();

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
                 `${cals}`;

      if (w.aerobicTE && w.anaerobicTE) {
        text += `🫁 *Aerobic Load:* ${w.aerobicTE} / 5.0\n` +
                `⚡ *Anaerobic Load:* ${w.anaerobicTE} / 5.0\n`;
      }

      text += `\n_Compound your progress with showUp_`;

      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
