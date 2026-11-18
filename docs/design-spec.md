# FITTRACK — Design Spec (extracted from Figma)

Source: Figma file `gm7DgWEQfFAe2J99uywmhg` (view-only, no Dev Mode). Values read from 100% zoom
screenshots, so pixel values are close but not inspected. Device frame: 402 pt wide (iPhone 16 Pro class).
Status bar mock "9:41" is part of the frame, not app UI.

## Frame node IDs (open `https://www.figma.com/design/gm7DgWEQfFAe2J99uywmhg/Untitled?node-id=<id>`)
| Screen | Light node |
|---|---|
| 01 Splash | 2-88875 |
| 02 Track Your Activity | 2-88911 |
| 03 Stay Active | 2-88975 |
| 04 Achieve Your Goals | 2-89039 |
| 05 User Setup | 2-89121 |
| 06 Activity Permission | 2-89257 |
| 07 Home Dashboard | 2-89343 |
| 08 Activity Tracking Enabled | 2-89645 |
| 09 Activity Permission Needed | 2-89893 |
| 10 Workout | 2-89995 |
| 11 Timer Ready | 2-90229 |
| 12 Timer Active | 2-90321 |
| 13 Timer Paused | 2-90413 |
| 14 Manual Activity Logging | 2-90505 |
| 15 Workout Summary | 2-90619 |
| 16 Progress Daily | 2-90731 |
| 17 Progress Weekly | 2-90997 |
| 18 Progress Monthly | 2-91303 |
| 19 Goals Management | 2-91717 |
| 20 Activity History | 2-91907 |
| 21 Profile & Settings | 2-92115 |
| 22 Edit Profile | 2-92315 |
| D Supporting States | 2-88237 |
| C Controls | 2-87519 |
| C Navigation & Patterns | 2-87730 |

## Screens

