# API contract, version 1

This is the contract between the mobile app, admin dashboard and Next.js API. Change this document in the same pull request as any endpoint change.

This design is **recommended**, based on the [decisions](DECISIONS.md), and is ready for review. Daraja details need confirming against Safaricom's documentation when Phase 5 starts.

**Base URL:** `https://<production-domain>/api/v1`

## Conventions

**Authentication:** Send `Authorization: Bearer <accessToken>`. Access levels:

- **Public:** no token needed
- **User:** any signed-in user, limited to their own data
- **Seller:** an approved seller, limited to their own products, orders and earnings
- **Admin:** a platform admin

**Success responses** wrap data in `data`. Lists add `meta`.

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
| 401 | `unauthenticated` | Token is missing, invalid or expired. The app refreshes once, then signs out |
| 403 | `forbidden` | Signed in, but not allowed |
| 404 | `not_found` | Does not exist, or the caller may not know it exists |
| 409 | `conflict` | For example, insufficient stock or an invalid status change |
| 429 | `rate_limited` | Too many requests |
| 500 | `internal_error` | Unexpected failure. Details are logged, never returned |

**Pagination:** Lists use `?limit=` (default 20, maximum 50) and `?cursor=` with the `nextCursor` from the previous response. `nextCursor` is `null` on the last page.

**Money:** Whole Kenyan shillings as integers. `2500` means KES 2,500.

**Dates:** ISO 8601 in UTC.

**Caching:** Public product endpoints set `Cache-Control: s-maxage=60, stale-while-revalidate=300`. Authenticated responses are never cached.

## Health and configuration

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET /health` | Public | Confirms the deployment is running and the database is reachable |
| `GET /config` | Public | Minimum supported app version, video limits, dispute window |

## Authentication

| Method and path | Access | Purpose |
| --- | --- | --- |
| `POST /auth/google` | Public | Exchange a Google ID token for a session |
| `POST /auth/apple` | Public | Exchange an Apple identity token for a session |
| `POST /auth/refresh` | Public | Exchange a refresh token for a new pair |
| `POST /auth/logout` | Public | Revoke the session belonging to a refresh token |

`POST /auth/google` takes `{ "idToken": "..." }`. `POST /auth/apple` takes `{ "identityToken": "...", "fullName": { "givenName": "...", "familyName": "..." } }`.

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
      "role": "customer",
      "seller": null
    }
  }
}
```

`POST /auth/refresh` takes `{ "refreshToken": "..." }` and returns a new pair. The old token stops working immediately, and presenting a used token revokes the session and returns 401.

## Current user

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET /me` | User | Profile, delivery address, seller status |
| `PATCH /me` | User | Update name, phone or delivery address |
| `DELETE /me` | User | Delete the account (see below) |
| `PUT /me/push-tokens` | User | Register a device: `{ "token": "ExponentPushToken[...]", "platform": "android" }` |
| `DELETE /me/push-tokens/{token}` | User | Remove a device on sign-out |
| `GET /me/wishlist` | User | Saved products |
| `PUT /me/wishlist/{productId}` | User | Save a product, idempotent |
| `DELETE /me/wishlist/{productId}` | User | Remove a saved product, idempotent |

`DELETE /me` removes sessions, push tokens, the wish list and the profile. Past orders and ledger entries are kept for business and legal records, with personal details replaced. It is refused with 409 while the user has open orders, disputes or an unpaid seller balance. The privacy policy must state this.

## Products

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET /products` | Public | List active products from approved sellers |
| `GET /products/{id}` | Public | Product details |
| `GET /sellers/{id}` | Public | Public seller profile: name, delivery fee, returns note |

`GET /products` filters: `type` (`shoes`, `clothing`), `audience` (`men`, `women`, `children`, `unisex`), `seller`, `q` (text search), plus pagination. Results are newest first.

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

The API returns `publicId`, and the app builds optimized Cloudinary URLs itself, so that sizes can change without an API change.

## Uploads

| Method and path | Access | Purpose |
| --- | --- | --- |
| `POST /uploads/sign` | Seller, or User for application documents | Get signed parameters for a direct Cloudinary upload |

Request: `{ "kind": "image" }`, `{ "kind": "video" }` or `{ "kind": "document" }`.

```json
{
  "data": {
    "uploadUrl": "https://api.cloudinary.com/v1_1/<cloud>/video/upload",
    "apiKey": "...",
    "timestamp": 1793620800,
    "signature": "...",
    "folder": "sellers/6731aa/products",
    "eager": "sp_auto:maxres_720p"
  }
}
```

The API secret stays on the server. Identity documents upload as private assets.

## Seller: application and profile

