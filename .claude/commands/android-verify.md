# /android-verify — Android Build Verification

Run a full pre-build verification, clean build, deploy, and launch check for InterFastApp on the connected Android device. Fix any issues found before proceeding to the next step.

---

## Step 1 — Environment

Run these checks. Stop and fix any failure before continuing.

```bash
node --version          # must be 18+
java -version           # must be 17+
echo $ANDROID_HOME      # must be set (e.g. /Users/erikhigbee/Library/Android/sdk)
adb devices             # must show SM02G40619128783 (or another device) as "device"
```

**If adb shows "unauthorized":** unlock the device and accept the USB debugging prompt.
**If adb shows nothing:** check USB cable, toggle USB debugging off/on.

---

## Step 2 — Project State

```bash
# TypeScript must be clean
npx tsc --noEmit

# react-native-svg must be in package.json dependencies
# (required peer dep for lucide-react-native — DO NOT remove it)
grep '"react-native-svg"' package.json

# Metro should not already be running on 8081
lsof -ti:8081
```

**If tsc has errors:** fix them before building.
**If react-native-svg missing from package.json:** add `"react-native-svg": "15.8.0"` to dependencies, then rebuild.
**If port 8081 is in use:** kill it with `lsof -ti:8081 | xargs kill -9` or identify and reuse the existing Metro process.

---

## Step 3 — Gradle Daemon Check (CRITICAL)

Android Studio's Gradle daemon will deadlock the `mergeLibDexDebug` task indefinitely.

```bash
# Check if Android Studio is running
pgrep -f "Android Studio" && echo "RUNNING — must kill" || echo "Not running — safe"
```

**If running:** `pkill -f "Android Studio"` and confirm it closed before building.

---

## Step 4 — Build

```bash
cd android
./gradlew assembleDebug --no-daemon --max-workers=4
cd ..
```

Expected: `BUILD SUCCESSFUL` in ~1-2 minutes.

**If it hangs at `mergeLibDexDebug`:** Android Studio is still running. Kill it and retry.
**If it fails with `RNSVGGroup` at runtime (not build time):** react-native-svg is missing from package.json — see Step 2.
**If Gradle version error:** check `android/gradle/wrapper/gradle-wrapper.properties` — should be Gradle 8.x.

---

## Step 5 — Install & Deploy

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb reverse tcp:8081 tcp:8081
```

Expected: `Success` on install.

---

## Step 6 — Start Metro

Open a new terminal tab and run:
```bash
npx expo start --port 8081
```

Wait for `Metro waiting on exp://...` before continuing.

---

## Step 7 — Launch App

```bash
# Clear any cached crash state from previous sessions
adb shell pm clear com.interfast.app

# Launch via deep link so expo-dev-client connects directly to Metro
adb shell am start -a android.intent.action.VIEW -d "exp://localhost:8081" -n com.interfast.app/.MainActivity
```

The expo-dev-client "Deep link received" modal will appear. Tap `http://localhost:8081` to load the bundle.

---

## Step 8 — Verify

After the app loads:

1. **Disclaimer modal** should appear on first launch (clear app data if testing fresh state)
2. Tap "I Understand & Accept"
3. Verify **Track tab** shows fasting UI
4. Tap **History tab** — should show empty state with clock icon
5. Tap **About tab** — should show app info + Privacy Policy / Terms of Use links

Take a screenshot for confirmation:
```bash
adb exec-out screencap -p > /tmp/verify.png
```

---

## Known Issues & Fixes

| Symptom | Root Cause | Fix |
|---------|-----------|-----|
| Hangs at `mergeLibDexDebug` | Android Studio Gradle daemon lock | `pkill -f "Android Studio"` then `--no-daemon` |
| `No ViewManager found for class RNSVGGroup` | `react-native-svg` missing from package.json | Add it back — lucide-react-native requires it |
| Black screenshot | Device screen is sleeping | `adb shell input keyevent KEYCODE_WAKEUP` |
| Crash report on launch | Cached crash from previous bad build | `adb shell pm clear com.interfast.app` then relaunch |
| App loads old code | Connected to old/embedded bundle | Ensure Metro is running and use deep link launch |
| expo-dev-client shows launcher instead of app | Metro not running or adb reverse not set | Start Metro + `adb reverse tcp:8081 tcp:8081` |
