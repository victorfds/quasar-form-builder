# Validation of 0.2.0

Validated on 2026-10-12. No package publication was performed during validation.

| Gate | Result |
| --- | --- |
| pnpm 12.11.2 frozen installation | Passed with strict peer checks and reviewed supply-chain policy. |
| ESLint | Passed; unused-variable checks remain enabled. |
| Vue/TypeScript app and server checks | Passed without type errors. |
| Unit tests | 54 passed across 5 files. |
| Public SDK declarations | Passed with TypeScript 7.0.2, including root, media and schema exports. |
| Toolchain smoke tests | Nuxt CAC completion and patched Devtools Git API passed. |
| Module packaging | build:module passed; generated runtime/declarations totaled 1.11 MB. |
| Playground production build | Passed. |
| E2E | 569 passed; 1 explicitly skipped. |
| Installed tarball consumers | 24 combinations passed, with no browser console errors. |
| Runtime dependency audit | No advisories in the module's production dependency tree. |
| Development dependency audit | 0 critical; 2 reviewed high and 1 reported low advisory. |

The consumer matrix covers Node 22.22.3/24.15.0, Nuxt 4.5.1/4.6.1, SSR/SPA and
Chromium/Firefox/WebKit. Tests install the tarball, import SDKs without browser
globals, build production output, exercise the builder/viewer, append files,
reload durable data and enforce readonly behavior. They also exercise a nested
consumer so parent-repository Pinia resolution cannot silently pass unnoticed.

E2E covers conditions and pending values, structures, drag-and-drop, resizing,
identity/history, file counts/sizes, previews, permissions, recovery, nested
addresses, deletion ordering, viewer isolation, lifecycle events, multi-button
choices, configuration layout and text-selection boundaries.

The skipped test constructs an old IndexedDB Blob row in WebKit. That Linux
browser build cannot write Blob rows; the same backward-read test passed in
Chromium and Firefox. New ArrayBuffer writes and reloads passed in all engines.
Where MediaRecorder is absent, recording cases verify the unavailable-capture
message and file-selection fallback rather than faking a recorder. Actual
recording, pause/resume, final flush and durable confirmation passed in Chromium
and Firefox with real MediaRecorder and controlled audio streams.

This is not acceptance of real Safari/Android audio capture, native Filesystem
adapters, GMF backend contracts, encrypted storage or consumer-specific offline
authorization. Those remain separate integration responsibilities.

See `security.md` for expiring exceptions. Nuxt is a host peer: the repository's
Devtools patch does not automatically patch a third-party project's Nuxt tree.
Consumers must audit their own dependencies and configure Devtools accordingly.
The module audit is not a claim that every host dependency is vulnerability-free.
