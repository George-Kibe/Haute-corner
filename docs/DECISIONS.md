# Decision log

This records what has been decided for the revamp, why, and what follows from it. Only the project owner makes decisions here.

| Status | Meaning |
| --- | --- |
| **Decided** | The project owner chose this, on 30 October 2026 unless stated otherwise |
| **Recommended** | A technical suggestion the other documents assume. It stands until approved or changed, and is not a decision |
| **Open** | Not settled. Must be answered before the phase shown |

To change a decision, add a dated note to its entry and update the documents affected.

## Decided

### ADR-001: Expo SDK 58 and its library set

**Decided:** Expo SDK 58 (React Native 0.88.1, React 19.3.0), on the latest patch release ([ADR-033](#adr-033-stay-on-the-latest-expo-58-patches)), with Expo UI for native components, `expo-updates`, `expo-image-picker`, `expo-image`, `expo-notifications`, `react-native-toast-message` and `@react-native-google-signin/google-signin`.

**What follows:** These native libraries do not run in Expo Go, so development uses development builds. `android/` and `ios/` are generated and git-ignored, so native settings belong in `app.json` and config plugins.

### ADR-002: Next.js, MongoDB Atlas and Mongoose on Vercel

**Decided:** Next.js replaces the Express server, and the data lives in MongoDB Atlas through Mongoose. The server and landing page deploy to Vercel.

**What follows:** The API runs as serverless functions, with no in-memory state or long-running processes, so background work uses Vercel Cron. Mongoose needs the Node.js runtime, not Edge. Vercel's dynamic IP addresses mean the Atlas access list must allow `0.0.0.0/0`, so database credentials are the main protection.

### ADR-003: One Next.js app for the API, landing page and admin dashboard

**Decided:** A single Next.js app and Vercel project.

**What follows:** Everything deploys together, and pages can share server code with the API. A landing page edit also redeploys the API, which is safe because deployments are atomic.

### ADR-004: `web/` beside the Expo app

**Decided:** Keep `HauteCorner/` for mobile and add `web/` for Next.js, as separate packages.

**What follows:** No risk to Metro or native module resolution. API types are duplicated by hand from [API.md](API.md), so that document must stay accurate.

### ADR-005: Real store: Hobby while building, Pro before launch

**Decided:** HauteCorner will sell real goods. Build on Vercel's free Hobby plan, and move to Pro before taking real orders.

**Why:** Vercel's [fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines) restrict Hobby to "non-commercial personal use only". Their examples of commercial use include requesting payment and advertising a product for sale.

**What follows:** Pro costs about $20 per developer seat per month. It also allows cron jobs every minute (Hobby is limited to once a day), which the payout and reconciliation jobs need in production. Other running costs at launch include the Apple Developer Program (about $99 a year) and a one-time Google Play registration (about $25). Confirm these prices when you sign up.

**Note, 2 November 2026:** The full marketing page goes live on Hobby before launch ([ADR-025](#adr-025-a-full-marketing-page-before-launch)). Vercel lists advertising the sale of a product as commercial use, so this risk is accepted knowingly until the move to Pro.

### ADR-006: Multi-seller marketplace

**Decided:** Many independent sellers, not a single store.

**What follows:** Products belong to sellers. Orders, delivery and money are all tracked per seller. Permission checks must confirm that a seller is acting on their own data. This is the largest driver of scope in the project.

### ADR-007: Sellers apply, and an admin approves

**Decided:** Sellers submit business and payout details, and can list only after approval.

**What follows:** Needs an application flow, a review screen for admins, and careful handling of identity documents and payout details.

### ADR-008: One cart and one payment, split into one order per seller

**Decided:** A customer can buy from several sellers in one checkout.

**What follows:** One payment covers several seller orders, each with its own delivery, status, dispute and payout. A refund on one order must not affect the others.

### ADR-009: Sellers deliver and set their own fee

**Decided:** Each seller arranges delivery and sets a fee, charged per seller at checkout. This replaces the old flat KES 200, free from KES 5,000.

**What follows:** No logistics to build. The delivery experience will vary by seller, and delivery confirmation depends on the seller and buyer rather than a courier.

### ADR-010: M-Pesa through Daraja, cards through Paystack, both at launch

**Decided:** Safaricom's Daraja API for M-Pesa and Paystack for cards.

**What follows:**

- Launch depends on a registered business Paybill or Till number, Daraja production access, and an approved Paystack merchant account. Start these early.
- There are two integrations, two sets of webhooks, and two pools of money to reconcile.
- Card numbers must never reach our servers; Paystack's hosted payment page handles them.
- Physical goods must not use Apple in-app purchase ([guideline 3.1.3(e)](https://developer.apple.com/app-store/review/guidelines/)), so this is compatible with the App Store.

### ADR-011: Hold seller money until delivery, then release

**Decided:** Money stays with HauteCorner until delivery is settled. The seller marks the order delivered, then the buyer confirms in the app. If the buyer does nothing and has raised no problem, the money releases automatically after a set number of days.

**What follows:** Needs a ledger, a scheduled release job, and payouts to sellers.

**Legal risk:** This means holding other people's money. Whether that needs Central Bank of Kenya authorisation under the National Payment System Act has **not been confirmed**. See [Open items](#open-items); this should be answered before the payout work begins, as the answer could change how the money flows.

### ADR-012: Commission on each sale

**Decided:** A percentage of each order is deducted before the seller is paid.

**What follows:** Store the rate on each order at purchase, so later changes do not alter past orders. The rate must cover payment fees: Paystack's [Kenya page](https://paystack.com/blog/company-news/kenya) lists 2.9% for local cards and 3.8% for international cards, and M-Pesa has its own charges.

### ADR-013: Disputes: seller first, then admin

**Decided:** A buyer raises a problem within a set window, which pauses the payout. Buyer and seller try to resolve it, and an admin makes the final decision if they cannot.

**What follows:** Needs a dispute flow in the app, a case screen for admins, and someone to handle cases. The returns policy must be published in the terms.

### ADR-014: Sellers work in the app, admins on the web

**Decided:** Sellers list and fulfil from their phones. Platform admins use a dashboard on the Next.js site.

**What follows:** Customer and seller screens share one app, with seller screens shown by role. Admin screens do not ship in the mobile app.

### ADR-015: Google and Apple sign-in, with browsing left open

**Decided:** Google on both platforms, and Sign in with Apple on iOS. No sign-in is needed to browse.

**Why:** [App Store guideline 4.8](https://developer.apple.com/app-store/review/guidelines/) requires apps using a social login for the primary account to also offer an equivalent login that limits data to name and email and lets users hide their email. Guideline 5.1.1(v) says not to require login where it is not needed.

**What follows:** Requires `expo-apple-authentication`, added in Phase 3. Both stores also require account deletion: in the app on both, and through a web link for [Google Play](https://support.google.com/googleplay/android-developer/answer/13327111).

**Updated 3 November 2026:** Email sign-up was added alongside Google and Apple ([ADR-036](#adr-036-email-sign-up-with-emailed-codes-alongside-google-and-apple)), and the wish list no longer needs an account ([ADR-038](#adr-038-likes-without-an-account-synced-once-signed-in)).

### ADR-016: Our own short-lived tokens

**Decided:** The API verifies the Google or Apple token, then issues a 15-minute JWT and a rotating 30-day refresh token, stored hashed in MongoDB.

**What follows:** Small and fully under our control, but security-sensitive code that must be well tested. Requires `expo-secure-store` on the device, added in Phase 3.

### ADR-017: TanStack Query, Zustand and MMKV

**Decided:** TanStack Query for server data, and Zustand with MMKV for the cart and preferences. Redux Toolkit, RTK Query, redux-persist and axios are removed as screens are rebuilt.

**What follows:** `redux-persist` (last released in September 2019) goes away. Until each screen is rebuilt, the old Redux code stays in place.

### ADR-018: Cloudinary for images and video, with short videos at launch

**Decided:** Cloudinary stores images and videos and handles fast-loading optimization. Sellers can add short product videos at launch, within limits on length and size.

**What follows:**

- Files upload directly from the app with a server-generated signature, which also avoids Vercel's 4.5 MB request limit.
- MongoDB stores only references, never file data.
- Requires `expo-video`, added in Phase 4.
- The free plan shares 25 monthly credits across storage, bandwidth and transformations, and video uses them quickly. Expect to need a paid plan as usage grows. Cloudinary's pricing page does not say whether the free plan allows commercial use, so check its terms before launch.

### ADR-019: iOS and Android only

**Decided:** The Expo app does not ship to the web. Web visitors get the Next.js landing page.

**What follows:** Native-only libraries can be used freely. A web storefront would be a separate project.

### ADR-020: Start fresh, with no data import

**Decided:** A new database with sample data for development, and real sellers adding their own products.

**What follows:** Nothing is imported from the old cluster, whose password was exposed. See [Security](SECURITY.md#past-incident-exposed-database-credential).

### ADR-021: Raise Gradle's memory through a config plugin

**Decided:** `HauteCorner/plugins/with-gradle-memory.js` sets a 4 GB heap and 1 GB of metaspace.

**Why:** SDK 58 turns on R8 for release builds, and it ran out of memory under the template's limits of 2 GB and 512 MB. A release build using only this plugin succeeds.

### ADR-022: Configuration kept from the upgrade

**Decided:** Keep these settings:

- The `fingerprint` runtime version policy, with `development`, `preview` and `production` update channels. An update reaches only builds with matching native code, and any native change needs a new store build.
- Android notifications use `android-icon-monochrome.png`, tinted `#ffa500`.
- iOS photo and camera permission wording, with the microphone permission off. See [Open items](#open-items), since this interacts with seller video.
- A placeholder `iosUrlScheme` for Google Sign-In, so that prebuild passes until the OAuth client exists. It must be replaced in Phase 3.

### ADR-023: Technical foundations for Phases 1 and 2

**Decided 2 November 2026:** Approved as written:

- `docs/API.md` and `docs/DATA_MODEL.md`, with routes under `/api/v1`, Zod validation of every request, and amounts stored as whole Kenyan shillings.
- Separate `type` and `audience` product fields, replacing the old mixed `category`.
- bun for `web/`, and FlashList for product lists.
- Vitest with `mongodb-memory-server` for the API, `jest-expo` for mobile, and GitHub Actions checks, including a secret scan.

### ADR-024: Atlas and Vercel in Ireland, created by CLI

**Decided 2 November 2026:** A new Atlas project with a Free cluster in `EU_WEST_1`, and Vercel functions in `dub1`. Separate dev and production database users, each limited to its own database, with secrets written straight to Vercel and `web/.env.local`.

### ADR-025: A full marketing page before launch

**Decided 2 November 2026:** Publish the full marketing page now, with Tailwind CSS, placeholder store buttons, your logo and real app screenshots.

**What follows:** The page advertises a business while on Vercel's non-commercial plan ([ADR-005](#adr-005-real-store-hobby-while-building-pro-before-launch)). No stock photos are used, and screenshots are labelled as sample listings while the catalogue is sample data.

### ADR-026: Brand: logo blue with Nunito

**Decided 2 November 2026:** Both the website and the app use the blue from the logo as their primary colour, the logo's pale background as a soft surface, and the Nunito font. This replaces the cyan, yellow and orange in the old code.

### ADR-027: Public business name and contact

**Decided 2 November 2026:** HauteCorner, with `buenasconsultants@gmail.com` as the public contact on the website and legal pages.

### ADR-028: Cloudinary's demo cloud for sample data until Phase 4

**Decided 2 November 2026:** Sample products use Cloudinary's public demo images. The app reads the cloud name from `GET /config`, so moving to your own account in Phase 4 means changing one setting and reseeding.

**Update, 3 November 2026:** You created your own Cloudinary account (`dxnevfcm`) and asked for real sample data in production as well, to be deleted later. The sample photos are now copies in that account, under `hautecorner/samples/`, and both databases hold 21 sample products. `remove-samples` deletes them ([Setup](SETUP.md#sample-data)).

### ADR-029: Home is a feed, Categories is for browsing

**Decided 2 November 2026:** Home shows the newest products with search. Categories lets people pick a type and audience, then see filtered results. Both share one product grid.

### ADR-030: Commit straight to master

**Decided 2 November 2026:** Work is committed and pushed directly to `master`.

**What follows:** Once Vercel is linked, every push deploys to production with no review step or preview. Run all checks before pushing.

### ADR-031: `Backend/` deleted, git history kept

**Decided 2 November 2026:** The old Express server is removed from the code. Past commits still contain the exposed credential, which you have confirmed is no longer valid, so history is not rewritten.

### ADR-032: Native components first

**Decided 2 November 2026:** Bottom tabs use Expo Router's `NativeTabs`, which gives Liquid Glass on iOS 26+ and Material on Android. All UI uses native components from Expo UI first, and custom TypeScript components are a last resort.

**What follows:** Each tab nests a native `Stack`, because native tabs have no header. Header buttons use `Stack.Toolbar`, search uses `Stack.SearchBar`, filters use Expo UI's `SegmentedControl`, the size picker uses its menu `Picker`, and the main button uses its `Button`. Android toolbar icons come from `@expo/material-symbols`. Native tabs cannot change at runtime without resetting state, which affects how the seller-only tab appears in Phase 4. Native controls use the system font rather than Nunito.

### ADR-033: Stay on the latest Expo 58 patches

**Decided 2 November 2026:** Move to `expo@58.0.22` and matching packages, rather than pinning to 58.0.21, and keep `expo-doctor` passing.

### ADR-034: Maestro for device testing

**Decided 2 November 2026:** UI flows use [Maestro](https://maestro.dev/), and live in `HauteCorner/.maestro/`. Every UI test runs on at least two iOS simulators of different sizes and the owner's Android phone, never an Android emulator.

### ADR-035: Adapt to any window size, with no orientation lock

**Decided 3 November 2026:** Remove the portrait lock, and make every screen fit the window it is given, in either orientation.

**Why:** On iOS 27, an orientation lock is only a preference: the system can resize or rotate the app anyway, and Expo recommends that apps "adapt to the space available to them instead of relying on a fixed orientation" ([Expo](https://docs.expo.dev/versions/v58.0.0/sdk/screen-orientation/#orientation-locks-on-ios-27-and-later)). On the iPhone Duo simulator, the locked layout put products under a side tab bar.

**What follows:** Grid columns come from the window width, content respects side safe areas, and the product page puts the image beside the details in wide windows. Every new screen must work in portrait and landscape, and `.maestro/orientation.yaml` checks this.

### ADR-036: Email sign-up with emailed codes, alongside Google and Apple

**Decided 3 November 2026:** People can also create an account with an email address and password. A one-time code sent by email confirms the address at sign-up, and resets a forgotten password. New accounts get a welcome email. Gmail SMTP sends in development, and Amazon SES in production. Until SES has a verified domain and production access, production also sends through Gmail.

**What follows:** Extends [ADR-015](#adr-015-google-and-apple-sign-in-with-browsing-left-open). Gmail allows roughly 500 messages a day from one account, which suits testing but not launch. Moving to SES means setting `EMAIL_TRANSPORT=ses`, `SES_REGION`, `SES_FROM_ADDRESS` and the SES keys in Vercel. The SES path is written but untested until then.

### ADR-037: One account per verified email

**Decided 3 November 2026:** When someone signs in with Google or Apple using an address that already has an account, or signs up by email with an address that already has Google or Apple, it is the same account, as long as both sides have verified the address.

**What follows:** Orders, likes and seller status stay together whichever way someone signs in. Apple's private relay addresses never match another account. Only verified addresses are stored, so the email field is unique.

### ADR-038: Likes without an account, synced once signed in

**Decided 3 November 2026:** The Wish List tab lists the products a shopper has liked. Liking needs no account: likes are kept on the device. Signing in adds them to the account, which keeps them in sync across devices. Signing out clears them from the device, and they come back on the next sign-in.

**What follows:** Replaces the mock payment screen that stood in the Wish List tab. Changes the earlier plan for sign-in to be required for the wish list ([ADR-015](#adr-015-google-and-apple-sign-in-with-browsing-left-open)).

### ADR-039: Rate limiting with counters in MongoDB

**Decided 3 November 2026:** Auth endpoints are rate limited with fixed-window counters in our Atlas database, which expire automatically. No new service is added.

**What follows:** Each limited request costs one database write. Limits per network address stay generous, because Kenyan carriers put many phones behind one address. The values are in `web/lib/rate-limit.ts` and can be tuned.

### ADR-040: Skeletons while loading

**Decided 3 November 2026:** Screens show skeletons shaped like their content while loading, rather than spinners.

**What follows:** Native forms on iOS use SwiftUI's own placeholder (`redacted`). Product grids, product pages and Android forms have no native equivalent, so they use a small custom `Skeleton` that pulses, and stays still when the system asks for reduced motion.

## Recommended

These are technical suggestions the other documents assume. You were not asked about them individually, so approve or change them when you review the documents.

| # | Recommendation | Why | Alternative |
| --- | --- | --- | --- |
| R-5 | An append-only ledger for all money movement | Lets every balance be traced and reconciled, which holding funds requires | Balance fields on each seller, which are simpler but cannot be audited |
| R-6 | Take card payments on Paystack's hosted page, opened with `expo-web-browser` (already installed) | Card numbers never touch our code or our PCI scope | Paystack's native mobile SDKs, whose React Native support I have not verified |
| R-7 | Pay out M-Pesa-funded money through Daraja B2C. For card-funded money, compare Paystack transfers to M-Pesa wallets with topping up the B2C account | Money from cards and M-Pesa ends up in different places | One float funded by hand. See [Open items](#open-items) |
| R-8 | Admins sign in to the dashboard with Google, with a secure cookie session and a server-side role check | Reuses the same accounts, and Google can enforce two-factor authentication | Separate admin credentials |
| R-11 | Reserve stock at checkout, for about 15 minutes, until payment completes | Stops two customers buying the last unit | Reduce stock only on payment, which risks overselling |
| R-15 | Send push through the Expo push service with `expo-server-sdk` | The standard server side of `expo-notifications` | Direct FCM and APNs |
| R-16 | A `hidden` product status for products whose seller is not approved | Public queries then filter on one indexed field, and suspending a seller is one update | Check each seller's status on every query |
| R-17 | Show toasts at the bottom of the screen | At the top they covered the native header buttons, including the cart, just after adding to the cart | Keep them at the top, below the header |
| R-18 | A deleted account keeps an empty record with only its ID, provider and role, and signing in again creates a new account | Orders and the ledger can still point to it, without keeping personal details | Remove the user document entirely, leaving orders pointing at nothing |
| R-19 | Store phone numbers as `+254` and nine digits, accepting the usual local ways of writing them | M-Pesa and sellers need one format, and people type numbers differently | Store what was typed |
| R-20 | The access token stays in memory only, and the refresh token in secure storage | Nothing long-lived sits in plain storage, and a restart costs one refresh | Store both in secure storage |
| R-21 | Passwords need 8 to 128 characters, with no other rules, and are hashed with scrypt | NIST recommends length over character rules, and scrypt is built into Node, so nothing native is needed on Vercel | Argon2id through a native package |
| R-22 | Codes have 6 digits, work for 10 minutes, 5 tries and once only, with a minute between emails, and are stored as an HMAC | Short enough to type, too few tries to guess, and a copied database alone does not reveal them | Longer codes, or magic links |
| R-23 | Sign-up says when an address already has a password, while password reset never says whether an account exists | Telling people to sign in instead is clearer, and a reset is the usual way to find out who has an account | Never say, and email the account owner instead |

## Open items

| Item | Needed by | Note |
| --- | --- | --- |
| **Legal review of holding seller funds** | Before Phase 6 | Ask a Kenyan fintech lawyer whether this needs Central Bank of Kenya authorisation, a trust account or other safeguards |
| Register a business, and get a Paybill or Till number and Daraja production access | Before Phase 5 goes live | Long lead time, so start early. Confirm with Safaricom whether one shortcode can both receive and send, as I only found this in third-party guides |
| Paystack merchant account for Kenya | Before Phase 5 goes live | Confirm current fees |
| How to fund card-based seller payouts | Before Phase 6 | See R-7. Card money settles through Paystack, while Daraja B2C draws on a separate M-Pesa balance |
| Commission rate | Before Phase 6 | Must cover payment fees |
| Days until automatic release | Before Phase 6 | How long after "delivered" the money releases if the buyer does nothing |
| Dispute window | Before Phase 6 | How long a buyer can raise a problem |
| Returns policy | Before Phase 6 | Published in the terms |
| Video limits | Before Phase 4 | Maximum length and file size per product |
| Microphone permission | Before Phase 4 | It is off, so sellers cannot record video with sound in the app. Either allow only videos from the library, or turn it on |
| Who handles disputes and seller reviews day to day | Before Phase 8 | Admins need to be available |
| Domain name | Before Phase 8 | Store listings and legal pages should use the final domain |
| Atlas tier at launch | Before Phase 8 | The free tier has 0.5 GB and limited backups, which may not suit a financial ledger |
| Tax treatment of commission | Before Phase 8 | Ask an accountant about VAT and income tax on commission |
| Error reporting tool | Before Phase 8 | Not yet compared |
| How the website handles account deletion | Before Phase 3 ends | The page explains in-app deletion and email requests. Choose whether to add web sign-in, or a way for admins to act on emailed requests |
| Revoking Sign in with Apple tokens on deletion | Before App Store submission | Needs a Sign in with Apple key from the Apple Developer account. Either keep Apple's refresh token from sign-in, or ask the user to sign in with Apple again when deleting |
