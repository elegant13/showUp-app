/* ==========================================================================
   ShowUp Native Bridge (Capacitor iOS / Android & Over-The-Air Updates)
   ========================================================================== */

(function (window) {
  'use strict';

  const REST_NOTIFICATION_ID = 4201;

  function isNative() {
    return typeof window !== 'undefined' &&
           Boolean(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }

  // 1. Initialize Native Plugins on device ready
  async function initNativeBridge() {
    if (!isNative()) return;

    try {
      // Notify Capgo / OTA updater that web bundle is loaded & healthy
      if (window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorUpdater) {
        await window.Capacitor.Plugins.CapacitorUpdater.notifyAppReady();
        console.log("[NativeBridge] Capgo OTA App Ready confirmed.");
      }

      // Configure Status Bar style
      if (window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar) {
        await window.Capacitor.Plugins.StatusBar.setStyle({ style: 'DARK' });
        await window.Capacitor.Plugins.StatusBar.setBackgroundColor({ color: '#020617' });
      }

      // Hide Splash Screen smoothly once UI is painted
      if (window.Capacitor.Plugins && window.Capacitor.Plugins.SplashScreen) {
        setTimeout(async () => {
          try {
            await window.Capacitor.Plugins.SplashScreen.hide({ fadeOutDuration: 300 });
          } catch (e) {}
        }, 300);
      }

      // Request notification permissions gracefully on native
      if (window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
        const perm = await window.Capacitor.Plugins.LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') {
          // Ask for permission on native
          window.Capacitor.Plugins.LocalNotifications.requestPermissions();
        }
      }
    } catch (err) {
      console.warn("[NativeBridge] Initialization notice:", err);
    }
  }

  // 2. Schedule Local Notification for Target Rest Recovery
  async function scheduleRestNotification(targetSeconds, exerciseName = '') {
    if (!isNative()) return;
    if (!window.Capacitor.Plugins || !window.Capacitor.Plugins.LocalNotifications) return;

    try {
      const atTime = new Date(Date.now() + (targetSeconds * 1000));
      const title = "Ready to Lift!";
      const body = exerciseName 
        ? `Target recovery reached (${targetSeconds}s). Ready for next set of ${exerciseName}!`
        : `Target rest of ${targetSeconds}s reached. You are fully recovered!`;

      await cancelRestNotification();

      await window.Capacitor.Plugins.LocalNotifications.schedule({
        notifications: [
          {
            id: REST_NOTIFICATION_ID,
            title: title,
            body: body,
            schedule: { at: atTime },
            sound: 'beep.wav',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#10b981',
            actionTypeId: '',
            extra: { type: 'rest_timer' }
          }
        ]
      });
    } catch (err) {
      console.warn("[NativeBridge] Failed to schedule rest notification:", err);
    }
  }

  // 3. Cancel scheduled rest notification (when user starts set or resets timer early)
  async function cancelRestNotification() {
    if (!isNative()) return;
    if (!window.Capacitor.Plugins || !window.Capacitor.Plugins.LocalNotifications) return;

    try {
      await window.Capacitor.Plugins.LocalNotifications.cancel({
        notifications: [{ id: REST_NOTIFICATION_ID }]
      });
    } catch (err) {
      console.warn("[NativeBridge] Failed to cancel rest notification:", err);
    }
  }

  // 4. Native Haptics Trigger
  async function triggerNativeHaptic(type = 'light') {
    if (!isNative() || !window.Capacitor.Plugins || !window.Capacitor.Plugins.Haptics) {
      return false; // Not handled, fallback to web navigator.vibrate
    }

    try {
      const Haptics = window.Capacitor.Plugins.Haptics;
      switch (type) {
        case 'light':
          await Haptics.impact({ style: 'LIGHT' });
          break;
        case 'medium':
          await Haptics.impact({ style: 'MEDIUM' });
          break;
        case 'heavy':
          await Haptics.impact({ style: 'HEAVY' });
          break;
        case 'recovery':
          await Haptics.notification({ type: 'SUCCESS' });
          break;
        default:
          await Haptics.impact({ style: 'LIGHT' });
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // Expose global NativeBridge
  window.NativeBridge = {
    isNative: isNative,
    scheduleRestNotification: scheduleRestNotification,
    cancelRestNotification: cancelRestNotification,
    triggerNativeHaptic: triggerNativeHaptic
  };

  // Run on DOM loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNativeBridge);
  } else {
    initNativeBridge();
  }

})(window);
