# Phase 0 — Project Audit & Implementation Roadmap

Date: 2026-11-07

## 1. Repository audit
- `/home/qaali/Documents/fitTrack` contained only `.playwright-mcp/` (Figma screenshots). **No existing app code**, so there
  is nothing to preserve or migrate; the app is created from scratch.
- Git: the folder has no repository of its own. The enclosing repository is **`/home/qaali` (home directory)**, which tracks
  an unrelated Flutter attendance app with many pending deletions. Nothing is committed (user instruction). The project
  `.gitignore` excludes `node_modules/`, build output and `.playwright-mcp/` so they never show up in that repo either.
  Recommendation: `git init` inside `fitTrack/` so the app has its own history (user decision).

## 2. Toolchain audit
| Tool | Status |
|---|---|
| Node 22.20 / npm 10.9 | OK |
| Java | OpenJDK 21 default, JDK 17 available — OK for Gradle |
| Watchman | installed |
| Android SDK | **Incomplete**: `/usr/lib/android-sdk` has only `emulator`, `platform-tools`, `licenses`. No `platforms`, `build-tools`, `cmdline-tools` or system images. `ANDROID_HOME` points to a non-existent `~/Android`. |
| Emulator | AVD `Pixel_API36` exists but its system image is missing → cannot boot |
| adb | works, no device attached |
| iOS | Not possible on Linux (needs macOS + Xcode). iOS code paths are written and type-checked only. |

**Consequence:** native Android builds (`expo run:android`, Gradle) cannot run until SDK platform 36 + build-tools + a system
image are installed (Android Studio is at `/opt/android-studio` and can do this). Until then verification is:
TypeScript, ESLint, Jest (incl. real SQLite via better-sqlite3), Metro bundling via `expo export`, and visual QA in the
web build.

## 3. Design audit
All 9 Figma pages and all 22 numbered screens (light + dark), the 10 Supporting States pairs and the component sheets were
inspected at 100% zoom. Full extraction: `docs/design-spec.md` (copy, layout, tokens, node IDs).
Not accessible (view-only, no Dev Mode): exact pixel paddings, letter-spacing values, image asset files.
→ Spacing is read from 100% screenshots and snapped to the 8-pt scale; the two onboarding photos and the avatar are not
exportable, so the app uses the user's own photo (picker) / initials and designed illustration cards instead of stock photos.

## 4. Architecture decisions
- **Expo SDK 58 (React Native 0.88, TypeScript strict)** with a development build (`expo prebuild`). Expo is React Native;
  it gives config plugins for Health Connect / HealthKit permissions without hand-editing native projects.
- **Navigation:** React Navigation 7 — root native stack (onboarding stack vs. main) + bottom tabs (Home, Activity, Workout,
  Progress, Profile). Full-screen flows (timer, summary, manual log, goals, history, edit profile) are stack screens above tabs.
- **Persistence:** `expo-sqlite` behind a small `SqlDatabase` interface. Migrations keyed on `PRAGMA user_version`.
  The same repositories run in Jest against `better-sqlite3`, so SQL is tested for real.
- **Steps:**
  - iOS: Core Motion via `expo-sensors` Pedometer (`getStepCountAsync` gives true historical counts per hour/day) + optional
    HealthKit (`@kingstinct/react-native-healthkit`).
  - Android: Health Connect (`react-native-health-connect`) for authoritative daily/hourly steps; fallback to the
    `TYPE_STEP_COUNTER` sensor via `expo-sensors` (foreground only — documented limitation).
  - Steps are stored as hourly buckets (`step_samples`, unique per source+hour) → idempotent upserts, no double counting.
- **Timer:** persisted session row with `started_at`, `accumulated_ms`, `resumed_at`, `status`; elapsed is always derived
  from timestamps → survives backgrounding and process death.
- **Calories:** MET-based service (Compendium of Physical Activities), pure functions, unit-tested, calibrated to the design.
- **UI:** theme tokens + `useTheme()`; no hard-coded colors in screens. Icons: `lucide-react-native` (matches Figma glyphs).
  Charts/rings: hand-built with `react-native-svg` (no chart dependency). Font: Inter via `@expo-google-fonts/inter`.

## 5. Risks
1. Android SDK missing → no native build/device test in this environment (see above).
2. Android step counter sensor gives counts only while the app runs; reliable all-day history needs Health Connect installed
   and permitted. Both states are surfaced honestly in the UI (screens 08/09 + supporting states).
3. iOS cannot be built/tested here.
4. Active-minute and "everyday movement" values from hourly step buckets are estimates (documented in code).

## 6. Roadmap
| Phase | Scope |
|---|---|
| 1 | Expo scaffold, theme/tokens, typography, core components, navigation shell, SQLite + migrations, providers |
| 2 | Screens 01–06, profile persistence, onboarding completion flag |
| 3 | Screens 07–09, step tracking services, hourly aggregation, dashboard queries |
| 4 | Screens 10–15, timer engine, calorie service, manual logging |
| 5 | Screens 16–19, analytics queries, charts, goals + edit sheet |
| 6 | Screens 20–22, history filters/edit/delete, profile & settings, theme persistence |
| 7 | Tests, tsc, lint, bundle export, web visual QA, report |
