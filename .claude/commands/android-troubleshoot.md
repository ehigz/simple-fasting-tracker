# /android-troubleshoot — InterFastApp Android Troubleshooting

Systematic diagnosis for InterFastApp Android build and runtime issues. Work through the phases below — validate before you fix.

---

## Phase 0 — Identify Error Class

Before doing anything, classify the error:

| Where it fails | Error class | Go to |
|---------------|-------------|-------|
| `./gradlew assembleDebug` hangs or errors | Build | Phase 1 |
| App crashes on launch (red screen / crash report) | Runtime native | Phase 2 |
| App shows wrong UI / old code | Bundle loading | Phase 3 |
| TypeScript errors in editor | Type | Phase 4 |
| `adb` not finding device | Environment | Phase 5 |

---

## Phase 1 — Build Failures

### Hangs at `mergeLibDexDebug`
**Root cause:** Android Studio's Gradle daemon holds a lock on the task.
```bash
pgrep -f "Android Studio"       # confirms it's running
pkill -f "Android Studio"       # kill it
./gradlew assembleDebug --no-daemon --max-workers=4   # retry
```
Always use `--no-daemon` when Android Studio might be running.

### Gradle version / AGP mismatch
```bash
cat android/gradle/wrapper/gradle-wrapper.properties | grep distributionUrl
cat android/build.gradle | grep "com.android.tools.build:gradle"
```
This project uses Gradle 8.x + AGP 8.x. If mismatched, align them.

### Build fails after removing a package from `package.json`
Autolinking regenerates native configs from `package.json`. If you remove a native package:
- Its ViewManager disappears from the APK
- Any JS code still importing it will crash at runtime with `No ViewManager found for class X`
- **Critical known case:** `react-native-svg` is a peer dep of `lucide-react-native`. It MUST stay in `package.json` even if not directly imported.

---

## Phase 2 — Runtime Native Crashes

### `No ViewManager found for class RNSVGGroup`
**Root cause:** `react-native-svg` was removed from `package.json`. Lucide icons use SVG under the hood.
```bash
grep '"react-native-svg"' package.json    # must exist
```
Fix: add `"react-native-svg": "15.8.0"` to dependencies, then rebuild.

### Crash report screen on launch
expo-dev-client caches the last crash. It shows on the next launch even if you've fixed the issue.
```bash
adb shell pm clear com.interfast.app    # clears crash cache + app storage
```
Then relaunch fresh.

### App launches then immediately closes
Metro is not running. expo-dev-client tries to connect, times out, and the system kills the activity.
```bash
curl http://localhost:8081/status    # should return "packager-status:running"
adb reverse tcp:8081 tcp:8081        # ensure port forwarding is set
npx expo start --port 8081           # start Metro if not running
```

---

## Phase 3 — Bundle Loading Issues

### App shows old code (wallet screens, old UI)
The app loaded the EMBEDDED bundle baked into the APK — not the live Metro bundle.
This happens when expo-dev-client can't reach Metro at launch.

Full fix sequence:
```bash
# 1. Start Metro
npx expo start --port 8081

# 2. Ensure port forwarding
adb reverse tcp:8081 tcp:8081

# 3. Use deep link to force Metro connection
adb shell am start -a android.intent.action.VIEW -d "exp://localhost:8081" -n com.interfast.app/.MainActivity

# 4. In the "Deep link received" modal that appears, tap http://localhost:8081
```

### expo-dev-client shows launcher screen instead of app
Normal behaviour — dev builds don't auto-open the app. You must either:
- Tap the server URL in the launcher
- Use the deep link above (preferred — bypasses the launcher)

### Black screenshot from `adb exec-out screencap -p`
Device screen is off (sleeping). Wake it first:
```bash
adb shell input keyevent KEYCODE_WAKEUP
sleep 2
adb exec-out screencap -p > /tmp/screen.png
```

---

## Phase 4 — TypeScript Errors

Always check before building — a clean TS state means no surprises:
```bash
npx tsc --noEmit
```

### `TypographyProps` / `MutedText` / `BodyText` don't accept `style` prop
These UI primitives only accept `className`. Replace `style={{...}}` with the equivalent `className="..."` (NativeWind utility classes).

### Import errors after removing packages
After removing a package from `package.json`, grep for any remaining imports:
```bash
grep -r "package-name" src/ --include="*.ts" --include="*.tsx"
```

---

## Phase 5 — Environment / ADB

```bash
adb devices                    # should show device as "device" not "unauthorized"
echo $ANDROID_HOME             # must be set
java -version                  # must be 17+
node --version                 # must be 18+
```

### Device shows "unauthorized"
Unlock the phone → USB debugging prompt → Accept → retry `adb devices`.

### No devices listed
- Try a different USB cable
- Toggle USB debugging off and back on in Developer Options
- `adb kill-server && adb start-server`

---

## Project-Specific Invariants (Never Break These)

1. `react-native-svg` must stay in `package.json` (lucide peer dep)
2. Always use `./gradlew assembleDebug --no-daemon` — never plain `npm run android` when Android Studio might be open
3. AsyncStorage keys are FIXED: `fasting_active`, `fasting_history`, `disclaimer_accepted`
4. Zero Solana/wallet imports in `main` branch — all wallet code lives in `feat/wallet-connect`
5. `npx tsc --noEmit` must be clean before any build

---

## Quick Decision Tree

```
Error on build?
  → Hanging? → Kill Android Studio → --no-daemon
  → RNSVGGroup? → Add react-native-svg to package.json

Error at runtime?
  → Crash on launch? → pm clear + check Metro running
  → Wrong code showing? → Deep link launch, not adb start

Environment issue?
  → No device? → Check USB + toggle debugging
  → ANDROID_HOME missing? → source ~/.zshrc or set in shell profile
```
