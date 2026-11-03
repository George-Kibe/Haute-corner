# Known issues

These problems are known and left in place on purpose, because a later phase replaces the code they are in. Line numbers refer to the code as of Phase 2. Remove each entry when it is fixed.

## Security and data

| Location | Problem | Fixed in |
| --- | --- | --- |
| `HauteCorner/app/shopping-cart.tsx` | Totals come from the client, and checkout sends a hard-coded customer with personal details to the old API | Phase 5 |
| `HauteCorner/store/apiSlice.js:4` | Orders still use the old `buenas-admin.vercel.app` API, which returns 401, so checkout and order tracking do not work | Phases 5 and 6 |
| `HauteCorner/app/(tabs)/add-product/index.tsx` | The form posts to the old API with no authentication, and it is shown to everyone | Phase 4 |
| `HauteCorner/app/(tabs)/saved-items/index.tsx` | A hard-coded name and card number are displayed, now only to signed-in users | Phase 5 |
| `web/app/api/v1/auth/` | No rate limiting yet on sign-in and refresh | Phase 3 |
| `web/lib/users.ts` | Deleting an account does not yet revoke Sign in with Apple tokens, which App Store review expects | Phase 3 |

## Functional bugs

| Location | Problem | Fixed in |
| --- | --- | --- |
| `HauteCorner/app/(tabs)/saved-items/index.tsx` | The Wish List tab shows a mock payment screen; nothing is saved | Phase 5 |
| `HauteCorner/app/(tabs)/add-product/index.tsx` | The upload button does nothing, so a product can never pass the image check | Phase 4 |
| `HauteCorner/app/products/[id].tsx` | The selected size never reaches the cart, and likes live in local state and are lost on leaving the screen | Phase 5 |
| Google sign-in | Not set up: the app says so, and `POST /auth/google` returns 500, until the OAuth clients exist | Phase 3 |
| `HauteCorner/app/shopping-cart.tsx` | `result.data.data.ref` crashes when the order fails, which it currently always does | Phase 5 |
| `HauteCorner/app/track-order.tsx` | Queries with an empty reference on open, shows "Order Not Found" before anything is typed, and shows the order as raw JSON | Phase 6 |
| `HauteCorner/store/cartSlice.js:30` | `changeQuantity` crashes if the item is not found | Phase 5 |

## Code quality

| Location | Problem | Fixed in |
| --- | --- | --- |
| `HauteCorner/` | 6 ESLint warnings in the older screens, mostly unused variables | Phases 4 to 6 |
| `HauteCorner/store/` | Redux stays only for the cart and orders until they are rebuilt | Phase 5 |
| `HauteCorner/components/CartListItem/` | The old cart uses custom icon buttons and Ionicons. Replace with native components when the cart is rebuilt | Phase 5 |
| Installed, unused | `react-native-mmkv`, `expo-image-picker`, `expo-notifications`, `expo-updates`. Each has a roadmap phase | Phases 4 to 7 |

## Things to watch

| Area | Note |
| --- | --- |
| Android release builds | R8 is on by default since SDK 58. Always test a release build before shipping, as reflection-based code can fail only there |
| iOS 27 layouts | Apple's forums report an iOS 27 bug where tab search ignores side safe areas in landscape. The app passes on iPhone, iPad and the iPhone Duo simulator, but keep checking landscape after each iOS update |
| Native tabs | Tabs must be static; changing them at runtime resets navigation state. Keep this in mind for showing the Add Product tab only to sellers in Phase 4 |
| Sample data in production | Production holds 21 sample products from 4 sellers that are not real businesses. Remove them before launch with `remove-samples` ([how](SETUP.md#sample-data)) |