### 01 Splash
Full-bleed `secondary` (#123D2D) in light, background (#0C1511) in dark. Centered accent rounded-square
logo (pulse glyph), "FITTRACK" (white, ~40 bold), "Move Better. Live Stronger." Bottom: short accent
line + "BUILT FOR YOUR EVERYDAY" (letter-spaced caption).

### 02–04 Onboarding carousel (shared layout)
Header: "FITTRACK" (letter-spaced, bold) left, "Skip" (primary, semibold) right.
Hero card (radius 24, ~336x342) with overlay info chip at bottom.
Eyebrow pill (tinted primary bg, primary text, uppercase label). Title 32/700 two lines. Body 17 secondary.
Page dots (active = primary pill 24 wide). Primary button 56 high, radius 16, arrow-right icon.
- 02: photo (walking woman). Chip (surface, white): "7,250" + "Every step counts." / "72.5% of your daily goal".
  Eyebrow "01 / YOUR EVERYDAY, MEASURED". Title "Track your activity.\nFind your rhythm."
  Body "Turn everyday movement into meaningful progress. Track your steps, distance and active energy in one clear view." Button "Next".
- 03: photo (runner). Chip (secondary bg): "RUNNING" (accent) / "Your pace. Your progress." + "24:38" (white, bold).
  Eyebrow "02 / MAKE MOVEMENT A HABIT". Title "Stay active.\nOn your terms."
  Body "From a morning walk to a strength session. Choose your workout, start the timer and see your effort add up." Button "Next".
- 04: secondary card with accent progress ring: footsteps icon, "7,250", "of 10,000 steps", "72.5%" (accent);
  below "326 kcal / Fuel your progress" and "3 / 4 (accent) / Weekly workouts".
  Eyebrow "03 / SMALL WINS, STRONGER YOU". Title "Achieve your goals.\nBuild your better."
  Body "Set personal step and calorie goals. Celebrate steady progress with clear insights that keep you moving forward." Button "Get Started".

### 05 User Setup
Back arrow + title "Make it personal" / subtitle "A few details. A better fit."
Eyebrow "YOUR STARTING POINT". Body "Your profile helps tailor your goals and estimate the energy you use."
Fields (label 13/600 above, input radius 16, ~52 high, surface bg, unit suffix in secondary text):
"Full name" | row of 3: "Age" (years), "Weight" (kg), "Height" (cm) | "Daily step goal" (steps) + helper
"A great starting goal. You can change this anytime."
"What moves you?" (lead) — 4 option cards (icon, label 15/600, radio circle on right):
Stay Active (footsteps), Lose Weight (flame), Build Fitness (dumbbell), Maintain Health (heart).
Selected = primary border 1.5 + tinted bg + check-circle.
Button "Continue" (arrow). Footnote "Your information stays on this device. No account or cloud upload required."

### 06 Activity Permission
Back arrow + "Let every step count". Tinted hero card: footsteps icon + "YOUR MOVEMENT → YOUR PROGRESS".
Lead "Automatically count steps using your device's motion sensors and supported health integrations."
Card with 3 rows (icon + title + caption):
- Motion & fitness — "Count steps and active movement." (pulse icon)
- Health connection — "Read activity from Apple Health on iOS or Health Connect on Android." (heart-pulse)
- Private by design — "Stored locally. Never sold or shared." (shield-check)
Note "You choose what to allow in the next system prompt. You can revoke access in Settings at any time."
Primary button "Enable Activity Access" (shield icon). Text button "Use Manual Logging Instead" (primary).

### Shared app chrome
Bottom navigation (surface bg, top hairline border): Home (house), Activity (footsteps), Workout (dumbbell),
Progress (bar-chart-up), Profile (user). Icon ~22 + caption 11. Active = primary color + 600 weight.
Page header (tabs): Title 32/700 + subtitle body secondary. Status pill: tinted primary bg, icon + label 13/600 primary.
List row ("History Row"): 48 tinted-square icon (radius 12), title 15/600, line 2 "32 min · 108 kcal" secondary,
line 3 "Today · 7:10 AM" caption, optional "· Manual" suffix, chevron right; hairline separators.
Stat card: surface, radius 20–24, 1px border, value 24/700 + unit 13 secondary, label 13 secondary.
Secondary button: tinted primary bg (#EAF3EE light / surface-ish dark), primary text, plus icon, 52 high.

### 07 Home Dashboard (tab Home)
Header: avatar 40 round, date caption "Saturday, November 7, 2026", "Good Morning, Alex!" heading 20/700; bell icon right.
Hero card (secondary bg #123D2D, radius 24): "Your daily stride" (white 17) + right "● Tracking enabled" (accent caption).
Accent ring (track = white 15%), footsteps icon, value 40/700 white, "of 10,000 steps", "72.5%" accent.
"2,750 steps to your goal" (white 15/600), "A little movement. A stronger everyday." (white 70%).
"Today at a glance" — 2x2 stat cards with icon: Steps 7,250 | Distance 5.2 km | Activity energy 326 kcal | Active time 42 min.
Card "Your week in steps" + "View all" link; big "45,350" + "Nov 2–8 · week so far"; axis label "10k steps";
legend "● Current day"; 7 bars M–S, past days tinted, current day primary, future day empty stub.
"Make your next move": primary "Start Workout" (play icon); two secondary: "+ Log Activity", "View Progress" (chart icon).
"Recent workouts" + "See history": 3 history rows.
Greeting varies by time of day (Good Morning / Afternoon / Evening).

### 08 Activity — Tracking Enabled (tab Activity)
Title "Activity", date subtitle. Pill "Tracking enabled" (shield) + right caption "Updated 9:41 AM".
Card: primary ring on light track, 7,250 / of 10,000 steps / 72.5%, "2,750 steps remaining" (primary 15/600),
source caption "Device motion + connected health data".
Two stat cards: Distance 5.2 km, Activity energy 326 kcal.
Card "Movement by hour": "Peak block: 6–8 AM · 3,950 steps"; axis caption "4k steps · 2-hour blocks", "Today" link;
12 bars (2h blocks), peak primary, others tinted, empty = flat stub; x labels 0h · 6h · 12h · 18h (current block bold primary).
"Your day in motion": rows (no chevron) e.g. "Morning walk / 32 min · 3,950 steps / 7:10 AM",
"Everyday movement / 10 active min · 3,300 steps / 8:30 AM".
Secondary button "+ Log Activity Manually". Footnote "Activity energy includes all movement today. Workout estimates are part of this total, not added twice."

### 09 Activity — Permission Needed
Same header. Pill "Step tracking is off". Card: tinted icon tile (footsteps), two dashes "— —",
"Step data unavailable" caption, heading "A little access.\nA clearer picture." (24/700 centered),
body "Allow motion and health access to see your steps, distance and hourly movement. Nothing is tracked until you choose."
Primary "Enable Activity Permission" (shield). Secondary "+ Log Activity Manually".
Info card: "You're always in control." / "Manual workouts stay available without sensor access. Review or revoke permissions in Profile → Step Tracking Permissions."

### 10 Workout (tab Workout)
Title "Find your movement" / "Every session is a step forward." Pill "THIS WEEK · NOV 2–8".
3 stat cards: "3 Workouts", "100 min Duration", "594 kcal Est. energy".
"Choose your workout": 7 option cards (icon, label, radio): Walking (footsteps), Running (pulse), Cycling (bike),
Gym Training (dumbbell), Strength Training (biceps), Yoga (person), Other Activities (dots). Selected = tinted + primary border + check.
Caption "Selected: Running". Primary "Start Workout" (play). Text button "+ Log a Past Activity".
"Workout history" + "View all": 3 history rows. Footnote "Calories are estimates based on activity, duration and your profile. Weekly active time also includes everyday movement."

### 11 Timer Ready (no tab bar)
Back arrow + "Running" / "A fresh start. Make it yours." Pill "○ Ready to start".
Large ring (~280) light track only; pulse icon; "00:00" 64/700; caption "READY WHEN YOU ARE" (letter-spaced).
"Session goal · 30 minutes". Stat cards "0 kcal Estimated energy", "0.0 km Session distance".
Primary "Start" (play). Text "Change Activity". Footnote "The timer starts only when you tap Start. Calorie estimates use your activity and profile."

### 12 Timer Active (no back arrow)
"Running" / "Stay in your rhythm." Pill "Workout in progress" (pulse). Ring progress primary = elapsed/goal.
"24:38", "ELAPSED TIME". "24:38 / 30:00 · 82.1% complete". Stat cards "218 kcal Estimated energy", "3.4 km Est. distance".
Primary "Pause" (pause icon). Secondary "Finish Workout" (square icon).
Footnote in design: "Session preview · illustrative values, not a live sensor feed. Estimates are not medical measurements."
(Implementation: show only "Estimates are not medical measurements." since values are real.)

### 13 Timer Paused
"Running" / "Take a breath. Your progress is safe." Pill "Paused · values frozen" (pause icon).
Ring stroke turns neutral grey-green (#5F6F66 light / #A0B0A8 dark), pause icon, "24:38", "TIMER PAUSED".
Same progress line + stat cards. Primary "Resume" (play), secondary "Finish Workout".
Footnote: "Time and estimates remain unchanged until you resume."

### 14 Manual Activity Logging
Back + "Log an activity" / "Your effort counts, however you record it." Pill "Manual entry" (pencil).
Fields: "Activity type" select (chevron) e.g. Yoga | "Date" ("November 7, 2026", right hint "Today") |
row "Start time" (8:00 AM) + "Duration" (20 min) | "Calories" (60 kcal) + helper "Estimated automatically · editable override".
Info card "An estimate, not a measurement." / "We use your activity type, 20-minute duration and 72 kg profile to estimate energy.
Adjust the calories above if you have a more accurate figure." + primary caption "Saved entries are labelled "Manual"."
Primary "Save Activity" (check). Text "Cancel". Footnote "Stored on this device. You can edit or delete manual entries in Activity History."

### 15 Workout Summary
Title "Workout complete". Secondary hero card: accent circle with check, "Strong finish, Alex." (24 white),
"Running · Saturday, Nov 7", "9:10 AM – 9:34 AM".
Stat cards with icons: "24:38 Total duration" (timer), "218 kcal Estimated energy" (flame).
Card "Your session, in numbers": key/value rows — Est. distance 3.4 km | Average pace 7:15 / km |
30-minute goal 82.1% complete | Activity type Running. (Distance/pace only for distance activities.)
Pill "Not saved yet" (bookmark). Primary "Save Workout" (check). Text "Back to Dashboard".
Footnote "Not yet included in today's totals. Saving adds this workout once. Energy and distance are estimates."

### 16–18 Progress (tab Progress) — shared
Title "Your progress" + subtitle (Daily "Small efforts. Measurable change." / Weekly "Consistency is your strongest metric." /
Monthly "See the bigger picture."). Segmented "Period Tabs" (track tinted grey radius 16, selected = surface pill, primary text 600).
Date selector card: calendar icon + label + chevron-down ("Saturday, Nov 7, 2026" / "Nov 2–8, 2026 · this week" / "November 2026").

16 Daily: 2x2 stat cards with icons (Steps, Activity energy, Distance, Active time). Card "Steps through your day":
insight "Your morning walk made up 54.5% of today's steps." + hourly 2h-block chart (as on 08).
Card "Daily goals": linear progress rows "Step goal 72.5% — 7,250 / 10,000 steps", "Activity energy 65.2% — 326 / 500 kcal".
Tinted encouragement card "You're building momentum." / "Just 2,750 more steps to close your daily goal. A short evening walk is a good next move."

17 Weekly: stat cards "45,350 Total steps", "1,917 kcal Activity energy". Card "Weekly steps" "7,558 daily average · 6 days recorded"
(10k steps axis, Current day legend, 7 bars). Card "Weekly activity energy" "320 kcal daily average · estimated" (500 kcal axis).
Card "Showing up counts": 7 day squares (primary = workout day, tinted = no workout) M..S;
"Workout goal 75% — 3 / 4 workouts · one more to go", "Active minutes 78.9% — 142 / 180 min · includes everyday movement".
Footnote "Week in progress · Sunday is upcoming, not a missed day. Session durations total 100 min; everyday activity adds 42 min this week."

18 Monthly: stat cards "53,550 Steps · month to date", "7,650 Daily average". Card "Your movement trend"
"Nov 1–7 · compared with Oct 25–31", "10k steps" axis, "↑ 12.4%" (primary), line chart with points, x labels Nov 1/3/5/7.
Card "Consistency calendar" "7 active days · 4 workouts so far": Mon-first month grid; workout days tinted square,
today filled primary w/ white text, future dates muted. Legend "● Workout day ● Today  Future dates are muted".
Card "<Goal name> · monthly goals" (e.g. "Build Fitness · monthly goals"): Workout consistency 25% 4 / 16 workouts;
Active minutes 30.1% 217 / 720 minutes; Step volume 17.9% 53,550 / 300,000 steps.
Footnote "Month to date: Nov 1–7. Monthly targets reflect 4 workout weeks and 30 daily step goals. Keep your own pace."

### Goal defaults derived from design
Daily steps 10,000 · Daily activity energy 500 kcal · Weekly workouts 4 · Weekly active minutes 180.
Monthly = weekly×4 (workouts, minutes); steps = daily×30.

### Calorie calibration (design examples, 72 kg)
Yoga 20 min → 60 kcal (MET 2.5). Walk 32 min → 108 (≈MET 2.8). Strength 40 min → 240 (MET 5.0).
Run 24:38 → 218, run 28 min → 246 (≈MET 7.3). Weekly 594 kcal = sum of the 3 workouts; 100 min = 32+40+28.
Run 24:38 → 3.4 km (pace 7:15/km ≈ 8.3 km/h).

### 19 Goals Management (from Home/Profile; Progress tab highlighted in design)
Back + "Goals that move you" / "Make progress personal." Pill with fitness-goal icon + name (e.g. "Build Fitness").
Lead "A balanced set of targets for a stronger everyday. Adjust them as your routine evolves."
4 goal cards (icon top-left, "✎ Edit Goal" link top-right, title 15/600 + % right (primary), linear progress,
"x / y unit", remaining line):
- Daily steps — 7,250 / 10,000 steps — "2,750 steps remaining today"
- Weekly workouts — 3 / 4 workouts — "1 workout remaining this week"
- Daily activity energy — 326 / 500 kcal — "174 kcal remaining · estimated"
- Weekly active minutes — 142 / 180 min — "38 active minutes remaining"
Footnote "Daily goals reset at midnight. Weekly goals run Monday–Sunday. Current week: November 2–8, 2026."
Edit Goal opens bottom sheet (see Supporting States).

### 20 Activity History (tab Activity highlighted)
Back + "Activity history" / "A record of showing up." Month selector card ("November 2026", chevron).
Filter chips 3-col grid: All Activities (selected = secondary bg, white text), Walking, Running, Cycling, Gym, Other.
Section header "November" + right "4 workouts · 155 min". History rows with ⋮ menu (instead of chevron).
Selected manual entry shows inline tinted panel: "✎ Strength training · Manual entry" / "Recorded Nov 6 at 6:15 PM.
Manage the entry below or use its menu." + buttons "✎ Edit Activity" (tinted) and "🗑 Delete" (outline, error text/icon).
Primary "+ Log Activity".

### 21 Profile & Settings (tab Profile)
Title "Your profile". Card: avatar 64, name (20), goal badge pill (icon + "Build Fitness"), 3 stats "29 years | 72 kg | 178 cm".
Settings list card (rows: icon primary, label 15, value caption right, chevron):
Edit Profile | Daily Goals | Notification Preferences (On) | Step Tracking Permissions (Enabled) |
Dark Mode (switch) | Units — sub "Metric / Imperial" (Metric) | Privacy Settings (Local only) | About FITTRACK (v1.0).
Footer: shield icon + "Your health. Your data. Your device. Built local-first, with no account required."

### 22 Edit Profile (no tab bar)
Back + "Edit profile" / "Keep your starting point up to date." Avatar 56 + name + "Change photo" (primary link).
Fields: Full name | Age (years) | Weight (kg) + Height (cm) | "Fitness goal" 4 option cards (same as 05).
Footnote "Profile changes apply to future calorie estimates. Previously saved activities keep their recorded values."
Primary "✓ Save Changes", text "Cancel".

## D Supporting States ("Every state deserves intention.")
1. Empty history — notebook-pen icon, "Your first move starts here.", "No activities recorded yet. Start a workout or add something you've already done.", primary "▷ Start a Workout", secondary "Log Activity Manually".
2. Loading dashboard — pill "Loading your local activity…", skeleton (avatar circle + 2 lines, big card, 2 small cards). Caption "No placeholder numbers presented as real activity."
3. Save error / retry — error "!" circle icon, "Activity wasn't saved.", "We couldn't write to local storage. Your Yoga entry is still here: 20 min, 60 kcal. Free some device space, then try again.", primary "↻ Retry Save", secondary "Keep Editing", error caption "Not saved · dashboard totals unchanged".
4. Permission request (pre-prompt) — shield-check, "Allow activity access?", "FITTRACK uses device motion and your chosen health connection to count steps. Only requested activity data is read and stored locally.", pill "Apple Health / Health Connect", primary "Continue to System Permission", secondary "Not Now · Log Manually", caption "The next prompt is controlled by iOS or Android. This is a pre-permission explanation, not an OS dialog."
5. Permission denied — shield-alert (error), "Step access is off.", "No sensor data is available. You can change access in your device settings, or continue with manual activity logging.", caption lines "iOS: Settings → Privacy & Security → Motion & Fitness" / "Android: Settings → Apps → FITTRACK → Permissions" / "Health access is managed separately in your health app.", primary "Open Device Settings", secondary "Log Activity Manually".
6. Edit Goal bottom sheet — grabber, "Edit daily step goal" + ✕, "Current target · 10,000 steps", label "New daily target", input focused (primary border) "12,000 steps", helper "Suggested range: 3,000–20,000 steps.", preview "Today: 7,250 / 12,000 · 60.4% after saving. Your recorded steps stay the same.", primary "Save Goal", secondary "Cancel".
7. Date range sheet — "Choose date range" + ✕, segmented chips Today / This week / This month (selected tinted), "From" / "To" date inputs, caption "Current week · Sunday is upcoming.", primary "Apply Range", secondary "Cancel".
8. Delete manual activity dialog — trash icon (error), "Delete manual activity?", "Strength training · Nov 6, 6:15 PM · 40 min · 240 kcal. Deleting removes this entry from your history and recalculates your totals. This cannot be undone.", outline danger "Delete Activity", secondary "Cancel".
9. Manual form validation — pill "Validation example · separate state", "Check your activity details.", Duration * with error border, placeholder "Enter value", error "Duration is required. Enter at least 1 minute.", Calories disabled "—" with "Estimate available after a valid duration."
10. Saved feedback — tinted banner (check-circle) "Activity saved on this device" / "Yoga · Nov 7, 8:00 AM · 20 min · 60 kcal"; "Your updated dashboard" with stat cards "386 kcal — 326 + 60 activity energy", "62 min — 42 + 20 active minutes"; lines "Weekly workouts: 4 / 4 ✓", "Weekly active minutes: 162 / 180", "Steps stay 7,250 / 10,000; distance stays 5.2 km."; primary "Back to Dashboard", secondary "View Activity".
   → Rule: manual activities add to energy + active minutes + workout count, never to steps/distance.

## Components (C pages)
Button variants: primary (primary bg, white text… text is #052A1B on light? — design uses dark-green label "#052A1B" on primary per a11y note), secondary-dark (#123D2D/#0C1511 bg, primary-light text), tinted (#EAF3EE bg, primary text), outline danger (border text-primary, error label), loading (spinner icon), disabled (grey #E3E8E5 bg, #8A958F text). Heights 56 (primary) / 48 compact; radius 16; icon 18 + 8 gap; label 15/600.
Input: label 13/600 above; field 52 high radius 16 surface bg 1px border; suffix unit right in secondary; helper caption below.
States: default, focused (1.5px primary border), error (error border + error helper), disabled (tinted bg, muted text), read-only ("Device-recorded fields are read-only.").
Activity card (selectable option), Stat card, Switch (primary track on), Status badge (tinted pill), History row, Period tabs, Bottom navigation, Linear progress (8 high, rounded, track #E3E8E5), Ring, Chart legend (dot + label), Dialog, Bottom sheet (grabber 36x4, radius 28 top).

## Accessibility notes (Design System page)
44 px minimum touch targets · 56 px primary controls · selected states use shape + label, not color alone.
Brand emerald is used for large controls; dark-green aliases carry small text on light backgrounds:
Action text / light #087C4B · Body secondary / light #65736B · Body secondary / dark #A0B0A6 ·
Primary labels #052A1B (4.79:1 on #16A36A; pressed primary controls use white on forest) · Error text #B83232 (5.93:1 on white).
Shadows: Flat = no shadow, 1px semantic border. Raised = x0 y4 blur16 #123D2D @ 8%.
