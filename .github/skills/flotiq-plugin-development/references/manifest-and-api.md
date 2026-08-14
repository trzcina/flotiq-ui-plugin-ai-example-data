# Manifest, Permissions, And API Access

Reviewed against the official Flotiq plugin documentation on 2026-08-14:

- [PluginInfo](https://flotiq.com/docs/panel/PluginsDevelopment/PluginDocs/4_FlotiqPluginInfo/)
- [Plugin API client](https://flotiq.com/docs/panel/PluginsDevelopment/PluginDocs/3_FlotiqPluginApiClient/)
- [Plugin API permissions](https://flotiq.com/docs/panel/PluginsDevelopment/plugins/#api-permissions)
- [Flotiq API access](https://flotiq.com/docs/API/)
- [Flotiq rate limits](https://flotiq.com/docs/API/rate-limits/)

## Manifest

`plugin-manifest.json` is both imported by the bundle and copied to `dist`. Keep these fields aligned with the implementation:

- `id`: globally unique, stable plugin ID; prefix it with the organization/company name.
- `name`: user-facing name.
- `version`: semantic version used to identify updates.
- `url`: full URL of the built JavaScript file.
- `description` and `repository`: optional metadata that should remain accurate.
- `permissions`: only API capabilities needed by the current implementation.

The manifest has no event list. Register event handlers in `plugins/index.js`.

## Permissions

Permission entries use `type: 'CO' | 'CTD'`, a `ctdName` (`'*'` means all), and operation flags.

Use the API reference names as canonical:

- `canRead`
- `canCreate`
- `canUpdate`
- `canDelete`

One getting-started example also contains `canWrite`; do not infer its behavior. Verify current Flotiq support before using a field that is absent from the `PluginPermission` API reference.

Examples of least privilege:

- Create imported `product` objects: `{ "type": "CO", "ctdName": "product", "canCreate": true }`.
- Read `product` objects before deduplication: add `canRead: true` to that entry.
- Read the `product` schema: add a separate `{ "type": "CTD", "ctdName": "product", "canRead": true }` entry.

Do not request wildcard access merely because it is convenient during development.

## Provided Plugin Client

Use dynamic methods from `client[ctdName]`:

- `get(id)`, `list(params)`, `getVersions(id)`, `getVersion(id, version)`
- `post(object)`, `put(id, object)`, `patch(id, partialObject)`, `delete(id)`
- `getContentType()`, `putContentType(object)`
- top-level `getContentTypes(params)` and `getMediaUrl(mediaData, height, width)`

The client enforces manifest permissions. Local code and official examples currently consume response wrappers such as `{ body, ok }`, while parts of the generated API reference describe resolved domain objects directly. Follow the verified runtime shape already used by this template and confirm current behavior when adding a new method; do not silently mix the two shapes.

Cache stable or repeated read promises where useful, including relation/media lookups, to avoid duplicate parallel requests.

## Direct Flotiq REST Decision Gate

Official plugin guidance states that UI plugins must use the provided client, must not use their own API keys, and must not call Flotiq API directly. The following fallback is an intentional project policy and an exception to that guidance.

Use direct REST only when all conditions hold:

1. The required endpoint or operation is not exposed by `client`.
2. The capability gap has been checked against current Flotiq plugin-client docs.
3. The implementation plan names the direct endpoint and explains why available client methods cannot provide equivalent behavior.
4. The project owner explicitly accepts the exception and its browser credential exposure. Ask for this approval and record it in the conversation, issue, or pull request; without it, do not implement the fallback.

Implementation requirements:

- Read a dedicated, least-privilege API key from parsed plugin settings at request time.
- Use `globals.getApiUrl()` instead of hard-coding the Flotiq API origin.
- Consult current REST endpoint documentation for the exact path, body, authentication header/query mechanism, response shape, and limits. Do not guess them.
- Use HTTPS and never send the key to any origin other than the expected Flotiq API origin.
- Never log the key, include it in thrown/user-visible errors, put it in URLs unless the current API contract requires it, or persist it outside plugin settings.
- Handle non-2xx responses, timeouts, cancellation, validation errors, rate limits, and partial batch success.
- Do not retry non-idempotent operations automatically unless the endpoint provides an idempotency mechanism or the duplicate-write risk is otherwise controlled.

If a backend can perform the missing operation, prefer a backend proxy with server-side credentials over exposing a broad Flotiq key to the browser.

## External APIs

Calls to import sources or third-party providers are separate from Flotiq manifest permissions. OpenAI, Google Maps, and other external credentials do not require Flotiq `CO` or `CTD` permissions; add those permissions only for Flotiq data operations. Check CORS, provider browser-use policy, rate limits, data sensitivity, and whether the credential can be safely restricted by origin, API, quota, or scope. Route unrestricted secrets through a backend.
