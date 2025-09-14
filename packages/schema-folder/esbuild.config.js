import esbuild from 'esbuild';
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
 * TypeScript declaration plugin - runs tsc for declaration generation
 * @type {import('esbuild').Plugin}
 */
const declarationPlugin = {
	name: 'typescript-declarations',
	setup(build) {
		build.onEnd(async (result) => {
			if (result.errors.length === 0) {
				try {
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
};

async function main() {
	const ctx = await esbuild.context({
		entryPoints: [
			'src/index.ts',
			'src/folder.ts',
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
			declarationPlugin, // Generate declarations with tsc
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