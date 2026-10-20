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
      const todayISO = typeof getLocalDateKey === 'function' ? getLocalDateKey() : new Date().toISOString().slice(0, 10);

      if (!latestEntry || latestEntry.weight !== userWeight || latestEntry.date !== todayISO) {
        weightHistory.unshift({ date: todayISO, weight: userWeight });
        localStorage.setItem('showUp_weight_history', JSON.stringify(weightHistory));
        renderWeightHistory();
      }
    }

    // ================= HISTORICAL WEIGHT LOGGING & INTUITIVE DATE PICKER =================


    function initCatalog() {
      const datalist = document.getElementById('exercise-catalog-list');
      if (!datalist) return;
      datalist.innerHTML = '';
      const addedValues = new Set();

      const addOption = (val) => {
        if (!val || addedValues.has(val)) return;
        const option = document.createElement('option');
        option.value = val;
        datalist.appendChild(option);
        addedValues.add(val);
      };

      defaultCatalog.forEach(ex => {
        addOption(ex.name);

        if (typeof expandExerciseAbbreviations === 'function') {
          const expanded = expandExerciseAbbreviations(ex.name);
          addOption(expanded);
        }

        if (typeof abbreviateExerciseName === 'function') {
          const abbr = abbreviateExerciseName(ex.name);
          addOption(abbr);
        }
      });
    }

    function handleExerciseInput(val) {
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
      updateWorkoutExtraOptionsPreview();
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
          iconEl.className = "fa-solid fa-pause text-amber-400";
          toggleBtn.title = "Pause Session Timer";
          toggleBtn.className = "w-6 h-6 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 flex items-center justify-center text-[10px] transition";
          if (pulseEl) pulseEl.className = "w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block";
        } else if (workoutTimerState === 'paused') {
          iconEl.className = "fa-solid fa-play text-emerald-400";
          toggleBtn.title = "Resume Session Timer";
          toggleBtn.className = "w-6 h-6 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 flex items-center justify-center text-[10px] transition";
          if (pulseEl) pulseEl.className = "w-2 h-2 rounded-full bg-amber-400 inline-block";
        } else {
          iconEl.className = "fa-solid fa-play text-slate-400";
          toggleBtn.title = "Start Session Timer";
          toggleBtn.className = "w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center text-[10px] transition";
          if (pulseEl) pulseEl.className = "w-2 h-2 rounded-full bg-slate-600 inline-block";
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

    function tickActiveSet() {
      if (!activeSetStartTime || !isSetInProgress) return;
      activeSetElapsedSeconds = Math.max(0, Math.floor((Date.now() - activeSetStartTime) / 1000));
      const nextSetNum = currentSessionSets.length + 1;
      const label = document.getElementById('btn-start-set-label');
      if (label) {
        label.innerText = `Set ${nextSetNum} in Progress (${formatDurationSecs(activeSetElapsedSeconds)})`;
      }
    }

    function startRestTimer(initialSeconds = 0) {
      if (restTimerInterval) clearInterval(restTimerInterval);
      isRestTimerRunning = true;
      restTimerSeconds = initialSeconds;
      restTimerStartTime = Date.now() - (initialSeconds * 1000);
      restTimerInterval = setInterval(tickRestTimer, 1000);
      updateRestTimerUI();
      updateSetControlsUI();
    }

    function stopRestTimer() {
      if (restTimerInterval) clearInterval(restTimerInterval);
      restTimerInterval = null;
      isRestTimerRunning = false;
      restTimerStartTime = null;
      restTimerSeconds = 0;
      updateRestTimerUI();
      updateSetControlsUI();
    }

    function tickRestTimer() {
      if (!restTimerStartTime || !isRestTimerRunning) return;
      restTimerSeconds = Math.max(0, Math.floor((Date.now() - restTimerStartTime) / 1000));
      updateRestTimerUI();
    }

    function adjustRestTimer(deltaSecs) {
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      if (isRestTimerRunning && restTimerStartTime) {
        restTimerStartTime -= (deltaSecs * 1000);
        tickRestTimer();
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

    function updateRestTimerUI() {
      const banner = document.getElementById('rest-timer-banner');
      const valEl = document.getElementById('rest-timer-val');
      const captionEl = document.getElementById('rest-timer-caption');

      if (!banner) return;

      if (isRestTimerRunning) {
        banner.classList.remove('hidden');
        if (valEl) valEl.innerText = formatDurationSecs(restTimerSeconds);
        if (captionEl) {
          const setNum = currentSessionSets.length;
          const nextNum = setNum + 1;
          captionEl.innerText = `Resting after Set ${setNum}... Tap "Start Set ${nextNum}" to record rest & lift!`;
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

      if (startBtn && startLabel && startIcon) {
        if (isSetInProgress) {
          startBtn.className = "font-bold py-3 px-4 rounded-2xl shadow-lg border border-amber-500/50 bg-amber-500/20 text-amber-300 active:scale-[0.99] transition flex items-center justify-center gap-2 animate-pulse";
          startIcon.className = "fa-solid fa-stopwatch text-amber-400";
          startLabel.innerText = `Set ${nextSetNum} in Progress (${formatDurationSecs(activeSetElapsedSeconds)})`;
        } else if (isRestTimerRunning) {
          startBtn.className = "font-bold py-3 px-4 rounded-2xl shadow-lg border border-emerald-500 bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-[0.99] transition flex items-center justify-center gap-2 shadow-emerald-500/20";
          startIcon.className = "fa-solid fa-play text-slate-950";
          startLabel.innerText = `Start Set ${nextSetNum} (End Rest)`;
        } else {
          startBtn.className = "font-bold py-3 px-4 rounded-2xl shadow-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 active:scale-[0.99] transition flex items-center justify-center gap-2";
          startIcon.className = "fa-solid fa-play";
          startLabel.innerText = `Start Set ${nextSetNum}`;
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
      localStorage.setItem('showUp_active_workout_sets', JSON.stringify(currentSessionSets));
      renderLoggedSets();
      broadcastUserWorkoutStarted(exerciseName);

      if (googleAccessToken) {
        syncToGoogleDrive();
      }

      if (workoutTimerState === 'stopped') {
        startWorkoutTimer();
      }

      if (typeof triggerHaptic === 'function') triggerHaptic('heavy');
      if (typeof playUnobtrusiveChime === 'function') {
        playUnobtrusiveChime();
      }

      // Requirement 2: Once a set is logged, a rest timer shall start.
      startRestTimer();
      updateSetControlsUI();
    }

    function renderLoggedSets() {
      const container = document.getElementById('logged-sets-list');
      const badge = document.getElementById('set-count-badge');
      if (badge) badge.innerText = `${currentSessionSets.length} Sets`;

      if (!container) return;

      if (currentSessionSets.length === 0) {
        container.innerHTML = `<div class="text-center py-8 text-slate-600 text-xs italic">No sets logged for this session yet. Pick an exercise above and hit "Log Set".</div>`;
        updateSetControlsUI();
        return;
      }

      let html = '';
      currentSessionSets.forEach((s, idx) => {
        // Requirement 3: Rest period recorded between prior set and newly started set is visualized
        if (s.restPeriod && s.restPeriod > 0) {
          html += `
            <div class="flex items-center justify-center gap-2 py-1 text-[11px] text-slate-400 font-mono">
              <div class="h-px bg-slate-800 flex-1"></div>
              <span class="bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-full text-emerald-400 flex items-center gap-1.5 shadow-sm">
                <i class="fa-solid fa-hourglass-half text-[10px] text-emerald-400"></i> Rest: ${formatDurationSecs(s.restPeriod)}
              </span>
              <div class="h-px bg-slate-800 flex-1"></div>
            </div>
          `;
        }

        html += `
          <div class="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <div class="text-sm font-bold text-slate-200">${s.exerciseName}</div>
              <div class="text-xs text-slate-400 gap-2 flex items-center flex-wrap mt-0.5">
                <span class="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded-lg font-semibold">${s.implement}</span>
                ${s.implement === "Running" ? `<span>${s.runningDistance} mi | ${s.runningTime}${s.runningAvgHR ? ` | HR: ${s.runningAvgHR} avg` + (s.runningMaxHR ? ` / ${s.runningMaxHR} max` : '') : ''}</span>` :
                  s.implement === "Row Erg" ? `<span>${s.ergDistance}m | ${s.ergTime}</span>` :
                  s.implement === "Swimming" ? `<span>${s.swimDistance} yds | ${s.swimTime}</span>` :
                  ["Walking", "Hiking", "Biking"].includes(s.implement) ? `<span>${s.enduranceDistance} mi | ${s.enduranceTime}</span>` :
                  `<span>${s.weight} lbs × ${s.reps} reps</span>`}
                <span class="text-slate-500">RPE ${s.rpe}</span>
                ${s.setDuration ? `<span class="bg-slate-900 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded-lg font-mono text-[10px]"><i class="fa-regular fa-clock mr-1 text-emerald-500"></i>Set: ${formatDurationSecs(s.setDuration)}</span>` : ''}
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button onclick="triggerHaptic('light'); deleteSet(${s.id})" class="text-slate-600 hover:text-rose-400 p-2 transition" title="Delete Set">
                <i class="fa-solid fa-trash-can text-sm"></i>
              </button>
            </div>
          </div>
        `;
      });

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
      document.getElementById('workout-summary-card').scrollIntoView({ behavior: 'smooth' });

      currentSessionSets = [];
      localStorage.removeItem('showUp_active_workout_sets');
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
