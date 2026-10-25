/* ==========================================================================
   showUp Theming, Palettes & Typography Preferences
   ========================================================================== */

    function toggleSettingsModal() {
      const modal = document.getElementById('settings-modal');
      if (modal) {
        modal.classList.toggle('hidden');
        if (!modal.classList.contains('hidden')) {
          updateSettingsModalAuthVisibility();
        }
      }
    }

    let currentSettingsTab = 'styling';

    function switchSettingsTab(tabName) {
      currentSettingsTab = tabName;
      const tabs = ['styling', 'defaults', 'backup', 'telemetry'];
      tabs.forEach(t => {
        const pane = document.getElementById('settings-pane-' + t);
        const btn = document.getElementById('settings-tab-btn-' + t);
        if (pane) {
          if (t === tabName) pane.classList.remove('hidden');
          else pane.classList.add('hidden');
        }
        if (btn) {
          if (t === tabName) {
            btn.className = "flex-1 py-1.5 px-2 rounded-xl font-bold transition text-center bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20";
          } else {
            btn.className = "flex-1 py-1.5 px-2 rounded-xl font-bold transition text-center text-slate-400 hover:text-slate-200";
          }
        }
      });
    }

    if (typeof window !== 'undefined') {
      window.switchSettingsTab = switchSettingsTab;
    }

    function updateSettingsModalAuthVisibility() {
      const card = document.getElementById('settings-athlete-account-card');
      if (card) {
        const loggedIn = (typeof isCustomerLoggedIn === 'function') ? isCustomerLoggedIn() : false;
        card.classList.toggle('hidden', loggedIn);
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

    const THEME_ALIASES = {
      'emerald': 'lime',
      'amoled': 'obsidian',
      'slate': 'obsidian',
      'blue': 'teal',
      'red': 'orange'
    };

    function setThemePalette(themeKey) {
      if (!themeKey) themeKey = 'orange';
      const body = document.getElementById('app-body');
      if (body) {
        body.className = body.className.replace(/\btheme-\S+/g, '').trim();
        body.classList.add(`theme-${themeKey}`);
      }
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.className = (document.documentElement.className || '').replace(/\btheme-\S+/g, '').trim() + ` theme-${themeKey}`;
      }
      
      localStorage.setItem('showUp_theme', themeKey);
      localStorage.setItem('showUp_theme_accent', themeKey);

      // Persist in profile
      try {
        const profile = JSON.parse(localStorage.getItem('showUp_user_profile') || 'null');
        if (profile) {
          profile.theme = themeKey;
          localStorage.setItem('showUp_user_profile', JSON.stringify(profile));
        }
      } catch (e) {}

      updateThemeButtonsUI(themeKey);

      // Instantly re-absorb the chosen color palette into the global daily counter
      const counterEl = document.getElementById('global-daily-counter');
      if (counterEl) {
        counterEl.style.color = 'var(--m3-primary)';
        counterEl.style.webkitTextFillColor = 'var(--m3-primary)';
      }
      if (typeof updateGlobalStatsUI === 'function') updateGlobalStatsUI();
      if (typeof renderHeatMap === 'function') renderHeatMap();
      if (typeof renderCalendar === 'function') renderCalendar();
      if (typeof renderWeightHistory === 'function') renderWeightHistory();
      if (typeof renderHomeTab === 'function') renderHomeTab();
    }

    function updateThemeButtonsUI(activeTheme) {
      const container = document.getElementById('theme-palette-grid');
      if (!container) return;
      if (THEME_ALIASES[activeTheme]) activeTheme = THEME_ALIASES[activeTheme];
      const buttons = container.querySelectorAll('button[data-theme]');
      buttons.forEach(btn => {
        const theme = btn.getAttribute('data-theme');
        if (theme === activeTheme) {
          btn.className = "p-2.5 rounded-2xl border-2 border-white bg-slate-900 text-left transition active:scale-95 flex items-center gap-2.5 cursor-pointer ring-2 ring-white/30 shadow-lg";
        } else {
          btn.className = "p-2.5 rounded-2xl border border-slate-800 bg-slate-950/80 hover:border-slate-700 text-left transition active:scale-95 flex items-center gap-2.5 cursor-pointer group";
        }
      });
    }

    function restoreThemePreferences() {
      const savedProfile = JSON.parse(localStorage.getItem('showUp_user_profile') || 'null');
      let savedTheme = localStorage.getItem('showUp_theme') || 
                       localStorage.getItem('showUp_theme_accent') || 
                       (savedProfile && savedProfile.theme) || 
                       'orange';
      if (THEME_ALIASES[savedTheme]) savedTheme = THEME_ALIASES[savedTheme];
      setThemePalette(savedTheme);

      const savedHRCollapsed = JSON.parse(localStorage.getItem('showUp_hr_collapsed') || 'false');
      const prefHrEl = document.getElementById('pref-hr-collapsed');
      if (prefHrEl) prefHrEl.checked = savedHRCollapsed;
      if (savedHRCollapsed) {
        toggleHRCardVisibility(true);
      }

      const savedSquadsCollapsed = localStorage.getItem('showUp_squads_default_collapsed') === 'true';
      const prefSquadsEl = document.getElementById('pref-squads-collapsed');
      if (prefSquadsEl) prefSquadsEl.checked = savedSquadsCollapsed;
    }



    function setFontFamily(fontKey = 'jakarta') {
      const selectedFont = fontKey || 'jakarta';
      const cleanFont = selectedFont.replace(/^font-/, '');
      const body = document.getElementById('app-body');
      if (body) {
        body.className = body.className.replace(/\bfont-\S+/g, '').trim();
        body.classList.add(`font-${cleanFont}`);
      }
      try {
        localStorage.setItem('showUp_font', selectedFont);
      } catch (e) {}
      updateFontUI(cleanFont);
    }

    function restoreFontPreferences() {
      const savedFont = localStorage.getItem('showUp_font') || 'jakarta';
      setFontFamily(savedFont);
    }

    function updateFontUI(activeFont = 'jakarta') {
      const fonts = ['jakarta', 'outfit', 'space', 'lexend', 'mono'];
      fonts.forEach(f => {
        const btn = document.getElementById(`font-btn-${f}`);
        if (btn) {
          btn.className = "hidden";
          if (btn.classList && typeof btn.classList.add === 'function') btn.classList.add('hidden');
        }
      });
    }

    // ================= UI/UX DESIGN PARADIGM MANAGEMENT (ZEN DEFAULT) =================

    function setAppUIMode(modeKey = 'zen') {
      const mode = 'zen';
      const body = document.getElementById('app-body');
      if (body) {
        body.className = body.className.replace(/\bui-mode-\S+/g, '').trim();
        body.classList.add('ui-mode-zen');
      }
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.className = (document.documentElement.className || '').replace(/\bui-mode-\S+/g, '').trim() + ' ui-mode-zen';
      }
      try {
        localStorage.setItem('showUp_ui_mode', 'zen');
      } catch (e) {}
      updateUIModeButtons('zen');
    }

    function cycleAppUIMode() {
      setAppUIMode('zen');
    }

    function restoreAppUIMode() {
      setAppUIMode('zen');
    }

    function updateUIModeButtons(activeMode = 'zen') {
      const btn = document.getElementById('ui-mode-btn-zen');
      if (btn) {
        btn.className = "p-3 rounded-2xl border-2 border-emerald-500 bg-emerald-500/15 text-emerald-300 text-left transition active:scale-95 shadow-lg shadow-emerald-500/10 relative overflow-hidden";
      }
      const quickToggleLabel = document.getElementById('quick-ui-mode-name');
      if (quickToggleLabel) {
        quickToggleLabel.innerText = 'Zen';
      }
    }
