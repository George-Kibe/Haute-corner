# Deployment

How each part reaches production, and how to check a release.

## Web and API (Vercel)

Pushing to `master` deploys to production. Pull requests get preview deployments. Deployments are atomic, and can be rolled back from the Vercel dashboard.

**Before deploying a change:**

- `/api/v1` must stay compatible with older app versions still on phones. Breaking changes need a new version.
- Run database changes before the code that needs them, and keep them compatible with the old code.
- Mongoose `autoIndex` is off in production *(recommended)*. Create indexes deliberately, so that a deployment does not trigger a slow build.

**Cron jobs** are defined in `web/vercel.json`. Hobby only allows daily schedules, and [anything more frequent fails the deployment](https://vercel.com/docs/cron-jobs/usage-and-pricing), so keep the frequent schedules out until moving to Pro.

**Webhooks and previews:** Preview deployments can be protected by Vercel Authentication, which blocks Safaricom and Paystack. Test against a stable URL with a protection exception.

## Mobile builds (EAS)

| Profile | Purpose | Distribution | Update channel |
| --- | --- | --- | --- |
| `development` | Day-to-day work, with the dev client | Internal | `development` |
| `preview` | Testing a release candidate | Internal | `preview` |
| `production` | Store release, auto-incremented build number | Store | `production` |

```bash
cd HauteCorner
eas build --profile development --platform all
eas build --profile preview --platform android
eas build --profile production --platform all
```

The free plan's allowance is limited, so for routine work use `bunx expo run:*` or `eas build --local`.

**Current profile setting:** `preview` and `production` set `android.buildType` to `apk`. An APK is handy for direct installs, but Google Play requires an app bundle for store submission. Change `production` before Phase 8.

**Version numbers:** `appVersionSource` is `remote`, so EAS manages build numbers. The user-facing version is `version` in `app.json`.

## Over-the-air updates

An update replaces JavaScript and assets without a store release. It reaches a build only when the fingerprint of its native code matches.

```bash
eas update --channel preview --environment preview --message "Fix cart total display"
eas update --channel production --environment production --message "Fix cart total display"
```

`--environment` has been required since SDK 55.

**To roll back:** `eas update:rollback`.

| Change | How it ships |
| --- | --- |
| JavaScript, styles, images | OTA update |
| Native library, config plugin, permissions | New store build |
| Expo SDK upgrade | New store build |
| API change | Vercel, kept compatible with installed apps |

Always test on `preview` before publishing to `production`. App Store rules still apply to OTA updates, so do not use them to change what the app fundamentally does.

The update channels and fingerprint policy are configured, but no update has been published yet. This gets tested in Phase 7.

## Store submission

```bash
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

### Requirements

| Requirement | Applies to | Where it is handled |
| --- | --- | --- |
| Equivalent login alongside Google ([guideline 4.8](https://developer.apple.com/app-store/review/guidelines/)) | iOS | Sign in with Apple, Phase 3 |
| Account deletion in the app ([guideline 5.1.1(v)](https://developer.apple.com/app-store/review/guidelines/), [Play policy](https://support.google.com/googleplay/android-developer/answer/13327111)) | Both | Profile screen, Phase 3 |
| Web link to request account deletion | Play | `/delete-account`, Phase 3 |
| Privacy policy URL | Both | `/privacy`, Phase 1 |
| Browsing without an account | iOS | Sign-in only where needed, Phase 3 |
| Physical goods paid outside in-app purchase ([guideline 3.1.3(e)](https://developer.apple.com/app-store/review/guidelines/)) | iOS | M-Pesa and Paystack |
| Reporting and moderation of user-generated listings ([guideline 1.2](https://developer.apple.com/app-store/review/guidelines/)) | iOS | Report and remove, Phase 4 |
| Data Safety form and App Privacy answers | Both | Phase 8 |
| Permission purpose strings | iOS | `app.json` |
| App bundle | Play | Change `eas.json` before Phase 8 |

**For reviewers:** Sign-in uses the reviewer's own Google or Apple account, and browsing needs no account. Provide a way to reach the seller screens, and explain the payment flow in the review notes, ideally with a test path that does not need a Kenyan M-Pesa number.

## Release checklist

**Before a store release:**

- [ ] `tsc`, ESLint, `expo-doctor` and all tests pass
- [ ] Android release build, with R8, installed and run on a device
- [ ] iOS release build run on a device
- [ ] Sign-in with Google on both platforms, and Apple on iOS
- [ ] Browse, search and filter while signed out
- [ ] Multi-seller checkout with M-Pesa and with a card
- [ ] Failed and abandoned payments release the stock
- [ ] Seller accepts, dispatches and marks delivered
- [ ] Buyer confirms delivery, and separately let one order complete automatically
- [ ] Open and resolve a dispute both ways, and check the payout is frozen and then correct
- [ ] Payout reaches the seller once, and the ledger reconciles
- [ ] Refund for M-Pesa and for a card
- [ ] Seller application, approval and listing with photos and video
- [ ] Push received for each main event, and tapping it opens the right screen
- [ ] Delete an account, including the refusal while orders are open
- [ ] Layouts on small and large phones, in dark mode, and with resizing on iOS 27
- [ ] Slow network behaviour for images and video
- [ ] Live keys are set in production, and no test keys remain
- [ ] Privacy policy and terms are current

**After release:**

- [ ] Watch error reports, failed payouts, webhook failures and Atlas usage
- [ ] Reconcile the ledger with Safaricom and Paystack records

## Limits and costs

| Service | Free allowance | Cost beyond it |
| --- | --- | --- |
| Vercel | Hobby, non-commercial only | Pro, about $20 per developer seat per month. **Required before launch** |
| MongoDB Atlas | Free cluster, 0.5 GB | Paid tiers. [Review before launch](DECISIONS.md#open-items) |
| Cloudinary | 25 monthly credits | Paid plans. Video uses credits fast |
| EAS | 15 Android and 15 iOS builds; 1,000 update users | Starter from $19 a month, plus usage |
| Paystack | No monthly fee found | Per transaction: 2.9% local cards, 3.8% international, per its Kenya page |
| Safaricom M-Pesa | Sandbox is free | Transaction and payout charges; confirm with Safaricom |
| Apple Developer | None | About $99 a year |
| Google Play | None | About $25, once |

Prices were checked in October 2026 where a source is linked in the [decision log](DECISIONS.md) or [architecture](ARCHITECTURE.md#platform-limits-that-shape-the-design). Apple and Google prices are from memory, so confirm them when you sign up.
