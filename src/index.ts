import { Plugin } from 'vite';
import { ParseUserScript } from './types/UserScript.ts';

/**
 * 从 UserScript 元数据块中提取所有已声明的 @grant 指令值。
 *
 * @param header - UserScript 元数据块的原始字符串（从文件开头到 `// ==/UserScript==` 之前）
 * @returns 已授权 API 名称的去重集合（如 'GM_setValue', 'CAT_openInTab'）
 */
function extractGrants( header: string ): Set<string> {
	const grantList = new Set<string>();
	const grantLines = header.match( /\/\/\s*@grant\s+(.+)/g ) || [];
	grantLines.forEach( line => {
		const match = line.match( /\/\/\s*@grant\s+(.+)/ );
		if ( !match ) return;
		grantList.add( match[ 1 ].trim() );
	} );
	return grantList;
}

/**
 * Vite 插件：
 *
 * 自动检测代码中使用的 ScriptCat / Tampermonkey API，
 * 并在 UserScript 元数据块中补充缺失的 @grant 指令。
 *
 * @param appendGrant - 用户额外需要扫描的 API 名称
 */
export default function extractGrantPlugin( appendGrant: string[] = [] ): Plugin {
	// 构建 GM/CAT API 扫描正则（避免每次循环重建）
	const builtInPatterns = [
		'GM[_.][a-zA-Z0-9_]+',
		'CAT[_.][a-zA-Z0-9_]+',
		'window\\.onurlchange',
		'window\\.close',
		'window\\.focus',
	];
	const allPatterns = [
		...builtInPatterns,
		...appendGrant ];
	const usedApis = new RegExp( `\\b(${allPatterns.join('|')})\\b`, 'g' );
	
	let parsedUserScript: ParseUserScript | undefined;
	
	return {
		name: 'vite-plugin-scriptcat-extract-grant',
		version: '1.0.3',
		
		/**
		 * 获取 vite-plugin-scriptcat-meta-banner 脚本导出的 UserScript
		 */
		buildStart( { plugins } ) {
			const metaPlugin = plugins.find( plugin => plugin.name === 'vite-plugin-scriptcat-meta-banner' );
			if ( !metaPlugin ) return;
			parsedUserScript = metaPlugin.api.parsedUserScript;
		},
		
		generateBundle: {
			order: 'post',  // 后执行
			handler( _, bundle ) {
				for ( const fileName in bundle ) {
					const file = bundle[ fileName ];
					if ( file.type !== 'chunk' || !fileName.endsWith( 'js' ) ) continue;
					const { code } = file;
					if ( !code ) continue;
					
					const trimmedCode = file.code.trim();
					// 判断当前文件是否为脚本 (头部是否存在 UserScript 标识)
					// 精确匹配 UserScript 元数据块结尾
					const userScriptEndMatch = trimmedCode.match( /(\/\/\s*==\/UserScript==)/ );
					if ( !userScriptEndMatch ) continue;
					
					// 定位插入位置：紧邻 // ==/UserScript== 之前
					const insertPosition = userScriptEndMatch.index;
					
					// 读取 UserScript 内容
					const userScriptHeader = trimmedCode.slice( 0, insertPosition );
					// 提取已经授权的函数列表
					let existingGrants: Set<string>;
					if ( parsedUserScript ) {
						existingGrants = parsedUserScript.filter.reduce( ( result, [ key, value ] ) => {
							if ( key === 'grant' ) {
								result.add( value );
							}
							return result;
						}, new Set<string>() );
					}
					else {
						existingGrants = extractGrants( userScriptHeader );
					}
					
					// 获取前一个键名的长度用于对齐
					let indent: number = 0;
					if ( parsedUserScript ) {
						indent = parsedUserScript.maxKeyLength;
					}
					else {
						// 获取前一个键名的长度用于对齐
						const [ , , key ] = trimmedCode.match( /\/\/(\s*)@(\w+\s+).*\r?\n\/\/\s*==\/UserScript==/ ) || [];
						indent = key ? key.length - 4 : 0;
					}
					
					// 使用正则匹配所有可能的 GM_* / CAT_* 调用（简单高效）
					const grantMatches = new Set<string>();
					const matcher = trimmedCode.match( usedApis );
					// 没有捕获到授权函数, 跳过当前文件
					if ( !matcher ) {
						continue;
					}
					for ( let grantFunctionName of matcher ) {
						if ( existingGrants.has( grantFunctionName ) ) {
							continue;
						}
						grantMatches.add( grantFunctionName );
					}
					// 没有新的授权函数, 跳过当前文件
					if ( grantMatches.size === 0 ) {
						continue;
					}
					
					// 生成新的授权函数
					const grantLineContent = Array.from( grantMatches )
						.map( grant => `// @${ 'grant'.padEnd( indent, ' ' ) }    ${ grant }` )
						.join( '\n' );
					
					// 插入新行
					file.code =
						userScriptHeader +
						grantLineContent + '\n' +
						trimmedCode.slice( insertPosition );
				}
			},
		},
	};
}
