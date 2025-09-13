import esbuild from 'esbuild';
import { dtsPlugin } from 'esbuild-plugin-d.ts';
import { execSync } from 'child_process';
import { existsSync } from 'fs';

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * esbuild problem matcher plugin for VS Code integration
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
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
};

/**
 * Declaration bundling plugin - bundles individual .d.ts files with rollup
 * @type {import('esbuild').Plugin}
 */
const declarationBundlingPlugin = {
	name: 'declaration-bundling',
	setup(build) {
		build.onEnd(async (result) => {
			if (result.errors.length === 0) {
				try {
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
					console.error('[esbuild] declaration bundling failed:', error.message);
				}
			}
		});
	},
};

async function main() {
	const ctx = await esbuild.context({
		entryPoints: [
			'src/index.ts',
			'src/common.ts',
			'src/datasource.ts',
			'src/interactive.ts',
			'src/page.ts',
			'src/schema.ts'
		],
		bundle: false, // Keep individual modules as requested
		format: 'esm',
		platform: 'node',
		target: 'esnext',
		outdir: 'dist/esnext',
		sourcemap: !production,
		minify: production,
		logLevel: 'info',
		
		plugins: [
			esbuildProblemMatcherPlugin,
			dtsPlugin(), // Use esbuild-plugin-d.ts for declaration generation
			declarationBundlingPlugin, // Bundle declarations after generation
		],
	});

	if (watch) {
		console.log('[esbuild] watching for changes...');
		await ctx.watch();
	} else {
		await ctx.rebuild();
		await ctx.dispose();
	}
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});