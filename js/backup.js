/* ==========================================================================
   showUp Backup & Multi-Tier Cloud Sync Engine: Offline JSON & Google Drive
   ========================================================================== */

    function triggerManualFileRestore() {
      const fileInput = document.getElementById('manual-backup-file-input');
      if (fileInput) {
        fileInput.click();
      }
    }



    function getBackupPayload() {
      return {
        app: "showUp",
        version: "2.0",
        lastSyncedAt: localStorage.getItem('showUp_last_drive_sync') || new Date().toISOString(),
        profile: {
          height: userHeight,
          weight: userWeight
        },
        workouts: completedWorkoutsHistory,
        weightHistory: weightHistory,
        squads: getSquads(),
        activeSession: currentSessionSets
      };
    }

    function getFormattedBackupSize() {
      const payload = getBackupPayload();
      const jsonStr = JSON.stringify(payload, null, 2);
      const bytes = new Blob([jsonStr]).size;
      return {
        formatted: formatBytes(bytes),
        exactBytes: bytes.toLocaleString() + ' bytes',
        rawBytes: bytes,
        workoutCount: (payload.workouts || []).length,
        squadCount: (payload.squads || []).length,
        weightCount: (payload.weightHistory || []).length
      };
    }

    function openGDriveBackupModal() {
      const modal = document.getElementById('gdrive-backup-active-modal');
      if (!modal) return;

      const profile = JSON.parse(localStorage.getItem('showUp_user_profile') || 'null');
      const email = profile?.email || 'Not signed in';
      const name = profile?.name || 'Local User';
      const avatar = profile?.picture;

      const userAvatarEl = document.getElementById('gdrive-modal-user-avatar');
      const userNameEl = document.getElementById('gdrive-modal-user-name');
      const userEmailEl = document.getElementById('gdrive-modal-user-email');
      const filesizeEl = document.getElementById('gdrive-modal-filesize');
      const exactBytesEl = document.getElementById('gdrive-modal-exact-bytes');
      const countWorkoutsEl = document.getElementById('gdrive-modal-count-workouts');
      const countSquadsEl = document.getElementById('gdrive-modal-count-squads');
      const countWeightsEl = document.getElementById('gdrive-modal-count-weights');
      const lastSyncedEl = document.getElementById('gdrive-modal-last-synced');
      const statusBadgeEl = document.getElementById('gdrive-modal-status-text');
      const syncBadgeEl = document.getElementById('gdrive-modal-sync-badge');

      if (userNameEl) userNameEl.innerText = name;
      if (userEmailEl) userEmailEl.innerText = email;
      if (userAvatarEl) {
        if (avatar) {
          userAvatarEl.innerHTML = `<img src="${avatar}" class="w-full h-full rounded-xl object-cover" alt="User">`;
        } else {
          userAvatarEl.innerText = getInitials(name);
        }
      }

      const sizeInfo = getFormattedBackupSize();
      if (filesizeEl) filesizeEl.innerText = sizeInfo.formatted;
      if (exactBytesEl) exactBytesEl.innerText = `(${sizeInfo.exactBytes})`;
      if (countWorkoutsEl) countWorkoutsEl.innerText = sizeInfo.workoutCount;
      if (countSquadsEl) countSquadsEl.innerText = sizeInfo.squadCount;
      if (countWeightsEl) countWeightsEl.innerText = sizeInfo.weightCount;

      const lastSyncIso = localStorage.getItem('showUp_last_drive_sync');
      if (lastSyncedEl) {
        if (lastSyncIso) {
          try {
            const d = new Date(lastSyncIso);
            lastSyncedEl.innerText = d.toLocaleDateString() + ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } catch(e) {
            lastSyncedEl.innerText = lastSyncIso;
          }
        } else {
          lastSyncedEl.innerText = googleAccessToken ? 'Pending next workout completion' : 'Not yet synced';
        }
      }

      if (statusBadgeEl) {
        statusBadgeEl.innerText = googleAccessToken ? "Active & Connected" : "Sign-In Required";
        statusBadgeEl.className = googleAccessToken 
          ? "text-[10px] font-bold uppercase tracking-wider text-emerald-400"
          : "text-[10px] font-bold uppercase tracking-wider text-amber-400";
      }

      if (syncBadgeEl) {
        syncBadgeEl.innerText = googleAccessToken ? "Auto-Sync On" : "Offline";
        syncBadgeEl.className = googleAccessToken
          ? "text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex-shrink-0"
          : "text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex-shrink-0";
      }

      modal.classList.remove('hidden');
    }

    function closeGDriveBackupModal() {
      const modal = document.getElementById('gdrive-backup-active-modal');
      if (modal) modal.classList.add('hidden');
    }

    function dismissCloudBackupBanner() {
      try {
        localStorage.setItem('showUp_backup_banner_dismissed', 'true');
      } catch (e) {}
      const banner = document.getElementById('cloud-backup-reminder-banner');
      if (banner) {
        banner.style.transition = 'opacity 0.25s ease, max-height 0.3s ease, margin 0.3s ease, padding 0.3s ease';
        banner.style.opacity = '0';
        banner.style.maxHeight = '0px';
        banner.style.paddingTop = '0px';
        banner.style.paddingBottom = '0px';
        banner.style.marginTop = '0px';
        banner.style.marginBottom = '0px';
        setTimeout(() => {
          banner.classList.add('hidden');
          banner.style = '';
        }, 300);
      }
    }

    function updateCloudBackupUI() {
      const banner = document.getElementById('cloud-backup-reminder-banner');
      const bannerBadge = document.getElementById('backup-banner-badge');
      const bannerTitle = document.getElementById('backup-banner-title');
      const bannerDesc = document.getElementById('backup-banner-desc');
      const bannerGoogleBtn = document.getElementById('backup-banner-google-btn');
      const settingsBadge = document.getElementById('settings-backup-status-badge');
      const gdrivePill = document.getElementById('settings-gdrive-status-pill');
      const timeValEl = document.getElementById('settings-gdrive-time-val');
      const firestorePill = document.getElementById('settings-firestore-status-pill');
      const firestoreTimeValEl = document.getElementById('settings-firestore-time-val');

      const lastSyncIso = localStorage.getItem('showUp_last_drive_sync');
      if (timeValEl) {
        if (lastSyncIso) {
          try {
            const d = new Date(lastSyncIso);
            const datePart = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            const timePart = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
            timeValEl.innerText = `${datePart}, ${timePart}`;
          } catch (e) {
            timeValEl.innerText = lastSyncIso;
          }
        } else {
          timeValEl.innerText = googleAccessToken ? "Ready to sync" : "Not backed up yet";
        }
      }

      const lastFirestoreSyncIso = localStorage.getItem('showUp_last_firestore_sync');
      const isAthleteLoggedIn = (typeof isCustomerLoggedIn === 'function') ? isCustomerLoggedIn() : !!googleAccessToken;

      if (firestoreTimeValEl) {
        if (lastFirestoreSyncIso) {
          try {
            const d = new Date(lastFirestoreSyncIso);
            const datePart = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            const timePart = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
            firestoreTimeValEl.innerText = `${datePart}, ${timePart}`;
          } catch (e) {
            firestoreTimeValEl.innerText = lastFirestoreSyncIso;
          }
        } else {
          firestoreTimeValEl.innerText = isAthleteLoggedIn ? "Ready to sync" : "Not backed up yet";
        }
      }

      if (firestorePill) {
        firestorePill.className = isAthleteLoggedIn
          ? "text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          : "text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700";
        firestorePill.innerText = isAthleteLoggedIn ? "Connected" : "Offline";
      }

      const isDismissed = (function() {
        try {
          return localStorage.getItem('showUp_backup_banner_dismissed') === 'true';
        } catch (e) {
          return false;
        }
      })();

      if (googleAccessToken || isAthleteLoggedIn || isDismissed) {
        // Once athlete is signed in (Google, Email/Password) or manually dismissed, hide reminder banner
        if (banner) {
          banner.classList.add('hidden');
        }
        if (settingsBadge) {
          settingsBadge.className = (googleAccessToken || isAthleteLoggedIn)
            ? "text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
            : "text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-700";
          settingsBadge.innerText = (googleAccessToken || isAthleteLoggedIn) ? "Cloud Synced" : "Offline Device";
        }
        if (gdrivePill) {
          gdrivePill.className = googleAccessToken
            ? "text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700";
          gdrivePill.innerText = googleAccessToken ? "Connected" : "Offline";
        }
      } else {
        if (banner) {
          banner.classList.remove('hidden');
        }
        if (bannerBadge) {
          bannerBadge.className = "text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30";
          bannerBadge.innerText = "Sign-in Recommended";
        }
        if (bannerTitle) bannerTitle.innerText = "Protect Your Workout & Squad Data";
        if (bannerDesc) bannerDesc.innerText = "Sign in to auto-sync your workouts, weight logs, and squads to Cloud storage, or back up manually to your device and restore anytime.";
        if (bannerGoogleBtn) {
          bannerGoogleBtn.innerHTML = `<i class="fa-brands fa-google text-xs"></i><span>Sign In for Auto-Backup</span>`;
          bannerGoogleBtn.onclick = () => { triggerHaptic('medium'); handleGoogleLogin(); };
        }
        if (settingsBadge) {
          settingsBadge.className = "text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-700";
          settingsBadge.innerText = "Offline Device";
        }
        if (gdrivePill) {
          gdrivePill.className = "text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700";
          gdrivePill.innerText = "Offline";
        }
      }
    }



    function requestDriveAuthorization(autoSyncAfter = true) {
      if (window.location.protocol === 'file:') {
        alert("Google Drive authorization requires running showUp via HTTP or HTTPS (e.g. http://localhost:3000 or GitHub Pages).");
        return;
      }
      if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
        showToast("Google Identity SDK is loading. Please retry in a moment.", "warning");
        return;
      }

      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: getGoogleClientId(),
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          prompt: 'consent', // Explicitly trigger Google consent dialog so user grants Drive scopes
          callback: async (response) => {
            if (response && response.access_token) {
              googleAccessToken = response.access_token;
              localStorage.setItem('showUp_google_token', googleAccessToken);
              localStorage.setItem('showUp_session_expiry', String(Date.now() + SESSION_DURATION_MS));
              updateCloudBackupUI();
              showToast("Google Drive backup permission granted!", "success");
              if (autoSyncAfter) {
                await syncToGoogleDrive(false);
              }
            } else if (response && response.error) {
              console.warn("Drive authorization canceled or error:", response);
              if (response.error === 'popup_closed_by_user') {
                showToast("Google Drive permission dialog was closed.", "info");
              } else {
                showToast(`Drive permission: ${response.error_description || response.error}`, "warning");
              }
            }
          },
          error_callback: (err) => {
            console.warn("Drive authorization error callback:", err);
            if (err && err.type === 'popup_closed') {
              showToast("Google Drive permission window was closed.", "info");
            } else {
              showToast("Google Drive authorization interrupted.", "info");
            }
          }
        });
        client.requestAccessToken({ prompt: 'consent' });
      } catch (err) {
        console.error("Failed to request Drive authorization:", err);
        showToast(`Authorization error: ${err.message}`, "error");
      }
    }



    async function syncToGoogleDrive(isSilent = false) {
      if (!googleAccessToken) {
        if (!isSilent) {
          showToast("Authorizing Google Drive backup...", "info");
          requestDriveAuthorization(true);
        }
        return;
      }

      const syncIcon = document.getElementById('sync-icon');
      if (syncIcon) syncIcon.className = "fa-brands fa-google-drive text-xs animate-pulse text-amber-400";
      if (!isSilent) showToast("Backing up workout data to Google Drive...", "info");

      let workoutsToSync = (Array.isArray(completedWorkoutsHistory) && completedWorkoutsHistory.length > 0)
        ? completedWorkoutsHistory
        : (typeof AppStorage !== 'undefined' && typeof AppStorage.getAthleteWorkouts === 'function' ? AppStorage.getAthleteWorkouts() : []);

      if (workoutsToSync.length > 0 && typeof completedWorkoutsHistory !== 'undefined' && completedWorkoutsHistory.length === 0) {
        completedWorkoutsHistory = workoutsToSync;
      }

      const backupPayload = {
        app: "showUp",
        version: "2.0",
        lastSyncedAt: new Date().toISOString(),
        profile: {
          height: userHeight,
          weight: userWeight,
          theme: localStorage.getItem('showUp_theme') || 'emerald',
          font: localStorage.getItem('showUp_font') || 'font-jakarta'
        },
        theme: localStorage.getItem('showUp_theme') || 'emerald',
        font: localStorage.getItem('showUp_font') || 'font-jakarta',
        workouts: workoutsToSync,
        weightHistory: weightHistory,
        squads: getSquads(),
        activeSession: currentSessionSets
      };

      let fileContent = JSON.stringify(backupPayload, null, 2);

      try {
        // 1. Search for existing showUp backup file in Google Drive
        const query = encodeURIComponent(`(name='${BACKUP_FILENAME}' or name='showUp_workout_data.json' or name='showUp_backup.json') and trashed=false`);
        const searchRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime)`,
          {
            headers: { 'Authorization': `Bearer ${googleAccessToken}` }
          }
        );

        if (searchRes.status === 401 || searchRes.status === 403) {
          const errData = await searchRes.json().catch(() => ({}));
          const errMsg = (errData.error?.message || '').toLowerCase();
          const isScopeErr = searchRes.status === 403 || errMsg.includes('insufficient') || errMsg.includes('scope');

          googleAccessToken = null;
          localStorage.removeItem('showUp_google_token');

          if (isScopeErr) {
            console.warn("Drive scope insufficient. Prompting for Google Drive permission...");
            if (!isSilent) {
              showToast("Google Drive backup permission needed. Opening authorization...", "info");
              requestDriveAuthorization(true);
            }
          } else {
            console.warn("Drive token expired during sync. Refreshing token silently...");
            requestTokenSilently();
            if (!isSilent) {
              showToast("Google authorization refreshed. Click backup to sync.", "info");
            }
          }
          return;
        }

        if (!searchRes.ok) {
          const errData = await searchRes.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Search failed with status ${searchRes.status}`);
        }

        const searchData = await searchRes.json();
        let fileId = null;

        if (searchData.files && searchData.files.length > 0) {
          fileId = searchData.files[0].id;

          // Merge with any existing remote workouts so historical data is never wiped
          try {
            const existingRes = await fetch(
              `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
              { headers: { 'Authorization': `Bearer ${googleAccessToken}` } }
            );
            if (existingRes.ok) {
              const existingData = await existingRes.json().catch(() => null);
              if (existingData && Array.isArray(existingData.workouts) && existingData.workouts.length > 0) {
                const merged = (typeof AppStorage !== 'undefined' && typeof AppStorage.mergeWorkouts === 'function')
                  ? AppStorage.mergeWorkouts(workoutsToSync, existingData.workouts)
                  : workoutsToSync;
                workoutsToSync = merged;
                completedWorkoutsHistory = merged;
                if (typeof AppStorage !== 'undefined' && typeof AppStorage.saveAthleteWorkouts === 'function') {
                  AppStorage.saveAthleteWorkouts(merged);
                }
                backupPayload.workouts = merged;
                fileContent = JSON.stringify(backupPayload, null, 2);
              }
            }
          } catch (e) {
            console.debug("Existing file read notice during sync:", e);
          }

          // 2a. Update existing file content directly via media upload
          const updateRes = await fetch(
            `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${googleAccessToken}`,
                'Content-Type': 'application/json'
              },
              body: fileContent
            }
          );

          if (!updateRes.ok) {
            if (updateRes.status === 401 || updateRes.status === 403) {
              googleAccessToken = null;
              localStorage.removeItem('showUp_google_token');
              if (!isSilent) {
                showToast("Refreshing Google Drive authorization...", "info");
                requestDriveAuthorization(true);
              }
              return;
            }
            const errData = await updateRes.json().catch(() => ({}));
            throw new Error(errData.error?.message || `Upload failed with status ${updateRes.status}`);
          }
        } else {
          // 2b. Create new backup file in Google Drive
          const createMetaRes = await fetch(
            'https://www.googleapis.com/drive/v3/files',
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${googleAccessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                name: BACKUP_FILENAME,
                mimeType: 'application/json',
                description: 'showUp Workout & Squads Progress Data Backup'
              })
            }
          );

          if (!createMetaRes.ok) {
            if (createMetaRes.status === 401 || createMetaRes.status === 403) {
              googleAccessToken = null;
              localStorage.removeItem('showUp_google_token');
              if (!isSilent) {
                showToast("Refreshing Google Drive authorization...", "info");
                requestDriveAuthorization(true);
              }
              return;
            }
            const errData = await createMetaRes.json().catch(() => ({}));
            throw new Error(errData.error?.message || `File creation failed with status ${createMetaRes.status}`);
          }

          const createdFile = await createMetaRes.json();
          fileId = createdFile.id;

          const uploadRes = await fetch(
            `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${googleAccessToken}`,
                'Content-Type': 'application/json'
              },
              body: fileContent
            }
          );

          if (!uploadRes.ok) {
            if (uploadRes.status === 401 || uploadRes.status === 403) {
              googleAccessToken = null;
              localStorage.removeItem('showUp_google_token');
              if (!isSilent) {
                showToast("Refreshing Google Drive authorization...", "info");
                requestDriveAuthorization(true);
              }
              return;
            }
            const errData = await uploadRes.json().catch(() => ({}));
            throw new Error(errData.error?.message || `Content upload failed with status ${uploadRes.status}`);
          }
        }

        const nowIso = new Date().toISOString();
        localStorage.setItem('showUp_last_drive_sync', nowIso);

        if (syncIcon) syncIcon.className = "fa-solid fa-check text-xs text-emerald-400";
        if (!isSilent) showToast("Successfully backed up workouts and squads to Google Drive!", "success");

        updateCloudBackupUI();
        const gdriveModal = document.getElementById('gdrive-backup-active-modal');
        if (gdriveModal && !gdriveModal.classList.contains('hidden')) {
          openGDriveBackupModal();
        }

        setTimeout(() => {
          if (syncIcon) syncIcon.className = "fa-brands fa-google-drive text-xs text-emerald-400";
        }, 2000);

      } catch (err) {
        console.error("Google Drive sync error:", err);
        if (syncIcon) syncIcon.className = "fa-brands fa-google-drive text-xs text-rose-400";
        const errMsg = (err.message || '').toLowerCase();
        if (errMsg.includes('insufficient') || errMsg.includes('scope') || errMsg.includes('permission')) {
          googleAccessToken = null;
          localStorage.removeItem('showUp_google_token');
          if (!isSilent) {
            showToast("Google Drive backup permission needed. Opening authorization...", "info");
            requestDriveAuthorization(true);
          }
        } else {
          if (!isSilent) showToast(`Drive Sync failed: ${err.message}`, "error");
        }
      }
    }

    async function restoreFromGoogleDrive(isAutoCheck = false) {
      if (!googleAccessToken) {
        if (!isAutoCheck) {
          showToast("Authorizing Google Drive to restore...", "info");
          requestDriveAuthorization(false);
        }
        return;
      }

      if (!isAutoCheck) showToast("Syncing cloud activity & squads from Google Drive...", "info");

      try {
        const query = encodeURIComponent(`(name='${BACKUP_FILENAME}' or name='showUp_workout_data.json' or name='showUp_backup.json') and trashed=false`);
        const searchRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime)`,
          {
            headers: { 'Authorization': `Bearer ${googleAccessToken}` }
          }
        );

        if (searchRes.status === 401 || searchRes.status === 403) {
          const errData = await searchRes.json().catch(() => ({}));
          const errMsg = (errData.error?.message || '').toLowerCase();
          const isScopeErr = searchRes.status === 403 || errMsg.includes('insufficient') || errMsg.includes('scope');

          googleAccessToken = null;
          localStorage.removeItem('showUp_google_token');

          if (isScopeErr) {
            console.warn("Drive scope insufficient during restore. Prompting for Drive permission...");
            if (!isAutoCheck) {
              showToast("Google Drive backup permission needed. Opening authorization...", "info");
              requestDriveAuthorization(false);
            }
          } else {
            console.warn("Drive token expired during restore. Refreshing token silently...");
            requestTokenSilently();
            if (!isAutoCheck) {
              showToast("Google authorization refreshed. Click restore to re-sync.", "info");
            }
          }
          return;
        }

        const searchData = await searchRes.json();
        if (!searchData.files || searchData.files.length === 0) {
          if (!isAutoCheck) showToast("No existing showUp backup found in Google Drive.", "warning");
          return;
        }

        const fileId = searchData.files[0].id;
        const downloadRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          {
            headers: { 'Authorization': `Bearer ${googleAccessToken}` }
          }
        );

        if (!downloadRes.ok) {
          throw new Error(`Failed to download backup file (status ${downloadRes.status})`);
        }

        const backupData = await downloadRes.json();
        let restoredCount = 0;
        let restoredSquadsCount = 0;
        const user = getAppUser();
        const userEmail = (user?.email || '').toLowerCase().trim();
        const userName = (user?.rawName || user?.name || '').toLowerCase().trim();

        if (backupData.workouts && Array.isArray(backupData.workouts)) {
          const currentLocal = (typeof AppStorage !== 'undefined' && typeof AppStorage.getAthleteWorkouts === 'function')
            ? AppStorage.getAthleteWorkouts()
            : (Array.isArray(completedWorkoutsHistory) ? completedWorkoutsHistory : []);
          const merged = (typeof AppStorage !== 'undefined' && typeof AppStorage.mergeWorkouts === 'function')
            ? AppStorage.mergeWorkouts(currentLocal, backupData.workouts)
            : backupData.workouts;

          completedWorkoutsHistory = merged;
          if (typeof AppStorage !== 'undefined' && typeof AppStorage.saveAthleteWorkouts === 'function') {
            AppStorage.saveAthleteWorkouts(completedWorkoutsHistory);
          } else {
            localStorage.setItem('showUp_synced_workouts', JSON.stringify(completedWorkoutsHistory));
            if (userEmail && userEmail !== 'you@showup.app' && userEmail !== 'user@showup.app') {
              try {
                localStorage.setItem('showUp_user_workouts_' + userEmail, JSON.stringify(completedWorkoutsHistory));
              } catch (e) {}
            }
          }
          restoredCount = completedWorkoutsHistory.length;

          // If local had unsynced workouts that were just merged, silently push merged backup to Drive
          if (completedWorkoutsHistory.length > backupData.workouts.length) {
            setTimeout(() => { syncToGoogleDrive(true); }, 800);
          }
        }

        if (backupData.weightHistory && Array.isArray(backupData.weightHistory)) {
          weightHistory = backupData.weightHistory;
          localStorage.setItem('showUp_weight_history', JSON.stringify(weightHistory));
        }

        if (backupData.profile) {
          if (backupData.profile.height) {
            userHeight = backupData.profile.height;
            localStorage.setItem('showUp_user_height', userHeight);
          }
          if (backupData.profile.weight) {
            userWeight = backupData.profile.weight;
            localStorage.setItem('showUp_user_weight', userWeight);
          }
          if (backupData.profile.theme) {
            setThemePalette(backupData.profile.theme);
          }
          loadPhysicalProfile();
        }

        if (backupData.theme) {
          setThemePalette(backupData.theme);
        }

        if (backupData.font) {
          setFontFamily(backupData.font);
        }

        if (backupData.squads && Array.isArray(backupData.squads)) {
          const rawSquads = backupData.squads.filter(s => s && s.id !== 'squad_iron_collective' && s.name !== 'Iron Collective');
          // Only restore squads where athlete is creator or legitimately in members
          const cleanSquads = rawSquads.filter(sq => isAthleteMemberOrCreator(sq, user));
          cleanSquads.forEach(sq => {
            if (!sq.members) sq.members = [];

            // 1. Re-assign creator ownership to the authenticated athlete if it was local_user or matches
            if (!sq.creatorId || sq.creatorId === 'local_user' || (sq.creatorEmail && sq.creatorEmail.toLowerCase().trim() === userEmail) || (sq.creator && sq.creator.toLowerCase().trim() === userName)) {
              sq.creatorId = user.id;
              sq.creatorEmail = user.email;
              sq.creatorName = user.name;
            }

            // 2. Ensure the athlete is represented in sq.members
            let match = sq.members.find(m => {
              if (!m) return false;
              if (typeof m === 'string') return m === user.id || (userEmail && m.toLowerCase().trim() === userEmail);
              return m.id === user.id || (userEmail && m.email && m.email.toLowerCase().trim() === userEmail) || m.id === 'local_user';
            });

            if (match && typeof match === 'object') {
              match.id = user.id;
              match.name = user.name;
              match.rawName = user.rawName;
              match.email = user.email;
              if (user.picture) match.avatar = user.picture;
              if (sq.creatorId === user.id) match.isCreator = true;
            }
          });

          saveSquads(cleanSquads);
          initSquads();
          restoredSquadsCount = cleanSquads.length;
        }

        if (typeof renderHomeTab === 'function') {
          try { renderHomeTab(); } catch (e) { console.error("renderHomeTab error:", e); }
        }
        renderCalendar();
        renderMonthlyHistory();
        renderWeightHistory();
        initSquads();
        renderSquadsTab();
        updateSquadBeacon();
        updateGlobalStatsUI();
        renderHeatMap();

        localStorage.setItem('showUp_last_drive_sync', new Date().toISOString());

        if (restoredCount > 0 || restoredSquadsCount > 0) {
          const squadMsg = restoredSquadsCount > 0 ? ` and ${restoredSquadsCount} squad${restoredSquadsCount === 1 ? '' : 's'}` : '';
          showToast(`Restored ${restoredCount} workout${restoredCount === 1 ? '' : 's'}${squadMsg} from Google Drive!`, "success");
        } else if (!isAutoCheck) {
          showToast("Cloud backup synced with Google Drive.", "info");
        }

      } catch (err) {
        console.error("Google Drive restore error:", err);
        const errMsg = (err.message || '').toLowerCase();
        if (errMsg.includes('insufficient') || errMsg.includes('scope') || errMsg.includes('permission')) {
          googleAccessToken = null;
          localStorage.removeItem('showUp_google_token');
          if (!isAutoCheck) {
            showToast("Google Drive backup permission needed. Opening authorization...", "info");
            requestDriveAuthorization(false);
          }
        } else {
          showToast(`Drive Restore error: ${err.message}`, "error");
        }
      }
    }



    function exportJSONBackup() {
      const fullBackup = {
        app: "showUp",
        version: "2.0",
        exportedAt: new Date().toISOString(),
        theme: localStorage.getItem('showUp_theme') || localStorage.getItem('showUp_theme_accent') || 'emerald',
        font: localStorage.getItem('showUp_font') || 'font-jakarta',
        profile: {
          height: userHeight,
          weight: userWeight,
          theme: localStorage.getItem('showUp_theme') || 'emerald'
        },
        workouts: completedWorkoutsHistory,
        weightHistory: weightHistory,
        squads: getSquads(),
        squadInvites: getSquadInvites(),
        globalSquadRegistry: getGlobalSquadRegistry(),
        activeSession: currentSessionSets
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `showUp_backup_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Offline JSON backup with squads exported successfully!", "success");
    }

    function importJSONBackup(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          let count = 0;
          let squadsCount = 0;

          if (Array.isArray(data)) {
            completedWorkoutsHistory = (typeof AppStorage !== 'undefined' && typeof AppStorage.mergeWorkouts === 'function')
              ? AppStorage.mergeWorkouts(completedWorkoutsHistory, data)
              : data;
            count = completedWorkoutsHistory.length;
          } else if (data && typeof data === 'object') {
            if (data.theme) setThemePalette(data.theme);
            if (data.font && typeof setFontFamily === 'function') setFontFamily(data.font);
            if (Array.isArray(data.workouts)) {
              completedWorkoutsHistory = (typeof AppStorage !== 'undefined' && typeof AppStorage.mergeWorkouts === 'function')
                ? AppStorage.mergeWorkouts(completedWorkoutsHistory, data.workouts)
                : data.workouts;
              count = completedWorkoutsHistory.length;
            }
            if (Array.isArray(data.weightHistory)) {
              weightHistory = data.weightHistory;
              localStorage.setItem('showUp_weight_history', JSON.stringify(weightHistory));
            }
            if (Array.isArray(data.squadInvites)) {
              localStorage.setItem('showUp_squad_invites', JSON.stringify(data.squadInvites));
            }
            if (Array.isArray(data.globalSquadRegistry)) {
              localStorage.setItem('showUp_global_squad_registry', JSON.stringify(data.globalSquadRegistry));
            }
            if (data.profile) {
              if (data.profile.theme) setThemePalette(data.profile.theme);
              if (data.profile.height) {
                userHeight = data.profile.height;
                localStorage.setItem('showUp_user_height', userHeight);
              }
              if (data.profile.weight) {
                userWeight = data.profile.weight;
                localStorage.setItem('showUp_user_weight', userWeight);
              }
              loadPhysicalProfile();
            }
            if (Array.isArray(data.squads)) {
              const user = getAppUser();
              const rawSquads = data.squads.filter(s => s && s.id !== 'squad_iron_collective' && s.name !== 'Iron Collective');
              const cleanSquads = rawSquads.filter(sq => isAthleteMemberOrCreator(sq, user));
              cleanSquads.forEach(sq => {
                if (!sq.members) sq.members = [];
                const match = sq.members.find(m => m.id === user.id || m.email === user.email || m.id === 'local_user');
                if (match) {
                  match.id = user.id;
                  match.name = user.name;
                  match.rawName = user.rawName;
                  match.email = user.email;
                  if (user.picture) match.avatar = user.picture;
                }
              });
              saveSquads(cleanSquads);
              squadsCount = cleanSquads.length;
            }
          }

          if (typeof AppStorage !== 'undefined' && typeof AppStorage.saveAthleteWorkouts === 'function') {
            AppStorage.saveAthleteWorkouts(completedWorkoutsHistory);
          } else {
            localStorage.setItem('showUp_synced_workouts', JSON.stringify(completedWorkoutsHistory));
          }

          if (typeof renderHomeTab === 'function') {
            try { renderHomeTab(); } catch (e) {}
          }
          renderCalendar();
          renderMonthlyHistory();
          renderWeightHistory();
          renderSquadsTab();
          updateSquadBeacon();
          updateGlobalStatsUI();
          renderHeatMap();

          const squadMsg = squadsCount > 0 ? ` and ${squadsCount} squad${squadsCount === 1 ? '' : 's'}` : '';
          showToast(`Imported ${count} workout${count === 1 ? '' : 's'}${squadMsg} from JSON backup!`, "success");

          if (googleAccessToken) {
            syncToGoogleDrive(true);
          }
          if (typeof queueFirestoreAutoSync === 'function') {
            queueFirestoreAutoSync();
          }
        } catch (err) {
          console.error("JSON Import error:", err);
          showToast("Failed to parse JSON. Please check file format.", "error");
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    }

    // ==========================================================================
    // showUp Firebase Firestore Cloud Backup & Multi-Device Sync Engine
    // ==========================================================================

    let firestoreAutoSyncTimer = null;

    function queueFirestoreAutoSync() {
      if (typeof isCustomerLoggedIn === 'function' && !isCustomerLoggedIn()) return;
      if (firestoreAutoSyncTimer) clearTimeout(firestoreAutoSyncTimer);
      firestoreAutoSyncTimer = setTimeout(() => {
        if (typeof syncToFirestore === 'function') {
          syncToFirestore(true).catch(e => console.debug("Auto Firestore sync notice:", e));
        }
      }, 1500);
    }

    function setFirestoreButtonLoading(isBackup, isLoading) {
      const btn = document.getElementById(isBackup ? 'btn-settings-firestore-backup' : 'btn-settings-firestore-restore');
      const bannerBtn = isBackup ? document.getElementById('backup-banner-firestore-btn') : null;
      if (btn) {
        btn.disabled = isLoading;
        if (isLoading) {
          btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-xs"></i><span>${isBackup ? 'Syncing...' : 'Restoring...'}</span>`;
        } else {
          btn.innerHTML = isBackup
            ? `<i class="fa-solid fa-cloud-arrow-up text-xs"></i><span id="settings-firestore-btn-backup-text">Sync to Firestore</span>`
            : `<i class="fa-solid fa-cloud-arrow-down text-xs text-amber-400"></i><span id="settings-firestore-btn-restore-text">Restore from Firestore</span>`;
        }
      }
      if (bannerBtn) {
        bannerBtn.disabled = isLoading;
        bannerBtn.innerHTML = isLoading
          ? `<i class="fa-solid fa-spinner fa-spin text-xs"></i><span>Syncing...</span>`
          : `<i class="fa-solid fa-cloud-arrow-up text-xs mr-1.5"></i><span>Sync to Firestore</span>`;
      }
    }

    async function syncToFirestore(isSilent = false) {
      if (!isSilent) setFirestoreButtonLoading(true, true);
      try {
        if (typeof getFirestoreDb !== 'function') {
          if (!isSilent) showToast("Firebase Firestore service is not loaded.", "error");
          return { success: false, error: "Firestore not loaded" };
        }

        const db = getFirestoreDb();
        if (!db) {
          if (!isSilent) showToast("Could not connect to Firebase database.", "error");
          return { success: false, error: "Database unavailable" };
        }

        const user = (typeof getAppUser === 'function') ? getAppUser() : null;
        const rawEmail = (user?.email || '').toLowerCase().trim();
        if (!rawEmail || rawEmail === 'you@showup.app' || rawEmail === 'user@showup.app') {
          if (!isSilent) {
            showToast("Please log in with email/password or Google to sync with Firebase Cloud.", "info");
            const settingsModal = document.getElementById('settings-modal');
            if (settingsModal) settingsModal.classList.add('hidden');
            if (typeof openAuthLoginModal === 'function') {
              openAuthLoginModal('signin');
            }
          }
          return { success: false, error: "User not logged in" };
        }

        const normEmail = rawEmail;
        let workoutsToSync = (typeof AppStorage !== 'undefined' && typeof AppStorage.getAthleteWorkouts === 'function')
          ? AppStorage.getAthleteWorkouts()
          : (Array.isArray(completedWorkoutsHistory) ? completedWorkoutsHistory : []);

        const payload = {
          app: "showUp",
          version: "2.0",
          email: normEmail,
          lastSyncedAt: new Date().toISOString(),
          profile: {
            height: typeof userHeight !== 'undefined' ? userHeight : null,
            weight: typeof userWeight !== 'undefined' ? userWeight : null,
            firstName: user?.rawName || user?.name || 'Athlete'
          },
          workouts: workoutsToSync,
          weightHistory: typeof weightHistory !== 'undefined' && Array.isArray(weightHistory) ? weightHistory : [],
          squads: typeof getSquads === 'function' ? getSquads() : [],
          activeSession: typeof currentSessionSets !== 'undefined' && Array.isArray(currentSessionSets) ? currentSessionSets : []
        };

        const docRef = db.collection('user_backups').doc(normEmail);

        // 1. Read existing remote backup to merge non-destructively (timeout guard: 8 seconds)
        try {
          const snap = await Promise.race([
            docRef.get(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000))
          ]);
          if (snap && snap.exists) {
            const remoteData = snap.data();
            if (remoteData && Array.isArray(remoteData.workouts) && remoteData.workouts.length > 0) {
              const merged = (typeof AppStorage !== 'undefined' && typeof AppStorage.mergeWorkouts === 'function')
                ? AppStorage.mergeWorkouts(workoutsToSync, remoteData.workouts)
                : workoutsToSync;
              workoutsToSync = merged;
              completedWorkoutsHistory = merged;
              if (typeof AppStorage !== 'undefined' && typeof AppStorage.saveAthleteWorkouts === 'function') {
                AppStorage.saveAthleteWorkouts(merged, false);
              }
              payload.workouts = merged;
            }

            // Merge weight history
            if (remoteData && Array.isArray(remoteData.weightHistory) && remoteData.weightHistory.length > 0) {
              const localWeights = Array.isArray(weightHistory) ? weightHistory : [];
              const weightMap = new Map();
              localWeights.forEach(item => { if (item && item.date) weightMap.set(item.date, item); });
              remoteData.weightHistory.forEach(item => {
                if (item && item.date && !weightMap.has(item.date)) {
                  weightMap.set(item.date, item);
                }
              });
              const mergedWeights = Array.from(weightMap.values()).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
              weightHistory = mergedWeights;
              localStorage.setItem('showUp_weight_history', JSON.stringify(mergedWeights));
              payload.weightHistory = mergedWeights;
            }
          }
        } catch (e) {
          console.debug("Remote backup pre-check notice:", e);
        }

        // 2. Commit payload to Firestore (timeout guard: 12 seconds)
        await Promise.race([
          docRef.set(payload, { merge: true }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Firebase request timed out. Please check your internet connection or Firestore rules.")), 12000))
        ]);
        localStorage.setItem('showUp_last_firestore_sync', payload.lastSyncedAt);

        updateCloudBackupUI();
        if (!isSilent) {
          showToast(`Backed up ${payload.workouts.length} workouts to Firebase Cloud!`, "success");
        }
        return { success: true, count: payload.workouts.length };
      } catch (err) {
        console.error("Firebase sync error:", err);
        if (!isSilent) {
          showToast(`Firebase Cloud backup error: ${err.message || 'Check network connection'}`, "error");
        }
        return { success: false, error: err.message };
      } finally {
        if (!isSilent) setFirestoreButtonLoading(true, false);
      }
    }

    async function restoreFromFirestore(isSilent = false) {
      if (!isSilent) setFirestoreButtonLoading(false, true);
      try {
        if (typeof getFirestoreDb !== 'function') {
          if (!isSilent) showToast("Firebase Firestore service is not loaded.", "error");
          return { success: false, error: "Firestore not loaded" };
        }

        const db = getFirestoreDb();
        if (!db) {
          if (!isSilent) showToast("Could not connect to Firebase database.", "error");
          return { success: false, error: "Database unavailable" };
        }

        const user = (typeof getAppUser === 'function') ? getAppUser() : null;
        const rawEmail = (user?.email || '').toLowerCase().trim();
        if (!rawEmail || rawEmail === 'you@showup.app' || rawEmail === 'user@showup.app') {
          if (!isSilent) {
            showToast("Please log in to restore from Firebase Cloud.", "info");
            const settingsModal = document.getElementById('settings-modal');
            if (settingsModal) settingsModal.classList.add('hidden');
            if (typeof openAuthLoginModal === 'function') {
              openAuthLoginModal('signin');
            }
          }
          return { success: false, error: "User not logged in" };
        }

        const normEmail = rawEmail;

        const docRef = db.collection('user_backups').doc(normEmail);
        const snap = await Promise.race([
          docRef.get(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Firebase restore request timed out. Please check connection.")), 12000))
        ]);

        if (!snap || !snap.exists) {
          if (!isSilent) {
            showToast("No Firebase cloud backup found for this account.", "warning");
          }
          return { success: false, error: "No backup found" };
        }

        const data = snap.data();
        let restoredCount = 0;

        if (data.workouts && Array.isArray(data.workouts)) {
          const currentLocal = (typeof AppStorage !== 'undefined' && typeof AppStorage.getAthleteWorkouts === 'function')
            ? AppStorage.getAthleteWorkouts()
            : (Array.isArray(completedWorkoutsHistory) ? completedWorkoutsHistory : []);
          const merged = (typeof AppStorage !== 'undefined' && typeof AppStorage.mergeWorkouts === 'function')
            ? AppStorage.mergeWorkouts(currentLocal, data.workouts)
            : data.workouts;

          completedWorkoutsHistory = merged;
          if (typeof AppStorage !== 'undefined' && typeof AppStorage.saveAthleteWorkouts === 'function') {
            AppStorage.saveAthleteWorkouts(completedWorkoutsHistory, false);
          } else {
            localStorage.setItem('showUp_synced_workouts', JSON.stringify(completedWorkoutsHistory));
            localStorage.setItem('showUp_user_workouts_' + normEmail, JSON.stringify(completedWorkoutsHistory));
          }
          restoredCount = merged.length;
        }

        if (data.weightHistory && Array.isArray(data.weightHistory)) {
          const localWeights = Array.isArray(weightHistory) ? weightHistory : [];
          const weightMap = new Map();
          localWeights.forEach(item => { if (item && item.date) weightMap.set(item.date, item); });
          data.weightHistory.forEach(item => {
            if (item && item.date && !weightMap.has(item.date)) {
              weightMap.set(item.date, item);
            }
          });
          const mergedWeights = Array.from(weightMap.values()).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          weightHistory = mergedWeights;
          localStorage.setItem('showUp_weight_history', JSON.stringify(mergedWeights));
        }

        if (data.profile) {
          if (data.profile.height && (!userHeight || userHeight === 70)) {
            userHeight = data.profile.height;
            localStorage.setItem('showUp_user_height', String(userHeight));
          }
          if (data.profile.weight && (!userWeight || userWeight === 170)) {
            userWeight = data.profile.weight;
            localStorage.setItem('showUp_user_weight', String(userWeight));
          }
        }

        if (data.lastSyncedAt) {
          localStorage.setItem('showUp_last_firestore_sync', data.lastSyncedAt);
        }

        if (typeof renderHomeTab === 'function') {
          try { renderHomeTab(); } catch (e) {}
        }
        renderCalendar();
        renderMonthlyHistory();
        renderWeightHistory();
        renderSquadsTab();
        updateSquadBeacon();
        updateGlobalStatsUI();
        renderHeatMap();
        updateCloudBackupUI();

        if (!isSilent) {
          showToast(`Restored ${restoredCount} workouts from Firebase Cloud!`, "success");
        }
        return { success: true, count: restoredCount };
      } catch (err) {
        console.error("Firebase restore error:", err);
        if (!isSilent) {
          showToast(`Firebase restore error: ${err.message || 'Check network connection'}`, "error");
        }
        return { success: false, error: err.message };
      } finally {
        if (!isSilent) setFirestoreButtonLoading(false, false);
      }
    }

    async function syncOrRestoreFirestoreBackup(isSilent = true) {
      const currentLocal = (typeof AppStorage !== 'undefined' && typeof AppStorage.getAthleteWorkouts === 'function')
        ? AppStorage.getAthleteWorkouts()
        : (Array.isArray(completedWorkoutsHistory) ? completedWorkoutsHistory : []);

      if (currentLocal.length === 0) {
        return await restoreFromFirestore(isSilent);
      } else {
        return await syncToFirestore(isSilent);
      }
    }
