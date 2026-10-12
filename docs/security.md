# Dependency Security

Review date: 2026-10-12. Review expires: 2026-11-12.

`pnpm audit:check` rejects any advisory in the published runtime dependency tree,
any unknown high/critical advisory in development dependencies, any new path for a
reviewed advisory, and an expired review. Registry/network errors fail the gate.
It prints low/moderate tooling advisories instead of hiding them. The authoritative
machine-readable exceptions are in `scripts/audit-exceptions.json`.

## Remaining Tooling Advisories

- [node-forge GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv):
  no patched release is available. Nuxt CLI/Nitro depend on it through `listhen`.
  This module does not verify RSA signatures or handle TLS certificates. Its test
  development listener uses HTTP. Do not reuse this exception for consumers that
  call the affected cryptography API.
- [braces GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm):
  no patched release is available. Nitro uses it for build-time globs. Globs are
  authored by the developer; schema properties and HTTP input are never glob
  patterns. Never pass untrusted patterns to the build system.
- KaTeX has a low-severity advisory through ESLint Markdown parsing. It is not
  shipped as an application renderer. The audit gate reports it.

The Nuxt Devtools dependency on `simple-git` is narrowly overridden to 4.0.2.
Version 4 removed the default export, so the checked-in Devtools patch changes
only that import to the named `simpleGit` export. `test:toolchain` exercises the
status, branch and revparse operations used by Devtools. Playground and consumer
fixtures disable Devtools; consumers control their own development configuration.
This repository override does not change an application's separate Nuxt install.

## Installation Policy

Peer dependency checking and build-script allowlisting remain enabled. A narrow
CAC peer exception is verified by the Nuxt CLI completion smoke test. `mkdist`
receives its compatible Vue SFC transformer through `packageExtensions`.

The pnpm `no-downgrade` trust policy covers recent releases. Releases older than
30 days are grandfathered when adopting the policy; this is not a guarantee that
old packages are safe. The audit gate still checks their vulnerabilities.

The exact CSSnano/PostCSS/stylehacks releases in `trustPolicyExclude` were reviewed
against npm metadata: official repositories, GitHub trusted publisher and SLSA
provenance were present. npm now returns UUID-only `oidcConfigId` values for these
releases whereas older entries have an `oidc:` prefix. pnpm reports a trust
downgrade despite the trusted-publisher metadata. These are version-specific
exceptions, not wildcard exclusions. Revisit them with the next pnpm release and
before the review expires. Tarball integrity remains checked by the lockfile.

## Media Boundaries

IndexedDB is local browser storage, not an authenticated backend or encrypted
vault. The composite user/form/response/client key isolates lookups; the consumer
must still handle logout cleanup, storage quotas, backup and authorization.
Remote transport authentication, definitive file validation, idempotency and
access control belong to the consumer/backend. Never place credentials in a
schema, browser database name or exported snapshot.

Preview URLs allow HTTP(S), Blob and converted Capacitor sources. SVG and HTML
are not rendered as active inline previews. A successful local write does not
mean an upload or a response was saved on the backend.
