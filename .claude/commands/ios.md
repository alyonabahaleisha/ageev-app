---
name: ios # prettier-ignore
description: iOS development — build, run on simulator/device, archive, TestFlight upload, screenshots, and debugging. Use when the user says "run ios", "build ios", "test ios", "install ios", "testflight", or references iOS-specific work.
---

# iOS Development Skill

## Context

- **Project:** `/Users/alyonayanuchek/ageev-app-rn/`
- **iOS workspace:** `ios/AgeevApp.xcworkspace`
- **Bundle ID:** `org.reactjs.native.example.AgeevApp`
- **Scheme:** `AgeevApp`
- **Team ID:** `T38J3889P8`
- **Min iOS:** set in Podfile
- **Build system:** CocoaPods (`ios/Podfile`) — use `bundle exec pod install`
- **Pods:** installed via `vendor/bundle` (use `bundle exec pod` always)

## Critical Rules

1. **Use `bundle exec pod install`** (not bare `pod install`) — gems are in `vendor/bundle`
2. **Run from project root** — `bundle exec pod install --project-directory=ios`
3. **Delete DerivedData** if builds behave strangely: `rm -rf ~/Library/Developer/Xcode/DerivedData/AgeevApp-*`
4. **Metro must be running** for JS changes to reflect — auto-started by `yarn ios`

## Available MCP Tools

Use XcodeBuildMCP tools (preferred over shell commands):
- `session_show_defaults` — check current session config (MUST call before first build)
- `session_set_defaults` — set workspace, scheme, simulator
- `build_run_sim` — build, install, and launch on simulator (single step)
- `build_sim` — build only for simulator
- `list_sims` — list available simulators
- `boot_sim` / `open_sim` — manage simulator state
- `screenshot` — capture simulator screenshot
- `snapshot_ui` — inspect UI element hierarchy
- `install_app_sim` / `launch_app_sim` / `stop_app_sim` — app lifecycle
- `start_sim_log_cap` / `stop_sim_log_cap` — capture logs
- `list_schemes` / `show_build_settings` — project inspection
- `clean` — clean build

Use ios-simulator tools for quick simulator control.

## Workflows

### Run on Simulator (recommended)
```bash
cd /Users/alyonayanuchek/ageev-app-rn
yarn ios
# or target a specific simulator:
yarn ios --simulator "iPhone 16 Pro"
```

### Run via XcodeBuildMCP
1. `session_show_defaults` — verify config
2. `session_set_defaults` with:
   - workspace: `/Users/alyonayanuchek/ageev-app-rn/ios/AgeevApp.xcworkspace`
   - scheme: `AgeevApp`
   - simulatorId (see below)
3. `build_run_sim` — builds and launches

### Install / Re-install CocoaPods
```bash
cd /Users/alyonayanuchek/ageev-app-rn
bundle exec pod install --project-directory=ios
```

### Archive for TestFlight
```bash
open /Users/alyonayanuchek/ageev-app-rn/ios/AgeevApp.xcworkspace
# Xcode: Product → Archive → Distribute App → App Store Connect → Upload
```

### Clean Build
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/AgeevApp-*
cd /Users/alyonayanuchek/ageev-app-rn
bundle exec pod install --project-directory=ios
```

### Common Simulator IDs
- iPhone 16 (iOS 18, **currently Booted**): `5E1D4824-A473-4BD9-9952-3F9BC10F6C50`
- iPhone 16 Pro (iOS 18.3): `8B99736E-3DDE-4DE4-A83F-5EDD53843946`
- Use `list_sims` for full list

## Debugging

- Use `start_sim_log_cap` to capture runtime logs
- Use `screenshot` to capture current screen state
- Use `snapshot_ui` to inspect view hierarchy and coordinates
- Use `mobile_list_elements_on_screen` (mobile-mcp) for interactive element inspection
- For interactive debugging, use `/debug` which invokes Colby
