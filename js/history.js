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
                      ${s.implement === "Row Erg" ? `<span>${s.ergDistance}m | ${s.ergTime}</span>` :
                        s.implement === "Swimming" ? `<span>${s.swimDistance} yds | ${s.swimTime}</span>` :
                        ["Walking", "Hiking", "Biking"].includes(s.implement) ? `<span>${s.enduranceDistance} mi | ${s.enduranceTime}</span>` :
                        `<span><b class="text-slate-100">${s.weight}</b> lbs × <b class="text-slate-100">${s.reps}</b> reps</span>`}
                      <span class="text-slate-500">RPE ${s.rpe}</span>
                      ${s.setDuration ? `<span class="text-slate-400"><i class="fa-regular fa-clock mr-1 text-slate-500"></i>${typeof formatDurationSecs === 'function' ? formatDurationSecs(s.setDuration) : (s.setDuration + 's')}</span>` : ''}
                      ${s.restPeriod ? `<span class="text-emerald-400/80"><i class="fa-solid fa-hourglass-half mr-1 text-emerald-500"></i>Rest: ${typeof formatDurationSecs === 'function' ? formatDurationSecs(s.restPeriod) : (s.restPeriod + 's')}</span>` : ''}
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

      const todayET = typeof getETDateKey === 'function' ? getETDateKey() : new Date().toISOString().slice(0, 10);
      const todayLocal = new Date().toISOString().slice(0, 10);

      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      const yestISO = yest.toISOString().slice(0, 10);

      const mostRecent = dates[0];
      if (mostRecent !== todayET && mostRecent !== todayLocal && mostRecent !== yestISO) {
        return 0;
      }

      let streak = 0;
      let checkDate = new Date(mostRecent);
      for (let i = 0; i < dates.length; i++) {
        const expected = checkDate.toISOString().slice(0, 10);
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
      const todayKey = typeof getETDateKey === 'function' ? getETDateKey() : new Date().toISOString().slice(0, 10);
      const todayLocal = new Date().toISOString().slice(0, 10);

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
      const todayKey = typeof getETDateKey === 'function' ? getETDateKey() : new Date().toISOString().slice(0, 10);
      const todayLocal = new Date().toISOString().slice(0, 10);

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

      // 1. Render Today's Status Card (Requirement 2)
      const todayCard = document.getElementById('home-today-status-card');
      if (todayCard) {
        if (dailyStatus.completed) {
          todayCard.className = "hero-victory-card rounded-3xl p-5 border border-emerald-500/40 shadow-2xl space-y-4 transition-all";
          const safeKicker = (typeof escapeHtml === 'function') ? escapeHtml(dailyStatus.kicker) : dailyStatus.kicker;
          const safeHeadline = (typeof escapeHtml === 'function') ? escapeHtml(dailyStatus.headline) : dailyStatus.headline;
          const safeSubtext = (typeof escapeHtml === 'function') ? escapeHtml(dailyStatus.subtext) : dailyStatus.subtext;
          const safeWorkoutName = (typeof escapeHtml === 'function') ? escapeHtml(dailyStatus.workoutName) : dailyStatus.workoutName;

          todayCard.innerHTML = `
            <div class="flex items-start justify-between gap-3 border-b border-emerald-500/20 pb-3">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20 shrink-0">
                  <i class="fa-solid fa-trophy"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                      <i class="fa-solid fa-circle-check text-emerald-400"></i> ${safeKicker}
                    </span>
                    <span class="text-[10px] font-mono font-bold text-slate-400">Today</span>
                  </div>
                  <h3 class="text-base sm:text-lg font-black text-slate-100 mt-1">
                    ${safeHeadline}
                  </h3>
                </div>
              </div>
            </div>

            <p class="text-xs text-slate-300 leading-relaxed italic bg-slate-950/70 p-3 rounded-2xl border border-emerald-500/20">
              "${safeSubtext}"
            </p>

            <div class="bg-slate-950/90 rounded-2xl p-3 border border-slate-800/80 flex items-center justify-between gap-3 flex-wrap">
              <div class="flex items-center gap-2">
                <span class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs">
                  <i class="fa-solid fa-dumbbell"></i>
                </span>
                <div>
                  <div class="text-xs font-bold text-slate-100">${safeWorkoutName}</div>
                  <div class="text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                    <span>${dailyStatus.setsCount} sets logged</span>
                    ${dailyStatus.vol ? `<span>• ${dailyStatus.vol}</span>` : ''}
                    ${dailyStatus.timeStr ? `<span>• ${dailyStatus.timeStr}</span>` : ''}
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" onclick="triggerHaptic('light'); switchTab('workout')" class="text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-xl transition flex items-center gap-1">
                  <span>Log More</span>
                  <i class="fa-solid fa-arrow-right text-[10px]"></i>
                </button>
              </div>
            </div>
          `;
        } else {
          todayCard.className = "m3-card rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3.5 bg-gradient-to-br from-slate-900/90 to-slate-950";
          const safeKicker = (typeof escapeHtml === 'function') ? escapeHtml(dailyStatus.kicker) : dailyStatus.kicker;
          const safeHeadline = (typeof escapeHtml === 'function') ? escapeHtml(dailyStatus.headline) : dailyStatus.headline;
          const safeMessage = (typeof escapeHtml === 'function') ? escapeHtml(dailyStatus.message) : dailyStatus.message;

          todayCard.innerHTML = `
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center text-lg shrink-0">
                  <i class="fa-regular fa-clock"></i>
                </div>
                <div>
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    ${safeKicker}
                  </span>
                  <h3 class="text-sm sm:text-base font-bold text-slate-100 mt-1">
                    ${safeHeadline}
                  </h3>
                </div>
              </div>
            </div>

            <p class="text-xs text-slate-400 leading-relaxed">
              ${safeMessage}
            </p>

            <button type="button" onclick="triggerHaptic('medium'); switchTab('workout')" class="w-full py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition">
              <i class="fa-solid fa-play text-xs"></i>
              <span>Start Today's Workout</span>
            </button>
          `;
        }
      }

      // 2. Render Weekly Range & Count Badge
      const rangeLabelEl = document.getElementById('home-week-range-label');
      if (rangeLabelEl) rangeLabelEl.innerText = weekStats.rangeLabel;
      const weekCountBadgeEl = document.getElementById('home-week-count-badge');
      if (weekCountBadgeEl) weekCountBadgeEl.innerText = `${weekStats.daysCount} / 7 Days`;

      // 3. Render 7-day visual pills (Monday to Sunday)
      const pillsContainer = document.getElementById('home-week-pills-container');
      if (pillsContainer) {
        pillsContainer.innerHTML = weekStats.days.map(d => {
          if (d.hasWorkout) {
            return `
              <div class="flex flex-col items-center justify-center py-2 px-1 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm ${d.isToday ? 'ring-2 ring-emerald-400 shadow-emerald-500/20' : ''}" title="${d.dayNameShort}: Workout Complete!">
                <span class="text-[10px] font-bold uppercase text-emerald-400">${d.dayInitial}</span>
                <span class="text-xs font-black font-mono my-0.5">${d.dayNumber}</span>
                <i class="fa-solid fa-circle-check text-emerald-400 text-[11px] mt-0.5"></i>
              </div>
            `;
          } else if (d.isToday) {
            return `
              <div class="flex flex-col items-center justify-center py-2 px-1 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200 ring-2 ring-emerald-400/80 shadow-md" title="${d.dayNameShort}: Today">
                <span class="text-[10px] font-bold uppercase text-emerald-400">${d.dayInitial}</span>
                <span class="text-xs font-black font-mono my-0.5">${d.dayNumber}</span>
                <span class="text-[9px] font-semibold text-slate-400">Today</span>
              </div>
            `;
          } else {
            return `
              <div class="flex flex-col items-center justify-center py-2 px-1 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-slate-500" title="${d.dayNameShort}: Rest or upcoming">
                <span class="text-[10px] font-bold uppercase">${d.dayInitial}</span>
                <span class="text-xs font-bold font-mono my-0.5 text-slate-400">${d.dayNumber}</span>
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
          const todayKey = typeof getETDateKey === 'function' ? getETDateKey() : new Date().toISOString().slice(0, 10);
          let teammatesCompletedToday = 0;
          let teammatesLiftingNow = 0;
          squads.forEach(sq => {
            (sq.members || []).forEach(m => {
              if (m.id !== user.id && m.email !== user.email) {
                if (m.isWorkingOut) teammatesLiftingNow++;
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

