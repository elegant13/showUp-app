/* ==========================================================================
   showUp Unique Visitor Counter & Admin Telemetry Engine (abhi13@gmail.com)
   ========================================================================== */

function getOrSetUniqueVisitorId() {
  let vid = localStorage.getItem(VISITOR_STORAGE_KEY);
  if (!vid) {
    vid = 'uv_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    localStorage.setItem(VISITOR_STORAGE_KEY, vid);
    localStorage.setItem(VISITOR_FIRST_SEEN_KEY, new Date().toISOString());
  }
  return vid;
}

async function initUniqueVisitorCounter() {
  const visitorId = getOrSetUniqueVisitorId();
  const isNewVisitor = !localStorage.getItem(VISITOR_COUNTED_KEY);

  // 1. Get baseline count from verified local global visitors log
  const localLog = getGlobalVisitorsLog();
  let currentCount = Math.max(1, localLog.length);
  const storedCount = parseInt(localStorage.getItem(VISITOR_COUNT_KEY) || '0', 10);
  if (!isNaN(storedCount) && storedCount > currentCount && storedCount < 1000) {
    currentCount = storedCount;
  }

  if (isNewVisitor) {
    localStorage.setItem(VISITOR_COUNTED_KEY, 'true');
  }

  localStorage.setItem(VISITOR_COUNT_KEY, String(currentCount));
  updateVisitorCounterUI(currentCount);

  // 2. Query Firestore global_visitors directly as canonical source of truth
  try {
    const db = getFirestoreDb();
    if (db) {
      const snapshot = await db.collection('global_visitors').get();
      if (snapshot && typeof snapshot.size === 'number' && snapshot.size > 0) {
        const canonicalCount = Math.max(1, snapshot.size);
        localStorage.setItem(VISITOR_COUNT_KEY, String(canonicalCount));
        updateVisitorCounterUI(canonicalCount);
        return;
      }
    }
  } catch (err) {
    console.debug("Firestore visitor count sync notice:", err);
  }

  // 3. Fallback: Keep unified with local telemetry log
  const finalLog = getGlobalVisitorsLog();
  if (finalLog && finalLog.length > 0) {
    updateVisitorCounterUI(finalLog.length);
  }
}

function updateVisitorCounterUI(count) {
  const safeCount = Math.max(1, parseInt(count, 10) || 1);
  const formatted = safeCount.toLocaleString();

  // Top level header visitor counter pill
  const headerEl = document.getElementById('header-visitor-count');
  if (headerEl) headerEl.innerText = formatted;

  // Global Visitors Telemetry Total Visitors (strict lockstep match)
  const adminTotalEl = document.getElementById('admin-telemetry-total-visitors');
  if (adminTotalEl) adminTotalEl.innerText = formatted;

  // Map unique visitor badge
  const mapEl = document.getElementById('map-unique-visitor-count');
  if (mapEl) mapEl.innerText = formatted;

  // Global stats visitor counter
  const globalStatsEl = document.getElementById('global-visitor-counter');
  if (globalStatsEl) globalStatsEl.innerText = formatted;

  // Settings modal unique visitor count
  const settingsEl = document.getElementById('settings-unique-visitor-count');
  if (settingsEl) settingsEl.innerText = formatted;

  const settingsIdEl = document.getElementById('settings-visitor-id-badge');
  if (settingsIdEl) settingsIdEl.innerText = localStorage.getItem(VISITOR_STORAGE_KEY) || 'Active';
}

// ================= ADMIN GLOBAL VISITOR TELEMETRY ENGINE (RESTRICTED TO abhi13@gmail.com, hithesh@gmail.com) =================

let firestoreDb = null;
let unsubscribeAdminTelemetry = null;

