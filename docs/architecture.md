# Runtime Architecture

The module follows Nuxt's separation between module setup, application runtime,
reusable utilities and types. The organization is inspired by the
[Nuxt module anatomy](https://nuxt.com/docs/4.x/guide/modules/module-anatomy) and
[nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils/tree/main/src/runtime).
Nuxt does not prohibit feature directories; this layout makes each responsibility
explicit without flattening useful component groups.

```text
src/
  module.ts
  runtime/
    media.ts
    schema.ts
    formkit.config.ts
    types/
      builder.ts
      conditions.ts
      matrix.ts
      media.ts
      schema.ts
      viewer.ts
      index.ts
    utils/
      formData.ts
      dateLogic.ts
      logic.ts
      mediaErrors.ts
      mediaHttpTransport.ts
      mediaIndexedDbStorage.ts
      mediaPolicy.ts
      mediaValues.ts
      schemaExpressions.ts
      schemaGuards.ts
      schemaIdentity.ts
      schemaStructure.ts
    app/
      assets/
      components/
      composables/
      constants/
      pages/
      plugins/
      stores/
      utils/
```

## Responsibilities

- `module.ts` registers components, composables, selected utilities, the FormKit
  plugin and optional builder page using Nuxt Kit. The existing public
  auto-import names remain available; reusable utility internals are not scanned.
- `runtime/app/composables/useQfbMediaController.ts` owns reactive media operations
  for one viewer and scope. `audioCapture.ts` owns reactive microphone capture;
  its public factory remains `createQfbAudioCapture` through the media SDK.
- `runtime/utils` contains utilities and adapter factories that do not require
  a Vue or Nuxt application context. Browser operations start only when requested,
  never while importing the package or constructing a storage adapter.
- `runtime/types` contains type-only contracts, divided by responsibility. Runtime
  guards belong in utilities, not in the type barrel.
- `runtime/app/utils` contains application integration helpers, including external
  FormKit errors, builder events and browser configuration.
- `runtime/app/constants/injectionKeys.ts` is the single definition of injection
  keys. Public exports and components share the same symbol instances.
- `runtime/app/plugins` initializes integrations. It does not keep media binaries
  or a shared controller. Pinia stores remain dedicated to builder state/history.
  The FormKit plugin uses Vue-scoped IDs for automatic DOM identifiers and synthetic
  root form names, independent of FormKit's global counter. Explicit IDs/names,
  response keys and schema `fieldId` values remain unchanged across SSR requests.

## Public Package Boundaries

`nuxt-quasar-form-builder/media` and `nuxt-quasar-form-builder/schema` remain
supported package imports. Their source files, `runtime/media.ts` and
`runtime/schema.ts`, are export facades, not duplicate implementations. The root
module entry and its public types are unchanged.

SDK dependencies use relative internal imports and have no dependency on a
consumer's `#imports`, `#qfb` or `#shared` aliases. Application runtime code keeps
explicit imports because published files are not guaranteed to receive Nuxt's
application auto-import transformation. Internal source paths are not public APIs.

This reorganization does not change schema identities, field paths, snapshots,
media values, adapters, viewer events, error props, `flush()` or readonly behavior.
It does not introduce backend routes, a service worker or a global upload queue.

## Verification

Run `pnpm check` for local checks and `pnpm check:full` for the release matrix.
`tests/fixtures/public-exports.json` records the existing public type/value exports.
Unit/toolchain tests protect these exports, type-only files and SDK boundaries.
The packaged-consumer tests install the tarball into temporary applications under
`.tmp/consumer-test`, verify Nuxt auto-imports, and exercise SSR/SPA without aliases
to module sources. These fixtures do not modify external consumer projects.
