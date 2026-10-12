# Changelog

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
