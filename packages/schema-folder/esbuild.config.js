import esbuild from 'esbuild';
import { createConfig } from '../../esbuild.base.js';

async function main() {
	const watch = process.argv.includes('--watch');
	
	// Create configuration using common base with auto-discovery
	const config = await createConfig();
	
	// Run esbuild
	const ctx = await esbuild.context(config);

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