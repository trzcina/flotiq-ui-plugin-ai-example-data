# Flotiq Plain JavaScript Plugin Guidelines

## Repository Architecture

- Keep `plugins/index.js` as the bundle entry point and register the plugin through `registerFn` from `common/plugin-element-cache.js`.
- Put feature handlers in focused modules under `plugins/`; keep registration, global CSS injection, and handler wiring in `plugins/index.js`.
- Import plugin metadata from `plugin-manifest.json`. Keep its identity, version, URL, and permissions synchronized with implemented behavior.
- Preserve the existing plain JavaScript, ES modules, ESLint, Prettier, and esbuild conventions. Do not introduce React or TypeScript unless requested. If React requested, suggest the `flotiq/flotiq-ui-plugin-templates-react` plugin template.

## Flotiq Contracts

- Use only documented Flotiq event names and payloads. Load the `flotiq-plugin-development` skill for plugin features, UI placement, forms, settings, permissions, API access, or local development.
- Return `::render` and `::add` results synchronously. Start asynchronous work after creating the returned element, then update that element when the work completes.
- Reuse DOM elements where repeated rendering would otherwise cause UI churn. Use `addElementToCache` and handle `flotiq.attached`/`flotiq.detached` lifecycle behavior when cleanup is required.
- Return `null` when a handler does not apply to the current content type, field, or view so Flotiq and other plugins can continue rendering.

## API Access And Credentials

- Prefer the permission-checked `apiClient[ctdName]` methods for every Flotiq API operation and request only the required `CO` or `CTD` permissions in `plugin-manifest.json`.
- Direct Flotiq REST access is a project-specific exception because official UI-plugin guidance disallows own API keys and direct Flotiq API calls. Use it only after confirming the required operation is absent from `apiClient`, documenting the gap, and obtaining explicit project-owner acceptance.
- Read any fallback Flotiq REST key and all third-party credentials, such as OpenAI or Google Maps keys, from plugin settings at runtime. Never place credentials in source code, `.env`, the manifest, build arguments, or constants that become part of the browser bundle.

## Build And Validation

- Install dependencies with `yarn install`.
- Run `yarn build` after changes. It bundles `plugins/index.js` to `dist/index.js` and copies the manifest to `dist/plugin-manifest.json`.
- Run `yarn start` for watch mode and the local HTTPS endpoint at `https://localhost:3053`.
- Run `yarn format` only when formatting is needed; avoid unrelated formatting churn.