# Vite Plugin ScriptCat Extract Grant

[English](./README.md) / 中文

## 功能

自动检测代码中使用的 ScriptCat / Tampermonkey API，并在 UserScript 元数据块中补充缺失的 `@grant` 指令。支持对 `GM_*`, `GM.*`, `CAT_*`, `CAT.*` 系列 API 和 `window.onurlchange`, `window.close`, `window.focus`的自动识别与授权声明。

## 安装

```bash
npm install @yiero/vite-plugin-scriptcat-extract-grant -D
# or
yarn add @yiero/vite-plugin-scriptcat-extract-grant -D
# or
pnpm add @yiero/vite-plugin-scriptcat-extract-grant -D
```

## 配置

| 参数          | 类型       | 描述                        | 默认值 |
| ------------- | ---------- | --------------------------- | ------ |
| `appendGrant` | `string[]` | 额外需要扫描的 API 名称列表 | `[]`   |

> `appendGrant` 中的字符串最终会通过 `new RegExp` 转换为正则表达式, 如果存在特殊字符, 请进行转换. 如 `GM.cookie` -> `GM\\.cookie`

> `appendGrant` 仅作为兜底使用, 如果存在无法识别的 `grant` 函数, 请提 [**Issue**](https://github.com/AliubYiero/vite-plugin-scriptcat-extract-grant/issues). 

## 使用

在 `vite.config.js` / `vite.config.ts` 中添加插件：

**基础使用**

```ts
import { defineConfig } from 'vite'
import scriptCatExtractGrant from '@yiero/vite-plugin-scriptcat-extract-grant'

export default defineConfig({
  plugins: [
    // 其他插件...
    
    // 自动提取并注入 grant 指令
    scriptCatExtractGrant()
  ],	
})
```

---

**进阶使用**

```ts
import { defineConfig } from 'vite'
import scriptCatExtractGrant from '@yiero/vite-plugin-scriptcat-extract-grant'

export default defineConfig({
  plugins: [
    // 其他插件...
    
    // 自动提取并注入 grant 指令 (可选)
    scriptCatExtractGrant([
        // 仅作为示例, 实际是能够正常识别 GM.cookie 的
    	"GM\\.cookie"
    ])
  ],	
})
```

## 工作原理

插件会自动执行以下操作：

1. 通过检测 `// ==UserScript==` 标识识别 UserScript 文件
2. 提取元数据块中已存在的 `@grant` 指令
3. 扫描代码中使用的 `GM_*` / `CAT_*` / `GM.*` / `CAT.*` API 和特殊 window 方法
4. 在 `// ==/UserScript==` 闭合标识前注入缺失的 `@grant` 指令

**处理前：**

```js
// ==UserScript==
// @name        我的脚本
// @namespace   https://example.com  
// @version     1.0
// @grant       GM_setValue
// ==/UserScript==

// 代码中使用了未声明的 API
GM_getValue('setting');
CAT_userConfig();
window.onurlchange = () => console.log('URL changed');
```

**构建后：**

```js
// ==UserScript==
// @name        我的脚本
// @namespace   https://example.com  
// @version     1.0
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       CAT_userConfig
// @grant       window.onurlchange
// ==/UserScript==

// 代码中使用了未声明的 API
GM_getValue('setting');
CAT_userConfig();
window.onurlchange = () => console.log('URL changed');
```

## 默认扫描的 API

插件默认会扫描以下类型的 API 调用：
- 所有 `GM_` 开头的函数 (如 `GM_setValue`, `GM_xmlhttpRequest`)
- 所有 `GM.` 开头的函数 (如 `GM.setValue`, `GM.cookie`)
- 所有 `CAT_` 开头的函数 (如 `CAT_userConfig`, `CAT_fileStorage`)
- 特殊 window 方法 (`window.onurlchange`, `window.close`, `window.focus`)

## 贡献指南

欢迎贡献！请通过 [GitHub](https://github.com/AliubYiero/vite-plugin-scriptcat-extract-grant) 提交 issue 或 PR。

## 许可证

GPL-3 © [AliubYiero](https://github.com/AliubYiero)