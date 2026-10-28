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
        if (val === null) return true; // Enabled by default
        return val === 'true';
      } catch (e) {
        return true;
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
        if (val === null) return true; // Enabled by default
        return val === 'true';
      } catch (e) {
        return true;
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



    function showToast(message, type = 'info', duration = 3000) {
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
      const hangDuration = (typeof duration === 'number' && duration > 0) ? duration : 3000;
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
     * Synthesizes an acoustic strike of a heavy cast bronze boxing arena ringside bell.
     * Incorporates authentic bell metal acoustics: deep hum tone (~218 Hz),
     * strike tone fundamental (A4 436 Hz), detuned bronze beating chorusing (~439 Hz),
     * minor third tierce (~528 Hz), quint (~662 Hz), nominal octave (~872 Hz),
     * decime clang (~1203 Hz), high arena shimmer, and a sharp metallic hammer impact transient.
     */
    function createBoxingBellStrike(ctx, destination, startTime, duration, strikeLevel = 0.35) {
      if (!ctx || !destination) return;
      // Master strike gain envelope
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(strikeLevel, startTime);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      masterGain.connect(destination);

      // Authentic cast arena bell partials: [multiplier, relativeGain, decayRatio, type]
      const bellPartials = [
        { mult: 0.5, gain: 0.40, decay: 0.95, type: 'sine' },      // Deep hum tone (~218 Hz)
        { mult: 1.0, gain: 0.85, decay: 1.00, type: 'sine' },      // Strike tone fundamental (~436 Hz)
        { mult: 1.006, gain: 0.70, decay: 0.95, type: 'sine' },    // Detuned beating chorus (vibrating bronze)
        { mult: 1.21, gain: 0.45, decay: 0.80, type: 'sine' },     // Tierce (minor third ~528 Hz)
        { mult: 1.52, gain: 0.40, decay: 0.75, type: 'sine' },     // Quint (~662 Hz)
        { mult: 2.00, gain: 0.55, decay: 0.70, type: 'sine' },     // Nominal octave (~872 Hz)
        { mult: 2.76, gain: 0.35, decay: 0.50, type: 'triangle' }, // Decime metallic gong ring (~1203 Hz)
        { mult: 3.92, gain: 0.28, decay: 0.35, type: 'triangle' }, // High arena clang (~1709 Hz)
        { mult: 5.40, gain: 0.18, decay: 0.20, type: 'triangle' }  // Sharp hammer strike overtone (~2354 Hz)
      ];

      const baseFreq = 436; // A4 standard boxing bout bell pitch

      bellPartials.forEach(p => {
        try {
          const osc = ctx.createOscillator();
          const partGain = ctx.createGain();
          osc.type = p.type;
          osc.frequency.setValueAtTime(baseFreq * p.mult, startTime);

          const partDuration = Math.max(0.08, duration * p.decay);
          partGain.gain.setValueAtTime(p.gain, startTime);
          partGain.gain.exponentialRampToValueAtTime(0.0001, startTime + partDuration);

          osc.connect(partGain);
          partGain.connect(masterGain);
          osc.start(startTime);
          osc.stop(startTime + partDuration);
        } catch (e) {}
      });

      // Physical metallic hammer strike impact transient (official clapper strike)
      try {
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = 'square';
        clickOsc.frequency.setValueAtTime(1400, startTime);
        clickOsc.frequency.exponentialRampToValueAtTime(140, startTime + 0.03);
        clickGain.gain.setValueAtTime(0.35, startTime);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.03);
        clickOsc.connect(clickGain);
        clickGain.connect(masterGain);
        clickOsc.start(startTime);
        clickOsc.stop(startTime + 0.035);
      } catch (e) {}
    }

    /**
     * Synthesizes an authentic boxing arena end-of-round double bell ("CLANG! ... CLANG!")
     * alert when rest recovery target is reached.
     */
    function playDoubleBellRing() {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const now = ctx.currentTime;
        // Boxing round end: Rhythmic double strike (CLANG! ... CLANG!)
        createBoxingBellStrike(ctx, ctx.destination, now, 1.1, 0.38);
        createBoxingBellStrike(ctx, ctx.destination, now + 0.28, 1.9, 0.44);
      } catch (e) {
        console.warn("Rest timer boxing bell alert warning:", e);
      }
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

        // Master gain
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.44, now);
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
          punchGain.gain.setValueAtTime(0.42, now);
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
     * - First strike at 0.00s (duration ~1.1s, clean resonant bronze impact).
     * - Second strike at 0.28s (duration ~1.9s, sustained exponential decay ringing out).
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
        // Boxing arena ringside bell: Exact double strike (CLANG! ... CLANG!)
        createBoxingBellStrike(ctx, ctx.destination, now, 1.1, 0.38);
        createBoxingBellStrike(ctx, ctx.destination, now + 0.28, 1.9, 0.44);
      } catch (e) {
        console.warn("Rest timer boxing bell double ding alert warning:", e);
      }
    }

    /**
     * Synthesizes an authentic boxing arena ringside triple bell ("CLANG! ... CLANG! ... CLANG!").
     * Exact triple ding version of a boxing arena's ringside bell used by officials to signal
     * round start, round warnings, or round end.
     * - Three strikes spaced ~260ms apart (0.00s, 0.26s, 0.52s).
     * - Strikes 1 & 2 ring into subsequent strikes; strike 3 rings out completely for 2.0s.
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
        // Boxing arena ringside bell: Exact triple strike (CLANG! ... CLANG! ... CLANG!)
        createBoxingBellStrike(ctx, ctx.destination, now, 0.9, 0.36);
        createBoxingBellStrike(ctx, ctx.destination, now + 0.26, 0.9, 0.38);
        createBoxingBellStrike(ctx, ctx.destination, now + 0.52, 2.0, 0.45);
      } catch (e) {
        console.warn("Rest timer boxing bell triple ding alert warning:", e);
      }
    }

    const REST_CHIMES = {
      double_ding: {
        id: 'double_ding',
        name: 'Boxing Bell',
        tag: 'Double Ding',
        desc: "Boxing arena ringside bell: double strike (round start/end)",
        icon: 'fa-solid fa-bell'
      },
      triple_ding: {
        id: 'triple_ding',
        name: 'Boxing Bell',
        tag: 'Triple Ding',
        desc: "Boxing arena ringside bell: triple strike (round official bell)",
        icon: 'fa-solid fa-bell'
      },
      deep_gong: {
        id: 'deep_gong',
        name: 'Deep Gong',
        tag: 'Masculine',
        desc: 'Definitively masculine: deep resonant brass gong',
        icon: 'fa-solid fa-shield-halved'
      }
    };

    function getRestChimeSound() {
      try {
        const val = localStorage.getItem('showUp_rest_chime_sound');
        return REST_CHIMES[val] ? val : 'double_ding';
      } catch (e) {
        return 'double_ding';
      }
    }

    function setRestChimeSound(chimeId, preview = true) {
      const valid = REST_CHIMES[chimeId] ? chimeId : 'double_ding';
      try {
        localStorage.setItem('showUp_rest_chime_sound', valid);
      } catch (e) {}
      updateRestChimeUI();
      if (preview && isRestSoundAlertEnabled()) {
        playRestChime(valid);
      }
    }

    function cycleRestChimeSound() {
      const current = getRestChimeSound();
      const keys = ['double_ding', 'triple_ding', 'deep_gong'];
      const nextIndex = (keys.indexOf(current) + 1) % keys.length;
      const nextChime = keys[nextIndex];
      setRestChimeSound(nextChime, true);
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      const chimeMeta = REST_CHIMES[nextChime];
      if (typeof showToast === 'function') {
        showToast(`Recovery Chime: ${chimeMeta.name} (${chimeMeta.tag})`, "info");
      }
      return nextChime;
    }

    function playRestChime(explicitChimeId = null) {
      if (!isRestSoundAlertEnabled()) return;
      const chime = explicitChimeId || getRestChimeSound();
      if (chime === 'triple_ding') {
        playTripleDingChime();
      } else if (chime === 'deep_gong') {
        playDeepGongChime();
      } else {
        playDoubleDingChime();
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
        const meta = REST_CHIMES[getRestChimeSound()] || REST_CHIMES.boxing_bell;
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
        const meta = REST_CHIMES[getRestChimeSound()] || REST_CHIMES.double_ding;
        showToast(checked ? `Rest alert sound: On (${meta.name})` : "Rest alert sound: Muted", "info");
      }
    }

    function updateRestChimeUI() {
      const chimeId = getRestChimeSound();
      const meta = REST_CHIMES[chimeId] || REST_CHIMES.double_ding;

      const chimeBtn = document.getElementById('btn-chime-cycle');
      const chimeIcon = document.getElementById('btn-chime-icon');
      const chimeLabel = document.getElementById('btn-chime-label');
      if (chimeBtn) {
        chimeBtn.title = `Current chime: ${meta.name} (${meta.tag}) · Click to switch`;
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
      const chimeMeta = REST_CHIMES[getRestChimeSound()] || REST_CHIMES.double_ding;

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
      window.createBoxingBellStrike = createBoxingBellStrike;
      window.playDoubleBellRing = playDoubleBellRing;
      window.playDeepGongChime = playDeepGongChime;
      window.playDoubleDingChime = playDoubleDingChime;
      window.playTripleDingChime = playTripleDingChime;
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
    }

