# API contract, version 1

This is the contract between the mobile app, admin dashboard and Next.js API. Change this document in the same pull request as any endpoint change.

Approved in [ADR-023](DECISIONS.md#adr-023-technical-foundations-for-phases-1-and-2). The Daraja integration follows Safaricom's published M-Pesa Express format and has been tested against a fake, not yet the sandbox.

**Base URL:** `https://<production-domain>/api/v1`

## Conventions

**Authentication:** Send `Authorization: Bearer <accessToken>`. Access levels:

- **Public:** no token needed
- **User:** any signed-in user, limited to their own data
- **Seller:** an approved seller, limited to their own products, orders and earnings
- **Admin:** a platform admin

**Success responses** wrap data in `data`. Lists add `meta`. Actions with nothing to return, such as signing out, answer `204 No Content` with no body.

```json
{
  "data": [],
  "meta": { "nextCursor": "6731f0..." }
}
```

**Error responses** use one shape:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Quantity must be at least 1",
    "details": { "items.0.quantity": "Must be at least 1" }
  }
}
```

| Status | Code | Meaning |
| --- | --- | --- |
| 400 | `validation_failed` | Request failed schema validation |
| 400 | `invalid_code` | An emailed code is wrong, expired or used up |
| 401 | `invalid_credentials` | Email and password do not match, or there is no such account. The two are not told apart |
| 401 | `unauthenticated` | Token is missing, invalid or expired. The app refreshes once, then signs out |
| 403 | `forbidden` | Signed in, but not allowed |
| 404 | `not_found` | Does not exist, or the caller may not know it exists |
| 409 | `conflict` | For example, insufficient stock or an invalid status change |
| 409 | `account_exists` | Sign-up for an address that already has a password |
| 409 | `wishlist_full` | The wish list already holds 200 products |
| 502 | `payment_failed` | Daraja or Paystack refused to start a payment |
| 429 | `rate_limited` | Too many requests. `Retry-After` gives the seconds to wait |
| 500 | `internal_error` | Unexpected failure. Details are logged, never returned |
| 503 | `service_unavailable` | A dependency such as the database is not reachable |

**Pagination:** Lists use `?limit=` (default 20, maximum 50) and `?cursor=` with the `nextCursor` from the previous response. `nextCursor` is `null` on the last page.

**Money:** Whole Kenyan shillings as integers. `2500` means KES 2,500.

**Dates:** ISO 8601 in UTC.

**Caching:** Public product endpoints set `Cache-Control: s-maxage=60, stale-while-revalidate=300`. Authenticated responses are never cached.

## Health and configuration

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET /health` | Public | Confirms the deployment is running and the database is reachable |
| `GET /config` | Public | Values the app needs at runtime |

```json
{
  "data": {
    "minimumAppVersion": "1.0.0",
    "cloudinaryCloudName": "dxnevfcm",
    "maxVideoSeconds": 30,
    "maxVideoBytes": 100000000,
    "maxImagesPerProduct": 10,
    "maxImageBytes": 20000000
  }
}
```

