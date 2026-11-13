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
cp .env.example .env.local   # then set MONGODB_URI and the Cloudinary values
bun run seed                 # sample data, see below
bun run dev
```

| Command | What it does |
| --- | --- |
| `bun run test` | API tests, on an in-memory MongoDB replica set, which transactions need |
| `bun run typecheck` | Generates route types, then runs TypeScript |
| `bun run lint` | ESLint |
| `bun run build` | Production build. Check that API routes are listed as `ƒ` |
| `bun run sync-indexes` | Creates indexes. Production has `autoIndex` off, so run this when indexes change |
| `bun run check-transactions` | Confirms multi-document transactions work on the database in `MONGODB_URI` |
| `bun run seed` | Adds the sample catalogue. See [Sample data](#sample-data) |
| `bun run remove-samples` | Removes the sample catalogue, and with `--media` its photos |
| `bun run migrate-user-identities` | One-off: moves users to linked identities. Run `sync-indexes` after it |
| `bun run make-admin --email=<address>` | Gives an existing account the admin role, for the dashboard at `/admin`. `--revoke` takes it away. A database not ending in `_dev` also needs `--confirm=<name>` |

bun installs packages, but the scripts run on Node through `tsx`, because bun's runtime cannot load MongoDB's `bson` library. Vercel runs on Node too.

`.env.local` is ignored by git. Never commit it.

### Sample data

The sample catalogue has 4 sellers and 21 products. They are not real businesses. Their photos are Cloudinary's sample images, copied into our account under `hautecorner/samples/`.

On the dev database, `bun run seed` replaces all products and sellers. On any other database, both scripts need the database name repeated, and touch only the sample records:

```bash
MONGODB_URI='<connection string>' bun run seed --confirm=hautecorner_prod
MONGODB_URI='<connection string>' bun run remove-samples --confirm=hautecorner_prod
```

Production holds the sample catalogue too, so remove it there before launch. Delete the photos with `--media` only after both databases are clear of samples, because they share the photos.

### Running a script against production

The production password exists only in Vercel, where it cannot be read back. Rather than changing it, create a temporary user that Atlas deletes by itself, and delete it when you finish:

```bash
atlas dbusers create --username hautecorner-tmp --password '<random>' \
  --role readWrite@hautecorner_prod --scope hautecorner \
  --deleteAfter <UTC time, such as 2026-11-04T12:00:00Z> --projectId <project ID>

MONGODB_URI='mongodb+srv://hautecorner-tmp:<password>@hautecorner.1fn0yhu.mongodb.net/hautecorner_prod' bun run sync-indexes

