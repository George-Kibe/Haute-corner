# Setup

How to run the project locally, and which accounts and credentials it needs.

## Prerequisites

| Tool | Version |
| --- | --- |
| Node.js | 22.13+, 24.3+ or 26+ (odd-numbered versions are not supported) |
| bun | 1.3 or newer |
| Xcode | 27 recommended, for iOS |
| Android Studio | With the Android SDK and an emulator, plus JDK 21 |
| EAS CLI | `npm install -g eas-cli` |

## Mobile app

**Expo Go will not work.** Google Sign-In and other native modules need a development build.

```bash
cd HauteCorner
bun install
```

Create `HauteCorner/.env.local`:

```bash
cp .env.example .env.local
```

`localhost` works on iOS simulators, and on a USB-connected Android phone after `adb reverse tcp:3000 tcp:3000` and `adb reverse tcp:8081 tcp:8081`.

First run, or after any native change, build and install the app:

```bash
bunx expo run:ios
bunx expo run:android
```

After that, start Metro and open the installed app:

```bash
bun run start
```

**Rebuild when:** you add a native library, change a plugin or `app.json` native settings, or upgrade the SDK. JavaScript changes only need Metro.

`android/` and `ios/` are generated and git-ignored, so never edit them by hand. `expo prebuild --clean` recreates them. Prebuild also rewrites the `android` and `ios` scripts in `package.json` to `expo run:*`, which is expected.

**Checks:**

```bash
bunx tsc --noEmit
bun run lint
bun run test
bunx expo-doctor@latest
```

Install Expo packages with `bunx expo install <package>`, not `bun add`, so that they match the SDK.

## Web and API

```bash
cd web
bun install
cp .env.example .env.local   # then set MONGODB_URI
bun run seed                 # sample data; only runs on a database ending in _dev
bun run dev
```

| Command | What it does |
| --- | --- |
| `bun run test` | API tests, on an in-memory MongoDB |
| `bun run typecheck` | Generates route types, then runs TypeScript |
| `bun run lint` | ESLint |
| `bun run build` | Production build. Check that API routes are listed as `ƒ` |
| `bun run sync-indexes` | Creates indexes. Production has `autoIndex` off, so run this when indexes change |
| `bun run check-transactions` | Confirms multi-document transactions work on the database in `MONGODB_URI` |

bun installs packages, but the scripts run on Node through `tsx`, because bun's runtime cannot load MongoDB's `bson` library. Vercel runs on Node too.

`.env.local` is ignored by git. Never commit it.

## Testing on devices

Test on at least two iOS simulators of different sizes and on a connected Android phone, not an Android emulator.

