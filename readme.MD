# HauteCorner

A fashion marketplace for Kenya. Independent sellers list shoes and clothing, and customers buy through one iOS or Android app, paying by M-Pesa or card. HauteCorner earns a commission and holds each seller's money until delivery is confirmed.

## Status

The revamp is at **Phase 0** of the [roadmap](docs/ROADMAP.md).

| Part | State |
| --- | --- |
| Mobile app | Upgraded to Expo SDK 58 and verified on iOS and Android. Still has the old screens, and products do not load because the old API returns 401 |
| API, website, admin dashboard | Not started. Will be one Next.js app in `web/` |
| `Backend/` | Old Express server. The app does not use it, and it will be deleted |

> **Urgent:** A database password is exposed in this public repository. [Change it first](docs/SECURITY.md#action-required-exposed-database-credential).

## Stack

| Area | Technology |
| --- | --- |
| Mobile | Expo SDK 58, React Native 0.88, Expo Router, TanStack Query, Zustand, MMKV, Expo UI |
| Server and website | Next.js on Vercel, MongoDB Atlas with Mongoose |
| Images and video | Cloudinary |
| Payments | M-Pesa through Safaricom Daraja, cards through Paystack |
| Sign-in | Google, and Sign in with Apple on iOS |
| Push and updates | `expo-notifications`, `expo-updates` with EAS Update |

## Repository

```text
HauteCorner/   Expo mobile app
web/           Next.js API, website and admin dashboard (created in Phase 1)
Backend/       Old Express server (to be deleted)
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
| [Security](docs/SECURITY.md) | The urgent credential fix, and rules for secrets, payments and data |
| [Setup](docs/SETUP.md) | Local development, environment variables and accounts |
| [Deployment](docs/DEPLOYMENT.md) | Releases, OTA updates, store requirements and costs |
| [Known issues](docs/KNOWN_ISSUES.md) | Existing defects, and the phase that fixes each |
| [SDK 58 upgrade](docs/UPGRADE_SDK58.md) | What changed in the upgrade, and how it was verified |