atlas dbusers delete hautecorner-tmp --force --projectId <project ID>
```

A new user can take a minute to start working.

## Testing on devices

Test on at least two iOS simulators of different sizes and on a connected Android phone, not an Android emulator.

UI flows use [Maestro](https://maestro.dev/) and live in `HauteCorner/.maestro/`. Start the API with seed data first.

**iOS simulators** run a Release build, so the dev menu cannot get in the way of taps. Set `EXPO_PUBLIC_API_URL` in `.env.local`, and build with `bunx expo run:ios --configuration Release`. Without an Apple team set up in Xcode, build with `xcodebuild` and ad-hoc signing (`CODE_SIGN_IDENTITY=-`) instead, not `CODE_SIGNING_ALLOWED=NO`: an unsigned app cannot use the Keychain, so it can never stay signed in. Then:

```bash
xcrun simctl list devices booted            # simulator IDs
maestro --device <id> test .maestro/catalogue.yaml
maestro --device <id> test .maestro/orientation.yaml
maestro --device <id> test .maestro/sign-in-required.yaml
maestro --device <id> test .maestro/wishlist.yaml
```

`sign-in-required.yaml` checks that browsing and liking need no account, and that the profile, selling and checkout ask for one.

Phases 4 and 5 add flows that sign in with an existing email account (`email-sign-in.yaml`). Start the API with `PAYMENTS_SIMULATED=true EMAIL_TRANSPORT=log`, and point the app at it:

```bash
maestro --device <id> test -e EMAIL=... -e PASSWORD=... .maestro/checkout.yaml      # two sellers, M-Pesa, My Orders
maestro --device <id> test -e EMAIL=... -e PASSWORD=... .maestro/report.yaml        # report a listing
maestro --device <id> test -e EMAIL=... -e PASSWORD=... .maestro/sell-apply.yaml    # needs a photo in the library
# approve the shop at /admin, then:
maestro --device <id> test -e EMAIL=... -e PASSWORD=... .maestro/sell-listing.yaml  # needs a photo and a video
```

Add test media with `xcrun simctl addmedia <id> photo.jpg video.mp4`. The system photo picker runs in its own process, which Maestro cannot see during a test, so the seller flows tap it by position; close iOS's one-time "Private Access to Photos" banner by hand first. Create test accounts through the API rather than the app's sign-up screen if the simulator's password suggestions get in the way. It does not press the Google or Apple buttons, so test real Google and Apple sign-in by hand on a device.

Email sign-up runs in two parts, because the code has to be read from the API log in between. Start the API with `EMAIL_TRANSPORT=log` and use a new address each time. On each iOS simulator, first turn off **Settings > General > AutoFill & Passwords > Suggest Strong Passwords**, or its sheet covers the password field and Maestro cannot see it:

```bash
maestro --device <id> test -e EMAIL=you+1@example.com -e PASSWORD='a long passphrase' .maestro/email-sign-up.yaml
# find "[email] to you+1@example.com" in the API log, then:
maestro --device <id> test -e EMAIL=you+1@example.com -e PASSWORD='a long passphrase' -e CODE=123456 .maestro/email-verify.yaml
```

The app has no orientation lock, so also check new screens on an iPad and the iPhone Duo simulator (iOS 27.1). Simulator screenshots taken in landscape come out rotated, which is expected.

**The Android phone** runs a development build through Metro, because Android blocks plain HTTP to `localhost` in Release builds:

```bash
adb devices                                 # phone serial
adb reverse tcp:3000 tcp:3000 && adb reverse tcp:8081 tcp:8081
maestro --device <serial> test -e METRO_PORT=8081 .maestro/catalogue.yaml
maestro --device <serial> test -e METRO_PORT=8081 .maestro/wishlist.yaml
maestro --device <serial> test -e METRO_PORT=8081 -e EMAIL=you+1@example.com -e PASSWORD='a long passphrase' .maestro/email-sign-up.yaml
maestro --device <serial> test -e EMAIL=you+1@example.com -e PASSWORD='a long passphrase' -e CODE=123456 .maestro/email-verify.yaml
```

In a development build, the `.env` files are read into the bundle and override variables set in the shell, so `EXPO_PUBLIC_API_URL=... bun run start` does not change the API. Set it in `.env.local`. Every Metro serving this folder picks the change up, so to point one device at another API while the other stays put, run that device's Metro from a copy of `HauteCorner/` with its own `.env.local`.

**Xiaomi, Redmi and POCO phones** block automated taps and installs by default. In **Developer options**, turn on both **USB debugging (Security settings)** and **Install via USB**.

## Environment variables

### `web/`

| Variable | Purpose | Phase |
| --- | --- | --- |
| `MONGODB_URI` | Atlas connection string for this environment | 1 |
| `JWT_SECRET` | At least 32 random characters, for signing access tokens. Different in each environment. Create one with `openssl rand -base64 48`. Set locally and in both Vercel environments | 3 |
| `GOOGLE_WEB_CLIENT_ID` | Expected audience of Google ID tokens: the web client. Set locally and in both Vercel environments | 3 |
| `EMAIL_TRANSPORT` | `ses` (the default, and the value in both Vercel environments), `log` (prints emails, for local testing) or `memory` (tests) | 3 |
| `EMAIL_FROM` | The sender's display name, such as `HauteCorner Lifestyle`. Mail always comes from `no-reply@realhiveconsultants.com`, with replies to `info@realhiveconsultants.com` (`web/lib/site.ts`) | 3 |
| `SES_REGION` | `eu-west-1`, where the `realhiveconsultants.com` identity is verified | 3 |
| `AWS_SES_ACCESS_KEY_ID`, `AWS_SES_SECRET_ACCESS_KEY` | Keys for an IAM user that can only send through SES. Secret | 3 |
| `APPLE_BUNDLE_ID` | `com.hautecorner.app`, the expected audience of Apple tokens. Set locally and in both Vercel environments | 3 |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name, `dxnevfcm`. Sent to the app, which builds image addresses from it | 1 |
| `CLOUDINARY_URL` | `cloudinary://<api key>:<api secret>@<cloud name>`. Secret. Used by the seed script, and to sign uploads from Phase 4 | 2 |
| `NEXT_PUBLIC_SITE_URL` | Optional. Public address of the website | 1 |
| `PAYSTACK_SECRET_KEY` | `sk_test_…` in Preview, `sk_live_…` at launch. Also checks webhook signatures. Secret | 5 |
| `DARAJA_ENV` | `sandbox` (the default) or `production` | 5 |
| `DARAJA_CONSUMER_KEY`, `DARAJA_CONSUMER_SECRET` | The Daraja app's credentials. Secret | 5 |
| `DARAJA_SHORTCODE`, `DARAJA_PASSKEY` | M-Pesa Express. The sandbox uses shortcode `174379` and the passkey shown on the Daraja portal. Secret | 5 |
| `DARAJA_TRANSACTION_TYPE` | `CustomerPayBillOnline` (the default) for a Paybill, or `CustomerBuyGoodsOnline` for a Till | 5 |
| `DARAJA_CALLBACK_TOKEN` | Random text added to the callback address, because Safaricom does not sign callbacks: `openssl rand -hex 24`. Secret | 5 |
| `MPESA_B2C_SHORTCODE`, `MPESA_INITIATOR_NAME`, `MPESA_SECURITY_CREDENTIAL` | Seller payouts. Names to be confirmed | 6 |
| `CRON_SECRET` | Protects the `/api/v1/cron/*` routes. Vercel sends it to scheduled jobs. Secret | 5 |
| `PAYMENTS_SIMULATED` | `true` lets checkout pay without Daraja or Paystack keys, for trying the app. Ignored on Vercel production and on any database not ending in `_dev` or `_test`. An M-Pesa number ending in `0000` is declined | 5 |
| `EXPO_ACCESS_TOKEN` | Enhanced push security, if enabled | 7 |



