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

  function hideNativeSplash() {
    if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SplashScreen) {
      try {
        window.Capacitor.Plugins.SplashScreen.hide({ fadeOutDuration: 200 });
      } catch (e) {}
    }
  }

  // 1. Initialize Native Plugins on device ready
  async function initNativeBridge() {
    if (!isNative()) return;

    // 1a. Immediately dismiss splash screen
    hideNativeSplash();

    // 1b. Configure Status Bar style
    try {
      if (window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar) {
        window.Capacitor.Plugins.StatusBar.setStyle({ style: 'DARK' }).catch(() => {});
        window.Capacitor.Plugins.StatusBar.setBackgroundColor({ color: '#020617' }).catch(() => {});
      }
    } catch (e) {}

    // 1c. Notify Capgo / OTA updater if present
    try {
      if (window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorUpdater) {
        window.Capacitor.Plugins.CapacitorUpdater.notifyAppReady().catch(() => {});
      }
    } catch (e) {}

    // 1d. Request notification permissions gracefully on native
    try {
      if (window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
        const perm = await window.Capacitor.Plugins.LocalNotifications.checkPermissions();
        if (perm && perm.display !== 'granted') {
          window.Capacitor.Plugins.LocalNotifications.requestPermissions().catch(() => {});
        }
      }
    } catch (e) {}

    // 1e. Initialize native GoogleAuth plugin if present
    try {
      const googleAuth = window.Capacitor.Plugins?.GoogleAuth || (typeof window.Capacitor.registerPlugin === 'function' ? window.Capacitor.registerPlugin('GoogleAuth') : null);
      if (googleAuth && typeof googleAuth.initialize === 'function') {
        const isIos = window.Capacitor.getPlatform?.() === 'ios';
        const clientId = isIos
          ? '115199141886-99m5rosha76ftskaeknj2e757mn0sb0t.apps.googleusercontent.com'
          : '115199141886-1a64f9jbjrg9c09q97pgl01348ou7dvk.apps.googleusercontent.com';

        googleAuth.initialize({
          clientId: clientId,
          serverClientId: '115199141886-1a64f9jbjrg9c09q97pgl01348ou7dvk.apps.googleusercontent.com',
          scopes: ['profile', 'email', 'https://www.googleapis.com/auth/drive.file'],
          grantOfflineAccess: false
        }).catch(() => {});
      }
    } catch (gErr) {
      console.warn("[NativeBridge] GoogleAuth setup notice:", gErr);
    }
  }

  // 1f. Perform Native Google Sign-In via ASWebAuthenticationSession / GIDSignIn / GoogleSignInClient
  async function signInNativeGoogle() {
    if (!isNative()) return null;
    const googleAuth = window.Capacitor.Plugins?.GoogleAuth || (typeof window.Capacitor.registerPlugin === 'function' ? window.Capacitor.registerPlugin('GoogleAuth') : null);
    if (!googleAuth || typeof googleAuth.signIn !== 'function') return null;

    const isIos = window.Capacitor.getPlatform?.() === 'ios';
    const clientId = isIos
      ? '115199141886-99m5rosha76ftskaeknj2e757mn0sb0t.apps.googleusercontent.com'
      : '115199141886-1a64f9jbjrg9c09q97pgl01348ou7dvk.apps.googleusercontent.com';

    try {
      await googleAuth.initialize({
        clientId: clientId,
        serverClientId: '115199141886-1a64f9jbjrg9c09q97pgl01348ou7dvk.apps.googleusercontent.com',
        scopes: ['profile', 'email', 'https://www.googleapis.com/auth/drive.file'],
        grantOfflineAccess: false
      });
    } catch (e) {}

    return await googleAuth.signIn();
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
    triggerNativeHaptic: triggerNativeHaptic,
    signInNativeGoogle: signInNativeGoogle
  };

  // Run on DOM ready, window load, deviceready, and short retry loop
  let initialized = false;
  function triggerInit() {
    if (initialized) return;
    if (isNative()) {
      initialized = true;
      initNativeBridge();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', triggerInit);
  } else {
    triggerInit();
  }
  window.addEventListener('load', triggerInit);
  document.addEventListener('deviceready', triggerInit);

  // Short retry loop to catch asynchronous Capacitor script injection
  for (const delay of [60, 150, 300, 600, 1200]) {
    setTimeout(triggerInit, delay);
  }

})(window);
