/* ==========================================================================
   showUp Application Bootstrap & Lifecycle Wiring
   ========================================================================== */

    window.addEventListener('DOMContentLoaded', () => {
      if (typeof AppStorage !== 'undefined' && typeof AppStorage.applyPendingMigrations === 'function') {
        AppStorage.applyPendingMigrations();
      }
      initCatalog();
      initDatePickerConstraints();
      loadPhysicalProfile();
      renderLoggedSets();
      restoreWorkoutTimerState();
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
      if (typeof renderHomeTab === 'function') {
        renderHomeTab();
      }
    });

    window.addEventListener('online', () => {
      if (googleAccessToken) {
        syncToGoogleDrive(true);
      }
    });
