# /android-run — Run InterFastApp on Device

Launch InterFastApp on the connected Seeker/Android device. Builds if needed, installs, and starts Metro.

---

## Prerequisites (check silently, fix if needed)

```bash
adb devices   # must show a device as "device", not "unauthorized"
```

- If **unauthorized**: ask user to accept USB debugging prompt on device.
- If **no device**: ask user to connect device and enable USB debugging.

---

## Kill Android Studio (CRITICAL — prevents Gradle deadlock)

```bash
pgrep -f "Android Studio" && pkill -f "Android Studio" && echo "Killed AS" || echo "AS not running"
```

Wait 2s after killing before building.

---

## Kill any existing Metro on port 8081

```bash
lsof -ti:8081 | xargs kill -9 2>/dev/null; echo "Port 8081 clear"
```

---

## Build & Install

```bash
cd android && ./gradlew assembleDebug --no-daemon --max-workers=4 && cd ..
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb reverse tcp:8081 tcp:8081
```

Expected: `BUILD SUCCESSFUL` then `Success` on install.

**If hangs at `mergeLibDexDebug`:** Android Studio daemon leaked. Run `./gradlew --stop` then retry.

---

## Start Metro (background)

```bash
npx expo start --port 8081 &
```

Wait ~5 seconds for Metro to be ready before launching.

---

## Launch App

```bash
# Clear cached crash state
adb shell pm clear com.interfast.app

# Launch via deep link → connects directly to Metro
adb shell am start -a android.intent.action.VIEW \
  -d "exp://localhost:8081" \
  -n com.interfast.app/.MainActivity
```

The expo-dev-client modal will appear. Tap `http://localhost:8081`.

---

## Verify (take screenshot)

```bash
adb shell input keyevent KEYCODE_WAKEUP
sleep 8
adb exec-out screencap -p > /tmp/app-launch.png
```

Read the screenshot and confirm the app loaded. If the disclaimer modal is gone (already accepted), verify the Track tab is visible.

---

## Quick Reload (no rebuild needed)

If the APK is already installed and only JS changed:

```bash
lsof -ti:8081 | xargs kill -9 2>/dev/null
npx expo start --port 8081 &
sleep 5
adb reverse tcp:8081 tcp:8081
adb shell am start -a android.intent.action.VIEW \
  -d "exp://localhost:8081" \
  -n com.interfast.app/.MainActivity
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Hangs at `mergeLibDexDebug` | `pkill -f "Android Studio"` + `cd android && ./gradlew --stop` + retry |
| Black screenshot | `adb shell input keyevent KEYCODE_WAKEUP` |
| Crash on launch | `adb shell pm clear com.interfast.app` then relaunch |
| Old code loaded | Metro not running — restart Metro + `adb reverse tcp:8081 tcp:8081` |
| `RNSVGGroup` crash | `react-native-svg` missing from package.json — add `"react-native-svg": "15.8.0"` |
| expo-dev-client launcher shown | Metro not ready — wait longer before deep link launch |
