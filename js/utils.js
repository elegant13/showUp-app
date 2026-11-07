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



    function isHRMEnabled() {
      try {
        const val = localStorage.getItem('showUp_hrm_enabled');
        if (val === null) return false; // Disabled by default
        return val === 'true';
      } catch (e) {
        return false;
      }
    }

    function applyHRMEnabledUI(enabled) {
      const isEnabled = enabled !== undefined ? !!enabled : isHRMEnabled();
      const prefCheckbox = document.getElementById('pref-hrm-enabled');
      if (prefCheckbox) prefCheckbox.checked = isEnabled;

      const hrPill = document.getElementById('hr-minimal-pill');
      const hrCard = document.getElementById('hr-card');
      const hrCollapsedRow = document.getElementById('pref-hr-collapsed-row');
      const runningHrmBtn = document.getElementById('running-hrm-connect-btn');

      if (hrPill) {
        if (isEnabled) {
          hrPill.classList.remove('hidden');
          hrPill.removeAttribute('hidden');
        } else {
          hrPill.classList.add('hidden');
          hrPill.setAttribute('hidden', '');
        }
      }

      if (hrCard) {
        if (!isEnabled) {
          hrCard.classList.add('hidden');
          hrCard.setAttribute('hidden', '');
        } else {
          if (typeof isHRMConnected === 'function' && isHRMConnected()) {
            hrCard.classList.remove('hidden');
            hrCard.removeAttribute('hidden');
          } else {
            hrCard.classList.add('hidden');
            hrCard.setAttribute('hidden', '');
          }
        }
      }

      if (hrCollapsedRow) {
        if (isEnabled) {
          hrCollapsedRow.classList.remove('opacity-40', 'pointer-events-none');
        } else {
          hrCollapsedRow.classList.add('opacity-40', 'pointer-events-none');
        }
      }

      if (runningHrmBtn) {
        if (isEnabled) {
          runningHrmBtn.classList.remove('hidden');
        } else {
          runningHrmBtn.classList.add('hidden');
        }
      }

      if (!isEnabled) {
        if (typeof disconnectHRM === 'function') {
          try { disconnectHRM(); } catch (e) {}
        }
      }
    }

    function toggleHRMEnabledPref(checked) {
      try {
        localStorage.setItem('showUp_hrm_enabled', String(checked));
      } catch (e) {}
      applyHRMEnabledUI(checked);
      if (checked) {
        if (typeof showToast === 'function') showToast("Heart Rate Monitor enabled", "success");
      } else {
        if (typeof showToast === 'function') showToast("Heart Rate Monitor disabled", "info");
      }
    }

    function toggleHRCollapsePref(isCollapsed) {
      localStorage.setItem('showUp_hr_collapsed', JSON.stringify(isCollapsed));
      toggleHRCardVisibility(isCollapsed);
    }

    function isMusclesEngagedEnabled() {
      try {
        const val = localStorage.getItem('showUp_muscles_engaged_enabled');
        if (val === null) return false; // Disabled by default
        return val === 'true';
      } catch (e) {
        return false;
      }
    }

    function applyMusclesEngagedEnabledUI(enabled) {
      const isEnabled = enabled !== undefined ? !!enabled : isMusclesEngagedEnabled();
      const prefCheckbox = document.getElementById('pref-muscles-engaged-enabled');
      if (prefCheckbox) prefCheckbox.checked = isEnabled;

      const autoPill = document.getElementById('exercise-auto-muscles-pill');
      const summaryMusclesBtn = document.getElementById('tab-btn-summary-muscles');
      const summaryMusclesPane = document.getElementById('tab-pane-summary-muscles');
      const muscleMapContainer = document.getElementById('muscle-map-container');

      if (!isEnabled) {
        if (autoPill) autoPill.classList.add('hidden');
        if (summaryMusclesBtn) summaryMusclesBtn.classList.add('hidden');
        if (summaryMusclesPane) summaryMusclesPane.classList.add('hidden');
        if (muscleMapContainer) muscleMapContainer.classList.add('hidden');

        // If currently on summary muscles tab, switch to overview
        if (summaryMusclesBtn && summaryMusclesBtn.className && summaryMusclesBtn.className.includes('bg-emerald-500/20')) {
          if (typeof switchSummaryTab === 'function') {
            try { switchSummaryTab('overview'); } catch (e) {}
          }
        }
      } else {
        if (summaryMusclesBtn) summaryMusclesBtn.classList.remove('hidden');
        if (muscleMapContainer) muscleMapContainer.classList.remove('hidden');

        const exInput = document.getElementById('exercise-name-input');
        if (exInput && exInput.value && exInput.value.trim() && typeof handleExerciseInput === 'function') {
          try { handleExerciseInput(exInput.value); } catch (e) {}
        }
      }
    }

    function toggleMusclesEngagedEnabledPref(checked) {
      try {
        localStorage.setItem('showUp_muscles_engaged_enabled', String(checked));
      } catch (e) {}
      applyMusclesEngagedEnabledUI(checked);
      if (checked) {
        if (typeof showToast === 'function') showToast("Muscles Engaged enabled", "success");
      } else {
        if (typeof showToast === 'function') showToast("Muscles Engaged disabled", "info");
      }
    }

    function isSetTypesEnabled() {
      try {
        const val = localStorage.getItem('showUp_set_types_enabled');
        if (val === null) return false; // Disabled by default
        return val === 'true';
      } catch (e) {
        return false;
      }
    }

    function applySetTypesEnabledUI(enabled) {
      const isEnabled = enabled !== undefined ? !!enabled : isSetTypesEnabled();
      const prefCheckbox = document.getElementById('pref-set-types-enabled');
      if (prefCheckbox) prefCheckbox.checked = isEnabled;

      const setClassificationContainer = document.getElementById('set-classification-container');
      if (setClassificationContainer) {
        if (isEnabled) {
          setClassificationContainer.classList.remove('hidden');
        } else {
          setClassificationContainer.classList.add('hidden');
        }
      }

      // If disabled, ensure active set type is reset to normal
      if (!isEnabled && typeof selectSetType === 'function') {
        try { selectSetType('normal'); } catch (e) {}
      }
    }

    function toggleSetTypesEnabledPref(checked) {
      try {
        localStorage.setItem('showUp_set_types_enabled', String(checked));
      } catch (e) {}
      applySetTypesEnabledUI(checked);
      if (checked) {
        if (typeof showToast === 'function') showToast("Set Types enabled", "success");
      } else {
        if (typeof showToast === 'function') showToast("Set Types disabled", "info");
      }
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
      if (typeof NativeBridge !== 'undefined' && NativeBridge.triggerNativeHaptic) {
        NativeBridge.triggerNativeHaptic(type);
      }
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

    function isSquadsEnabled() {
      try {
        return localStorage.getItem('showUp_squads_enabled') === 'true';
      } catch (e) {
        return false;
      }
    }

    function applySquadsEnabledUI(enabled) {
      const prefCheckbox = document.getElementById('pref-squads-enabled');
      if (prefCheckbox) prefCheckbox.checked = !!enabled;

      const navBtnSquads = document.getElementById('nav-btn-squads');
      const bottomNavGrid = document.getElementById('bottom-nav-grid') || (navBtnSquads ? navBtnSquads.parentElement : null);
      const squadsCardsRow = document.getElementById('pref-squads-collapsed-row');

      if (navBtnSquads) {
        if (enabled) {
          navBtnSquads.classList.remove('hidden');
        } else {
          navBtnSquads.classList.add('hidden');
        }
      }

      if (bottomNavGrid) {
        if (enabled) {
          bottomNavGrid.classList.remove('grid-cols-3');
          bottomNavGrid.classList.add('grid-cols-4');
        } else {
          bottomNavGrid.classList.remove('grid-cols-4');
          bottomNavGrid.classList.add('grid-cols-3');
        }
      }

      if (squadsCardsRow) {
        if (enabled) {
          squadsCardsRow.classList.remove('opacity-40', 'pointer-events-none');
        } else {
          squadsCardsRow.classList.add('opacity-40', 'pointer-events-none');
        }
      }

      // If squads view is currently visible and squads was disabled, switch back to home
      const squadsView = document.getElementById('tab-squads-view');
      if (!enabled && squadsView && !squadsView.classList.contains('hidden')) {
        switchTab('home');
      }

      // Update beacon if defined
      if (typeof updateSquadBeacon === 'function') {
        try { updateSquadBeacon(); } catch (e) {}
      }
    }

    function toggleSquadsEnabledPref(checked) {
      try {
        localStorage.setItem('showUp_squads_enabled', String(checked));
      } catch (e) {}
      applySquadsEnabledUI(checked);
      if (checked) {
        if (typeof initSquads === 'function') {
          try { initSquads(); } catch (e) {}
        }
        if (typeof renderSquadsTab === 'function') {
          try { renderSquadsTab(); } catch (e) {}
        }
        if (typeof showToast === 'function') showToast("Squads module enabled", "success");
      } else {
        if (typeof showToast === 'function') showToast("Squads module disabled", "info");
      }
    }

    function switchTab(tabName) {
      if (tabName === 'squads' && !isSquadsEnabled()) {
        tabName = 'home';
      }
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
      if (btnSquads) {
        btnSquads.className = inactiveClass;
        if (typeof isSquadsEnabled === 'function' && !isSquadsEnabled()) {
          btnSquads.classList.add('hidden');
        }
      }

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



    function showToast(message, type = 'info', duration = 2000) {
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
      const hangDuration = (typeof duration === 'number' && duration > 0) ? duration : 2000;
      setTimeout(() => {
        toast.classList.add('opacity-0', '-translate-y-1');
        setTimeout(() => toast.remove(), 350);
      }, hangDuration);
    }



    /* ==========================================================================
       Unified App Confirmation Modal Engine (Replaces Vanilla Browser Confirm)
       ========================================================================== */
    let appConfirmResolve = null;

    function showAppConfirm(options = {}) {
      return new Promise((resolve) => {
        appConfirmResolve = resolve;
        const modal = document.getElementById('app-confirm-modal');
        if (!modal) {
          if (typeof confirm === 'function') {
            const res = confirm(options.message || options.title || "Are you sure?");
            return resolve(res);
          }
          return resolve(true);
        }

        const titleEl = document.getElementById('app-confirm-title');
        const msgEl = document.getElementById('app-confirm-message');
        const iconBox = document.getElementById('app-confirm-icon-box');
        const iconEl = document.getElementById('app-confirm-icon');
        const cancelBtn = document.getElementById('app-confirm-cancel-btn');
        const actionBtn = document.getElementById('app-confirm-action-btn');
        const btnIcon = document.getElementById('app-confirm-btn-icon');
        const btnText = document.getElementById('app-confirm-btn-text');

        const type = options.type || 'danger';
        const title = options.title || 'Confirm Action';
        const message = options.message || 'Are you sure you want to proceed?';
        const confirmText = options.confirmText || 'Confirm';
        const cancelText = options.cancelText || 'Cancel';
        const iconClass = options.icon || (type === 'danger' ? 'fa-solid fa-ban' : 'fa-solid fa-circle-question');

        if (titleEl) titleEl.innerText = title;
        if (msgEl) msgEl.innerText = message;
        if (cancelBtn) {
          cancelBtn.innerText = cancelText;
          cancelBtn.className = "w-1/2 bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-slate-200 font-bold h-12 sm:h-13 min-h-[48px] sm:min-h-[52px] py-3 sm:py-3.5 rounded-2xl text-sm sm:text-base border border-slate-700/80 transition active:scale-95 flex items-center justify-center shadow-sm";
        }
        if (btnText) btnText.innerText = confirmText;

        if (iconEl) iconEl.className = iconClass;
        if (btnIcon) {
          if (options.btnIcon) {
            btnIcon.className = options.btnIcon + " text-xs";
            btnIcon.classList.remove('hidden');
          } else {
            btnIcon.classList.add('hidden');
          }
        }

        // Configure theme / colors
        if (iconBox) {
          if (type === 'danger') {
            iconBox.className = "w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-2xl shadow-inner";
          } else if (type === 'warning') {
            iconBox.className = "w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl shadow-inner";
          } else {
            iconBox.className = "w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl shadow-inner";
          }
        }

        if (actionBtn) {
          if (type === 'danger') {
            actionBtn.className = "w-1/2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-black h-12 sm:h-13 min-h-[48px] sm:min-h-[52px] py-3 sm:py-3.5 rounded-2xl text-sm sm:text-base transition shadow-lg shadow-rose-600/30 active:scale-95 flex items-center justify-center gap-2";
          } else if (type === 'warning') {
            actionBtn.className = "w-1/2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black h-12 sm:h-13 min-h-[48px] sm:min-h-[52px] py-3 sm:py-3.5 rounded-2xl text-sm sm:text-base transition shadow-lg shadow-amber-500/30 active:scale-95 flex items-center justify-center gap-2";
          } else {
            actionBtn.className = "w-1/2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black h-12 sm:h-13 min-h-[48px] sm:min-h-[52px] py-3 sm:py-3.5 rounded-2xl text-sm sm:text-base transition shadow-lg shadow-emerald-500/30 active:scale-95 flex items-center justify-center gap-2";
          }
        }

        modal.classList.remove('hidden');
      });
    }

    function handleAppConfirmAccept() {
      if (typeof triggerHaptic === 'function') triggerHaptic('medium');
      const modal = document.getElementById('app-confirm-modal');
      if (modal) modal.classList.add('hidden');
      if (appConfirmResolve) {
        const resolve = appConfirmResolve;
        appConfirmResolve = null;
        resolve(true);
      }
    }

    function handleAppConfirmCancel() {
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      const modal = document.getElementById('app-confirm-modal');
      if (modal) modal.classList.add('hidden');
      if (appConfirmResolve) {
        const resolve = appConfirmResolve;
        appConfirmResolve = null;
        resolve(false);
      }
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
     * Creates a high-headroom master dynamics bus with soft-knee harmonic saturation
     * and brickwall peak limiting so boxing bell strikes cut through gym audio at maximum loudness.
     */
    function createBoxingBellMasterBus(ctx, destination, startTime) {
      if (!ctx || !destination) return destination;
      let busInput = destination;

      if (typeof ctx.createDynamicsCompressor === 'function') {
        try {
          const limiter = ctx.createDynamicsCompressor();
          limiter.threshold.setValueAtTime(-1.5, startTime);
          limiter.knee.setValueAtTime(2.0, startTime);
          limiter.ratio.setValueAtTime(20.0, startTime);
          limiter.attack.setValueAtTime(0.001, startTime);
          limiter.release.setValueAtTime(0.08, startTime);
          limiter.connect(destination);
          busInput = limiter;
        } catch (e) {
          busInput = destination;
        }
      }

      if (typeof ctx.createWaveShaper === 'function') {
        try {
          const shaper = ctx.createWaveShaper();
          const samples = 1024;
          const curve = new Float32Array(samples);
          const drive = 2.4;
          const norm = Math.tanh(drive);
          for (let i = 0; i < samples; i++) {
            const x = (i * 2) / (samples - 1) - 1;
            curve[i] = Math.tanh(x * drive) / norm;
          }
          shaper.curve = curve;
          shaper.oversample = '2x';
          shaper.connect(busInput);
          busInput = shaper;
        } catch (e) {}
      }

      // High-output makeup pre-gain driving the saturator/limiter
      try {
        const preGain = ctx.createGain();
        preGain.gain.setValueAtTime(2.2, startTime);
        preGain.connect(busInput);
        return preGain;
      } catch (e) {
        return busInput;
      }
    }

    /**
     * Synthesizes an authentic, ultra-loud acoustic strike of a heavy 10-inch cast brass boxing arena ringside bell.
     * Models physical spun-brass saucer gong acoustics:
     * - Axial mode doublets (paired closely-spaced partials across every radial mode that create the unmistakable
     *   rapid metallic "wah-wah" shimmer of a real center-bolted brass boxing bell)
     * - Initial impact pitch-glide (high-velocity steel hammer flexes the brass rim ~18 cents sharp for the first 35ms)
     * - Broadband metallic hammer-on-brass clank noise burst + 14ms secondary spring-clapper micro-graze
     * - Single-stage natural exponential partial decay (avoiding double-envelope attenuation so the bell rings out at full power)
     */
    function createBoxingBellStrike(ctx, destination, startTime, duration, strikeLevel = 1.0) {
      if (!ctx || !destination) return;

      // Constant-ceiling strike bus so individual partial decays are never squared/attenuated early
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(strikeLevel, startTime);
      masterGain.gain.setValueAtTime(strikeLevel, startTime + Math.max(0.05, duration - 0.04));
      masterGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      masterGain.connect(destination);

      // Authentic 10" cast brass ringside gong modal spectrum (Strike note ~792 Hz G5)
      // Each primary mode is paired with its axial doublet to produce authentic physical brass beating
      const baseFreq = 792;
      const bellPartials = [
        { mult: 0.5000, gain: 0.52, decay: 0.92, type: 'sine', bend: 1.004 },     // Deep brass rim hum (396 Hz)
        { mult: 0.5038, gain: 0.34, decay: 0.88, type: 'sine', bend: 1.004 },     // Rim hum doublet (399 Hz ~ 3 Hz throb)
        { mult: 1.0000, gain: 1.00, decay: 1.00, type: 'sine', bend: 1.009 },     // Primary ringside strike tone (792 Hz)
        { mult: 1.0045, gain: 0.90, decay: 0.96, type: 'sine', bend: 1.008 },     // Primary axial doublet (795.6 Hz ~ 3.6 Hz shimmer)
        { mult: 1.4920, gain: 0.82, decay: 0.78, type: 'triangle', bend: 1.012 }, // Mode (2,1) brass clang (~1181.7 Hz)
        { mult: 1.4995, gain: 0.68, decay: 0.74, type: 'sine', bend: 1.011 },     // Mode (2,1) doublet (~1187.6 Hz ~ 5.9 Hz beating)
        { mult: 2.0350, gain: 0.74, decay: 0.62, type: 'triangle', bend: 1.014 }, // Mode (3,1) piercing ring (~1611.7 Hz)
        { mult: 2.0440, gain: 0.56, decay: 0.58, type: 'sine', bend: 1.013 },     // Mode (3,1) doublet (~1618.8 Hz ~ 7.1 Hz beating)
        { mult: 2.7550, gain: 0.68, decay: 0.46, type: 'triangle', bend: 1.016 }, // Mode (4,1) arena projection peak (~2182 Hz)
        { mult: 2.7680, gain: 0.48, decay: 0.42, type: 'sine', bend: 1.015 },     // Mode (4,1) doublet (~2192 Hz ~ 10 Hz metallic sizzle)
        { mult: 3.4100, gain: 0.58, decay: 0.34, type: 'sawtooth', bend: 1.018 }, // Mode (5,1) ear-sensitivity bite (~2701 Hz)
        { mult: 4.2200, gain: 0.46, decay: 0.25, type: 'triangle', bend: 1.020 }, // Mode (6,1) upper brass brilliance (~3342 Hz)
        { mult: 5.2100, gain: 0.34, decay: 0.16, type: 'triangle', bend: 1.022 }, // Mode (7,1) high metalliczing (~4126 Hz)
        { mult: 6.3800, gain: 0.24, decay: 0.10, type: 'sine', bend: 1.025 }      // Initial anvil overtone (~5053 Hz)
      ];

      bellPartials.forEach(p => {
        try {
          const osc = ctx.createOscillator();
          const partGain = ctx.createGain();
          osc.type = p.type;
          const targetFreq = baseFreq * p.mult;
          // Non-linear brass tension pitch-bend on hammer strike (drops to steady pitch in 32ms)
          osc.frequency.setValueAtTime(targetFreq * (p.bend || 1.008), startTime);
          osc.frequency.exponentialRampToValueAtTime(targetFreq, startTime + 0.032);

          const partDuration = Math.max(0.08, duration * p.decay);
          partGain.gain.setValueAtTime(p.gain, startTime);
          partGain.gain.exponentialRampToValueAtTime(0.0001, startTime + partDuration);

          osc.connect(partGain);
          partGain.connect(masterGain);
          osc.start(startTime);
          osc.stop(startTime + partDuration);
        } catch (e) {}
      });

      // Layer 1: Steel spring-hammer clapper strike + 14ms secondary rim rebound micro-bounce
      try {
        const clapperTimes = [
          { offset: 0.000, startF: 4800, endF: 780, dur: 0.026, amp: 0.95 },
          { offset: 0.014, startF: 3600, endF: 920, dur: 0.016, amp: 0.55 }
        ];
        clapperTimes.forEach(c => {
          const t0 = startTime + c.offset;
          const clickOsc = ctx.createOscillator();
          const clickGain = ctx.createGain();
          clickOsc.type = 'square';
          clickOsc.frequency.setValueAtTime(c.startF, t0);
          clickOsc.frequency.exponentialRampToValueAtTime(c.endF, t0 + c.dur);
          clickGain.gain.setValueAtTime(c.amp, t0);
          clickGain.gain.exponentialRampToValueAtTime(0.0001, t0 + c.dur);
          clickOsc.connect(clickGain);
          clickGain.connect(masterGain);
          clickOsc.start(t0);
          clickOsc.stop(t0 + c.dur + 0.004);
        });
      } catch (e) {}

      // Layer 2: Broadband metallic hammer-on-brass impulse burst (filtered impact noise)
      if (typeof ctx.createBuffer === 'function' && typeof ctx.createBufferSource === 'function') {
        try {
          const sampleRate = ctx.sampleRate || 44100;
          const noiseDur = 0.035;
          const frameCount = Math.max(64, Math.floor(sampleRate * noiseDur));
          const noiseBuffer = ctx.createBuffer(1, frameCount, sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < frameCount; i++) {
            const env = Math.pow(1 - i / frameCount, 2.2);
            output[i] = (Math.random() * 2 - 1) * env;
          }
          const noiseSource = ctx.createBufferSource();
          noiseSource.buffer = noiseBuffer;

          const noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime(0.90, startTime);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + noiseDur);

          if (typeof ctx.createBiquadFilter === 'function') {
            const bandpass = ctx.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.frequency.setValueAtTime(2850, startTime);
            bandpass.Q.setValueAtTime(1.8, startTime);
            noiseSource.connect(bandpass);
            bandpass.connect(noiseGain);
          } else {
            noiseSource.connect(noiseGain);
          }

          noiseGain.connect(masterGain);
          noiseSource.start(startTime);
          noiseSource.stop(startTime + noiseDur);
        } catch (e) {}
      }
    }

    /**
     * Synthesizes an authentic boxing arena end-of-round double bell ("CLANG! ... CLANG!")
     * alert when rest recovery target is reached.
     */
    function playDoubleBellRing() {
      playDoubleDingChime();
    }

    /**
     * Synthesizes a deep, resonant, definitively masculine acoustic bronze gong strike.
     * Uses Web Audio API with a powerful 110 Hz (A2) fundamental, sub-bass 55 Hz (A1) resonance,
     * rich odd/even low bronze partials, a punchy mallet transient, and slow warm reverberation.
     */
    function playDeepGongChime() {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const now = ctx.currentTime;
        const duration = 2.4;

        // Master gain boosted for high loudness and powerful resonance
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.88, now);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        masterGain.connect(ctx.destination);

        // Low masculine gong partials: deep resonant bronze
        const gongPartials = [
          { freq: 55, gain: 0.50, decay: 2.2, type: 'sine' },      // Sub-bass undertone (55 Hz A1)
          { freq: 110, gain: 0.85, decay: 2.4, type: 'sine' },     // Heavy strike fundamental (110 Hz A2)
          { freq: 110.5, gain: 0.70, decay: 2.3, type: 'sine' },   // Beating resonance chorus (bronze vibration)
          { freq: 164.8, gain: 0.45, decay: 1.8, type: 'sine' },   // Minor third low warmth (~E3)
          { freq: 220, gain: 0.55, decay: 1.6, type: 'sine' },     // Baritone octave body (220 Hz A3)
          { freq: 330, gain: 0.35, decay: 1.2, type: 'triangle' }, // Low metallic quint (330 Hz E4)
          { freq: 440, gain: 0.28, decay: 0.9, type: 'triangle' }, // Bronze gong rim ring (440 Hz A4)
          { freq: 659, gain: 0.16, decay: 0.6, type: 'triangle' }  // Upper gong overtone (~659 Hz E5)
        ];

        gongPartials.forEach(p => {
          const osc = ctx.createOscillator();
          const partGain = ctx.createGain();
          osc.type = p.type;
          osc.frequency.setValueAtTime(p.freq, now);

          const partDur = Math.max(0.1, Math.min(duration, p.decay));
          partGain.gain.setValueAtTime(p.gain, now);
          partGain.gain.exponentialRampToValueAtTime(0.0001, now + partDur);

          osc.connect(partGain);
          partGain.connect(masterGain);
          osc.start(now);
          osc.stop(now + partDur);
        });

        // Heavy felt-covered mallet impact transient (punchy, deep thud)
        try {
          const punchOsc = ctx.createOscillator();
          const punchGain = ctx.createGain();
          punchOsc.type = 'sine';
          punchOsc.frequency.setValueAtTime(160, now);
          punchOsc.frequency.exponentialRampToValueAtTime(45, now + 0.06);
          punchGain.gain.setValueAtTime(0.70, now);
          punchGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
          punchOsc.connect(punchGain);
          punchGain.connect(masterGain);
          punchOsc.start(now);
          punchOsc.stop(now + 0.07);
        } catch (e) {}
      } catch (e) {
        console.warn("Rest timer deep gong alert warning:", e);
      }
    }

    /**
     * Synthesizes an authentic boxing arena ringside double bell ("CLANG! ... CLANG!").
     * Exact double ding version of a boxing arena's ringside bell used by officials to signal
     * the start and end of a boxing round.
     * - First strike at 0.00s (duration ~1.2s, sharp resonant brass impact).
     * - Second strike at 0.28s (duration ~3.0s, full sustained ringside brass decay).
     */
    function playDoubleDingChime() {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const now = ctx.currentTime;
        const masterBus = createBoxingBellMasterBus(ctx, ctx.destination, now);
        // Boxing arena ringside bell: Authoritative double strike (CLANG! ... CLANG!)
        createBoxingBellStrike(ctx, masterBus, now, 1.2, 0.95);
        createBoxingBellStrike(ctx, masterBus, now + 0.28, 3.0, 1.00);
      } catch (e) {
        console.warn("Rest timer boxing bell double ding alert warning:", e);
      }
    }

    /**
     * Synthesizes an authentic boxing arena ringside triple bell ("CLANG! ... CLANG! ... CLANG!").
     * Exact triple ding version of a boxing arena's ringside bell used by officials to signal
     * round start, round warnings, or round end.
     * - Three strikes spaced ~280ms apart (0.00s, 0.28s, 0.56s).
     * - Strikes 1 & 2 ring into subsequent strikes; strike 3 rings out completely for ~3.2s.
     */
    function playTripleDingChime() {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const now = ctx.currentTime;
        const masterBus = createBoxingBellMasterBus(ctx, ctx.destination, now);
        // Boxing arena ringside bell: Authoritative triple strike (CLANG! ... CLANG! ... CLANG!)
        createBoxingBellStrike(ctx, masterBus, now, 1.1, 0.92);
        createBoxingBellStrike(ctx, masterBus, now + 0.28, 1.1, 0.96);
        createBoxingBellStrike(ctx, masterBus, now + 0.56, 3.2, 1.00);
      } catch (e) {
        console.warn("Rest timer boxing bell triple ding alert warning:", e);
      }
    }

    /**
     * Option 1 (Piezo): Piercing 3.5 kHz commercial gym wall piezo tweeter double-beep (BEEP-BEEEEP!)
     */
    function playShrillPiezoTone(ctx, startTime, duration, freq = 3520) {
      if (!ctx) return;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.001, startTime);
      master.gain.linearRampToValueAtTime(0.95, startTime + 0.003);
      master.gain.setValueAtTime(0.95, startTime + Math.max(0.01, duration - 0.006));
      master.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      master.connect(ctx.destination);

      const osc1 = ctx.createOscillator();
      const g1 = ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(freq, startTime);
      g1.gain.setValueAtTime(0.45, startTime);
      osc1.connect(g1);
      g1.connect(master);
      osc1.start(startTime);
      osc1.stop(startTime + duration);

      const osc2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq, startTime);
      g2.gain.setValueAtTime(0.75, startTime);
      osc2.connect(g2);
      g2.connect(master);
      osc2.start(startTime);
      osc2.stop(startTime + duration);
    }

    function playPiezoChime() {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime + 0.01;
        playShrillPiezoTone(ctx, now, 0.12, 3520);
        playShrillPiezoTone(ctx, now + 0.18, 0.28, 3520);
      } catch (e) {
        console.warn("Rest timer piezo chime warning:", e);
      }
    }

    /**
     * Option 2 (Whistle): Shrill 3.1 kHz dual-chamber coach/referee pea whistle double-blast (TWEET! — TWEEEEET!)
     */
    function playWhistleBlastTone(ctx, startTime, duration) {
      if (!ctx) return;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.001, startTime);
      master.gain.linearRampToValueAtTime(0.95, startTime + 0.012);
      master.gain.setValueAtTime(0.95, startTime + Math.max(0.02, duration - 0.025));
      master.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      master.connect(ctx.destination);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(32, startTime);
      lfoGain.gain.setValueAtTime(45, startTime);
      lfo.connect(lfoGain);
      lfo.start(startTime);
      lfo.stop(startTime + duration);

      [2980, 3165].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f - 120, startTime);
        osc.frequency.exponentialRampToValueAtTime(f, startTime + 0.022);
        try { lfoGain.connect(osc.frequency); } catch (e) {}
        g.gain.setValueAtTime(idx === 0 ? 0.65 : 0.55, startTime);
        osc.connect(g);
        g.connect(master);
        osc.start(startTime);
        osc.stop(startTime + duration);
      });

      if (typeof ctx.createBuffer === 'function' && typeof ctx.createBufferSource === 'function' && typeof ctx.createBiquadFilter === 'function') {
        try {
          const sr = ctx.sampleRate || 44100;
          const frames = Math.max(64, Math.floor(sr * duration));
          const buf = ctx.createBuffer(1, frames, sr);
          const data = buf.getChannelData(0);
          for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * 0.18;
          const src = ctx.createBufferSource();
          src.buffer = buf;
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(3100, startTime);
          bp.Q.setValueAtTime(6.0, startTime);
          src.connect(bp);
          bp.connect(master);
          src.start(startTime);
          src.stop(startTime + duration);
        } catch (e) {}
      }
    }

    function playWhistleChime() {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime + 0.01;
        playWhistleBlastTone(ctx, now, 0.18);
        playWhistleBlastTone(ctx, now + 0.24, 0.42);
      } catch (e) {
        console.warn("Rest timer whistle chime warning:", e);
      }
    }

    /**
     * High-tension shrill steel dome ping helper (used by Ringer and Ping)
     */
    function playSteelPingTone(ctx, startTime, duration, level = 0.95) {
      if (!ctx) return;
      const master = ctx.createGain();
      master.gain.setValueAtTime(level, startTime);
      master.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      master.connect(ctx.destination);

      const modes = [
        { f: 1760, g: 0.45, d: 0.95 },
        { f: 2680, g: 0.95, d: 1.00 },
        { f: 2689, g: 0.80, d: 0.92 },
        { f: 3890, g: 0.75, d: 0.65 },
        { f: 5120, g: 0.50, d: 0.35 },
        { f: 6480, g: 0.35, d: 0.18 }
      ];
      modes.forEach(m => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(m.f, startTime);
        const dur = Math.max(0.04, duration * m.d);
        g.gain.setValueAtTime(m.g, startTime);
        g.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);
        osc.connect(g);
        g.connect(master);
        osc.start(startTime);
        osc.stop(startTime + dur);
      });
    }

    /**
     * Option 3 (Ringer): Motorized fight-gym wall alarm bell with rapid 24 Hz hammer rattle (BRRRING!)
     */
    function playRingerChime() {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime + 0.01;
        const strikes = 12;
        for (let i = 0; i < strikes; i++) {
          const isLast = i === strikes - 1;
          playSteelPingTone(ctx, now + i * 0.042, isLast ? 1.4 : 0.09, isLast ? 0.98 : 0.85);
        }
      } catch (e) {
        console.warn("Rest timer ringer chime warning:", e);
      }
    }

    /**
     * Option 4 (Chirp): 4.0 kHz shrill digital stopwatch double-chirp alarm (BEEP-BEEP ... BEEP-BEEP!)
     */
    function playChirpChime() {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime + 0.01;
        playShrillPiezoTone(ctx, now, 0.065, 4000);
        playShrillPiezoTone(ctx, now + 0.095, 0.065, 4000);
        playShrillPiezoTone(ctx, now + 0.28, 0.065, 4000);
        playShrillPiezoTone(ctx, now + 0.375, 0.11, 4000);
      } catch (e) {
        console.warn("Rest timer chirp chime warning:", e);
      }
    }

    /**
     * Option 5 (Ping): Bright, high-tension 2.7 kHz hardened steel ring-bell double-ping (TING! — TING!)
     */
    function playPingChime() {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime + 0.01;
        playSteelPingTone(ctx, now, 0.24, 0.95);
        playSteelPingTone(ctx, now + 0.22, 1.6, 1.0);
      } catch (e) {
        console.warn("Rest timer ping chime warning:", e);
      }
    }

    const REST_CHIME_KEYS = ['piezo', 'whistle', 'ringer', 'chirp', 'ping'];

    const REST_CHIMES = {
      piezo: {
        id: 'piezo',
        name: 'Piezo',
        tag: 'Piezo',
        desc: 'Piercing 3.5 kHz commercial gym wall piezo double-beep',
        icon: 'fa-solid fa-wave-square'
      },
      whistle: {
        id: 'whistle',
        name: 'Whistle',
        tag: 'Whistle',
        desc: 'Shrill 3.1 kHz coach/referee pea whistle double-blast',
        icon: 'fa-solid fa-bullhorn'
      },
      ringer: {
        id: 'ringer',
        name: 'Ringer',
        tag: 'Ringer',
        desc: 'Motorized fight-gym wall alarm bell rapid hammer rattle',
        icon: 'fa-solid fa-bell'
      },
      chirp: {
        id: 'chirp',
        name: 'Chirp',
        tag: 'Chirp',
        desc: 'Ultra-shrill 4.0 kHz digital stopwatch double-chirp',
        icon: 'fa-solid fa-stopwatch'
      },
      ping: {
        id: 'ping',
        name: 'Ping',
        tag: 'Ping',
        desc: 'Bright 2.7 kHz hardened steel ring-bell double-ping',
        icon: 'fa-solid fa-bell-concierge'
      }
    };

    function getRestChimeSound() {
      try {
        const val = localStorage.getItem('showUp_rest_chime_sound');
        return REST_CHIMES[val] ? val : 'piezo';
      } catch (e) {
        return 'piezo';
      }
    }

    function setRestChimeSound(chimeId, preview = true) {
      const valid = REST_CHIMES[chimeId] ? chimeId : 'piezo';
      try {
        localStorage.setItem('showUp_rest_chime_sound', valid);
      } catch (e) {}
      updateRestChimeUI();
      if (preview && isRestSoundAlertEnabled()) {
        playRestChime(valid);
      }
    }

    function cycleRestChimeSound(preview = true) {
      const current = getRestChimeSound();
      const idx = REST_CHIME_KEYS.indexOf(current);
      const nextIndex = (idx === -1 ? 0 : idx + 1) % REST_CHIME_KEYS.length;
      const nextChime = REST_CHIME_KEYS[nextIndex];
      setRestChimeSound(nextChime, preview);
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      const chimeMeta = REST_CHIMES[nextChime];
      if (typeof showToast === 'function') {
        showToast(`Recovery Chime: ${chimeMeta.name}`, "info");
      }
      return nextChime;
    }

    function playRestChime(explicitChimeId = null) {
      if (!isRestSoundAlertEnabled()) return;
      const chime = explicitChimeId || getRestChimeSound();
      switch (chime) {
        case 'whistle':
          playWhistleChime();
          break;
        case 'ringer':
          playRingerChime();
          break;
        case 'chirp':
          playChirpChime();
          break;
        case 'ping':
          playPingChime();
          break;
        case 'piezo':
        default:
          playPiezoChime();
          break;
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
      if (next) {
        playRestChime();
      }
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      if (typeof showToast === 'function') {
        const meta = REST_CHIMES[getRestChimeSound()] || REST_CHIMES.piezo;
        showToast(next ? `Rest alert sound: On (${meta.name})` : "Rest alert sound: Muted", "info");
      }
    }

    function toggleRestSoundAlertPref(checked) {
      setRestSoundAlertEnabled(checked);
      if (checked) {
        playRestChime();
      }
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      if (typeof showToast === 'function') {
        const meta = REST_CHIMES[getRestChimeSound()] || REST_CHIMES.piezo;
        showToast(checked ? `Rest alert sound: On (${meta.name})` : "Rest alert sound: Muted", "info");
      }
    }

    function updateRestChimeUI() {
      const chimeId = getRestChimeSound();
      const meta = REST_CHIMES[chimeId] || REST_CHIMES.piezo;

      const chimeBtn = document.getElementById('btn-chime-cycle');
      const chimeIcon = document.getElementById('btn-chime-icon');
      const chimeLabel = document.getElementById('btn-chime-label');
      if (chimeBtn) {
        chimeBtn.title = `Current chime: ${meta.name} · Click to switch`;
      }
      if (chimeIcon) {
        chimeIcon.className = `${meta.icon} text-emerald-400 text-xs`;
      }
      if (chimeLabel) {
        chimeLabel.textContent = meta.name;
      }

      const select = document.getElementById('pref-rest-chime-select');
      if (select) {
        select.value = chimeId;
      }
    }

    function updateRestSoundAlertUI() {
      const enabled = isRestSoundAlertEnabled();
      const bannerBtn = document.getElementById('btn-toggle-rest-sound');
      const bannerIcon = document.getElementById('btn-toggle-rest-sound-icon');
      const chimeMeta = REST_CHIMES[getRestChimeSound()] || REST_CHIMES.piezo;

      if (bannerBtn && bannerIcon) {
        if (enabled) {
          bannerBtn.className = "bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 text-xs sm:text-sm font-black p-2 sm:p-2.5 rounded-xl transition active:scale-95 shadow flex items-center justify-center cursor-pointer";
          bannerIcon.className = "fa-solid fa-bell";
          bannerBtn.title = `Recovery alert sound: On (${chimeMeta.name}) · Click to mute`;
        } else {
          bannerBtn.className = "bg-slate-900 hover:bg-slate-800 text-slate-500 border border-slate-700/80 text-xs sm:text-sm font-black p-2 sm:p-2.5 rounded-xl transition active:scale-95 shadow flex items-center justify-center cursor-pointer";
          bannerIcon.className = "fa-solid fa-bell-slash";
          bannerBtn.title = "Recovery alert sound: Muted · Click to enable";
        }
      }
      const prefCheckbox = document.getElementById('pref-rest-sound-alert');
      if (prefCheckbox) {
        prefCheckbox.checked = enabled;
      }

      updateRestChimeUI();
      applyAutoStartSetUI();
    }

    function isAutoStartSetEnabled() {
      try {
        const val = localStorage.getItem('showUp_auto_start_set');
        if (val === null) return false; // Default: disabled (opt-in)
        return val === 'true';
      } catch (e) {
        return false;
      }
    }

    function setAutoStartSetEnabled(enabled) {
      try {
        localStorage.setItem('showUp_auto_start_set', enabled ? 'true' : 'false');
      } catch (e) {}
      applyAutoStartSetUI(enabled);
    }

    function applyAutoStartSetUI(enabled) {
      const isEnabled = enabled !== undefined ? !!enabled : isAutoStartSetEnabled();
      const prefCheckbox = document.getElementById('pref-auto-start-set');
      if (prefCheckbox) {
        prefCheckbox.checked = isEnabled;
      }
    }

    function toggleAutoStartSetPref(checked) {
      setAutoStartSetEnabled(checked);
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      if (typeof showToast === 'function') {
        showToast(checked ? "Auto-Start Set on Rest Target: Enabled" : "Auto-Start Set on Rest Target: Disabled", "info");
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
      window.createBoxingBellMasterBus = createBoxingBellMasterBus;
      window.createBoxingBellStrike = createBoxingBellStrike;
      window.playDoubleBellRing = playDoubleBellRing;
      window.playDeepGongChime = playDeepGongChime;
      window.playDoubleDingChime = playDoubleDingChime;
      window.playTripleDingChime = playTripleDingChime;
      window.playPiezoChime = playPiezoChime;
      window.playWhistleChime = playWhistleChime;
      window.playRingerChime = playRingerChime;
      window.playChirpChime = playChirpChime;
      window.playPingChime = playPingChime;
      window.REST_CHIME_KEYS = REST_CHIME_KEYS;
      window.REST_CHIMES = REST_CHIMES;
      window.playRestChime = playRestChime;
      window.getRestChimeSound = getRestChimeSound;
      window.setRestChimeSound = setRestChimeSound;
      window.cycleRestChimeSound = cycleRestChimeSound;
      window.updateRestChimeUI = updateRestChimeUI;
      window.isRestSoundAlertEnabled = isRestSoundAlertEnabled;
      window.setRestSoundAlertEnabled = setRestSoundAlertEnabled;
      window.toggleRestSoundAlert = toggleRestSoundAlert;
      window.toggleRestSoundAlertPref = toggleRestSoundAlertPref;
      window.updateRestSoundAlertUI = updateRestSoundAlertUI;
      window.isHRMEnabled = isHRMEnabled;
      window.applyHRMEnabledUI = applyHRMEnabledUI;
      window.toggleHRMEnabledPref = toggleHRMEnabledPref;
      window.isMusclesEngagedEnabled = isMusclesEngagedEnabled;
      window.applyMusclesEngagedEnabledUI = applyMusclesEngagedEnabledUI;
      window.toggleMusclesEngagedEnabledPref = toggleMusclesEngagedEnabledPref;
      window.isAutoStartSetEnabled = isAutoStartSetEnabled;
      window.setAutoStartSetEnabled = setAutoStartSetEnabled;
      window.applyAutoStartSetUI = applyAutoStartSetUI;
      window.toggleAutoStartSetPref = toggleAutoStartSetPref;
      window.isSetTypesEnabled = isSetTypesEnabled;
      window.applySetTypesEnabledUI = applySetTypesEnabledUI;
      window.toggleSetTypesEnabledPref = toggleSetTypesEnabledPref;
    }

