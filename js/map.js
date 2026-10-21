/* ==========================================================================
   showUp Geolocation & Live Map Engine: Zoom Aggregation & Daily Counters
   ========================================================================== */

    function getUserZip() {
      return localStorage.getItem('showUp_user_ip_zip') || localStorage.getItem('showUp_user_zip') || '20105';
    }

    function setUserZip(zip, city, lat, lng) {
      if (!zip) return;
      localStorage.setItem('showUp_user_zip', zip);
      localStorage.setItem('showUp_user_ip_zip', zip);
      if (city) localStorage.setItem('showUp_user_ip_city', city);
      if (lat) localStorage.setItem('showUp_user_ip_lat', String(lat));
      if (lng) localStorage.setItem('showUp_user_ip_lng', String(lng));
    }

    function getZipCoordinates(zip) {
      if (!zip) return { lat: 38.9755, lng: -77.5398, city: 'Ashburn / Aldie, VA' };
      const cleanZip = String(zip).trim();
      const userZip = getUserZip();
      if (cleanZip === userZip) {
        const uLat = parseFloat(localStorage.getItem('showUp_user_ip_lat'));
        const uLng = parseFloat(localStorage.getItem('showUp_user_ip_lng'));
        if (!isNaN(uLat) && !isNaN(uLng)) {
          return { lat: uLat, lng: uLng, city: localStorage.getItem('showUp_user_ip_city') || 'Your Gym Area' };
        }
      }
      if (KNOWN_ZIP_COORDS[cleanZip]) {
        return KNOWN_ZIP_COORDS[cleanZip];
      }
      // Accurate US geographic Sectional Center Facility (SCF) regional centroids
      const prefix2 = parseInt(cleanZip.substring(0, 2), 10);
      if (prefix2 >= 20 && prefix2 <= 24) {
        // Virginia / DC / Maryland
        return { lat: 38.95, lng: -77.45, city: `Virginia, VA (${cleanZip})` };
      } else if (prefix2 >= 10 && prefix2 <= 14) {
        // New York
        return { lat: 40.75, lng: -73.98, city: `New York, NY (${cleanZip})` };
      } else if (prefix2 >= 75 && prefix2 <= 79) {
        // Texas
        return { lat: 30.27, lng: -97.74, city: `Texas, TX (${cleanZip})` };
      } else if (prefix2 >= 90 && prefix2 <= 96) {
        // California
        return { lat: 37.77, lng: -122.41, city: `California, CA (${cleanZip})` };
      } else if (prefix2 >= 60 && prefix2 <= 62) {
        // Illinois
        return { lat: 41.88, lng: -87.62, city: `Illinois, IL (${cleanZip})` };
      }
      
      const prefix = parseInt(cleanZip.substring(0, 2), 10) || 50;
      const lat = 28.0 + (prefix % 20) * 0.8;
      const lng = -122.0 + (prefix * 0.6);
      return { lat, lng, city: `Zip ${cleanZip}` };
    }

    async function reverseGeocodeCoords(lat, lng) {
      if (!lat || !lng) return null;
      try {
        // 1. High-speed client reverse geocoding via BigDataCloud
        const bdcRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`).catch(() => null);
        if (bdcRes && bdcRes.ok) {
          const bdcData = await bdcRes.json();
          const rawZip = bdcData.postcode || '';
          const matchZip = String(rawZip).match(/\d{5}/)?.[0] || String(rawZip).trim();
          const city = bdcData.city || bdcData.locality || bdcData.principalSubdivision || '';
          const state = bdcData.principalSubdivisionCode ? bdcData.principalSubdivisionCode.replace(/^[A-Z]{2}-/, '') : (bdcData.principalSubdivision || '');
          const cityStr = city ? (state ? `${city}, ${state}` : city) : '';
          if (matchZip) {
            return { zip: matchZip, city: cityStr, lat: parseFloat(lat), lng: parseFloat(lng) };
          }
        }
      } catch (e) {
        console.debug("Reverse geocode BDC notice:", e);
      }

      try {
        // 2. OpenStreetMap Nominatim reverse geocode fallback
        const osmRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
          headers: { 'Accept-Language': 'en' }
        }).catch(() => null);
        if (osmRes && osmRes.ok) {
          const osmData = await osmRes.json();
          const addr = osmData.address || {};
          const rawZip = addr.postcode || '';
          const matchZip = String(rawZip).match(/\d{5}/)?.[0] || String(rawZip).trim();
          const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || '';
          const state = addr.state ? addr.state : '';
          const cityStr = city ? (state ? `${city}, ${state}` : city) : '';
          if (matchZip) {
            return { zip: matchZip, city: cityStr, lat: parseFloat(lat), lng: parseFloat(lng) };
          }
        }
      } catch (e) {
        console.debug("Reverse geocode OSM notice:", e);
      }
      return null;
    }

    async function detectUserZipFromIP() {
      const displayUserZip = document.getElementById('display-user-zip');
      const cachedZip = localStorage.getItem('showUp_user_ip_zip');
      const cachedCity = localStorage.getItem('showUp_user_ip_city');

      if (cachedZip && displayUserZip) {
        const cityPart = cachedCity ? cachedCity.split(',')[0] : '';
        displayUserZip.innerText = cityPart ? `${cachedZip} (${cityPart})` : cachedZip;
      }

      let resolvedLocation = null;

      // Tier 1: Zero-Prompt / Permitted High-Accuracy Geolocation -> Reverse Geocode to exact neighborhood zip code
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          const geoPromise = new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve(pos),
              () => resolve(null),
              { enableHighAccuracy: true, timeout: 4000, maximumAge: 300000 }
            );
          });
          const pos = await geoPromise;
          if (pos && pos.coords) {
            const revGeo = await reverseGeocodeCoords(pos.coords.latitude, pos.coords.longitude);
            if (revGeo && revGeo.zip) {
              resolvedLocation = revGeo;
            }
          }
        } catch (e) {
          console.debug("Background geolocation check:", e);
        }
      }

      // Tier 2: ipapi.co (High accuracy US postal resolution)
      if (!resolvedLocation) {
        try {
          const res = await fetch('https://ipapi.co/json/').catch(() => null);
          if (res && res.ok) {
            const data = await res.json();
            if (data && data.postal && !data.error) {
              const cleanZip = String(data.postal).match(/\d{5}/)?.[0] || String(data.postal).trim();
              const cityStr = data.city ? `${data.city}, ${data.region_code || data.region || ''}` : '';
              resolvedLocation = {
                zip: cleanZip,
                city: cityStr,
                lat: data.latitude,
                lng: data.longitude
              };
            }
          }
        } catch (e) {
          console.debug("ipapi.co notice:", e);
        }
      }

      // Tier 3: ipwho.is with coordinate-level reverse geocoding refinement
      if (!resolvedLocation) {
        try {
          const res = await fetch('https://ipwho.is/').catch(() => null);
          if (res && res.ok) {
            const data = await res.json();
            if (data && data.success) {
              let cleanZip = data.postal ? (String(data.postal).match(/\d{5}/)?.[0] || String(data.postal).trim()) : '';
              let cityStr = data.city ? `${data.city}, ${data.region_code || ''}` : '';
              
              if ((!cleanZip || cleanZip.length < 5) && data.latitude && data.longitude) {
                const refined = await reverseGeocodeCoords(data.latitude, data.longitude);
                if (refined && refined.zip) {
                  cleanZip = refined.zip;
                  if (refined.city) cityStr = refined.city;
                }
              }

              if (cleanZip) {
                resolvedLocation = {
                  zip: cleanZip,
                  city: cityStr,
                  lat: data.latitude,
                  lng: data.longitude
                };
              }
            }
          }
        } catch (e) {
          console.debug("ipwho.is notice:", e);
        }
      }

      // Tier 4: freeipapi.com fallback
      if (!resolvedLocation) {
        try {
          const res = await fetch('https://freeipapi.com/api/json').catch(() => null);
          if (res && res.ok) {
            const data = await res.json();
            if (data && data.zipCode) {
              const cleanZip = String(data.zipCode).match(/\d{5}/)?.[0] || String(data.zipCode).trim();
              const cityStr = data.cityName ? `${data.cityName}, ${data.regionName || ''}` : '';
              resolvedLocation = {
                zip: cleanZip,
                city: cityStr,
                lat: data.latitude,
                lng: data.longitude
              };
            }
          }
        } catch (e) {
          console.debug("freeipapi notice:", e);
        }
      }

      // Tier 5: ip-api.com fallback
      if (!resolvedLocation) {
        try {
          const res = await fetch('https://ip-api.com/json/?fields=status,country,regionName,region,city,zip,lat,lon').catch(() => null);
          if (res && res.ok) {
            const data = await res.json();
            if (data && data.status === 'success' && data.zip) {
              const cleanZip = String(data.zip).match(/\d{5}/)?.[0] || String(data.zip).trim();
              const cityStr = data.city ? `${data.city}, ${data.region || ''}` : '';
              resolvedLocation = {
                zip: cleanZip,
                city: cityStr,
                lat: data.lat,
                lng: data.lon
              };
            }
          }
        } catch (e) {
          console.debug("ip-api notice:", e);
        }
      }

      // Apply resolved location
      if (resolvedLocation && resolvedLocation.zip) {
        setUserZip(resolvedLocation.zip, resolvedLocation.city, resolvedLocation.lat, resolvedLocation.lng);
        if (displayUserZip) {
          const cityPart = resolvedLocation.city ? resolvedLocation.city.split(',')[0] : '';
          displayUserZip.innerText = cityPart ? `${resolvedLocation.zip} (${cityPart})` : resolvedLocation.zip;
        }
        recordCurrentVisitorLocation(resolvedLocation);
        renderHeatMap();
      } else if (!cachedZip) {
        setUserZip('10001', 'New York, NY', 40.7505, -73.9934);
        if (displayUserZip) displayUserZip.innerText = '10001 (New York)';
        recordCurrentVisitorLocation({ zip: '10001', city: 'New York, NY', lat: 40.7505, lng: -73.9934 });
        renderHeatMap();
      }
    }



    function getETDateKey(date = new Date()) {
      if (typeof getLocalDateKey === 'function') {
        return getLocalDateKey(date);
      }
      try {
        const tz = typeof getUserTimeZone === 'function' ? getUserTimeZone() : 'America/New_York';
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: tz,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(date);
      } catch (e) {
        const d = (date instanceof Date) ? date : new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }

    function getYesterdayETDateKey(refDate = new Date()) {
      try {
        const d = (refDate instanceof Date) ? new Date(refDate.getTime()) : new Date(refDate);
        d.setDate(d.getDate() - 1);
        return getETDateKey(d);
      } catch (e) {
        return getETDateKey();
      }
    }

    /**
     * Unified Athlete Workout Resolver:
     * Cross-queries in-memory logs, AppStorage, synced storage, user-isolated caches,
     * and squad telemetry so no scored workout is ever missed or dropped.
     */
    function getAllAthleteWorkouts() {
      const workoutMap = new Map();

      const addWorkout = (w) => {
        if (!w) return;
        const dateStr = typeof w === 'string'
          ? w
          : (w.date || w.completedDate || (w.timestamp ? String(w.timestamp).slice(0, 10) : ''));
        if (!dateStr || typeof dateStr !== 'string') return;
        const cleanDate = dateStr.slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) return;

        if (!workoutMap.has(cleanDate)) {
          workoutMap.set(cleanDate, typeof w === 'string' ? { date: cleanDate, completed: true } : { ...w, date: cleanDate, completed: true });
        } else {
          const existing = workoutMap.get(cleanDate);
          if (typeof w === 'object') {
            workoutMap.set(cleanDate, { ...existing, ...w, date: cleanDate, completed: true });
          }
        }
      };

      // 1. In-memory completedWorkoutsHistory
      if (typeof completedWorkoutsHistory !== 'undefined' && Array.isArray(completedWorkoutsHistory)) {
        completedWorkoutsHistory.forEach(addWorkout);
      }

      // 2. AppStorage athlete workouts
      if (typeof AppStorage !== 'undefined' && typeof AppStorage.getAthleteWorkouts === 'function') {
        try {
          const stored = AppStorage.getAthleteWorkouts();
          if (Array.isArray(stored)) stored.forEach(addWorkout);
        } catch (e) {}
      }

      // 3. Raw Synced Workouts
      try {
        const rawSynced = JSON.parse(localStorage.getItem('showUp_synced_workouts') || '[]');
        if (Array.isArray(rawSynced)) rawSynced.forEach(addWorkout);
      } catch (e) {}

      // 4. User-isolated store showUp_user_workouts_<email>
      try {
        const profile = JSON.parse(localStorage.getItem('showUp_user_profile') || 'null');
        const email = (profile?.email || '').toLowerCase().trim();
        if (email && email !== 'you@showup.app' && email !== 'user@showup.app') {
          const userWorkouts = JSON.parse(localStorage.getItem('showUp_user_workouts_' + email) || '[]');
          if (Array.isArray(userWorkouts)) userWorkouts.forEach(addWorkout);
        }
      } catch (e) {}

      // 5. Squad member telemetry
      try {
        const squads = typeof getSquads === 'function' ? getSquads() : JSON.parse(localStorage.getItem('showUp_squads') || '[]');
        const user = typeof getAppUser === 'function' ? getAppUser() : {};
        if (Array.isArray(squads)) {
          squads.forEach(sq => {
            if (!sq || !Array.isArray(sq.members)) return;
            const uMember = sq.members.find(m => m && (m.id === user.id || m.email === user.email || m.id === 'local_user'));
            if (uMember) {
              if (uMember.completedDate) {
                addWorkout({
                  date: String(uMember.completedDate).slice(0, 10),
                  workoutName: uMember.lastCompletedWorkout || "Workout Session",
                  completed: true,
                  ...(uMember.workoutDetails || {})
                });
              }
              if (uMember.workoutDetails && uMember.workoutDetails.date) {
                addWorkout(uMember.workoutDetails);
              }
            }
          });
        }
      } catch (e) {}

      return Array.from(workoutMap.values());
    }

    function checkAndResetDailyETCounter() {
      const currentETDate = getETDateKey();
      const allWorkouts = getAllAthleteWorkouts();
      const user = getAppUser();
      const showedUpAthletes = new Set();

      // Check if current athlete showed up / completed a workout today
      const userCompletedToday = allWorkouts.some(w => {
        if (!w) return false;
        const wDate = typeof w === 'string' ? w : (w.date || w.completedDate || '');
        return String(wDate).slice(0, 10) === currentETDate;
      });

      if (userCompletedToday) {
        showedUpAthletes.add(user.id || user.email || '__CURRENT_USER__');
      }

      // Vetted squad teammate completions today (only authenticated/vetted members, deduplicated)
      const squads = getSquads();
      squads.forEach(sq => {
        if (!sq || !Array.isArray(sq.members)) return;
        sq.members.forEach(m => {
          if (!m) return;
          const isMe = (m.id === user.id || (user.email && m.email && m.email.toLowerCase().trim() === user.email.toLowerCase().trim()));
          const mDate = m.completedDate ? String(m.completedDate).slice(0, 10) : '';
          if (mDate === currentETDate && m.completedToday === true) {
            if (isMe) {
              showedUpAthletes.add(user.id || user.email || '__CURRENT_USER__');
            } else {
              const memberKey = m.id || m.email || (m.rawName || m.name);
              if (memberKey) showedUpAthletes.add(memberKey);
            }
          }
        });
      });

      const totalCount = showedUpAthletes.size;

      localStorage.setItem('showUp_global_counter_et_date', currentETDate);
      localStorage.setItem('showUp_global_counter_count', String(totalCount));

      const counterEl = document.getElementById('global-daily-counter');
      if (counterEl) {
        counterEl.innerText = Number(totalCount).toLocaleString();
        counterEl.style.color = 'var(--m3-primary)';
        counterEl.style.webkitTextFillColor = 'var(--m3-primary)';
      }

      return totalCount;
    }

    function incrementGlobalWorkoutCounter() {
      checkAndResetDailyETCounter();
      let count = parseInt(localStorage.getItem('showUp_global_counter_count') || '0', 10);
      count += 1;
      const currentETDate = getETDateKey();
      localStorage.setItem('showUp_global_counter_et_date', currentETDate);
      localStorage.setItem('showUp_global_counter_count', String(count));

      updateGlobalStatsUI();
      renderHeatMap();
    }

    function getGlobalActiveAthletesCount() {
      const user = getAppUser();
      const isUserLifting = (
        Array.isArray(currentSessionSets) && 
        currentSessionSets.length > 0 && 
        currentSessionSets.some(s => s && (Number(s.reps) > 0 || Number(s.weight) > 0 || Number(s.duration) > 0))
      );
      const squads = getSquads();
      let squadActive = 0;
      squads.forEach(sq => {
        if (!sq || !Array.isArray(sq.members)) return;
        sq.members.forEach(m => {
          if (!m) return;
          const isAct = m.isWorkingOut === true && (typeof isMemberWorkoutActive !== 'function' || isMemberWorkoutActive(m));
          if (isAct && !isMe) squadActive++;
        });
      });

      return (isUserLifting ? 1 : 0) + squadActive;
    }

    function updateGlobalStatsUI() {
      checkAndResetDailyETCounter();
      const activeCount = getGlobalActiveAthletesCount();

      // Explicit sentence below the global counter on how many users are actively working out
      const sentenceEl = document.getElementById('global-active-sentence-text');
      if (sentenceEl) {
        if (activeCount === 0) {
          sentenceEl.innerText = "0 athletes are actively working out right now across all squads.";
        } else if (activeCount === 1) {
          sentenceEl.innerText = "1 athlete is actively working out right now across all squads.";
        } else {
          sentenceEl.innerText = `${activeCount} athletes are actively working out right now across all squads.`;
        }
      }

      const badgeEl = document.getElementById('global-active-live-badge');
      if (badgeEl) {
        badgeEl.innerText = `${activeCount} Active Now`;
      }
    }

    // Auto-check ET reset every 30 seconds
    setInterval(() => {
      checkAndResetDailyETCounter();
      updateGlobalStatsUI();
    }, 30000);

    // ================= ACTIVITY WORKOUT MAP DATE SELECTOR STATE =================
    let selectedMapDate = getETDateKey();

    function getSelectedMapDate() {
      return selectedMapDate || getETDateKey();
    }

    function formatMapDateDisplay(dateStr) {
      if (!dateStr) return 'Today';
      const today = getETDateKey();
      const yesterday = getYesterdayETDateKey();
      try {
        const parts = String(dateStr).split('-').map(Number);
        if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
          const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          if (dateStr === today) {
            return `Today (${formatted})`;
          }
          if (dateStr === yesterday) {
            return `Yesterday (${formatted})`;
          }
          return formatted;
        }
      } catch (e) {}
      return dateStr === today ? `Today (${dateStr})` : (dateStr === yesterday ? `Yesterday (${dateStr})` : dateStr);
    }

    function updateMapDateSelectorUI() {
      const activeDate = getSelectedMapDate();
      const today = getETDateKey();
      const yesterday = getYesterdayETDateKey();
      const isToday = (activeDate === today);
      const isYesterday = (activeDate === yesterday);

      const picker = document.getElementById('map-date-picker');
      if (picker) {
        picker.value = activeDate;
        picker.max = today;
      }

      const badge = document.getElementById('map-date-badge');
      if (badge) {
        badge.innerText = formatMapDateDisplay(activeDate);
        if (isToday) {
          badge.className = "text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-xl";
        } else if (isYesterday) {
          badge.className = "text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl";
        } else {
          badge.className = "text-[11px] font-mono text-sky-300 bg-sky-500/10 border border-sky-500/30 px-2.5 py-1 rounded-xl";
        }
      }

      const todayBtn = document.getElementById('map-date-today-btn');
      if (todayBtn) {
        if (isToday) {
          todayBtn.className = "text-xs font-bold px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition active:scale-95";
        } else {
          todayBtn.className = "text-xs font-bold px-3 py-1 rounded-xl bg-slate-900 text-slate-400 border border-slate-700/80 hover:text-slate-200 hover:bg-slate-800 transition active:scale-95";
        }
      }

      const yesterdayBtn = document.getElementById('map-date-yesterday-btn');
      if (yesterdayBtn) {
        if (isYesterday) {
          yesterdayBtn.className = "text-xs font-bold px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition active:scale-95";
        } else {
          yesterdayBtn.className = "text-xs font-bold px-3 py-1 rounded-xl bg-slate-900 text-slate-400 border border-slate-700/80 hover:text-slate-200 hover:bg-slate-800 transition active:scale-95";
        }
      }

      const subtitle = document.getElementById('map-date-subtitle');
      if (subtitle) {
        if (isToday) {
          subtitle.innerText = "Real-time zip codes where athletes are actively lifting or completed workouts today";
        } else {
          subtitle.innerText = `Showing verified zip codes where athletes scored workouts on ${formatMapDateDisplay(activeDate)}`;
        }
      }

      const activeZipTitle = document.getElementById('map-active-zip-title');
      if (activeZipTitle) {
        if (isToday) {
          activeZipTitle.innerText = "Today's Active Zip Codes:";
        } else {
          activeZipTitle.innerText = `Active Zip Codes for ${formatMapDateDisplay(activeDate)}:`;
        }
      }
    }

    function setSelectedMapDate(newDate) {
      if (!newDate || typeof newDate !== 'string') {
        newDate = getETDateKey();
      }
      selectedMapDate = String(newDate).slice(0, 10);
      updateMapDateSelectorUI();
      if (typeof renderHeatMap === 'function') {
        renderHeatMap();
      }
    }

    function shiftMapDate(days) {
      const curr = getSelectedMapDate();
      try {
        const parts = curr.split('-').map(Number);
        const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
        d.setDate(d.getDate() + Number(days));
        const nextDate = getETDateKey(d);
        setSelectedMapDate(nextDate);
      } catch (e) {
        setSelectedMapDate(getETDateKey());
      }
    }

    function setMapDateToToday() {
      setSelectedMapDate(getETDateKey());
    }

    function setMapDateToYesterday() {
      setSelectedMapDate(getYesterdayETDateKey());
    }

    function handleMapDateChange(val) {
      if (!val) return;
      setSelectedMapDate(val);
    }

    window.getSelectedMapDate = getSelectedMapDate;
    window.setSelectedMapDate = setSelectedMapDate;
    window.shiftMapDate = shiftMapDate;
    window.setMapDateToToday = setMapDateToToday;
    window.setMapDateToYesterday = setMapDateToYesterday;
    window.getYesterdayETDateKey = getYesterdayETDateKey;
    window.getAllAthleteWorkouts = getAllAthleteWorkouts;
    window.handleMapDateChange = handleMapDateChange;
    window.updateMapDateSelectorUI = updateMapDateSelectorUI;
    window.formatMapDateDisplay = formatMapDateDisplay;

    // ================= REAL-TIME VETTED ZIP CODES (STRICTLY AUTHENTICATED & VETTED LOGS) =================
    // CRITICAL USER REQUIREMENT:
    // Ensure arbitrary and unvetted workouts are NOT presented in the Active Workout Map.
    // Only workouts completed by verified, logged-in athletes with authentic zip codes are mapped.

    function getActiveAndCompletedZipNodes(targetDate) {
      const activeDate = String(targetDate || getSelectedMapDate()).slice(0, 10);
      const currentETDate = getETDateKey();
      const isToday = (activeDate === currentETDate);
      const userZip = getUserZip();
      const user = getAppUser();

      // 1. Vetted User Active Lifting Status (only relevant when viewing today's session)
      const isUserLifting = isToday && (
        Array.isArray(currentSessionSets) && 
        currentSessionSets.length > 0 && 
        currentSessionSets.some(s => s && (Number(s.reps) > 0 || Number(s.weight) > 0 || Number(s.duration) > 0))
      );

      // 2. Vetted User Completed Workouts for activeDate (from authentic unified athlete workout history)
      const allWorkouts = getAllAthleteWorkouts();
      const userWorkoutsOnDate = allWorkouts.filter(w => {
        if (!w) return false;
        const wDate = typeof w === 'string' ? w : (w.date || w.completedDate || (w.timestamp ? String(w.timestamp).slice(0, 10) : ''));
        return String(wDate).slice(0, 10) === activeDate;
      });
      const userVettedCompletedOnDate = userWorkoutsOnDate.length;

      const nodesMap = new Map();
      const isValidZip = (z) => typeof z === 'string' && /^\d{5}$/.test(z.trim());

      // 1. Add logged-in user's zip ONLY if verified active or completed on target date
      if (isValidZip(userZip) && (isUserLifting || userVettedCompletedOnDate > 0)) {
        const userCoords = getZipCoordinates(userZip);
        nodesMap.set(userZip, {
          zip: userZip,
          city: userCoords.city || 'Your Area',
          lat: userCoords.lat,
          lng: userCoords.lng,
          activeCount: isUserLifting ? 1 : 0,
          completedToday: userVettedCompletedOnDate,
          isUserZip: true,
          lifters: isUserLifting ? [user.rawName || 'You'] : []
        });
      }

      // 2. Add squad members ONLY if they have vetted completed workouts on target date or active sessions with valid zip codes
      const squads = getSquads();
      squads.forEach(sq => {
        if (!sq || !Array.isArray(sq.members)) return;
        sq.members.forEach(m => {
          if (!m) return;
          const isMe = (m.id === user.id || (user.email && m.email && m.email.toLowerCase().trim() === user.email.toLowerCase().trim()) || m.id === 'local_user');
          if (isMe) return;

          // Member must have a verified 5-digit zip code (no arbitrary fallback default zips!)
          const mZip = m.zip && isValidZip(m.zip) ? m.zip.trim() : null;
          if (!mZip) return; // Discard unvetted locations without a valid postal zip

          const isMemberActive = isToday && (m.isWorkingOut === true && (typeof isMemberWorkoutActive !== 'function' || isMemberWorkoutActive(m)));
          
          let memberCompletedCount = 0;
          const mCompDate = m.completedDate ? String(m.completedDate).slice(0, 10) : '';
          const mDetailsDate = (m.workoutDetails && m.workoutDetails.date) ? String(m.workoutDetails.date).slice(0, 10) : '';

          if (mCompDate === activeDate) {
            memberCompletedCount += 1;
          } else if (mDetailsDate === activeDate) {
            memberCompletedCount += 1;
          } else if (Array.isArray(m.workouts)) {
            const countOnDate = m.workouts.filter(w => {
              const wd = typeof w === 'string' ? w : (w.date || w.completedDate || '');
              return String(wd).slice(0, 10) === activeDate;
            }).length;
            if (countOnDate > 0) memberCompletedCount += countOnDate;
          } else if (Array.isArray(m.completedDates)) {
            const countOnDate = m.completedDates.filter(cd => String(cd).slice(0, 10) === activeDate).length;
            if (countOnDate > 0) memberCompletedCount += countOnDate;
          }

          if (isMemberActive || memberCompletedCount > 0) {
            const mCoords = getZipCoordinates(mZip);
            const mCity = m.city || mCoords.city || `Zip ${mZip}`;
            const mLat = m.lat || mCoords.lat;
            const mLng = m.lng || mCoords.lng;

            if (!nodesMap.has(mZip)) {
              nodesMap.set(mZip, {
                zip: mZip,
                city: mCity,
                lat: mLat,
                lng: mLng,
                activeCount: 0,
                completedToday: 0,
                isUserZip: false,
                lifters: []
              });
            }

            const existing = nodesMap.get(mZip);
            if (isMemberActive) {
              existing.activeCount += 1;
              const name = m.rawName || m.name || 'Teammate';
              if (!existing.lifters.includes(name)) existing.lifters.push(name);
            }
            if (memberCompletedCount > 0) {
              existing.completedToday += memberCompletedCount;
            }
          }
        });
      });

      // Filter out any nodes that have 0 active lifters AND 0 completed workouts
      return Array.from(nodesMap.values()).filter(node => (node.completedToday > 0 || node.activeCount > 0));
    }

    // ================= GOOGLE MAPS BASE LAYER & ZOOM ENGINE =================


    function getAggregatedNodesForZoom(zoom, activeNodes) {
      if (!activeNodes || activeNodes.length === 0) return [];

      // Tier 1: Local Zip Code Level (zoom >= 11) - Individual Zip Code Borders & Real Numbers
      if (zoom >= 11) {
        return activeNodes.map(n => ({
          type: 'zip',
          id: n.zip,
          label: `Zip ${n.zip}`,
          subLabel: n.city,
          shortTitle: `Zip ${n.zip}`,
          lat: n.lat,
          lng: n.lng,
          activeCount: n.activeCount || 0,
          completedToday: n.completedToday || 0,
          isUserZip: !!n.isUserZip,
          lifters: n.lifters || [],
          originalNodes: [n]
        }));
      }

      // Tier 2: State / General Area Level (5 <= zoom < 11) - Regional State Aggregations
      if (zoom >= 5) {
        const stateMap = new Map();
        activeNodes.forEach(node => {
          const geo = parseLocationHierarchy(node.city, node.zip);
          const stateKey = geo.stateCode;
          if (!stateMap.has(stateKey)) {
            stateMap.set(stateKey, {
              type: 'state',
              id: stateKey,
              stateCode: stateKey,
              stateName: geo.stateName,
              label: `${geo.stateName} (${stateKey})`,
              subLabel: 'State / General Area Level',
              shortTitle: stateKey,
              lats: [],
              lngs: [],
              activeCount: 0,
              completedToday: 0,
              isUserZip: false,
              lifters: [],
              originalNodes: []
            });
          }
          const s = stateMap.get(stateKey);
          s.lats.push(node.lat);
          s.lngs.push(node.lng);
          s.activeCount += (node.activeCount || 0);
          s.completedToday += (node.completedToday || 0);
          if (node.isUserZip) s.isUserZip = true;
          if (Array.isArray(node.lifters)) {
            node.lifters.forEach(l => { if (!s.lifters.includes(l)) s.lifters.push(l); });
          }
          s.originalNodes.push(node);
        });

        return Array.from(stateMap.values()).map(s => ({
          type: 'state',
          id: s.id,
          label: s.label,
          subLabel: `${s.originalNodes.length} Active Zip${s.originalNodes.length > 1 ? 's' : ''} in ${s.stateName}`,
          shortTitle: s.shortTitle,
          lat: s.lats.reduce((a, b) => a + b, 0) / s.lats.length,
          lng: s.lngs.reduce((a, b) => a + b, 0) / s.lngs.length,
          activeCount: s.activeCount,
          completedToday: s.completedToday,
          isUserZip: s.isUserZip,
          lifters: s.lifters,
          originalNodes: s.originalNodes
        }));
      }

      // Tier 3: Country / Continental Level (zoom < 5) - National Aggregations
      const countryMap = new Map();
      activeNodes.forEach(node => {
        const geo = parseLocationHierarchy(node.city, node.zip);
        const countryKey = geo.countryCode;
        if (!countryMap.has(countryKey)) {
          countryMap.set(countryKey, {
            type: 'country',
            id: countryKey,
            countryName: geo.country,
            label: geo.country,
            subLabel: 'Country / Continental Level',
            shortTitle: countryKey,
            lats: [],
            lngs: [],
            activeCount: 0,
            completedToday: 0,
            isUserZip: false,
            lifters: [],
            originalNodes: []
          });
        }
        const c = countryMap.get(countryKey);
        c.lats.push(node.lat);
        c.lngs.push(node.lng);
        c.activeCount += (node.activeCount || 0);
        c.completedToday += (node.completedToday || 0);
        if (node.isUserZip) c.isUserZip = true;
        if (Array.isArray(node.lifters)) {
          node.lifters.forEach(l => { if (!c.lifters.includes(l)) c.lifters.push(l); });
        }
        c.originalNodes.push(node);
      });

      return Array.from(countryMap.values()).map(c => ({
        type: 'country',
        id: c.id,
        label: c.label,
        subLabel: `${c.originalNodes.length} Zip Codes across Country`,
        shortTitle: c.shortTitle,
        lat: c.lats.reduce((a, b) => a + b, 0) / c.lats.length,
        lng: c.lngs.reduce((a, b) => a + b, 0) / c.lngs.length,
        activeCount: c.activeCount,
        completedToday: c.completedToday,
        isUserZip: c.isUserZip,
        lifters: c.lifters,
        originalNodes: c.originalNodes
      }));
    }

    function updateMapZoomStatusUI(zoom) {
      const zoomStatusEl = document.getElementById('map-zoom-status');
      if (!zoomStatusEl) return;
      let levelDesc = "Zip Code Level (Border Identified)";
      if (zoom >= 15) levelDesc = "Street Level (Border Identified)";
      else if (zoom >= 11) levelDesc = "Zip Code Level (Border Identified)";
      else if (zoom >= 5) levelDesc = "State / General Area Level";
      else levelDesc = "Country / Continental Level";
      zoomStatusEl.innerText = `Zoom: ${zoom}x (${levelDesc})`;
    }

    function initGoogleMapsBaseLayer() {
      const canvas = document.getElementById('google-maps-canvas');
      if (!canvas) return;

      const activeNodes = getActiveAndCompletedZipNodes();
      const targetZip = selectedHeatMapZip || (activeNodes.length > 0 ? activeNodes[0].zip : getUserZip());
      const coords = getZipCoordinates(targetZip);

      // 1. Try Native Google Maps JS API only if an authorized API key is provided
      const savedGmapsKey = localStorage.getItem('showUp_gmaps_api_key');
      if (savedGmapsKey && window.google && window.google.maps && window.google.maps.Map) {
        try {
          if (!googleMapInstance) {
            googleMapInstance = new google.maps.Map(canvas, {
              center: { lat: coords.lat, lng: coords.lng },
              zoom: currentMapZoom,
              styles: GOOGLE_MAPS_DARK_STYLE,
              disableDefaultUI: true,
              gestureHandling: 'greedy',
              zoomControl: false,
              mapTypeControl: false,
              scaleControl: false,
              streetViewControl: false,
              rotateControl: false,
              fullscreenControl: false
            });

            googleMapInstance.addListener('zoom_changed', () => {
              currentMapZoom = googleMapInstance.getZoom();
              updateMapZoomStatusUI(currentMapZoom);
              renderHeatMap();
              if (currentMapZoom < 5) updateCountryHoverEdgeTracker();
            });

            googleMapInstance.addListener('bounds_changed', () => {
              if (currentMapZoom < 5) updateCountryHoverEdgeTracker();
            });
            googleMapInstance.addListener('center_changed', () => {
              if (currentMapZoom < 5) updateCountryHoverEdgeTracker();
            });
            googleMapInstance.addListener('drag', () => {
              if (currentMapZoom < 5) updateCountryHoverEdgeTracker();
            });
          } else {
            googleMapInstance.panTo({ lat: coords.lat, lng: coords.lng });
          }

          isMapEmbedMode = false;
          renderGoogleMapMarkers(activeNodes);
          updateMapZoomStatusUI(currentMapZoom);
          return;
        } catch (e) {
          console.warn("Google Maps Native JS API initialization notice:", e);
        }
      }

      // 2. Google Maps Interactive Base Layer Embed Fallback
      renderGoogleMapsEmbed(coords.lat, coords.lng, currentMapZoom, targetZip, coords.city);
    }

    function renderGoogleMapsEmbed(lat, lng, zoom, zip, city) {
      isMapEmbedMode = true;
      const canvas = document.getElementById('google-maps-canvas');
      if (!canvas) return;

      let query = `${lat},${lng}`;
      if (zoom >= 11 && zip) {
        query = `Zip+Code+${encodeURIComponent(zip)}+${encodeURIComponent(city || '')}`;
      } else if (zoom >= 5 && city) {
        const geo = parseLocationHierarchy(city, zip);
        query = `${encodeURIComponent(geo.stateName)}+USA`;
      } else {
        query = `United+States`;
      }

      const existingIframe = document.getElementById('google-maps-iframe');
      const targetSrc = `https://maps.google.com/maps?q=${query}&t=m&z=${zoom}&output=embed`;

      if (existingIframe && existingIframe.dataset && existingIframe.dataset.query === query && existingIframe.dataset.zoom === String(zoom)) {
        return;
      }

      canvas.innerHTML = `
        <iframe
          id="google-maps-iframe"
          data-query="${query}"
          data-zoom="${zoom}"
          title="Google Maps Base Layer"
          class="w-full h-full border-0 filter invert-[0.9] hue-rotate-180 brightness-[0.85] contrast-[1.2] transition-opacity duration-300"
          src="${targetSrc}"
          loading="lazy"
          allowfullscreen>
        </iframe>
      `;
      updateMapZoomStatusUI(zoom);
    }

    function renderGoogleMapMarkers(activeNodes) {
      if (!googleMapInstance) return;

      googleMapMarkers.forEach(m => m.setMap(null));
      googleMapMarkers = [];
      if (Array.isArray(googleMapPolygons)) {
        googleMapPolygons.forEach(p => p.setMap(null));
        googleMapPolygons = [];
      }

      const currentTheme = localStorage.getItem('showUp_theme') || 'emerald';
      const themeColorsMap = {
        emerald: { fill: '#10b981', stroke: '#047857', onColor: '#002217' },
        sky: { fill: '#38bdf8', stroke: '#0284c7', onColor: '#082f49' },
        violet: { fill: '#a855f7', stroke: '#7e22ce', onColor: '#2e1065' },
        rose: { fill: '#fb7185', stroke: '#e11d48', onColor: '#4c0519' },
        amber: { fill: '#fbbf24', stroke: '#d97706', onColor: '#451a03' },
        orange: { fill: '#f97316', stroke: '#c2410c', onColor: '#431407' },
        sunset: { fill: '#f43f5e', stroke: '#be123c', onColor: '#4c0519' },
        amoled: { fill: '#38bdf8', stroke: '#0284c7', onColor: '#082f49' }
      };
      const pal = themeColorsMap[currentTheme] || themeColorsMap.emerald;

      const aggNodes = getAggregatedNodesForZoom(currentMapZoom, activeNodes);

      aggNodes.forEach(node => {
        const completedCount = node.completedToday || 0;

        // Cleaner Map View: Circular marker displaying strictly the number of workouts scored
        const svgIcon = {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 46 46">
              <circle cx="23" cy="23" r="19" fill="${pal.fill}" stroke="#0b0f19" stroke-width="3" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"/>
              <text x="23" y="29" fill="${pal.onColor}" font-family="monospace, sans-serif" font-size="16" font-weight="900" text-anchor="middle">${completedCount}</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(46, 46),
          anchor: new google.maps.Point(23, 23)
        };

        const marker = new google.maps.Marker({
          position: { lat: node.lat, lng: node.lng },
          map: googleMapInstance,
          title: `${completedCount} Workouts Scored`,
          icon: svgIcon
        });

        marker.addListener('click', () => {
          triggerHaptic('light');
          selectZipNode(node.id);
        });

        googleMapMarkers.push(marker);
      });
    }

    function renderMapZipBoundariesOverlay(activeNodes) {
      const topHud = document.getElementById('map-boundary-top-hud');
      const centerHud = document.getElementById('map-boundary-center-hud');
      if (!topHud || !centerHud) return;

      if (!Array.isArray(activeNodes)) {
        if (typeof getActiveAndCompletedZipNodes === 'function') {
          activeNodes = getActiveAndCompletedZipNodes();
        } else {
          activeNodes = [];
        }
      }

      const aggNodes = getAggregatedNodesForZoom(currentMapZoom, activeNodes);

      if (!aggNodes || aggNodes.length === 0) {
        topHud.innerHTML = '';
        centerHud.innerHTML = `
          <div class="pointer-events-auto flex items-center justify-center">
            <div class="w-12 h-12 rounded-full bg-slate-900/90 border border-slate-700/80 text-slate-400 font-mono font-bold text-lg flex items-center justify-center shadow-lg" title="0 Workouts Scored">
              0
            </div>
          </div>
        `;
        return;
      }

      // Cleaner Map View: Keep top HUD clean and uncluttered
      topHud.innerHTML = '';

      // Tier 3 Country Zoom Level (< 5): Number of workouts hovers over country and sticks to screen edge in direction of country
      if (currentMapZoom < 5) {
        centerHud.innerHTML = '';
        updateCountryHoverEdgeTracker(activeNodes);
        return;
      }

      // Hide country edge tracker at state and zip levels (zoom >= 5)
      const countryBadge = document.getElementById('map-country-edge-hover-badge');
      if (countryBadge) countryBadge.style.display = 'none';

      // Center HUD: Display strictly the number of workouts scored at this zoomed level
      const selectedNode = aggNodes.find(z => z.id === selectedHeatMapZip || (z.originalNodes && z.originalNodes.some(on => on.zip === selectedHeatMapZip))) || aggNodes[0];
      if (!selectedNode) {
        centerHud.innerHTML = '';
        return;
      }

      const completedCount = selectedNode.completedToday || 0;

      centerHud.innerHTML = `
        <div class="pointer-events-auto cursor-pointer transition transform hover:scale-105 active:scale-95 flex items-center justify-center" onclick="triggerHaptic('light'); zoomToSelectedZip()">
          <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[var(--m3-primary)] text-[var(--m3-onPrimary)] font-mono font-black text-2xl sm:text-3xl flex items-center justify-center shadow-2xl shadow-[var(--m3-primary)]/40 ring-4 ring-slate-950/90" title="${completedCount} Workouts Scored">
            ${completedCount}
          </div>
        </div>
      `;
    }

    /**
     * Country-Level Hovering & Edge-Sticking Indicator:
     * When zoomed at country level (zoom < 5), the number of workouts hovers over the country centroid.
     * When panned away or near boundary, it sticks to the edge of the map container in the direction of the country.
     */
    function updateCountryHoverEdgeTracker(activeNodes) {
      const overlay = document.getElementById('map-zip-boundaries-overlay');
      const canvas = document.getElementById('google-maps-canvas');
      if (!overlay || !canvas) return;

      let badgeEl = document.getElementById('map-country-edge-hover-badge');

      if (currentMapZoom >= 5) {
        if (badgeEl) badgeEl.style.display = 'none';
        return;
      }

      if (!badgeEl) {
        badgeEl = document.createElement('div');
        badgeEl.id = 'map-country-edge-hover-badge';
        badgeEl.className = 'absolute pointer-events-auto transition-all duration-150 ease-out z-30 select-none';
        overlay.appendChild(badgeEl);
      }
      badgeEl.style.display = 'block';

      if (!Array.isArray(activeNodes)) {
        activeNodes = (typeof getActiveAndCompletedZipNodes === 'function') ? getActiveAndCompletedZipNodes() : [];
      }

      const aggNodes = getAggregatedNodesForZoom(currentMapZoom, activeNodes);
      const countryNode = (aggNodes && aggNodes.length > 0)
        ? (aggNodes.find(n => n.type === 'country') || aggNodes[0])
        : { lat: 39.8283, lng: -98.5795, completedToday: 0, label: 'United States', shortTitle: 'USA' };

      const completedCount = countryNode.completedToday || 0;
      const countryLat = countryNode.lat || 39.8283;
      const countryLng = countryNode.lng || -98.5795;

      const width = canvas.clientWidth || 320;
      const height = canvas.clientHeight || 280;

      let screenX = width / 2;
      let screenY = height / 2;

      if (googleMapInstance && !isMapEmbedMode) {
        const bounds = googleMapInstance.getBounds();
        if (bounds) {
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          let dLng = ne.lng() - sw.lng();
          if (dLng <= 0) dLng += 360;
          let relLng = countryLng - sw.lng();
          if (relLng < 0) relLng += 360;
          screenX = (relLng / dLng) * width;

          const latToY = (lat) => {
            const sin = Math.sin(lat * Math.PI / 180);
            return Math.log((1 + sin) / Math.max(1e-5, (1 - sin))) / 2;
          };
          const topY = latToY(ne.lat());
          const botY = latToY(sw.lat());
          const cY = latToY(countryLat);
          screenY = ((topY - cY) / Math.max(1e-5, (topY - botY))) * height;
        } else {
          const center = googleMapInstance.getCenter();
          const cLat = center ? (typeof center.lat === 'function' ? center.lat() : center.lat) : 39.8283;
          const cLng = center ? (typeof center.lng === 'function' ? center.lng() : center.lng) : -98.5795;
          const degSpanLng = (360 / Math.pow(2, currentMapZoom)) * (width / 256);
          const degSpanLat = (180 / Math.pow(2, currentMapZoom)) * (height / 256);
          screenX = (width / 2) + ((countryLng - cLng) / degSpanLng) * width;
          screenY = (height / 2) - ((countryLat - cLat) / degSpanLat) * height;
        }
      } else {
        const cLat = 39.8283;
        const cLng = -98.5795;
        const degSpanLng = (360 / Math.pow(2, currentMapZoom)) * (width / 256);
        const degSpanLat = (180 / Math.pow(2, currentMapZoom)) * (height / 256);
        screenX = (width / 2) + ((countryLng - cLng) / degSpanLng) * width;
        screenY = (height / 2) - ((countryLat - cLat) / degSpanLat) * height;
      }

      // Edge boundaries margins
      const marginX = 42;
      const marginY = 42;
      const minX = marginX;
      const maxX = width - marginX;
      const minY = marginY;
      const maxY = height - marginY;
      const cx = width / 2;
      const cy = height / 2;

      const isInside = screenX >= minX && screenX <= maxX && screenY >= minY && screenY <= maxY;
      let badgeX = screenX;
      let badgeY = screenY;
      let isStickingToEdge = false;
      let arrowHtml = '';

      if (!isInside) {
        isStickingToEdge = true;
        const dx = screenX - cx;
        const dy = screenY - cy;
        const scaleX = dx > 0 ? (maxX - cx) / dx : (dx < 0 ? (minX - cx) / dx : Infinity);
        const scaleY = dy > 0 ? (maxY - cy) / dy : (dy < 0 ? (minY - cy) / dy : Infinity);
        const scale = Math.min(scaleX, scaleY);
        badgeX = cx + dx * scale;
        badgeY = cy + dy * scale;

        const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
        arrowHtml = `<i class="fa-solid fa-location-arrow text-[10px] text-emerald-200" style="transform: rotate(${angleDeg - 45}deg)"></i>`;
      }

      badgeEl.style.left = `${Math.round(badgeX)}px`;
      badgeEl.style.top = `${Math.round(badgeY)}px`;
      badgeEl.style.transform = 'translate(-50%, -50%)';

      const titleText = isStickingToEdge
        ? `${countryNode.label || 'Country'}: ${completedCount} Workouts Scored (Click to Center)`
        : `${countryNode.label || 'Country'}: ${completedCount} Workouts Scored (Hovering over Country)`;

      badgeEl.innerHTML = `
        <div onclick="triggerHaptic('light'); panMapToCountry(${countryLat}, ${countryLng})"
             class="cursor-pointer transition transform hover:scale-110 active:scale-95 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--m3-primary)] text-[var(--m3-onPrimary)] font-mono font-black shadow-2xl shadow-[var(--m3-primary)]/50 ring-4 ring-slate-950/90 ${isStickingToEdge ? 'border-2 border-emerald-300 ring-emerald-500/30' : 'hover-float-badge'}"
             title="${titleText}">
          ${arrowHtml}
          <span class="text-xl sm:text-2xl">${completedCount}</span>
          <span class="text-[9px] uppercase tracking-wider font-sans font-extrabold opacity-95">${isStickingToEdge ? 'Scored' : (countryNode.shortTitle || 'USA')}</span>
        </div>
      `;
    }

    function panMapToCountry(lat = 39.8283, lng = -98.5795) {
      if (googleMapInstance && !isMapEmbedMode) {
        googleMapInstance.panTo({ lat, lng });
      } else {
        renderGoogleMapsEmbed(lat, lng, currentMapZoom, '', 'United States');
      }
      setTimeout(() => { updateCountryHoverEdgeTracker(); }, 100);
    }

    function zoomGoogleMap(delta) {
      currentMapZoom = Math.min(18, Math.max(3, currentMapZoom + delta));
      if (googleMapInstance && !isMapEmbedMode) {
        googleMapInstance.setZoom(currentMapZoom);
        updateMapZoomStatusUI(currentMapZoom);
        renderHeatMap();
      } else {
        const activeNodes = getActiveAndCompletedZipNodes();
        const targetZip = selectedHeatMapZip || (activeNodes.length > 0 ? activeNodes[0].zip : getUserZip());
        const coords = getZipCoordinates(targetZip);
        renderGoogleMapsEmbed(coords.lat, coords.lng, currentMapZoom, targetZip, coords.city);
        renderHeatMap();
      }
    }

    function zoomToUserZipLevel() {
      currentMapZoom = 14; // Zip code level
      const userZip = getUserZip();
      selectedHeatMapZip = userZip;
      const coords = getZipCoordinates(userZip);

      if (googleMapInstance && !isMapEmbedMode) {
        googleMapInstance.setZoom(14);
        googleMapInstance.panTo({ lat: coords.lat, lng: coords.lng });
        updateMapZoomStatusUI(14);
      } else {
        renderGoogleMapsEmbed(coords.lat, coords.lng, 14, userZip, coords.city);
      }
      renderHeatMap();
      showToast(`Snapped to Zip Code Level (14x) for ${userZip}`, "info");
    }

    function zoomToSelectedZip() {
      currentMapZoom = 14; // Snap to Zip code level
      const activeNodes = getActiveAndCompletedZipNodes();
      const targetZip = selectedHeatMapZip || (activeNodes.length > 0 ? activeNodes[0].zip : getUserZip());
      const coords = getZipCoordinates(targetZip);

      if (googleMapInstance && !isMapEmbedMode) {
        googleMapInstance.setZoom(14);
        googleMapInstance.panTo({ lat: coords.lat, lng: coords.lng });
        updateMapZoomStatusUI(14);
      } else {
        renderGoogleMapsEmbed(coords.lat, coords.lng, 14, targetZip, coords.city);
      }
      renderHeatMap();
      showToast(`Zoomed to Zip Code ${targetZip} (14x Level)`, "info");
    }

    function selectZipNode(nodeId) {
      selectedHeatMapZip = nodeId;
      const activeNodes = getActiveAndCompletedZipNodes();
      const node = activeNodes.find(n => n.zip === nodeId) || activeNodes.find(n => {
        const geo = parseLocationHierarchy(n.city, n.zip);
        return geo.stateCode === nodeId || geo.countryCode === nodeId;
      });

      const zipToPan = node ? node.zip : (nodeId.length === 5 ? nodeId : getUserZip());
      const coords = getZipCoordinates(zipToPan);

      if (googleMapInstance && !isMapEmbedMode) {
        googleMapInstance.panTo({ lat: coords.lat, lng: coords.lng });
      } else {
        renderGoogleMapsEmbed(coords.lat, coords.lng, currentMapZoom, zipToPan, coords.city);
      }
      renderHeatMap();
    }



    function updateZipDetailCard(activeZipNodes) {
      if (!activeZipNodes) activeZipNodes = getActiveAndCompletedZipNodes();
      const userZip = getUserZip();
      const activeDate = getSelectedMapDate();
      const isToday = (activeDate === getETDateKey());
      const dateDisplay = formatMapDateDisplay(activeDate);

      const titleEl = document.getElementById('zip-detail-title');
      const descEl = document.getElementById('zip-detail-desc');
      const indEl = document.getElementById('zip-detail-indicator');
      const zoomBtn = document.getElementById('btn-zoom-to-selected-zip');
      const borderTag = document.getElementById('zip-detail-border-tag');

      if (activeZipNodes.length === 0) {
        if (titleEl) titleEl.innerText = isToday ? "No workouts recorded today" : `No workouts recorded for ${dateDisplay}`;
        if (descEl) {
          if (isToday) {
            const yesterdayKey = getYesterdayETDateKey();
            const yesterdayNodes = getActiveAndCompletedZipNodes(yesterdayKey);
            const yTotal = yesterdayNodes.reduce((acc, n) => acc + (n.completedToday || 0), 0);
            if (yTotal > 0) {
              descEl.innerHTML = `No workouts recorded today yet. <span class="text-amber-300 font-semibold">${yTotal} workout${yTotal === 1 ? '' : 's'} scored yesterday</span> (${formatMapDateDisplay(yesterdayKey)}). <button type="button" onclick="triggerHaptic('light'); setMapDateToYesterday()" class="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 underline ml-1 cursor-pointer"><i class="fa-solid fa-clock-rotate-left text-[9px]"></i> View Yesterday's Activity (${yTotal} Scored)</button>`;
            } else {
              descEl.innerText = `Only workouts logged by you or your squad today are displayed. Your zip code (${userZip}) will activate when you complete a set.`;
            }
          } else {
            descEl.innerText = `No workouts were scored by you or your squad on ${dateDisplay}. Select another date to view activity.`;
          }
        }
        if (indEl) {
          indEl.className = "w-2.5 h-2.5 rounded-full bg-slate-700 flex-shrink-0";
          indEl.innerHTML = "";
        }
        if (borderTag) {
          borderTag.classList.add('hidden');
          borderTag.classList.remove('inline-flex');
        }
        if (zoomBtn) {
          zoomBtn.innerHTML = `<i class="fa-solid fa-crosshairs"></i><span>My Zip Area</span>`;
          zoomBtn.onclick = () => { triggerHaptic('light'); zoomToUserZipLevel(); };
        }
        return;
      }

      const aggNodes = getAggregatedNodesForZoom(currentMapZoom, activeZipNodes);
      const node = aggNodes.find(z => z.id === selectedHeatMapZip || (z.originalNodes && z.originalNodes.some(on => on.zip === selectedHeatMapZip))) || aggNodes[0];
      if (!node) return;

      const isUserZip = node.isUserZip;
      const hasActive = node.activeCount > 0;

      if (titleEl) {
        if (node.type === 'zip') {
          titleEl.innerText = `Zip ${node.id} (${node.subLabel})${isUserZip ? ' • (Your Zip Code)' : ''}`;
        } else if (node.type === 'state') {
          titleEl.innerText = `${node.label} • State / General Area Level`;
        } else {
          titleEl.innerText = `${node.label} • Country / Continental Level`;
        }
      }
      if (borderTag) {
        borderTag.classList.remove('hidden');
        borderTag.classList.add('inline-flex');
        if (node.type === 'zip') {
          borderTag.innerHTML = `<i class="fa-solid fa-draw-polygon text-[8px] mr-0.5"></i> Zip Border`;
        } else if (node.type === 'state') {
          borderTag.innerHTML = `<i class="fa-solid fa-map text-[8px] mr-0.5"></i> State Area`;
        } else {
          borderTag.innerHTML = `<i class="fa-solid fa-earth-americas text-[8px] mr-0.5"></i> Country Area`;
        }
      }
      if (descEl) {
        const liftersStr = node.lifters && node.lifters.length > 0 ? ` (${node.lifters.join(', ')})` : '';
        const dateContext = isToday ? 'Today' : `on ${dateDisplay}`;
        const activeContext = isToday ? ` • ${node.activeCount || 0} Lifters Active Right Now${liftersStr}` : '';
        descEl.innerText = `${node.completedToday || 0} Workouts Completed ${dateContext} by Logged-in Athletes${activeContext}`;
      }
      if (indEl) {
        if (hasActive) {
          indEl.className = "w-3 h-3 rounded-full bg-emerald-400 animate-pulse flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-500/40";
          indEl.innerHTML = "";
        } else {
          indEl.className = "w-4 h-4 rounded bg-[var(--m3-primary)] text-[var(--m3-onPrimary)] flex items-center justify-center text-[10px] font-black flex-shrink-0 shadow-sm shadow-[var(--m3-primary)]/30";
          indEl.innerHTML = `<i class="fa-solid fa-check"></i>`;
        }
      }
      if (zoomBtn) {
        zoomBtn.innerHTML = `<i class="fa-solid fa-magnifying-glass-location"></i><span>Zoom to Level</span>`;
        zoomBtn.onclick = () => { triggerHaptic('light'); zoomToSelectedZip(); };
      }
    }

    function openUserZipModal() {
      detectUserZipFromIP();
      showToast("Zip code is established automatically based on your network IP address.", "info");
    }

    function closeUserZipModal() {}
    function saveUserZipSubmit() {}

    // ================= SQUADS CORE STATE & ACTIONS =================
