/* ==========================================================================
   showUp Application Bootstrap & Lifecycle Wiring
   ========================================================================== */

    window.addEventListener('DOMContentLoaded', () => {
      initCatalog();
      initDatePickerConstraints();
      loadPhysicalProfile();
      renderLoggedSets();
      renderCalendar();
      renderWeightHistory();
      initSparkline();
      restoreSavedSession();
      restoreThemePreferences();
      restoreFontPreferences();
      initSquads();
      detectUserZipFromIP();
      checkAndResetDailyETCounter();
      renderHeatMap();
      updateGlobalStatsUI();
      updateCloudBackupUI();
      initUniqueVisitorCounter();
      initGlobalVisitorTelemetry();
      updateGlobalVisitorTelemetryUI();
    });

    window.addEventListener('online', () => {
      if (googleAccessToken) {
        syncToGoogleDrive(true);
      }
    });
