# Events And UI Placement

Reviewed against the official Flotiq plugin documentation on 2026-08-14:

- [Events API](https://flotiq.com/docs/panel/PluginsDevelopment/PluginDocs/5_Events/)
- [Plugin examples](https://flotiq.com/docs/panel/PluginsDevelopment/plugin-examples/)
- [Plugin development](https://flotiq.com/docs/panel/PluginsDevelopment/plugins/)

Use exact documented event names. Do not create plausible-looking event names for unsupported placements.

## Grid Events

| Event | Placement and use | Important payload | Result |
| --- | --- | --- | --- |
| `flotiq.grid::add` | Add controls or status above a CTD content-object grid. Preferred for list-level actions such as import. | `contentTypeName`, `contentType`, `contentObjects`, `pagination`, `handlePageChange`, `reload`, `isFetching`, `isLoading` | Renderable value or `null` |
| `flotiq.grid::render` | Replace the complete default grid. Use only when additive UI cannot satisfy the feature. | Same as `flotiq.grid::add` | Renderable value or `null` |
| `flotiq.grid.cell::render` | Replace one field's cell rendering. | `accessor`, `data`, `inputType`, `contentObject`, `contentType`, `contentTypeName` | Renderable value or `null` |
| `flotiq.grid.filter::render` | Replace a column filter control. | `accessor`, `inputType`, `updateFilters`, `allFilters`, `disabled`, `contentType` | Renderable value or `null` |

Call `reload()` after a list action changes grid data. Avoid replacing the whole grid when `flotiq.grid::add` or cell rendering is enough.

## Form Events

| Event | Placement and use | Important payload/behavior | Result |
| --- | --- | --- | --- |
| `flotiq.form::add` | Add an element at the start of a content-object form. | `contentType`, `form`, `onMediaUpload`, `initialData`, `formUniqueKey` | Renderable value or `null` |
| `flotiq.form.sidebar-panel::add` | Add an item to the form sidebar. Suitable for object-level commands. | `contentType`, `contentObject`, `formUniqueKey`, `disabled`, `duplicate`, `create`, `form` | Renderable value or `null` |
| `flotiq.form.secondary-column::add` | Render a side-by-side secondary work area. Returning content hides the standard left navigation and right sidebar. | Inherits the sidebar payload | Renderable value or `null` |
| `flotiq.form.field::render` | Replace a visible field control. | `name`, `value`, `contentType`, `initialData`, `formUniqueKey`, `properties`, `schema`, `required`, `disabled`, `readonly`, `form`, `error`, `onMediaUpload` | Renderable value or `null` |
| `flotiq.form.field::config` | Modify configuration for each visible field. Prefer mutation of `config`, as the event does not require a result. | Field-render payload plus `config` | No result expected |
| `flotiq.form.field.listeners::add` | Add an `onChange`, `onBlur`, `onMount`, or `onSubmit` field listener. | Field-render payload | `[eventName, listener]` |
| `flotiq.form::after-submit` | Observe the result after the API submission was triggered; skipped on client-side validation failure. | `success`, `contentObject`, optional `errors` | No result |
| `flotiq.form.relation::after-submit` | Observe editing of a related object through the main form. | Main/relation CTD and object data, `fieldName`, `isSuccess`, `errors`, `values` | No result |

Use `formUniqueKey` in cache keys when multiple forms can be displayed at once, such as version comparison. Respect `disabled`, `readonly`, `create`, and `duplicate` states rather than presenting actions that cannot complete.

## Plugin And Settings Events

| Event | Use | Result |
| --- | --- | --- |
| `flotiq.plugins.manage::form-schema` | Define a schema-driven plugin settings form. | `{ schema, options? }` or `null` |
| `flotiq.plugins.manage::render` | Render custom plugin-management UI and save with payload `updateSettings`. | Renderable value or `null` |
| `flotiq.plugin.settings::changed` | React to settings changes for the current plugin; payload contains optional serialized `settings`. | No result |
| `flotiq.plugin::removed` | Clean up resources when the current plugin is removed. | No result |
| `flotiq.language::changed` | Update localized plugin UI; payload contains `language: 'pl' | 'en'`. | No result |

## Render Rules

- Renderable results include `HTMLElement` and primitives supported by Flotiq. This template should normally return an `HTMLElement` or `null`.
- `::render` and `::add` handlers must not be `async`. Return the root element immediately, then update it from promise callbacks.
- Update cached element state on every event call. Returning the same stale node without updating it prevents visible refreshes.
- Return `null` when the current CTD, accessor, field, mode, or state is outside the feature's scope.
- Prevent default navigation and stop propagation when a button is placed inside an interactive grid cell and should not open the row.

## DOM Lifecycle

Flotiq dispatches `flotiq.attached` and `flotiq.detached` DOM events only on the root element returned by a plugin. The same root can attach and detach repeatedly.

- Start DOM-dependent work after `flotiq.attached`.
- Clean up observers, timers, subscriptions, and third-party roots after `flotiq.detached`.
- Preserve the template's short detach delay so temporary detach/reattach cycles do not destroy cached state.
