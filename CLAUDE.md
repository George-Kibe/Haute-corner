# HauteCorner

A fashion marketplace for Kenya: an Expo mobile app, plus one Next.js app for the API, website and admin dashboard. Start with [readme.MD](readme.MD). The [decision log](docs/DECISIONS.md) and [roadmap](docs/ROADMAP.md) say what is settled and what comes next.

## Working rules

- **Never make decisions for the project owner.** Recommend or ask first, and get an answer before writing a choice into docs or code as settled. Only the owner marks something Decided in the decision log.
- `HauteCorner/` is the Expo app. `web/` is Next.js (from Phase 1). They are separate packages, so run commands in the right folder.
- Do not commit or push unless asked.
- Keep [API.md](docs/API.md) and [DATA_MODEL.md](docs/DATA_MODEL.md) in step with the code, because mobile types are written by hand from them.
- When a known issue is fixed, remove it from [KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md).

## Mobile commands

Run from `HauteCorner/`:

```bash
bun install
bun run start              # Metro, for an installed development build
bunx expo run:ios          # Build and install
bunx expo run:android
bunx tsc --noEmit
bun run lint
bun run test
bunx expo-doctor@latest
bunx expo install <pkg>    # Always use this for Expo packages, not bun add
```

## Web commands

Run from `web/`:

```bash
bun run dev
bun run test
bun run typecheck
bun run lint
bun run build              # API routes must show as ƒ (dynamic)
bun run seed               # Only on a database ending in _dev
```

This Next.js version differs from older ones. Read `web/node_modules/next/dist/docs/` before using an unfamiliar API.

## Testing

Test on at least two iOS simulators of different sizes and the owner's connected Android phone, not an Android emulator. UI flows are in `HauteCorner/.maestro/` and run against Release builds on iOS. See [Setup](docs/SETUP.md#testing-on-devices).

Run native builds from a scratch copy rather than `android/` or `ios/` if the owner may be using them, and check with `pgrep -fl "expo run|gradle|xcodebuild"` first.

## Mobile rules

- **Use native components first.** Check `@expo/ui` (universal, `swift-ui`, `jetpack-compose`, `community/*`) and native navigation options such as `NativeTabs`, `Stack.Toolbar` and `Stack.SearchBar` before writing a custom TypeScript component. Build custom only when nothing native fits, and say why.
- Screens must work at any window size and in both orientations. There is no orientation lock, because iOS 27 can ignore it.
- Expo Go does not work; use development builds.
- `android/` and `ios/` are generated and git-ignored. Change native settings through `app.json` or a plugin in `plugins/`.
- The app may be running or building while you work. Check before running `expo prebuild --clean` or removing those folders.
- Imports from `@react-navigation/*` are not allowed. Use `expo-router/react-navigation` and `expo-router/js-tabs`.
- Stack screens need `headerTransparent: false` or content inset handling, because iOS 26+ draws content under transparent headers.
- Never use React Native's `Image` for remote media. Use `expo-image`, with Cloudinary sizes.
- Never put secrets in `EXPO_PUBLIC_*` variables.
- New code goes in TypeScript, under `features/<domain>/`. Redux code stays only until its screen is rebuilt.

## Server rules

- Check permissions in every route handler, and confirm that sellers only touch their own data.
- The server calculates all money. Ignore prices and totals from clients.
- Amounts are whole Kenyan shillings, as integers.
- Only `lib/ledger.ts` writes ledger entries, and entries are never edited or deleted.
- Webhooks and payouts must be idempotent. Confirm payment only from verified provider events.
- Media goes directly to Cloudinary. Never send files through API routes, or store them in MongoDB.
- Use the Node.js runtime, because Mongoose does not support Edge.
- Permissions, pricing, the ledger and payouts must have tests.
