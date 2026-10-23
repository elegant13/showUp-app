/* ==========================================================================
   showUp Progress Engine: Body Weight Analytics, 1RM, Sparklines & Heatmap
   ========================================================================== */

    function openLogWeightModal(targetDate = null) {
      const modal = document.getElementById('log-weight-modal');
      if (!modal) return;

      const dateInput = document.getElementById('log-weight-date-input');
      const numInput = document.getElementById('log-weight-num-input');
      const todayStr = getLocalDateISO();

      // Pick default date: targetDate -> selectedWorkoutDate -> today
      const defaultDate = targetDate || selectedWorkoutDate || todayStr;
      if (dateInput) {
        dateInput.max = todayStr; // Allow any historical date up to today
        dateInput.value = defaultDate;
      }

      // Check if entry for chosen date already exists
      const existing = weightHistory.find(w => w.date === defaultDate);
      const initialWeight = existing ? existing.weight : (userWeight || 0);

      if (numInput) {
        numInput.value = initialWeight > 0 ? initialWeight : "";
        numInput.dataset.autoFilled = "true";
      }

      handleLogWeightDateChange(defaultDate);

      modal.classList.remove('hidden');
      if (numInput) {
        setTimeout(() => {
          numInput.focus();
          numInput.select();
        }, 120);
      }
    }

    function closeLogWeightModal() {
      const modal = document.getElementById('log-weight-modal');
      if (modal) modal.classList.add('hidden');
    }

    function setLogWeightQuickDate(daysAgo) {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      const iso = getLocalDateISO(d);
      const dateInput = document.getElementById('log-weight-date-input');
      if (dateInput) {
        dateInput.value = iso;
      }
      handleLogWeightDateChange(iso);
    }

    function updateQuickDateChipsUI(selectedDateStr) {
      const chips = document.querySelectorAll('.quick-date-chip');
      const today = new Date();
      chips.forEach(chip => {
        const days = parseInt(chip.dataset.days || '0', 10);
        const d = new Date();
        d.setDate(today.getDate() - days);
        const iso = getLocalDateISO(d);

        if (selectedDateStr === iso) {
          chip.className = "quick-date-chip px-2.5 py-1 rounded-xl text-[10px] font-bold border transition shrink-0 bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm";
        } else {
          chip.className = "quick-date-chip px-2.5 py-1 rounded-xl text-[10px] font-bold border transition shrink-0 bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200";
        }
      });
    }

    function handleLogWeightDateChange(dateStr) {
      if (!dateStr) return;
      const labelEl = document.getElementById('log-weight-date-label');
      const existingHint = document.getElementById('log-weight-existing-hint');
      const numInput = document.getElementById('log-weight-num-input');

      const todayStr = getLocalDateISO();
      let relLabel = "";
      if (dateStr === todayStr) {
        relLabel = "Today";
      } else {
        relLabel = formatHistoricalDate(dateStr);
      }
      if (labelEl) labelEl.innerText = relLabel;

      updateQuickDateChipsUI(dateStr);

      const existing = weightHistory.find(w => w.date === dateStr);
      if (existing) {
        if (existingHint) {
          existingHint.innerText = `Replaces recorded entry (${existing.weight} lbs)`;
          existingHint.classList.remove('hidden');
        }
        if (numInput && (!numInput.value || numInput.dataset.autoFilled === "true")) {
          numInput.value = existing.weight;
          numInput.dataset.autoFilled = "true";
        }
      } else {
        if (existingHint) existingHint.classList.add('hidden');
        if (numInput && numInput.dataset.autoFilled === "true") {
          numInput.value = userWeight || "";
          numInput.dataset.autoFilled = "true";
        }
      }
    }

    function adjustLogWeight(delta) {
      const input = document.getElementById('log-weight-num-input');
      if (!input) return;
      let current = parseFloat(input.value) || userWeight || 0;
      current = Math.max(0, Math.round((current + delta) * 10) / 10);
      input.value = current;
      input.dataset.autoFilled = "false";
    }

    function openWeightNumpadForHistorical() {
      const numInput = document.getElementById('log-weight-num-input');
      const currentVal = numInput ? (parseFloat(numInput.value) || userWeight || 0) : userWeight;
      openWeightNumpadModal('log-weight-num-input', 'Log Body Weight (lbs)', (finalVal) => {
        if (numInput) {
          numInput.value = finalVal;
          numInput.dataset.autoFilled = "false";
        }
      });
    }

    function saveLogWeightEntry() {
      const dateInput = document.getElementById('log-weight-date-input');
      const numInput = document.getElementById('log-weight-num-input');

      const chosenDate = dateInput ? dateInput.value : getLocalDateISO();
      const rawVal = numInput ? parseFloat(numInput.value) : 0;

      if (!chosenDate) {
        showToast("Please choose a valid date for this weigh-in.", "warning");
        return;
      }
      if (isNaN(rawVal) || rawVal <= 0) {
        showToast("Please enter a valid weight (e.g. 175.5 lbs).", "warning");
        if (numInput) numInput.focus();
        return;
      }

      const weight = Math.round(rawVal * 10) / 10;

      // Update if date already exists in history, otherwise insert
      const existingIndex = weightHistory.findIndex(w => w.date === chosenDate);
      if (existingIndex >= 0) {
        weightHistory[existingIndex].weight = weight;
      } else {
        weightHistory.push({ date: chosenDate, weight: weight });
      }

      // Always sort chronological descending (newest first)
      weightHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
      localStorage.setItem('showUp_weight_history', JSON.stringify(weightHistory));

      // If the saved date is today or the latest entry, synchronize profile current weight
      const latestEntry = weightHistory[0];
      if (latestEntry && (chosenDate === getLocalDateISO() || chosenDate === latestEntry.date)) {
        userWeight = latestEntry.weight;
        localStorage.setItem('showUp_user_weight', userWeight);
        const profileInput = document.getElementById('user-weight-input');
        if (profileInput) profileInput.value = userWeight;
      }

      renderWeightHistory();
      closeLogWeightModal();

      const humanDate = (chosenDate === getLocalDateISO()) ? "Today" : formatHistoricalDate(chosenDate);
      showToast(`Recorded ${weight} lbs for ${humanDate}!`, "success");

      if (googleAccessToken) {
        syncToGoogleDrive(true);
      }
    }

    function logBodyWeightEntry(initialDate = null) {
      openLogWeightModal(initialDate);
    }

    function renderWeightHistory() {
      const currentValEl = document.getElementById('cal-current-weight-val');
      const changeValEl = document.getElementById('cal-weight-change-val');
      const container = document.getElementById('weight-history-list');

      // Sort chronological descending
      weightHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

      if (weightHistory.length > 0) {
        userWeight = weightHistory[0].weight;
        currentValEl.innerText = `${userWeight} lbs`;
      } else {
        currentValEl.innerText = `${userWeight || '--'} lbs`;
      }

      if (weightHistory.length === 0) {
        changeValEl.innerText = "0.0 lbs";
        container.innerHTML = `<div class="text-center py-4 text-slate-600 text-xs italic">No historical weight entries recorded yet. Click "+ Log Weight" above to record an entry.</div>`;
        return;
      }

      const latest = weightHistory[0].weight;
      const oldest = weightHistory[weightHistory.length - 1].weight;
      const diff = (latest - oldest).toFixed(1);

      changeValEl.innerText = `${diff > 0 ? '+' : ''}${diff} lbs`;
      changeValEl.className = `text-xl font-black ${diff < 0 ? 'text-emerald-400' : diff > 0 ? 'text-rose-400' : 'text-slate-300'}`;

      container.innerHTML = weightHistory.map((item, index) => {
        const humanDate = formatHistoricalDate(item.date);
        return `
          <div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition group">
            <div class="flex items-center gap-2 cursor-pointer" onclick="triggerHaptic('light'); openLogWeightModal('${item.date}')" title="Click to edit weight for ${item.date}">
              <i class="fa-solid fa-calendar-day text-slate-500 group-hover:text-emerald-400 transition"></i>
              <div>
                <span class="text-slate-200 font-semibold font-mono">${item.date}</span>
                <span class="text-[10px] text-slate-500 ml-1.5 hidden sm:inline">(${humanDate.split(',')[0]})</span>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span class="font-bold text-emerald-400 cursor-pointer font-mono" onclick="triggerHaptic('light'); openLogWeightModal('${item.date}')" title="Click to edit">${item.weight} lbs</span>
              <button onclick="triggerHaptic('light'); openLogWeightModal('${item.date}')" class="text-slate-500 hover:text-slate-300 p-1 transition" title="Edit weight">
                <i class="fa-solid fa-pen text-[10px]"></i>
              </button>
              <button onclick="triggerHaptic('light'); deleteWeightEntry(${index})" class="text-slate-600 hover:text-rose-400 p-1 transition" title="Delete Entry">
                <i class="fa-solid fa-trash-can text-[10px]"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    function deleteWeightEntry(index) {
      const wasFirst = (index === 0);
      weightHistory.splice(index, 1);
      if (wasFirst && weightHistory.length > 0) {
        userWeight = weightHistory[0].weight;
        localStorage.setItem('showUp_user_weight', userWeight);
        const profileInput = document.getElementById('user-weight-input');
        if (profileInput) profileInput.value = userWeight;
      }
      localStorage.setItem('showUp_weight_history', JSON.stringify(weightHistory));
      renderWeightHistory();
      if (googleAccessToken) {
        syncToGoogleDrive(true);
      }
      showToast("Weight entry removed", "info");
    }

    function openWeightTrendGraph() {
      if (weightHistory.length === 0) {
        alert("Please log at least one body weight entry to view the trend graph.");
        return;
      }
      renderWeightTrendGraphSVG();
      document.getElementById('weight-graph-modal').classList.remove('hidden');
    }

    function toggleWeightGraphModal() {
      document.getElementById('weight-graph-modal').classList.add('hidden');
    }

    function renderWeightTrendGraphSVG() {
      const svg = document.getElementById('weight-trend-svg');
      svg.innerHTML = '';

      // Sort chronological (oldest to newest) for line drawing
      const sortedHistory = [...weightHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
      const weights = sortedHistory.map(h => h.weight);

      const minW = Math.min(...weights);
      const maxW = Math.max(...weights);
      const avgW = (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1);

      document.getElementById('graph-min-weight').innerText = `${minW} lbs`;
      document.getElementById('graph-max-weight').innerText = `${avgW} lbs`;
      document.getElementById('graph-max-weight').innerText = `${maxW} lbs`;

      const width = 320;
      const height = 160;
      const padding = 20;

      const effectiveWidth = width - (padding * 2);
      const effectiveHeight = height - (padding * 2);

      const range = (maxW - minW) || 1;

      const points = sortedHistory.map((item, index) => {
        const x = padding + (index / (Math.max(1, sortedHistory.length - 1))) * effectiveWidth;
        const y = height - padding - ((item.weight - minW) / range) * effectiveHeight;
        return { x, y, weight: item.weight, date: item.date };
      });

      // SVG Path String
      let d = `M ${points[0].x} ${points[0].y}`;
      points.forEach((p, idx) => {
        if (idx > 0) d += ` L ${p.x} ${p.y}`;
      });

      // Gradient Definition
      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      defs.innerHTML = `
        <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--m3-primary)" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="var(--m3-primary)" stop-opacity="0.0"/>
        </linearGradient>
      `;
      svg.appendChild(defs);

      // Area Fill
      const areaPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const areaD = `${d} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
      areaPath.setAttribute("d", areaD);
      areaPath.setAttribute("fill", "url(#weightGrad)");
      svg.appendChild(areaPath);

      // Line Path
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "var(--m3-primary)");
      path.setAttribute("stroke-width", "3");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      svg.appendChild(path);

      // Data Circles
      points.forEach(p => {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", p.x);
        circle.setAttribute("cy", p.y);
        circle.setAttribute("r", "4");
        circle.setAttribute("fill", "var(--m3-surface)");
        circle.setAttribute("stroke", "var(--m3-primary)");
        circle.setAttribute("stroke-width", "2");

        const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
        title.textContent = `${p.date}: ${p.weight} lbs`;
        circle.appendChild(title);

        svg.appendChild(circle);
      });
    }



    function initSparkline() {
      const canvas = document.getElementById('hr-sparkline');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      function draw() {
        if (canvas.parentElement && canvas.parentElement.clientWidth > 0 && canvas.parentElement.clientHeight > 0) {
          const parentW = canvas.parentElement.clientWidth;
          const parentH = canvas.parentElement.clientHeight;
          if (canvas.width !== parentW || canvas.height !== parentH) {
            canvas.width = parentW;
            canvas.height = parentH;
          }
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (hrHistory.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 2;
            const step = canvas.width / (hrHistory.length - 1);
            
            hrHistory.forEach((val, i) => {
              const x = i * step;
              const y = canvas.height - ((val - 40) / (180 - 40)) * canvas.height;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            ctx.stroke();
          }
        }
        requestAnimationFrame(draw);
      }
      draw();
    }

    function isHRMConnected() {
      return Boolean(currentHR > 0 || hrSimInterval || (bleHRDevice && bleHRDevice.gatt && bleHRDevice.gatt.connected));
    }

    function handleHRMPillClick() {
      if (isHRMConnected()) {
        const hrCard = document.getElementById('hr-card');
        if (hrCard) {
          if (hrCard.classList.contains('hidden')) {
            hrCard.classList.remove('hidden');
            hrCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          } else {
            openHRMModal();
          }
        }
      } else {
        openHRMModal();
      }
    }

    function openHRMModal() {
      const modal = document.getElementById('hrm-connectivity-modal');
      if (!modal) return;

      const bleMsg = document.getElementById('hrm-ble-unsupported-msg');
      if (bleMsg) {
        if (!navigator.bluetooth) {
          bleMsg.classList.remove('hidden');
        } else {
          bleMsg.classList.add('hidden');
        }
      }

      const isConn = isHRMConnected();
      const statusText = document.getElementById('hrm-modal-status-text');
      const simBtnText = document.getElementById('modal-sim-btn-text');

      if (statusText) {
        if (isConn) {
          statusText.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span><span class="text-emerald-400 font-bold">Connected (${currentHR > 0 ? currentHR + ' BPM' : 'Active'})</span>`;
        } else {
          statusText.innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-600 inline-block"></span><span class="text-slate-400 font-bold">Disconnected</span>`;
        }
      }

      if (simBtnText) {
        simBtnText.innerText = hrSimInterval ? "Stop HR Simulator" : "Start HR Simulator";
      }

      modal.classList.remove('hidden');
    }

    function closeHRMModal() {
      const modal = document.getElementById('hrm-connectivity-modal');
      if (modal) modal.classList.add('hidden');
    }

    async function connectHRM(fromModal = false) {
      if (!navigator.bluetooth) {
        const bleMsg = document.getElementById('hrm-ble-unsupported-msg');
        if (bleMsg) bleMsg.classList.remove('hidden');
        if (typeof showToast === 'function') {
          showToast('Web Bluetooth is not supported on this browser/device. Try Chrome/Edge or run the Simulator.', 'warning');
        } else {
          alert('Web Bluetooth is not supported on this browser/device. Try Chrome/Edge or run the Simulator.');
        }
        return;
      }

      try {
        const statusText = document.getElementById('hrm-modal-status-text');
        if (statusText) {
          statusText.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block"></span><span class="text-amber-300 font-bold">Pairing...</span>`;
        }

        const device = await navigator.bluetooth.requestDevice({
          filters: [{ services: ['heart_rate'] }],
          optionalServices: ['battery_service']
        });

        bleHRDevice = device;
        device.addEventListener('gattserverdisconnected', onBLEDisconnected);

        const server = await device.gatt.connect();
        bleHRServer = server;

        const service = await server.getPrimaryService('heart_rate');
        const characteristic = await service.getCharacteristic('heart_rate_measurement');
        bleHRCharacteristic = characteristic;

        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', (event) => {
          parseHeartRateMeasurement(event);
        });

        onHRMConnected(device.name || 'Bluetooth Heart Rate Monitor');

        if (fromModal) {
          closeHRMModal();
        }
        if (typeof showToast === 'function') {
          showToast(`Connected to ${device.name || 'HR Monitor'}`, 'success');
        }
      } catch (err) {
        console.warn('Bluetooth HRM pairing cancelled or failed:', err);
        const statusText = document.getElementById('hrm-modal-status-text');
        if (statusText) {
          statusText.innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-600 inline-block"></span><span class="text-slate-400 font-bold">Disconnected</span>`;
        }
      }
    }

    function parseHeartRateMeasurement(event) {
      const value = event.target.value;
      if (!value || value.byteLength < 2) return;
      const flags = value.getUint8(0);
      const is16Bit = (flags & 0x01) === 0x01;
      const bpm = is16Bit ? value.getUint16(1, true) : value.getUint8(1);
      updateHRTelemetry(bpm);
    }

    function onBLEDisconnected() {
      disconnectHRM();
      if (typeof showToast === 'function') {
        showToast('Bluetooth HRM disconnected', 'info');
      }
    }

    function toggleHRSimulator(fromModal = false) {
      if (hrSimInterval) {
        disconnectHRM();
        return;
      }

      if (bleHRDevice && bleHRDevice.gatt && bleHRDevice.gatt.connected) {
        bleHRDevice.gatt.disconnect();
      }

      onHRMConnected('Simulator');
      if (fromModal) {
        closeHRMModal();
      }

      // Initial reading immediately
      currentHR = Math.floor(125 + Math.random() * 30);
      updateHRTelemetry(currentHR);

      hrSimInterval = setInterval(() => {
        // Natural fluctuations around working heart rate
        const delta = Math.floor((Math.random() - 0.48) * 6);
        currentHR = Math.max(90, Math.min(185, currentHR + delta));
        updateHRTelemetry(currentHR);
      }, 1000);
    }

    function disconnectHRM() {
      if (hrSimInterval) {
        clearInterval(hrSimInterval);
        hrSimInterval = null;
      }
      if (bleHRDevice && bleHRDevice.gatt && bleHRDevice.gatt.connected) {
        try {
          bleHRDevice.gatt.disconnect();
        } catch (e) {
          console.warn('Error disconnecting BLE device:', e);
        }
      }
      bleHRDevice = null;
      bleHRServer = null;
      bleHRCharacteristic = null;

      onHRMDisconnected();
    }

    function onHRMConnected(sourceName = 'HRM') {
      const hrCard = document.getElementById('hr-card');
      if (hrCard) hrCard.classList.remove('hidden');

      const btnSim = document.getElementById('btn-toggle-sim');
      if (btnSim) btnSim.innerText = hrSimInterval ? "Stop Sim" : "Simulate";

      const modalSimBtn = document.getElementById('modal-sim-btn-text');
      if (modalSimBtn) modalSimBtn.innerText = hrSimInterval ? "Stop HR Simulator" : "Start HR Simulator";

      const btnConnect = document.getElementById('btn-connect-hrm');
      if (btnConnect) {
        btnConnect.innerHTML = `<i class="fa-solid fa-bluetooth text-emerald-400"></i><span>${sourceName === 'Simulator' ? 'Sim Active' : 'Connected'}</span>`;
      }

      if (typeof updateRunningHRMUI === 'function') {
        updateRunningHRMUI();
      }
    }

    function onHRMDisconnected() {
      const hrCard = document.getElementById('hr-card');
      if (hrCard) hrCard.classList.add('hidden');

      currentHR = 0;
      const display = document.getElementById('live-hr-display');
      if (display) display.innerText = "--";

      const zone = document.getElementById('live-hr-zone');
      if (zone) {
        zone.innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-600 inline-block"></span><span>Disconnected</span>`;
      }

      const ping = document.getElementById('hr-pulse-ping');
      if (ping) ping.classList.add('opacity-0');

      const dot = document.getElementById('hr-pulse-dot');
      if (dot) dot.className = "relative inline-flex rounded-full h-3 w-3 bg-slate-600";

      const btnSim = document.getElementById('btn-toggle-sim');
      if (btnSim) btnSim.innerText = "Simulate";

      const modalSimBtn = document.getElementById('modal-sim-btn-text');
      if (modalSimBtn) modalSimBtn.innerText = "Start HR Simulator";

      const btnConnect = document.getElementById('btn-connect-hrm');
      if (btnConnect) {
        btnConnect.innerHTML = `<i class="fa-solid fa-bluetooth"></i><span>Connect HRM</span>`;
      }

      // Reset Minimalist Pill
      const pillHeart = document.getElementById('hr-pill-heart-icon');
      const pillDot = document.getElementById('hr-pill-pulse-dot');
      const pillPing = document.getElementById('hr-pill-pulse-ping');
      const pillLabel = document.getElementById('hr-pill-label');
      const pillBpm = document.getElementById('hr-pill-bpm');
      const pillAction = document.getElementById('hr-pill-action');

      if (pillHeart) pillHeart.className = "fa-solid fa-heart text-slate-500 text-xs group-hover:text-rose-400 transition-colors";
      if (pillDot) pillDot.className = "relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-600 transition-colors";
      if (pillPing) pillPing.classList.add('hidden');
      if (pillLabel) pillLabel.innerText = "HRM Disconnected";
      if (pillBpm) {
        pillBpm.classList.add('hidden');
        pillBpm.innerText = "";
      }
      if (pillAction) {
        pillAction.innerHTML = `<i class="fa-solid fa-bluetooth text-[10px]"></i><span>Tap to Connect</span>`;
      }

      if (typeof updateRunningHRMUI === 'function') {
        updateRunningHRMUI();
      }
    }

    function updateHRTelemetry(bpm) {
      currentHR = bpm;
      hrHistory.push(bpm);
      if (hrHistory.length > 50) hrHistory.shift();

      if (!window.runningHRSamples) window.runningHRSamples = [];
      window.runningHRSamples.push(bpm);
      if (window.runningHRSamples.length > 500) window.runningHRSamples.shift();

      if (typeof updateRunningHRMUI === 'function') {
        const impEl = document.getElementById('implement-select');
        if (impEl && impEl.value === 'Running') {
          updateRunningHRMUI();
        }
      }

      const display = document.getElementById('live-hr-display');
      if (display) display.innerText = bpm;

      // Dynamic Zone calculation based on standard cardiovascular ranges (~185 max HR)
      let zoneLabel = "Warm Up (Zone 1)";
      let zoneBadgeColor = "text-slate-400";
      let dotColor = "bg-slate-400";
      let shortZone = "Warmup";

      if (bpm >= 165) {
        zoneLabel = "Redline / Peak (Zone 5)";
        zoneBadgeColor = "text-rose-400";
        dotColor = "bg-rose-500";
        shortZone = "Peak";
      } else if (bpm >= 145) {
        zoneLabel = "Anaerobic (Zone 4)";
        zoneBadgeColor = "text-amber-400";
        dotColor = "bg-amber-400";
        shortZone = "Anaerobic";
      } else if (bpm >= 125) {
        zoneLabel = "Aerobic (Zone 3)";
        zoneBadgeColor = "text-emerald-400";
        dotColor = "bg-emerald-400";
        shortZone = "Aerobic";
      } else if (bpm >= 105) {
        zoneLabel = "Fat Burn (Zone 2)";
        zoneBadgeColor = "text-cyan-400";
        dotColor = "bg-cyan-400";
        shortZone = "Fat Burn";
      }

      const zone = document.getElementById('live-hr-zone');
      if (zone) {
        zone.innerHTML = `<span class="w-2 h-2 rounded-full ${dotColor} inline-block animate-pulse"></span><span class="${zoneBadgeColor}">${zoneLabel}</span>`;
      }

      const ping = document.getElementById('hr-pulse-ping');
      if (ping) ping.classList.remove('opacity-0');

      const dot = document.getElementById('hr-pulse-dot');
      if (dot) dot.className = `relative inline-flex rounded-full h-3 w-3 ${dotColor}`;

      // Minimalist Pill Live State
      const pillHeart = document.getElementById('hr-pill-heart-icon');
      const pillDot = document.getElementById('hr-pill-pulse-dot');
      const pillPing = document.getElementById('hr-pill-pulse-ping');
      const pillLabel = document.getElementById('hr-pill-label');
      const pillBpm = document.getElementById('hr-pill-bpm');
      const pillAction = document.getElementById('hr-pill-action');

      if (pillHeart) pillHeart.className = "fa-solid fa-heart text-rose-500 text-xs animate-pulse";
      if (pillDot) pillDot.className = `relative inline-flex rounded-full h-2.5 w-2.5 ${dotColor}`;
      if (pillPing) pillPing.classList.remove('hidden');
      if (pillLabel) pillLabel.innerText = "HRM Live:";
      if (pillBpm) {
        pillBpm.classList.remove('hidden');
        pillBpm.innerText = `${bpm} BPM`;
      }
      if (pillAction) {
        pillAction.innerHTML = `<span class="w-1.5 h-1.5 rounded-full ${dotColor} inline-block"></span><span>${shortZone}</span>`;
      }
    }



    function renderHeatMap() {
      if (typeof updateMapDateSelectorUI === 'function') {
        updateMapDateSelectorUI();
      }

      const tickerContainer = document.getElementById('zip-ticker-container');
      const displayUserZip = document.getElementById('display-user-zip');
      const userZip = getUserZip();
      const userCity = localStorage.getItem('showUp_user_ip_city');

      if (displayUserZip) {
        displayUserZip.innerText = userCity ? `${userZip} (${userCity.split(',')[0]})` : userZip;
      }

      // ONLY get zip codes where logged-in athletes are working out or completed on selected date
      const activeZipNodes = getActiveAndCompletedZipNodes();
      const aggNodes = getAggregatedNodesForZoom(currentMapZoom, activeZipNodes);

      if (!selectedHeatMapZip || (!activeZipNodes.some(n => n.zip === selectedHeatMapZip) && !aggNodes.some(a => a.id === selectedHeatMapZip))) {
        selectedHeatMapZip = activeZipNodes.length > 0 ? activeZipNodes[0].zip : userZip;
      }

      // 1. Render Ticker Pills (Zoom-adaptive: Zip Codes, States, or Country)
      if (tickerContainer) {
        if (aggNodes.length === 0) {
          const activeDate = (typeof getSelectedMapDate === 'function') ? getSelectedMapDate() : getETDateKey();
          const isToday = (activeDate === getETDateKey());
          const dateDisp = (typeof formatMapDateDisplay === 'function') ? formatMapDateDisplay(activeDate) : activeDate;
          let emptyNotice = `No workouts recorded for ${dateDisp}.`;
          if (isToday) {
            const yesterdayKey = typeof getYesterdayETDateKey === 'function' ? getYesterdayETDateKey() : '';
            const yesterdayNodes = (yesterdayKey && typeof getActiveAndCompletedZipNodes === 'function') ? getActiveAndCompletedZipNodes(yesterdayKey) : [];
            const yTotal = yesterdayNodes.reduce((acc, n) => acc + (n.completedToday || 0), 0);
            if (yTotal > 0) {
              emptyNotice = `No workouts recorded today yet. <span class="text-amber-300 font-semibold">${yTotal} workout${yTotal === 1 ? '' : 's'} scored yesterday.</span> <button type="button" onclick="triggerHaptic('light'); setMapDateToYesterday()" class="text-amber-400 hover:text-amber-300 underline font-bold ml-1 cursor-pointer">View Yesterday (${yTotal} Scored)</button>`;
            } else {
              emptyNotice = 'No workouts recorded today yet. Log your first workout to put your area on the map!';
            }
          }
          tickerContainer.innerHTML = `
            <div class="text-[11px] text-slate-500 italic py-1 px-1 flex items-center gap-1.5 flex-wrap">
              <i class="fa-solid fa-circle-info text-slate-600"></i>
              <span>${emptyNotice}</span>
            </div>
          `;
        } else {
          tickerContainer.innerHTML = aggNodes.map(node => {
            const isSelected = (node.id === selectedHeatMapZip || (node.originalNodes && node.originalNodes.some(on => on.zip === selectedHeatMapZip)));
            const hasActive = node.activeCount > 0;

            return `
              <button onclick="triggerHaptic('light'); selectZipNode('${node.id}')" class="px-2.5 py-1.5 rounded-xl border text-[11px] whitespace-nowrap transition flex items-center gap-1.5 ${
                isSelected 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm font-bold' 
                  : hasActive
                    ? 'bg-slate-900 text-emerald-400 border-emerald-500/30 font-semibold'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }">
                <span class="w-5 h-5 rounded-lg bg-[var(--m3-primary)] text-[var(--m3-onPrimary)] flex items-center justify-center text-[10px] font-mono font-black shadow-sm">${node.completedToday || 0}</span>
                <span class="font-mono font-bold">${node.type === 'zip' ? node.id : node.label}</span>
                ${node.type === 'zip' ? `<span class="text-slate-400 text-[10px]">${node.subLabel.split(',')[0]}</span>` : ''}
                ${hasActive 
                  ? `<span class="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1"><span class="w-1 h-1 rounded-full bg-emerald-400 animate-ping"></span>${node.activeCount} Live</span>` 
                  : `<span class="text-[9px] px-1.5 py-0.5 rounded-md bg-[var(--m3-primaryContainer)] text-[var(--m3-primary)] border border-[var(--m3-primary)]/30 font-bold flex items-center gap-1"><i class="fa-solid fa-check text-[8px] font-black"></i>${node.completedToday} Done</span>`
                }
              </button>
            `;
          }).join('');
        }
      }

      // 2. Update Detail Card
      updateZipDetailCard(activeZipNodes);

      // 3. Render On-Map Zip Boundaries Overlay & Numbers
      renderMapZipBoundariesOverlay(activeZipNodes);

      // 4. Update Google Maps Base Layer
      initGoogleMapsBaseLayer();
    }
