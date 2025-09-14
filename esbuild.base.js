/**
 * Common esbuild configuration factory
 * Auto-discovers TypeScript entry points and provides consistent build setup
 */

import { readdir } from 'fs/promises';
import { join } from 'path';

/**
 * Discover TypeScript entry points in src/
 * @param {string} srcDir - Source directory (default: 'src')
 * @returns {Promise<string[]>} Array of entry point paths
 */
export async function discoverEntryPoints(srcDir = 'src') {
	try {
		const files = await readdir(srcDir);
		const tsFiles = files
			.filter(file => file.endsWith('.ts'))
			.map(file => join(srcDir, file));
		
		if (tsFiles.length === 0) {
			throw new Error(`No TypeScript files found in ${srcDir}/`);
		}
		
		console.log(`[esbuild] discovered entry points: ${tsFiles.join(', ')}`);
		return tsFiles;
	} catch (error) {
		console.error(`[esbuild] failed to discover entry points: ${error.message}`);
		process.exit(1);
	}
}

/**
 * Common esbuild plugins
 */
export const commonPlugins = {
	/**
	 * esbuild problem matcher plugin for VS Code integration
	 * @type {import('esbuild').Plugin}
	 */
	problemMatcher: {
		name: 'esbuild-problem-matcher',
		setup(build) {
			build.onStart(() => {
				console.log('[esbuild] build started');
			});
			build.onEnd((result) => {
				result.errors.forEach(({ text, location }) => {
					console.error(`✘ [ERROR] ${text}`);
					if (location) {
						console.error(`    ${location.file}:${location.line}:${location.column}:`);
					}
				});
				if (result.errors.length === 0) {
					console.log('[esbuild] JS compilation finished successfully');
				}
			});
		},
	},

	/**
	 * TypeScript declaration plugin - runs tsc for declaration generation
	 * @type {import('esbuild').Plugin}
	 */
	declarations: {
		name: 'typescript-declarations',
		setup(build) {
			build.onEnd(async (result) => {
				if (result.errors.length === 0) {
					try {
						const { execSync } = await import('child_process');
						const { existsSync } = await import('fs');
						
						// Generate declarations with tsc
						console.log('[esbuild] generating TypeScript declarations...');
						execSync('npx tsc --emitDeclarationOnly --declaration --declarationDir dist/esnext', { 
							stdio: 'inherit',
							cwd: process.cwd()
						});
						console.log('[esbuild] declarations generated successfully');
						
						// Bundle declarations with rollup if available
						if (existsSync('rollup.config.types.js')) {
							console.log('[esbuild] bundling declarations...');
							execSync('npx rollup -c rollup.config.types.js', { 
								stdio: 'inherit',
								cwd: process.cwd()
							});
							console.log('[esbuild] declarations bundled successfully');
						}
					} catch (error) {
						console.error('[esbuild] declaration generation failed:', error.message);
					}
				}
			});
		},
	}
};

/**
 * Create standard esbuild configuration
 * @param {object} options - Configuration options
 * @param {string[]} [options.entryPoints] - Entry points (auto-discovered if not provided)
 * @param {string} [options.srcDir] - Source directory for auto-discovery (default: 'src')
 * @param {boolean} [options.declarations] - Generate declarations (default: true)
 * @param {object} [options.esbuildOverrides] - Additional esbuild options
 * @returns {Promise<object>} esbuild configuration
 */
export async function createConfig(options = {}) {
	const {
		entryPoints = await discoverEntryPoints(options.srcDir),
		declarations = true,
		esbuildOverrides = {}
	} = options;

	const production = process.argv.includes('--production');
	
	const plugins = [commonPlugins.problemMatcher];
	
	if (declarations) {
		plugins.push(commonPlugins.declarations);
	}

	return {
		entryPoints,
		bundle: false, // Keep individual modules
		format: 'esm',
		platform: 'node',
		target: 'esnext',
		outdir: 'dist/esnext',
		sourcemap: !production,
		minify: production,
		logLevel: 'info',
		plugins,
		...esbuildOverrides
	};
}