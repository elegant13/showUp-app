/* ==========================================================================
   showUp History & Calendar Engine: Monthly Grids & "Showed Up" Rules
   ========================================================================== */

    function initDatePickerConstraints() {
      const todayISO = new Date().toISOString().slice(0, 10);
      const dateInput = document.getElementById('workout-date-picker');
      dateInput.max = todayISO;
      dateInput.value = todayISO;
      selectedWorkoutDate = todayISO;
    }

    function handleDateChange(val) {
      const todayISO = new Date().toISOString().slice(0, 10);
      if (val > todayISO) {
        alert("Future dates beyond current day are not allowed.");
        document.getElementById('workout-date-picker').value = todayISO;
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
      const todayISO = new Date().toISOString().slice(0, 10);
      document.getElementById('workout-date-picker').value = todayISO;
      selectedWorkoutDate = todayISO;
      document.getElementById('historical-mode-banner').classList.add('hidden');
    }



    function renderCalendar() {
      const grid = document.getElementById('calendar-grid');
      const monthYearLabel = document.getElementById('calendar-month-year-label');
      grid.innerHTML = '';

      const year = calendarDate.getFullYear();
      const month = calendarDate.getMonth();

      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      monthYearLabel.innerText = `${monthNames[month]} ${year}`;

      const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
      dayNames.forEach(d => {
        grid.innerHTML += `<div class="text-slate-500 font-bold py-1">${d}</div>`;
      });

      const firstDay = new Date(year, month, 1).getDay();
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
          <div class="aspect-square flex items-center justify-center rounded-xl text-xs font-semibold ${isWorkedOut ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20' : 'bg-slate-950 text-slate-600 border border-slate-800/80'}">
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
                <button onclick="triggerHaptic('medium'); shareWorkoutToWhatsApp('${dateStr}')" class="text-slate-500 hover:text-emerald-400 p-2 transition" title="Share via WhatsApp">
                  <i class="fa-brands fa-whatsapp text-sm"></i>
                </button>
                <button onclick="triggerHaptic('light'); deleteHistoricalWorkout('${dateStr}')" class="text-slate-600 hover:text-rose-400 p-2 transition" title="Delete Workout">
                  <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
              </div>
            </div>

            <div id="details-${dateStr}" class="hidden border-t border-slate-800/80 bg-slate-900/40 p-3 space-y-2">
              ${notesStr ? `<div class="text-xs text-slate-300 italic bg-slate-950/80 p-2 rounded-lg border border-slate-800 mb-2">Notes: "${notesStr}"</div>` : ''}
              <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Logged Exercise Sets</div>
              ${setsList.length === 0 ? `
                <div class="text-xs text-slate-500 italic py-1">Basic summary log recorded (no detailed sets).</div>
              ` : setsList.map(s => `
                <div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div class="font-bold text-slate-200">${s.exerciseName}</div>
                    <div class="text-slate-400 gap-2 flex items-center mt-0.5 text-[11px]">
                      <span class="bg-slate-800 text-emerald-400 px-1.5 py-0.2 rounded-lg">${s.implement}</span>
                      ${s.implement === "Row Erg" ? `<span>${s.ergDistance}m | ${s.ergTime}</span>` :
                        s.implement === "Swimming" ? `<span>${s.swimDistance} yds | ${s.swimTime}</span>` :
                        ["Walking", "Hiking", "Biking"].includes(s.implement) ? `<span>${s.enduranceDistance} mi | ${s.enduranceTime}</span>` :
                        `<span><b class="text-slate-100">${s.weight}</b> lbs × <b class="text-slate-100">${s.reps}</b> reps</span>`}
                      <span class="text-slate-500">RPE ${s.rpe}</span>
                    </div>
                  </div>

                  <button onclick="triggerHaptic('medium'); editHistoricalSet('${dateStr}', ${s.id})" class="text-slate-500 hover:text-amber-400 p-1.5 rounded-lg transition" title="Edit Set">
                    <i class="fa-solid fa-pen text-xs"></i>
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

    function editHistoricalSet(dateStr, setId) {
      const workoutIdx = completedWorkoutsHistory.findIndex(w => (typeof w === 'object' && w.date === dateStr));
      if (workoutIdx === -1) return;

      const workout = completedWorkoutsHistory[workoutIdx];
      const setObj = workout.sets.find(s => s.id === setId);
      if (!setObj) return;

      if (setObj.implement === "Row Erg") {
        const newDist = prompt(`Edit Distance (meters) for ${setObj.exerciseName}:`, setObj.ergDistance);
        if (newDist === null) return;
        setObj.ergDistance = parseInt(newDist) || 500;
      } else if (setObj.implement === "Swimming") {
        const newDist = prompt(`Edit Distance (yards) for ${setObj.exerciseName}:`, setObj.swimDistance);
        if (newDist === null) return;
        setObj.swimDistance = parseInt(newDist) || 500;
      } else if (["Walking", "Hiking", "Biking"].includes(setObj.implement)) {
        const newDist = prompt(`Edit Distance (miles) for ${setObj.exerciseName}:`, setObj.enduranceDistance);
        if (newDist === null) return;
        setObj.enduranceDistance = parseFloat(newDist) || 1.0;
      } else {
        const newWeight = prompt(`Edit Weight (lbs) for ${setObj.exerciseName}:`, setObj.weight);
        if (newWeight === null) return;
        const newReps = prompt(`Edit Reps for ${setObj.exerciseName}:`, setObj.reps);
        if (newReps === null) return;

        setObj.weight = parseFloat(newWeight) || 0;
        setObj.reps = parseInt(newReps) || 1;
      }

      if (typeof AppStorage !== 'undefined' && typeof AppStorage.saveAthleteWorkouts === 'function') {
        AppStorage.saveAthleteWorkouts(completedWorkoutsHistory);
      } else {
        localStorage.setItem('showUp_synced_workouts', JSON.stringify(completedWorkoutsHistory));
      }
      renderMonthlyHistory();

      if (googleAccessToken) {
        syncToGoogleDrive();
      }
    }

    function deleteHistoricalWorkout(dateStr) {
      if (!confirm(`Are you sure you want to delete the workout entry for ${dateStr}?`)) return;

      completedWorkoutsHistory = completedWorkoutsHistory.filter(item => (typeof item === 'string' ? item : item.date) !== dateStr);
      if (typeof AppStorage !== 'undefined' && typeof AppStorage.saveAthleteWorkouts === 'function') {
        AppStorage.saveAthleteWorkouts(completedWorkoutsHistory);
      } else {
        localStorage.setItem('showUp_synced_workouts', JSON.stringify(completedWorkoutsHistory));
      }
      renderCalendar();
      renderMonthlyHistory();

      if (googleAccessToken) {
        syncToGoogleDrive();
      }
    }

    function navigateCalendarMonth(delta) {
      calendarDate.setMonth(calendarDate.getMonth() + delta);
      renderCalendar();
      renderMonthlyHistory();
    }
