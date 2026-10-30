# Product brief

HauteCorner is a fashion marketplace for Kenya. Independent sellers list shoes and clothing, and customers browse, pay by M-Pesa or card, and receive deliveries from each seller through one iOS or Android app. HauteCorner earns a commission on each sale and holds the seller's money until delivery is confirmed. Prices are in Kenyan shillings.

The choices behind this brief are in the [decision log](DECISIONS.md). Values still to be set are listed under [Open items](DECISIONS.md#open-items).

## Users

| User | Needs | Where they work |
| --- | --- | --- |
| Shopper | Browse freely, buy from several sellers at once, trust that a bad order can be resolved | Mobile app |
| Seller | Apply to sell, list products with photos and short videos, fulfil orders, get paid reliably | Mobile app |
| Platform admin | Approve sellers, moderate listings, resolve disputes, oversee payouts | Web dashboard |

## Launch scope

| Feature | Today | At launch |
| --- | --- | --- |
| Catalogue | Loads from an API that now returns 401; category chips do not filter | Live products from all approved sellers, with working filters and search |
| Product details | Works against the old API | Images, short video, price, options, description, stock, seller name |
| Sign-in | None | Google on both platforms, Sign in with Apple on iOS |
| Signed-out browsing | Everything is open | Browsing stays open; sign-in is needed for checkout, wish list, orders and selling |
| Wish list | The tab shows a mock payment screen | Real saved items, synced to the account |
| Cart | Works on the device, one store only | Items from several sellers in one cart, grouped by seller |
| Checkout | Hard-coded customer; totals come from the client | Real delivery details, delivery fee per seller, one payment, totals calculated on the server |
| Payment | Mock screen only | M-Pesa through Daraja and cards through Paystack |
| Orders | Lookup by reference with no access control; shows raw JSON | One order per seller, with its own delivery and status timeline, visible only to those involved |
| Confirming delivery | None | Seller marks it delivered; buyer confirms, or it completes automatically after a set period |
| Returns and disputes | None | Buyer raises a problem within a set window, pausing payout; seller responds first, and an admin decides if needed |
| Seller onboarding | None | Application with business and payout details, approved by an admin |
| Seller listings | Unauthenticated form with no image upload | Sellers create, edit and archive their own products, with photos and short videos |
| Seller delivery | None | Sellers arrange their own delivery and set their own fee |
| Seller payouts | None | Commission deducted, balance released after delivery, paid out to the seller |
| Admin dashboard | None | Seller approvals, listing moderation, disputes, payout oversight, on the Next.js site |
| Push notifications | None | Order, delivery, dispute and payout updates |
| Profile | Placeholder | Details, delivery address, sign out, delete account |
| App updates | Store releases only | Over-the-air JavaScript updates through EAS Update |
| Landing page | None | Marketing page, privacy policy, terms, seller terms, support, account deletion |

## Out of scope for launch

- A courier partnership run by HauteCorner, or live delivery tracking
- Seller subscriptions, and promoted listings
- PayPal (the current mock screen shows its logo, and nothing behind it exists)
- Customer reviews, discount codes, loyalty
- A web storefront; the website covers marketing, legal pages and the admin dashboard only
- Unrestricted-length video

## Success criteria

1. A new shopper can install the app, find products from two sellers, and pay in under three minutes.
2. Every total and commission is calculated on the server, and nobody can read an order they are not part of.
3. Every shilling can be traced: each payment, commission, refund and payout has a ledger entry, and balances reconcile with Safaricom and Paystack records.
4. No seller is paid for an order that has an open dispute, and no payout is sent twice.
5. A seller can list a product with photos and a short video from a phone in under three minutes.
6. Status changes reach the phones of those involved by push within a minute.
7. The app passes Apple and Google review.
