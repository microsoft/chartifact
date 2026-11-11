import { execFileSync } from 'node:child_process';

for (const name of ['compiler', 'editor', 'host', 'html-wrapper', 'markdown', 'sandbox', 'toolbar']) {
    console.log(`Checking ${name} bundle`);
    execFileSync(process.execPath, ['--input-type=module', '--eval', `
        import assert from 'node:assert/strict';
        import { build } from 'vite';

        const bundles = await build({
            configFile: 'vite.bundle.config.js',
            build: { write: false },
        });

        assert.equal(bundles.length, 2);
        for (const bundle of bundles) {
            const entry = bundle.output.find(file => file.type === 'chunk' && file.isEntry);
            assert.ok(entry, 'Each output must contain an entry chunk');
            assert.ok(entry.exports.length > 0, 'Each bundle must expose its public API');
        }
    `], {
        cwd: new URL(`../packages/${name}/`, import.meta.url),
        stdio: 'inherit',
        timeout: 30_000,
    });
}