function getFirestoreDb() {
  if (firestoreDb) return firestoreDb;
  try {
    if (typeof firebase !== 'undefined' && firebase.initializeApp) {
      if (!firebase.apps || !firebase.apps.length) {
        if (typeof FIREBASE_CONFIG !== 'undefined') {
          firebase.initializeApp(FIREBASE_CONFIG);
        }
      }
      if (firebase.apps && firebase.apps.length) {
        firestoreDb = firebase.firestore();
        return firestoreDb;
      }
    }
  } catch (err) {
    console.debug("Firestore initialization notice:", err);
  }
  return null;
}

function isGlobalVisitorTelemetryAdmin() {
  const user = getAppUser();
  const email = (user && user.email ? user.email : '').toLowerCase().trim();
  return email === 'abhi13@gmail.com' || email === 'hithesh@gmail.com';
}

function initGlobalVisitorTelemetry() {
  getFirestoreDb();
  getGlobalVisitorsLog();
  updateGlobalVisitorTelemetryUI();
}

function getGlobalVisitorsLog() {
  let log = [];
  try {
    log = JSON.parse(localStorage.getItem(GLOBAL_VISITORS_LOG_KEY) || '[]');
  } catch (e) {
    log = [];
  }
  if (!Array.isArray(log)) log = [];
  return log;
}

function saveGlobalVisitorsLog(log) {
  try {
    localStorage.setItem(GLOBAL_VISITORS_LOG_KEY, JSON.stringify(log));
  } catch (e) { }
}

function parseCityAndState(cityStr, defaultZip = '') {
  if (!cityStr) return { city: 'Ashburn', state: 'VA', stateName: 'Virginia' };

  let clean = String(cityStr).trim();
  let parts = clean.split(',').map(p => p.trim());
  let city = parts[0] || 'Ashburn';
  let rawState = parts[1] || 'VA';

  rawState = rawState.replace(/\d+/g, '').trim().toUpperCase();
  if (rawState.length > 2) {
    for (const [code, name] of Object.entries(US_STATE_NAMES)) {
      if (name.toLowerCase() === rawState.toLowerCase()) {
        rawState = code;
        break;
      }
    }
  }
  if (rawState.length > 2) rawState = rawState.slice(0, 2);
  if (!rawState) rawState = 'VA';

  const stateName = US_STATE_NAMES[rawState] || rawState;
  return { city, state: rawState, stateName };
}

function recordCurrentVisitorLocation(loc) {
  if (!loc) return;
  const log = getGlobalVisitorsLog();
  const visitorId = getOrSetUniqueVisitorId();
  const parsed = parseCityAndState(loc.city, loc.zip);
  const nowISO = new Date().toISOString();

  const existingIndex = log.findIndex(item => item.id === visitorId || (item.zip === loc.zip && item.city.toLowerCase() === parsed.city.toLowerCase()));
  if (existingIndex >= 0) {
    log[existingIndex].city = parsed.city;
    log[existingIndex].state = parsed.state;
    log[existingIndex].stateName = parsed.stateName;
    log[existingIndex].zip = loc.zip || log[existingIndex].zip;
    log[existingIndex].lastSeen = nowISO;
    log[existingIndex].visitCount = (log[existingIndex].visitCount || 1) + 1;
  } else {
    log.push({
      id: visitorId,
      city: parsed.city,
      state: parsed.state,
      stateName: parsed.stateName,
      zip: loc.zip || '20147',
      country: 'US',
      lat: loc.lat || 0,
      lng: loc.lng || 0,
      firstSeen: nowISO,
      lastSeen: nowISO,
      visitCount: 1
    });
  }

  saveGlobalVisitorsLog(log);
  updateVisitorCounterUI(Math.max(1, log.length));
  updateGlobalVisitorTelemetryUI();

  // Cross-device cloud sync: Upsert anonymous location record in Firestore
  try {
    const db = getFirestoreDb();
    if (db) {
      const docData = {
        id: visitorId,
        city: parsed.city,
        state: parsed.state,
        stateName: parsed.stateName,
        zip: loc.zip || '',
        country: 'US',
        lat: loc.lat || 0,
        lng: loc.lng || 0,
        lastSeen: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
          ? firebase.firestore.FieldValue.serverTimestamp()
          : nowISO,
        firstSeen: (existingIndex >= 0 && log[existingIndex].firstSeen) ? log[existingIndex].firstSeen : nowISO,
        visitCount: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
          ? firebase.firestore.FieldValue.increment(1)
          : 1
      };
      db.collection('global_visitors').doc(visitorId).set(docData, { merge: true })
        .catch(err => console.debug("Firestore visitor log sync notice:", err));
    }
  } catch (err) {
    console.debug("Firestore cloud record exception:", err);
  }
}

