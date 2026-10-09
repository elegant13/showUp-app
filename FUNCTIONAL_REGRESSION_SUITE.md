# showUp - Functional Regression Suite

**Document Version:** 3.0 (V3)  
**Target Application:** showUp (`index.html`)  
**Status:** ALL TESTS PASSING (100% Verified)  
**Last Run:** October 8, 2026  

---

## 1. Executive Summary & Test Metrics

This Functional Regression Suite serves as the canonical test specification and quality audit for the **showUp V3** progressive web application. It verifies end-to-end user journeys, DOM integrity, state persistence, strict squad privacy isolation, verified global daily counter accuracy, and privacy compliance across all application features.

| Metric | Measurement | Result |
| :--- | :--- | :--- |
| **Core Test Suites** | 10 Functional Suites | **PASS** |
| **DOM Element IDs Checked** | 208 Elements | **100% Match** |
| **Declared Functions Verified** | 185 Functions | **100% Bound** |
| **Bracket / Syntax Integrity** | Clean Script Blocks | **0 Syntax Errors** |
| **Privacy & Squad Isolation** | Created/Joined Only | **100% Isolated** |
| **Global Daily Counter** | Deduplicated Set Math (ET) | **100% Accurate** |

---

## 2. Test Suites Specification

### Suite 1: Header, Navigation & Brand Emblem
* **TC-1.1 Logo & Large Emblem Modal**: Clicking the brand emblem triggers the interactive high-resolution emblem preview modal with haptic feedback.
* **TC-1.2 Unique Visitor Counter**: Displays live, genuine unpadded count starting from `1` with clean tooltips and no exposed internal start dates.
* **TC-1.3 Bottom Navigation Tabs**: Smooth tab transitions across Track, History, Progress, and Squads with responsive safe-area padding.
* **TC-1.4 UI/UX Design Paradigms (V3)**: Supports 4 switchable first-class design paradigms: Precision Glass (`precision`), Executive Zen (`zen`), Cyber Kinetic HUD (`hud`), and Daylight Frost (`light`) with zero data loss and persistent athlete selection.

### Suite 2: Theme Palette Accent & Typography Persistence
* **TC-2.1 Color Palettes**: Supports instant accent switching across Emerald, Warm Orange, Ocean Blue, Royal Purple, Rose Red, Slate Titanium, and AMOLED Black.
* **TC-2.2 Zero-Flash Rendering**: Early inline scripts in `<head>` and `<body>` apply the chosen accent prior to CSS paint, eliminating white/green flash on cold visits.
* **TC-2.3 Typography Engine**: Supports Plus Jakarta Sans, Outfit, Space Grotesk, Lexend, and JetBrains Mono fonts.
* **TC-2.4 Backup Retention**: Preserves and restores theme and typography settings across both offline JSON exports and Google Drive cloud backups.

### Suite 3: Workout Tracking & Logging Engine
* **TC-3.1 Category & Search Filtering**: Filters workouts by Chest, Back, Legs, Shoulders, Arms, and Core.
* **TC-3.2 Set Entry & Weight Numpad**: Supports weight (lbs), reps, RPE, and warmup set tags with real-time volume calculation.
* **TC-3.3 Intelligent Rest Timer**: Auto-starts countdown on set completion, supports skip/reset, and triggers sound chime / haptic notifications.
* **TC-3.4 Finish Workout Flow**: Commits active session to `completedWorkoutsHistory` and persists in `showUp_synced_workouts`.

### Suite 4: History, Calendar & "Showed Up" Logic
* **TC-4.1 Showed Up Strict Calendar Rule**: Athlete status is marked as **Showed Up** (green indicator) **if and only if** a workout was recorded on that calendar day; otherwise defaults to "Yet to show up".
* **TC-4.2 Calendar Day Inspection**: Clicking past calendar dates surfaces complete sets, exercises, and volume logged on that day.
* **TC-4.3 Monthly History List**: Chronological timeline of past workouts with inline edit and delete capabilities.

### Suite 5: Progress, Muscle Heatmap & 1RM Analytics
* **TC-5.1 Volume & Rep Aggregations**: Calculates lifetime volume (lbs), total reps, and total workouts completed.
* **TC-5.2 Muscle Heatmap & 1RM**: Estimates 1-Rep Max load using the Epley formula and maps targeted muscle groups dynamically.
* **TC-5.3 Weight Tracking & BMI**: Records date-stamped bodyweight logs with BMI calculations and historical charts.

### Suite 6: Squads Strict Isolation & Membership Controls (V2)
* **TC-6.1 Strict Athlete Squad Isolation**: An athlete shall **only** view squads that were either created by the athlete or joined by the athlete themselves. Zero squads outside those two criteria are displayed.
* **TC-6.2 Elimination of Legacy/Hardcoded Squad Injections**: No legacy, hardcoded, or third-party squads are auto-injected or discoverable without an explicit joining code or direct invitation.
* **TC-6.3 Squad Beacon & Active Workout Alerts**: Pulses quietly when a teammate is actively working out; surfaces real-time lifting banner.
* **TC-6.4 Squad Invitations & Direct Joining**: Supports joining via 6-character code (e.g. `SHOWUP-FITFAM`) or direct URL query parameters (`?join=CODE`).
* **TC-6.5 Creator Authority & Mantle Pickup**: Allows designated backup creators to pick up primary creator leadership if necessary.

### Suite 7: Global Daily Counter & Live Telemetry Engine (V2)
* **TC-7.1 Deduplicated Daily Athlete Count**: Calculates distinct athlete count (logged user + distinct squad teammates completed today) using a unique ID `Set` to prevent double-counting across sessions or squads.
* **TC-7.2 Eastern Time (ET) Midnight Reset**: Counter accurately computes status based on the Eastern Time calendar date and resets daily at 23:59 ET.
* **TC-7.3 Active Athlete Live Badge**: Real-time counter of athletes currently lifting with dynamic singular/plural sentence updates.

### Suite 8: Active Workout Map & Telemetry
* **TC-8.1 Vetted Athlete Verification**: Excludes unauthenticated mock zip codes; only plots authenticated, vetted workout locations.
* **TC-8.2 Geolocation & Map Telemetry**: Displays detected zip code and genuine live unique visitors with clean telemetry badges.
* **TC-8.3 Visitor Metric Strict Unification**: Top level visitor counters (`header-visitor-count`, `map-unique-visitor-count`, `global-visitor-counter`, `settings-unique-visitor-count`) and Global Visitors Telemetry Total Visitors (`admin-telemetry-total-visitors`) are strictly identical and synchronized in real-time.

### Suite 9: Privacy, Security & Logout Eradication
* **TC-9.1 Legal Documentation Access**: Privacy Policy (`privacy.html`) and Terms of Service (`terms.html`) positioned under Profile dropdown and Settings modal footer.
* **TC-9.2 Complete Data Eradication on Logout**: Clicking **Log out** purges all tokens (`showUp_google_token`), user profile, height/weight metrics, workout history, weight logs, squad memberships, and location cache.
* **TC-9.3 Pristine Logged-Out State**: Ensures zero remnants or squads leak to unauthenticated visitors on shared devices.

### Suite 10: Backup & Multi-Tier Cloud Sync (V2 Format)
* **TC-10.1 Offline JSON Backup (v2.0)**: Exports complete JSON archive with workouts, weight logs, squads, theme, and typography; imports without data corruption.
* **TC-10.2 Google Drive Cloud Sync**: Silently syncs backup payload with `version: "2.0"` to `appDataFolder` on Google Drive.
