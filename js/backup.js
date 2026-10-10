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

    function updateCloudBackupUI() {
      const banner = document.getElementById('cloud-backup-reminder-banner');
      const bannerBadge = document.getElementById('backup-banner-badge');
      const bannerTitle = document.getElementById('backup-banner-title');
      const bannerDesc = document.getElementById('backup-banner-desc');
      const bannerGoogleBtn = document.getElementById('backup-banner-google-btn');
      const settingsBadge = document.getElementById('settings-backup-status-badge');
      const gdrivePill = document.getElementById('settings-gdrive-status-pill');
      const timeValEl = document.getElementById('settings-gdrive-time-val');

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

      if (googleAccessToken) {
        // Once athlete is signed in with Google, hide reminder banner
        if (banner) {
          banner.classList.add('hidden');
        }
        if (settingsBadge) {
          settingsBadge.className = "text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
          settingsBadge.innerText = "Cloud Synced";
        }
        if (gdrivePill) {
          gdrivePill.className = "text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
          gdrivePill.innerText = "Connected";
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
        if (bannerDesc) bannerDesc.innerText = "Sign in with Google to auto-sync your workouts, weight logs, and squads to Google Drive, or back up manually to your device and restore anytime.";
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
        workouts: completedWorkoutsHistory,
        weightHistory: weightHistory,
        squads: getSquads(),
        activeSession: currentSessionSets
      };

      const fileContent = JSON.stringify(backupPayload, null, 2);

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
          completedWorkoutsHistory = backupData.workouts;
          localStorage.setItem('showUp_synced_workouts', JSON.stringify(completedWorkoutsHistory));
          if (userEmail && userEmail !== 'you@showup.app' && userEmail !== 'user@showup.app') {
            try {
              localStorage.setItem('showUp_user_workouts_' + userEmail, JSON.stringify(completedWorkoutsHistory));
            } catch (e) {}
          }
          restoredCount = backupData.workouts.length;
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
          const cleanSquads = backupData.squads.filter(s => s && s.id !== 'squad_iron_collective' && s.name !== 'Iron Collective');
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
            } else if (!match) {
              sq.members.push({
                id: user.id,
                name: user.name,
                rawName: user.rawName,
                email: user.email,
                avatar: user.picture,
                isCreator: (sq.creatorId === user.id),
                isBackupCreator: false,
                isWorkingOut: false,
                currentWorkout: null,
                lastActive: 'Active'
              });
            }
          });

          saveSquads(cleanSquads);
          initSquads();
          restoredSquadsCount = cleanSquads.length;
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
            completedWorkoutsHistory = data;
            count = data.length;
          } else if (data && typeof data === 'object') {
            if (data.theme) setThemePalette(data.theme);
            if (data.font && typeof setFontFamily === 'function') setFontFamily(data.font);
            if (Array.isArray(data.workouts)) {
              completedWorkoutsHistory = data.workouts;
              count = data.workouts.length;
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
              const cleanSquads = data.squads.filter(s => s && s.id !== 'squad_iron_collective' && s.name !== 'Iron Collective');
              const user = getAppUser();
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

          localStorage.setItem('showUp_synced_workouts', JSON.stringify(completedWorkoutsHistory));
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
        } catch (err) {
          console.error("JSON Import error:", err);
          showToast("Failed to parse JSON. Please check file format.", "error");
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    }
