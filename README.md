# FITTRACK

**Move Better. Live Stronger.**

FITTRACK is an offline fitness tracker for Android. It counts your steps, times your workouts, and shows your progress over days, weeks and months. There is no account and no cloud sync: all your data is saved only on your device.

## Download

**Android APK:** [Download FITTRACK](https://expo.dev/accounts/qaalicabdi-2/projects/fittrack/builds/9b39909b-7362-49c9-a53e-c7e3ba8efe51)

Open the link on your Android phone, tap **Install**, and allow installs from your browser if Android asks.

## Features

- **Step tracking:** counts your daily steps with Health Connect, or with the phone's step sensor if Health Connect is not installed.
- **Workout timer:** start, pause and finish sessions for walking, running, cycling, gym, strength training, yoga and more. The timer keeps going even if you close the app.
- **Manual logging:** add or edit a workout you did without the timer.
- **Calorie estimates:** based on the activity, your weight and how long you moved.
- **Goals:** set targets for daily steps, weekly workouts, daily activity energy and weekly active minutes.
- **Progress and history:** daily, weekly and monthly charts, plus a full list of past workouts.
- **Profile:** your details and an optional profile photo, stored only on the device.
- **Light, Dark and System themes:** your choice is remembered.
- **Works fully offline:** all data is stored on the device with SQLite.

## Built with

- [React Native](https://reactnative.dev/) and [Expo](https://expo.dev/) (SDK 58)
- TypeScript
- Expo Router for navigation
- SQLite (`expo-sqlite`) for local storage
- Health Connect and `expo-sensors` for step counting
- Lucide icons and the Inter font

## Run the project

You need [Node.js](https://nodejs.org/) and an Android phone or emulator.

```bash
npm install
npx expo run:android
```

Step tracking uses native code, so it does **not** work in Expo Go. Use a development build (`npx expo run:android` or `npx eas-cli@latest build --profile development`).

## Build an Android APK

This needs a free [Expo](https://expo.dev/) account.

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

When the build finishes, Expo gives you a link to download the APK.

## Check the code

```bash
npm test            # Run the automated tests
npm run typecheck   # Check the TypeScript types
npm run lint        # Check the code style
```

## Project structure

```text
src/
├── app/             Screens and navigation routes
├── components/      Reusable UI components
├── features/        Screen logic for each part of the app
├── domain/          Dates, calories, timer, goals and other app logic
├── database/        SQLite setup, migrations and repositories
├── services/        Step tracking, workouts and photo storage
├── state/           App data and step tracking providers
└── theme/           Colors, typography, spacing and themes
assets/              App icon and splash images
docs/                Design spec and project notes
test/                Test database helper
```
