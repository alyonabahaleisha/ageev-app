---
name: android # prettier-ignore
description: Android development — build, run on emulator/device, install APK, screenshots, and debugging. Use when the user says "run android", "build android", "test android", "install android", or references Android-specific work.
---

# Android Development Skill

## Context

- **Project:** `/Users/alyonayanuchek/ageev-app-rn/`
- **Android folder:** `android/`
- **Package:** `com.ageevapp`
- **Build system:** Gradle | React Native 0.85.3
- **compileSdk:** 36 | **minSdk:** 24 | **targetSdk:** 36
- **Android SDK:** `~/Library/Android/sdk`
- **ADB:** `~/Library/Android/sdk/platform-tools/adb`

## Critical Rules

1. **Set `ANDROID_HOME`** before Gradle: `export ANDROID_HOME=~/Library/Android/sdk`
2. **Emulator must be running** before `yarn android`
3. **Metro must be running** for JS changes — auto-started by `yarn android`
4. **ADB path** is `~/Library/Android/sdk/platform-tools/adb` (not in PATH by default)

## Available MCP Tools

Use android MCP tools:
- `list_devices` — list connected devices and running emulators
- `list_emulators` — list available AVDs
- `start_emulator_avd` — start an emulator
- `stop_emulator` — stop an emulator
- `get_screenshot` — capture device/emulator screenshot
- `get_uilayout` — inspect current UI hierarchy
- `execute_adb_shell_command` — run ADB shell commands
- `get_packages` — list installed packages

Also use mobile-mcp for cross-platform device interaction:
- `mobile_take_screenshot` / `mobile_save_screenshot`
- `mobile_click_on_screen_at_coordinates` / `mobile_swipe_on_screen`
- `mobile_type_keys` / `mobile_press_button`
- `mobile_list_elements_on_screen`
- `mobile_launch_app` / `mobile_terminate_app`
- `mobile_install_app` / `mobile_uninstall_app`

## Workflows

### Run on Emulator (recommended)
1. Start emulator via `start_emulator_avd` or:
```bash
~/Library/Android/sdk/emulator/emulator -avd <AVD_NAME> &
```
2. Run the app:
```bash
cd /Users/alyonayanuchek/ageev-app-rn
yarn android
```

### Build Debug APK
```bash
cd /Users/alyonayanuchek/ageev-app-rn/android
./gradlew assembleDebug
```

### Build Release APK
```bash
./gradlew assembleRelease
```

### Install on Device/Emulator
```bash
~/Library/Android/sdk/platform-tools/adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Run Tests
```bash
cd /Users/alyonayanuchek/ageev-app-rn/android
./gradlew test
./gradlew connectedAndroidTest
```

### Clean Build
```bash
cd /Users/alyonayanuchek/ageev-app-rn/android
./gradlew clean
```

## Debugging

- Use `get_screenshot` to capture current screen
- Use `get_uilayout` to inspect view hierarchy
- Use `execute_adb_shell_command` for ADB commands (e.g., `logcat -s ReactNative:V ReactNativeJS:V`)
- For interactive debugging, use `/debug` which invokes Colby

## Project Structure

- `android/app/src/main/java/com/ageevapp/` — Java/Kotlin native modules
- `android/app/src/main/res/` — Android resources
- `android/app/build.gradle` — app-level build config
- `android/build.gradle` — project-level build config
- `android/gradle/wrapper/gradle-wrapper.properties` — Gradle version