### `HauteCorner/`

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | API base URL for this environment |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | From Phase 3. Requests an ID token for the API to verify |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | From Phase 3. The iOS OAuth client. Without both IDs, the app says Google sign-in is not set up instead of starting it |

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

The production password exists only in Vercel, where it cannot be read back. To run a script against production, use a [temporary user](#running-a-script-against-production).

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

| Key | SHA-1 |
| --- | --- |
| Local debug key, shared by every React Native project | `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` |
| EAS | Shown on expo.dev under the project's credentials, once EAS has created a keystore, or with `eas credentials -p android` |
| Google Play app signing | In Play Console, under Test and release, App integrity |

Then set `GOOGLE_WEB_CLIENT_ID` in Vercel, both `EXPO_PUBLIC_GOOGLE_*` values in `HauteCorner/.env.local`, and the iOS client's reversed ID as `iosUrlScheme` in `app.json`, and rebuild the app.

Done on 3 November 2026 for Google Cloud project `hautecorner`: web client `…0uhrq269…`, iOS client `…b05r525p…` and Android client `…kqrc36fk…`. The client files are in `HauteCorner/credentials/`, which git ignores. Check that the Android client lists the SHA-1 of every key that signs the app, including the debug key above, or Android sign-in fails with `DEVELOPER_ERROR`. EAS builds also need the two `EXPO_PUBLIC_GOOGLE_*` values as EAS environment variables.

### Email (Phase 3)

All email goes through Amazon SES in `eu-west-1` ([ADR-036](DECISIONS.md#adr-036-email-sign-up-with-emailed-codes-alongside-google-and-apple)). The account has production access, and the domain `realhiveconsultants.com` is verified with DKIM, so mail from `no-reply@realhiveconsultants.com` is signed. Replies go to `info@realhiveconsultants.com`.

In Vercel, set `EMAIL_TRANSPORT=ses`, `SES_REGION`, `AWS_SES_ACCESS_KEY_ID` and `AWS_SES_SECRET_ACCESS_KEY` for both Production and Preview. The old `GMAIL_*` variables are no longer read and can be deleted.

Enter Vercel values without quotes: unlike `.env.local`, Vercel keeps them as part of the value. Production once sent no email at all because `EMAIL_TRANSPORT` held `"ses"`. To set it from the CLI, which does not add a newline with `printf`:

```bash
cd web
vercel env rm EMAIL_TRANSPORT production --yes
printf 'ses' | vercel env add EMAIL_TRANSPORT production
vercel redeploy hautecorner.vercel.app   # env changes apply only to new deployments
```

The custom MAIL FROM domain shows as failed in SES. Mail still delivers and passes DMARC through DKIM; fixing it means adding the MX and SPF records SES shows for the MAIL FROM subdomain.

To test locally without sending, start the API with `EMAIL_TRANSPORT=log`, which prints each email, code included, to the server log. `.maestro/email-sign-up.yaml` and `email-verify.yaml` use this. Do not send test mail to made-up addresses through SES: bounces count against the account.

See the [library's Expo guide](https://react-native-google-signin.github.io/docs/setting-up/expo).

### Apple (Phases 3 and 7)

Needs a paid Apple Developer account. Enable Sign in with Apple for `com.hautecorner.app`; the app already asks for it through `usesAppleSignIn` in `app.json`. EAS can generate an APNs key during the first build with push enabled.

Revoking Apple tokens when an account is deleted also needs a Sign in with Apple key (a `.p8` file with its key ID) and the team ID. Keep the key out of the repository.

### Cloudinary (Phases 2 and 4)

The account exists: cloud `dxnevfcm`, on the Free plan. `CLOUDINARY_URL` is in `web/.env.local` and Vercel Production, and `CLOUDINARY_CLOUD_NAME` in both Vercel environments.

Uploads are signed by the API, which chooses each file's folder and name and the formats allowed, so the app cannot upload anywhere else. Product media goes to `hautecorner/sellers/<seller ID>/products/`, and application documents to `hautecorner/applications/<user ID>/` as private files. Videos get a 720p adaptive stream prepared at upload.

Still to do:

1. Check that Cloudinary's terms permit the planned use.
2. Add `CLOUDINARY_URL` to Vercel Preview, or uploads fail there.
3. In **Settings > Upload**, leave unsigned uploading off. No upload preset is needed.

### Admin dashboard (Phase 4)

The dashboard is at `/admin`, and admins sign in with Google ([R-8](DECISIONS.md#recommended)).

1. In Google Cloud Console, open the **web** OAuth client and add **Authorized JavaScript origins**: `http://localhost:3000` and `https://hautecorner.vercel.app` (and the final domain later). Without these, Google's button shows an error.
2. Sign in to the app once with the Google account, so the account exists.
3. Give it the admin role: `bun run make-admin --email=<address>`. For production, use a [temporary database user](#running-a-script-against-production) and add `--confirm=hautecorner_prod`.

A dashboard session lasts 8 hours. The admin role is checked on every request, so `--revoke` takes effect at once.

### Safaricom Daraja (Phase 5)

1. Create an app on the [Daraja portal](https://developer.safaricom.co.ke/) with M-Pesa Express (Lipa na M-Pesa Online) enabled, and start in the sandbox.
2. Set `DARAJA_CONSUMER_KEY`, `DARAJA_CONSUMER_SECRET`, `DARAJA_SHORTCODE=174379`, the sandbox `DARAJA_PASSKEY` and a random `DARAJA_CALLBACK_TOKEN` in Vercel Preview, or locally.
3. Safaricom must reach the callback, `https://<site>/api/v1/webhooks/daraja/stk?token=…`, so test callbacks on a Vercel Preview deployment, or locally through a tunnel with `NEXT_PUBLIC_SITE_URL` set to the tunnel address. Without the callback, the app's status checks and the reconciliation job still settle the payment through the status query.
4. For production, you need a registered business Paybill or Till number and go-live approval.
5. For payouts, confirm with Safaricom what B2C needs. Third-party guides describe a verified shortcode, an initiator, and an encrypted security credential.

### Paystack (Phase 5)

1. Create a [Paystack](https://paystack.com/) account for Kenya, and complete business verification for live mode.
2. Set the test secret key as `PAYSTACK_SECRET_KEY` in Vercel Preview, or locally.
3. In the dashboard, set the test webhook URL to `https://<preview or production domain>/api/v1/webhooks/paystack`.
4. Paystack sends the buyer back to `/pay/return`, which opens the app. That return proves nothing; payment is confirmed only by the webhook or a verify call, with the amount checked.

### Trying checkout without payment keys

Start the API with `PAYMENTS_SIMULATED=true` on the dev database. M-Pesa then pays about 4 seconds after the prompt, unless the number ends in `0000`, and a card payment returns to the app at once and pays. Stock, orders and the ledger behave as for real payments.

### Scheduled jobs (Phase 5)

`GET /api/v1/cron/expire-reservations` returns stock from unpaid checkouts, and `GET /api/v1/cron/reconcile-payments` settles payments whose callback never came. Both need `Authorization: Bearer <CRON_SECRET>`.

They are not scheduled yet: Vercel Hobby allows only daily jobs, and both need to run every few minutes, which needs Pro ([ADR-005](DECISIONS.md#adr-005-real-store-hobby-while-building-pro-before-launch)). Until then the API does the same work as it goes: checkout first frees expired reservations, and the app's payment checks ask the provider.

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
