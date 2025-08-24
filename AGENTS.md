# Repository Guidelines

## Project Structure & Module Organization
- `app/components`: Vue components (PascalCase). Includes `quasar/*` inputs and `settings/*` editors.
- `app/pages`: Nuxt pages (kebab-case routes), e.g., `index.vue`, `viewer.vue`.
- `app/stores`: Pinia stores (suffix `*Store.ts`).
- `app/composables`: Reusable composables (prefix `use*`, e.g., `useClickOutside.ts`).
- `app/assets`: Styles and assets, e.g., `assets/scss/_custom.scss`.
- `app/constants`, `app/utils`: Shared utilities and constants.
- `.playground`: Local app that consumes this layer; contains generated `.nuxt` and `.output` (do not edit).
- Root configs: `nuxt.config.ts`, `formkit.config.ts`, `eslint.config.mjs`, `.editorconfig`.

## Build, Test, and Development Commands
- `pnpm dev`: Start the playground on http://localhost:3000.
- `pnpm dev:prepare`: Generate Nuxt types for the playground.
- `pnpm build`: Build the playground app (outputs to `.playground/.output`).
- `pnpm generate`: SSG build of the playground.
- `pnpm preview`: Preview the production build.
- `pnpm lint` / `pnpm lint:fix`: Run ESLint (auto-fix with `:fix`).
Notes: Use `pnpm` (see `packageManager`). Docker is available via `Dockerfile` if desired.

## Coding Style & Naming Conventions
- Indentation: 2 spaces; LF; UTF-8; final newline (`.editorconfig`).
- ESLint: `@antfu/eslint-config` + Nuxt integration (`eslint.config.mjs`).
- Vue files: PascalCase for components (`MyWidget.vue`); pages are route‑oriented and kebab/lowercase.
- Composables: `useXxx.ts`; Stores: `SomethingStore.ts` (Pinia).

## Testing Guidelines
- No automated tests are configured yet. For changes, provide: 
  - Repro steps in `.playground`, and before/after screenshots or a short GIF.
  - Unit tests are welcome; prefer Vitest (`tests/**/*.spec.ts`) if introduced.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`, `build:` (matches history).
- PRs should include:
  - Clear description and rationale; link issues if any.
  - Screenshots/GIFs for UI changes (from the playground).
  - Notes on breaking changes or migration.
  - Lint passes (`pnpm lint`) and no edits to generated files (`.playground/.nuxt`, `.playground/.output`).

## Security & Configuration Tips
- Do not commit secrets. Keep config in `nuxt.config.ts` minimal.
- Prefer relative imports within the layer; avoid modifying generated playground files.