function setAdminVisitorViewMode(mode) {
  adminVisitorViewMode = mode;
  const stateTab = document.getElementById('admin-view-tab-state');
  const cityTab = document.getElementById('admin-view-tab-city');
  const stateContainer = document.getElementById('admin-state-groups-container');
  const cityContainer = document.getElementById('admin-city-log-container');

  if (mode === 'state') {
    if (stateTab) {
      stateTab.className = "px-3 py-1.5 rounded-xl text-xs font-bold transition bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm flex items-center gap-1.5";
    }
    if (cityTab) {
      cityTab.className = "px-3 py-1.5 rounded-xl text-xs font-semibold transition text-slate-400 hover:text-slate-200 flex items-center gap-1.5";
    }
    if (stateContainer) stateContainer.classList.remove('hidden');
    if (cityContainer) cityContainer.classList.add('hidden');
  } else {
    if (stateTab) {
      stateTab.className = "px-3 py-1.5 rounded-xl text-xs font-semibold transition text-slate-400 hover:text-slate-200 flex items-center gap-1.5";
    }
    if (cityTab) {
      cityTab.className = "px-3 py-1.5 rounded-xl text-xs font-bold transition bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm flex items-center gap-1.5";
    }
    if (stateContainer) stateContainer.classList.add('hidden');
    if (cityContainer) cityContainer.classList.remove('hidden');
  }
  renderAdminGlobalVisitorTelemetry();
}

function handleAdminVisitorSearch(query) {
  adminVisitorSearchQuery = (query || '').toLowerCase().trim();
  renderAdminGlobalVisitorTelemetry();
}

function subscribeAdminGlobalVisitorTelemetry() {
  if (!isGlobalVisitorTelemetryAdmin()) return;
  const db = getFirestoreDb();
  if (!db) return;
  if (unsubscribeAdminTelemetry) {
    unsubscribeAdminTelemetry();
    unsubscribeAdminTelemetry = null;
  }
  try {
    unsubscribeAdminTelemetry = db.collection('global_visitors').onSnapshot((snapshot) => {
      const remoteLog = [];
      snapshot.forEach(doc => {
        const d = doc.data();
        let lastSeenISO = new Date().toISOString();
        if (d.lastSeen && typeof d.lastSeen.toDate === 'function') {
          lastSeenISO = d.lastSeen.toDate().toISOString();
        } else if (typeof d.lastSeen === 'string') {
          lastSeenISO = d.lastSeen;
        }
        let firstSeenISO = lastSeenISO;
        if (d.firstSeen && typeof d.firstSeen.toDate === 'function') {
          firstSeenISO = d.firstSeen.toDate().toISOString();
        } else if (typeof d.firstSeen === 'string') {
          firstSeenISO = d.firstSeen;
        }
        remoteLog.push({
          id: d.id || doc.id,
          city: d.city || 'Unknown',
          state: d.state || 'VA',
          stateName: d.stateName || 'Virginia',
          zip: d.zip || '',
          country: d.country || 'US',
          lat: d.lat || 0,
          lng: d.lng || 0,
          firstSeen: firstSeenISO,
          lastSeen: lastSeenISO,
          visitCount: typeof d.visitCount === 'number' ? d.visitCount : 1
        });
      });
      if (remoteLog.length > 0) {
        saveGlobalVisitorsLog(remoteLog);
        renderAdminGlobalVisitorTelemetry();
      }
      const liveTotal = Math.max(1, (snapshot && snapshot.size) ? snapshot.size : remoteLog.length);
      updateVisitorCounterUI(liveTotal);
    }, (err) => {
      console.warn("Firestore live telemetry subscription notice:", err);
    });
  } catch (err) {
    console.debug("Firestore live subscription exception:", err);
  }
}

