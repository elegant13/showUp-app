/* ==========================================================================
   showUp Utilities, Helpers, Notifications & Formatting
   ========================================================================== */

    function getLocalDateISO(d = new Date()) {
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



    function formatBytes(bytes) {
      if (!bytes || bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }



    function switchTab(tabName) {
      const workoutView = document.getElementById('tab-workout-view');
      const calendarView = document.getElementById('tab-calendar-view');
      const squadsView = document.getElementById('tab-squads-view');
      const btnWorkout = document.getElementById('nav-btn-workout');
      const btnCalendar = document.getElementById('nav-btn-calendar');
      const btnSquads = document.getElementById('nav-btn-squads');

      workoutView.classList.add('hidden');
      calendarView.classList.add('hidden');
      if (squadsView) squadsView.classList.add('hidden');

      btnWorkout.className = "flex flex-col items-center justify-center py-1 text-slate-400 hover:text-slate-200 transition relative";
      btnCalendar.className = "flex flex-col items-center justify-center py-1 text-slate-400 hover:text-slate-200 transition relative";
      if (btnSquads) btnSquads.className = "flex flex-col items-center justify-center py-1 text-slate-400 hover:text-slate-200 transition relative";

      if (tabName === 'workout') {
        workoutView.classList.remove('hidden');
        btnWorkout.className = "flex flex-col items-center justify-center py-1 text-emerald-400 hover:text-emerald-300 transition relative";
      } else if (tabName === 'calendar') {
        calendarView.classList.remove('hidden');
        btnCalendar.className = "flex flex-col items-center justify-center py-1 text-emerald-400 hover:text-emerald-300 transition relative";
        renderCalendar();
        renderMonthlyHistory();
        renderWeightHistory();
      } else if (tabName === 'squads') {
        if (squadsView) squadsView.classList.remove('hidden');
        if (btnSquads) btnSquads.className = "flex flex-col items-center justify-center py-1 text-emerald-400 hover:text-emerald-300 transition relative";
        renderSquadsTab();
        renderHeatMap();
        updateGlobalStatsUI();
      }
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
