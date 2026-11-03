# Known issues

These problems are known and left in place on purpose, because a later phase replaces the code they are in. Line numbers refer to the code as of Phase 2. Remove each entry when it is fixed.

## Security and data

| Location | Problem | Fixed in |
| --- | --- | --- |
| `HauteCorner/app/shopping-cart.tsx` | Totals come from the client, and checkout sends a hard-coded customer with personal details to the old API | Phase 5 |
| `HauteCorner/store/apiSlice.js:4` | Orders still use the old `buenas-admin.vercel.app` API, which returns 401, so checkout and order tracking do not work | Phases 5 and 6 |
| `HauteCorner/app/(tabs)/add-product/index.tsx` | The form posts to the old API with no authentication, and it is shown to everyone | Phase 4 |
| `web/lib/users.ts` | Deleting an account does not yet revoke Sign in with Apple tokens, which App Store review expects | Phase 3 |
| Android Google sign-in | Works on the local debug build (checked on 4 November 2026). Release and EAS builds fail with `DEVELOPER_ERROR` until the Android OAuth client also lists the SHA-1 of the key that signed them ([how](SETUP.md#google-sign-in-phase-3)) | Phase 3 |

## Functional bugs

| Location | Problem | Fixed in |
| --- | --- | --- |
| `HauteCorner/app/(tabs)/add-product/index.tsx` | The upload button does nothing, so a product can never pass the image check | Phase 4 |
| `HauteCorner/app/products/[id].tsx` | The selected size never reaches the cart | Phase 5 |
| `HauteCorner/app/shopping-cart.tsx` | `result.data.data.ref` crashes when the order fails, which it currently always does | Phase 5 |
| `HauteCorner/app/track-order.tsx` | Queries with an empty reference on open, shows "Order Not Found" before anything is typed, and shows the order as raw JSON | Phase 6 |
| `HauteCorner/store/cartSlice.js:30` | `changeQuantity` crashes if the item is not found | Phase 5 |

## Code quality

| Location | Problem | Fixed in |
| --- | --- | --- |
| `HauteCorner/` | 6 ESLint warnings in the older screens, mostly unused variables | Phases 4 to 6 |
| `HauteCorner/store/` | Redux stays only for the cart and orders until they are rebuilt | Phase 5 |
| `HauteCorner/components/CartListItem/` | The old cart uses custom icon buttons and Ionicons. Replace with native components when the cart is rebuilt | Phase 5 |
| Installed, unused | `expo-image-picker`, `expo-notifications`, `expo-updates`. Each has a roadmap phase | Phases 4 to 7 |

## Things to watch

| Area | Note |
| --- | --- |
| Android release builds | R8 is on by default since SDK 58. Always test a release build before shipping, as reflection-based code can fail only there |
| iOS 27 layouts | Apple's forums report an iOS 27 bug where tab search ignores side safe areas in landscape. The app passes on iPhone, iPad and the iPhone Duo simulator, but keep checking landscape after each iOS update |
| Native tabs | Tabs must be static; changing them at runtime resets navigation state. Keep this in mind for showing the Add Product tab only to sellers in Phase 4 |
| Email | Gmail sends about 500 messages a day from one account, so it suits testing only. The Amazon SES path is written but untested until its domain is verified ([ADR-036](DECISIONS.md#adr-036-email-sign-up-with-emailed-codes-alongside-google-and-apple)) |
| Welcome email | It mentions paying with M-Pesa or card and tracking orders, which arrive in Phases 5 and 6. Check the wording in `web/lib/email-templates.ts` before launch |
| iOS forms | Changing a SwiftUI form while one of its fields has focus can crash UIKit. Auth screens close the keyboard before submitting; do the same in new forms |
| Android header buttons | `Stack.Toolbar.Button` draws only icons on Android, and silently drops a button that has only a label. Give every header button an Android icon from `@expo/material-symbols` and an `accessibilityLabel`, and keep the label for iOS |
| Android form colours | Expo UI forms on Android take Material You colours from the wallpaper, so Profile and the email sign-in screens can look brown or green beside the navy header. A `seedColor` or `colorOverrides` on their `Host` would fix this, but the look has not been chosen |
| Sample data in production | Production holds 21 sample products from 4 sellers that are not real businesses. Remove them before launch with `remove-samples` ([how](SETUP.md#sample-data)) |
