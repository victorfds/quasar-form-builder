# Changelog

## 0.2.2 - Unreleased

### Corrections

- Freeze Vite dependency discovery only in the E2E environment and prebundle
  required dependencies together, preventing stale optimized URLs and startup
  hydration failures in concurrent browser workers.
- Wait for builder hydration before seeding persisted test schemas.
- Enter pending condition values and save atomically, preserving the regression
  checks without interference from headless-window focus changes.

### Validation

- Add a regression proving normal development retains dependency discovery.
- Verify 67 unit tests and 36 repeated Chromium/Firefox smoke cases without
  retries, new skips or increased timeouts.

Public runtime APIs, media/schema contracts and dependency requirements are
unchanged from 0.2.1.

## 0.2.1 - Unreleased

### Corrections

- Run E2E with an isolated Nuxt environment that disables startup HMR reloads
  and prevents Nuxt CLI from re-enabling HMR, without changing normal development
  behavior or suppressing JavaScript errors.
- Wait for client-ready builder and media controls before seeding saved schemas.
- Verify pending equality values using DOM focus instead of OS window focus in
  concurrent Firefox runs.
- Check image decoding and complete durable references after reloading media.

### Development and Validation

- Add a fast local check profile and retain the full production, three-browser,
  packed-consumer and audit gate for CI and release preparation.
- Preflight required browsers and support native, supplied remote and optional
  version-matched Linux Docker runtimes with owned-resource cleanup.
- Cover runtime selection, error propagation, cleanup and the Nuxt CLI HMR guard
  with 12 new unit tests.
- Record successful local checks, repeated Firefox runs and full validation;
  retain the documented pre-existing Linux WebKit Blob test limitation.

Public runtime APIs, media/schema data contracts, dependency versions and minimum
consumer requirements are unchanged from 0.2.0.

## 0.2.0 - Unreleased

### Compatibility

- Minimum Nuxt 4.5.1; Nuxt 5 is not claimed as supported.
- Host Vue 3.5.43+ and Pinia 4.0.3+ are peer dependencies, not private store runtimes.
- Node 22.22.3/24.15.0 baselines; development uses pnpm 12.11.2.
- FormKit 2, Quasar 2.35, Shiki 4, UUID 14 and updated stable development tools.
- TypeScript 5.9.3 remains the module-builder compiler API; public declarations are
  also checked with the isolated TypeScript 7.0.2 CLI.

### Corrections

- Explicit runtime helpers, typed schemas/stores and app/server typechecking.
- Stable field identities, parser-based condition rename/copy/removal, grouped OR
  conditions and saving an uncommitted equality value.
- Multi-file append, count/size validation, durable staging, remote source fallback
  when local storage fails, and context/policy-safe recovery confirmation.
- WebKit-compatible IndexedDB binary storage, preserving reads of older Blob rows.
- Local recorder limits and recoverable permission/unsupported-browser errors.
- Multi-button toggles now collect arrays instead of relying on an unsupported
  Quasar multiple-selection property.
- Step validation uses local FormKit nodes instead of editable DOM identifiers.
- Viewer lifecycle events no longer mutate parent state during SSR/hydration.
- Builder text selection suppression stays scoped to editing; internal UUIDs are
  hidden from settings. Configuration rows follow the shared panel layout.

### Integration and Validation

- Public `/media` and `/schema` SDKs, runtime adapters, recorder and attachments.
- Chromium/Firefox/WebKit E2E, packaged Nuxt 4.5.1/4.6.1 SSR/SPA consumers,
  CI Node matrix and an expiring security audit gate.
- See `docs/migration-0.2.md` and `docs/security.md` for migration and exceptions.

Media references and saved snapshots keep version 1. No backend migration,
automatic upload/retry queue, service worker or signature contract is introduced.
