# Security

## Past incident: exposed database credential

The old `Backend/serverless.yml` held a MongoDB connection string with a username and password, committed to this public repository.

| Step | Status |
| --- | --- |
| Change the password | Done, confirmed by the owner on 2 November 2026 |
| Remove the credential from the code | Done; `Backend/` deleted |
| Rewrite git history | Decided against ([ADR-031](DECISIONS.md#adr-031-backend-deleted-git-history-kept)), since the old value no longer works |
| Review the old cluster for unexpected data and unknown access list entries | **Still to do, by the owner.** Past orders may hold customer names, phone numbers and addresses. If real customer data was stored there, consider your obligations under Kenya's Data Protection Act |

The new database lives in a separate Atlas project and imports nothing from the old cluster. The old value stays visible in past commits, so never reuse that user or password anywhere.

## Secret handling rules

| Secret | Where it lives | Never |
| --- | --- | --- |
| `MONGODB_URI`, `JWT_SECRET`, `CRON_SECRET`, Cloudinary secret, `EXPO_ACCESS_TOKEN` | Vercel environment variables; `web/.env.local` for development | In git, or in any `EXPO_PUBLIC_*` variable |
| Paystack secret key, Daraja credentials, B2C security credential | Vercel environment variables, with separate test and live values | In git, the app or logs |
| `google-services.json` | EAS file environment variable | In git |
| APNs key, signing keys | EAS credentials | In git |
| User refresh and access tokens | `expo-secure-store` on the device | In MMKV, AsyncStorage or logs |

Anything named `EXPO_PUBLIC_*` is compiled into the app and readable by anyone who downloads it. Google client IDs and the API URL are fine there. Server secrets never are.

A secret scan runs in CI from Phase 1 onward. If a secret ever reaches git, rotate it immediately; deleting the commit is not enough.

## API rules

These are the fixes for what the old system got wrong. Each needs a test.

| Rule | Why | Old behaviour |
| --- | --- | --- |
| Check permissions in every handler | Seller and admin actions must not be open | Anyone could create products |
| Sellers can only touch their own data | The core risk of a marketplace | Not applicable |
| The server calculates all money | Clients can be modified | The client sent subtotal, delivery fee and total |
| Orders are visible only to the buyer, seller and admins | Orders hold personal data | Anyone with a reference could read an order, including contact details |
| References come from `crypto.randomInt` | References must not be guessable | `Math.random()` |
| Validate every request with Zod | Stops malformed data and operator injection | Request bodies were written straight to the database |
| Return generic errors; log details on the server | Avoids leaking internals | Raw `error.message` was returned |
| Rate-limit auth, checkout and uploads | Limits abuse and cost | None |
| Verify provider tokens on the server, including audience | Stops forged sign-ins | No authentication |
| Do not log tokens, addresses or phone numbers | Logs are not a place for personal data | The app logged request data |
| Check that media belongs to the seller's Cloudinary folder | Stops someone attaching another seller's files | No check |

## Payments and held funds

Mistakes here lose real money, so these are not optional.

**Cards**

- Card numbers never reach our code. Customers enter them on Paystack's hosted page.
- Confirm payment only through a verified webhook or Paystack's verify endpoint. [Reaching the callback URL proves nothing](https://paystack.com/docs/payments/accept-payments/).
- Verify webhooks with an HMAC SHA512 of the raw body, compared against `x-paystack-signature`. Compare in constant time.
- Check that the amount and currency match before marking anything as paid.

**M-Pesa**

- Daraja's callback format and security must be confirmed against Safaricom's documentation in Phase 5. Until then, treat callbacks as untrusted, and confirm results with a status query.
- Keep sandbox and production certificates and credentials strictly separate.

**All providers**

- Webhooks are idempotent. A repeated event changes nothing.
- Callback URLs reveal nothing useful, and do not contain secrets you rely on as sole proof.

**Ledger and payouts**

- Only `lib/ledger.ts` writes ledger entries, and entries cannot be edited or deleted.
- Every payout has an idempotency key, so a retry cannot pay twice.
- No payout goes out for an order with an open dispute.
- A changed payout number pauses payouts until an admin reviews it, since this is a common way to steal a seller's money.
- Set alerts for failed payouts, failed webhooks, and any ledger imbalance.

**Legal**

Holding funds for sellers has [an open legal question](DECISIONS.md#open-items). Do not take real money through this flow until it is answered.

## Sellers and listings

- Identity documents upload as private Cloudinary assets, viewable only by admins through short-lived signed URLs. Delete them when no longer legally needed.
- Listings are user-generated content, so the app needs a way to report a listing, and admins need a way to remove it. [App Store guideline 1.2](https://developer.apple.com/app-store/review/guidelines/) expects this kind of moderation.
- Suspending a seller hides their listings immediately. It does not cancel existing orders, which admins handle individually.

## Admin dashboard

- Every admin route and page checks the role on the server. Hiding a link is not protection.
- Sessions use secure, `httpOnly`, `sameSite` cookies, with CSRF protection on state-changing requests.
- Require two-factor authentication on admin Google accounts.
- Every admin action writes an audit entry with the actor and reason.
- Give the admin role to as few people as possible.

## Sessions

- Access tokens are JWTs that last 15 minutes and carry only the user ID and role.
- Refresh tokens are random values that last 30 days. Only their SHA-256 hash is stored.
- Each refresh issues a new token. Reusing an old one revokes the session, since it suggests theft.
- `JWT_SECRET` is at least 32 random bytes, with a different value in production, Preview and each developer's `.env.local`. Changing it invalidates access tokens, and refresh tokens then restore sessions.
- The app keeps the refresh token in the Keychain or Keystore through `expo-secure-store`, and the access token only in memory. It sends one refresh at a time, because two at once would look like reuse.
- Google and Apple tokens are checked for signature, issuer, audience and expiry. Google's audience is the web client ID, and Apple's is the bundle ID.
- Access tokens are checked without reading the database. Routes that act on the account load the user and refuse deleted accounts, so deletion takes effect at once there, and everywhere else within 15 minutes.
- Passwords are hashed with scrypt (N=2^15, r=8, p=3, a random salt each), and checked in constant time. A sign-in for an address with no password takes as long as a real check, and gives the same answer as a wrong password.
- Emailed codes are 6 digits, stored only as an HMAC keyed with `JWT_SECRET`, and work for 10 minutes, 5 tries and once only. A password reset signs out every device and emails a notice.
- Accounts link by email only when the address is verified: by Google (`email_verified`), by Apple (`email_verified`), or by an emailed code. An unverified address is never stored.
- Auth endpoints are rate limited per email address and per network address, with counters in MongoDB. Rate limit keys are hashed, so the counters hold no email addresses.
- `GMAIL_APP_PASSWORD` and the SES keys are secrets, stored only in `web/.env.local` and Vercel.
- Sign-in does not use a nonce yet. One would stop a stolen provider token being replayed within its few minutes of validity.
- Before App Store submission, account deletion must also revoke Sign in with Apple tokens through Apple's REST API. This needs a Sign in with Apple key.

## Database access

Atlas Free does not support network peering or private endpoints, and Vercel uses dynamic IP addresses, so the access list has to allow `0.0.0.0/0`. That leaves credentials as the main protection:

- Use a long random password, unique to each environment.
- Give the API user `readWrite` on its own database only.
- Never connect to production with an admin account from a laptop.

## Personal data

The app stores names, email addresses, phone numbers, delivery addresses, order history and, for sellers, payout numbers and identity documents.

- Collect only what is needed.
- Sellers see a buyer's contact and address only for that buyer's orders, and only as long as fulfilment requires *(recommended)*.
- Account deletion removes the profile, sessions, push tokens and wish list. Orders and ledger entries are kept with personal details replaced.
- The privacy policy must describe this, and the third parties involved: Google, Apple, Expo, Vercel, MongoDB, Cloudinary, Safaricom and Paystack.
- Have the privacy policy reviewed against Kenya's Data Protection Act before launch.

## If you suspect a breach

1. Rotate the affected secret.
2. Pause payouts if money may be affected.
3. Revoke sessions if user accounts may be affected.
4. Check Atlas metrics, Vercel logs, and Safaricom and Paystack records. Free-tier history is short, so do this quickly.
5. Record what happened and what changed, and take legal advice on notifying people.
