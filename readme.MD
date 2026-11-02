# HauteCorner

A fashion marketplace for Kenya. Independent sellers list shoes and clothing, and customers buy through one iOS or Android app, paying by M-Pesa or card. HauteCorner earns a commission and holds each seller's money until delivery is confirmed.

## Status

The revamp is working through Phases 1 and 2 of the [roadmap](docs/ROADMAP.md).

| Part | State |
| --- | --- |
| Mobile app | On Expo SDK 58 with native tabs. Home, Categories and product details are rebuilt on the new API. The cart, order tracking, Add Product and Wish List screens come in later phases |
| API and website | Live at [hautecorner.vercel.app](https://hautecorner.vercel.app). The production database is not connected yet |
| Admin dashboard | Starts in Phase 4 |

## Stack

| Area | Technology |
| --- | --- |
| Mobile | Expo SDK 58, React Native 0.88, Expo Router with native tabs, Expo UI, TanStack Query, Zustand, MMKV |
| Server and website | Next.js on Vercel, MongoDB Atlas with Mongoose |
| Images and video | Cloudinary |
| Payments | M-Pesa through Safaricom Daraja, cards through Paystack |
| Sign-in | Google, and Sign in with Apple on iOS |
| Push and updates | `expo-notifications`, `expo-updates` with EAS Update |

## Repository

```text
HauteCorner/   Expo mobile app
web/           Next.js API, website and admin dashboard
docs/          Project documentation
```

## Quick start

You need Node.js 22.13+ or 24.3+, bun, and Xcode or Android Studio. Expo Go will not work, because the app uses native modules.

```bash
cd HauteCorner
bun install
bunx expo run:ios       # or: bunx expo run:android
```

See [Setup](docs/SETUP.md) for details.

## Documentation

| Document | What it covers |
| --- | --- |
| [Product brief](docs/PRODUCT.md) | What is being built, for whom, and the launch scope |
| [Decision log](docs/DECISIONS.md) | What is decided, what is only recommended, and what is still open |
| [Roadmap](docs/ROADMAP.md) | Phases, tasks and exit criteria |
| [Architecture](docs/ARCHITECTURE.md) | System design, flows and platform limits |
| [API contract](docs/API.md) | Endpoints between the app, dashboard and server |
| [Data model](docs/DATA_MODEL.md) | MongoDB collections and indexes |
| [Security](docs/SECURITY.md) | Rules for secrets, payments and data |
| [Setup](docs/SETUP.md) | Local development, environment variables and accounts |
| [Deployment](docs/DEPLOYMENT.md) | Releases, OTA updates, store requirements and costs |
| [Known issues](docs/KNOWN_ISSUES.md) | Existing defects, and the phase that fixes each |
