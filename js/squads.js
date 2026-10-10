/* ==========================================================================
   showUp Squads Engine: Strict Athlete Isolation, Real-Time Accountability
   ========================================================================== */

    function isAthleteMemberOrCreator(squad, user) {
      if (!squad) return false;
      if (!user) user = getAppUser();
      const userId = user.id;
      const userEmail = (user.email || '').toLowerCase().trim();
      const userName = (user.rawName || user.name || '').toLowerCase().trim();

      // 1. Is athlete the squad creator?
      const isCreatorById = squad.creatorId && (squad.creatorId === userId || (userEmail && squad.creatorId === userEmail) || squad.creatorId === 'local_user');
      const isCreatorByEmail = userEmail && squad.creatorEmail && (squad.creatorEmail.toLowerCase().trim() === userEmail);
      const isCreatorByName = userName && ((squad.creatorName && squad.creatorName.toLowerCase().trim() === userName) || (typeof squad.creator === 'string' && squad.creator.toLowerCase().trim() === userName));
      const isCreatorInMembers = Array.isArray(squad.members) && squad.members.some(m => {
        if (!m) return false;
        if (typeof m === 'string') {
          const str = m.toLowerCase().trim();
          return m === userId || (userEmail && str === userEmail) || (userName && str === userName);
        }
        const matchId = m.id === userId || (userEmail && m.id === userEmail) || m.id === 'local_user';
        const matchEmail = userEmail && m.email && m.email.toLowerCase().trim() === userEmail;
        const matchName = userName && (m.rawName || m.name) && (m.rawName || m.name).toLowerCase().trim() === userName;
        return (matchId || matchEmail || matchName) && m.isCreator === true;
      });

      if (isCreatorById || isCreatorByEmail || isCreatorByName || isCreatorInMembers) {
        return true;
      }

      // 2. Is athlete an active member who joined or was invited to the squad?
      const isMember = Array.isArray(squad.members) && squad.members.some(m => {
        if (!m) return false;
        if (typeof m === 'string') {
          const str = m.toLowerCase().trim();
          return m === userId || (userEmail && str === userEmail) || (userName && str === userName);
        }
        const matchId = (m.id && (m.id === userId || (userEmail && m.id === userEmail))) || (m.id === 'local_user' && squad.creatorId === userId);
        const matchEmail = userEmail && m.email && m.email.toLowerCase().trim() === userEmail;
        const matchName = userName && (m.rawName || m.name) && (m.rawName || m.name).toLowerCase().trim() === userName && (m.inviteStatus === 'accepted' || m.isBackupCreator || m.isCreator || m.isMember !== false);
        return matchId || matchEmail || matchName;
      });

      if (isMember) return true;

      // 3. Backup creator match
      if (squad.backupCreatorId && (squad.backupCreatorId === userId || squad.backupCreatorId === userEmail)) return true;
      if (squad.backupCreatorEmail && userEmail && squad.backupCreatorEmail.toLowerCase().trim() === userEmail) return true;

      return false;
    }

    function sanitizeSquadMembers(squad, user) {
      if (!squad || !Array.isArray(squad.members)) return squad;
      if (!user) user = getAppUser();

      const seen = new Set();
      const deduped = [];

      for (const m of squad.members) {
        if (!m) continue;

        // Discard any mock placeholder teammates or invalid mock IDs
        if (m.zip === '60601' || m.zip === '80202' || m.id === 'mock_athlete_1' || m.id === 'mock_athlete_2' || m.isMockTeammate || (typeof m.id === 'string' && m.id.startsWith('mock_'))) {
          continue;
        }

        const isCurrentUserEntity = (
          m.id === user.id || 
          (user.email && m.email && m.email.toLowerCase().trim() === user.email.toLowerCase().trim()) || 
          (m.id === 'local_user' && (squad.creatorId === user.id || squad.creatorId === 'local_user'))
        );

        const key = isCurrentUserEntity 
          ? '__CURRENT_USER__' 
          : (m.id || m.email || (m.rawName || m.name || '').toLowerCase());

        if (!seen.has(key)) {
          seen.add(key);
          if (isCurrentUserEntity) {
            m.id = user.id;
            m.name = user.name;
            m.rawName = user.rawName;
            m.email = user.email;
            if (user.picture) m.avatar = user.picture;
            if (squad.creatorId === user.id || squad.creatorId === 'local_user' || (squad.creatorEmail && user.email && squad.creatorEmail.toLowerCase().trim() === user.email.toLowerCase().trim())) {
              m.isCreator = true;
              squad.creatorId = user.id;
              squad.creatorName = user.rawName || user.name;
              squad.creatorEmail = user.email || squad.creatorEmail;
            }
          }
          deduped.push(m);
        }
      }

      // If user is creator but not yet in members list, ensure they are in members
      if (squad.creatorId === user.id || squad.creatorId === 'local_user' || (squad.creatorEmail && user.email && squad.creatorEmail.toLowerCase().trim() === user.email.toLowerCase().trim())) {
        const hasUser = deduped.some(m => m.id === user.id || (user.email && m.email && m.email.toLowerCase().trim() === user.email.toLowerCase().trim()));
        if (!hasUser) {
          deduped.unshift({
            id: user.id,
            name: user.name,
            rawName: user.rawName,
            email: user.email,
            avatar: user.picture,
            isCreator: true,
            isBackupCreator: false,
            isWorkingOut: false,
            currentWorkout: null,
            lastActive: 'Active today',
            zip: getUserZip() || '20105',
            city: localStorage.getItem('showUp_user_ip_city') || 'Ashburn, VA'
          });
        }
        squad.creatorId = user.id;
        squad.creatorName = user.rawName || user.name;
        squad.creatorEmail = user.email || squad.creatorEmail;
      }

      squad.members = deduped;
      return squad;
    }

    function isMemberYetToJoin(member, squad, user) {
      if (!member) return false;
      if (!user) user = getAppUser();

      // 1. Creators have always joined
      if (member.isCreator === true) return false;
      if (squad && squad.creatorId && (member.id === squad.creatorId || (user.email && squad.creatorEmail && member.email && member.email.toLowerCase().trim() === squad.creatorEmail.toLowerCase().trim()))) {
        return false;
      }

      // 2. The viewing athlete on their own account has joined
      const isMe = (
        (member.id && (member.id === user.id || (user.email && member.id === user.email))) ||
        (user.email && member.email && member.email.toLowerCase().trim() === user.email.toLowerCase().trim()) ||
        (member.id === 'local_user' && (squad.creatorId === user.id || squad.creatorId === 'local_user'))
      );
      if (isMe) return false;

      // 3. Explicitly confirmed joined or invite accepted
      if (member.hasJoined === true || member.joined === true || member.inviteStatus === 'accepted') {
        return false;
      }

      // 4. If athlete has workout data / activity recorded, they have joined
      if (member.completedToday === true || member.completedDate || member.isWorkingOut === true || (Array.isArray(member.workouts) && member.workouts.length > 0)) {
        return false;
      }

      // 5. Athlete was invited via email, phone, or manual invitation and has not yet joined
      if (
        member.hasJoined === false ||
        member.inviteStatus === 'delivered' ||
        member.inviteStatus === 'pending' ||
        member.invitedByEmail === true ||
        member.invitedByPhone === true ||
        member.lastActive === 'Just invited' ||
        Boolean(member.inviteEmail || member.invitePhone)
      ) {
        return true;
      }

      return false;
    }

    function syncSquadToFirestore(squad) {
      if (!squad || !squad.id) return;
      try {
        if (typeof getFirestoreDb === 'function') {
          const db = getFirestoreDb();
          if (db) {
            const cleanSquad = JSON.parse(JSON.stringify(squad));
            cleanSquad.updatedAt = new Date().toISOString();
            db.collection('squads').doc(squad.id).set(cleanSquad, { merge: true })
              .catch(err => console.debug("Firestore squad sync notice:", err));
          }
        }
      } catch (err) {
        console.debug("Firestore squad record exception:", err);
      }
    }

    async function fetchAthleteSquadsFromFirestore(user) {
      if (!user) user = getAppUser();
      if (!isCustomerLoggedIn()) return;
      try {
        if (typeof getFirestoreDb !== 'function') return;
        const db = getFirestoreDb();
        if (!db) return;

        const snapshot = await db.collection('squads').get();
        if (!snapshot || snapshot.empty) return;

        const remoteSquads = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data && data.id && isAthleteMemberOrCreator(data, user)) {
            remoteSquads.push(data);
          }
        });

        if (remoteSquads.length > 0) {
          const currentSquads = getSquads();
          let hasChanges = false;
          remoteSquads.forEach(remSq => {
            const idx = currentSquads.findIndex(s => s.id === remSq.id || (s.inviteCode && remSq.inviteCode && s.inviteCode === remSq.inviteCode));
            if (idx >= 0) {
              const localMembers = currentSquads[idx].members || [];
              (remSq.members || []).forEach(m => {
                if (!m) return;
                const hasM = localMembers.some(lm => (lm.id && lm.id === m.id) || (lm.email && m.email && lm.email.toLowerCase().trim() === m.email.toLowerCase().trim()));
                if (!hasM) {
                  localMembers.push(m);
                  hasChanges = true;
                }
              });
              currentSquads[idx].members = localMembers;
            } else {
              currentSquads.push(remSq);
              hasChanges = true;
            }
          });

          if (hasChanges) {
            saveSquads(currentSquads);
            renderSquadsTab();
            updateSquadBeacon();
            updateGlobalStatsUI();
          }
        }
      } catch (err) {
        console.debug("Firestore athlete squads fetch notice:", err);
      }
    }

    function initSquads() {
      const isLoggedIn = isCustomerLoggedIn();
      if (!isLoggedIn) {
        // Logged-out athlete: zero squads or personal data loaded
        localStorage.removeItem('showUp_squads');
        updateSquadBeacon();
        return [];
      }

      const user = getAppUser();
      const userEmail = (user.email || '').toLowerCase().trim();

      // Gather candidate squads across all persistence tiers:
      // 1. Current active squads in showUp_squads
      let localSquads = [];
      try {
        localSquads = JSON.parse(localStorage.getItem('showUp_squads') || '[]');
      } catch (e) { localSquads = []; }

      // 2. Global squad registry
      const globalReg = getGlobalSquadRegistry();

      // 3. Per-athlete persistent cache (preserves squads across re-logins)
      let userCacheSquads = [];
      if (userEmail && userEmail !== 'you@showup.app' && userEmail !== 'user@showup.app') {
        try {
          userCacheSquads = JSON.parse(localStorage.getItem('showUp_user_squads_' + userEmail) || '[]');
        } catch (e) { userCacheSquads = []; }
      }

      // 4. Squad archive
      let archiveSquads = [];
      try {
        archiveSquads = JSON.parse(localStorage.getItem('showUp_squad_archive') || '[]');
      } catch (e) { archiveSquads = []; }

      // Combine and deduplicate candidates by squad.id or inviteCode
      const candidates = [
        ...(Array.isArray(localSquads) ? localSquads : []),
        ...(Array.isArray(globalReg) ? globalReg : []),
        ...(Array.isArray(userCacheSquads) ? userCacheSquads : []),
        ...(Array.isArray(archiveSquads) ? archiveSquads : [])
      ];

      const squadMap = new Map();

      candidates.forEach(sq => {
        if (!sq || !sq.name) return;
        const key = sq.id || (sq.inviteCode ? `code_${sq.inviteCode}` : null);
        if (!key) return;

        if (isAthleteMemberOrCreator(sq, user)) {
          if (!squadMap.has(key)) {
            squadMap.set(key, sq);
          } else {
            // Merge member lists and latest metadata
            const existing = squadMap.get(key);
            const mergedMembers = [...(existing.members || [])];
            (sq.members || []).forEach(newM => {
              if (!newM) return;
              const hasM = mergedMembers.some(m => (m.id && m.id === newM.id) || (m.email && newM.email && m.email.toLowerCase().trim() === newM.email.toLowerCase().trim()));
              if (!hasM) mergedMembers.push(newM);
            });
            existing.members = mergedMembers;
            if (sq.updatedAt && (!existing.updatedAt || new Date(sq.updatedAt) > new Date(existing.updatedAt))) {
              squadMap.set(key, { ...existing, ...sq, members: mergedMembers });
            }
          }
        }
      });

      let squads = Array.from(squadMap.values());

      // Sanitize and deduplicate members across all valid squads
      squads = squads.map(sq => sanitizeSquadMembers(sq, user));

      // Maintain backup creator role flags
      squads.forEach(sq => {
        if (sq.backupCreatorId) {
          sq.members.forEach(m => {
            m.isBackupCreator = (m.id === sq.backupCreatorId);
          });
        }
      });

      // Save filtered active squad list
      saveSquads(squads);
      updateSquadBeacon();

      // Check URL parameters for direct squad joining code (?join=CODE or ?squadCode=CODE)
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const joinCode = urlParams.get('join') || urlParams.get('squadCode') || urlParams.get('code');
        if (joinCode) {
          setTimeout(() => {
            switchTab('squads');
            openJoinSquadModal(joinCode);
          }, 350);
        }
      } catch (e) {}

      // Asynchronously fetch cloud squads from Firestore in background
      try {
        fetchAthleteSquadsFromFirestore(user);
      } catch (e) {}

      return squads;
    }

    function assignBackupCreator(squadId, memberId) {
      const squads = getSquads();
      const squad = squads.find(s => s.id === squadId);
      if (!squad) return;

      const user = getAppUser();
      const isUserCreator = (squad.creatorId === user.id) || squad.members.some(m => (m.id === user.id || m.email === user.email) && m.isCreator);
      if (!isUserCreator) {
        showToast("Only the squad creator can assign the backup creator role.", "error");
        return;
      }

      const targetMember = squad.members.find(m => m.id === memberId);
      if (!targetMember) return;

      squad.backupCreatorId = targetMember.id;
      squad.backupCreatorName = targetMember.rawName || targetMember.name;
      squad.backupCreatorEmail = targetMember.email || '';

      squad.members.forEach(m => {
        m.isBackupCreator = (m.id === targetMember.id);
      });

      saveSquads(squads);
      renderSquadsTab();
      if (googleAccessToken) {
        syncToGoogleDrive(true);
      }
      showToast(`Assigned ${targetMember.rawName || targetMember.name} as Backup Creator for "${squad.name}".`, "success");
    }

    function promptAssignFirstBackupCreator(squadId) {
      const squads = getSquads();
      const squad = squads.find(s => s.id === squadId);
      if (!squad) return;

      const user = getAppUser();
      const candidates = squad.members.filter(m => m.id !== user.id && m.email !== user.email);
      if (candidates.length === 0) {
        openAddMemberModal(squadId);
        showToast("Invite at least one teammate to assign as Backup Creator.", "info");
        return;
      }

      if (candidates.length === 1) {
        assignBackupCreator(squadId, candidates[0].id);
        return;
      }

      const names = candidates.map((c, i) => `${i + 1}. ${c.rawName || c.name}`).join('\n');
      const choice = prompt(`Designate a Backup Creator to protect "${squad.name}":\n\n${names}\n\nEnter number (1-${candidates.length}):`, "1");
      if (!choice) return;
      const idx = parseInt(choice, 10) - 1;
      if (idx >= 0 && idx < candidates.length) {
        assignBackupCreator(squadId, candidates[idx].id);
      }
    }

    function pickUpMantlePrompt(squadId) {
      const squads = getSquads();
      const squad = squads.find(s => s.id === squadId);
      if (!squad) return;

      const user = getAppUser();
      const userMember = squad.members.find(m => m.id === user.id || m.email === user.email);
      const isBackup = userMember?.isBackupCreator || (squad.backupCreatorId === user.id);

      if (!isBackup) {
        showToast("Only the designated Backup Creator can pick up the mantle.", "warning");
        return;
      }

      const confirmMsg = `👑 PICK UP THE MANTLE\n\nAre you sure you want to assume primary Creator leadership of "${squad.name}"?\n\nThis will promote you to primary Squad Creator with full squad management and backup controls in case the original creator lost their data.`;
      if (!confirm(confirmMsg)) return;

      // Demote previous primary creator
      squad.members.forEach(m => {
        if (m.isCreator) m.isCreator = false;
      });

      // Promote backup creator to primary creator
      if (userMember) {
        userMember.isCreator = true;
        userMember.isBackupCreator = false;
      }
      squad.creatorId = user.id;
      squad.creatorName = user.rawName || user.name;
      squad.backupCreatorId = null;
      squad.backupCreatorName = null;

      saveSquads(squads);
      renderSquadsTab();
      updateSquadBeacon();
      updateGlobalStatsUI();
      if (googleAccessToken) {
        syncToGoogleDrive(true);
      }

      showToast(`👑 You have picked up the mantle! You are now the primary Creator of "${squad.name}".`, "success");

      // Check if other members exist and prompt to appoint a new backup creator
      const remainingOthers = squad.members.filter(m => m.id !== user.id && m.email !== user.email);
      if (remainingOthers.length > 0) {
        setTimeout(() => {
          showToast("Remember to assign a new Backup Creator among remaining members.", "warning");
        }, 2200);
      }
    }

    function getSquads() {
      if (!isCustomerLoggedIn()) return [];
      const user = getAppUser();
      const squads = JSON.parse(localStorage.getItem('showUp_squads') || '[]');
      if (!Array.isArray(squads)) return [];
      return squads
        .filter(sq => sq && isAthleteMemberOrCreator(sq, user))
        .map(s => sanitizeSquadMembers(s, user));
    }

    function saveSquads(squads) {
      if (!Array.isArray(squads)) return;
      const user = getAppUser();
      const filtered = squads.filter(sq => sq && isAthleteMemberOrCreator(sq, user));
      localStorage.setItem('showUp_squads', JSON.stringify(filtered));
      const userEmail = (user.email || '').toLowerCase().trim();
      if (userEmail && userEmail !== 'you@showup.app' && userEmail !== 'user@showup.app') {
        try {
          localStorage.setItem('showUp_user_squads_' + userEmail, JSON.stringify(filtered));
        } catch (e) {}
      }
      filtered.forEach(sq => {
        saveSquadToGlobalRegistry(sq);
        syncSquadToFirestore(sq);
      });
      updateSquadBeacon();
    }



    function updateSquadBeacon() {
      const squads = getSquads();
      const user = getAppUser();
      let activeMemberCount = 0;
      let activeSummary = "";

      squads.forEach(sq => {
        sq.members.forEach(m => {
          if (m.isWorkingOut && m.id !== user.id) {
            activeMemberCount++;
            if (!activeSummary) {
              activeSummary = `${m.rawName} is lifting right now in ${sq.name}! (${m.currentWorkout || 'Session'})`;
            }
          }
        });
      });

      const navBeaconPing = document.getElementById('squad-nav-beacon');
      const navBeaconDot = document.getElementById('squad-nav-beacon-dot');
      const banner = document.getElementById('squad-active-beacon-banner');
      const bannerText = document.getElementById('squad-active-beacon-text');

      if (activeMemberCount > 0) {
        if (navBeaconPing) navBeaconPing.classList.remove('hidden');
        if (navBeaconDot) navBeaconDot.classList.remove('hidden');
        if (banner) banner.classList.remove('hidden');
        if (bannerText) bannerText.innerText = activeSummary;
      } else {
        if (navBeaconPing) navBeaconPing.classList.add('hidden');
        if (navBeaconDot) navBeaconDot.classList.add('hidden');
        if (banner) banner.classList.add('hidden');
      }
    }

    // Toggle Collapsing a Squad
    function toggleSquadCollapse(squadId) {
      const squads = getSquads();
      const squad = squads.find(s => s.id === squadId);
      if (!squad) return;

      const isDefaultCollapsed = localStorage.getItem('showUp_squads_default_collapsed') === 'true';
      const currentCollapsed = squad.isCollapsed !== undefined ? squad.isCollapsed : isDefaultCollapsed;
      squad.isCollapsed = !currentCollapsed;
      saveSquads(squads);
      renderSquadsTab();
    }

    // Toggle default collapse behavior and collapse/expand all active squads
    function toggleSquadsDefaultCollapse() {
      const isDefaultCollapsed = localStorage.getItem('showUp_squads_default_collapsed') === 'true';
      const newPref = !isDefaultCollapsed;
      localStorage.setItem('showUp_squads_default_collapsed', String(newPref));

      // Synchronize in settings modal if open
      const prefCheckbox = document.getElementById('pref-squads-collapsed');
      if (prefCheckbox) prefCheckbox.checked = newPref;

      // Apply to all current squads
      const squads = getSquads();
      squads.forEach(sq => {
        sq.isCollapsed = newPref;
      });
      saveSquads(squads);
      renderSquadsTab();
      updateSquadsDefaultCollapseUI();
      showToast(newPref ? "Default set: Squads collapsed" : "Default set: Squads expanded", "info");
    }

    // Preference toggled from Settings Modal
    function toggleSquadsDefaultCollapsePref(checked) {
      localStorage.setItem('showUp_squads_default_collapsed', String(checked));
      const squads = getSquads();
      squads.forEach(sq => {
        sq.isCollapsed = checked;
      });
      saveSquads(squads);
      renderSquadsTab();
      updateSquadsDefaultCollapseUI();
    }

    // Update Header Toggle Button UI
    function updateSquadsDefaultCollapseUI() {
      const btn = document.getElementById('btn-toggle-squads-default-collapse');
      if (!btn) return;
      const isDefaultCollapsed = localStorage.getItem('showUp_squads_default_collapsed') === 'true';
      const icon = btn.querySelector('i');
      const text = btn.querySelector('span');
      if (icon) {
        icon.className = isDefaultCollapsed ? 'fa-solid fa-expand text-slate-400' : 'fa-solid fa-compress text-slate-400';
      }
      if (text) {
        text.innerText = isDefaultCollapsed ? 'Expand All' : 'Collapse All';
      }
      btn.title = isDefaultCollapsed ? 'Default is collapsed. Click to expand all squads' : 'Default is expanded. Click to collapse all squads';
    }

    // Creator Deletes Squad
    function deleteSquadPrompt(squadId) {
      const squads = getSquads();
      const squad = squads.find(s => s.id === squadId);
      if (!squad) return;

      const user = getAppUser();
      const isUserCreator = (squad.creatorId === user.id) || squad.members.some(m => (m.id === user.id || m.email === user.email) && m.isCreator);
      if (!isUserCreator) {
        showToast("Only the squad creator has permission to delete this squad.", "error");
        return;
      }

      if (confirm(`Are you sure you want to delete squad "${squad.name}"?`)) {
        const updated = squads.filter(s => s.id !== squadId);
        localStorage.setItem('showUp_squads', JSON.stringify(updated));
        renderSquadsTab();
        updateSquadBeacon();
        updateGlobalStatsUI();
        renderHeatMap();
        showToast(`Squad "${squad.name}" deleted.`, "info");
      }
    }

    // Close Simulated Workout Action (All active or specific member)
    function dismissSimulatedWorkout() {
      const squads = getSquads();
      let closedCount = 0;
      const todayET = getETDateKey();

      squads.forEach(sq => {
        sq.members.forEach(m => {
          if (m.isWorkingOut) {
            m.isWorkingOut = false;
            m.lastActive = 'Just finished';
            m.currentWorkout = null;
            m.completedToday = true;
            m.completedDate = todayET;
            closedCount++;
          }
        });
      });

      saveSquads(squads);
      renderSquadsTab();
      updateSquadBeacon();
      updateGlobalStatsUI();
      renderHeatMap();
      dismissSquadPill();

      const banner = document.getElementById('squad-active-beacon-banner');
      if (banner) banner.classList.add('hidden');

      showToast("Active workout simulation closed (saved as completed today).", "info");
    }

    function stopSpecificMemberWorkout(squadId, memberId) {
      const squads = getSquads();
      const squad = squads.find(s => s.id === squadId);
      if (!squad) return;

      const member = squad.members.find(m => m.id === memberId);
      if (!member) return;

      member.isWorkingOut = false;
      member.lastActive = 'Just finished';
      member.currentWorkout = null;
      member.completedToday = true;
      member.completedDate = getETDateKey();

      saveSquads(squads);
      renderSquadsTab();
      updateSquadBeacon();
      updateGlobalStatsUI();
      renderHeatMap();
      dismissSquadPill();
      showToast(`Ended active workout session for ${member.rawName || member.name}. Recorded as completed today.`, "info");
    }



    function getGlobalSquadRegistry() {
      try {
        return JSON.parse(localStorage.getItem('showUp_global_squad_registry') || '[]');
      } catch (e) {
        return [];
      }
    }

    function saveSquadToGlobalRegistry(squad) {
      if (!squad || !squad.id) return;
      const reg = getGlobalSquadRegistry();
      const idx = reg.findIndex(s => s.id === squad.id || (squad.inviteCode && s.inviteCode === squad.inviteCode));
      if (idx >= 0) {
        reg[idx] = { ...reg[idx], ...squad };
      } else {
        reg.push(squad);
      }
      localStorage.setItem('showUp_global_squad_registry', JSON.stringify(reg));
    }

    function getSquadInvites() {
      try {
        return JSON.parse(localStorage.getItem('showUp_squad_invites') || '[]');
      } catch (e) {
        return [];
      }
    }

    function recordSquadInvite(invite) {
      if (!invite || !invite.targetEmail) return;
      const invites = getSquadInvites();
      const idx = invites.findIndex(i => i.squadId === invite.squadId && i.targetEmail.toLowerCase() === invite.targetEmail.toLowerCase());
      if (idx >= 0) {
        invites[idx] = invite;
      } else {
        invites.unshift(invite);
      }
      localStorage.setItem('showUp_squad_invites', JSON.stringify(invites));
    }

    function getPendingSquadInvites() {
      const user = getAppUser();
      const userEmail = (user.email || '').toLowerCase().trim();
      if (!userEmail || userEmail === 'you@showup.app' || userEmail === 'user@showup.app') {
        return [];
      }

      const existingSquads = getSquads();
      const allInvites = getSquadInvites();
      const globalRegistry = getGlobalSquadRegistry();
      const matchingInvites = [];

      // 1. Check explicit invite records
      allInvites.forEach(inv => {
        if (inv.targetEmail && inv.targetEmail.toLowerCase() === userEmail && inv.status === 'pending') {
          const alreadyInSquad = existingSquads.some(s => s.id === inv.squadId && s.members.some(m => (m.id === user.id || (m.email && m.email.toLowerCase() === userEmail))));
          if (!alreadyInSquad && !matchingInvites.some(i => i.squadId === inv.squadId)) {
            matchingInvites.push(inv);
          }
        }
      });

      // 2. Check global registry for any squads where user is invited
      globalRegistry.forEach(sq => {
        if (sq.members && Array.isArray(sq.members)) {
          const isInvited = sq.members.some(m => m.email && m.email.toLowerCase() === userEmail && !m.isCreator);
          const alreadyInSquad = existingSquads.some(s => s.id === sq.id && s.members.some(m => (m.id === user.id || (m.email && m.email.toLowerCase() === userEmail))));
          const alreadyInList = matchingInvites.some(inv => inv.squadId === sq.id);
          if (isInvited && !alreadyInSquad && !alreadyInList) {
            matchingInvites.push({
              id: 'invite_' + sq.id,
              squadId: sq.id,
              squadName: sq.name,
              squadMotto: sq.motto,
              squadIcon: sq.icon || 'dumbbell',
              squadAccent: sq.accent || 'emerald',
              inviteCode: sq.inviteCode,
              inviterName: sq.creatorName || 'Squad Creator',
              inviterEmail: sq.creatorId,
              targetEmail: userEmail,
              invitedAt: sq.createdAt || new Date().toISOString(),
              status: 'pending'
            });
          }
        }
      });

      return matchingInvites;
    }

    function acceptSquadInvite(inviteId) {
      const user = getAppUser();
      const userEmail = (user.email || '').toLowerCase().trim();
      const invites = getSquadInvites();
      const invite = invites.find(i => i.id === inviteId) || getPendingSquadInvites().find(i => i.id === inviteId);

      if (!invite) {
        showToast("Invitation not found or expired.", "error");
        return;
      }

      // Update invite status
      invite.status = 'accepted';
      invite.acceptedAt = new Date().toISOString();
      localStorage.setItem('showUp_squad_invites', JSON.stringify(invites));

      // Find the squad in global registry or local squads
      const squads = getSquads();
      const globalReg = getGlobalSquadRegistry();
      let targetSquad = squads.find(s => s.id === invite.squadId) || globalReg.find(s => s.id === invite.squadId || (invite.inviteCode && s.inviteCode === invite.inviteCode));

      if (!targetSquad) {
        targetSquad = {
          id: invite.squadId || ('squad_' + Date.now()),
          name: invite.squadName || 'Fitness Squad',
          motto: invite.squadMotto || 'Consistency in motion',
          icon: invite.squadIcon || 'dumbbell',
          accent: invite.squadAccent || 'emerald',
          inviteCode: invite.inviteCode || ('SHOWUP-' + Math.random().toString(36).substring(2, 6).toUpperCase()),
          isCollapsed: false,
          createdAt: invite.invitedAt || new Date().toISOString(),
          creatorId: invite.inviterEmail || 'creator',
          creatorName: invite.inviterName || 'Squad Creator',
          notificationPreferences: {
            inAppPill: true,
            beaconPulse: true,
            hapticPulse: true,
            soundChime: true,
            browserNotify: false
          },
          members: []
        };
      }

      // Add current user if not already in members
      const memberIndex = targetSquad.members.findIndex(m => m.id === user.id || (m.email && m.email.toLowerCase() === userEmail));
      if (memberIndex >= 0) {
        targetSquad.members[memberIndex].id = user.id;
        targetSquad.members[memberIndex].name = user.name;
        targetSquad.members[memberIndex].rawName = user.rawName;
        targetSquad.members[memberIndex].email = user.email;
        targetSquad.members[memberIndex].avatar = user.picture;
        targetSquad.members[memberIndex].hasJoined = true;
        targetSquad.members[memberIndex].inviteStatus = 'accepted';
        targetSquad.members[memberIndex].lastActive = 'Just joined';
      } else {
        targetSquad.members.push({
          id: user.id,
          name: user.name,
          rawName: user.rawName,
          email: user.email,
          avatar: user.picture,
          hasJoined: true,
          inviteStatus: 'accepted',
          isCreator: false,
          isBackupCreator: false,
          isWorkingOut: false,
          currentWorkout: null,
          lastActive: 'Just joined'
        });
      }

      // Ensure squad is in user's squads list
      const existingSquadIndex = squads.findIndex(s => s.id === targetSquad.id);
      if (existingSquadIndex >= 0) {
        squads[existingSquadIndex] = targetSquad;
      } else {
        squads.unshift(targetSquad);
      }

      saveSquads(squads);
      saveSquadToGlobalRegistry(targetSquad);
      renderSquadsTab();
      updateGlobalStatsUI();
      updateSquadBeacon();

      showToast(`🎉 Joined "${targetSquad.name}"! You are now an active member.`, "success");

      if (typeof syncToGoogleDrive === 'function' && localStorage.getItem('showUp_google_token')) {
        syncToGoogleDrive(false);
      }
    }

    function declineSquadInvite(inviteId) {
      const invites = getSquadInvites();
      const invite = invites.find(i => i.id === inviteId);
      if (invite) {
        invite.status = 'declined';
        invite.declinedAt = new Date().toISOString();
        localStorage.setItem('showUp_squad_invites', JSON.stringify(invites));
      }
      renderSquadsTab();
      showToast("Invitation declined.", "info");
    }

    function openJoinSquadModal(prefillCode = '') {
      const input = document.getElementById('join-squad-code-input');
      if (input) {
        input.value = prefillCode ? prefillCode.toUpperCase().trim() : '';
      }
      document.getElementById('join-squad-modal').classList.remove('hidden');
      if (input) {
        setTimeout(() => input.focus(), 150);
      }
    }

    function closeJoinSquadModal() {
      document.getElementById('join-squad-modal').classList.add('hidden');
    }

    function pasteJoinCodeFromClipboard() {
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(text => {
          if (text) {
            const input = document.getElementById('join-squad-code-input');
            if (input) input.value = text.trim().toUpperCase();
            showToast("Pasted code from clipboard", "info");
          }
        }).catch(() => {
          showToast("Please type your code into the box.", "info");
        });
      }
    }

    function submitJoinSquadByCode() {
      const input = document.getElementById('join-squad-code-input');
      if (!input) return;

      const rawCode = input.value.trim().toUpperCase();
      if (!rawCode) {
        showToast("Please enter a valid squad joining code.", "warning");
        input.focus();
        return;
      }

      const user = getAppUser();
      const userEmail = (user.email || '').toLowerCase().trim();
      const squads = getSquads();
      const globalReg = getGlobalSquadRegistry();

      // 1. Check if already in user's squads
      const existingInUserSquads = squads.find(s => (s.inviteCode && s.inviteCode.toUpperCase() === rawCode));
      if (existingInUserSquads) {
        const isMember = existingInUserSquads.members.some(m => m.id === user.id || (m.email && m.email.toLowerCase() === userEmail));
        if (isMember) {
          showToast(`You are already a member of "${existingInUserSquads.name}"!`, "info");
          closeJoinSquadModal();
          return;
        } else {
          existingInUserSquads.members.push({
            id: user.id,
            name: user.name,
            rawName: user.rawName,
            email: user.email,
            avatar: user.picture,
            hasJoined: true,
            inviteStatus: 'accepted',
            isCreator: false,
            isBackupCreator: false,
            isWorkingOut: false,
            currentWorkout: null,
            lastActive: 'Just joined'
          });
          saveSquads(squads);
          saveSquadToGlobalRegistry(existingInUserSquads);
          closeJoinSquadModal();
          renderSquadsTab();
          updateGlobalStatsUI();
          updateSquadBeacon();
          showToast(`🎉 Joined "${existingInUserSquads.name}"!`, "success");
          if (typeof syncToGoogleDrive === 'function' && localStorage.getItem('showUp_google_token')) {
            syncToGoogleDrive(false);
          }
          return;
        }
      }

      // 2. Check in global registry
      const matchInRegistry = globalReg.find(s => s.inviteCode && s.inviteCode.toUpperCase() === rawCode);
      if (matchInRegistry) {
        const squadToImport = JSON.parse(JSON.stringify(matchInRegistry));
        const memberIdx = squadToImport.members.findIndex(m => m.id === user.id || (m.email && m.email.toLowerCase() === userEmail));
        if (memberIdx >= 0) {
          squadToImport.members[memberIdx].id = user.id;
          squadToImport.members[memberIdx].name = user.name;
          squadToImport.members[memberIdx].rawName = user.rawName;
          squadToImport.members[memberIdx].email = user.email;
          squadToImport.members[memberIdx].avatar = user.picture;
          squadToImport.members[memberIdx].hasJoined = true;
          squadToImport.members[memberIdx].inviteStatus = 'accepted';
          squadToImport.members[memberIdx].lastActive = 'Just joined';
        } else {
          squadToImport.members.push({
            id: user.id,
            name: user.name,
            rawName: user.rawName,
            email: user.email,
            avatar: user.picture,
            hasJoined: true,
            inviteStatus: 'accepted',
            isCreator: false,
            isBackupCreator: false,
            isWorkingOut: false,
            currentWorkout: null,
            lastActive: 'Just joined'
          });
        }
        squads.unshift(squadToImport);
        saveSquads(squads);
        closeJoinSquadModal();
        renderSquadsTab();
        updateGlobalStatsUI();
        updateSquadBeacon();
        showToast(`🎉 Joined "${squadToImport.name}" with code ${rawCode}!`, "success");
        if (typeof syncToGoogleDrive === 'function' && localStorage.getItem('showUp_google_token')) {
          syncToGoogleDrive(false);
        }
        return;
      }

      // 3. New external join code -> construct squad with this code
      const newJoinedSquad = {
        id: 'squad_joined_' + Date.now(),
        name: `Squad ${rawCode.replace(/^SHOWUP-?/, '') || rawCode}`,
        motto: 'Consistency in motion • Stronger together',
        icon: 'dumbbell',
        accent: 'emerald',
        inviteCode: rawCode,
        isCollapsed: false,
        createdAt: new Date().toISOString(),
        creatorId: 'creator_' + rawCode,
        creatorName: 'Squad Leader',
        notificationPreferences: {
          inAppPill: true,
          beaconPulse: true,
          hapticPulse: true,
          soundChime: true,
          browserNotify: false
        },
        members: [
          {
            id: 'creator_' + rawCode,
            name: 'Squad Leader',
            rawName: 'Squad Leader',
            email: '',
            avatar: null,
            isCreator: true,
            isWorkingOut: false,
            currentWorkout: null,
            lastActive: 'Active today'
          },
          {
            id: user.id,
            name: user.name,
            rawName: user.rawName,
            email: user.email,
            avatar: user.picture,
            isCreator: false,
            isBackupCreator: false,
            isWorkingOut: false,
            currentWorkout: null,
            lastActive: 'Just joined'
          }
        ]
      };

      squads.unshift(newJoinedSquad);
      saveSquads(squads);
      saveSquadToGlobalRegistry(newJoinedSquad);
      closeJoinSquadModal();
      renderSquadsTab();
      updateGlobalStatsUI();
      updateSquadBeacon();
      showToast(`🎉 Successfully joined squad with code ${rawCode}!`, "success");
      if (typeof syncToGoogleDrive === 'function' && localStorage.getItem('showUp_google_token')) {
        syncToGoogleDrive(false);
      }
    }



    function renderSquadsTab() {
      const container = document.getElementById('squads-list-container');
      if (!container) return;

      const squads = getSquads();
      const user = getAppUser();
      const isLoggedIn = isCustomerLoggedIn();
      const pendingInvites = isLoggedIn ? getPendingSquadInvites() : [];
      let invitesHtml = '';

      if (isLoggedIn && pendingInvites.length > 0) {
        invitesHtml = `
          <!-- LOGGED-IN CUSTOMER PENDING SQUAD INVITATIONS (REQ 11) -->
          <div id="pending-squad-invites-card" class="m3-card rounded-3xl p-5 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950 shadow-xl space-y-3.5">
            <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div class="flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm border border-emerald-500/30 shadow-sm">
                  <i class="fa-solid fa-envelope-open-text"></i>
                </span>
                <div>
                  <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span>Squad Invitations</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">${pendingInvites.length} Pending</span>
                  </h3>
                  <p class="text-[11px] text-slate-400">You were invited to join these squads</p>
                </div>
              </div>
            </div>

            <div class="space-y-2.5">
              ${pendingInvites.map(inv => `
                <div class="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center justify-center text-base flex-shrink-0">
                      <i class="fa-solid fa-${inv.squadIcon || 'dumbbell'}"></i>
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-xs font-bold text-slate-100">${escapeHtml(inv.squadName)}</span>
                        <span class="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Code: ${escapeHtml(inv.inviteCode)}</span>
                      </div>
                      <p class="text-[11px] text-slate-400 mt-0.5 truncate">
                        Invited by <span class="text-slate-200 font-semibold">${escapeHtml(inv.inviterName || 'Squad Creator')}</span>
                        ${inv.inviterEmail ? `<span class="text-slate-500">(${escapeHtml(inv.inviterEmail)})</span>` : ''}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 flex-shrink-0">
                    <button onclick="triggerHaptic('light'); declineSquadInvite('${inv.id}')" class="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-semibold px-3 py-1.5 rounded-xl transition">
                      Decline
                    </button>
                    <button onclick="triggerHaptic('medium'); acceptSquadInvite('${inv.id}')" class="m3-btn-primary text-xs font-bold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20">
                      <i class="fa-solid fa-check"></i>
                      <span>Join Squad</span>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      if (squads.length === 0) {
        container.innerHTML = `
          ${invitesHtml}
          <div class="m3-card rounded-3xl p-8 border border-slate-800 text-center space-y-4">
            <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-2xl mx-auto border border-emerald-500/20">
              <i class="fa-solid fa-people-group"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-100">No Active Squads Yet</h3>
              <p class="text-xs text-slate-400 max-w-sm mx-auto mt-1">Create your first squad or enter a joining code from a teammate to experience real-time quiet accountability notifications.</p>
            </div>
            <div class="flex items-center justify-center gap-2.5 flex-wrap">
              <button onclick="triggerHaptic('medium'); openJoinSquadModal()" class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-4 py-2.5 rounded-2xl text-xs inline-flex items-center gap-2 transition active:scale-95">
                <i class="fa-solid fa-right-to-bracket text-emerald-400"></i>
                <span>Join with Code</span>
              </button>
              <button onclick="triggerHaptic('medium'); openCreateSquadModal()" class="m3-btn-primary font-bold px-5 py-2.5 rounded-2xl text-xs inline-flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95">
                <i class="fa-solid fa-plus"></i>
                <span>Create Your First Squad</span>
              </button>
            </div>
          </div>
        `;
        return;
      }

      const defaultCollapsed = localStorage.getItem('showUp_squads_default_collapsed') === 'true';

      const squadsHtml = squads.map(sq => {
        const isUserCreator = (sq.creatorId === user.id) || sq.members.some(m => (m.id === user.id || m.email === user.email) && m.isCreator);
        const userMember = sq.members.find(m => m.id === user.id || m.email === user.email);
        const isUserBackupCreator = !isUserCreator && (userMember?.isBackupCreator || (sq.backupCreatorId === user.id));
        const otherMembers = sq.members.filter(m => m.id !== user.id && m.email !== user.email);
        const hasBackupCreatorAssigned = sq.backupCreatorId && sq.members.some(m => m.id === sq.backupCreatorId);
        const needsBackupCreatorWarning = isUserCreator && otherMembers.length > 0 && !hasBackupCreatorAssigned;

        const prefs = sq.notificationPreferences || { inAppPill: true, beaconPulse: true, hapticPulse: true, soundChime: true, browserNotify: false };
        const isCollapsed = sq.isCollapsed !== undefined ? !!sq.isCollapsed : defaultCollapsed;
        const activeMembersInSquad = sq.members.filter(m => m.isWorkingOut);
        
        const accentColors = {
          emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
          blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
          purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
          amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
          rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' }
        };
        const color = accentColors[sq.accent] || accentColors.emerald;

        return `
          <div class="m3-card rounded-3xl p-5 border border-slate-800 shadow-xl space-y-4">
            
            <!-- SQUAD HEADER -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isCollapsed ? '' : 'border-b border-slate-800/80 pb-4'}">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-12 h-12 rounded-2xl ${color.bg} ${color.text} border ${color.border} flex items-center justify-center text-xl shadow-lg flex-shrink-0">
                  <i class="fa-solid fa-${sq.icon || 'dumbbell'}"></i>
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="text-base font-extrabold text-slate-100 tracking-tight truncate">${escapeHtml(sq.name)}</h3>
                    ${isUserCreator 
                      ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1"><i class="fa-solid fa-crown text-[9px]"></i> Creator</span>`
                      : isUserBackupCreator
                        ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center gap-1"><i class="fa-solid fa-shield-halved text-[9px]"></i> Backup Creator</span>`
                        : `<span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">Member</span>`
                    }
                  </div>
                  <p class="text-xs text-slate-400 mt-0.5 truncate">${escapeHtml(sq.motto || 'Consistency in motion')}</p>
                </div>
              </div>

              <!-- ACTION BUTTONS -->
              <div class="flex items-center gap-1.5 flex-wrap">
                <!-- SUCCESSION: SECONDARY CREATOR CAN PICK UP THE MANTLE IF CREATOR DATA IS LOST (REQ 2) -->
                ${isUserBackupCreator ? `
                  <button onclick="triggerHaptic('heavy'); pickUpMantlePrompt('${sq.id}')" class="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-amber-500/10" title="Assume primary squad creator role if creator lost backup">
                    <i class="fa-solid fa-crown text-xs text-amber-400"></i>
                    <span>Pick Up The Mantle</span>
                  </button>
                ` : ''}

                <!-- COLLAPSE / EXPAND TOGGLE -->
                <button onclick="triggerHaptic('light'); toggleSquadCollapse('${sq.id}')" class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5" title="${isCollapsed ? 'Expand squad details' : 'Collapse squad card'}">
                  <i class="fa-solid fa-chevron-${isCollapsed ? 'down' : 'up'} text-xs text-slate-400"></i>
                  <span>${isCollapsed ? 'Expand' : 'Collapse'}</span>
                </button>

                <button onclick="triggerHaptic('light'); openSquadNotificationsModal('${sq.id}')" class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5" title="Configure workout notifications">
                  <i class="fa-solid fa-bell text-xs ${prefs.inAppPill || prefs.soundChime ? 'text-emerald-400' : 'text-slate-400'}"></i>
                  <span>Alerts</span>
                </button>

                <button onclick="triggerHaptic('light'); openAddMemberModal('${sq.id}')" class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5" title="Add or invite workout buddy">
                  <i class="fa-solid fa-user-plus text-xs text-blue-400"></i>
                  <span>Invite</span>
                </button>

                <button onclick="triggerHaptic('light'); simulateTeammateWorkout('${sq.id}')" class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5" title="Simulate a teammate starting workout">
                  <i class="fa-solid fa-bolt text-xs text-amber-400"></i>
                  <span>Simulate</span>
                </button>

                <!-- CREATOR DELETE SQUAD BUTTON -->
                ${isUserCreator ? `
                  <button onclick="triggerHaptic('heavy'); deleteSquadPrompt('${sq.id}')" class="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5" title="Permanently delete this squad (Creator only)">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                    <span>Delete</span>
                  </button>
                ` : ''}

                <!-- LEAVE BUTTON -->
                ${isUserCreator
                  ? `<button onclick="triggerHaptic('medium'); handleCreatorLeave('${sq.id}')" class="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5" title="Transfer creator role and leave">
                      <i class="fa-solid fa-right-from-bracket text-xs"></i>
                      <span>Leave</span>
                    </button>`
                  : `<button onclick="triggerHaptic('medium'); leaveSquadAsMember('${sq.id}')" class="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5" title="Leave squad">
                      <i class="fa-solid fa-right-from-bracket text-xs"></i>
                      <span>Leave</span>
                    </button>`
                }
              </div>
            </div>

            <!-- MANDATORY BACKUP CREATOR REQUIREMENT BANNER (REQ 2) -->
            ${needsBackupCreatorWarning ? `
              <div class="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm flex-shrink-0 border border-amber-500/30">
                    <i class="fa-solid fa-shield-halved"></i>
                  </div>
                  <div class="min-w-0">
                    <span class="font-bold text-amber-300 block">Backup Creator Required</span>
                    <span class="text-[11px] text-amber-400/80 block">Assign a secondary creator to preserve the squad if your device or backup file is lost.</span>
                  </div>
                </div>
                <button onclick="triggerHaptic('light'); promptAssignFirstBackupCreator('${sq.id}')" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex-shrink-0 transition shadow-md shadow-amber-500/10">
                  Assign Backup Creator
                </button>
              </div>
            ` : ''}

            <!-- COLLAPSED SUMMARY VIEW -->
            ${isCollapsed ? (() => {
              const currentETDate = getETDateKey();
              const userHistory = JSON.parse(localStorage.getItem('showUp_synced_workouts') || '[]');
              const userCompleted = userHistory.some(w => {
                if (!w) return false;
                const wDate = typeof w === 'string' ? w : w.date;
                if (wDate !== currentETDate) return false;
                if (typeof w === 'object') {
                  return (Array.isArray(w.sets) && w.sets.length > 0) || w.completed === true || w.totalVolume > 0 || w.calories > 0;
                }
                return true;
              });
              const joinedMembers = sq.members.filter(mem => !isMemberYetToJoin(mem, sq, user));
              const yetToJoinCount = sq.members.length - joinedMembers.length;
              const showedUpCount = joinedMembers.filter(mem => {
                const isMe = (mem.id === user.id || mem.email === user.email || mem.id === 'local_user');
                return isMe ? userCompleted : !!(mem.completedToday === true && mem.completedDate === currentETDate);
              }).length;
              const yetToShowUpCount = joinedMembers.length - showedUpCount;

              return `
                <div class="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <div class="flex -space-x-2 overflow-hidden flex-shrink-0">
                      ${sq.members.slice(0, 4).map(m => `
                        <div class="inline-flex h-7 w-7 rounded-xl ring-2 ring-slate-950 bg-slate-900 text-[10px] text-slate-200 font-bold items-center justify-center border border-slate-700">
                          ${getInitials(m.rawName || m.name)}
                        </div>
                      `).join('')}
                    </div>
                    <div class="truncate">
                      <span class="text-slate-200 font-semibold">${sq.members.length} members</span>
                      <span class="text-slate-500 mx-1.5">•</span>
                      <span class="text-emerald-400 font-semibold">${showedUpCount} Showed Up</span>
                      <span class="text-slate-500 mx-1">•</span>
                      <span class="text-slate-400">${yetToShowUpCount} Yet to show up</span>
                      ${yetToJoinCount > 0 ? `
                        <span class="text-slate-500 mx-1">•</span>
                        <span class="text-amber-400/90 font-medium">${yetToJoinCount} Yet to join</span>
                      ` : ''}
                      ${activeMembersInSquad.length > 0 
                        ? `<span class="text-emerald-400 font-semibold ml-1.5"><i class="fa-solid fa-bolt text-[10px]"></i> ${activeMembersInSquad.length} lifting now</span>`
                        : ''
                      }
                    </div>
                  </div>
                  <button onclick="triggerHaptic('light'); toggleSquadCollapse('${sq.id}')" class="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 flex-shrink-0">
                    <span>View Details</span>
                    <i class="fa-solid fa-chevron-down text-[10px]"></i>
                  </button>
                </div>
              `;
            })() : `
              <!-- UNOBTRUSIVE NOTIFICATIONS STATUS PILL ROW -->
              <div class="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                <span class="text-slate-400 font-medium flex items-center gap-1.5">
                  <i class="fa-solid fa-bell text-emerald-400"></i>
                  Active Workout Alerts:
                </span>
                <div class="flex items-center gap-1 flex-wrap">
                  <span class="px-2 py-0.5 rounded-lg border ${prefs.inAppPill ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold' : 'bg-slate-900 text-slate-500 border-slate-800 line-through'}">Pill</span>
                  <span class="px-2 py-0.5 rounded-lg border ${prefs.beaconPulse ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 font-semibold' : 'bg-slate-900 text-slate-500 border-slate-800 line-through'}">Beacon</span>
                  <span class="px-2 py-0.5 rounded-lg border ${prefs.hapticPulse ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-semibold' : 'bg-slate-900 text-slate-500 border-slate-800 line-through'}">Haptic</span>
                  <span class="px-2 py-0.5 rounded-lg border ${prefs.soundChime ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 font-semibold' : 'bg-slate-900 text-slate-500 border-slate-800 line-through'}">Chime</span>
                  <span class="px-2 py-0.5 rounded-lg border ${prefs.browserNotify ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-semibold' : 'bg-slate-900 text-slate-500 border-slate-800 line-through'}">OS Push</span>
                  <button onclick="triggerHaptic('light'); openSquadNotificationsModal('${sq.id}')" class="text-emerald-400 hover:text-emerald-300 ml-1 underline text-[10px]">Edit</button>
                </div>
              </div>

              <!-- MEMBERS LIST -->
              <div class="space-y-2 pt-1">
                <div class="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider px-1">
                  <span>Members (${sq.members.length})</span>
                  <span class="text-[10px] text-slate-500">Invite Code: <code class="text-emerald-400 font-mono">${sq.inviteCode || 'SHOWUP'}</code></span>
                </div>

                <div class="space-y-2">
                  ${sq.members.map(m => {
                    const isThisUser = (m.id === user.id || m.email === user.email || m.id === 'local_user');
                    const isMemberBackupCreator = m.isBackupCreator || (sq.backupCreatorId === m.id);
                    const initials = getInitials(m.rawName || m.name);
                    const isYetToJoin = isMemberYetToJoin(m, sq, user);
                    const showDeliveryBadge = isUserCreator && isYetToJoin && (m.invitedByEmail || m.invitedByPhone || m.inviteStatus === 'delivered');
                    
                    const currentETDate = getETDateKey();
                    const userHistory = JSON.parse(localStorage.getItem('showUp_synced_workouts') || '[]');
                    const userCompletedToday = userHistory.some(w => {
                      if (!w) return false;
                      const wDate = typeof w === 'string' ? w : w.date;
                      if (wDate !== currentETDate) return false;
                      if (typeof w === 'object') {
                        return (Array.isArray(w.sets) && w.sets.length > 0) || w.completed === true || w.totalVolume > 0 || w.calories > 0;
                      }
                      return true;
                    });
                    const hasCompletedToday = isThisUser 
                      ? userCompletedToday 
                      : !!(m.completedToday === true && m.completedDate === currentETDate);
                    
                    return `
                      <div class="bg-slate-950 p-3 rounded-2xl border ${m.isWorkingOut ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/5' : 'border-slate-800'} flex items-center justify-between gap-3 transition">
                        <div class="flex items-center gap-3 min-w-0">
                          <!-- AVATAR -->
                          <div class="relative flex-shrink-0">
                            ${m.avatar 
                              ? `<img src="${m.avatar}" class="w-10 h-10 rounded-xl object-cover border border-slate-700" alt="${escapeHtml(m.rawName)}">`
                              : `<div class="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-bold flex items-center justify-center text-xs">${initials}</div>`
                            }
                            ${m.isWorkingOut 
                              ? `<span class="absolute -top-1 -right-1 flex h-3 w-3">
                                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-950"></span>
                                 </span>`
                              : ''
                            }
                          </div>

                          <!-- DETAILS & EMAIL DELIVERY STATUS (FOR CREATOR) -->
                          <div class="min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                              <span class="text-xs font-bold text-slate-100 truncate">
                                ${escapeHtml(m.rawName || m.name)} ${isThisUser ? '<span class="text-emerald-400 font-normal">(You)</span>' : ''}
                              </span>
                              ${m.isCreator 
                                ? `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-0.5"><i class="fa-solid fa-crown text-[8px]"></i> Creator</span>`
                                : isMemberBackupCreator
                                  ? `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center gap-0.5" title="Secondary / Backup Creator"><i class="fa-solid fa-shield-halved text-[8px]"></i> Backup Creator</span>`
                                  : ''
                              }
                              <!-- VISIBLE INVITE DELIVERY ICON (MAIL WITH CHECK MARK) ONLY BEFORE ATHLETE JOINS -->
                              ${showDeliveryBadge ? `
                                <span class="inline-flex items-center text-emerald-400 text-xs ml-0.5 hover:text-emerald-300 transition" title="Invite delivered to ${escapeHtml(m.inviteEmail || m.invitePhone || m.email || '')}${m.inviteDeliveredAt ? ` at ${escapeHtml(m.inviteDeliveredAt)}` : ''}">
                                  <i class="fa-solid fa-envelope-circle-check"></i>
                                </span>
                              ` : ''}
                              ${m.phone ? `
                                <span class="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800" title="Phone: ${escapeHtml(m.phone)}">
                                  <i class="fa-solid fa-phone text-[9px] text-slate-400"></i>
                                  <span>${escapeHtml(m.phone)}</span>
                                </span>
                              ` : ''}
                            </div>
                            <div class="mt-1 flex items-center gap-2 flex-wrap">
                              <!-- ATHLETE STATUS BADGE -->
                              ${isYetToJoin ? `
                                <span class="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-full" title="Invited — waiting for teammate to join">
                                  <i class="fa-regular fa-clock text-amber-400/80 text-[9px]"></i>
                                  <span>Yet to join</span>
                                </span>
                              ` : hasCompletedToday ? `
                                <span class="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 rounded-full shadow-sm">
                                  <i class="fa-solid fa-circle-check text-emerald-400 text-[9px]"></i>
                                  <span>Showed Up</span>
                                </span>
                              ` : `
                                <span class="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-full">
                                  <i class="fa-regular fa-clock text-amber-400/80 text-[9px]"></i>
                                  <span>Yet to show up</span>
                                </span>
                              `}

                              ${m.isWorkingOut ? `
                                <div class="flex items-center gap-1.5">
                                  <span class="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    Lifting Now: ${escapeHtml(m.currentWorkout || 'Active Session')}
                                  </span>
                                  <!-- CLOSE SIMULATED WORKOUT ACTION ON MEMBER CARD -->
                                  <button onclick="triggerHaptic('light'); stopSpecificMemberWorkout('${sq.id}', '${m.id}')" class="text-[9px] font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-2 py-0.5 rounded-lg transition inline-flex items-center gap-1" title="Close and finish this active workout session">
                                    <i class="fa-solid fa-xmark text-[8px]"></i>
                                    <span>Close Session</span>
                                  </button>
                                </div>
                              ` : ''}
                            </div>
                          </div>
                        </div>

                        <!-- PERMISSION-BASED ACTION CONTROLS -->
                        <div class="flex items-center gap-1.5 flex-shrink-0">
                          <!-- CREATOR CONTROLS OVER MEMBERS (ASSIGN BACKUP CREATOR / RESEND INVITE / REMOVE) -->
                          ${isUserCreator && !isThisUser
                            ? `
                              ${isMemberBackupCreator
                                ? `<span class="text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2 py-1 rounded-xl flex items-center gap-1" title="Assigned Backup Creator"><i class="fa-solid fa-shield-check text-[9px]"></i> Assigned Backup</span>`
                                : `<button onclick="triggerHaptic('light'); assignBackupCreator('${sq.id}', '${m.id}')" class="text-[10px] font-semibold text-slate-300 hover:text-sky-300 bg-slate-900 hover:bg-sky-500/10 border border-slate-700 hover:border-sky-500/30 px-2 py-1 rounded-xl transition flex items-center gap-1" title="Assign backup creator role to ${escapeHtml(m.rawName || m.name)}"><i class="fa-regular fa-star text-[9px] text-sky-400"></i> Make Backup</button>`
                              }
                              ${isYetToJoin ? `
                                <button onclick="triggerHaptic('light'); resendSquadInvite('${sq.id}', '${m.id}')" class="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 bg-slate-900 hover:bg-emerald-500/10 border border-slate-700 hover:border-emerald-500/30 px-2 py-1 rounded-xl transition flex items-center gap-1 shadow-sm" title="Resend squad invitation to ${escapeHtml(m.rawName || m.name)}">
                                  <i class="fa-solid fa-paper-plane text-[9px] text-emerald-400"></i>
                                  <span>Resend Invite</span>
                                </button>
                              ` : ''}
                              <button onclick="triggerHaptic('medium'); removeSquadMember('${sq.id}', '${m.id}')" class="text-slate-500 hover:text-rose-400 p-2 rounded-xl hover:bg-rose-500/10 transition" title="Remove member (Creator only)">
                                <i class="fa-solid fa-user-minus text-xs"></i>
                              </button>
                            `
                            : ''
                          }

                          <!-- BACKUP CREATOR CONTROLS ON OWN ROW -->
                          ${isThisUser && isUserBackupCreator
                            ? `<button onclick="triggerHaptic('heavy'); pickUpMantlePrompt('${sq.id}')" class="text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl hover:bg-amber-500/20 transition flex items-center gap-1" title="Assume primary creator leadership"><i class="fa-solid fa-crown text-[9px] text-amber-400"></i> Pick Up Mantle</button>`
                            : ''
                          }

                          <!-- PRIMARY CREATOR CONTROLS ON OWN ROW -->
                          ${isThisUser && isUserCreator && sq.members.length > 1
                            ? `<button onclick="triggerHaptic('light'); handleCreatorLeave('${sq.id}')" class="text-[10px] text-slate-400 hover:text-amber-400 border border-slate-800 hover:border-amber-500/30 px-2 py-1 rounded-xl transition" title="Transfer creator role">
                                Transfer Role
                               </button>`
                            : ''
                          }
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `}

          </div>
        `;
      }).join('');

      container.innerHTML = (invitesHtml ? invitesHtml : '') + squadsHtml;
      updateSquadsDefaultCollapseUI();
    }



    function openCreateSquadModal() {
      document.getElementById('new-squad-name').value = '';
      document.getElementById('new-squad-motto').value = '';
      selectSquadIcon('dumbbell');
      selectSquadAccent('emerald');
      document.getElementById('create-squad-modal').classList.remove('hidden');
    }

    function closeCreateSquadModal() {
      document.getElementById('create-squad-modal').classList.add('hidden');
    }

    function selectSquadIcon(icon) {
      squadCreateSelectedIcon = icon;
      const icons = ['dumbbell', 'fire', 'trophy', 'bolt', 'crown', 'shield-halved'];
      icons.forEach(ic => {
        const btn = document.getElementById(`squad-icon-${ic}`);
        if (btn) {
          if (ic === icon) {
            btn.className = "h-10 rounded-xl border-2 border-emerald-500 bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm transition";
          } else {
            btn.className = "h-10 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 flex items-center justify-center text-sm transition";
          }
        }
      });
    }

    function selectSquadAccent(accent) {
      squadCreateSelectedAccent = accent;
      const accents = ['emerald', 'blue', 'purple', 'amber', 'rose'];
      accents.forEach(ac => {
        const btn = document.getElementById(`squad-accent-${ac}`);
        if (btn) {
          if (ac === accent) {
            btn.classList.add('border-white/90');
            btn.classList.remove('border-transparent');
          } else {
            btn.classList.remove('border-white/90');
            btn.classList.add('border-transparent');
          }
        }
      });
    }

    function createNewSquadSubmit() {
      const nameInput = document.getElementById('new-squad-name');
      const mottoInput = document.getElementById('new-squad-motto');
      const name = nameInput.value.trim();
      const motto = mottoInput.value.trim() || 'Daily grind & consistency';

      if (!name) {
        showToast("Please enter a squad name", "warning");
        nameInput.focus();
        return;
      }

      const user = getAppUser();
      const squads = getSquads();
      const newSquadId = 'squad_' + Date.now();
      const randomCode = 'SHOWUP-' + Math.random().toString(36).substring(2, 6).toUpperCase();

      const newSquad = {
        id: newSquadId,
        name: name,
        motto: motto,
        icon: squadCreateSelectedIcon || 'dumbbell',
        accent: squadCreateSelectedAccent || 'emerald',
        inviteCode: randomCode,
        isCollapsed: false,
        createdAt: new Date().toISOString(),
        creatorId: user.id,
        creatorName: user.rawName,
        creatorEmail: user.email || '',
        notificationPreferences: {
          inAppPill: true,
          beaconPulse: true,
          hapticPulse: true,
          soundChime: true,
          browserNotify: false
        },
        members: [
          {
            id: user.id,
            name: user.name,
            rawName: user.rawName,
            email: user.email,
            avatar: user.picture,
            isCreator: true,
            isWorkingOut: false,
            currentWorkout: null,
            lastActive: 'Just now'
          }
        ]
      };

      squads.unshift(newSquad);
      saveSquads(squads);
      saveSquadToGlobalRegistry(newSquad);
      closeCreateSquadModal();
      renderSquadsTab();
      updateGlobalStatsUI();
      showToast(`Squad "${name}" created! You are the Creator.`, "success");
    }

    function removeSquadMember(squadId, memberId) {
      const squads = getSquads();
      const squad = squads.find(s => s.id === squadId);
      if (!squad) return;

      const user = getAppUser();
      const isUserCreator = (squad.creatorId === user.id) || squad.members.some(m => (m.id === user.id || m.email === user.email) && m.isCreator);
      if (!isUserCreator) {
        showToast("Only the squad creator can remove other members.", "error");
        return;
      }

      const targetMember = squad.members.find(m => m.id === memberId);
      if (!targetMember) return;

      if (targetMember.id === user.id) {
        handleCreatorLeave(squadId);
        return;
      }

      if (!confirm(`Are you sure you want to remove ${targetMember.rawName || targetMember.name} from "${squad.name}"?`)) {
        return;
      }

      squad.members = squad.members.filter(m => m.id !== memberId);
      saveSquads(squads);
      renderSquadsTab();
      updateSquadBeacon();
      updateGlobalStatsUI();
      showToast(`Removed ${targetMember.rawName || targetMember.name} from squad.`, "info");
    }

    function handleCreatorLeave(squadId) {
      const squads = getSquads();
      const squad = squads.find(s => s.id === squadId);
      if (!squad) return;

      const user = getAppUser();
      const otherMembers = squad.members.filter(m => m.id !== user.id && m.email !== user.email);

      if (otherMembers.length === 0) {
        if (confirm(`You are the only member in "${squad.name}". Leaving will permanently disband and delete this squad. Continue?`)) {
          const updated = squads.filter(s => s.id !== squadId);
          saveSquads(updated);
          renderSquadsTab();
          updateSquadBeacon();
          updateGlobalStatsUI();
          showToast(`Squad "${squad.name}" disbanded.`, "info");
        }
        return;
      }

      transferTargetSquadId = squadId;
      const listEl = document.getElementById('transfer-candidates-list');
      if (listEl) {
        listEl.innerHTML = otherMembers.map((m, idx) => `
          <label class="flex items-center justify-between p-3 rounded-2xl border border-slate-800 bg-slate-950 hover:border-slate-700 cursor-pointer transition">
            <div class="flex items-center gap-3 min-w-0">
              <input type="radio" name="successor-creator-radio" value="${m.id}" ${idx === 0 ? 'checked' : ''} class="w-4 h-4 accent-amber-500 cursor-pointer">
              <div class="min-w-0">
                <span class="text-xs font-bold text-slate-100 block truncate">${escapeHtml(m.rawName || m.name)}</span>
                <span class="text-[10px] text-slate-400 block truncate">${escapeHtml(m.email || 'Squad member')}</span>
              </div>
            </div>
            <span class="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">New Creator</span>
          </label>
        `).join('');
      }

      document.getElementById('transfer-creator-modal').classList.remove('hidden');
    }

    function closeTransferModal() {
      document.getElementById('transfer-creator-modal').classList.add('hidden');
      transferTargetSquadId = null;
    }

    function confirmTransferAndLeave() {
      if (!transferTargetSquadId) return;

      const squads = getSquads();
      const squad = squads.find(s => s.id === transferTargetSquadId);
      if (!squad) return;

      const selectedRadio = document.querySelector('input[name="successor-creator-radio"]:checked');
      if (!selectedRadio) {
        showToast("Please choose a squad member to assign as the new creator.", "warning");
        return;
      }

      const newCreatorId = selectedRadio.value;
      const newCreator = squad.members.find(m => m.id === newCreatorId);
      if (!newCreator) {
        showToast("Selected successor not found.", "error");
        return;
      }

      const user = getAppUser();

      // Transfer Creator Role
      squad.creatorId = newCreator.id;
      squad.creatorName = newCreator.rawName || newCreator.name;
      newCreator.isCreator = true;

      // Remove leaving creator
      squad.members = squad.members.filter(m => m.id !== user.id && m.email !== user.email);

      saveSquads(squads);
      closeTransferModal();
      renderSquadsTab();
      updateSquadBeacon();
      updateGlobalStatsUI();
      showToast(`Transferred creator role to ${newCreator.rawName || newCreator.name} and left squad.`, "success");
    }

    function leaveSquadAsMember(squadId) {
      const squads = getSquads();
      const squad = squads.find(s => s.id === squadId);
      if (!squad) return;

      const user = getAppUser();
      const userMember = squad.members.find(m => m.id === user.id || m.email === user.email);
      if (userMember && userMember.isCreator) {
        handleCreatorLeave(squadId);
        return;
      }

      if (!confirm(`Are you sure you want to leave "${squad.name}"?`)) {
        return;
      }

      squad.members = squad.members.filter(m => m.id !== user.id && m.email !== user.email);
      saveSquads(squads);
      renderSquadsTab();
      updateSquadBeacon();
      updateGlobalStatsUI();
      showToast(`You have left "${squad.name}".`, "info");
    }

    function sendSquadInviteEmail(squad, member) {
      if (!member || !member.email) return false;
      const appUrl = window.location.origin + window.location.pathname;
      const subject = `Invitation to join ${squad.name} on showUp`;
      const body = `Hey ${member.rawName || 'Teammate'},\n\n` +
        `You've been invited to join the "${squad.name}" fitness squad on showUp!\n\n` +
        `Squad Invite Code: ${squad.inviteCode || 'SHOWUP-7X9P'}\n` +
        `Squad Motto: ${squad.motto || 'Consistency is key'}\n\n` +
        `Join and track workouts with us here:\n${appUrl}\n\n` +
        `Let's show up and crush our goals together!`;

      const mailtoUrl = `mailto:${encodeURIComponent(member.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      const link = document.createElement('a');
      link.href = mailtoUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }

    function sendSquadInviteSMS(squad, member) {
      if (!member || !member.phone) return false;
      const appUrl = window.location.origin + window.location.pathname;
      const body = `Join my fitness squad "${squad.name}" on showUp! Squad Invite Code: ${squad.inviteCode || 'SHOWUP'}. Link: ${appUrl}`;
      const smsUrl = `sms:${encodeURIComponent(member.phone)}?&body=${encodeURIComponent(body)}`;
      
      const link = document.createElement('a');
      link.href = smsUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }

    function resendSquadInvite(squadId, memberId) {
      const squads = getSquads();
      const squad = squads.find(s => s.id === squadId);
      if (!squad) return;

      const member = squad.members.find(m => m.id === memberId);
      if (!member) return;

      let emailDispatched = false;
      if (member.email) {
        emailDispatched = sendSquadInviteEmail(squad, member);
      } else if (member.phone) {
        sendSquadInviteSMS(squad, member);
      }

      member.hasJoined = false;
      member.inviteStatus = 'delivered';
      member.inviteDeliveredAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      member.lastInviteSentAt = new Date().toISOString();

      saveSquads(squads);
      renderSquadsTab();

      const recipient = member.email || member.phone || member.rawName;
      showToast(`Invite resent! Invitation delivered to ${recipient}.`, "success");

      if (typeof syncToGoogleDrive === 'function' && localStorage.getItem('showUp_google_token')) {
        syncToGoogleDrive(false);
      }
    }

    function openAddMemberModal(squadId) {
      currentActiveSquadId = squadId;
      const squads = getSquads();
      const squad = squads.find(s => s.id === squadId);
      if (!squad) return;

      document.getElementById('add-member-modal-squad-name').innerText = `Inviting to "${squad.name}"`;
      document.getElementById('modal-squad-invite-code').innerText = squad.inviteCode || 'SHOWUP-7X9P';
      document.getElementById('new-member-name').value = '';
      const emailInput = document.getElementById('new-member-email');
      if (emailInput) emailInput.value = '';
      const phoneInput = document.getElementById('new-member-phone');
      if (phoneInput) phoneInput.value = '';
      const zipInput = document.getElementById('new-member-zip');
      if (zipInput) zipInput.value = '';
      document.getElementById('add-member-modal').classList.remove('hidden');
    }

    function closeAddMemberModal() {
      document.getElementById('add-member-modal').classList.add('hidden');
    }

    function copySquadInviteCode() {
      const code = document.getElementById('modal-squad-invite-code').innerText.trim();
      navigator.clipboard.writeText(code).then(() => {
        showToast(`Invite code ${code} copied to clipboard!`, "success");
      }).catch(() => {
        showToast(`Code: ${code}`, "info");
      });
    }



    function addMemberSubmit() {
      if (!currentActiveSquadId) return;

      const nameInput = document.getElementById('new-member-name');
      const emailInput = document.getElementById('new-member-email');
      const phoneInput = document.getElementById('new-member-phone');
      const zipInput = document.getElementById('new-member-zip');
      const name = nameInput.value.trim();
      const email = emailInput ? emailInput.value.trim() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const enteredZip = zipInput ? zipInput.value.trim() : '';

      if (!name) {
        showToast("Please enter teammate's name", "warning");
        nameInput.focus();
        return;
      }

      if (!email && !phone) {
        showToast("Please enter an email address or phone number for the invitation", "warning");
        if (emailInput) emailInput.focus();
        return;
      }

      const squads = getSquads();
      const squad = squads.find(s => s.id === currentActiveSquadId);
      if (!squad) return;

      const isFirstTeammate = (squad.members.length === 1);
      const shouldBeBackup = isFirstTeammate || !squad.backupCreatorId;

      // Authentic Postal Zip Code determination (entered zip -> user zip -> 20105)
      const memberZip = (enteredZip && /^\d{5}$/.test(enteredZip)) ? enteredZip : getUserZip();
      const memberCoords = getZipCoordinates(memberZip);

      // Ensure delivery tracking metadata is created and logged for invitations
      const newMember = {
        id: 'member_' + Date.now(),
        name: name,
        rawName: name,
        email: email,
        phone: phone,
        invitedByEmail: Boolean(email),
        invitedByPhone: Boolean(phone),
        inviteEmail: email,
        invitePhone: phone,
        inviteStatus: 'delivered',
        hasJoined: false,
        inviteDeliveredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lastInviteSentAt: new Date().toISOString(),
        avatar: null,
        zip: memberZip,
        city: memberCoords.city || `Zip ${memberZip}`,
        lat: memberCoords.lat,
        lng: memberCoords.lng,
        isCreator: false,
        isBackupCreator: shouldBeBackup,
        isWorkingOut: false,
        currentWorkout: null,
        lastActive: 'Just invited'
      };

      if (shouldBeBackup) {
        squad.backupCreatorId = newMember.id;
        squad.backupCreatorName = newMember.rawName;
      }

      // Functional dispatch: launch client email client or SMS
      if (email) {
        recordSquadInvite({
          id: 'invite_' + Date.now(),
          squadId: squad.id,
          squadName: squad.name,
          squadMotto: squad.motto,
          squadIcon: squad.icon,
          squadAccent: squad.accent,
          inviteCode: squad.inviteCode,
          inviterName: squad.creatorName || getAppUser().rawName,
          inviterEmail: getAppUser().email,
          targetEmail: email.toLowerCase(),
          targetName: name,
          invitedAt: new Date().toISOString(),
          status: 'pending'
        });
        sendSquadInviteEmail(squad, newMember);
      } else if (phone) {
        sendSquadInviteSMS(squad, newMember);
      }

      squad.members.push(newMember);
      saveSquads(squads);
      saveSquadToGlobalRegistry(squad);
      closeAddMemberModal();
      renderSquadsTab();
      updateGlobalStatsUI();

      const targetDestination = email || phone;
      if (shouldBeBackup) {
        showToast(`Added ${name} as Backup Creator! Invitation delivered to ${targetDestination}.`, "success");
      } else {
        showToast(`Added ${name}! Invitation delivered to ${targetDestination}.`, "success");
      }
      if (typeof syncToGoogleDrive === 'function' && localStorage.getItem('showUp_google_token')) {
        syncToGoogleDrive(false);
      }
    }

    function openSquadNotificationsModal(squadId) {
      currentActiveSquadId = squadId;
      const squads = getSquads();
      const squad = squads.find(s => s.id === squadId);
      if (!squad) return;

      document.getElementById('notif-modal-squad-name').innerText = `For squad: "${squad.name}"`;

      const prefs = squad.notificationPreferences || {
        inAppPill: true,
        beaconPulse: true,
        hapticPulse: true,
        soundChime: true,
        browserNotify: false
      };

      document.getElementById('pref-pill').checked = !!prefs.inAppPill;
      document.getElementById('pref-beacon').checked = !!prefs.beaconPulse;
      document.getElementById('pref-haptic').checked = !!prefs.hapticPulse;
      document.getElementById('pref-chime').checked = !!prefs.soundChime;
      document.getElementById('pref-browser').checked = !!prefs.browserNotify;

      document.getElementById('squad-notifications-modal').classList.remove('hidden');
    }

    function closeSquadNotificationsModal() {
      document.getElementById('squad-notifications-modal').classList.add('hidden');
    }

    function saveSquadNotificationsSubmit() {
      if (!currentActiveSquadId) return;

      const squads = getSquads();
      const squad = squads.find(s => s.id === currentActiveSquadId);
      if (!squad) return;

      squad.notificationPreferences = {
        inAppPill: document.getElementById('pref-pill').checked,
        beaconPulse: document.getElementById('pref-beacon').checked,
        hapticPulse: document.getElementById('pref-haptic').checked,
        soundChime: document.getElementById('pref-chime').checked,
        browserNotify: document.getElementById('pref-browser').checked
      };

      if (squad.notificationPreferences.browserNotify && 'Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }

      saveSquads(squads);
      closeSquadNotificationsModal();
      renderSquadsTab();
      showToast("Notification preferences updated!", "success");
    }

    function previewCurrentSquadNotifications() {
      const willPill = document.getElementById('pref-pill').checked;
      const willHaptic = document.getElementById('pref-haptic').checked;
      const willChime = document.getElementById('pref-chime').checked;
      const willBrowser = document.getElementById('pref-browser').checked;

      if (willPill) {
        showSquadNotificationPill({ rawName: "Teammate", avatar: null }, "Heavy Incline Press");
      }
      if (willHaptic) {
        triggerSquadHaptic();
      }
      if (willChime) {
        playUnobtrusiveChime();
      }
      if (willBrowser) {
        sendBrowserNotification("ShowUp Squad", "Teammate started: Heavy Incline Press");
      }
    }

    function simulateTeammateWorkout(targetSquadId) {
      const squads = getSquads();
      if (squads.length === 0) {
        showToast("Create a squad first to simulate workout alerts", "info");
        return;
      }

      const squad = targetSquadId ? squads.find(s => s.id === targetSquadId) : squads[0];
      if (!squad) return;

      const user = getAppUser();
      let otherMembers = squad.members.filter(m => m.id !== user.id && m.email !== user.email);

      if (otherMembers.length === 0) {
        showToast("Invite at least one teammate to this squad first to simulate workouts.", "info");
        return;
      }

      const member = otherMembers[Math.floor(Math.random() * otherMembers.length)];
      const workoutNames = [
        "Incline Dumbbell Press & Chest",
        "Barbell Deadlift & Lat Pulls",
        "Barbell Back Squats & Core",
        "Overhead Press & Tricep Burnout",
        "Macebell 360 & Dands"
      ];
      const randomWorkout = workoutNames[Math.floor(Math.random() * workoutNames.length)];

      if (!member.zip || !/^\d{5}$/.test(member.zip)) {
        member.zip = getUserZip() || '20105';
        const coords = getZipCoordinates(member.zip);
        member.city = coords.city;
        member.lat = coords.lat;
        member.lng = coords.lng;
      }

      member.isWorkingOut = true;
      member.currentWorkout = randomWorkout;
      member.workoutStartedAt = new Date().toISOString();
      member.lastActive = 'Active now';

      // Trigger user's chosen unobtrusive notifications for this squad
      triggerSquadWorkoutNotification(squad, member, randomWorkout);

      saveSquads(squads);
      renderSquadsTab();
      updateSquadBeacon();
      updateGlobalStatsUI();
      renderHeatMap();
      showToast(`⚡ ${member.rawName} started a workout: ${randomWorkout}`, "info");
    }

    function triggerSquadWorkoutNotification(squad, member, workoutName) {
      const prefs = squad.notificationPreferences || {
        inAppPill: true,
        beaconPulse: true,
        hapticPulse: true,
        soundChime: true,
        browserNotify: false
      };

      if (prefs.inAppPill) {
        showSquadNotificationPill(member, workoutName);
      }
      if (prefs.beaconPulse) {
        updateSquadBeacon();
      }
      if (prefs.hapticPulse) {
        triggerSquadHaptic();
      }
      if (prefs.soundChime) {
        playUnobtrusiveChime();
      }
      if (prefs.browserNotify) {
        sendBrowserNotification(`ShowUp Squad • ${squad.name}`, `${member.rawName || member.name} just stepped in to lift: ${workoutName}!`);
      }
    }

    function showSquadNotificationPill(member, workoutName) {
      const pill = document.getElementById('squad-notification-pill');
      const avatarEl = document.getElementById('pill-avatar');
      const nameEl = document.getElementById('pill-name');
      const workoutEl = document.getElementById('pill-workout');
      if (!pill || !nameEl || !workoutEl) return;

      if (avatarEl) {
        if (member.avatar) {
          avatarEl.innerHTML = `<img src="${member.avatar}" class="w-full h-full object-cover rounded-xl" alt="avatar">`;
        } else {
          avatarEl.innerText = getInitials(member.rawName || member.name || "SU");
        }
      }

      nameEl.innerText = member.rawName || member.name || "Squad Mate";
      workoutEl.innerText = `Started: ${workoutName || 'Active Workout'}`;

      if (activePillTimeout) {
        clearTimeout(activePillTimeout);
      }

      pill.classList.remove('hidden');
      requestAnimationFrame(() => {
        pill.classList.remove('opacity-0', '-translate-y-6');
        pill.classList.add('opacity-100', 'translate-y-0');
      });

      activePillTimeout = setTimeout(() => {
        dismissSquadPill();
      }, 5500);
    }

    function dismissSquadPill() {
      const pill = document.getElementById('squad-notification-pill');
      if (!pill) return;
      pill.classList.remove('opacity-100', 'translate-y-0');
      pill.classList.add('opacity-0', '-translate-y-6');
      setTimeout(() => {
        pill.classList.add('hidden');
      }, 300);
    }



    function broadcastUserWorkoutStarted(exerciseName) {
      const squads = getSquads();
      const user = getAppUser();
      let changed = false;

      squads.forEach(sq => {
        const userMember = sq.members.find(m => m.id === user.id || m.email === user.email || m.id === 'local_user');
        if (userMember && !userMember.isWorkingOut) {
          userMember.isWorkingOut = true;
          userMember.currentWorkout = exerciseName;
          userMember.workoutStartedAt = new Date().toISOString();
          userMember.lastActive = 'Active now';
          changed = true;
        }
      });

      if (changed) {
        saveSquads(squads);
      }
      updateGlobalStatsUI();
      renderHeatMap();
    }

    function broadcastUserWorkoutEnded() {
      const squads = getSquads();
      const user = getAppUser();
      let changed = false;

      squads.forEach(sq => {
        const userMember = sq.members.find(m => m.id === user.id || m.email === user.email || m.id === 'local_user');
        if (userMember && userMember.isWorkingOut) {
          userMember.isWorkingOut = false;
          userMember.lastActive = 'Just now';
          userMember.currentWorkout = null;
          changed = true;
        }
      });

      if (changed) {
        saveSquads(squads);
      }
      updateGlobalStatsUI();
      renderHeatMap();
    }
