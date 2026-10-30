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

**Decided:** Expo `58.0.21` (React Native 0.88.1, React 19.3.0), with Expo UI for native components, `expo-updates`, `expo-image-picker`, `expo-image`, `expo-notifications`, `react-native-toast-message` and `@react-native-google-signin/google-signin`.

**What follows:** These native libraries do not run in Expo Go, so development uses development builds. `android/` and `ios/` are generated and git-ignored, so native settings belong in `app.json` and config plugins. See the [upgrade record](UPGRADE_SDK58.md).

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

**What follows:** Nothing is imported from the old cluster, whose password is exposed. See [Security](SECURITY.md#action-required-exposed-database-credential).

### ADR-021: Raise Gradle's memory through a config plugin

**Decided:** `HauteCorner/plugins/with-gradle-memory.js` sets a 4 GB heap and 1 GB of metaspace.

**Why:** SDK 58 turns on R8 for release builds, and it ran out of memory under the template's limits of 2 GB and 512 MB. A release build using only this plugin succeeds.

### ADR-022: Configuration kept from the upgrade

**Decided:** Keep these settings:

- The `fingerprint` runtime version policy, with `development`, `preview` and `production` update channels. An update reaches only builds with matching native code, and any native change needs a new store build.
- Android notifications use `android-icon-monochrome.png`, tinted `#ffa500`.
- iOS photo and camera permission wording, with the microphone permission off. See [Open items](#open-items), since this interacts with seller video.
- A placeholder `iosUrlScheme` for Google Sign-In, so that prebuild passes until the OAuth client exists. It must be replaced in Phase 3.

## Recommended

These are technical suggestions the other documents assume. You were not asked about them individually, so approve or change them when you review the documents.

| # | Recommendation | Why | Alternative |
| --- | --- | --- | --- |
| R-1 | Use bun for `web/`, as `HauteCorner/` already does | One package manager across the repo | npm or pnpm for `web/` |
| R-2 | Version the API under `/api/v1` | Installed apps stay on phones for months and cannot be forced to update | Add versioning only when first needed |
| R-3 | Validate every request with Zod | Stops malformed data and operator injection | Mongoose validation alone |
| R-4 | Store money as whole Kenyan shillings | Avoids floating-point errors. Paystack amounts are multiplied by 100 when sent | Store cents, which helps if cents ever matter |
| R-5 | An append-only ledger for all money movement | Lets every balance be traced and reconciled, which holding funds requires | Balance fields on each seller, which are simpler but cannot be audited |
| R-6 | Take card payments on Paystack's hosted page, opened with `expo-web-browser` (already installed) | Card numbers never touch our code or our PCI scope | Paystack's native mobile SDKs, whose React Native support I have not verified |
| R-7 | Pay out M-Pesa-funded money through Daraja B2C. For card-funded money, compare Paystack transfers to M-Pesa wallets with topping up the B2C account | Money from cards and M-Pesa ends up in different places | One float funded by hand. See [Open items](#open-items) |
| R-8 | Admins sign in to the dashboard with Google, with a secure cookie session and a server-side role check | Reuses the same accounts, and Google can enforce two-factor authentication | Separate admin credentials |
| R-9 | Jest with `jest-expo` for mobile, and Vitest with `mongodb-memory-server` for the API, with GitHub Actions for CI | `jest-expo` is pinned to the SDK. The API can be tested without external services | Other test runners |
| R-10 | Put Atlas and Vercel functions in the same European region, such as Frankfurt or Ireland | Close to Kenya compared with the default US East. Atlas Free offers only some regions, so check when creating it | South Africa, if Atlas Free offers it there |
| R-11 | Reserve stock at checkout, for about 15 minutes, until payment completes | Stops two customers buying the last unit | Reduce stock only on payment, which risks overselling |
| R-12 | Keep `type` and `audience` as separate product fields | The old `category` mixed them, so a product could not be both "shoes" and "for women" | One category tree |
| R-13 | Delete `Backend/` at the end of Phase 2 | The app does not use it, and it holds the exposed credential | Delete it sooner |
| R-14 | Use FlashList for product lists | Pinned by SDK 58, and better for long lists with images | FlatList |
| R-15 | Send push through the Expo push service with `expo-server-sdk` | The standard server side of `expo-notifications` | Direct FCM and APNs |

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
| Production build format | Before Phase 8 | `eas.json` currently builds an APK for production. Google Play requires an app bundle (`.aab`) for store submission |
| Tax treatment of commission | Before Phase 8 | Ask an accountant about VAT and income tax on commission |
| Rate limiting and error reporting tools | Before Phases 3 and 8 | Not yet compared |
