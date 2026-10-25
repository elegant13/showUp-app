/* ==========================================================================
   showUp Workout Engine: Logging, Catalog, Tactile Numpad & Analytics
   ========================================================================== */

    function openWeightNumpadModal(targetInputId, title, callback) {
      numpadTargetInputId = targetInputId || null;
      numpadCallback = typeof callback === 'function' ? callback : null;

      let initialVal = "0";
      if (targetInputId) {
        const el = document.getElementById(targetInputId);
        if (el && el.value !== undefined && el.value !== '') {
          initialVal = String(parseFloat(el.value) || 0);
        }
      } else if (title && title.toLowerCase().includes('body')) {
        initialVal = String(userWeight || 0);
      }

      numpadCurrentVal = initialVal;
      const titleEl = document.getElementById('numpad-modal-title');
      if (titleEl) titleEl.innerText = title || 'Input Weight';

      const unitEl = document.getElementById('numpad-display-unit');
      if (unitEl) {
        unitEl.innerText = (title && title.toLowerCase().includes('kg')) ? 'kg' : 'lbs';
      }

      updateNumpadDisplay();
      const modal = document.getElementById('weight-numpad-modal');
      if (modal) modal.classList.remove('hidden');
    }

    function closeWeightNumpadModal() {
      const modal = document.getElementById('weight-numpad-modal');
      if (modal) modal.classList.add('hidden');
      numpadTargetInputId = null;
      numpadCallback = null;
    }

    function updateNumpadDisplay() {
      const displayEl = document.getElementById('numpad-display-val');
      if (displayEl) {
        displayEl.innerText = numpadCurrentVal || '0';
      }
    }

    function numpadInput(char) {
      if (char === '.') {
        if (numpadCurrentVal.includes('.')) return;
        if (!numpadCurrentVal || numpadCurrentVal === '0') {
          numpadCurrentVal = '0.';
        } else {
          numpadCurrentVal += '.';
        }
      } else {
        if (numpadCurrentVal === '0') {
          numpadCurrentVal = String(char);
        } else {
          if (numpadCurrentVal.length < 6) {
            numpadCurrentVal += String(char);
          }
        }
      }
      updateNumpadDisplay();
    }

    function numpadBackspace() {
      if (numpadCurrentVal.length <= 1) {
        numpadCurrentVal = '0';
      } else {
        numpadCurrentVal = numpadCurrentVal.slice(0, -1);
        if (numpadCurrentVal === '' || numpadCurrentVal === '-') {
          numpadCurrentVal = '0';
        }
      }
      updateNumpadDisplay();
    }

    function numpadClear() {
      numpadCurrentVal = '0';
      updateNumpadDisplay();
    }

    function numpadQuickAdjust(delta) {
      let val = parseFloat(numpadCurrentVal) || 0;
      val = Math.max(0, Math.round((val + delta) * 10) / 10);
      numpadCurrentVal = String(val);
      updateNumpadDisplay();
    }

    function numpadConfirm() {
      const finalNum = parseFloat(numpadCurrentVal) || 0;

      if (numpadTargetInputId) {
        const input = document.getElementById(numpadTargetInputId);
        if (input) {
          input.value = finalNum;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      if (typeof numpadCallback === 'function') {
        numpadCallback(finalNum);
      }

      closeWeightNumpadModal();
      showToast(`Weight set to ${finalNum}!`, "success");
    }



    function loadPhysicalProfile() {
      const hInput = document.getElementById('user-height-input');
      const wInput = document.getElementById('user-weight-input');
      const targetInput = document.getElementById('user-target-weight-input');
      const restSelect = document.getElementById('pref-default-rest-time');

      if (hInput) hInput.value = userHeight;
      if (wInput) wInput.value = userWeight;

      const savedTarget = localStorage.getItem('showUp_user_target_weight');
      if (targetInput && savedTarget) targetInput.value = savedTarget;

      const savedRest = localStorage.getItem('showUp_default_rest_time') || '90';
      if (restSelect) restSelect.value = savedRest;

      if (typeof renderQuickWeightChips === 'function') {
        const impSelect = document.getElementById('implement-select');
        renderQuickWeightChips(impSelect ? impSelect.value : 'Barbell');
      }
    }

    function savePhysicalProfile() {
      const hInput = document.getElementById('user-height-input');
      const wInput = document.getElementById('user-weight-input');
      const targetInput = document.getElementById('user-target-weight-input');

      const h = (hInput && parseFloat(hInput.value)) || userHeight;
      const w = (wInput && parseFloat(wInput.value)) || userWeight;

      userHeight = h;
      userWeight = w;

      localStorage.setItem('showUp_user_height', userHeight);
      localStorage.setItem('showUp_user_weight', userWeight);

      if (targetInput && targetInput.value) {
        localStorage.setItem('showUp_user_target_weight', targetInput.value);
      }

      const latestEntry = weightHistory[0];
      const todayISO = typeof getLocalDateKey === 'function' ? getLocalDateKey() : new Date().toISOString().slice(0, 10);

      if (!latestEntry || latestEntry.weight !== userWeight || latestEntry.date !== todayISO) {
        weightHistory.unshift({ date: todayISO, weight: userWeight, height: userHeight });
        localStorage.setItem('showUp_weight_history', JSON.stringify(weightHistory));
      }
      renderWeightHistory();
    }

    // ================= HISTORICAL WEIGHT LOGGING & INTUITIVE DATE PICKER =================


    let isScrollingExerciseInput = false;
    let activeSuggestionIndex = -1;
    let activeExerciseCatalogFilter = null;

    function exerciseMatchesImplementFilter(exercise, filter) {
      if (!filter) return true;
      if (!exercise) return false;
      const fLower = String(filter).trim().toLowerCase();
      const implLower = String(exercise.implement || '').trim().toLowerCase();
      const nameLower = String(exercise.name || '').trim().toLowerCase();

      if (implLower === fLower) return true;
      if (implLower.includes(fLower)) return true;

      if (fLower === 'kettlebell') {
        return implLower === 'kettlebell' || nameLower.includes('kettlebell') || /\bkb\b/i.test(nameLower);
      }
      if (fLower === 'barbell') {
        return implLower === 'barbell' || nameLower.includes('barbell') || nameLower.includes('ez bar');
      }
      if (fLower === 'dumbbell') {
        return implLower === 'dumbbell' || nameLower.includes('dumbbell') || /\bdb\b/i.test(nameLower);
      }
      if (fLower === 'bodyweight') {
        return implLower === 'bodyweight' || implLower === 'calisthenics';
      }
      if (fLower === 'gymnastics rings' || fLower === 'rings' || fLower === 'ring') {
        return implLower.includes('ring') || nameLower.startsWith('ring') || nameLower.includes('ring') || nameLower.includes('gymnastic');
      }
      return false;
    }

    function filterExerciseCatalog(query, implementFilter) {
      const activeFilter = (implementFilter !== undefined) ? implementFilter : activeExerciseCatalogFilter;
      const clean = (query && typeof query === 'string') ? query.trim().toLowerCase() : '';

      // If both query and activeFilter are empty, return []
      if (!clean && !activeFilter) return [];

      const cleanAlphanum = clean.replace(/[^a-z0-9]/g, '');

      const catalog = (typeof defaultCatalog !== 'undefined' && Array.isArray(defaultCatalog)) 
        ? defaultCatalog 
        : ((typeof window !== 'undefined' && window.defaultCatalog) || []);

      const results = [];
      const seen = new Set();

      catalog.forEach(ex => {
        if (!ex || !ex.name) return;

        // Check implement filter first
        if (activeFilter && !exerciseMatchesImplementFilter(ex, activeFilter)) {
          return;
        }

        const name = ex.name;
        const nameLower = name.toLowerCase();
        const nameAlphanum = nameLower.replace(/[^a-z0-9]/g, '');

        // If query is blank but filter is active, include all matching exercises
        if (!clean) {
          if (!seen.has(name)) {
            seen.add(name);
            results.push({
              exercise: ex,
              priority: 0
            });
          }
          return;
        }

        let priority = -1;

        if (nameLower === clean) {
          priority = 0; // exact match
        } else if (nameLower.startsWith(clean)) {
          priority = 1; // prefix match (e.g. "kb" -> "KB Swings")
        } else {
          // Word boundary match: any word starts with query
          const words = nameLower.split(/[\s/()\-]+/);
          const wordMatch = words.some(w => w.startsWith(clean));
          if (wordMatch) {
            priority = 2; // word start match (e.g. "swings" -> "KB Swings", "SH KB Swings")
          } else if (clean.length >= 3 && nameLower.includes(clean)) {
            priority = 3; // substring match
          } else if (clean.length >= 3 && cleanAlphanum.length >= 3 && nameAlphanum.includes(cleanAlphanum)) {
            priority = 4; // normalized match
          } else {
            // Abbreviation / expansion check
            const expanded = (typeof expandExerciseAbbreviations === 'function') 
              ? expandExerciseAbbreviations(name).toLowerCase() 
              : '';
            const abbr = (typeof abbreviateExerciseName === 'function') 
              ? abbreviateExerciseName(name).toLowerCase() 
              : '';
            if (expanded.includes(clean) || abbr.includes(clean) || (cleanAlphanum.length >= 3 && (expanded.replace(/[^a-z0-9]/g, '').includes(cleanAlphanum) || abbr.replace(/[^a-z0-9]/g, '').includes(cleanAlphanum)))) {
              priority = 5;
            }
          }
        }

        if (priority >= 0 && !seen.has(name)) {
          seen.add(name);
          results.push({
            exercise: ex,
            priority
          });
        }
      });

      // Sort by priority first, then alphabetically by exercise name
      results.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.exercise.name.localeCompare(b.exercise.name);
      });

      return results.map(r => r.exercise);
    }

    function highlightExerciseMatch(text, query) {
      const safe = (typeof escapeHtml === 'function') ? escapeHtml : (str => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));
      if (!text || !query) return safe(text || '');
      const cleanQ = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!cleanQ) return safe(text);
      try {
        const regex = new RegExp('(' + cleanQ + ')', 'gi');
        const parts = text.split(regex);
        return parts.map(part => {
          if (part.toLowerCase() === query.trim().toLowerCase()) {
            return `<span class="text-emerald-400 font-bold">${safe(part)}</span>`;
          }
          return safe(part);
        }).join('');
      } catch (e) {
        return safe(text);
      }
    }

    function scrollExerciseInputIntoView(inputEl) {
      if (!inputEl) return;
      
      const modalParent = (typeof inputEl.closest === 'function') ? inputEl.closest('.overflow-y-auto') : null;
      if (modalParent && modalParent !== (typeof document !== 'undefined' ? document.documentElement : null) && modalParent !== (typeof document !== 'undefined' ? document.body : null)) {
        if (typeof inputEl.scrollIntoView === 'function') {
          inputEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        return;
      }

      if (isScrollingExerciseInput) return;

      try {
        const rect = (typeof inputEl.getBoundingClientRect === 'function') ? inputEl.getBoundingClientRect() : null;
        if (!rect) {
          if (typeof inputEl.scrollIntoView === 'function') inputEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          return;
        }

        const header = (typeof document !== 'undefined' && document.querySelector) ? document.querySelector('header') : null;
        const headerHeight = (header && header.offsetHeight) ? header.offsetHeight : 64;
        const vh = (typeof window !== 'undefined' && window.innerHeight) ? window.innerHeight : 800;

        const desiredTop = headerHeight + 16;

        if (rect.top < desiredTop - 8 || rect.top > vh * 0.35) {
          isScrollingExerciseInput = true;
          const currentScrollY = (typeof window !== 'undefined' ? (window.pageYOffset || (document.documentElement ? document.documentElement.scrollTop : 0)) : 0) || 0;
          const targetScrollY = Math.max(0, currentScrollY + rect.top - desiredTop);
          
          if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
            window.scrollTo({
              top: targetScrollY,
              behavior: 'smooth'
            });
          }
          setTimeout(() => {
            isScrollingExerciseInput = false;
          }, 250);
        }
      } catch (err) {
        if (typeof inputEl.scrollIntoView === 'function') {
          inputEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }

    function getActiveExerciseCatalogFilter() {
      return activeExerciseCatalogFilter;
    }

    function setExerciseCatalogFilter(filterName) {
      activeExerciseCatalogFilter = filterName || null;
      renderExerciseCatalogFilterPills();
    }

    function renderExerciseCatalogFilterPills() {
      if (typeof document === 'undefined') return;
      const pills = [
        { id: 'filter-pill-barbell', name: 'Barbell' },
        { id: 'filter-pill-kettlebell', name: 'Kettlebell' },
        { id: 'filter-pill-dumbbell', name: 'Dumbbell' },
        { id: 'filter-pill-bodyweight', name: 'Bodyweight' },
        { id: 'filter-pill-rings', name: 'Gymnastics Rings' }
      ];

      pills.forEach(pill => {
        const el = document.getElementById(pill.id);
        if (!el) return;
        const isEngaged = activeExerciseCatalogFilter && (activeExerciseCatalogFilter.toLowerCase() === pill.name.toLowerCase());
        el.setAttribute('aria-pressed', isEngaged ? 'true' : 'false');

        const icon = el.querySelector('i');

        if (isEngaged) {
          // Depressed and engaged state: sunken inner shadow, 1px depression, emerald text & border
          el.className = 'exercise-filter-pill px-3 py-1.5 rounded-full text-xs font-black text-emerald-400 bg-slate-950 border border-emerald-500/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_0_8px_rgba(16,185,129,0.2)] translate-y-[1px] select-none flex items-center gap-1.5 cursor-pointer';
          if (icon) {
            icon.classList.remove('opacity-70');
            icon.classList.add('opacity-100', 'text-emerald-400');
          }
        } else {
          // Unselected resting state
          el.className = 'exercise-filter-pill px-3 py-1.5 rounded-full text-xs font-bold text-slate-400 bg-slate-900/90 border border-slate-800 hover:text-slate-200 hover:border-slate-700 transition select-none flex items-center gap-1.5 cursor-pointer shadow-sm translate-y-0';
          if (icon) {
            icon.classList.remove('opacity-100', 'text-emerald-400');
            icon.classList.add('opacity-70');
          }
        }
      });

      const indicator = document.getElementById('active-exercise-filter-indicator');
      const nameLabel = document.getElementById('active-exercise-filter-name');
      if (indicator) {
        if (activeExerciseCatalogFilter) {
          if (nameLabel) nameLabel.textContent = activeExerciseCatalogFilter;
          indicator.classList.remove('hidden');
        } else {
          indicator.classList.add('hidden');
        }
      }
    }

    function toggleExerciseCatalogFilter(filterName, inputId = 'exercise-name-input', dropdownId = 'exercise-suggestions-dropdown') {
      if (activeExerciseCatalogFilter && activeExerciseCatalogFilter.toLowerCase() === (filterName || '').toLowerCase()) {
        // Tapping again removes the chosen filter
        activeExerciseCatalogFilter = null;
      } else {
        activeExerciseCatalogFilter = filterName;
      }

      renderExerciseCatalogFilterPills();

      const inputEl = document.getElementById(inputId);
      const currentVal = inputEl ? inputEl.value : '';

      if (activeExerciseCatalogFilter) {
        updateExerciseSuggestions(currentVal, inputId, dropdownId);
        if (inputEl) {
          scrollExerciseInputIntoView(inputEl);
        }
      } else {
        if (!currentVal || !currentVal.trim()) {
          closeExerciseSuggestions(dropdownId);
        } else {
          updateExerciseSuggestions(currentVal, inputId, dropdownId);
        }
      }
    }

    function updateExerciseSuggestions(query, inputId, dropdownId) {
      const dropdown = document.getElementById(dropdownId);
      const inputEl = document.getElementById(inputId);
      if (!dropdown || !inputEl) return;

      const trimmed = (query || '').trim();
      if (!trimmed && !activeExerciseCatalogFilter) {
        dropdown.classList.add('hidden');
        dropdown.innerHTML = '';
        activeSuggestionIndex = -1;
        return;
      }

      const matches = filterExerciseCatalog(trimmed);
      activeSuggestionIndex = -1;

      const safe = (typeof escapeHtml === 'function') ? escapeHtml : (str => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));

      if (matches.length === 0) {
        let noMatchHtml = `
          <div class="px-4 py-3.5 text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>No ${activeExerciseCatalogFilter ? `<span class="text-emerald-400 font-semibold">${safe(activeExerciseCatalogFilter)}</span> ` : ''}catalog matches for "<span class="text-slate-200 font-semibold">${safe(trimmed || '(empty)')}</span>"</span>
            <span class="text-[11px] text-slate-500 font-medium">Custom exercise</span>
          </div>
        `;
        if (activeExerciseCatalogFilter) {
          noMatchHtml = `
            <div class="px-4 py-2 bg-slate-950/95 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-slate-400 sticky top-0 backdrop-blur-md z-10">
              <span class="flex items-center gap-1.5 text-emerald-400">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"></span>
                <span>${safe(activeExerciseCatalogFilter)}</span>
              </span>
              <button type="button" onclick="event.stopPropagation(); toggleExerciseCatalogFilter('${safe(activeExerciseCatalogFilter)}', '${inputId}', '${dropdownId}')" class="text-slate-400 hover:text-slate-200 text-[10px] uppercase tracking-wider font-semibold underline transition">Clear filter</button>
            </div>
          ` + noMatchHtml;
        }
        dropdown.innerHTML = noMatchHtml;
        dropdown.classList.remove('hidden');
        return;
      }

      let html = '';
      if (activeExerciseCatalogFilter) {
        html += `
          <div class="px-4 py-2 bg-slate-950/95 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-slate-400 sticky top-0 backdrop-blur-md z-10">
            <span class="flex items-center gap-1.5 text-emerald-400">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"></span>
              <span>${safe(activeExerciseCatalogFilter)} Catalog (${matches.length})</span>
            </span>
            <button type="button" onclick="event.stopPropagation(); toggleExerciseCatalogFilter('${safe(activeExerciseCatalogFilter)}', '${inputId}', '${dropdownId}')" class="text-slate-400 hover:text-slate-200 text-[10px] uppercase tracking-wider font-semibold underline transition">Clear filter</button>
          </div>
        `;
      }

      matches.forEach((ex) => {
        const displayName = trimmed ? highlightExerciseMatch(ex.name, trimmed) : safe(ex.name);
        const escapedNameAttr = safe(ex.name).replace(/'/g, "&#39;");
        html += `
          <div class="exercise-suggestion-item px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/80 active:bg-slate-800 transition select-none group border-b border-slate-800/50 last:border-b-0"
               role="option"
               data-exercise-name="${escapedNameAttr}"
               onclick="selectExerciseSuggestion('${escapedNameAttr}', '${inputId}', '${dropdownId}')">
            <div class="flex items-center gap-3 min-w-0 pr-2">
              <div class="w-8 h-8 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition shrink-0">
                <i class="fa-solid fa-dumbbell text-xs"></i>
              </div>
              <div class="truncate">
                <span class="text-sm font-semibold text-slate-100 group-hover:text-emerald-300 transition block truncate tracking-tight">${displayName}</span>
                <span class="text-xs text-slate-400 font-medium">${safe(ex.muscle || 'Full Body')}</span>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-800/90 text-slate-300 border border-slate-700/60">${safe(ex.implement || 'General')}</span>
            </div>
          </div>
        `;
      });

      dropdown.innerHTML = html;
      dropdown.classList.remove('hidden');
    }

    function selectExerciseSuggestion(exerciseName, inputId, dropdownId) {
      const inputEl = document.getElementById(inputId);
      if (!inputEl) return;

      const cleanName = typeof exerciseName === 'string'
        ? exerciseName.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        : exerciseName;

      inputEl.value = cleanName;

      if (inputId === 'exercise-name-input') {
        if (typeof handleExerciseInput === 'function') {
          handleExerciseInput(cleanName);
        }
      } else if (inputId === 'edit-active-set-exercise') {
        if (typeof handleEditActiveSetExerciseInput === 'function') {
          handleEditActiveSetExerciseInput(cleanName);
        }
      }

      closeExerciseSuggestions(dropdownId);
      if (typeof triggerHaptic === 'function') triggerHaptic('light');

      scrollExerciseInputIntoView(inputEl);
    }

    function closeExerciseSuggestions(dropdownId) {
      const targetDropdowns = dropdownId 
        ? [document.getElementById(dropdownId)] 
        : [document.getElementById('exercise-suggestions-dropdown'), document.getElementById('edit-exercise-suggestions-dropdown')];

      targetDropdowns.forEach(dd => {
        if (dd) {
          dd.classList.add('hidden');
          dd.innerHTML = '';
        }
      });
      activeSuggestionIndex = -1;
    }

    function handleExerciseInputFocus(inputEl, dropdownId) {
      if (!inputEl) return;
      scrollExerciseInputIntoView(inputEl);
      if ((inputEl.value && inputEl.value.trim()) || activeExerciseCatalogFilter) {
        updateExerciseSuggestions(inputEl.value, inputEl.id, dropdownId);
      }
    }

    function handleExerciseInputKeydown(e, inputId, dropdownId) {
      const dropdown = document.getElementById(dropdownId);
      if (!dropdown || dropdown.classList.contains('hidden')) return;

      const items = dropdown.querySelectorAll ? dropdown.querySelectorAll('.exercise-suggestion-item') : [];
      if (!items || items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeSuggestionIndex = (activeSuggestionIndex + 1) % items.length;
        updateHighlightedSuggestion(items, activeSuggestionIndex);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeSuggestionIndex = (activeSuggestionIndex - 1 + items.length) % items.length;
        updateHighlightedSuggestion(items, activeSuggestionIndex);
      } else if (e.key === 'Enter') {
        if (activeSuggestionIndex >= 0 && activeSuggestionIndex < items.length) {
          e.preventDefault();
          const targetItem = items[activeSuggestionIndex];
          const selectedName = targetItem.getAttribute ? targetItem.getAttribute('data-exercise-name') : null;
          if (selectedName) {
            selectExerciseSuggestion(selectedName, inputId, dropdownId);
          }
        }
      } else if (e.key === 'Escape') {
        closeExerciseSuggestions(dropdownId);
      }
    }

    function updateHighlightedSuggestion(items, index) {
      items.forEach((item, i) => {
        if (i === index) {
          item.classList.add('bg-emerald-500/25');
          if (typeof item.scrollIntoView === 'function') {
            item.scrollIntoView({ block: 'nearest' });
          }
        } else {
          item.classList.remove('bg-emerald-500/25');
        }
      });
    }

    function initCatalog() {
      const datalist = document.getElementById('exercise-catalog-list');
      if (datalist) {
        datalist.innerHTML = '';
        const optionValues = new Set();

        defaultCatalog.forEach(ex => {
          if (ex.name) optionValues.add(ex.name);

          if (typeof expandExerciseAbbreviations === 'function') {
            const expanded = expandExerciseAbbreviations(ex.name);
            if (expanded) optionValues.add(expanded);
          }

          if (typeof abbreviateExerciseName === 'function') {
            const abbr = abbreviateExerciseName(ex.name);
            if (abbr) optionValues.add(abbr);
          }
        });

        Array.from(optionValues)
          .sort((a, b) => a.localeCompare(b))
          .forEach(val => {
            const option = document.createElement('option');
            option.value = val;
            datalist.appendChild(option);
          });
      }

      // Wire click-outside dismisser
      if (typeof document !== 'undefined' && !document._hasExerciseSuggestionListener) {
        document._hasExerciseSuggestionListener = true;
        document.addEventListener('click', (e) => {
          const mainWrapper = document.getElementById('exercise-autocomplete-wrapper');
          if (mainWrapper && typeof mainWrapper.contains === 'function' && !mainWrapper.contains(e.target)) {
            closeExerciseSuggestions('exercise-suggestions-dropdown');
          }
          const editWrapper = document.getElementById('edit-exercise-autocomplete-wrapper');
          if (editWrapper && typeof editWrapper.contains === 'function' && !editWrapper.contains(e.target)) {
            closeExerciseSuggestions('edit-exercise-suggestions-dropdown');
          }
        });
      }
    }

    function handleExerciseInput(val) {
      const inputEl = document.getElementById('exercise-name-input');
      if (inputEl) {
        scrollExerciseInputIntoView(inputEl);
        updateExerciseSuggestions(val, 'exercise-name-input', 'exercise-suggestions-dropdown');
      }

      if (typeof resolveExerciseMuscles === 'function') {
        const profile = resolveExerciseMuscles(val);
        const impSelect = document.getElementById('implement-select');
        const musSelect = document.getElementById('muscle-group-select');

        if (profile) {
          if (impSelect && profile.implement) {
            impSelect.value = profile.implement;
            handleImplementChange(profile.implement);
          }
          if (musSelect && profile.primary) {
            musSelect.value = profile.primary;
          }
        }

        updateAutoMusclesIndicator(val, profile);
        updateWorkoutExtraOptionsPreview();
      } else {
        const match = defaultCatalog.find(c => c.name.toLowerCase() === val.toLowerCase());
        if (match) {
          document.getElementById('implement-select').value = match.implement;
          document.getElementById('muscle-group-select').value = match.muscle;
          handleImplementChange(match.implement);
        } else {
          const lower = val.toLowerCase();
          if (lower.includes('run') || lower.includes('jog') || lower.includes('sprint')) handleImplementChange("Running");
          else if (lower.includes('swim')) handleImplementChange("Swimming");
          else if (lower.includes('walk')) handleImplementChange("Walking");
          else if (lower.includes('hike')) handleImplementChange("Hiking");
          else if (lower.includes('bike') || lower.includes('cycle')) handleImplementChange("Biking");
          else if (lower.includes('row') || lower.includes('erg')) handleImplementChange("Row Erg");
        }
      }
    }

    function updateAutoMusclesIndicator(val, profile) {
      const pill = document.getElementById('exercise-auto-muscles-pill');
      if (!pill) return;
      const trimmed = (val || '').trim();
      if (!trimmed || !profile) {
        pill.classList.add('hidden');
        return;
      }
      const primaryEl = document.getElementById('auto-muscle-primary');
      const secEl = document.getElementById('auto-muscle-secondary');
      const secWrapper = document.getElementById('auto-muscle-secondary-wrapper');
      const impEl = document.getElementById('auto-implement-val');
      const impWrapper = document.getElementById('auto-implement-wrapper');

      if (primaryEl) primaryEl.innerText = profile.primary || 'Full Body';
      if (secEl && secWrapper) {
        if (profile.secondary && profile.secondary.length > 0) {
          secEl.innerText = profile.secondary.join(', ');
          secWrapper.classList.remove('hidden');
        } else {
          secWrapper.classList.add('hidden');
        }
      }
      if (impEl && impWrapper) {
        if (profile.implement) {
          impEl.innerText = profile.implement;
          impWrapper.classList.remove('hidden');
        } else {
          impWrapper.classList.add('hidden');
        }
      }
      pill.classList.remove('hidden');
    }

    function handleImplementChange(implementVal) {
      const standardPanel = document.getElementById('standard-metrics-panel');
      const ergPanel = document.getElementById('erg-metrics-panel');
      const swimPanel = document.getElementById('swim-metrics-panel');
      const endurancePanel = document.getElementById('endurance-metrics-panel');
      const runningPanel = document.getElementById('running-metrics-panel');

      if (standardPanel) standardPanel.classList.add('hidden');
      if (ergPanel) ergPanel.classList.add('hidden');
      if (swimPanel) swimPanel.classList.add('hidden');
      if (endurancePanel) endurancePanel.classList.add('hidden');
      if (runningPanel) runningPanel.classList.add('hidden');

      if (implementVal === "Running") {
        if (runningPanel) runningPanel.classList.remove('hidden');
        if (typeof updateRunningHRMUI === 'function') updateRunningHRMUI();
      } else if (implementVal === "Row Erg") {
        if (ergPanel) ergPanel.classList.remove('hidden');
      } else if (implementVal === "Swimming") {
        if (swimPanel) swimPanel.classList.remove('hidden');
      } else if (["Walking", "Hiking", "Biking"].includes(implementVal)) {
        const distLabel = document.getElementById('endurance-dist-label');
        if (distLabel) distLabel.innerText = `Distance (${implementVal} Miles)`;
        if (endurancePanel) endurancePanel.classList.remove('hidden');
      } else {
        if (standardPanel) standardPanel.classList.remove('hidden');
      }

      const impSelect = document.getElementById('implement-select');
      if (impSelect && impSelect.value !== implementVal) {
        impSelect.value = implementVal;
      }
      renderQuickWeightChips(implementVal);
      updateWorkoutExtraOptionsPreview();
    }

    function renderQuickWeightChips(implement = 'Barbell') {
      const container = document.getElementById('quick-plate-chips-container');
      const labelEl = document.getElementById('quick-plate-chips-label');
      if (!container) return;

      const imp = (implement || '').toLowerCase();
      let chips = [];
      let labelText = "Quick Plate Load";

      if (imp.includes('kettlebell') || imp.includes('kb')) {
        labelText = "Standard KB Sizes";
        chips = [
          { label: "16kg (35#)", val: 35, mode: "set" },
          { label: "20kg (44#)", val: 44, mode: "set" },
          { label: "24kg (53#)", val: 53, mode: "set" },
          { label: "28kg (62#)", val: 62, mode: "set" },
          { label: "32kg (70#)", val: 70, mode: "set" }
        ];
      } else if (imp.includes('barbell')) {
        labelText = "Barbell Plates";
        chips = [
          { label: "+45 (Plate)", val: 45, mode: "add" },
          { label: "+25 (Quarter)", val: 25, mode: "add" },
          { label: "+10", val: 10, mode: "add" },
          { label: "+5", val: 5, mode: "add" },
          { label: "+2.5", val: 2.5, mode: "add" },
          { label: "Bar (45#)", val: 45, mode: "set" }
        ];
      } else if (imp.includes('dumbbell') || imp.includes('db')) {
        labelText = "Dumbbell Weights";
        chips = [
          { label: "+5", val: 5, mode: "add" },
          { label: "+10", val: 10, mode: "add" },
          { label: "25#", val: 25, mode: "set" },
          { label: "35#", val: 35, mode: "set" },
          { label: "45#", val: 45, mode: "set" },
          { label: "50#", val: 50, mode: "set" }
        ];
      } else {
        labelText = "Quick Load";
        chips = [
          { label: "+5", val: 5, mode: "add" },
          { label: "+10", val: 10, mode: "add" },
          { label: "+25", val: 25, mode: "add" },
          { label: "+45", val: 45, mode: "add" }
        ];
      }

      if (labelEl) labelEl.innerText = labelText;

      container.innerHTML = chips.map(c => `
        <button type="button" onclick="triggerHaptic('light'); applyQuickWeightChip(${c.val}, '${c.mode}')" class="px-2.5 py-1 rounded-xl text-[11px] font-black border transition shrink-0 active:scale-95 bg-slate-900/90 text-slate-200 border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-950/30 hover:text-emerald-300">
          ${c.label}
        </button>
      `).join('');
    }

    function applyQuickWeightChip(val, mode) {
      const input = document.getElementById('input-weight');
      if (!input) return;
      let cur = parseFloat(input.value) || 0;
      if (mode === 'set') {
        cur = val;
      } else {
        cur = Math.max(0, Math.round((cur + val) * 10) / 10);
      }
      input.value = cur;
    }

    function toggleWorkoutExtraOptions() {
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      const panel = document.getElementById('workout-extra-options-panel');
      const chevron = document.getElementById('extra-options-chevron');
      if (!panel) return;
      const isHidden = panel.classList.contains('hidden');
      if (isHidden) {
        panel.classList.remove('hidden');
        if (chevron) chevron.classList.add('rotate-180');
      } else {
        panel.classList.add('hidden');
        if (chevron) chevron.classList.remove('rotate-180');
      }
    }

    function updateWorkoutExtraOptionsPreview() {
      const previewEl = document.getElementById('extra-options-preview');
      if (!previewEl) return;
      const implementEl = document.getElementById('implement-select');
      const muscleEl = document.getElementById('muscle-group-select');
      const rpeEl = document.getElementById('rpe-select');
      const imp = implementEl ? implementEl.value : 'Bodyweight';
      const mus = muscleEl ? muscleEl.value : 'Full Body';
      const rpe = rpeEl ? `RPE ${rpeEl.value}` : 'RPE 8';
      previewEl.innerText = `${imp} • ${mus} • ${rpe}`;
    }

    function selectQuickExercise(name) {
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      const input = document.getElementById('exercise-name-input');
      if (input) {
        input.value = name;
        if (typeof handleExerciseInput === 'function') {
          handleExerciseInput(name);
        }
      }
    }

    function adjustWeight(delta) {
      const input = document.getElementById('input-weight');
      let val = parseFloat(input.value) || 0;
      val = Math.max(0, val + delta);
      input.value = val;
    }

    function adjustReps(delta) {
      const input = document.getElementById('input-reps');
      let val = parseInt(input.value) || 0;
      val = Math.max(1, val + delta);
      input.value = val;
    }

    function initTouchScrollerInputs() {
      const scrollers = [
        {
          containerId: 'scroller-weight-container',
          dialId: 'touch-dial-weight',
          inputId: 'input-weight',
          badgeId: 'weight-step-badge',
          min: 0,
          stepDefault: 1,
          type: 'weight'
        },
        {
          containerId: 'scroller-reps-container',
          dialId: 'touch-dial-reps',
          inputId: 'input-reps',
          badgeId: 'reps-step-badge',
          min: 1,
          stepDefault: 1,
          type: 'reps'
        }
      ];

      scrollers.forEach(cfg => {
        setupScrollerController(cfg);
      });
    }

    function setupScrollerController(cfg) {
      if (typeof document === 'undefined') return;
      const container = document.getElementById(cfg.containerId);
      const dial = document.getElementById(cfg.dialId);
      const input = document.getElementById(cfg.inputId);
      const badge = document.getElementById(cfg.badgeId);
      if (!dial || !input) return;

      const ticksEl = dial.querySelector('.dial-ticks-tape') || dial.querySelector('.dial-ticks');
      const badgeLabel = badge ? badge.querySelector('.step-label') : null;
      const badgeDot = badge ? badge.querySelector('.step-dot') : null;

      let isTracking = false;
      let startX = 0;
      let startY = 0;
      let accumulatedDistance = 0;
      let isLongPress = false;
      let longPressTimer = null;
      let progressiveTimer1 = null;
      let progressiveTimer2 = null;
      let currentIncrement = 1;
      const STEP_PIXELS = 16;

      function updateBadgeUI() {
        if (!badge) return;
        if (!isLongPress) {
          badge.className = "step-mode-badge text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-slate-700 bg-slate-950 text-slate-400 tracking-wider flex items-center gap-1 transition-all pointer-events-none";
          if (badgeLabel) badgeLabel.innerText = "±1";
          if (badgeDot) badgeDot.className = "w-1.5 h-1.5 rounded-full bg-slate-500 step-dot";
        } else {
          badge.className = `step-mode-badge text-[10px] font-black uppercase px-2 py-0.5 rounded-full border tracking-wider flex items-center gap-1 transition-all pointer-events-none turbo-${currentIncrement}`;
          if (badgeLabel) badgeLabel.innerText = `Turbo ±${currentIncrement}`;
          if (badgeDot) badgeDot.className = "w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping step-dot";
        }
      }

      function applyDelta(direction) {
        let curVal = parseFloat(input.value) || 0;
        const delta = direction * currentIncrement;
        let newVal = curVal + delta;
        if (cfg.type === 'reps') {
          newVal = Math.max(cfg.min, Math.round(newVal));
        } else {
          newVal = Math.max(cfg.min, Math.round(newVal * 10) / 10);
        }
        input.value = newVal;

        if (typeof Event === 'function') {
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }

        if (typeof triggerHaptic === 'function') {
          if (currentIncrement >= 5) {
            triggerHaptic('medium');
          } else {
            triggerHaptic('light');
          }
        }
      }

      function startTracking(clientX, clientY) {
        isTracking = true;
        startX = clientX;
        startY = clientY;
        accumulatedDistance = 0;
        isLongPress = false;
        currentIncrement = 1;

        if (container) container.classList.add('scroller-active');
        dial.classList.add('dial-dragging');
        updateBadgeUI();

        // Long press trigger (320ms): switches to 2s
        longPressTimer = setTimeout(() => {
          if (!isTracking) return;
          isLongPress = true;
          currentIncrement = 2;
          if (container) container.classList.add('scroller-turbo');
          dial.classList.add('dial-turbo');
          updateBadgeUI();
          if (typeof triggerHaptic === 'function') triggerHaptic('medium');

          // Progressive escalation 1 (770ms total): switches to 5s
          progressiveTimer1 = setTimeout(() => {
            if (!isTracking || !isLongPress) return;
            currentIncrement = 5;
            updateBadgeUI();
            if (typeof triggerHaptic === 'function') triggerHaptic('light');

            // Progressive escalation 2 (1270ms total): switches to 10s
            progressiveTimer2 = setTimeout(() => {
              if (!isTracking || !isLongPress) return;
              currentIncrement = 10;
              updateBadgeUI();
              if (typeof triggerHaptic === 'function') triggerHaptic('medium');
            }, 500);
          }, 450);
        }, 320);
      }

      function moveTracking(clientX, clientY) {
        if (!isTracking) return;
        const dx = clientX - startX;
        const dy = startY - clientY; // Moving UP = positive

        const dominantDelta = Math.abs(dy) >= Math.abs(dx) ? dy : dx;
        accumulatedDistance = dominantDelta;

        if (ticksEl && ticksEl.style) {
          const tapeShift = Math.max(-25, Math.min(25, (dx || dy) * 0.4));
          ticksEl.style.transform = `translateX(${tapeShift}px)`;
        }

        if (Math.abs(accumulatedDistance) >= STEP_PIXELS) {
          const direction = accumulatedDistance > 0 ? 1 : -1;
          applyDelta(direction);

          startX = clientX;
          startY = clientY;
          accumulatedDistance = 0;
        }
      }

      function stopTracking() {
        if (!isTracking) return;
        isTracking = false;
        clearTimeout(longPressTimer);
        clearTimeout(progressiveTimer1);
        clearTimeout(progressiveTimer2);
        longPressTimer = null;
        progressiveTimer1 = null;
        progressiveTimer2 = null;

        isLongPress = false;
        currentIncrement = 1;
        if (container) {
          container.classList.remove('scroller-active', 'scroller-turbo');
        }
        dial.classList.remove('dial-dragging', 'dial-turbo');
        if (ticksEl && ticksEl.style) {
          ticksEl.style.transform = 'translateX(0px)';
        }
        updateBadgeUI();
      }

      // Touch Events on Dial
      dial.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length > 0) {
          const touch = e.touches[0];
          startTracking(touch.clientX, touch.clientY);
        }
      }, { passive: true });

      dial.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches.length > 0) {
          const touch = e.touches[0];
          moveTracking(touch.clientX, touch.clientY);
        }
      }, { passive: true });

      dial.addEventListener('touchend', stopTracking, { passive: true });
      dial.addEventListener('touchcancel', stopTracking, { passive: true });

      // Pointer / Mouse Drag Events on Dial
      dial.addEventListener('pointerdown', (e) => {
        if (dial.setPointerCapture) {
          try { dial.setPointerCapture(e.pointerId); } catch (_) {}
        }
        startTracking(e.clientX, e.clientY);
      });

      dial.addEventListener('pointermove', (e) => {
        moveTracking(e.clientX, e.clientY);
      });

      dial.addEventListener('pointerup', (e) => {
        if (dial.releasePointerCapture) {
          try { dial.releasePointerCapture(e.pointerId); } catch (_) {}
        }
        stopTracking();
      });

      dial.addEventListener('pointercancel', (e) => {
        if (dial.releasePointerCapture) {
          try { dial.releasePointerCapture(e.pointerId); } catch (_) {}
        }
        stopTracking();
      });

      // Mouse Wheel on Dial
      dial.addEventListener('wheel', (e) => {
        if (e.preventDefault) e.preventDefault();
        const dir = e.deltaY < 0 ? 1 : -1;
        currentIncrement = (e.shiftKey || e.altKey) ? 5 : 1;
        applyDelta(dir);
        currentIncrement = 1;
      }, { passive: false });

      // Mouse Wheel on Input
      input.addEventListener('wheel', (e) => {
        if (e.preventDefault) e.preventDefault();
        const dir = e.deltaY < 0 ? 1 : -1;
        currentIncrement = (e.shiftKey || e.altKey) ? 5 : 1;
        applyDelta(dir);
        currentIncrement = 1;
      }, { passive: false });
    }

    function adjustErgDistance(delta) {
      const input = document.getElementById('input-erg-distance');
      let val = parseInt(input.value) || 0;
      val = Math.max(50, val + delta);
      input.value = val;
    }

    function adjustErgTime(deltaSec) {
      const input = document.getElementById('input-erg-time');
      const parts = (input.value || "02:00").split(':');
      let totalSec = (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
      totalSec = Math.max(15, totalSec + deltaSec);

      const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
      const secs = String(totalSec % 60).padStart(2, '0');
      input.value = `${mins}:${secs}`;
    }

    function adjustSwimDistance(delta) {
      const input = document.getElementById('input-swim-distance');
      let val = parseInt(input.value) || 0;
      val = Math.max(25, val + delta);
      input.value = val;
    }

    function adjustSwimTime(deltaSec) {
      const input = document.getElementById('input-swim-time');
      const parts = (input.value || "10:00").split(':');
      let totalSec = (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
      totalSec = Math.max(15, totalSec + deltaSec);

      const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
      const secs = String(totalSec % 60).padStart(2, '0');
      input.value = `${mins}:${secs}`;
    }

    function adjustEnduranceDistance(delta) {
      const input = document.getElementById('input-endurance-distance');
      let val = parseFloat(input.value) || 0;
      val = Math.max(0.1, val + delta);
      input.value = val.toFixed(1);
    }

    function adjustEnduranceTime(deltaSec) {
      const input = document.getElementById('input-endurance-time');
      const parts = (input.value || "00:30:00").split(':');
      let totalSec = 0;
      if (parts.length === 3) {
        totalSec = (parseInt(parts[0]) || 0) * 3600 + (parseInt(parts[1]) || 0) * 60 + (parseInt(parts[2]) || 0);
      } else if (parts.length === 2) {
        totalSec = (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
      }
      totalSec = Math.max(60, totalSec + deltaSec);

      const hrs = String(Math.floor(totalSec / 3600)).padStart(2, '0');
      const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
      const secs = String(totalSec % 60).padStart(2, '0');
      input.value = `${hrs}:${mins}:${secs}`;
    }

    function adjustRunningDistance(delta) {
      const input = document.getElementById('input-running-distance');
      if (!input) return;
      let val = parseFloat(input.value) || 0;
      val = Math.max(0.1, Math.round((val + delta) * 100) / 100);
      input.value = val.toFixed(2).replace(/\.00$/, '.0').replace(/(\.[1-9])0$/, '$1');
    }

    function adjustRunningTime(deltaSec) {
      const input = document.getElementById('input-running-time');
      if (!input) return;
      const parts = (input.value || "00:25:00").split(':');
      let totalSec = 0;
      if (parts.length === 3) {
        totalSec = (parseInt(parts[0]) || 0) * 3600 + (parseInt(parts[1]) || 0) * 60 + (parseInt(parts[2]) || 0);
      } else if (parts.length === 2) {
        totalSec = (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
      }
      totalSec = Math.max(30, totalSec + deltaSec);
      const hrs = String(Math.floor(totalSec / 3600)).padStart(2, '0');
      const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
      const secs = String(totalSec % 60).padStart(2, '0');
      input.value = `${hrs}:${mins}:${secs}`;
    }

    function adjustRunningAvgHR(delta) {
      const input = document.getElementById('input-running-avg-hr');
      if (!input) return;
      let val = parseInt(input.value) || (typeof currentHR === 'number' && currentHR > 0 ? currentHR : 145);
      val = Math.max(40, Math.min(240, val + delta));
      input.value = val;
      input.dataset.autoCaptured = 'false';
      const avgSource = document.getElementById('running-avg-hr-source');
      if (avgSource) avgSource.innerText = "Manual";
    }

    function adjustRunningMaxHR(delta) {
      const input = document.getElementById('input-running-max-hr');
      if (!input) return;
      let val = parseInt(input.value) || (typeof currentHR === 'number' && currentHR > 0 ? currentHR : 165);
      val = Math.max(40, Math.min(240, val + delta));
      input.value = val;
      input.dataset.autoCaptured = 'false';
      const maxSource = document.getElementById('running-max-hr-source');
      if (maxSource) maxSource.innerText = "Manual";
    }

    function updateRunningHRMUI() {
      const statusInfo = document.getElementById('running-hrm-status-info');
      const connectBtn = document.getElementById('running-hrm-connect-btn');
      const avgSource = document.getElementById('running-avg-hr-source');
      const maxSource = document.getElementById('running-max-hr-source');
      const avgInput = document.getElementById('input-running-avg-hr');
      const maxInput = document.getElementById('input-running-max-hr');

      const isConnected = typeof isHRMConnected === 'function' ? isHRMConnected() : false;
      if (isConnected) {
        const liveBpm = typeof currentHR === 'number' && currentHR > 0 ? currentHR : 145;
        const samples = (window.runningHRSamples && window.runningHRSamples.length > 0) ? window.runningHRSamples : [liveBpm];
        const avgBpm = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
        const maxBpm = Math.max(...samples);

        if (avgInput) {
          avgInput.value = avgBpm;
        }
        if (maxInput) {
          maxInput.value = maxBpm;
        }

        if (avgSource) avgSource.innerHTML = `<span class="text-emerald-400 font-bold flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>HRM</span>`;
        if (maxSource) maxSource.innerHTML = `<span class="text-emerald-400 font-bold flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>HRM</span>`;

        if (statusInfo) {
          statusInfo.innerHTML = `
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
            <i class="fa-solid fa-heart-pulse text-rose-500 animate-pulse"></i>
            <span class="text-emerald-400 font-semibold">HRM Connected</span>
            <span class="text-slate-400 font-mono">(${liveBpm} BPM | Avg ${avgBpm} | Max ${maxBpm})</span>
          `;
        }
        if (connectBtn) {
          connectBtn.innerText = "HRM Settings";
          connectBtn.className = "text-emerald-400 hover:text-emerald-300 font-bold underline text-[10px]";
        }
      } else {
        if (avgSource) avgSource.innerText = "Manual";
        if (maxSource) maxSource.innerText = "Manual";
        if (statusInfo) {
          statusInfo.innerHTML = `
            <i class="fa-solid fa-bluetooth text-slate-500"></i>
            <span>No HRM Connected (Manual HR inputs active)</span>
          `;
        }
        if (connectBtn) {
          connectBtn.innerText = "Connect HRM";
          connectBtn.className = "text-rose-400 hover:text-rose-300 font-bold underline text-[10px]";
        }
      }
    }

    // ================= TIMER ENGINE: WORKOUT, SET & REST TIMERS =================

    function formatTimerHMS(totalSeconds) {
      const s = Math.max(0, Math.floor(totalSeconds || 0));
      const hrs = String(Math.floor(s / 3600)).padStart(2, '0');
      const mins = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      const secs = String(s % 60).padStart(2, '0');
      return `${hrs}:${mins}:${secs}`;
    }

    function formatDurationSecs(totalSeconds) {
      const s = Math.max(0, Math.floor(totalSeconds || 0));
      const mins = Math.floor(s / 60);
      const secs = s % 60;
      if (mins === 0) return `${secs}s`;
      return `${mins}m ${secs}s`;
    }

    // 1. WORKOUT SESSION TIMER: START, PAUSE & RESTART
    function startWorkoutTimer() {
      if (workoutTimerState === 'running') return;
      workoutTimerStartTimestamp = Date.now() - (workoutTimerSeconds * 1000);
      workoutTimerState = 'running';
      if (workoutTimerInterval) clearInterval(workoutTimerInterval);
      workoutTimerInterval = setInterval(tickWorkoutTimer, 1000);
      saveWorkoutTimerState();
      updateWorkoutTimerUI();
    }

    function pauseWorkoutTimer() {
      if (workoutTimerState !== 'running') return;
      if (workoutTimerInterval) clearInterval(workoutTimerInterval);
      workoutTimerInterval = null;
      workoutTimerState = 'paused';
      saveWorkoutTimerState();
      updateWorkoutTimerUI();
    }

    function restartWorkoutTimer() {
      if (workoutTimerInterval) clearInterval(workoutTimerInterval);
      workoutTimerInterval = null;
      workoutTimerSeconds = 0;
      workoutTimerStartTimestamp = Date.now();
      workoutTimerState = 'running';
      workoutTimerInterval = setInterval(tickWorkoutTimer, 1000);
      saveWorkoutTimerState();
      updateWorkoutTimerUI();
      if (typeof showToast === 'function') {
        showToast("Session timer restarted at 00:00:00", "info");
      }
    }

    function toggleWorkoutTimer() {
      if (workoutTimerState === 'running') {
        pauseWorkoutTimer();
      } else {
        startWorkoutTimer();
      }
    }

    function tickWorkoutTimer() {
      if (!workoutTimerStartTimestamp || workoutTimerState !== 'running') return;
      workoutTimerSeconds = Math.max(0, Math.floor((Date.now() - workoutTimerStartTimestamp) / 1000));
      updateWorkoutTimerUI();
    }

    function updateWorkoutTimerUI() {
      const timerEl = document.getElementById('session-timer');
      const toggleBtn = document.getElementById('session-timer-toggle-btn');
      const iconEl = document.getElementById('session-timer-icon');
      const pulseEl = document.getElementById('session-timer-pulse');

      if (timerEl) {
        timerEl.innerText = formatTimerHMS(workoutTimerSeconds);
      }

      if (iconEl && toggleBtn) {
        if (workoutTimerState === 'running') {
          iconEl.className = "fa-solid fa-pause text-amber-400 text-xs";
          toggleBtn.title = "Pause Session Timer";
          toggleBtn.className = "px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 flex items-center justify-center text-xs font-black gap-2 transition active:scale-95 border border-amber-500/30 shadow";
          if (pulseEl) pulseEl.className = "w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping inline-block";
        } else if (workoutTimerState === 'paused') {
          iconEl.className = "fa-solid fa-play text-emerald-400 text-xs";
          toggleBtn.title = "Resume Session Timer";
          toggleBtn.className = "px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 flex items-center justify-center text-xs font-black gap-2 transition active:scale-95 border border-emerald-500/30 shadow";
          if (pulseEl) pulseEl.className = "w-3.5 h-3.5 rounded-full bg-amber-400 inline-block";
        } else {
          iconEl.className = "fa-solid fa-play text-slate-200 text-xs";
          toggleBtn.title = "Start Session Timer";
          toggleBtn.className = "px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-black gap-2 transition active:scale-95 border border-slate-700 shadow";
          if (pulseEl) pulseEl.className = "w-3.5 h-3.5 rounded-full bg-slate-600 inline-block";
        }
      }
    }

    function saveWorkoutTimerState() {
      try {
        localStorage.setItem('showUp_session_timer', JSON.stringify({
          seconds: workoutTimerSeconds,
          state: workoutTimerState,
          timestamp: Date.now()
        }));
      } catch (e) {}
    }

    function restoreWorkoutTimerState() {
      try {
        const raw = localStorage.getItem('showUp_session_timer');
        if (raw) {
          const data = JSON.parse(raw);
          if (data && typeof data.seconds === 'number') {
            if (data.state === 'running' && data.timestamp) {
              const deltaSec = Math.floor((Date.now() - data.timestamp) / 1000);
              workoutTimerSeconds = data.seconds + Math.max(0, deltaSec);
              startWorkoutTimer();
            } else {
              workoutTimerSeconds = data.seconds;
              workoutTimerState = data.state || 'stopped';
              updateWorkoutTimerUI();
            }
          }
        }
      } catch (e) {}
    }

    // 2. SET & REST TIMERS: START SET, LOG SET, REST TRACKING
    function startSet() {
      if (typeof triggerHaptic === 'function') triggerHaptic('medium');

      // Requirement 3: When a second set is started the rest timer shall stop and get recorded
      // as the rest period between the prior set and the newly started set.
      if (isRestTimerRunning) {
        const elapsedRest = Math.max(1, Math.floor((Date.now() - (restTimerStartTime || Date.now())) / 1000));
        currentPendingRestPeriod = elapsedRest;
        stopRestTimer();
        if (typeof showToast === 'function') {
          showToast(`Rest recorded: ${formatDurationSecs(currentPendingRestPeriod)}. Starting set!`, "info");
        }
      }

      // Auto-start session timer if not active
      if (workoutTimerState === 'stopped') {
        startWorkoutTimer();
      }

      isSetInProgress = true;
      activeSetStartTime = Date.now();
      activeSetElapsedSeconds = 0;

      if (activeSetTimerInterval) clearInterval(activeSetTimerInterval);
      activeSetTimerInterval = setInterval(tickActiveSet, 1000);

      updateSetControlsUI();
    }

    function tickActiveSet() {
      if (!activeSetStartTime || !isSetInProgress) return;
      activeSetElapsedSeconds = Math.max(0, Math.floor((Date.now() - activeSetStartTime) / 1000));
      const nextSetNum = currentSessionSets.length + 1;
      const label = document.getElementById('btn-start-set-label');
      if (label) {
        label.innerText = `Set ${nextSetNum} in Progress (${formatDurationSecs(activeSetElapsedSeconds)})`;
      }
    }

    function saveRestTimerState() {
      try {
        if (isRestTimerRunning && restTimerStartTime) {
          localStorage.setItem('showUp_rest_timer_data', JSON.stringify({
            running: true,
            startTime: restTimerStartTime
          }));
        } else {
          localStorage.removeItem('showUp_rest_timer_data');
        }
      } catch (e) {}
    }

    function restoreRestTimerState() {
      try {
        const raw = localStorage.getItem('showUp_rest_timer_data');
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data && data.running && data.startTime) {
          const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
          // Restore if started within the last 30 minutes (1800s)
          if (elapsed >= 0 && elapsed < 1800) {
            restTimerStartTime = data.startTime;
            restTimerSeconds = elapsed;
            isRestTimerRunning = true;
            if (restTimerInterval) clearInterval(restTimerInterval);
            restTimerInterval = setInterval(tickRestTimer, 1000);
            updateRestTimerUI();
            updateSetControlsUI();
          } else {
            localStorage.removeItem('showUp_rest_timer_data');
          }
        }
      } catch (e) {}
    }

    function startRestTimer(initialSeconds = 0) {
      if (restTimerInterval) clearInterval(restTimerInterval);
      isRestTimerRunning = true;
      restTimerSeconds = initialSeconds;
      restTimerStartTime = Date.now() - (initialSeconds * 1000);
      saveRestTimerState();
      restTimerInterval = setInterval(tickRestTimer, 1000);
      updateRestTimerUI();
      updateSetControlsUI();
    }

    function stopRestTimer() {
      if (restTimerInterval) clearInterval(restTimerInterval);
      restTimerInterval = null;
      isRestTimerRunning = false;
      restTimerStartTime = null;
      restTimerSeconds = 0;
      saveRestTimerState();
      updateRestTimerUI();
      updateSetControlsUI();
    }

    function tickRestTimer() {
      if (!restTimerStartTime || !isRestTimerRunning) return;
      restTimerSeconds = Math.max(0, Math.floor((Date.now() - restTimerStartTime) / 1000));
      updateRestTimerUI();
    }

    function adjustRestTimer(deltaSecs) {
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      if (isRestTimerRunning && restTimerStartTime) {
        restTimerStartTime -= (deltaSecs * 1000);
        saveRestTimerState();
        tickRestTimer();
      }
    }

    function skipRestTimer() {
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      if (isRestTimerRunning) {
        currentPendingRestPeriod = Math.max(1, Math.floor((Date.now() - (restTimerStartTime || Date.now())) / 1000));
        stopRestTimer();
        if (typeof showToast === 'function') {
          showToast(`Rest period skipped (${formatDurationSecs(currentPendingRestPeriod)} recorded).`, "info");
        }
      }
    }

    function getDefaultRestTimeSeconds() {
      const saved = localStorage.getItem('showUp_default_rest_time');
      return saved ? parseInt(saved, 10) : 90;
    }

    function saveDefaultRestTimePref(val) {
      const seconds = parseInt(val, 10) || 90;
      localStorage.setItem('showUp_default_rest_time', seconds);
      if (typeof showToast === 'function') {
        showToast(`Default rest target set to ${seconds}s`, "info");
      }
      if (isRestTimerRunning) {
        updateRestTimerUI();
      }
    }

    function updateRestTimerUI() {
      const banner = document.getElementById('rest-timer-banner');
      const valEl = document.getElementById('rest-timer-val');
      const captionEl = document.getElementById('rest-timer-caption');
      const badgeEl = document.getElementById('rest-timer-status-badge');

      if (!banner) return;

      if (isRestTimerRunning) {
        const wasHidden = banner.classList.contains('hidden');
        banner.classList.remove('hidden');
        if (wasHidden && typeof banner.scrollIntoView === 'function') {
          try {
            banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          } catch (e) {}
        }
        if (valEl) valEl.innerText = formatDurationSecs(restTimerSeconds);
        const setNum = currentSessionSets.length;
        const nextNum = setNum + 1;
        const targetRest = getDefaultRestTimeSeconds();

        if (restTimerSeconds >= targetRest) {
          if (badgeEl) {
            badgeEl.className = "text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 uppercase tracking-wider animate-bounce";
            badgeEl.innerText = "Ready to Lift!";
          }
          if (captionEl) {
            captionEl.innerHTML = `<span class="text-emerald-300 font-bold">Target recovery reached (${targetRest}s).</span> Tap "Start Set ${nextNum}" to lift!`;
          }
          banner.classList.add('border-emerald-400', 'shadow-emerald-500/30');
        } else {
          if (badgeEl) {
            badgeEl.className = "text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider";
            badgeEl.innerText = `Resting (${targetRest}s target)`;
          }
          if (captionEl) {
            captionEl.innerText = `Resting after Set ${setNum}... (${restTimerSeconds}s / ${targetRest}s target) Tap "Start Set ${nextNum}" when ready.`;
          }
          banner.classList.remove('border-emerald-400', 'shadow-emerald-500/30');
        }
      } else {
        banner.classList.add('hidden');
      }
    }

    function updateSetControlsUI() {
      const startBtn = document.getElementById('btn-start-set');
      const startLabel = document.getElementById('btn-start-set-label');
      const startIcon = document.getElementById('btn-start-set-icon');
      const logLabel = document.getElementById('btn-log-set-label');
      const nextSetNum = currentSessionSets.length + 1;

      if (logLabel) {
        logLabel.innerText = `Log Set ${nextSetNum}`;
      }

      if (startBtn && startLabel && startIcon) {
        if (isSetInProgress) {
          startBtn.className = "font-black py-4 px-6 rounded-2xl shadow-xl border-2 border-amber-500/50 bg-amber-500/20 text-amber-300 text-base sm:text-lg active:scale-[0.98] transition flex items-center justify-center gap-3 animate-pulse";
          startIcon.className = "fa-solid fa-stopwatch text-amber-400 text-lg";
          startLabel.innerText = `Set ${nextSetNum} in Progress (${formatDurationSecs(activeSetElapsedSeconds)})`;
        } else if (isRestTimerRunning) {
          startBtn.className = "font-black py-4 px-6 rounded-2xl shadow-xl border-2 border-emerald-500 bg-emerald-500 text-slate-950 hover:bg-emerald-400 text-base sm:text-lg active:scale-[0.98] transition flex items-center justify-center gap-3 shadow-emerald-500/25";
          startIcon.className = "fa-solid fa-play text-slate-950 text-lg";
          startLabel.innerText = `Start Set ${nextSetNum} (End Rest)`;
        } else {
          startBtn.className = "font-black py-4 px-6 rounded-2xl shadow-xl border-2 border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-base sm:text-lg active:scale-[0.98] transition flex items-center justify-center gap-3";
          startIcon.className = "fa-solid fa-play text-lg";
          startLabel.innerText = `Start Set ${nextSetNum}`;
        }
      }
    }

    function logSet() {
      const exerciseInput = document.getElementById('exercise-name-input');
      const exerciseName = (exerciseInput ? exerciseInput.value.trim() : '') || "Custom Exercise";
      const implementEl = document.getElementById('implement-select');
      let implement = implementEl ? implementEl.value : 'Bodyweight';
      const muscleEl = document.getElementById('muscle-group-select');
      let muscle = muscleEl ? muscleEl.value : 'Full Body';
      const rpeEl = document.getElementById('rpe-select');
      const rpe = rpeEl ? (parseFloat(rpeEl.value) || 8) : 8;

      let weight = 0, reps = 1, ergDistance = 0, ergTime = "";
      let swimDistance = 0, swimTime = "";
      let enduranceDistance = 0, enduranceTime = "";
      let runningDistance = 0, runningTime = "", runningAvgHR = null, runningMaxHR = null;

      if (implement === "Running") {
        runningDistance = parseFloat(document.getElementById('input-running-distance')?.value) || 1.0;
        runningTime = document.getElementById('input-running-time')?.value || "00:25:00";
        const parsedAvg = parseInt(document.getElementById('input-running-avg-hr')?.value);
        const parsedMax = parseInt(document.getElementById('input-running-max-hr')?.value);
        runningAvgHR = !isNaN(parsedAvg) ? parsedAvg : (typeof currentHR === 'number' && currentHR > 0 ? currentHR : null);
        runningMaxHR = !isNaN(parsedMax) ? parsedMax : (typeof currentHR === 'number' && currentHR > 0 ? currentHR : null);
      } else if (implement === "Row Erg") {
        ergDistance = parseInt(document.getElementById('input-erg-distance')?.value) || 500;
        ergTime = document.getElementById('input-erg-time')?.value || "02:00";
      } else if (implement === "Swimming") {
        swimDistance = parseInt(document.getElementById('input-swim-distance')?.value) || 500;
        swimTime = document.getElementById('input-swim-time')?.value || "10:00";
      } else if (["Walking", "Hiking", "Biking"].includes(implement)) {
        enduranceDistance = parseFloat(document.getElementById('input-endurance-distance')?.value) || 1.0;
        enduranceTime = document.getElementById('input-endurance-time')?.value || "00:30:00";
      } else {
        weight = parseFloat(document.getElementById('input-weight')?.value) || 0;
        reps = parseInt(document.getElementById('input-reps')?.value) || 1;
      }

      // Calculate set active duration if Start Set was used
      let setDuration = 0;
      if (isSetInProgress && activeSetStartTime) {
        setDuration = Math.max(1, Math.floor((Date.now() - activeSetStartTime) / 1000));
      }

      // If user logged set directly while resting without tapping Start Set
      if (isRestTimerRunning) {
        currentPendingRestPeriod = Math.max(1, Math.floor((Date.now() - (restTimerStartTime || Date.now())) / 1000));
        stopRestTimer();
      }

      const restPeriod = currentPendingRestPeriod || 0;
      currentPendingRestPeriod = 0;

      // Reset active set status
      isSetInProgress = false;
      activeSetStartTime = null;
      activeSetElapsedSeconds = 0;
      if (activeSetTimerInterval) clearInterval(activeSetTimerInterval);
      activeSetTimerInterval = null;

      // Establish primary and secondary muscles and inferred implement automatically with high accuracy
      let secondaryMuscles = [];
      if (typeof resolveExerciseMuscles === 'function') {
        const profile = resolveExerciseMuscles(exerciseName, implement);
        if (profile) {
          // Implement input is optional; automatically infer from exercise name as applicable
          if (profile.implement && (implement === 'Bodyweight' || !implement || profile.inferred)) {
            implement = profile.implement;
            if (implementEl) implementEl.value = implement;
          }
          if (!muscle || muscle === 'Full Body' || (muscleEl && muscleEl.value === 'Full Body' && profile.primary !== 'Full Body')) {
            muscle = profile.primary;
          }
          secondaryMuscles = profile.secondary || [];
        }
      } else {
        const catalogMatch = defaultCatalog.find(c => c.name.toLowerCase() === exerciseName.toLowerCase());
        secondaryMuscles = catalogMatch && catalogMatch.secondary ? catalogMatch.secondary : [];
        if (catalogMatch && catalogMatch.implement) implement = catalogMatch.implement;
      }

      const setObj = {
        id: Date.now(),
        exerciseName,
        implement,
        muscle,
        secondaryMuscles,
        rpe,
        weight,
        reps,
        runningDistance,
        runningTime,
        runningAvgHR,
        runningMaxHR,
        ergDistance,
        ergTime,
        swimDistance,
        swimTime,
        enduranceDistance,
        enduranceTime,
        hr: currentHR,
        setDuration,
        restPeriod
      };

      currentSessionSets.push(setObj);
      try {
        localStorage.setItem('showUp_active_workout_sets', JSON.stringify(currentSessionSets));
      } catch (e) {}

      try {
        renderLoggedSets();
      } catch (err) {
        console.warn('Error rendering logged sets:', err);
      }

      try {
        broadcastUserWorkoutStarted(exerciseName);
      } catch (e) {}

      try {
        if (googleAccessToken) {
          syncToGoogleDrive();
        }
      } catch (e) {}

      try {
        if (workoutTimerState === 'stopped') {
          startWorkoutTimer();
        }
      } catch (e) {}

      try {
        if (typeof triggerHaptic === 'function') triggerHaptic('heavy');
      } catch (e) {}

      try {
        if (typeof playUnobtrusiveChime === 'function') {
          playUnobtrusiveChime();
        }
      } catch (e) {}

      // Requirement 2: Once a set is logged, a rest timer shall start reliably.
      try {
        startRestTimer();
        updateSetControlsUI();
      } catch (err) {
        console.error('Error starting rest timer:', err);
      }
    }

    function isAthleteAuthenticated() {
      if (typeof isCustomerLoggedIn === 'function' && isCustomerLoggedIn()) return true;
      if (typeof googleAccessToken !== 'undefined' && googleAccessToken) return true;
      return false;
    }

    function isFirstSetLoginPromptDismissed() {
      try {
        return sessionStorage.getItem('showUp_first_set_login_prompt_dismissed') === 'true';
      } catch (e) {
        return false;
      }
    }

    function dismissFirstSetLoginPrompt() {
      try {
        sessionStorage.setItem('showUp_first_set_login_prompt_dismissed', 'true');
      } catch (e) {}
      const el = document.getElementById('first-set-login-prompt');
      if (el) {
        el.style.transition = 'opacity 0.2s ease, max-height 0.25s ease';
        el.style.opacity = '0';
        el.style.maxHeight = '0px';
        el.style.overflow = 'hidden';
        setTimeout(() => {
          if (el && el.parentNode) el.parentNode.removeChild(el);
        }, 250);
      }
    }

    function renderLoggedSets() {
      const container = document.getElementById('logged-sets-list');
      const badge = document.getElementById('set-count-badge');
      if (badge) badge.innerText = `${currentSessionSets.length} Sets`;

      if (!container) return;

      if (currentSessionSets.length === 0) {
        container.innerHTML = `<div class="text-center py-8 text-slate-500 text-xs sm:text-sm italic font-medium">No sets logged for this session yet. Pick an exercise above and hit "Log Set".</div>`;
        updateSetControlsUI();
        return;
      }

      // Descending order: latest to oldest sets
      const reversedSets = [...currentSessionSets].reverse();
      let html = '';
      reversedSets.forEach((s, revIdx) => {
        const setNumber = currentSessionSets.length - revIdx;
        const isLatest = revIdx === 0;

        html += `
          <div class="bg-slate-950 p-3.5 sm:p-4 rounded-2xl border ${isLatest ? 'border-emerald-500/50 bg-emerald-950/20 shadow-emerald-500/10' : 'border-slate-800'} shadow-md flex items-center justify-between gap-3 transition-all">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-black uppercase ${isLatest ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-500/40' : 'text-slate-400 bg-slate-900 border border-slate-800'} px-2.5 py-0.5 rounded-lg">Set #${setNumber}</span>
                ${isLatest ? '<span class="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded">Latest Set</span>' : ''}
                <div class="text-sm sm:text-base font-black text-slate-100 truncate">${s.exerciseName}</div>
              </div>

              <div class="text-xs text-slate-300 gap-2 flex items-center flex-wrap mt-1.5">
                <span class="bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-lg font-bold">${s.implement}</span>
                ${s.implement === "Running" ? `<span class="font-bold text-slate-200">${s.runningDistance} mi | ${s.runningTime}${s.runningAvgHR ? ` | HR: ${s.runningAvgHR} avg` + (s.runningMaxHR ? ` / ${s.runningMaxHR} max` : '') : ''}</span>` :
                  s.implement === "Row Erg" ? `<span class="font-bold text-slate-200">${s.ergDistance}m | ${s.ergTime}</span>` :
                  s.implement === "Swimming" ? `<span class="font-bold text-slate-200">${s.swimDistance} yds | ${s.swimTime}</span>` :
                  ["Walking", "Hiking", "Biking"].includes(s.implement) ? `<span class="font-bold text-slate-200">${s.enduranceDistance} mi | ${s.enduranceTime}</span>` :
                  `<span class="font-black text-emerald-300 text-sm">${s.weight} lbs × ${s.reps} reps</span>`}
                <span class="text-slate-400 font-semibold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">RPE ${s.rpe}</span>
                ${s.setDuration ? `<span class="bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-lg font-mono text-[11px]"><i class="fa-regular fa-clock mr-1 text-emerald-500"></i>Set: ${formatDurationSecs(s.setDuration)}</span>` : ''}
                ${s.restPeriod && s.restPeriod > 0 ? `<span class="bg-emerald-950/70 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-lg font-mono text-[11px]"><i class="fa-solid fa-hourglass-half mr-1 text-emerald-400"></i>Rest: ${formatDurationSecs(s.restPeriod)}</span>` : ''}
              </div>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <button onclick="triggerHaptic('medium'); repeatSet(${s.id})" class="text-xs font-black px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 transition active:scale-95 shadow-sm" title="Repeat this set in workout controls">
                <i class="fa-solid fa-arrow-rotate-right text-xs"></i>
                <span class="hidden sm:inline">Repeat</span>
              </button>
              <button onclick="triggerHaptic('light'); openEditActiveSetModal(${s.id})" class="text-slate-400 hover:text-emerald-400 p-2 rounded-xl hover:bg-slate-900 transition" title="Edit Set">
                <i class="fa-solid fa-pen-to-square text-base"></i>
              </button>
              <button onclick="triggerHaptic('light'); deleteSet(${s.id})" class="text-slate-500 hover:text-rose-400 p-2 rounded-xl hover:bg-slate-900 transition" title="Delete Set">
                <i class="fa-solid fa-trash-can text-base"></i>
              </button>
            </div>
          </div>
        `;
      });

      // Contextual prompt: after set 1 is logged, invite guest athlete to save workout & sync
      if (currentSessionSets.length >= 1 && !isAthleteAuthenticated() && !isFirstSetLoginPromptDismissed()) {
        html += `
          <div id="first-set-login-prompt" class="mt-3.5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900/95 to-slate-900 border border-emerald-500/35 shadow-lg shadow-emerald-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-lg shrink-0 shadow-sm">
                <i class="fa-solid fa-cloud-arrow-up"></i>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs sm:text-sm font-black text-slate-100">First set in the books! 🎉</span>
                  <span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Auto-Save</span>
                </div>
                <p class="text-[11px] sm:text-xs text-slate-300/90 mt-0.5">Sign in to save your workout and sync your streaks to the cloud.</p>
              </div>
            </div>
            <div class="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-1 sm:pt-0">
              <button type="button" onclick="triggerHaptic('light'); dismissFirstSetLoginPrompt()" class="text-slate-400 hover:text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-slate-800/80 transition">
                Later
              </button>
              <button type="button" onclick="triggerHaptic('medium'); openAuthLoginModal('signin')" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-md shadow-emerald-500/20 transition active:scale-95 flex items-center gap-1.5">
                <i class="fa-solid fa-right-to-bracket text-xs"></i>
                <span>Sign In to Save</span>
              </button>
            </div>
          </div>
        `;
      }

      container.innerHTML = html;
      updateSetControlsUI();
    }

    function deleteSet(id) {
      currentSessionSets = currentSessionSets.filter(s => s.id !== id);
      localStorage.setItem('showUp_active_workout_sets', JSON.stringify(currentSessionSets));
      renderLoggedSets();
      updateSetControlsUI();

      if (googleAccessToken) {
        syncToGoogleDrive();
      }
    }

    function repeatSet(setId) {
      if (typeof triggerHaptic === 'function') triggerHaptic('medium');
      const set = currentSessionSets.find(s => s.id === setId);
      if (!set) return;

      const exInput = document.getElementById('exercise-name-input');
      const legacyExInput = document.getElementById('input-exercise-name');
      const impSelect = document.getElementById('implement-select');
      const muscleSelect = document.getElementById('muscle-group-select');
      const weightInput = document.getElementById('input-weight');
      const repsInput = document.getElementById('input-reps');
      const rpeSelect = document.getElementById('rpe-select');
      const ergDistInput = document.getElementById('input-erg-distance');
      const ergTimeInput = document.getElementById('input-erg-time');
      const swimDistInput = document.getElementById('input-swim-distance');
      const swimTimeInput = document.getElementById('input-swim-time');
      const endDistInput = document.getElementById('input-endurance-distance');
      const endTimeInput = document.getElementById('input-endurance-time');
      const runDistInput = document.getElementById('input-running-distance');
      const runTimeInput = document.getElementById('input-running-time');
      const runAvgHRInput = document.getElementById('input-running-avg-hr');
      const runMaxHRInput = document.getElementById('input-running-max-hr');

      if (exInput) {
        exInput.value = set.exerciseName || '';
        if (typeof handleExerciseInput === 'function' && set.exerciseName) {
          handleExerciseInput(set.exerciseName);
        }
      }
      if (legacyExInput) {
        legacyExInput.value = set.exerciseName || '';
      }
      if (impSelect && set.implement) {
        impSelect.value = set.implement;
        handleImplementChange(set.implement);
      }
      if (muscleSelect && set.muscle) muscleSelect.value = set.muscle;
      if (weightInput && typeof set.weight === 'number') weightInput.value = set.weight;
      if (repsInput && typeof set.reps === 'number') repsInput.value = set.reps;
      if (rpeSelect && set.rpe) rpeSelect.value = set.rpe;
      if (ergDistInput && set.ergDistance) ergDistInput.value = set.ergDistance;
      if (ergTimeInput && set.ergTime) ergTimeInput.value = set.ergTime;
      if (swimDistInput && set.swimDistance) swimDistInput.value = set.swimDistance;
      if (swimTimeInput && set.swimTime) swimTimeInput.value = set.swimTime;
      if (endDistInput && set.enduranceDistance) endDistInput.value = set.enduranceDistance;
      if (endTimeInput && set.enduranceTime) endTimeInput.value = set.enduranceTime;
      if (runDistInput && set.runningDistance) runDistInput.value = set.runningDistance;
      if (runTimeInput && set.runningTime) runTimeInput.value = set.runningTime;
      if (runAvgHRInput && set.runningAvgHR) runAvgHRInput.value = set.runningAvgHR;
      if (runMaxHRInput && set.runningMaxHR) runMaxHRInput.value = set.runningMaxHR;

      if (typeof updateAutoMuscleIndicator === 'function' && set.exerciseName) {
        updateAutoMuscleIndicator(set.exerciseName);
      }

      const panel = document.getElementById('exercise-selection-container') || document.getElementById('exercise-name-input') || document.getElementById('standard-metrics-panel');
      if (panel && typeof panel.scrollIntoView === 'function') {
        try {
          panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (e) {}
      }

      if (typeof showToast === 'function') {
        showToast(`Loaded ${set.exerciseName} (${set.weight || 0} lbs × ${set.reps || 0}) for next set!`, "success");
      }
    }

    function openEditActiveSetModal(setId) {
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      const set = currentSessionSets.find(s => s.id === setId);
      if (!set) return;

      const setIndex = currentSessionSets.findIndex(s => s.id === setId) + 1;
      const modal = document.getElementById('edit-active-set-modal');
      const idEl = document.getElementById('edit-active-set-id');
      const titleEl = document.getElementById('edit-active-set-title');
      const exEl = document.getElementById('edit-active-set-exercise');
      const impEl = document.getElementById('edit-active-set-implement');
      const musEl = document.getElementById('edit-active-set-muscle');
      const weightEl = document.getElementById('edit-active-set-weight');
      const repsEl = document.getElementById('edit-active-set-reps');
      const ergDistEl = document.getElementById('edit-active-set-erg-distance');
      const ergTimeEl = document.getElementById('edit-active-set-erg-time');
      const swimDistEl = document.getElementById('edit-active-set-swim-distance');
      const swimTimeEl = document.getElementById('edit-active-set-swim-time');
      const endDistEl = document.getElementById('edit-active-set-endurance-distance');
      const endTimeEl = document.getElementById('edit-active-set-endurance-time');
      const runDistEl = document.getElementById('edit-active-set-running-distance');
      const runTimeEl = document.getElementById('edit-active-set-running-time');
      const runAvgHREl = document.getElementById('edit-active-set-running-avg-hr');
      const runMaxHREl = document.getElementById('edit-active-set-running-max-hr');
      const rpeEl = document.getElementById('edit-active-set-rpe');
      const restEl = document.getElementById('edit-active-set-rest');

      if (idEl) idEl.value = set.id;
      if (titleEl) titleEl.innerHTML = `<span>Edit Set #${setIndex}</span>`;
      if (exEl) exEl.value = set.exerciseName || '';
      if (impEl) impEl.value = set.implement || 'Bodyweight';
      if (musEl) musEl.value = set.muscle || 'Full Body';
      if (weightEl) weightEl.value = (typeof set.weight === 'number') ? set.weight : 0;
      if (repsEl) repsEl.value = (typeof set.reps === 'number') ? set.reps : 10;
      if (ergDistEl) ergDistEl.value = set.ergDistance || 500;
      if (ergTimeEl) ergTimeEl.value = set.ergTime || '02:00';
      if (swimDistEl) swimDistEl.value = set.swimDistance || 500;
      if (swimTimeEl) swimTimeEl.value = set.swimTime || '10:00';
      if (endDistEl) endDistEl.value = (typeof set.enduranceDistance === 'number') ? set.enduranceDistance : 2.5;
      if (endTimeEl) endTimeEl.value = set.enduranceTime || '00:30:00';
      if (runDistEl) runDistEl.value = (typeof set.runningDistance === 'number') ? set.runningDistance : 3.1;
      if (runTimeEl) runTimeEl.value = set.runningTime || '00:25:00';
      if (runAvgHREl) runAvgHREl.value = set.runningAvgHR !== null && set.runningAvgHR !== undefined ? set.runningAvgHR : '';
      if (runMaxHREl) runMaxHREl.value = set.runningMaxHR !== null && set.runningMaxHR !== undefined ? set.runningMaxHR : '';
      if (rpeEl) rpeEl.value = set.rpe || 8;
      if (restEl) restEl.value = (typeof set.restPeriod === 'number') ? set.restPeriod : 0;

      handleEditActiveSetImplementChange(set.implement || 'Bodyweight');
      if (modal) modal.classList.remove('hidden');
    }

    function closeEditActiveSetModal() {
      const modal = document.getElementById('edit-active-set-modal');
      if (modal) modal.classList.add('hidden');
    }

    function handleEditActiveSetExerciseInput(val) {
      const inputEl = document.getElementById('edit-active-set-exercise');
      if (inputEl) {
        scrollExerciseInputIntoView(inputEl);
        updateExerciseSuggestions(val, 'edit-active-set-exercise', 'edit-exercise-suggestions-dropdown');
      }
      if (!val) return;
      if (typeof resolveExerciseMuscles === 'function') {
        const profile = resolveExerciseMuscles(val);
        const impEl = document.getElementById('edit-active-set-implement');
        const musEl = document.getElementById('edit-active-set-muscle');
        if (profile) {
          if (impEl && profile.implement) {
            impEl.value = profile.implement;
            handleEditActiveSetImplementChange(profile.implement);
          }
          if (musEl && profile.primary) {
            musEl.value = profile.primary;
          }
        }
      }
    }

    function handleEditActiveSetImplementChange(implement) {
      const stdPanel = document.getElementById('edit-active-set-standard-panel');
      const ergPanel = document.getElementById('edit-active-set-erg-panel');
      const swimPanel = document.getElementById('edit-active-set-swim-panel');
      const endPanel = document.getElementById('edit-active-set-endurance-panel');
      const runPanel = document.getElementById('edit-active-set-running-panel');

      if (stdPanel) stdPanel.classList.add('hidden');
      if (ergPanel) ergPanel.classList.add('hidden');
      if (swimPanel) swimPanel.classList.add('hidden');
      if (endPanel) endPanel.classList.add('hidden');
      if (runPanel) runPanel.classList.add('hidden');

      if (implement === "Running") {
        if (runPanel) runPanel.classList.remove('hidden');
      } else if (implement === "Row Erg") {
        if (ergPanel) ergPanel.classList.remove('hidden');
      } else if (implement === "Swimming") {
        if (swimPanel) swimPanel.classList.remove('hidden');
      } else if (["Walking", "Hiking", "Biking"].includes(implement)) {
        if (endPanel) endPanel.classList.remove('hidden');
      } else {
        if (stdPanel) stdPanel.classList.remove('hidden');
      }
    }

    function adjustEditActiveSetWeight(delta) {
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      const el = document.getElementById('edit-active-set-weight');
      if (!el) return;
      const current = parseFloat(el.value) || 0;
      el.value = Math.max(0, parseFloat((current + delta).toFixed(1)));
    }

    function adjustEditActiveSetReps(delta) {
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      const el = document.getElementById('edit-active-set-reps');
      if (!el) return;
      const current = parseInt(el.value) || 0;
      el.value = Math.max(1, current + delta);
    }

    function adjustEditActiveSetRest(delta) {
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      const el = document.getElementById('edit-active-set-rest');
      if (!el) return;
      const current = parseInt(el.value) || 0;
      el.value = Math.max(0, current + delta);
    }

    function saveActiveSetEdits() {
      const idEl = document.getElementById('edit-active-set-id');
      const setId = idEl ? parseInt(idEl.value) : null;
      if (!setId) return;

      const idx = currentSessionSets.findIndex(s => s.id === setId);
      if (idx === -1) return;

      const exerciseName = document.getElementById('edit-active-set-exercise')?.value.trim() || currentSessionSets[idx].exerciseName;
      const implement = document.getElementById('edit-active-set-implement')?.value || currentSessionSets[idx].implement;
      const muscle = document.getElementById('edit-active-set-muscle')?.value || currentSessionSets[idx].muscle;
      const rpe = parseFloat(document.getElementById('edit-active-set-rpe')?.value) || 8;
      const restPeriod = Math.max(0, parseInt(document.getElementById('edit-active-set-rest')?.value) || 0);

      let weight = 0, reps = 1;
      let ergDistance = 0, ergTime = "";
      let swimDistance = 0, swimTime = "";
      let enduranceDistance = 0, enduranceTime = "";
      let runningDistance = 0, runningTime = "", runningAvgHR = null, runningMaxHR = null;

      if (implement === "Running") {
        runningDistance = parseFloat(document.getElementById('edit-active-set-running-distance')?.value) || 1.0;
        runningTime = document.getElementById('edit-active-set-running-time')?.value || "00:25:00";
        const parsedAvg = parseInt(document.getElementById('edit-active-set-running-avg-hr')?.value);
        const parsedMax = parseInt(document.getElementById('edit-active-set-running-max-hr')?.value);
        runningAvgHR = !isNaN(parsedAvg) ? parsedAvg : currentSessionSets[idx].runningAvgHR;
        runningMaxHR = !isNaN(parsedMax) ? parsedMax : currentSessionSets[idx].runningMaxHR;
      } else if (implement === "Row Erg") {
        ergDistance = parseInt(document.getElementById('edit-active-set-erg-distance')?.value) || 500;
        ergTime = document.getElementById('edit-active-set-erg-time')?.value || "02:00";
      } else if (implement === "Swimming") {
        swimDistance = parseInt(document.getElementById('edit-active-set-swim-distance')?.value) || 500;
        swimTime = document.getElementById('edit-active-set-swim-time')?.value || "10:00";
      } else if (["Walking", "Hiking", "Biking"].includes(implement)) {
        enduranceDistance = parseFloat(document.getElementById('edit-active-set-endurance-distance')?.value) || 1.0;
        enduranceTime = document.getElementById('edit-active-set-endurance-time')?.value || "00:30:00";
      } else {
        weight = parseFloat(document.getElementById('edit-active-set-weight')?.value) || 0;
        reps = parseInt(document.getElementById('edit-active-set-reps')?.value) || 1;
      }

      // Re-resolve secondary muscles if exercise name changed
      let secondaryMuscles = currentSessionSets[idx].secondaryMuscles || [];
      if (typeof resolveExerciseMuscles === 'function') {
        const profile = resolveExerciseMuscles(exerciseName, implement);
        if (profile && profile.secondary) secondaryMuscles = profile.secondary;
      }

      // Update set object in place
      currentSessionSets[idx] = {
        ...currentSessionSets[idx],
        exerciseName,
        implement,
        muscle,
        secondaryMuscles,
        weight,
        reps,
        ergDistance,
        ergTime,
        swimDistance,
        swimTime,
        enduranceDistance,
        enduranceTime,
        runningDistance,
        runningTime,
        runningAvgHR,
        runningMaxHR,
        rpe,
        restPeriod
      };

      localStorage.setItem('showUp_active_workout_sets', JSON.stringify(currentSessionSets));
      renderLoggedSets();
      closeEditActiveSetModal();

      if (googleAccessToken) {
        syncToGoogleDrive();
      }

      if (typeof triggerHaptic === 'function') triggerHaptic('medium');
      if (typeof showToast === 'function') {
        showToast(`Set #${idx + 1} updated!`, "success");
      }
    }

    function copyEditActiveSetToActiveForm() {
      const exVal = document.getElementById('edit-active-set-exercise')?.value || '';
      const impVal = document.getElementById('edit-active-set-implement')?.value || 'Bodyweight';
      const weightVal = document.getElementById('edit-active-set-weight')?.value || '0';
      const repsVal = document.getElementById('edit-active-set-reps')?.value || '10';

      const mainEx = document.getElementById('exercise-name-input');
      const mainImp = document.getElementById('implement-select');
      const mainWeight = document.getElementById('input-weight');
      const mainReps = document.getElementById('input-reps');

      if (mainEx && exVal) {
        mainEx.value = exVal;
        handleExerciseInput(exVal);
      }
      if (mainImp && impVal) {
        mainImp.value = impVal;
        handleImplementChange(impVal);
      }
      if (mainWeight) mainWeight.value = weightVal;
      if (mainReps) mainReps.value = repsVal;

      closeEditActiveSetModal();
      if (typeof showToast === 'function') {
        showToast("Set copied to workout form!", "info");
      }
    }



    function evaluateAndFinishWorkout() {
      if (currentSessionSets.length === 0) {
        alert("Please log at least one set before finishing your workout.");
        return;
      }

      const workoutName = document.getElementById('workout-title-input').value.trim() || "";
      const notes = document.getElementById('workout-notes-input').value.trim() || "";

      let totalVolume = 0;
      let totalDurationMin = 0;

      currentSessionSets.forEach(s => {
        if (s.implement === "Running") {
          totalVolume += ((s.runningDistance || 0) * 1000); // Scale miles to volume units
          const parts = (s.runningTime || "00:25:00").split(':');
          if (parts.length === 3) {
            totalDurationMin += (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0) + (parseInt(parts[2]) || 0) / 60;
          } else if (parts.length === 2) {
            totalDurationMin += (parseInt(parts[0]) || 0) + (parseInt(parts[1]) || 0) / 60;
          }
        } else if (s.implement === "Row Erg") {
          totalVolume += s.ergDistance;
          const parts = (s.ergTime || "02:00").split(':');
          totalDurationMin += (parseInt(parts[0]) || 0) + (parseInt(parts[1]) || 0) / 60;
        } else if (s.implement === "Swimming") {
          totalVolume += s.swimDistance;
          const parts = (s.swimTime || "10:00").split(':');
          totalDurationMin += (parseInt(parts[0]) || 0) + (parseInt(parts[1]) || 0) / 60;
        } else if (["Walking", "Hiking", "Biking"].includes(s.implement)) {
          totalVolume += (s.enduranceDistance * 1000); // Scale miles to volume units
          const parts = (s.enduranceTime || "00:30:00").split(':');
          if (parts.length === 3) {
            totalDurationMin += (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0) + (parseInt(parts[2]) || 0) / 60;
          }
        } else {
          totalVolume += (s.weight * s.reps);
          totalDurationMin += 3; // ~3 min per strength set
        }
      });

      const totalSets = currentSessionSets.length;
      const avgRPE = currentSessionSets.reduce((acc, s) => acc + s.rpe, 0) / totalSets;

      const hasRunning = currentSessionSets.some(s => s.implement === "Running");
      const aerobicTE = Math.min(5.0, (totalSets * 0.25) + (hasRunning ? 1.5 : (avgRPE > 7 ? 0.8 : 0.4))).toFixed(1);
      const anaerobicTE = Math.min(5.0, (currentSessionSets.filter(s => s.rpe >= 9).length * 0.7) + (totalVolume > 2000 ? 1.2 : 0.5)).toFixed(1);

      // Calorie Calculation Formula: METs x 3.5 x Body Weight (kg) / 200 x Minutes
      const weightKg = userWeight * 0.453592;
      const estimatedMinutes = Math.max(15, Math.round(totalDurationMin));

      let metFactor = 5.0; // Standard moderate MET
      if (currentSessionSets.some(s => s.implement === "Running")) metFactor = 10.0;
      else if (currentSessionSets.some(s => s.implement === "Swimming")) metFactor = 8.0;
      else if (currentSessionSets.some(s => s.implement === "Biking")) metFactor = 7.5;
      else if (currentSessionSets.some(s => s.implement === "Hiking")) metFactor = 6.5;
      else if (currentSessionSets.some(s => s.implement === "Walking")) metFactor = 3.8;
      else if (currentSessionSets.some(s => s.implement === "Row Erg")) metFactor = 7.0;

      const avgMET = Math.min(12.0, metFactor + (avgRPE * 0.3) + (currentHR > 0 ? (currentHR - 100) * 0.04 : 0));
      const caloriesBurned = Math.round((avgMET * 3.5 * weightKg / 200) * estimatedMinutes);

      document.getElementById('aerobic-te-score').innerText = aerobicTE;
      document.getElementById('aerobic-te-label').innerText = aerobicTE > 3.0 ? "High Aerobic" : "Moderate";

      document.getElementById('anaerobic-te-score').innerText = anaerobicTE;
      document.getElementById('anaerobic-te-label').innerText = anaerobicTE > 3.0 ? "High Anaerobic" : "Minor";

      document.getElementById('calories-burned-score').innerText = caloriesBurned;

      // Ascertain relevant Running metrics when Running was performed
      const runningSets = currentSessionSets.filter(s => s.implement === "Running");
      let runningMetrics = null;
      const runningCardEl = document.getElementById('summary-running-metrics-card');

      if (runningSets.length > 0) {
        let totalRunningMiles = 0;
        let totalRunningSeconds = 0;
        let weightedAvgHRSum = 0;
        let hrDurationSum = 0;
        let maxHRVal = 0;

        runningSets.forEach(s => {
          const miles = Number(s.runningDistance) || 0;
          totalRunningMiles += miles;

          let sec = 0;
          const parts = (s.runningTime || "00:25:00").split(':');
          if (parts.length === 3) {
            sec = (parseInt(parts[0]) || 0) * 3600 + (parseInt(parts[1]) || 0) * 60 + (parseInt(parts[2]) || 0);
          } else if (parts.length === 2) {
            sec = (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
          }
          totalRunningSeconds += sec;

          if (s.runningAvgHR) {
            weightedAvgHRSum += (s.runningAvgHR * sec);
            hrDurationSum += sec;
          }
          if (s.runningMaxHR && s.runningMaxHR > maxHRVal) {
            maxHRVal = s.runningMaxHR;
          }
        });

        const overallAvgHR = hrDurationSum > 0 ? Math.round(weightedAvgHRSum / hrDurationSum) : (runningSets.find(s => s.runningAvgHR)?.runningAvgHR || null);
        if (!maxHRVal && overallAvgHR) maxHRVal = overallAvgHR;

        let paceStr = "-- /mi";
        let speedStr = "-- mph";
        if (totalRunningMiles > 0 && totalRunningSeconds > 0) {
          const totalRunMins = totalRunningSeconds / 60;
          const paceTotalMins = totalRunMins / totalRunningMiles;
          const paceM = Math.floor(paceTotalMins);
          const paceS = Math.round((paceTotalMins - paceM) * 60);
          paceStr = `${paceM}:${String(paceS).padStart(2, '0')} /mi`;

          const hours = totalRunningSeconds / 3600;
          const mph = (totalRunningMiles / hours).toFixed(1);
          speedStr = `${mph} mph`;
        }

        const runMins = Math.max(1, Math.round(totalRunningSeconds / 60));
        const runSpeedNum = parseFloat(speedStr) || 6.0;
        let runMet = 9.8;
        if (runSpeedNum >= 8.0) runMet = 11.8;
        else if (runSpeedNum >= 7.0) runMet = 11.0;
        else if (runSpeedNum >= 6.0) runMet = 9.8;
        else if (runSpeedNum >= 5.0) runMet = 8.5;
        const runCalories = Math.round((runMet * 3.5 * weightKg / 200) * runMins);

        runningMetrics = {
          totalDistance: totalRunningMiles,
          totalDistanceFormatted: `${totalRunningMiles.toFixed(2)} mi`,
          totalDurationSeconds: totalRunningSeconds,
          totalDurationFormatted: formatTimerHMS(totalRunningSeconds),
          avgPace: paceStr,
          avgSpeed: speedStr,
          avgHR: overallAvgHR,
          maxHR: maxHRVal || overallAvgHR,
          calories: runCalories
        };

        if (runningCardEl) {
          runningCardEl.classList.remove('hidden');
          const distEl = document.getElementById('summary-running-distance');
          const paceEl = document.getElementById('summary-running-pace');
          const speedEl = document.getElementById('summary-running-speed');
          const hrEl = document.getElementById('summary-running-hr');
          const badgeEl = document.getElementById('summary-running-badge');

          if (distEl) distEl.innerText = `${totalRunningMiles.toFixed(2)} mi`;
          if (paceEl) paceEl.innerText = paceStr;
          if (speedEl) speedEl.innerText = speedStr;
          if (hrEl) {
            hrEl.innerText = overallAvgHR ? `${overallAvgHR} / ${maxHRVal || overallAvgHR} bpm` : `-- / --`;
          }
          if (badgeEl) {
            badgeEl.innerText = overallAvgHR && overallAvgHR >= 165 ? "Peak Cardiovascular" :
              overallAvgHR && overallAvgHR >= 145 ? "High Aerobic" : "Aerobic Conditioning";
          }
        }
      } else {
        if (runningCardEl) runningCardEl.classList.add('hidden');
      }

      const muscleMap = {};
      const secondaryMuscleSet = new Set();

      currentSessionSets.forEach(s => {
        const vol = s.implement === "Running" ? Math.round((s.runningDistance || 0) * 100) :
                    s.implement === "Row Erg" ? s.ergDistance :
                    s.implement === "Swimming" ? s.swimDistance :
                    ["Walking", "Hiking", "Biking"].includes(s.implement) ? Math.round(s.enduranceDistance * 100) :
                    (s.weight * s.reps);

        muscleMap[s.muscle] = (muscleMap[s.muscle] || 0) + vol;

        if (s.secondaryMuscles && Array.isArray(s.secondaryMuscles)) {
          s.secondaryMuscles.forEach(sec => secondaryMuscleSet.add(sec));
        }
      });

      const muscleContainer = document.getElementById('muscle-breakdown-bars');
      muscleContainer.innerHTML = Object.entries(muscleMap).map(([m, vol]) => `
        <div class="space-y-1">
          <div class="flex justify-between text-xs font-semibold">
            <span class="text-slate-300">${m}</span>
            <span class="text-emerald-400">${vol} units</span>
          </div>
          <div class="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div class="bg-emerald-500 h-full" style="width: ${Math.min(100, (vol / (totalVolume || 1)) * 100)}%"></div>
          </div>
        </div>
      `).join('');

      updateAnatomicalBodyMap(muscleMap, Array.from(secondaryMuscleSet));

      // Calculate Total Rest Time across all sets
      let totalRestSeconds = 0;
      currentSessionSets.forEach(s => {
        totalRestSeconds += (Number(s.restPeriod) || 0);
      });
      if (isRestTimerRunning && restTimerStartTime) {
        totalRestSeconds += Math.max(0, Math.floor((Date.now() - restTimerStartTime) / 1000));
      }

      // Calculate logged set duration
      let totalLoggedSetSeconds = 0;
      currentSessionSets.forEach(s => {
        totalLoggedSetSeconds += (Number(s.setDuration) || 0);
      });

      // Calculate Total Workout Time
      let totalWorkoutSeconds = workoutTimerSeconds;
      if (totalWorkoutSeconds < (totalRestSeconds + totalLoggedSetSeconds)) {
        totalWorkoutSeconds = totalRestSeconds + totalLoggedSetSeconds;
      }
      if (totalWorkoutSeconds === 0) {
        totalWorkoutSeconds = Math.max(totalRestSeconds, Math.round(totalDurationMin * 60));
      }

      // Active Time = diff between total and rest
      const totalActiveSeconds = Math.max(0, totalWorkoutSeconds - totalRestSeconds);

      // Populate Evaluation Summary UI: Total Time, Rest Time, Active Time
      const totalTimeEl = document.getElementById('summary-total-time');
      const restTimeEl = document.getElementById('summary-rest-time');
      const activeTimeEl = document.getElementById('summary-active-time');
      const activePctEl = document.getElementById('summary-active-pct');
      const restPctEl = document.getElementById('summary-rest-pct');
      const activeBarEl = document.getElementById('summary-active-bar');
      const restBarEl = document.getElementById('summary-rest-bar');

      if (totalTimeEl) totalTimeEl.innerText = formatTimerHMS(totalWorkoutSeconds);
      if (restTimeEl) restTimeEl.innerText = formatDurationSecs(totalRestSeconds);
      if (activeTimeEl) activeTimeEl.innerText = formatDurationSecs(totalActiveSeconds);

      const activePct = totalWorkoutSeconds > 0 ? Math.round((totalActiveSeconds / totalWorkoutSeconds) * 100) : 0;
      const restPct = totalWorkoutSeconds > 0 ? (100 - activePct) : 0;

      if (activePctEl) activePctEl.innerText = `${activePct}%`;
      if (restPctEl) restPctEl.innerText = `${restPct}%`;
      if (activeBarEl) activeBarEl.style.width = `${activePct}%`;
      if (restBarEl) restBarEl.style.width = `${restPct}%`;

      // Stop rest timer and active set timer if running
      stopRestTimer();
      if (activeSetTimerInterval) clearInterval(activeSetTimerInterval);
      isSetInProgress = false;
      activeSetStartTime = null;
      activeSetElapsedSeconds = 0;
      currentPendingRestPeriod = 0;

      pauseWorkoutTimer();

      const targetDate = selectedWorkoutDate || (typeof getLocalDateKey === 'function' ? getLocalDateKey() : new Date().toISOString().slice(0, 10));
      const workoutObj = {
        date: targetDate,
        workoutName,
        notes,
        totalSets,
        totalVolume,
        aerobicTE,
        anaerobicTE,
        caloriesBurned,
        calories: caloriesBurned,
        completed: true,
        completedDate: targetDate,
        runningMetrics,
        totalWorkoutSeconds,
        totalWorkoutTimeFormatted: formatTimerHMS(totalWorkoutSeconds),
        totalRestSeconds,
        totalRestTimeFormatted: formatDurationSecs(totalRestSeconds),
        totalActiveSeconds,
        totalActiveTimeFormatted: formatDurationSecs(totalActiveSeconds),
        workoutDuration: totalWorkoutSeconds,
        workoutDurationFormatted: formatTimerHMS(totalWorkoutSeconds),
        sets: [...currentSessionSets]
      };

      lastEvaluatedSummary = workoutObj;

      const existingIdx = completedWorkoutsHistory.findIndex(item => (typeof item === 'string' ? item : item.date) === targetDate);
      if (existingIdx >= 0) {
        completedWorkoutsHistory[existingIdx] = workoutObj;
      } else {
        completedWorkoutsHistory.push(workoutObj);
      }
      if (typeof AppStorage !== 'undefined' && typeof AppStorage.saveAthleteWorkouts === 'function') {
        AppStorage.saveAthleteWorkouts(completedWorkoutsHistory);
      } else {
        localStorage.setItem('showUp_synced_workouts', JSON.stringify(completedWorkoutsHistory));
      }

      document.getElementById('summary-title').innerHTML = workoutName ? `<i class="fa-solid fa-trophy"></i> ${workoutName}` : `<i class="fa-solid fa-chart-line"></i> Physiology Summary`;
      document.getElementById('summary-timestamp').innerText = `Recorded for ${targetDate}`;

      const notesEl = document.getElementById('summary-notes-display');
      if (notes) {
        notesEl.innerText = `Notes: "${notes}"`;
        notesEl.classList.remove('hidden');
      } else {
        notesEl.classList.add('hidden');
      }

      document.getElementById('workout-summary-card').classList.remove('hidden');
      if (typeof switchSummaryTab === 'function') {
        switchSummaryTab('overview');
      }
      const summaryPrompt = document.getElementById('summary-cloud-save-prompt');
      if (summaryPrompt) {
        if (!isAthleteAuthenticated()) {
          summaryPrompt.classList.remove('hidden');
        } else {
          summaryPrompt.classList.add('hidden');
        }
      }
      document.getElementById('workout-summary-card').scrollIntoView({ behavior: 'smooth' });

      currentSessionSets = [];
      localStorage.removeItem('showUp_active_workout_sets');
      workoutTimerSeconds = 0;
      workoutTimerState = 'stopped';
      saveWorkoutTimerState();
      updateWorkoutTimerUI();
      updateSetControlsUI();
      broadcastUserWorkoutEnded(workoutName, workoutObj);
      incrementGlobalWorkoutCounter();

      renderLoggedSets();
      renderCalendar();
      renderMonthlyHistory();
      if (typeof renderHomeTab === 'function') {
        renderHomeTab();
      }

      if (googleAccessToken) {
        syncToGoogleDrive();
      }
    }

    function updateAnatomicalBodyMap(muscleMap, explicitSecondaries = []) {
      const muscleSvgMap = {
        'Chest': ['body-chest'],
        'Back': ['body-back'],
        'Shoulders': ['body-shoulders-ant', 'body-shoulders-post'],
        'Biceps': ['body-biceps'],
        'Triceps': ['body-triceps'],
        'Core/Abs': ['body-core'],
        'Quads': ['body-quads'],
        'Hamstrings/Glutes': ['body-hamstrings']
      };

      Object.values(muscleSvgMap).flat().forEach(id => {
        const el = document.getElementById(id);
        if (el) el.setAttribute('fill', '#334155');
      });

      const sortedMuscles = Object.entries(muscleMap).sort((a, b) => b[1] - a[1]);
      if (sortedMuscles.length === 0) return;

      const primaryTarget = sortedMuscles[0][0];

      if (primaryTarget === "Full Body") {
        ['body-back', 'body-hamstrings', 'body-chest'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.setAttribute('fill', '#ef4444');
        });
        ['body-shoulders-ant', 'body-shoulders-post', 'body-quads', 'body-core'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.setAttribute('fill', '#eab308');
        });
        return;
      }

      if (muscleSvgMap[primaryTarget]) {
        muscleSvgMap[primaryTarget].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.setAttribute('fill', '#ef4444');
        });
      }

      const combinedSecondaries = new Set([
        ...sortedMuscles.slice(1).map(m => m[0]),
        ...explicitSecondaries
      ]);

      combinedSecondaries.forEach(m => {
        if (m !== primaryTarget && muscleSvgMap[m]) {
          muscleSvgMap[m].forEach(id => {
            const el = document.getElementById(id);
            if (el && el.getAttribute('fill') !== '#ef4444') {
              el.setAttribute('fill', '#eab308');
            }
          });
        }
      });
    }



    function switchSummaryTab(tabName) {
      if (typeof triggerHaptic === 'function') triggerHaptic('light');
      const tabs = ['overview', 'muscles', 'sets'];
      tabs.forEach(t => {
        const btn = document.getElementById(`tab-btn-summary-${t}`);
        const pane = document.getElementById(`tab-pane-summary-${t}`);
        if (btn) {
          if (t === tabName) {
            btn.className = "flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm transition flex items-center justify-center gap-1.5";
          } else {
            btn.className = "flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800 transition flex items-center justify-center gap-1.5";
          }
        }
        if (pane) {
          if (t === tabName) {
            pane.classList.remove('hidden');
          } else {
            pane.classList.add('hidden');
          }
        }
      });

      if (tabName === 'sets') {
        renderSummarySetsList();
      }
    }

    function renderSummarySetsList() {
      const container = document.getElementById('summary-sets-chronology');
      if (!container) return;
      const sets = lastEvaluatedSummary && lastEvaluatedSummary.sets ? lastEvaluatedSummary.sets : currentSessionSets;
      if (!sets || sets.length === 0) {
        container.innerHTML = `<div class="text-center py-6 text-slate-500 text-xs italic">No set breakdown available for this workout.</div>`;
        return;
      }
      let html = '';
      sets.forEach((s, idx) => {
        const metricDisplay = s.implement === "Running" ? `${s.runningDistance || 0} mi | ${s.runningTime || '00:00'}${s.runningAvgHR ? ` | HR: ${s.runningAvgHR} avg` + (s.runningMaxHR ? ` / ${s.runningMaxHR} max` : '') : ''}` :
          s.implement === "Row Erg" ? `${s.ergDistance || 0}m | ${s.ergTime || '00:00'}` :
          s.implement === "Swimming" ? `${s.swimDistance || 0} yds | ${s.swimTime || '00:00'}` :
          ["Walking", "Hiking", "Biking"].includes(s.implement) ? `${s.enduranceDistance || 0} mi | ${s.enduranceTime || '00:00'}` :
          `${s.weight || 0} lbs × ${s.reps || 0} reps`;

        html += `
          <div class="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2.5">
              <span class="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold flex items-center justify-center text-[11px] border border-emerald-500/20">
                ${idx + 1}
              </span>
              <div>
                <div class="font-bold text-slate-200">${s.exerciseName}</div>
                <div class="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span class="bg-slate-800 text-emerald-400 px-1.5 py-0.2 rounded font-semibold text-[10px]">${s.implement}</span>
                  <span>•</span>
                  <span class="text-slate-300 font-mono">${metricDisplay}</span>
                  <span>•</span>
                  <span class="text-slate-500">RPE ${s.rpe}</span>
                </div>
              </div>
            </div>
            ${s.restPeriod ? `
              <div class="font-mono text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <i class="fa-solid fa-hourglass-half text-[9px]"></i> ${formatDurationSecs(s.restPeriod)}
              </div>
            ` : ''}
          </div>
        `;
      });
      container.innerHTML = html;
    }

    function closeSummary() {
      document.getElementById('workout-summary-card').classList.add('hidden');
    }



    function shareWorkoutToWhatsApp(dateStr = null) {
      const targetDate = dateStr || (lastEvaluatedSummary ? lastEvaluatedSummary.date : selectedWorkoutDate);
      const w = completedWorkoutsHistory.find(item => (typeof item === 'string' ? item : item.date) === targetDate) || lastEvaluatedSummary;
      
      if (!w) return;

      const titlePart = w.workoutName ? `🏋️ *${w.workoutName}*\n` : `🏋️ *showUp Workout Summary*\n`;
      const notesPart = w.notes ? `📝 *Notes:* ${w.notes}\n` : ``;
      const setsCount = w.sets ? w.sets.length : w.totalSets || 0;
      const vol = w.totalVolume ? `${w.totalVolume.toLocaleString()} units` : 'Logged';
      const cals = w.caloriesBurned ? `🔥 *Calories:* ${w.caloriesBurned} kcal\n` : ``;

      let text = `${titlePart}` +
                 `📅 *Date:* ${w.date || targetDate}\n` +
                 `${notesPart}` +
                 `📊 *Total Sets:* ${setsCount} | *Volume:* ${vol}\n` +
                 (w.totalWorkoutSeconds ? `⏱️ *Time:* ${w.totalWorkoutTimeFormatted || formatDurationSecs(w.totalWorkoutSeconds)} (Active: ${w.totalActiveTimeFormatted || formatDurationSecs(w.totalActiveSeconds)} | Rest: ${w.totalRestTimeFormatted || formatDurationSecs(w.totalRestSeconds)})\n` : ``) +
                 `${cals}`;

      if (w.runningMetrics && w.runningMetrics.totalDistance > 0) {
        text += `🏃 *Running:* ${w.runningMetrics.totalDistanceFormatted} in ${w.runningMetrics.totalDurationFormatted} (Pace: ${w.runningMetrics.avgPace} | Speed: ${w.runningMetrics.avgSpeed}${w.runningMetrics.avgHR ? ` | HR: ${w.runningMetrics.avgHR} avg` : ''})\n`;
      }

      if (w.aerobicTE && w.anaerobicTE) {
        text += `🫁 *Aerobic Load:* ${w.aerobicTE} / 5.0\n` +
                `⚡ *Anaerobic Load:* ${w.anaerobicTE} / 5.0\n`;
      }

      text += `\n_Compound your progress with showUp_`;

      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && isRestTimerRunning && restTimerStartTime) {
          tickRestTimer();
        }
      });
    }

    if (typeof window !== 'undefined') {
      window.filterExerciseCatalog = filterExerciseCatalog;
      window.updateExerciseSuggestions = updateExerciseSuggestions;
      window.selectExerciseSuggestion = selectExerciseSuggestion;
      window.closeExerciseSuggestions = closeExerciseSuggestions;
      window.scrollExerciseInputIntoView = scrollExerciseInputIntoView;
      window.handleExerciseInputFocus = handleExerciseInputFocus;
      window.handleExerciseInputKeydown = handleExerciseInputKeydown;
      window.exerciseMatchesImplementFilter = exerciseMatchesImplementFilter;
      window.getActiveExerciseCatalogFilter = getActiveExerciseCatalogFilter;
      window.setExerciseCatalogFilter = setExerciseCatalogFilter;
      window.renderExerciseCatalogFilterPills = renderExerciseCatalogFilterPills;
      window.toggleExerciseCatalogFilter = toggleExerciseCatalogFilter;
      window.restoreRestTimerState = restoreRestTimerState;
      window.saveRestTimerState = saveRestTimerState;
      window.isAthleteAuthenticated = isAthleteAuthenticated;
      window.isFirstSetLoginPromptDismissed = isFirstSetLoginPromptDismissed;
      window.dismissFirstSetLoginPrompt = dismissFirstSetLoginPrompt;
      window.initTouchScrollerInputs = initTouchScrollerInputs;
    }

    if (typeof document !== 'undefined') {
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initTouchScrollerInputs();
      } else {
        document.addEventListener('DOMContentLoaded', () => {
          initTouchScrollerInputs();
        });
      }
    }
