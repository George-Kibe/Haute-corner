# Upgrade record: Expo SDK 54 to 58

Completed 30 October 2026. This records what changed, how it was checked, and what was not tested. It is not yet committed.

## Versions

| Package | Before | After |
| --- | --- | --- |
| `expo` | 54.0.20 | 58.0.21 |
| `react-native` | 0.81.5 | 0.88.1 |
| `react`, `react-dom` | 19.1.0 | 19.3.0 |
| `expo-router` | 6.0.13 | 58.0.28 |
| `react-native-reanimated` | 4.1.3 | 4.7.1 |
| `react-native-worklets` | 0.5.1 | 0.13.0 |
| `react-native-gesture-handler` | 2.28.0 | 3.3.0 |
| `react-native-screens` | 4.16.0 | 4.30.1 |
| `@expo/ui` | 0.2.0-beta.7 | 58.0.25 |
| `typescript` | 5.9 | 6.0.3 |
| `eslint-config-expo` | 10.0.0 | 58.0.4 |

All other Expo packages moved to their 58.x versions with `expo install --fix`.

**Added:** `expo-updates` 58.0.19, `expo-image-picker` 58.0.10, `expo-notifications` 58.1.7, `@react-native-google-signin/google-signin` 17.0.0.

**Moved to latest:** `react-native-toast-message` 2.5.2, `react-native-mmkv` 4.3.2, `react-native-nitro-modules` 0.37.1, `@reduxjs/toolkit` 2.13.0, `react-redux` 9.3.1, `@tanstack/react-query` 5.105.0, `axios` 1.21.0, `zustand` 5.0.16, `@expo/vector-icons` 15.1.1, `eslint` 9.39.5 (kept on ESLint 9).

**Removed:** `@react-navigation/native`, `@react-navigation/elements`, `@react-navigation/bottom-tabs`. Expo Router no longer depends on React Navigation since SDK 56.

## Code and configuration changes