UI flows use [Maestro](https://maestro.dev/) and live in `HauteCorner/.maestro/`. Start the API with seed data first.

**iOS simulators** run a Release build, so the dev menu cannot get in the way of taps. Set `EXPO_PUBLIC_API_URL` in `.env.local`, build with `bunx expo run:ios --configuration Release`, then:

```bash
xcrun simctl list devices booted            # simulator IDs
maestro --device <id> test .maestro/catalogue.yaml
maestro --device <id> test .maestro/orientation.yaml
```

The app has no orientation lock, so also check new screens on an iPad and the iPhone Duo simulator (iOS 27.1). Simulator screenshots taken in landscape come out rotated, which is expected.

**The Android phone** runs a development build through Metro, because Android blocks plain HTTP to `localhost` in Release builds:

```bash
adb devices                                 # phone serial
adb reverse tcp:3000 tcp:3000 && adb reverse tcp:8081 tcp:8081
maestro --device <serial> test -e METRO_PORT=8081 .maestro/catalogue.yaml
```

**Xiaomi, Redmi and POCO phones** block automated taps and installs by default. In **Developer options**, turn on both **USB debugging (Security settings)** and **Install via USB**.

## Environment variables

### `web/`

| Variable | Purpose | Phase |
| --- | --- | --- |
| `MONGODB_URI` | Atlas connection string for this environment | 1 |
| `JWT_SECRET` | At least 32 random bytes, for signing access tokens | 3 |
| `GOOGLE_WEB_CLIENT_ID` | Expected audience of Google ID tokens | 3 |
| `APPLE_BUNDLE_ID` | `com.hautecorner.app`, the expected audience of Apple tokens | 3 |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account. `demo` until Phase 4 | 1 |
| `NEXT_PUBLIC_SITE_URL` | Optional. Public address of the website | 1 |
| `CLOUDINARY_API_KEY` | Sent to clients with a signature | 4 |
| `CLOUDINARY_API_SECRET` | Signs uploads; never sent to clients | 4 |
| `PAYSTACK_SECRET_KEY` | Separate test and live values | 5 |
| `MPESA_ENV` | `sandbox` or `production` | 5 |
| `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET` | Daraja app credentials | 5 |
| `MPESA_SHORTCODE`, `MPESA_PASSKEY` | M-Pesa Express | 5 |
| `MPESA_B2C_SHORTCODE`, `MPESA_INITIATOR_NAME`, `MPESA_SECURITY_CREDENTIAL` | Seller payouts | 6 |
| `CRON_SECRET` | Protects scheduled job routes | 5 |
| `EXPO_ACCESS_TOKEN` | Enhanced push security, if enabled | 7 |

Daraja names are placeholders until confirmed against Safaricom's documentation.

### `HauteCorner/`

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | API base URL for this environment |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | From Phase 3. Requests an ID token for the API to verify |

`EXPO_PUBLIC_*` values are compiled into the app and readable by anyone. Never put secrets in them.

## Accounts and credentials

Set these up when the phase shown begins.

### MongoDB Atlas (Phase 1)

Project `HauteCorner`, cluster `hautecorner` (Free tier, `EU_WEST_1`, Ireland), next to the Vercel functions in `dub1`.

| Database | User | Used by |
| --- | --- | --- |
| `hautecorner_dev` | `hautecorner-dev` | `web/.env.local` and Vercel Preview |
| `hautecorner_prod` | `hautecorner-prod` | Vercel Production |

Each user can only read and write its own database. **Network Access** allows `0.0.0.0/0`, because [Vercel uses dynamic IP addresses](https://www.mongodb.com/docs/atlas/reference/partner-integrations/vercel/).

The production password exists only in Vercel, where it cannot be read back. To run a script such as `sync-indexes` against production, set a new password for that user in Atlas, update `MONGODB_URI` in Vercel, and redeploy.

The dev password is in `web/.env.local` on this computer. On another computer, set a new password for `hautecorner-dev` in Atlas. If you change it, update your `.env.local` and Vercel Preview.

Still to do before launch: enable backups, and add alerts for storage and connections.

Atlas pauses a free cluster after 30 days with no connections. Resume it from the dashboard.

### Vercel (Phase 1)

Project `hautecorner`, connected to this repository, with **Root Directory** set to `web`. The function region is set to `dub1` in `web/vercel.json`. Every push to `master` deploys to production.

Add environment variables separately for Production and Preview.

### Google Sign-In (Phase 3)

In Google Cloud Console, create OAuth clients for one project:

| Client type | Details | Used for |
| --- | --- | --- |
| Web | None | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `GOOGLE_WEB_CLIENT_ID` |
| iOS | Bundle ID `com.hautecorner.app` | Its reversed client ID replaces the `iosUrlScheme` placeholder in `app.json` |
| Android | Package `com.hautecorner.app`, plus the SHA-1 of each signing key | Enables sign-in on Android |

Android needs a SHA-1 for each key that signs the app: your local debug key, the EAS key, and Google Play's app signing key. Missing one of these is the most common cause of `DEVELOPER_ERROR`.

See the [library's Expo guide](https://react-native-google-signin.github.io/docs/setting-up/expo).

### Apple (Phases 3 and 7)

Needs a paid Apple Developer account. Enable Sign in with Apple for `com.hautecorner.app`. EAS can generate an APNs key during the first build with push enabled.

### Cloudinary (Phase 4)

1. Create an account, and check that its terms permit the planned use.
2. Note the cloud name, API key and API secret.
3. Set allowed upload types, and restrict uploads to signed requests.

### Safaricom Daraja (Phase 5)

1. Create an app on the [Daraja portal](https://developer.safaricom.co.ke/), and start in the sandbox.
2. For production, you need a registered business Paybill or Till number and go-live approval.
3. For payouts, confirm with Safaricom what B2C needs. Third-party guides describe a verified shortcode, an initiator, and an encrypted security credential.

### Paystack (Phase 5)

1. Create a [Paystack](https://paystack.com/) account for Kenya, and complete business verification for live mode.
2. Use test keys first.
3. Set the webhook URL to `https://<domain>/api/v1/webhooks/paystack`.

### Firebase (Phase 7)

1. Create a Firebase project, and add an Android app for `com.hautecorner.app`.
2. Upload an FCM V1 key to EAS, following [Expo's guide](https://docs.expo.dev/push-notifications/push-notifications-setup/).
3. Provide `google-services.json` as an EAS file environment variable, and do not commit it. Add it to `HauteCorner/.gitignore` first.

### Google Play (Phase 8)

Needs a Google Play Console account.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `Cannot find native module` | The installed development build is out of date. Rebuild it |
| Android release build: `OutOfMemoryError: Metaspace` | Run `bunx expo prebuild --clean` so that the Gradle memory plugin applies |
| Prebuild: `Missing iosUrlScheme` | The Google Sign-In plugin in `app.json` needs its option |
| iOS: app crashes when starting Google Sign-In | `iosUrlScheme` is still the placeholder, or does not match the iOS client |
| Android: `DEVELOPER_ERROR` on Google Sign-In | SHA-1 for the signing key is missing from the Android OAuth client |
| iOS simulator: `runtime path not found` | That runtime's disk image is unavailable. Restart the Mac, or reinstall the runtime from Xcode Settings. Simulators on other runtimes still work |
| Scripts crash with `isBuildingSnapshot is not yet implemented in Bun` | Run them through `bun run <script>`, which uses Node. Do not run them with `bun scripts/...` |
| Maestro on a Xiaomi phone: `INJECT_EVENTS` or `INSTALL_FAILED_USER_RESTRICTED` | Turn on **USB debugging (Security settings)** and **Install via USB** in Developer options |
| Emulator says it is already running after a crash | Delete `~/.android/avd/<name>.avd/hardware-qemu.ini.lock`, once you have confirmed no emulator is running |
| Device cannot reach the API | Use your LAN IP, not `localhost`, and check that the device is on the same network |
| API cannot reach Atlas | Check `MONGODB_URI`, the access list, and whether the cluster is paused |