async function refreshAdminVisitorData() {
  detectUserZipFromIP();
  const db = getFirestoreDb();
  if (db) {
    try {
      const snapshot = await db.collection('global_visitors').get();
      const remoteLog = [];
      snapshot.forEach(doc => {
        const d = doc.data();
        let lastSeenISO = new Date().toISOString();
        if (d.lastSeen && typeof d.lastSeen.toDate === 'function') {
          lastSeenISO = d.lastSeen.toDate().toISOString();
        } else if (typeof d.lastSeen === 'string') {
          lastSeenISO = d.lastSeen;
        }
        let firstSeenISO = lastSeenISO;
        if (d.firstSeen && typeof d.firstSeen.toDate === 'function') {
          firstSeenISO = d.firstSeen.toDate().toISOString();
        } else if (typeof d.firstSeen === 'string') {
          firstSeenISO = d.firstSeen;
        }
        remoteLog.push({
          id: d.id || doc.id,
          city: d.city || 'Unknown',
          state: d.state || 'VA',
          stateName: d.stateName || 'Virginia',
          zip: d.zip || '',
          country: d.country || 'US',
          lat: d.lat || 0,
          lng: d.lng || 0,
          firstSeen: firstSeenISO,
          lastSeen: lastSeenISO,
          visitCount: typeof d.visitCount === 'number' ? d.visitCount : 1
        });
      });
      if (remoteLog.length > 0) {
        saveGlobalVisitorsLog(remoteLog);
        updateVisitorCounterUI(remoteLog.length);
      }
    } catch (err) {
      console.warn("Firestore refresh notice:", err);
    }
  }
  renderAdminGlobalVisitorTelemetry();
  showToast("Global visitor telemetry updated", "success");
}

