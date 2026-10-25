/* ==========================================================================
   showUp Application Bootstrap & Lifecycle Wiring
   ========================================================================== */

    window.addEventListener('DOMContentLoaded', () => {
      if (typeof AppStorage !== 'undefined' && typeof AppStorage.applyPendingMigrations === 'function') {
        AppStorage.applyPendingMigrations();
      }
      initCatalog();
      if (typeof initTouchScrollerInputs === 'function') {
        initTouchScrollerInputs();
      }
      initDatePickerConstraints();
      if (typeof updateTimezoneDisplay === 'function') {
        updateTimezoneDisplay();
      }
      loadPhysicalProfile();
      renderLoggedSets();
      restoreWorkoutTimerState();
      if (typeof restoreRestTimerState === 'function') {
        restoreRestTimerState();
      }
      updateSetControlsUI();
      renderCalendar();
      renderWeightHistory();
      initSparkline();
      restoreSavedSession();
      restoreThemePreferences();
      restoreFontPreferences();
      restoreAppUIMode();
      initSquads();
      detectUserZipFromIP();
      checkAndResetDailyETCounter();
      renderHeatMap();
      updateGlobalStatsUI();
      updateCloudBackupUI();
      initUniqueVisitorCounter();
      initGlobalVisitorTelemetry();
      updateGlobalVisitorTelemetryUI();
      if (typeof restoreActiveTab === 'function') {
        restoreActiveTab();
      } else if (typeof renderHomeTab === 'function') {
        renderHomeTab();
      }
    });

    window.addEventListener('online', () => {
      if (googleAccessToken) {
        syncToGoogleDrive(true);
      }
    });
