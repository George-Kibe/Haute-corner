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
EXPO_PUBLIC_API_URL=http://<your-computer-ip>:3000/api/v1
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<web client id>
```

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
bunx expo-doctor@latest
```

Install Expo packages with `bunx expo install <package>`, not `bun add`, so that they match the SDK.

**Reaching the local API from a device:** Use your computer's LAN IP address. On a USB-connected Android device, `adb reverse tcp:3000 tcp:3000` also lets you use `localhost`.

## Web and API

`web/` is created in Phase 1. Once it exists:

```bash
cd web
bun install
bun run dev
```

Create `web/.env.local` from the variables below. Never commit it.

## Environment variables

### `web/`

| Variable | Purpose | Phase |
| --- | --- | --- |
| `MONGODB_URI` | Atlas connection string for this environment | 1 |
| `JWT_SECRET` | At least 32 random bytes, for signing access tokens | 3 |
| `GOOGLE_WEB_CLIENT_ID` | Expected audience of Google ID tokens | 3 |
| `APPLE_BUNDLE_ID` | `com.hautecorner.app`, the expected audience of Apple tokens | 3 |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account | 4 |
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
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Requests an ID token for the API to verify |

`EXPO_PUBLIC_*` values are compiled into the app and readable by anyone. Never put secrets in them.

## Accounts and credentials

Set these up when the phase shown begins.

### MongoDB Atlas (Phase 1)

1. Create a project and Free cluster, in a region near your Vercel function region.
2. Create separate database users for dev and production, each limited to `readWrite` on its own database.
3. In **Network Access**, allow `0.0.0.0/0`, because [Vercel uses dynamic IP addresses](https://www.mongodb.com/docs/atlas/reference/partner-integrations/vercel/).
4. Enable backups, and add alerts for storage and connections.

Atlas pauses a free cluster after 30 days with no connections. Resume it from the dashboard.

### Vercel (Phase 1)

1. Import the GitHub repository, and set **Root Directory** to `web`.
2. Add environment variables separately for Production and Preview.
3. Set the function region next to the Atlas cluster.

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
| Emulator says it is already running after a crash | Delete `~/.android/avd/<name>.avd/hardware-qemu.ini.lock`, once you have confirmed no emulator is running |
| Device cannot reach the API | Use your LAN IP, not `localhost`, and check that the device is on the same network |
| API cannot reach Atlas | Check `MONGODB_URI`, the access list, and whether the cluster is paused |