Media limits follow [ADR-042](DECISIONS.md#adr-042-product-videos-one-per-listing-up-to-30-seconds-and-100-mb). The dispute window joins this response once it is decided.

## Authentication

| Method and path | Access | Purpose |
| --- | --- | --- |
| `POST /auth/google` | Public | Exchange a Google ID token for a session |
| `POST /auth/apple` | Public | Exchange an Apple identity token for a session |
| `POST /auth/email/signup` | Public | Start an email sign-up, which emails a code |
| `POST /auth/email/verify` | Public | Confirm the code, create or link the account, and start a session |
| `POST /auth/email/resend` | Public | Send a new code for a sign-up or a password reset |
| `POST /auth/email/sign-in` | Public | Sign in with email and password |
| `POST /auth/password/forgot` | Public | Email a password reset code |
| `POST /auth/password/reset` | Public | Set a new password with the code, and start a session |
| `POST /auth/refresh` | Public | Exchange a refresh token for a new pair |
| `POST /auth/logout` | Public | Revoke the session belonging to a refresh token |

**Linked accounts** ([ADR-037](DECISIONS.md#adr-037-one-account-per-verified-email)): one account per verified email address. Signing in with Google or Apple finds the account already linked to that identity, then an account with the same verified email, which it links, and only then creates one. Apple's private relay addresses never match another account.

`POST /auth/google` takes `{ "idToken": "..." }`, an ID token requested for the web client ID. `POST /auth/apple` takes `{ "identityToken": "...", "fullName": { "givenName": "...", "familyName": "..." } }`. Apple gives the app the name only on the first sign-in, and `fullName` and its parts may be `null`. The name is saved only when the account is created, so later changes made in the app are kept.

A provider token that fails verification returns 401. If Google or Apple cannot be reached to fetch their keys, the API returns 503.

### Email and password

1. `POST /auth/email/signup` takes `{ "name", "email", "password" }`. It stores the sign-up, emails a 6-digit code, and returns 202 with `{ "email", "expiresInSeconds": 600, "resendAfterSeconds": 60 }`. No account exists until the code comes back. An address that already has a password gets 409 `account_exists`. One that only has Google or Apple can add a password this way.
2. `POST /auth/email/verify` takes `{ "email", "code" }` and returns a session, like Google sign-in. A new account also gets a welcome email.
3. `POST /auth/email/sign-in` takes `{ "email", "password" }` and returns a session.
4. `POST /auth/password/forgot` takes `{ "email" }` and always returns 202, whether or not the address has an account. `POST /auth/password/reset` takes `{ "email", "code", "password" }`, sets the password, signs out every other device, emails a notice, and returns a session.
5. `POST /auth/email/resend` takes `{ "email", "purpose": "signup" | "reset" }`.

Rules *(recommended, R-21 to R-23)*:

- Emails are compared in lower case. Passwords need 8 to 128 characters, with no other rules.
- A code works for 10 minutes and 5 tries, and only once. Asking for another within a minute returns 429.
- Codes are stored only as an HMAC, and passwords as scrypt hashes.
- Limits per email address and per network address apply to sign-in, codes sent and codes checked. See `web/lib/rate-limit.ts`.

Both return:

```json
{
  "data": {
    "accessToken": "<jwt, 15 minutes>",
    "refreshToken": "<opaque, 30 days>",
    "user": {
      "id": "6731f0...",
      "name": "Asha Otieno",
      "email": "asha@example.com",
      "avatarUrl": null,
      "phone": null,
      "deliveryAddress": null,
      "role": "customer",
      "signInMethods": ["google"],
      "seller": null
    }
  }
}
```

`user` has the same shape as `GET /me`. `signInMethods` lists `google`, `apple` and `email`, for each way this account can sign in. `seller` is `null`, or `{ "id": "...", "status": "applied" }` once the user has applied to sell.

`POST /auth/refresh` takes `{ "refreshToken": "..." }` and returns `{ "accessToken", "refreshToken" }`. The old token stops working immediately. Presenting the token that was just replaced revokes the session and returns 401, so a client must never send two refreshes at once.

`POST /auth/logout` takes `{ "refreshToken": "..." }` and returns 204, even for an unknown or already revoked token.

## Current user

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET /me` | User | Profile, delivery address, seller status |
| `PATCH /me` | User | Update name, phone or delivery address |
| `DELETE /me` | User | Delete the account (see below) |
| `PUT /me/push-tokens` | User | Register a device: `{ "token": "ExponentPushToken[...]", "platform": "android" }` |
| `DELETE /me/push-tokens/{token}` | User | Remove a device on sign-out |
| `GET /me/wishlist` | User | Saved product IDs, newest first: `{ "productIds": [...] }` |
| `POST /me/wishlist` | User | Merge likes made before signing in: `{ "productIds": [...] }`. Returns the whole list |
| `PUT /me/wishlist/{productId}` | User | Save a product at the top, idempotent. 204, or 404 if it is not for sale |
| `DELETE /me/wishlist/{productId}` | User | Remove a saved product, idempotent. 204 |

The wish list holds up to 200 products ([ADR-038](DECISIONS.md#adr-038-likes-without-an-account-synced-once-signed-in)). The app loads the products themselves from `GET /products?ids=`, which works signed in or not. A merge puts new IDs first, skips products not for sale, and keeps the newest 200.

`PATCH /me` takes any of these, and `null` clears a field:

```json
{
  "name": "Asha Otieno",
  "phone": "0712 345 678",
  "deliveryAddress": { "line1": "Ngong Road, Prestige Plaza", "area": "Kilimani", "city": "Nairobi", "notes": "Gate B" }
}
```

- `phone` accepts Kenyan mobile numbers written as `0712 345 678`, `712345678`, `254712345678` or `+254 712 345 678`, and is stored and returned as `+254712345678`.
- `deliveryAddress` needs `line1` and `city`. `area` and `notes` are optional.
- Any other field, such as `role`, is refused with 400. It returns the updated profile.

`DELETE /me` returns 204. It removes sessions, push tokens, pending codes, the wish list, the password, linked Google and Apple identities, and the profile. Past orders and ledger entries are kept for business and legal records, with personal details replaced. It is refused with 409 while the user has orders in progress, as buyer or seller (paid, confirmed, dispatched, delivered or disputed); the unpaid seller balance check comes with payouts in Phase 6. Past orders and purchases lose their buyer link, contact and address. A seller's shop is suspended and its listings hidden ([R-28](DECISIONS.md#recommended)). The privacy policy must state this.

## Products

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET /products` | Public | List active products from approved sellers |
| `GET /products/{id}` | Public | Product details |
| `GET /sellers/{id}` | Public | Public seller profile: `id`, `name`, `deliveryFee`, `deliveryAreas`, `returnsNote` |
| `POST /products/{id}/reports` | User | Report a listing for admins to review |

`GET /products` filters: `type` (`shoes`, `clothing`), `audience` (`men`, `women`, `children`, `unisex`), `seller`, `q` (text search), plus pagination. `ids` takes up to 200 comma-separated IDs and returns those for sale in one page, as for a wish list. Results are newest first. Only active products from approved sellers appear, and a seller's phone, payout number and documents are never returned.

```json
{
  "id": "6731f0...",
  "title": "Leather ankle boots",
  "description": "Hand-finished leather boots.",
  "type": "shoes",
  "audience": "women",
  "price": 4800,
  "currency": "KES",
  "media": [
    { "kind": "image", "publicId": "sellers/abc/products/p1", "width": 1600, "height": 1600 },
    { "kind": "video", "publicId": "sellers/abc/products/v1", "durationSeconds": 12 }
  ],
  "options": ["38", "39", "40"],
  "stock": 12,
  "status": "active",
  "seller": { "id": "6731aa...", "name": "Nairobi Soles", "deliveryFee": 250 },
  "createdAt": "2026-11-02T09:00:00.000Z"
}
```

The API returns `publicId`, and the app builds optimized Cloudinary URLs itself, so that sizes can change without an API change. A video streams from `/video/upload/sp_auto:maxres_720p/<publicId>.m3u8`, with its first frame at `/video/upload/so_0,c_scale,w_<width>/q_auto/f_jpg/<publicId>.jpg` as the poster.

`POST /products/{id}/reports` takes `{ "reason": "counterfeit" | "prohibited" | "misleading" | "offensive" | "scam" | "other", "details": "..." }`, with `details` optional and up to 1,000 characters. It returns 202. Reporting the same listing again while the first report is open changes nothing. Sellers cannot report their own listings (409), and each user can send 20 reports a day.

## Uploads

| Method and path | Access | Purpose |
| --- | --- | --- |
| `POST /uploads/sign` | Seller, or User for application documents | Get signed parameters for a direct Cloudinary upload |

Request: `{ "kind": "image" }`, `{ "kind": "video" }` or `{ "kind": "document" }`. Images and videos need an approved seller. Documents need only a signed-in user, for applying.

```json
{
  "data": {
    "uploadUrl": "https://api.cloudinary.com/v1_1/<cloud>/video/upload",
    "apiKey": "...",
    "signature": "...",
    "params": {
      "timestamp": 1793620800,
      "public_id": "hautecorner/sellers/6731aa/products/4f1c...",
      "asset_folder": "hautecorner/sellers/6731aa/products",
      "allowed_formats": "mp4,mov,m4v,webm,3gp",
      "eager": "sp_auto:maxres_720p/m3u8",
      "eager_async": "true"
    }
  }
}
```

The app posts a multipart form to `uploadUrl` with every `params` entry unchanged, plus `api_key`, `signature` and `file`, and keeps the `public_id` Cloudinary returns. The server chooses the file's folder and name, so a signature cannot put a file anywhere else ([R-24](DECISIONS.md#recommended)). Documents are signed with `type: private` and go to `hautecorner/applications/<user ID>/`. The API secret stays on the server. Each user can get 300 signatures an hour.

## Seller: application and profile

| Method and path | Access | Purpose |
| --- | --- | --- |
| `POST /seller/application` | User | Apply to sell, or apply again after a rejection |
| `GET /seller/application` | User | The user's shop in any status, or 404 before applying |
| `GET /seller/profile` | Seller | Business and delivery settings |
| `PATCH /seller/profile` | Seller | Update settings. A new payout number pauses payouts until an admin confirms it |

`POST /seller/application` takes:

```json
{
  "businessName": "Nairobi Soles",
  "phone": "0712 345 678",
  "payoutMpesaNumber": "0712 345 678",
  "deliveryFee": 250,
  "deliveryAreas": "Nairobi and Kiambu",
  "returnsNote": "Unworn items within 7 days",
  "documents": [{ "kind": "national_id", "publicId": "hautecorner/applications/<user ID>/..." }]
}
```

- Phone numbers are normalised as for `PATCH /me`. `deliveryFee` is whole shillings, 0 to 10,000. `returnsNote` is optional.
- `documents` holds 1 to 5 private uploads from the user's own application folder. `kind` is `national_id`, `passport`, `business_registration`, `kra_pin` or `other`. The app asks for an ID photo and, optionally, a business registration certificate ([R-25](DECISIONS.md#recommended)).
- It returns 201 with the shop. A user who is applying, approved or suspended gets 409. A rejected user can apply again, which replaces the application.

The shop, from `GET /seller/application` and both profile endpoints:

```json
{
  "id": "6731aa...",
  "status": "applied",
  "businessName": "Nairobi Soles",
  "phone": "+254712345678",
  "payoutMpesaNumber": "+254712345678",
  "payoutNumberUnderReview": false,
  "deliveryFee": 250,
  "deliveryAreas": "Nairobi and Kiambu",
  "returnsNote": "Unworn items within 7 days",
  "documents": [{ "kind": "national_id" }],
  "reviewReason": null,
  "createdAt": "2026-11-13T09:00:00.000Z"
}
```

`status` is `applied`, `approved`, `rejected` or `suspended`. `reviewReason` is the admin's reason when rejected or suspended. Document IDs are never returned. `PATCH /seller/profile` takes any of the application's fields except `documents`, and `returnsNote: null` clears the note.

## Seller: listings

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET /seller/products` | Seller | The seller's own products in every status, filterable by `status`, with pagination |
| `GET /seller/products/{id}` | Seller | One of the seller's products |
| `POST /seller/products` | Seller | Create a product, on sale at once ([R-26](DECISIONS.md#recommended)) |
| `PATCH /seller/products/{id}` | Seller | Update the seller's own product, or set `status` to `archived` or `active` |
| `DELETE /seller/products/{id}` | Seller | Archive it; past orders keep their snapshot |

`POST /seller/products` takes `title` (3 to 120 characters), `description` (10 to 3,000), `type`, `audience`, `price` (whole shillings, 1 to 1,000,000), `stock` (0 to 10,000), `options` (up to 30 sizes, optional) and `media`, a list of `{ "kind": "image" | "video", "publicId": "..." }`. `PATCH` takes any of these.

- `media` needs at least one image, and allows up to 10 images and 1 video. The first image is the cover.
- Each new file must be in the seller's own folder. Its dimensions, size and length come from Cloudinary, and a video over 30 seconds or 100 MB, or an image over 20 MB, is refused with 400 and `details.media`. Files already on the product are not checked again.
- `status`, `sellerId` and any other field are refused with 400. A product an admin removed cannot be changed (409).
- Another seller's product is 404, never 403.

Products here include `removedReason`, which only the seller and admins see.

## Seller: orders and earnings

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET /seller/orders` | Seller | The seller's orders, filterable by `status` |
| `GET /seller/orders/{ref}` | Seller | One order |
| `POST /seller/orders/{ref}/confirm` | Seller | Accept the order |
| `POST /seller/orders/{ref}/reject` | Seller | Reject it; refunds the buyer |
| `POST /seller/orders/{ref}/dispatch` | Seller | Mark as sent |
| `POST /seller/orders/{ref}/delivered` | Seller | Mark as delivered; starts the buyer's window |
| `GET /seller/earnings` | Seller | Held, available and paid amounts |
| `GET /seller/payouts` | Seller | Payout history |

## Checkout

| Method and path | Access | Purpose |
| --- | --- | --- |
| `POST /checkout/quote` | User | Prices, delivery fees and totals for a cart, with no side effects |
| `POST /checkout` | User | Create the purchase and orders, reserve stock, and start payment. Requires `Idempotency-Key` |
| `GET /purchases/{ref}` | User | Payment status and the purchase's orders |
| `POST /purchases/{ref}/pay` | User | Try payment again, optionally with another method or number |

`POST /checkout/quote` takes `{ "items": [...] }`, the same items as below, and returns `subtotal`, `deliveryTotal`, `total` and one entry per seller with its items, `subtotal`, `deliveryFee` and `total`. A product no longer for sale, or more than is in stock, is 409, and a size the product does not have is 400; `details` names the cart line, such as `"items.1": "Only 2 left"`. The same product and size on two lines count as one.

`POST /checkout`

```json
{
  "items": [
    { "productId": "6731f0...", "option": "39", "quantity": 1 },
    { "productId": "6731f8...", "quantity": 2 }
  ],
  "contact": { "name": "Asha Otieno", "phone": "+2547XXXXXXXX" },
  "deliveryAddress": { "line1": "Ngong Road", "area": "Kilimani", "city": "Nairobi", "notes": "Gate B" },
  "payment": { "method": "mpesa", "phone": "+2547XXXXXXXX" }
}
```

For cards, send `"payment": { "method": "card" }`.

Response (201, or 200 when the `Idempotency-Key` was seen before):

```json
{
  "data": {
    "ref": "P7K4M2QX",
    "total": 11250,
    "currency": "KES",
    "payment": {
      "method": "card",
      "status": "pending",
      "phone": null,
      "authorizationUrl": "https://checkout.paystack.com/...",
      "failureReason": null,
      "receipt": null,
      "paidAt": null
    },
    "reservedUntil": "2026-11-13T09:15:00.000Z",
    "orders": [
      {
        "ref": "K7P4M2QX",
        "status": "awaiting_payment",
        "seller": { "id": "6731aa...", "name": "Nairobi Soles" },
        "items": [{ "productId": "...", "title": "Leather ankle boots", "image": "<publicId>", "option": "39", "unitPrice": 4800, "quantity": 1, "lineTotal": 4800 }],
        "subtotal": 4800,
        "deliveryFee": 250,
        "total": 5050,
        "contact": { "name": "Asha Otieno", "phone": "+254712345678" },
        "deliveryAddress": { "line1": "Ngong Road", "area": "Kilimani", "city": "Nairobi", "notes": "Gate B" },
        "statusHistory": [{ "status": "awaiting_payment", "at": "...", "note": null }],
        "createdAt": "..."
      }
    ],
    "createdAt": "..."
  }
}
```

`payment.status` is `pending`, `paid`, `failed` (try again with `/pay`) or `expired` (the items were released). `authorizationUrl` is set only while a card payment is pending. `receipt` is the M-Pesa receipt number once paid.

Rules:

- Any price, fee or total in the request is refused with 400. Every amount comes from the database.
- `Idempotency-Key` must be 8 to 100 characters. Repeating a request with the same key returns the original purchase, and creates, reserves and charges nothing new.
- Stock for every item is reserved in one transaction, or none is. If anything has run out, the response is 409.
- Items from a seller who is no longer approved, or from a product not on sale, are refused.
- Stock is held for 15 minutes ([R-11](DECISIONS.md#recommended)). A purchase not paid by then expires, its orders are cancelled and its stock returns. The provider is asked first, so a payment that did arrive is kept.
- If M-Pesa or Paystack cannot start the payment, the purchase is still created, with `payment.status` `failed` and a `failureReason`, so the app can offer to try again.
- The app polls `GET /purchases/{ref}` every 3 seconds while payment is pending. Each poll may ask the provider for the outcome, at most every 10 seconds, so a lost callback does not leave the buyer waiting.
- `POST /purchases/{ref}/pay` takes `{}` to try the same method again, or `{ "payment": { ... } }` to switch. It works while the purchase is `pending` or `failed` and its stock is still held; otherwise 409.
- Each user can start 30 checkouts in 10 minutes.

After the Paystack page, the browser goes to `/pay/return?ref=<ref>` on the website, which opens `hautecorner://purchase/<ref>` in the app. Reaching it confirms nothing.

## Orders (buyer)

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET /orders` | User | The caller's orders, newest first, with pagination. Orders still waiting for payment are left out |
| `GET /orders/{ref}` | User | One order, in the shape shown under checkout. Returns 404 if it is not theirs |
| `POST /orders/{ref}/cancel` | User | Cancel before dispatch; refunds the buyer |
| `POST /orders/{ref}/confirm-delivery` | User | Confirm receipt, which releases the seller's money |

**Order statuses:** `awaiting_payment` → `paid` → `confirmed` → `dispatched` → `delivered` → `completed`. Also `cancelled`, `disputed` and `refunded`. See [Architecture](ARCHITECTURE.md#order-delivery-and-release-of-funds).

## Disputes

| Method and path | Access | Purpose |
| --- | --- | --- |
| `POST /orders/{ref}/dispute` | User | Open a dispute within the window; freezes the payout |
| `GET /disputes/{id}` | Buyer, Seller or Admin | Details and messages for those involved |
| `POST /disputes/{id}/messages` | Buyer, Seller or Admin | Add a message or evidence |
| `POST /disputes/{id}/accept-refund` | Seller | Seller agrees to refund |
| `POST /disputes/{id}/escalate` | Buyer or Seller | Send it to an admin |

## Admin

The dashboard at `/admin` is server-rendered, and changes data through Server Actions rather than API routes ([R-27](DECISIONS.md#recommended)). Admins sign in with Google ([R-8](DECISIONS.md#recommended)):

| Method and path | Purpose |
| --- | --- |
| `POST /api/admin/session` | Takes `{ "credential": "<Google ID token>" }` from Google's sign-in button. For an existing account with the admin role, sets an `HttpOnly` cookie for 8 hours and returns 204; otherwise 403 |
| `DELETE /api/admin/session` | Signs out |

These paths are outside `/api/v1`. Both refuse requests from another origin. Every page and action checks the admin role in the database, so removing the role takes effect at once.

Built in Phase 4, each writing an audit entry:

| Action | Rules |
| --- | --- |
| Approve a seller | From `applied`. Hidden listings go back on sale. Emails the seller |
| Reject a seller | From `applied`, with a reason the seller sees. Emails the seller |
| Suspend a seller | From `approved`, with a reason. Hides their listings. Emails the seller |
| Reinstate a seller | From `suspended`. Listings go back on sale. Emails the seller |
| Confirm a payout number | Clears the pause after a seller changes their M-Pesa number |
| Remove a listing | With a reason the seller sees. Closes the listing's open reports. Emails the seller |
| Restore a listing | On sale again if its seller is approved, hidden otherwise |
| Dismiss a report | With an optional note for admins |

A move from the wrong status is refused, so two admins acting on stale pages cannot both succeed. Identity documents open through signed links that work for 10 minutes.

Later phases, as originally planned:

| Method and path | Purpose |
| --- | --- |
| `GET /admin/orders` | All orders |
| `GET /admin/disputes` | Escalated disputes |
| `POST /admin/disputes/{id}/resolve` | Decide for the buyer or seller, moving the money |
| `GET /admin/payouts` | Payouts and failures |
| `POST /admin/payouts/{id}/retry` | Retry a failed payout |
| `GET /admin/ledger` | Ledger entries, for reconciliation |
| `GET /admin/settings`, `PATCH /admin/settings` | Commission rate, auto-release days, dispute window, video limits |

Every admin action writes an audit entry saying who did what and why.

## Webhooks

These are public but must verify the sender and ignore duplicates.

| Method and path | Sender | Verification |
| --- | --- | --- |
| `POST /webhooks/paystack` | Paystack | HMAC SHA512 of the raw body with the secret key, compared with `x-paystack-signature`. Then a verify call checks status, amount and currency |
| `POST /webhooks/daraja/stk?token=<DARAJA_CALLBACK_TOKEN>` | Safaricom | Not signed. The token in the address must match, and the outcome is always confirmed with an STK status query ([R-32](DECISIONS.md#recommended)) |
| `POST /webhooks/daraja/b2c-result` | Safaricom | To be confirmed |
| `POST /webhooks/daraja/b2c-timeout` | Safaricom | To be confirmed |

Paystack events used: `charge.success` now, and `refund.processed` and `refund.failed` in Phase 6. It [retries](https://paystack.com/docs/payments/webhooks/) if it does not get a 200, so acknowledge quickly. The amount and currency must match the purchase before anything is marked paid.

Each delivery is recorded as a `WebhookEvent`, so a repeat returns 200 and does nothing. The Daraja callback always answers `{ "ResultCode": 0, "ResultDesc": "Accepted" }`.

## Scheduled jobs

Called by Vercel Cron, requiring `Authorization: Bearer <CRON_SECRET>`. See [Architecture](ARCHITECTURE.md#scheduled-jobs). Not scheduled until Vercel Pro, as Hobby runs jobs only daily; until then checkout and payment checks do the same work as they go ([Setup](SETUP.md#scheduled-jobs-phase-5)).

| Method and path | Purpose |
| --- | --- |
| `GET /cron/expire-reservations` | Return stock from unpaid checkouts. Returns `{ "expired": n }`. Built in Phase 5 |
| `GET /cron/reconcile-payments` | Check pending payments older than a minute with their provider. Returns `{ "checked": n, "settled": n }`. Built in Phase 5 |
| `GET /cron/release-funds` | Complete orders past the buyer's window |
| `GET /cron/send-payouts` | Send released balances, retry failures |
| `GET /cron/push-receipts` | Check Expo receipts, remove dead tokens |

## Old to new endpoints

For reference. The old Express server has been deleted.

| Old | New |
| --- | --- |
| `GET /products` | `GET /api/v1/products` |
| `GET /products/:productId` | `GET /api/v1/products/{id}` |
| `POST /products/new` | `POST /api/v1/seller/products` |
| `POST /orders` | `POST /api/v1/checkout` |
| `GET /orders/:reference` | `GET /api/v1/orders/{ref}` (owner only) |
