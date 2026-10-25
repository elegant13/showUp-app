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



    function toggleHRCollapsePref(isCollapsed) {
      localStorage.setItem('showUp_hr_collapsed', JSON.stringify(isCollapsed));
      toggleHRCardVisibility(isCollapsed);
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
      if (!('vibrate' in navigator)) return;
      switch (type) {
        case 'light': navigator.vibrate(12); break;
        case 'medium': navigator.vibrate(25); break;
        case 'heavy': navigator.vibrate([35, 50, 35]); break;
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

    function switchTab(tabName) {
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
      if (btnSquads) btnSquads.className = inactiveClass;

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



    function showToast(message, type = 'info') {
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
      setTimeout(() => {
        toast.classList.add('opacity-0', '-translate-y-1');
        setTimeout(() => toast.remove(), 350);
      }, 4000);
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

