# Known issues

These problems existed before the SDK 58 upgrade and were left in place on purpose, since the roadmap replaces most of this code. Line numbers refer to the code as of the upgrade. Remove each entry when it is fixed.

## Blocking

| Location | Problem | Fixed in |
| --- | --- | --- |
| `HauteCorner/store/apiSlice.js:3` | The API URL is hard-coded to `buenas-admin.vercel.app`, which returned 401 in October 2026, so products do not load | Phase 2 |

## Security and data

| Location | Problem | Fixed in |
| --- | --- | --- |
| `HauteCorner/app/(stack)/shopping-cart.tsx:50-58` | Totals come from the client, and checkout sends a hard-coded customer with personal details | Phase 5 |
| `HauteCorner/app/(tabs)/add-product.tsx:7,53` | The form posts to a second hard-coded URL with no authentication | Phase 4 |
| `HauteCorner/app/(tabs)/saved-items.tsx:13-14` | A hard-coded name and card number are displayed | Phase 5 |

## Functional bugs

| Location | Problem | Fixed in |
| --- | --- | --- |
| `HauteCorner/app/(tabs)/saved-items.tsx` | The Wish List tab shows a mock payment screen; nothing is saved | Phase 5 |
| `HauteCorner/app/(tabs)/index.tsx:9`, `categories.tsx:9` | Category chips set state, but the list ignores it. The two screens are also copies of each other | Phase 2 |
| `HauteCorner/app/(tabs)/index.tsx:19`, `categories.tsx:19` | Errors display as `[object Object]` | Phase 2 |
| `HauteCorner/app/(tabs)/index.tsx`, `categories.tsx` | The star icon on product cards does nothing | Phase 5 |
| `HauteCorner/app/(tabs)/add-product.tsx:125` | The upload button does nothing, so a product can never pass the image check | Phase 4 |
| `HauteCorner/app/(tabs)/add-product.tsx:118` | Delete passes the press event instead of the image, so images are not removed | Phase 4 |
| `HauteCorner/app/(tabs)/add-product.tsx:57` | `setPrice("")` puts a string into numeric state | Phase 4 |
| `HauteCorner/app/(stack)/products/[id].tsx:28,105` | The selected option never reaches the cart | Phase 5 |
| `HauteCorner/app/(stack)/products/[id].tsx:44` | Likes live in local state and are lost when leaving the screen | Phase 5 |
| `HauteCorner/app/(stack)/products/[id].tsx:77` | Inline list header components remount on each render, and the option picker sits in a nested list | Phase 2 |
| `HauteCorner/app/(stack)/_layout.tsx` | Stack headers show raw route names such as "shopping-cart" | Phase 2 |
| `HauteCorner/app/(stack)/shopping-cart.tsx:60` | `result.data.data.ref` crashes when the order fails | Phase 5 |
| `HauteCorner/app/(stack)/track-order.tsx:8,20` | Queries with an empty reference on open, and shows "Order Not Found" before anything is typed | Phase 6 |
| `HauteCorner/app/(stack)/track-order.tsx:26` | Shows the order as raw JSON | Phase 6 |
| `HauteCorner/components/HeaderRight/index.tsx:5` | The cart badge is hard-coded to 1 | Phase 5 |
| `HauteCorner/components/CartListItem/index.tsx:46` | Shows `cartItem.size`, which is never set | Phase 5 |
| `HauteCorner/store/cartSlice.js:30` | `changeQuantity` crashes if the item is not found | Phase 5 |
| `HauteCorner/store/productsSlice.js:15` | Unused slice that compares `product.id` when products have `_id` | Phase 5 |
| `HauteCorner/store/index.js:24` | Persists the whole API cache to disk, so stale data can reappear | Phase 2 |

## Code quality

| Location | Problem | Fixed in |
| --- | --- | --- |
| `HauteCorner/` | 16 TypeScript errors remain (details below) | Phase 2 |
| `HauteCorner/` | 13 ESLint warnings, mostly unused variables | Phase 2 |
| Whole repository | No automated tests or CI | Phases 1 and 2 |
| `HauteCorner/components/`, `scripts/reset-project.js` | Leftover template files such as `parallax-scroll-view`, `external-link`, `collapsible` | Phase 2 |
| `@expo/vector-icons` | Deprecated since SDK 56 in favour of `@react-native-vector-icons/*`. Still works | Phase 2 |
| `HauteCorner/app/(stack)/_layout.tsx` | Wraps the whole stack in `SafeAreaView`. Expo advises against using it to offset content from headers | Phase 2 |
| Installed, unused | `@tanstack/react-query`, `zustand`, `react-native-mmkv`, `@expo-google-fonts/nunito`, `@expo/ui`, `expo-image`, `expo-image-picker`, `expo-notifications`, `expo-updates`, Google Sign-In. Each has a roadmap phase | Phases 2 to 7 |

### TypeScript errors

All 16 also existed on SDK 54. Two of them changed error code with the new React Native types but have the same cause.

| File | Count | Cause |
| --- | --- | --- |
| `components/themed-text.tsx`, `themed-view.tsx`, `parallax-scroll-view.tsx` | 6 | `constants/theme.ts:30` replaced the `Colors.light` and `Colors.dark` shape with a flat object, but `hooks/use-theme-color.ts` still expects the old shape |
| `components/ui/collapsible.tsx` | 2 | Same `Colors` mismatch |
| `app/(tabs)/add-product.tsx` | 3 | Wrong state types, and the delete handler bug above |
| `app/(tabs)/index.tsx`, `categories.tsx` | 2 | The JavaScript `apiSlice` means `useGetProductsQuery()` is inferred as needing an argument |
| `app/(stack)/products/[id].tsx` | 2 | Untyped `propertiesData` array |
| `app/(stack)/shopping-cart.tsx` | 1 | Untyped Redux `state` |

**Runtime impact of the theme bug:** `Colors.light` is now a string, so `Colors[theme][colorName]` returns `undefined`. Any screen using the themed components gets no theme colour.

## Things to watch

| Area | Note |
| --- | --- |
| iOS 27 | iPhone apps can be resized, and `orientation: portrait` may not lock the layout. Check layouts at different sizes |
| Android release builds | R8 is on by default since SDK 58. Always test a release build before shipping, as reflection-based code can fail only there |
| Tablets | `orientation: portrait` letterboxes the app on an Android tablet in landscape |