function exportVisitorDataJSON() {
  const log = getGlobalVisitorsLog();
  const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `showUp_global_visitors_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("Visitor telemetry JSON exported", "success");
}

function scrollToAdminTelemetry() {
  const section = document.getElementById('admin-global-visitor-telemetry');
  if (section) {
    section.classList.remove('hidden');
    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const dropdown = document.getElementById('profile-dropdown-menu');
  if (dropdown) dropdown.classList.add('hidden');
}

function updateGlobalVisitorTelemetryUI() {
  const section = document.getElementById('admin-global-visitor-telemetry');
  const menuBadge = document.getElementById('profile-admin-telemetry-item');

  const isAdmin = isGlobalVisitorTelemetryAdmin();
  if (!isAdmin) {
    if (unsubscribeAdminTelemetry) {
      unsubscribeAdminTelemetry();
      unsubscribeAdminTelemetry = null;
    }
    if (section) {
      section.classList.add('hidden');
      section.style.display = 'none';
    }
    if (menuBadge) menuBadge.classList.add('hidden');
    return;
  }

  if (section) {
    section.classList.remove('hidden');
    section.style.display = 'block';
  }
  if (menuBadge) menuBadge.classList.remove('hidden');

  renderAdminGlobalVisitorTelemetry();
  subscribeAdminGlobalVisitorTelemetry();
}

function renderAdminGlobalVisitorTelemetry() {
  if (!isGlobalVisitorTelemetryAdmin()) return;

  const log = getGlobalVisitorsLog();
  const stateContainer = document.getElementById('admin-state-groups-container');
  const cityContainer = document.getElementById('admin-city-log-container');
  const totalVisitorsEl = document.getElementById('admin-telemetry-total-visitors');
  const totalStatesEl = document.getElementById('admin-telemetry-total-states');
  const topStateEl = document.getElementById('admin-telemetry-top-state');
  const totalCitiesEl = document.getElementById('admin-telemetry-total-cities');
  const lastSyncEl = document.getElementById('admin-telemetry-last-sync');

  // 1. Calculate Aggregations
  const stateGroups = {};
  const uniqueCitiesSet = new Set();
  let totalVisitorsCount = 0;
  let totalVisitsCount = 0;

  log.forEach(item => {
    const stateKey = (item.state || 'VA').toUpperCase();
    const stateName = item.stateName || US_STATE_NAMES[stateKey] || stateKey;
    const cityName = item.city || 'Ashburn';
    const visits = Number(item.visitCount) || 1;

    uniqueCitiesSet.add(`${cityName.toLowerCase()}_${stateKey.toLowerCase()}`);
    totalVisitorsCount += 1;
    totalVisitsCount += visits;

    if (!stateGroups[stateKey]) {
      stateGroups[stateKey] = {
        stateCode: stateKey,
        stateName: stateName,
        visitorCount: 0,
        visitsTotal: 0,
        cities: {},
        lastSeen: item.lastSeen || new Date().toISOString()
      };
    }

    stateGroups[stateKey].visitorCount += 1;
    stateGroups[stateKey].visitsTotal += visits;
    stateGroups[stateKey].cities[cityName] = (stateGroups[stateKey].cities[cityName] || 0) + visits;

    if (item.lastSeen && new Date(item.lastSeen) > new Date(stateGroups[stateKey].lastSeen)) {
      stateGroups[stateKey].lastSeen = item.lastSeen;
    }
  });

  const sortedStates = Object.values(stateGroups).sort((a, b) => b.visitorCount - a.visitorCount || b.visitsTotal - a.visitsTotal);
  const uniqueStatesCount = sortedStates.length;
  const topState = sortedStates[0] ? `${sortedStates[0].stateName} (${sortedStates[0].stateCode})` : '-';

  // Update Summary Tiles
  if (totalVisitorsEl) totalVisitorsEl.innerText = totalVisitorsCount.toLocaleString();
  if (totalStatesEl) totalStatesEl.innerText = uniqueStatesCount;
  if (topStateEl) topStateEl.innerText = topState;
  if (totalCitiesEl) totalCitiesEl.innerText = uniqueCitiesSet.size;
  if (lastSyncEl) lastSyncEl.innerText = `Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  // Guarantee top level visitors metric and telemetry total visitors metric remain strictly identical
  const canonicalTotal = Math.max(1, totalVisitorsCount);
  updateVisitorCounterUI(canonicalTotal);

  // 2. Filter data by search query if present
  const q = adminVisitorSearchQuery;
  const filteredStates = sortedStates.filter(st => {
    if (!q) return true;
    const matchState = st.stateName.toLowerCase().includes(q) || st.stateCode.toLowerCase().includes(q);
    const matchCity = Object.keys(st.cities).some(c => c.toLowerCase().includes(q));
    return matchState || matchCity;
  });

  // 3. Render State Groups View
  if (stateContainer) {
    if (filteredStates.length === 0) {
      stateContainer.innerHTML = `
            <div class="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
              <i class="fa-solid fa-magnifying-glass mb-2 text-base text-slate-600 block"></i>
              No states or cities matched "${q}". Try another search term.
            </div>
          `;
    } else {
      stateContainer.innerHTML = filteredStates.map((st, idx) => {
        const percentage = totalVisitorsCount > 0 ? ((st.visitorCount / totalVisitorsCount) * 100).toFixed(1) : '0.0';
        const sortedCityNames = Object.keys(st.cities).sort((a, b) => st.cities[b] - st.cities[a]);

        return `
              <div class="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/90 hover:border-purple-500/40 transition space-y-2.5">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2.5">
                    <span class="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono font-black text-xs flex items-center justify-center shrink-0">
                      ${st.stateCode}
                    </span>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-slate-100 text-xs sm:text-sm">${st.stateName}</span>
                        <span class="text-[10px] text-slate-500 font-mono">#${idx + 1}</span>
                      </div>
                      <p class="text-[10px] text-slate-400">
                        ${sortedCityNames.length} ${sortedCityNames.length === 1 ? 'City' : 'Cities'} Active • ${st.visitsTotal} ${st.visitsTotal === 1 ? 'visit' : 'total visits'}
                      </p>
                    </div>
                  </div>

                  <div class="text-right shrink-0">
                    <span class="text-xs sm:text-sm font-black font-mono text-purple-400">${st.visitorCount} ${st.visitorCount === 1 ? 'Visitor' : 'Visitors'}</span>
                    <span class="text-[10px] text-slate-400 block font-mono font-bold">${percentage}% share</span>
                  </div>
                </div>

                <!-- Progress Bar Distribution -->
                <div class="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                  <div class="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full transition-all duration-500" style="width: ${Math.max(4, percentage)}%;"></div>
                </div>

                <!-- City Badges in this State -->
                <div class="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span class="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mr-1">Cities:</span>
                  ${sortedCityNames.map(city => `
                    <span class="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300 flex items-center gap-1">
                      <span class="font-medium text-slate-200">${city}</span>
                      <span class="text-purple-400 font-mono font-bold">(${st.cities[city]})</span>
                    </span>
                  `).join('')}
                </div>
              </div>
            `;
      }).join('');
    }
  }

  // 4. Render City & State Detailed Log View
  if (cityContainer) {
    const filteredLog = log.filter(item => {
      if (!q) return true;
      const c = (item.city || '').toLowerCase();
      const s = (item.state || '').toLowerCase();
      const sn = (item.stateName || '').toLowerCase();
      const z = (item.zip || '').toLowerCase();
      return c.includes(q) || s.includes(q) || sn.includes(q) || z.includes(q);
    });

    if (filteredLog.length === 0) {
      cityContainer.innerHTML = `
            <div class="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
              <i class="fa-solid fa-location-dot mb-2 text-base text-slate-600 block"></i>
              No visitor location records matched "${q}".
            </div>
          `;
    } else {
      cityContainer.innerHTML = `
            <div class="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="border-b border-slate-800 bg-slate-900/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th class="px-3.5 py-2.5">City & State</th>
                    <th class="px-3 py-2.5">State Code</th>
                    <th class="px-3 py-2.5">Postal / Zip</th>
                    <th class="px-3 py-2.5 text-center">Hits</th>
                    <th class="px-3.5 py-2.5 text-right">Last Active</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-900 text-slate-300">
                  ${filteredLog.map(item => {
        const timeAgo = formatTimeAgo(item.lastSeen || item.firstSeen);
        return `
                      <tr class="hover:bg-slate-900/60 transition">
                        <td class="px-3.5 py-2.5 font-bold text-slate-100 flex items-center gap-1.5">
                          <i class="fa-solid fa-location-dot text-[10px] text-purple-400"></i>
                          <span>${item.city}, ${item.state}</span>
                        </td>
                        <td class="px-3 py-2.5">
                          <span class="px-1.5 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-[10px] font-mono font-bold text-purple-300">${item.state}</span>
                        </td>
                        <td class="px-3 py-2.5 font-mono text-slate-400">${item.zip || '-'}</td>
                        <td class="px-3 py-2.5 text-center font-mono font-bold text-emerald-400">${item.visitCount || 1}</td>
                        <td class="px-3.5 py-2.5 text-right text-[11px] text-slate-400">${timeAgo}</td>
                      </tr>
                    `;
      }).join('')}
                </tbody>
              </table>
            </div>
          `;
    }
  }
}
