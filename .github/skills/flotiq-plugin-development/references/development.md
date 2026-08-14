# Development

Reviewed against the official Flotiq plugin documentation on 2026-08-14:

- [Plugin development and installation](https://flotiq.com/docs/panel/PluginsDevelopment/plugins/)
- [Plugin examples](https://flotiq.com/docs/panel/PluginsDevelopment/plugin-examples/)
- Local `package.json`, `esbuild.config.js`, and `plugin-manifest.json`

## Commands

```sh
yarn install
yarn build
yarn start
yarn format
```

- `yarn build` bundles `plugins/index.js` into minified `dist/index.js`, writes a source map, runs ESLint, inlines CSS/assets, and copies `plugin-manifest.json` to `dist/plugin-manifest.json`.
- `yarn start` watches source files. esbuild serves `dist` internally and the local HTTPS/CORS proxy exposes it on port `3053` using `.dev/localhost.key` and `.dev/localhost.cert`.
- The development manifest URL is `https://localhost:3053/index.js`.
- `yarn format` changes all supported files; run it intentionally and review unrelated changes.

## Temporary Installation

1. Run `yarn start`.
2. Visit `https://localhost:3053/index.js` directly and accept the local development certificate if the browser requires it.
3. Confirm the response is JavaScript, not an HTML error page.
4. In the authenticated Flotiq browser console, run:

   ```js
   FlotiqPlugins.loadPlugin(
     'your-company.your-plugin',
     'https://localhost:3053/index.js',
   );
   ```

Temporary loading lasts until refresh/logout. Loading the same plugin ID replaces the previous registration, which supports quick iteration.

## Permanent Installation

For organization installation, host both built files at browser-accessible HTTPS URLs, set the manifest's `url` to the hosted JavaScript, and add the hosted `plugin-manifest.json` URL in Flotiq plugin management. Localhost is unsuitable for other organization users.

Before publishing:

- Use a unique stable ID, accurate metadata, semantic version, production JavaScript URL, and least-privilege permissions.
- Verify the production host's MIME type, HTTPS certificate, CORS policy, availability, and cache/version behavior.
- Never publish credentials in either built artifact.