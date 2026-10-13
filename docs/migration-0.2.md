# Migration to 0.2.0

This release is not a drop-in tooling upgrade for every 0.0.8 consumer. Install
Nuxt >=4.5.1 <5, Vue ^3.5.43 and Pinia ^4.0.3 in the host project. Use supported
Node 22.22.3+ or 24.15.0+. Older Node 20 and Nuxt 4.0-4.4 are outside this release's
compatibility range. Nuxt 5 is not supported by the declared peer contract.

```sh
pnpm add nuxt-quasar-form-builder vue@^3.5.43 pinia@^4.0.3
pnpm add nuxt@^4.6.1
```

The module registers Quasar, FormKit and the Nuxt Pinia integration. Use public
component aliases and package entries, not internal `#qfb` imports in consumers.

## Schema and Values

- Persist the schema returned by `adoptQfbSchema` once. Preserve `fieldId` through
  exports and historical snapshots; never regenerate identities while reading.
- JSON keys remain field names. Historical responses need their original schema.
  Renaming does not migrate response values to new keys.
- Builder names must be globally unique, including named layout fields. Reserved
  prototype keys (`__proto__`, `constructor`, `prototype`), duplicate identities
  and unresolved expressions are rejected. Correct these before schema adoption.
- Conditional inputs preserve values when unmounted. Explicit removal discards
  data. Readonly/disabled applies inside structures too.
- Viewer value events start after client mounting, not during SSR or hydration.
  `viewerReady` includes normalized initial values. Readonly viewers never mutate
  the incoming model just to add input defaults.
- Multiple button toggles return arrays. Single toggles keep scalar values.

## Media Is Opt-In

Without `mediaController`, file inputs keep session `File`/`File[]` values.
Multiple selections append; single selections replace. Persisting Files as JSON
still loses their bytes. Persisted `{}` cannot be repaired without reselecting.

With a controller, only media fields switch to serializable references. Configure
storage, transport, scope and a known policy in runtime, not in exported schemas.
Snapshots/references stay at version 1. IndexedDB reads previous Blob rows and new
ArrayBuffer rows without changing the object-store/database version. Retention
and quotas still depend on the browser and consumer.
Older storage implementations that only understand Blob rows cannot read these
new rows when downgrading. Keep the new adapter or implement an explicit binary
conversion before reverting a consumer; do not discard its durable files.

Blocked operations preserve recovery candidates. Recovery is explicit and
revalidated against current policy and exact field address. Unlocking a viewer
never automatically applies a late capture. Backend authentication, uploads and
response persistence remain consumer responsibilities.

## Tooling Exceptions

Module-builder 1.0.3 and vue-tsc require the JavaScript TypeScript compiler API, so
5.9.3 is pinned. The latest TypeScript 7.0.2 CLI is installed separately under
`@typescript/native` to check public declarations. Do not replace the builder's
compiler API with the native package merely to satisfy an update list.

The ESLint JavaScript override uses native `no-unused-vars` because the delegated
TypeScript rule misclassifies Espree bindings. Unused-variable checks remain
enabled in JavaScript, TypeScript and Vue files. See `security.md` for exact peer,
patch, provenance and advisory exceptions; consumers must not disable checks
globally to reproduce this repository's build configuration.

## Validation Boundary

`pnpm check` is the fast local profile: preparation, lint, app/server types,
unit/toolchain tests, module packaging, TypeScript 7 SDK checks and smoke E2E in
Chromium/Firefox. `pnpm test:e2e:local` reruns only the 12 smoke cases.

`pnpm check:full` runs preparation, lint, app/server types, unit/toolchain tests,
module packaging, TypeScript 7 SDK checks, playground build, E2E, packed consumer
tests and audit. Consumer tests cover Nuxt 4.5.1/4.6.1, SSR/SPA and three browser
engines. CI requires the full profile on Node 22 and 24. Use the complete profile
before publication; the faster local gate does not replace release acceptance.

The check runner first verifies the engines selected by the profile. On Linux it can use an
owned, temporary official Playwright Docker runtime if native browsers lack
system dependencies. `check:native` requires local engines; `check:docker`
explicitly selects Docker on a Linux host. `QFB_BROWSER_WS` selects an existing
remote server in automatic mode. The image version matches the installed
Playwright package. Managed containers are removed on completion/failure; an
externally supplied server is never stopped. CI uses full/native mode with installed
system dependencies. No mode removes a browser project or ignores failed tests.

Recording tests use real MediaRecorder where exposed. The Linux Playwright
WebKit build does not expose capture APIs; these cases verify an explicit error
and file-selection fallback, annotated in the report. This is not certification
of Safari audio capture or real Android devices. GMF backend integration, device
capture and consumer-specific offline authorization need separate acceptance.
