# Known issues

These problems are known and left in place on purpose, because a later phase replaces the code they are in, or because they depend on someone outside the code. Remove each entry when it is fixed.

## Security and data

| Location | Problem | Fixed in |
| --- | --- | --- |
| `web/lib/users.ts` | Deleting an account does not yet revoke Sign in with Apple tokens, which App Store review expects | Phase 3 |
| Android Google sign-in | Works on the local debug build (checked on 4 November 2026). Release and EAS builds fail with `DEVELOPER_ERROR` until the Android OAuth client also lists the SHA-1 of the key that signed them ([how](SETUP.md#google-sign-in-phase-3)) | Phase 3 |
| Order cancelled after a late payment | If a payment arrives after its reservation expired and the stock has sold, the order stays cancelled with the note "Refund due", but nothing refunds it yet | Phase 6 |

## Not yet tested against the real service

| Area | Problem | Fixed in |
| --- | --- | --- |
| Daraja M-Pesa Express | Built to Safaricom's published format and tested against a fake. Needs sandbox keys to try for real ([how](SETUP.md#safaricom-daraja-phase-5)) | Phase 5 |
| Paystack cards | Built to Paystack's documentation and tested against a fake. Needs a test secret key ([how](SETUP.md#paystack-phase-5)) | Phase 5 |
| Admin sign-in | Google's button needs the site's addresses in the web OAuth client's Authorized JavaScript origins. Tested only with a signed cookie so far ([how](SETUP.md#admin-dashboard-phase-4)) | Phase 4 |
| Android | Phases 4 and 5 screens were checked on iOS simulators only, as no Android phone was connected | Phase 5 |

## Functional gaps

| Location | Problem | Fixed in |
| --- | --- | --- |
| Orders | Buyers see their orders, but sellers cannot act on them yet: no accept, dispatch or delivered | Phase 6 |
| Scheduled jobs | Expiry and reconciliation are not scheduled, as Vercel Hobby runs jobs only daily. Checkout and the app's payment checks do the work meanwhile | Phase 8 (Vercel Pro) |

## Code quality

| Location | Problem | Fixed in |
| --- | --- | --- |
| Installed, unused | `expo-notifications`, `expo-updates`. Each has a roadmap phase | Phase 7 |

## Things to watch

| Area | Note |
| --- | --- |
| Android release builds | R8 is on by default since SDK 58. Always test a release build before shipping, as reflection-based code can fail only there |
| iOS 27 layouts | Apple's forums report an iOS 27 bug where tab search ignores side safe areas in landscape. The app passes on iPhone, iPad and the iPhone Duo simulator, but keep checking landscape after each iOS update |
| Native tabs | Tabs must be static; changing them at runtime resets navigation state. That is why the Sell tab shows every seller state itself ([R-29](DECISIONS.md#recommended)) |
| Email | All mail goes through Amazon SES. Its custom MAIL FROM domain shows as failed; mail still passes DMARC through DKIM ([how to fix](SETUP.md#email-phase-3)). Never send test mail to made-up addresses, as bounces count against the account |
| Production email | No email sends from production: sign-up, password reset and welcome emails all fail. Vercel's Production `EMAIL_TRANSPORT` is not exactly `ses`, most likely `"ses"` pasted with its quotes. Re-enter it as `ses` and redeploy ([how](SETUP.md#email-phase-3)). Once deployed, `web/lib/mail.ts` ignores quotes, spaces and capitals in these settings, and its error names the value it found |
| Welcome email | It mentions paying with M-Pesa or card and tracking orders. Order tracking by status exists now; check the wording in `web/lib/email-templates.ts` before launch |
| iOS forms | Changing a SwiftUI form while one of its fields has focus can crash UIKit. Forms close the keyboard before submitting; do the same in new forms |
| Android header buttons | `Stack.Toolbar.Button` draws only icons on Android, and silently drops a button that has only a label. Give every header button an Android icon from `@expo/material-symbols` and an `accessibilityLabel`, and keep the label for iOS |
| Android form colours | Expo UI forms on Android take Material You colours from the wallpaper, so Profile, the seller forms and checkout can look brown or green beside the navy header. A `seedColor` or `colorOverrides` on their `Host` would fix this, but the look has not been chosen |
| Sample data in production | Production holds 21 sample products from 4 sellers that are not real businesses. Remove them before launch with `remove-samples` ([how](SETUP.md#sample-data)) |
| Trader details | The Terms page names Realhive Consultants, but its address and phone are still empty in `web/lib/site.ts`. Google Play needs them for trader status ([ADR-044](DECISIONS.md#adr-044-realhive-consultants-is-the-trader)) |
| Admin pages in development | Setting `instant = false` on the dashboard layout made the dev server reload its pages in a loop. Leave it off; the pages already stream behind Suspense |
