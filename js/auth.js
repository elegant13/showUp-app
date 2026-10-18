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

        // Ensure user workouts are restored from storage immediately on app start
        if (typeof AppStorage !== 'undefined' && typeof AppStorage.getAthleteWorkouts === 'function') {
          const loaded = AppStorage.getAthleteWorkouts();
          if (Array.isArray(loaded) && loaded.length > 0) {
            completedWorkoutsHistory = loaded;
            localStorage.setItem('showUp_synced_workouts', JSON.stringify(completedWorkoutsHistory));
          }
        }

        if (typeof renderHomeTab === 'function') {
          try { renderHomeTab(); } catch (e) {}
        }
        renderCalendar();
        renderMonthlyHistory();

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
            if (typeof restoreFromGoogleDrive === 'function') {
              restoreFromGoogleDrive(true);
            }
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
          callback: async (response) => {
            if (response && response.access_token) {
              googleAccessToken = response.access_token;
              localStorage.setItem('showUp_google_token', googleAccessToken);
              // Extend 1-week session validity
              localStorage.setItem('showUp_session_expiry', String(Date.now() + SESSION_DURATION_MS));
              updateCloudBackupUI();
              try {
                await restoreFromGoogleDrive(true);
              } catch (e) {
                console.warn("Silent drive restore notice:", e);
              }
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

    function openAuthLoginModal(defaultTab = 'signin') {
      const modal = document.getElementById('auth-login-modal');
      if (modal) {
        modal.classList.remove('hidden');
        switchAuthTab(defaultTab);
        setAuthStatusMessage('', 'info');
      }
    }

    function closeAuthLoginModal() {
      const modal = document.getElementById('auth-login-modal');
      if (modal) modal.classList.add('hidden');
      setAuthStatusMessage('', 'info');
    }

    function triggerGoogleOAuthFromModal() {
      closeAuthLoginModal();
      handleGoogleSignIn();
    }

    // ==========================================================================
    // Email & Password Authentication Engine (Setup, Login, Reset)
    // ==========================================================================

    function getRegisteredAccounts() {
      if (typeof AppStorage !== 'undefined' && typeof AppStorage.getRegisteredAccounts === 'function') {
        return AppStorage.getRegisteredAccounts();
      }
      try {
        const raw = localStorage.getItem('showUp_registered_accounts');
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        return {};
      }
    }

    function saveRegisteredAccounts(accounts) {
      if (!accounts || typeof accounts !== 'object') return;
      try {
        localStorage.setItem('showUp_registered_accounts', JSON.stringify(accounts));
      } catch (e) {
        console.warn("Error saving accounts:", e);
      }
    }

    function switchAuthTab(tab) {
      const signinView = document.getElementById('auth-signin-view');
      const registerView = document.getElementById('auth-register-view');
      const resetView = document.getElementById('auth-reset-view');

      const signinTabBtn = document.getElementById('auth-tab-signin');
      const registerTabBtn = document.getElementById('auth-tab-register');

      if (signinView) signinView.classList.add('hidden');
      if (registerView) registerView.classList.add('hidden');
      if (resetView) resetView.classList.add('hidden');

      if (signinTabBtn) {
        signinTabBtn.className = "flex-1 py-2 text-xs font-bold rounded-xl transition text-slate-400 hover:text-slate-200";
      }
      if (registerTabBtn) {
        registerTabBtn.className = "flex-1 py-2 text-xs font-bold rounded-xl transition text-slate-400 hover:text-slate-200";
      }

      setAuthStatusMessage('', 'info');

      if (tab === 'register') {
        if (registerView) registerView.classList.remove('hidden');
        if (registerTabBtn) {
          registerTabBtn.className = "flex-1 py-2 text-xs font-black rounded-xl transition bg-emerald-500 text-slate-950 shadow-md";
        }
      } else if (tab === 'reset') {
        if (resetView) resetView.classList.remove('hidden');
      } else {
        if (signinView) signinView.classList.remove('hidden');
        if (signinTabBtn) {
          signinTabBtn.className = "flex-1 py-2 text-xs font-black rounded-xl transition bg-emerald-500 text-slate-950 shadow-md";
        }
      }
    }

    function setAuthStatusMessage(msg, type = 'error') {
      const banner = document.getElementById('auth-status-message');
      if (!banner) return;
      if (!msg) {
        banner.classList.add('hidden');
        banner.innerText = '';
        return;
      }
      banner.classList.remove('hidden');
      if (type === 'success') {
        banner.className = "p-2.5 rounded-xl text-xs font-semibold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center gap-2";
        banner.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400"></i><span>${msg}</span>`;
      } else if (type === 'info') {
        banner.className = "p-2.5 rounded-xl text-xs font-semibold bg-blue-500/15 border border-blue-500/40 text-blue-300 flex items-center gap-2";
        banner.innerHTML = `<i class="fa-solid fa-circle-info text-blue-400"></i><span>${msg}</span>`;
      } else {
        banner.className = "p-2.5 rounded-xl text-xs font-semibold bg-rose-500/15 border border-rose-500/40 text-rose-300 flex items-center gap-2";
        banner.innerHTML = `<i class="fa-solid fa-circle-exclamation text-rose-400"></i><span>${msg}</span>`;
      }
    }

    function togglePasswordVisibility(inputId, iconId) {
      const input = document.getElementById(inputId);
      const icon = document.getElementById(iconId);
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        if (icon) icon.className = "fa-solid fa-eye-slash text-slate-400";
      } else {
        input.type = 'password';
        if (icon) icon.className = "fa-solid fa-eye text-slate-400";
      }
    }

    function registerAthleteAccount(email, password, firstName, lastName = '', zip = '') {
      if (!email || !email.includes('@')) {
        return { success: false, error: "Please provide a valid email address." };
      }
      if (!password || password.length < 4) {
        return { success: false, error: "Password must be at least 4 characters." };
      }

      const accounts = getRegisteredAccounts();
      const normEmail = email.toLowerCase().trim();

      if (accounts[normEmail]) {
        return { success: false, error: "An account with this email already exists. Please sign in or reset your password." };
      }

      const athleteName = (firstName && firstName.trim()) ? firstName.trim() : normEmail.split('@')[0];
      const accountObj = {
        email: normEmail,
        password: password,
        firstName: athleteName,
        lastName: (lastName || '').trim(),
        zip: (zip || '').trim(),
        createdAt: new Date().toISOString()
      };

      accounts[normEmail] = accountObj;
      saveRegisteredAccounts(accounts);
      if (typeof AppStorage !== 'undefined' && typeof AppStorage.saveRegisteredAccount === 'function') {
        AppStorage.saveRegisteredAccount(accountObj);
      }

      // Automatically sign in the newly registered athlete
      const profile = {
        firstName: athleteName,
        lastName: accountObj.lastName,
        email: normEmail,
        picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
        authProvider: 'email_password'
      };
      applyUserProfile(profile);

      if (accountObj.zip && typeof saveUserZip === 'function') {
        saveUserZip(accountObj.zip);
      }

      if (typeof showToast === 'function') {
        showToast(`Account created! Welcome, ${athleteName}.`, 'success');
      }

      return { success: true, account: accountObj };
    }

    function loginAthleteWithEmailPassword(email, password) {
      if (!email || !email.includes('@')) {
        return { success: false, error: "Please enter your email address." };
      }
      if (!password) {
        return { success: false, error: "Please enter your password." };
      }

      const accounts = getRegisteredAccounts();
      const normEmail = email.toLowerCase().trim();
      const account = accounts[normEmail];

      if (!account) {
        return { success: false, error: "No account found with this email. Please click 'Set Up Account' to create one." };
      }

      if (account.password !== password) {
        return { success: false, error: "Incorrect password. Please verify or use 'Forgot password?' to reset." };
      }

      const profile = {
        firstName: account.firstName || normEmail.split('@')[0],
        lastName: account.lastName || '',
        email: normEmail,
        picture: account.picture || 'https://lh3.googleusercontent.com/a/default-user=s96-c',
        authProvider: 'email_password'
      };
      applyUserProfile(profile);

      if (account.zip && typeof saveUserZip === 'function') {
        saveUserZip(account.zip);
      }

      if (typeof showToast === 'function') {
        showToast(`Welcome back, ${profile.firstName}!`, 'success');
      }

      return { success: true, profile };
    }

    function resetAthletePassword(email, newPassword) {
      if (!email || !email.includes('@')) {
        return { success: false, error: "Please enter a valid email address." };
      }
      if (!newPassword || newPassword.length < 4) {
        return { success: false, error: "New password must be at least 4 characters." };
      }

      const accounts = getRegisteredAccounts();
      const normEmail = email.toLowerCase().trim();
      const account = accounts[normEmail];

      if (!account) {
        // Initialize an account so the user can immediately access showUp with their chosen password
        const newAccount = {
          email: normEmail,
          password: newPassword,
          firstName: normEmail.split('@')[0],
          lastName: '',
          zip: '',
          createdAt: new Date().toISOString()
        };
        accounts[normEmail] = newAccount;
        saveRegisteredAccounts(accounts);
        if (typeof AppStorage !== 'undefined' && typeof AppStorage.saveRegisteredAccount === 'function') {
          AppStorage.saveRegisteredAccount(newAccount);
        }
        return { success: true, message: "Password configured and account created. You can now sign in!" };
      }

      account.password = newPassword;
      account.updatedAt = new Date().toISOString();
      accounts[normEmail] = account;
      saveRegisteredAccounts(accounts);
      if (typeof AppStorage !== 'undefined' && typeof AppStorage.saveRegisteredAccount === 'function') {
        AppStorage.saveRegisteredAccount(account);
      }

      return { success: true, message: "Password reset successfully! You can now sign in with your new password." };
    }

    function handleEmailPasswordSignIn(e) {
      if (e && e.preventDefault) e.preventDefault();
      const emailInput = document.getElementById('auth-signin-email');
      const passInput = document.getElementById('auth-signin-password');
      if (!emailInput || !passInput) return;

      const email = emailInput.value.trim();
      const pass = passInput.value;

      const result = loginAthleteWithEmailPassword(email, pass);
      if (!result.success) {
        setAuthStatusMessage(result.error, 'error');
        if (typeof triggerHaptic === 'function') triggerHaptic('heavy');
      } else {
        closeAuthLoginModal();
      }
    }

    function handleEmailPasswordRegister(e) {
      if (e && e.preventDefault) e.preventDefault();
      const nameInput = document.getElementById('auth-register-name');
      const emailInput = document.getElementById('auth-register-email');
      const passInput = document.getElementById('auth-register-password');
      const zipInput = document.getElementById('auth-register-zip');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const pass = passInput ? passInput.value : '';
      const zip = zipInput ? zipInput.value.trim() : '';

      const result = registerAthleteAccount(email, pass, name, '', zip);
      if (!result.success) {
        setAuthStatusMessage(result.error, 'error');
        if (typeof triggerHaptic === 'function') triggerHaptic('heavy');
      } else {
        closeAuthLoginModal();
      }
    }

    function handleEmailPasswordReset(e) {
      if (e && e.preventDefault) e.preventDefault();
      const emailInput = document.getElementById('auth-reset-email');
      const newPassInput = document.getElementById('auth-reset-password');
      const confirmPassInput = document.getElementById('auth-reset-confirm-password');

      const email = emailInput ? emailInput.value.trim() : '';
      const newPass = newPassInput ? newPassInput.value : '';
      const confirmPass = confirmPassInput ? confirmPassInput.value : '';

      if (newPass !== confirmPass) {
        setAuthStatusMessage("Passwords do not match. Please ensure both passwords match.", 'error');
        if (typeof triggerHaptic === 'function') triggerHaptic('heavy');
        return;
      }

      const result = resetAthletePassword(email, newPass);
      if (!result.success) {
        setAuthStatusMessage(result.error, 'error');
        if (typeof triggerHaptic === 'function') triggerHaptic('heavy');
      } else {
        setAuthStatusMessage(result.message, 'success');
        if (typeof triggerHaptic === 'function') triggerHaptic('medium');
        // Pre-fill email in signin view and switch
        const signinEmail = document.getElementById('auth-signin-email');
        if (signinEmail) signinEmail.value = email;
        setTimeout(() => {
          switchAuthTab('signin');
          setAuthStatusMessage(result.message, 'success');
        }, 1200);
      }
    }

    function applyUserProfile(profileObj) {
      const prevProfile = JSON.parse(localStorage.getItem('showUp_user_profile') || 'null');
      const prevEmail = (prevProfile?.email || '').toLowerCase().trim();

      localStorage.setItem('showUp_user_profile', JSON.stringify(profileObj));
      localStorage.setItem('showUp_session_expiry', String(Date.now() + SESSION_DURATION_MS));

      const firstName = profileObj.firstName || 'Athlete';
      const userEmail = profileObj.email || '';
      const picture = profileObj.picture || 'https://lh3.googleusercontent.com/a/default-user=s96-c';

      // Athlete Profile Isolation & Preservation:
      if (userEmail && userEmail !== 'you@showup.app' && userEmail !== 'user@showup.app') {
        const isolatedKey = 'showUp_user_workouts_' + userEmail.toLowerCase().trim();
        const isolatedWorkouts = JSON.parse(localStorage.getItem(isolatedKey) || 'null');
        const isSwitchingFromDifferentAthlete = prevEmail && prevEmail !== 'you@showup.app' && prevEmail !== 'user@showup.app' && prevEmail !== userEmail.toLowerCase().trim();

        if (Array.isArray(isolatedWorkouts) && isolatedWorkouts.length > 0) {
          const currentLocal = isSwitchingFromDifferentAthlete ? [] : JSON.parse(localStorage.getItem('showUp_synced_workouts') || '[]');
          completedWorkoutsHistory = (typeof AppStorage !== 'undefined' && typeof AppStorage.mergeWorkouts === 'function')
            ? AppStorage.mergeWorkouts(isolatedWorkouts, currentLocal)
            : isolatedWorkouts;
          localStorage.setItem('showUp_synced_workouts', JSON.stringify(completedWorkoutsHistory));
          localStorage.setItem(isolatedKey, JSON.stringify(completedWorkoutsHistory));
        } else if (!isSwitchingFromDifferentAthlete) {
          const currentLocal = JSON.parse(localStorage.getItem('showUp_synced_workouts') || '[]');
          if (Array.isArray(currentLocal) && currentLocal.length > 0) {
            completedWorkoutsHistory = currentLocal;
            localStorage.setItem('showUp_synced_workouts', JSON.stringify(completedWorkoutsHistory));
            localStorage.setItem(isolatedKey, JSON.stringify(completedWorkoutsHistory));
          } else {
            completedWorkoutsHistory = [];
            localStorage.setItem('showUp_synced_workouts', JSON.stringify([]));
          }
        } else {
          completedWorkoutsHistory = [];
          localStorage.setItem('showUp_synced_workouts', JSON.stringify([]));
          localStorage.setItem(isolatedKey, JSON.stringify([]));
        }
      }

      updateProfileUI(firstName, userEmail, picture);
      document.getElementById('btn-google-login').classList.add('hidden');
      document.getElementById('google-user-profile').classList.remove('hidden');
      updateCloudBackupUI();
      initSquads();
      if (typeof fetchAthleteSquadsFromFirestore === 'function') {
        try { fetchAthleteSquadsFromFirestore(profileObj); } catch (e) {}
      }
      renderSquadsTab();
      updateSquadBeacon();
      updateGlobalStatsUI();
      renderHeatMap();
      if (typeof renderHomeTab === 'function') {
        try { renderHomeTab(); } catch (e) {}
      }
      renderCalendar();
      renderMonthlyHistory();
      updateGlobalVisitorTelemetryUI();
      closeAuthLoginModal();

      // Automatically retrieve cloud workouts and squads from Google Drive if authorized
      if (googleAccessToken && typeof restoreFromGoogleDrive === 'function') {
        setTimeout(async () => {
          try {
            await restoreFromGoogleDrive(true);
          } catch (e) {
            console.debug("Silent auto-restore on login profile notice:", e);
          }
        }, 150);
      }
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

      // 3. Immediately restore cloud backup from Google Drive by default on login!
      // This ensures squads and activity from Google backup are instantly reflected upon login.
      setTimeout(async () => {
        try {
          await restoreFromGoogleDrive(false);
        } catch (driveErr) {
          console.warn("Auto-restore on login notice:", driveErr);
        }
      }, 300);
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
