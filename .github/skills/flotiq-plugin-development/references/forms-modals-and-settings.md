# Forms, Modals, Settings, And Credentials

Reviewed against the official Flotiq plugin documentation on 2026-08-14:

- [Flotiq globals](https://flotiq.com/docs/panel/PluginsDevelopment/PluginDocs/2_FlotiqGlobals/)
- [FormApi](https://flotiq.com/docs/panel/PluginsDevelopment/PluginDocs/6_FormApi/)
- [Events](https://flotiq.com/docs/panel/PluginsDevelopment/PluginDocs/5_Events/)
- [Schema modal examples](https://flotiq.com/docs/panel/PluginsDevelopment/plugin-examples/#open-modal-with-form)

## Globals

Flotiq supplies globals as the third registration callback argument. The second
argument is the permission-checked `client`. Declare globals when needed:

```js
registerFn(pluginInfo, (handler, client, globals) => {
  const { openModal, openSchemaModal, toast } = globals;
});
```

The existing `registerFn` passes this callback directly to `FlotiqPlugins.add`; declaring the third parameter does not require changing the helper.

Relevant helpers include:

- `openModal(config)` and `closeModal(id, result)` for plugin-managed HTML content.
- `openSchemaModal(config)` for a Flotiq schema-driven form.
- `getPluginSettings()` and `setPluginSettings(settings)` for serialized settings.
- `getApiUrl()`, `getSpaceId()`, `getLanguage()`, `navigate(url)`, and `getFeatureFlag(name)`.
- `toast` for user feedback; confirm its current API before invoking methods not described in the plugin docs.

## FormApi

Event payloads expose a limited form API:

- Read: `getValue(name)`, `getValues()`, `getError(name)`, `getErrors()`, `getDirtyFields()`.
- State: `dirty`, `isValid`, `isSubmitting`.
- Write: `setFieldValue(name, value)`, `setValues(values)`, `setFieldTouched(name, touched)`, `setTouched(map)`, `resetForm(values, options)`.
- Actions: `validateForm(cause)`, `submitForm()`, `rerenderForm()`.

Do not reach into undocumented internal form state. Respect the provided disabled/readonly state and use the payload's `formUniqueKey` when form-specific caching is needed.

## Schema Modals

`openSchemaModal` receives a modal config whose `form.schema` follows the Flotiq Content Type Definition shape:

- `schemaDefinition`: object schema with properties, required fields, and `additionalProperties`.
- `metaDefinition`: field order and `propertiesConfig` with labels, help text, input types, and related UI metadata.
- Optional `initialData`, `labels`, and form `options`.

The returned promise resolves with submitted values or the configured result. A custom `onSubmit` must follow the current `ContentObjectSubmitFn` tuple contract. A custom `onValidate` returns field-keyed errors or `null`. Confirm the current tuple shape in the InternalTypes docs before implementing custom submission because generated examples and reference signatures may evolve.

Disable repeated submit actions while work is in progress, retain field-level validation errors, and keep the modal open when recoverable errors require user correction.

## Plugin Settings UI

Prefer `flotiq.plugins.manage::form-schema` for schema-driven settings. Use `flotiq.plugins.manage::render` only when the schema form cannot express the required UI.

- The form-schema event returns `{ schema, options? }`.
- A custom management renderer receives `updateSettings`, `reload`, `modalInstance`, current plugin data, and content types.
- React to `flotiq.plugin.settings::changed` when already-rendered UI must refresh after a settings update.
- Parse serialized settings defensively, provide defaults, and handle missing/malformed data without breaking plugin registration.

## Credential Fields

Store every configurable credential in plugin settings, including:

- A fallback Flotiq REST key for an approved direct-call exception.
- OpenAI, Google Maps, analytics, import-source, and other third-party keys or tokens.

Never store credentials in source files, `.env`, manifest data, build scripts/arguments, generated assets, or constants. This frontend project bundles build-time values into downloadable JavaScript.

Settings UI requirements:

- Render credentials with password semantics (`isPassword`/the current supported password input configuration).
- Do not populate a management form with the full existing secret if it would be rendered or returned to the browser unnecessarily.
- Treat an empty unchanged credential field as “preserve the current stored value,” not “erase,” unless the UI offers an explicit remove action.
- Never display credentials in toast messages, validation errors, network error details, or console output.
- Validate that required credentials exist before starting an operation and explain how the user can configure them.
- Keep credentials out of DOM attributes, cache keys, URLs, analytics, and telemetry.

## Security Boundary

Plugin settings are available to plugin JavaScript running in the browser. The reviewed Flotiq plugin docs define string get/set methods but do not promise server-side secret isolation or encryption from browser users. Settings prevent accidental source-control and bundle inclusion; they do not turn a browser credential into a secret.

- Use least-privilege, revocable, restricted credentials with quotas.
- Apply provider restrictions such as allowed origins/APIs when supported.
- Use a backend proxy when a credential grants broad access, incurs material cost, cannot be origin-restricted, or protects sensitive data.
