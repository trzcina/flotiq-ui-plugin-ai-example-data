---
name: flotiq-plugin-development
description: "Develop and modify Flotiq UI plugins in this plain JavaScript template. Use when adding UI elements or buttons to CTD grids and forms, handling Flotiq events, using FormApi or schema modals, adding plugin settings, updating the manifest and permissions, calling Flotiq or third-party APIs, importing content, or running the local plugin."
argument-hint: "Describe the Flotiq plugin feature, target CTD, UI placement, and data/API behavior"
---

# Flotiq Plugin Development

Use this workflow to add a Flotiq UI feature without inventing events or
bypassing repository conventions.

## 1. Clarify The Feature

Before editing, identify the target CTD, UI placement, inputs, API operations,
settings, refresh behavior, and applicable loading, error, disabled, and
partial-success states. Ask a focused question when placement or destructive
behavior is ambiguous.

## 2. Choose The Integration

Read [events and UI](./references/events-and-ui.md) to select a documented event
and its payload contract. Return `null` outside the feature's scope, and return
the root element synchronously from `::render` and `::add` handlers.

Read [forms, modals, and settings](./references/forms-modals-and-settings.md)
when working with forms, modals, settings, credentials, or globals.

## 3. Plan Data Access

Read [manifest and API](./references/manifest-and-api.md) for client methods,
least-privilege permissions, external APIs, and the direct REST exception.
Use `client` whenever it supports the needed operation. Do not implement direct
REST without the project owner's recorded approval.

## 4. Remove Template Demo Behavior

Choose one path before editing:

- Production plugin: remove the template demo before adding the real feature.
- Sample extension: keep only the demo behavior that directly illustrates the request.

Cleanup checklist:

1. Remove the `handleGridPlugin` import and the `flotiq.grid.cell::render` registration from `plugins/index.js`.
2. Delete `plugins/grid-renderers/index.js` after confirming no remaining module imports it. This removes random text colors, bold number rendering, and relation-title rendering from grid cells.
3. Remove the demo `.plugin-name-cell-renderer` rule, `@font-face`, and `plugins/styles/RobotoMono-Medium.ttf` when the new plugin does not use them. Keep `style.css` and its one-time injection when the new feature needs plugin CSS; otherwise remove the unused CSS import/injection too.
4. Remove `common/api-helpers.js` only when `getRelationData` has no remaining callers. Preserve `common/plugin-element-cache.js` when the new feature uses registration or element caching.
5. Replace template metadata in `plugin-manifest.json` and `package.json`: plugin ID/name, description, version, repository, production URL as applicable, and permissions. Remove the wildcard sample read permission unless the real feature needs it.
6. Search for stale demo identifiers and descriptions such as `grid-renderers`, `handleGridPlugin`, `plugin-name-cell-renderer`, `Plain JS Plugin Template`, and “colorful text.”
7. Run `yarn build` after cleanup so deleted imports/assets and stale references fail immediately.

If the user asks for another reusable example rather than a production plugin, keep only the sample behavior that directly demonstrates the requested concept and update its metadata accordingly.

## 5. Implement

Add a focused module under `plugins/`, wire it in `plugins/index.js`, and reuse
the existing CSS and element-cache patterns. Keep UI, external data fetching,
transformations, and API writes separate when the feature is non-trivial.

Update manifest metadata and permissions when implementation behavior requires
it.

## 6. Validate

Run the narrowest applicable check after the first edit, then run `yarn build`.
For local installation, browser smoke tests, and publishing, follow
[development](./references/development.md).