| Method and path | Access | Purpose |
| --- | --- | --- |
| `POST /seller/application` | User | Apply to sell |
| `GET /seller/application` | User | Check application status |
| `GET /seller/profile` | Seller | Business and delivery settings |
| `PATCH /seller/profile` | Seller | Update settings. Changing the payout number returns the seller to review |

```json
{
  "businessName": "Nairobi Soles",
  "phone": "+2547XXXXXXXX",
  "payoutMpesaNumber": "+2547XXXXXXXX",
  "deliveryFee": 250,
  "deliveryAreas": "Nairobi and Kiambu",
  "returnsNote": "Unworn items within 7 days",
  "documents": [{ "kind": "id", "publicId": "applications/u1/id" }]
}
```

## Seller: listings

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET /seller/products` | Seller | The seller's own products, including archived |
| `POST /seller/products` | Seller | Create a product |
| `PATCH /seller/products/{id}` | Seller | Update the seller's own product |
| `DELETE /seller/products/{id}` | Seller | Archive it; past orders keep their snapshot |

Media must be in the seller's own Cloudinary folder. Video length and size are checked against the configured limits.

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
| `POST /checkout` | User | Create the purchase and orders, and start payment. Requires `Idempotency-Key` |
| `GET /purchases/{ref}` | User | Payment status and the purchase's orders |
| `POST /purchases/{ref}/pay` | User | Retry payment for an unpaid purchase |

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

Response (201):

```json
{
  "data": {
    "ref": "P7K4M2QX",
    "total": 11250,
    "payment": {
      "method": "card",
      "status": "pending",
      "authorizationUrl": "https://checkout.paystack.com/..."
    },
    "orders": [
      {
        "ref": "K7P4M2QX",
        "seller": { "id": "6731aa...", "name": "Nairobi Soles" },
        "subtotal": 4800,
        "deliveryFee": 250,
        "total": 5050,
        "status": "awaiting_payment"
      }
    ]
  }
}
```

Rules:

- The server ignores any price, fee or total from the client.
- Repeating a request with the same `Idempotency-Key` returns the original purchase and creates nothing new.
- If stock runs out, the response is 409, and `details` lists the affected products. Nothing is reserved.
- Items from a seller who is no longer approved, or from an archived product, are rejected.
- Reservations expire if payment does not complete.
- The app polls `GET /purchases/{ref}` at a gentle interval after an STK Push or hosted card page, until the status settles or a timeout passes.

## Orders (buyer)

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET /orders` | User | The caller's orders, newest first |
| `GET /orders/{ref}` | User | One order. Returns 404 if it is not theirs |
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

Used by the dashboard, with a secure cookie session *(recommended)*, and always checked for the admin role.

| Method and path | Purpose |
| --- | --- |
| `GET /admin/sellers` | Applications and sellers, filterable by status |
| `GET /admin/sellers/{id}` | Details, with short-lived links to documents |
| `POST /admin/sellers/{id}/approve` | Approve |
| `POST /admin/sellers/{id}/reject` | Reject, with a reason |
| `POST /admin/sellers/{id}/suspend` | Suspend and hide listings |
| `GET /admin/products` | All listings |
| `POST /admin/products/{id}/remove` | Remove a listing, with a reason |
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
| `POST /webhooks/paystack` | Paystack | HMAC SHA512 of the raw body, compared with `x-paystack-signature` |
| `POST /webhooks/daraja/stk` | Safaricom | To be confirmed; treat as untrusted, and confirm with a status query |
| `POST /webhooks/daraja/b2c-result` | Safaricom | To be confirmed |
| `POST /webhooks/daraja/b2c-timeout` | Safaricom | To be confirmed |

Paystack events used: `charge.success`, `refund.processed`, `refund.failed`. It [retries](https://paystack.com/docs/payments/webhooks/) if it does not get a 200, so acknowledge quickly. Check that the amount and currency match the purchase before marking anything as paid.

## Scheduled jobs

Called by Vercel Cron, requiring `Authorization: Bearer <CRON_SECRET>`. See [Architecture](ARCHITECTURE.md#scheduled-jobs).

| Method and path | Purpose |
| --- | --- |
| `GET /cron/expire-reservations` | Return stock from unpaid checkouts |
| `GET /cron/reconcile-payments` | Check payments with no callback |
| `GET /cron/release-funds` | Complete orders past the buyer's window |
| `GET /cron/send-payouts` | Send released balances, retry failures |
| `GET /cron/push-receipts` | Check Expo receipts, remove dead tokens |

## Old to new endpoints

| Old (`Backend/`) | New |
| --- | --- |
| `GET /products` | `GET /api/v1/products` |
| `GET /products/:productId` | `GET /api/v1/products/{id}` |
| `POST /products/new` | `POST /api/v1/seller/products` |
| `POST /orders` | `POST /api/v1/checkout` |
| `GET /orders/:reference` | `GET /api/v1/orders/{ref}` (owner only) |