| File | Change | Why |
| --- | --- | --- |
| `app.json` | Removed `newArchEnabled` and `android.edgeToEdgeEnabled` | [Removed in SDK 55](https://expo.dev/changelog/sdk-55) |
| `app.json` | Added `runtimeVersion` and `updates.url` | `expo-updates` |
| `app.json` | Added plugins for `expo-image-picker`, `expo-notifications` and Google Sign-In, with `expo-font`, `expo-image`, `expo-status-bar` and `expo-web-browser` added by `expo install` | Required configuration |
| `eas.json` | Added a `channel` to each build profile | `expo-updates` |
| `plugins/with-gradle-memory.js` | New config plugin | Android release builds ran out of memory ([ADR-021](DECISIONS.md#adr-021-raise-gradles-memory-through-a-config-plugin)) |
| `app/_layout.tsx`, `components/haptic-tab.tsx` | Imports moved from `@react-navigation/*` to `expo-router/react-navigation` and `expo-router/js-tabs`, using Expo's codemod | [SDK 56 router change](https://docs.expo.dev/router/migrate/sdk-55-to-56/) |
| `app/(stack)/_layout.tsx`, `app/(stack)/products/_layout.tsx` | Added `headerTransparent: false` | [iOS 26+ draws content under transparent headers](https://docs.expo.dev/router/migrate/sdk-57-to-58/) |
| `app/(tabs)/_layout.tsx` | Tab icons use `color as string` | React Native's stricter `ColorValue` type |
| `components/ui/icon-symbol.tsx` | Mapping keys use `Extract<SymbolViewProps['name'], string>` | `expo-symbols` names can now be objects |

After this work, running `expo prebuild` changed the `android` and `ios` scripts in `package.json` to `expo run:android` and `expo run:ios`. That is the expected effect of prebuild, and they are left that way.

Separately from the upgrade, the `preview` and `production` profiles in `eas.json` now set `android.buildType` to `apk`. See the [open items](DECISIONS.md#open-items) on Google Play.

## Verification

| Check | Result |
| --- | --- |
| `expo-doctor` | 20 of 20 passed |
| `expo install --check` | Dependencies up to date |
| TypeScript | 16 errors on SDK 54, 16 now, none caused by the upgrade ([details](KNOWN_ISSUES.md#typescript-errors)) |
| ESLint | No errors, 13 warnings |
| `expo export` for iOS, Android and web | Succeeded |
| `expo prebuild` | Succeeded, generating `SceneDelegate.swift`, the Google URL scheme, permission strings and updates configuration |
| iOS Release build, Xcode 27.1 | Succeeded |
| iOS run, iPhone 17 simulator on iOS 27 | Launched with no crash. Tabs, header and product details rendered, with content below the opaque header |
| Android Release build with R8, using only the Gradle plugin | Succeeded |
| Android run, Pixel Tablet emulator | Launched with no crash, deep links opened product details and the cart, and the logs showed no missing classes or fatal errors |

The home screen shows "Error Fetching Products" on both platforms. That is the expected result of the old API returning 401, not an upgrade problem.

## What has not been tested

- **Physical devices.** Everything above ran on a simulator or emulator.
- **EAS cloud builds.** The Gradle plugin should apply there too, but only local builds were run.
- **Newly added libraries in use.** Google Sign-In, push notifications, the image picker, Expo UI and OTA updates compile and are configured, but no code calls them yet. Their real test comes in their roadmap phases.
- **The iOS cart and order tracking screens.** A system prompt blocked deep links on the simulator. They share the same header setting as the verified product details screen, and the cart was checked on Android.
- **Live product screens.** No working API exists to supply products.

## Breaking changes reviewed

| Change | Effect on this app |
| --- | --- |
| Legacy Architecture removed (SDK 55) | Already on the New Architecture |
| `notification` field removed from `app.json` (SDK 55) | Not used; the plugin is used instead |
| `eas update` requires `--environment` (SDK 55) | Noted in [Deployment](DEPLOYMENT.md#over-the-air-updates) |
| Expo Router dropped React Navigation (SDK 56) | Fixed with the codemod |
| Minimum iOS 16.4 (SDK 56) | Devices such as iPhone 6s and 7 are no longer supported |
| `expo/fetch` is the global `fetch` (SDK 56) | No change needed |
| `@expo/vector-icons` deprecated (SDK 56) | Still works; replaced in Phase 2 |
| Strict TypeScript API (SDK 58) | Two type fixes, listed above |
| Removed RN APIs: `InteractionManager`, `Touchable` export, `Modal animated`, some `StatusBar` props (SDK 58) | Not used |
| iOS scene lifecycle (SDK 58) | Generated by prebuild. No custom `AppDelegate` |
| iOS 27 can resize iPhone apps (SDK 58) | Check layouts in Phase 2 |
| Transparent iOS headers (SDK 58) | Fixed for stack screens |
| R8 on by default (SDK 58) | Needed the Gradle memory fix |
| Foreground notifications show by default (SDK 58) | Considered in Phase 7 |
| Fingerprint `balanced` preset (SDK 58) | Works with the chosen update policy |
| Expo Go supports only SDK 58, and is unsuitable here | Development builds are required |

## Toolchain requirements

| Tool | Requirement | Used for this upgrade |
| --- | --- | --- |
| Node.js | 22.13+, 24.3+ or 26+. Odd-numbered versions are not supported | 24.21.0 |
| Xcode | 27 recommended. SDK 58 builds with the iOS 27 SDK | 27.1 |
| JDK | 21 used successfully | 21.0.12 |
| bun | Lockfile in use | 1.3.14 |
| EAS CLI | At least 16.26.0 by `eas.json` | 27.1.0 |

## Sources

- [How to upgrade to SDK 58](https://expo.dev/blog/how-to-upgrade-to-sdk-58)
- Changelogs: [SDK 55](https://expo.dev/changelog/sdk-55), [SDK 56](https://expo.dev/changelog/sdk-56), [SDK 57](https://expo.dev/changelog/sdk-57), [SDK 58](https://expo.dev/changelog/sdk-58)
- Router migration: [SDK 55 to 56](https://docs.expo.dev/router/migrate/sdk-55-to-56/), [SDK 57 to 58](https://docs.expo.dev/router/migrate/sdk-57-to-58/)
