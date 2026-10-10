/* ==========================================================================
   showUp Authentication, Google Identity Services & Session Management
   ========================================================================== */

    function getAppUser() {
      const savedProfile = JSON.parse(localStorage.getItem('showUp_user_profile') || 'null');
      if (savedProfile && (savedProfile.firstName || savedProfile.email)) {
        return {
          id: savedProfile.id || savedProfile.uid || savedProfile.email || 'local_user',
          name: savedProfile.firstName ? `${savedProfile.firstName} (You)` : 'You',
          rawName: savedProfile.firstName || 'You',
          email: savedProfile.email || 'user@showup.app',
          picture: savedProfile.picture || null,
          isCurrentUser: true
        };
      }
      return {
        id: 'local_user',
        name: 'You',
        rawName: 'You',
        email: 'you@showup.app',
        picture: null,
        isCurrentUser: true
      };
    }

    // ================= SQUADS ENGINE (STRICT ATHLETE ISOLATION) =================


    function isCustomerLoggedIn() {
      const profile = JSON.parse(localStorage.getItem('showUp_user_profile') || 'null');
      const token = localStorage.getItem('showUp_google_token') || googleAccessToken;
      if (token) return true;
      if (profile && profile.email && profile.email !== 'you@showup.app' && profile.email !== 'user@showup.app') {
        return true;
      }
      return false;
    }



    function handleLogout(isSilent = false) {
      if (googleAccessToken && window.google?.accounts?.oauth2) {
        try {
          google.accounts.oauth2.revoke(googleAccessToken, () => {});
        } catch (e) {
          console.warn("Token revocation warning:", e);
        }
      }
      googleAccessToken = null;

      // Systematic user session and telemetry purge
      if (typeof AppStorage !== 'undefined' && typeof AppStorage.clearUserSession === 'function') {
        AppStorage.clearUserSession();
      }

      // 1. Wipe all authentication tokens & athlete profile
      localStorage.removeItem('showUp_google_token');
      localStorage.removeItem('showUp_user_profile');
      localStorage.removeItem('showUp_session_expiry');

      // 2. Wipe personal physical measurements & geo telemetry (including IP location cache)
      localStorage.removeItem('showUp_user_height');
      localStorage.removeItem('showUp_user_weight');
      localStorage.removeItem('showUp_user_zip');
      localStorage.removeItem('showUp_user_city');
      localStorage.removeItem('showUp_user_state');
      localStorage.removeItem('showUp_user_location_name');
      localStorage.removeItem('showUp_user_ip_zip');
      localStorage.removeItem('showUp_user_ip_city');
      localStorage.removeItem('showUp_user_ip_lat');
      localStorage.removeItem('showUp_user_ip_lng');
      localStorage.removeItem('showUp_global_visitors_log_v1');

      // 3. Wipe personal workout history, weight logs, and squads
      localStorage.removeItem('showUp_synced_workouts');
      localStorage.removeItem('showUp_weight_history');
      localStorage.removeItem('showUp_squads');
      localStorage.removeItem('showUp_squad_invites');
      localStorage.removeItem('showUp_global_squad_registry');
      localStorage.removeItem('showUp_squad_archive');

      // 4. Reset in-memory session variables
      completedWorkoutsHistory = [];
      weightHistory = [];
      currentSessionSets = [];
      userHeight = 70;
      userWeight = 165;

      if (window.google?.accounts?.id) {
        try {
          google.accounts.id.disableAutoSelect();
        } catch (e) {}
      }

      // 5. Reset Header profile badge & dropdown menu
      const dropdown = document.getElementById('profile-dropdown-menu');
      if (dropdown) dropdown.classList.add('hidden');
      const adminMenuItem = document.getElementById('profile-admin-telemetry-item');
      if (adminMenuItem) adminMenuItem.classList.add('hidden');
      const userProfileBadge = document.getElementById('google-user-profile');
      if (userProfileBadge) userProfileBadge.classList.add('hidden');
      const loginBtn = document.getElementById('btn-google-login');
      if (loginBtn) loginBtn.classList.remove('hidden');

      const firstNameEl = document.getElementById('user-first-name');
      if (firstNameEl) firstNameEl.innerText = 'User';
      const emailEl = document.getElementById('user-email');
      if (emailEl) emailEl.innerText = 'user@email.com';
      const dropdownEmailEl = document.getElementById('dropdown-user-email');
      if (dropdownEmailEl) dropdownEmailEl.innerText = 'user@email.com';
      const avatarEl = document.getElementById('user-avatar');
      if (avatarEl) avatarEl.src = 'https://lh3.googleusercontent.com/a/default-user=s96-c';

      // 6. Reset Settings Modal Physical Profile Inputs
      const hInput = document.getElementById('user-height-input');
      const wInput = document.getElementById('user-weight-input');
      if (hInput) hInput.value = '';
      if (wInput) wInput.value = '';

      // 7. Reset Map Telemetry & Zip Code Badges
      const zipDisplay = document.getElementById('display-user-zip');
      if (zipDisplay) zipDisplay.innerText = 'Detecting...';

      // 8. Re-render all UI views in pristine logged-out state
      updateCloudBackupUI();
      initSquads();
      renderSquadsTab();
      updateSquadBeacon();
      renderCalendar();
      renderMonthlyHistory();
      renderWeightHistory();
      updateGlobalStatsUI();
      renderHeatMap();
      updateGlobalVisitorTelemetryUI();
      if (typeof renderActiveSets === 'function') renderActiveSets();

      if (!isSilent) {
        showToast("Signed out. All personal data and squads cleared.", "info");
      }
    }

    function handleGoogleLogin() {
      handleGoogleSignIn();
    }



    function restoreSavedSession() {
      const savedProfile = JSON.parse(localStorage.getItem('showUp_user_profile') || 'null');
      let sessionExpiry = parseInt(localStorage.getItem('showUp_session_expiry') || '0', 10);
      const now = Date.now();

      // If user had an existing logged-in profile without an explicit expiry timestamp, establish 1-week window
      if (savedProfile && (!sessionExpiry || isNaN(sessionExpiry))) {
        sessionExpiry = now + SESSION_DURATION_MS;
        localStorage.setItem('showUp_session_expiry', String(sessionExpiry));
      }

      if (savedProfile && sessionExpiry > now) {
        // Active 1-week session: immediately restore profile UI so user never has to re-login
        updateProfileUI(savedProfile.firstName, savedProfile.email, savedProfile.picture);
        document.getElementById('btn-google-login').classList.add('hidden');
        document.getElementById('google-user-profile').classList.remove('hidden');
        updateCloudBackupUI();

        // Check and silently refresh Google Drive OAuth token in background without annoying popups
        attemptSilentTokenRefresh();
      } else if (savedProfile && sessionExpiry <= now) {
        // 1-week session duration expired
        console.info("1-week session expired. Requiring fresh login.");
        handleLogout(true);
      } else {
        // No session: attempt seamless Chrome Profile auto-select via Google One Tap
        tryGoogleOneTap();
      }
    }

    function attemptSilentTokenRefresh() {
      if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
        setTimeout(() => {
          if (typeof google !== 'undefined' && google.accounts?.oauth2) {
            attemptSilentTokenRefresh();
          }
        }, 1200);
        return;
      }

      if (googleAccessToken) {
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${googleAccessToken}` }
        })
        .then(res => {
          if (res.ok) {
            updateCloudBackupUI();
          } else if (res.status === 401) {
            requestTokenSilently();
          }
        })
        .catch(() => {
          updateCloudBackupUI();
        });
      } else {
        requestTokenSilently();
      }
    }

    function requestTokenSilently() {
      if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) return;
      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: getGoogleClientId(),
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          prompt: '', // Silent request without popup or re-consent
          callback: (response) => {
            if (response && response.access_token) {
              googleAccessToken = response.access_token;
              localStorage.setItem('showUp_google_token', googleAccessToken);
              // Extend 1-week session validity
              localStorage.setItem('showUp_session_expiry', String(Date.now() + SESSION_DURATION_MS));
              updateCloudBackupUI();
            }
          },
          error_callback: (err) => {
            console.log("Silent token refresh info:", err);
          }
        });
        client.requestAccessToken({ prompt: '' });
      } catch (err) {
        console.warn("Silent token request skipped:", err);
      }
    }

    function tryGoogleOneTap() {
      if (window.location.protocol === 'file:') return;
      const checkAndRun = () => {
        if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) return;
        const savedProfile = JSON.parse(localStorage.getItem('showUp_user_profile') || 'null');
        if (savedProfile) return;

        try {
          google.accounts.id.initialize({
            client_id: getGoogleClientId(),
            auto_select: true, // Seamlessly continue if user is logged into their Chrome profile
            callback: (response) => {
              if (response && response.credential) {
                const profile = parseJwtPayload(response.credential);
                if (profile) {
                  const firstName = profile.given_name || (profile.name ? profile.name.split(' ')[0] : 'User');
                  const userEmail = profile.email || '';
                  const picture = profile.picture || 'https://lh3.googleusercontent.com/a/default-user=s96-c';
                  const profileObj = { firstName, email: userEmail, picture };

                  localStorage.setItem('showUp_user_profile', JSON.stringify(profileObj));
                  localStorage.setItem('showUp_session_expiry', String(Date.now() + SESSION_DURATION_MS));

                  updateProfileUI(firstName, userEmail, picture);
                  document.getElementById('btn-google-login').classList.add('hidden');
                  document.getElementById('google-user-profile').classList.remove('hidden');
                  showToast(`Welcome back, ${firstName}!`, "success");

                  requestTokenSilently();
                }
              }
            }
          });
          google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              console.log("One Tap status:", notification.getNotDisplayedReason?.() || notification.getSkippedReason?.());
            }
          });
        } catch (e) {
          console.warn("One Tap initialization warning:", e);
        }
      };

      if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
        setTimeout(checkAndRun, 1500);
      } else {
        checkAndRun();
      }
    }



    function resetGoogleLoginButtonUI() {
      const btn = document.getElementById('btn-google-login');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-brands fa-google text-red-500"></i><span>Sign in</span>`;
      }
    }

    function setGoogleLoginLoading(isLoading) {
      const btn = document.getElementById('btn-google-login');
      if (btn) {
        if (isLoading) {
          btn.disabled = true;
          btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin text-emerald-400"></i><span>Signing in...</span>`;
        } else {
          resetGoogleLoginButtonUI();
        }
      }
    }

    function openAuthLoginModal() {
      const modal = document.getElementById('auth-login-modal');
      if (modal) modal.classList.remove('hidden');
    }

    function closeAuthLoginModal() {
      const modal = document.getElementById('auth-login-modal');
      if (modal) modal.classList.add('hidden');
    }

    function triggerGoogleOAuthFromModal() {
      closeAuthLoginModal();
      handleGoogleSignIn();
    }

    function applyUserProfile(profileObj) {
      localStorage.setItem('showUp_user_profile', JSON.stringify(profileObj));
      localStorage.setItem('showUp_session_expiry', String(Date.now() + SESSION_DURATION_MS));

      const firstName = profileObj.firstName || 'Athlete';
      const userEmail = profileObj.email || '';
      const picture = profileObj.picture || 'https://lh3.googleusercontent.com/a/default-user=s96-c';

      updateProfileUI(firstName, userEmail, picture);
      document.getElementById('btn-google-login').classList.add('hidden');
      document.getElementById('google-user-profile').classList.remove('hidden');
      updateCloudBackupUI();
      initSquads();
      renderSquadsTab();
      updateSquadBeacon();
      updateGlobalStatsUI();
      renderHeatMap();
      updateGlobalVisitorTelemetryUI();
      closeAuthLoginModal();
    }

    async function handleSuccessfulOAuthToken(token) {
      googleAccessToken = token;
      localStorage.setItem('showUp_google_token', googleAccessToken);
      localStorage.setItem('showUp_session_expiry', String(Date.now() + SESSION_DURATION_MS));

      // 1. Immediately activate logged-in UI
      document.getElementById('btn-google-login').classList.add('hidden');
      document.getElementById('google-user-profile').classList.remove('hidden');
      updateCloudBackupUI();

      // 2. Fetch User Profile non-blockingly with timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${googleAccessToken}` },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const profile = await res.json();
          const firstName = profile.given_name || (profile.name ? profile.name.split(' ')[0] : 'Athlete');
          const userEmail = profile.email || '';
          const picture = profile.picture || 'https://lh3.googleusercontent.com/a/default-user=s96-c';
          applyUserProfile({ firstName, email: userEmail, picture });
          showToast(`Signed in as ${firstName}`, "success");
        } else {
          applyUserProfile({ firstName: 'Athlete', email: '', picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c' });
          showToast("Signed in successfully!", "success");
        }
      } catch (err) {
        console.warn("User info fetch notice:", err);
        applyUserProfile({ firstName: 'Athlete', email: '', picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c' });
        showToast("Signed in successfully!", "success");
      }

      // 3. Asynchronously trigger silent Drive check in background
      setTimeout(async () => {
        try {
          if (completedWorkoutsHistory.length === 0) {
            await restoreFromGoogleDrive(true);
          } else {
            await syncToGoogleDrive(true);
          }
        } catch (driveErr) {
          console.warn("Background drive sync notice:", driveErr);
        }
      }, 1000);
    }

    function handleGoogleSignIn() {
      // If on file:// protocol or google SDK not loaded, open the resilient Auth Modal directly
      if (window.location.protocol === 'file:' || typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
        openAuthLoginModal();
        return;
      }

      setGoogleLoginLoading(true);
      const clientId = getGoogleClientId();

      // Safety timer: automatically reset button if popup is closed or stalled
      const safetyTimer = setTimeout(() => {
        setGoogleLoginLoading(false);
      }, 15000);

      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          prompt: 'select_account',
          callback: async (response) => {
            clearTimeout(safetyTimer);
            setGoogleLoginLoading(false);

            if (response.error) {
              console.warn("Google Auth Response Notice:", response);
              if (response.error === 'popup_closed_by_user') {
                showToast("Google sign-in popup was closed.", "info");
              } else if (response.error === 'access_denied') {
                showToast("Access permission denied by user.", "warning");
              } else {
                showToast("Google OAuth origin check: opening account login...", "info");
                openAuthLoginModal();
              }
              return;
            }

            if (response.access_token) {
              await handleSuccessfulOAuthToken(response.access_token);
            }
          },
          error_callback: (err) => {
            clearTimeout(safetyTimer);
            setGoogleLoginLoading(false);
            console.warn("Google OAuth error callback:", err);
            openAuthLoginModal();
          }
        });

        client.requestAccessToken({ prompt: 'select_account' });
      } catch (err) {
        clearTimeout(safetyTimer);
        setGoogleLoginLoading(false);
        console.warn("Failed to initialize Google Token Client:", err);
        openAuthLoginModal();
      }
    }



    function updateProfileUI(firstName, email, picture) {
      if (firstName) document.getElementById('user-first-name').innerText = firstName;
      if (email) {
        document.getElementById('user-email').innerText = email;
        document.getElementById('dropdown-user-email').innerText = email;
      }
      if (picture) document.getElementById('user-avatar').src = picture;

      // Re-link and preserve historical squads (like fitFamSwabhu) under authenticated account
      initSquads();
      renderSquadsTab();
      updateGlobalStatsUI();
      renderHeatMap();
      updateGlobalVisitorTelemetryUI();
    }
