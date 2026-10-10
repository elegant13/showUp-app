/* ==========================================================================
   showUp Theming, Palettes & Typography Preferences
   ========================================================================== */

    function toggleSettingsModal() {
      const modal = document.getElementById('settings-modal');
      modal.classList.toggle('hidden');
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

    function setThemePalette(themeKey) {
      if (!themeKey) themeKey = 'emerald';
      const body = document.getElementById('app-body');
      if (body) {
        body.className = body.className.replace(/\btheme-\S+/g, '').trim();
        body.classList.add(`theme-${themeKey}`);
      }
      document.documentElement.className = (document.documentElement.className || '').replace(/\btheme-\S+/g, '').trim() + ` theme-${themeKey}`;
      
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
    }

    function updateThemeButtonsUI(activeTheme) {
      const container = document.getElementById('theme-palette-grid');
      if (!container) return;
      const buttons = container.querySelectorAll('button[data-theme]');
      buttons.forEach(btn => {
        const theme = btn.getAttribute('data-theme');
        if (theme === activeTheme) {
          btn.classList.remove('border-transparent', 'border-slate-700');
          btn.classList.add('border-white', 'ring-2', 'ring-white/50');
        } else {
          btn.classList.remove('border-white', 'ring-2', 'ring-white/50');
          if (theme === 'amoled') {
            btn.classList.add('border-slate-700');
          } else {
            btn.classList.add('border-transparent');
          }
        }
      });
    }

    function restoreThemePreferences() {
      const savedProfile = JSON.parse(localStorage.getItem('showUp_user_profile') || 'null');
      const savedTheme = localStorage.getItem('showUp_theme') || 
                         localStorage.getItem('showUp_theme_accent') || 
                         (savedProfile && savedProfile.theme) || 
                         'emerald';
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



    function setFontFamily(fontKey) {
      const body = document.getElementById('app-body');
      body.className = body.className.replace(/\bfont-\S+/g, '').trim();
      body.classList.add(`font-${fontKey}`);
      localStorage.setItem('showUp_font', fontKey);
      updateFontUI(fontKey);
    }

    function restoreFontPreferences() {
      const savedFont = localStorage.getItem('showUp_font') || 'jakarta';
      setFontFamily(savedFont);
    }

    function updateFontUI(activeFont) {
      const fonts = ['jakarta', 'outfit', 'space', 'lexend', 'mono'];
      fonts.forEach(f => {
        const btn = document.getElementById(`font-btn-${f}`);
        if (btn) {
          if (f === activeFont) {
            btn.className = "p-2.5 rounded-2xl border-2 border-emerald-500 bg-emerald-500/10 text-emerald-400 text-left transition active:scale-95 shadow-md shadow-emerald-500/10";
          } else {
            btn.className = "p-2.5 rounded-2xl border border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700 text-left transition active:scale-95";
          }
        }
      });
    }

    // ================= UI/UX DESIGN PARADIGM MANAGEMENT (V3) =================

    function setAppUIMode(modeKey) {
      if (!modeKey || !['precision', 'zen', 'hud', 'light'].includes(modeKey)) {
        modeKey = 'precision';
      }
      const body = document.getElementById('app-body');
      if (body) {
        body.className = body.className.replace(/\bui-mode-\S+/g, '').trim();
        body.classList.add(`ui-mode-${modeKey}`);
      }
      document.documentElement.className = (document.documentElement.className || '').replace(/\bui-mode-\S+/g, '').trim() + ` ui-mode-${modeKey}`;
      localStorage.setItem('showUp_ui_mode', modeKey);
      updateUIModeButtons(modeKey);
    }

    function cycleAppUIMode() {
      const current = localStorage.getItem('showUp_ui_mode') || 'precision';
      const modes = ['precision', 'zen', 'hud', 'light'];
      const nextIdx = (modes.indexOf(current) + 1) % modes.length;
      const nextMode = modes[nextIdx];
      setAppUIMode(nextMode);
      const labels = {
        precision: 'Precision Glass UI',
        zen: 'Executive Zen UI (Minimalist)',
        hud: 'Cyber Kinetic HUD (Telemetry)',
        light: 'Daylight Frost UI (Light Mode)'
      };
      if (typeof showToast === 'function') {
        showToast(`Switched to ${labels[nextMode]}`, 'info');
      }
    }

    function restoreAppUIMode() {
      const saved = localStorage.getItem('showUp_ui_mode') || 'precision';
      setAppUIMode(saved);
    }

    function updateUIModeButtons(activeMode) {
      const modes = ['precision', 'zen', 'hud', 'light'];
      modes.forEach(m => {
        const btn = document.getElementById(`ui-mode-btn-${m}`);
        if (btn) {
          if (m === activeMode) {
            btn.className = "p-3 rounded-2xl border-2 border-emerald-500 bg-emerald-500/15 text-emerald-300 text-left transition active:scale-95 shadow-lg shadow-emerald-500/10 relative overflow-hidden";
          } else {
            btn.className = "p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:border-slate-700 text-left transition active:scale-95";
          }
        }
      });
      const quickToggleLabel = document.getElementById('quick-ui-mode-name');
      if (quickToggleLabel) {
        const names = { precision: 'Glass', zen: 'Zen', hud: 'HUD', light: 'Light' };
        quickToggleLabel.innerText = names[activeMode] || 'Glass';
      }
    }
