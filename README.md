# Vite Plugin ScriptCat Extract Grant

English / [中文](./README.zh.md)

## Features

Automatically detects ScriptCat / Tampermonkey APIs used in your code and supplements missing `@grant` directives in the UserScript metadata block. Supports automatic recognition and authorization declaration for `GM_*`, `GM.*`, `CAT_*`, `CAT.*` API series and special window methods (`window.onurlchange`, `window.close`, `window.focus`).

## Installation

```bash
npm install @yiero/vite-plugin-scriptcat-extract-grant -D
# or
yarn add @yiero/vite-plugin-scriptcat-extract-grant -D
# or
pnpm add @yiero/vite-plugin-scriptcat-extract-grant -D
```

## Configuration

| Parameter     | Type       | Description                          | Default |
| ------------- | ---------- | ------------------------------------ | ------- |
| `appendGrant` | `string[]` | List of additional API names to scan | `[]`    |

> Strings in `appendGrant` will be converted to regular expressions via `new RegExp`. If special characters exist, please escape them. For example: `GM.cookie` -> `GM\\.cookie`

> `appendGrant` is only used as a fallback. If there are grant functions that cannot be recognized, please submit an [**Issue**](https://github.com/AliubYiero/vite-plugin-scriptcat-extract-grant/issues).

## Usage

Add the plugin in `vite.config.js` / `vite.config.ts`:

**Basic Usage**

```ts
import { defineConfig } from 'vite'
import scriptCatExtractGrant from '@yiero/vite-plugin-scriptcat-extract-grant'

export default defineConfig({
  plugins: [
    // Other plugins...
    
    // Automatically extract and inject grant directives
    scriptCatExtractGrant()
  ],	
})
```

---

**Advanced Usage**

```ts
import { defineConfig } from 'vite'
import scriptCatExtractGrant from '@yiero/vite-plugin-scriptcat-extract-grant'

export default defineConfig({
  plugins: [
    // Other plugins...
    
    // Automatically extract and inject grant directives (optional)
    scriptCatExtractGrant([
        // Example only, GM.cookie can actually be recognized normally
    	"GM\\.cookie"
    ])
  ],	
})
```

## How It Works

The plugin automatically performs the following operations:

1. Identifies UserScript files by detecting the `// ==UserScript==` marker
2. Extracts existing `@grant` directives from the metadata block
3. Scans code for used `GM_*` / `CAT_*` / `GM.*` / `CAT.*` APIs and special window methods
4. Injects missing `@grant` directives before the closing `// ==/UserScript==` marker

**Before processing:**

```js
// ==UserScript==
// @name        My Script
// @namespace   https://example.com    
// @version     1.0
// @grant       GM_setValue
// ==/UserScript==

// Code using undeclared APIs
GM_getValue('setting');
CAT_userConfig();
window.onurlchange = () => console.log('URL changed');
```

**After processing:**

```js
// ==UserScript==
// @name        My Script
// @namespace   https://example.com    
// @version     1.0
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       CAT_openInTab
// @grant       window.onurlchange
// ==/UserScript==

// Code using undeclared APIs
GM_getValue('setting');
CAT_openInTab('https://example.com');
window.onurlchange = () => console.log('URL changed');
```

## Default Scanned APIs

The plugin scans for the following types of API calls by default:

- All functions starting with `GM_` (e.g., `GM_setValue`, `GM_xmlhttpRequest`)
- All functions starting with `GM.` (e.g., `GM.setValue`, `GM.cookie`)
- All functions starting with `CAT_` (e.g., `CAT_userConfig`, `CAT_fileStorage`)
- Special window methods (`window.onurlchange`, `window.close`, `window.focus`)

## Contribution Guide

Contributions are welcome! Please submit issues or PRs via [GitHub](https://github.com/AliubYiero/vite-plugin-scriptcat-extract-grant).

## License

GPL-3 © [AliubYiero](https://github.com/AliubYiero)
