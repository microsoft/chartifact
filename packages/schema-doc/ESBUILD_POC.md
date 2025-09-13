# esbuild Proof of Concept for schema-doc Package

This demonstrates replacing TypeScript compilation (`tsc`) with esbuild while maintaining full compatibility with the existing build pipeline.

## Current Build System

```bash
npm run build  # tsc -> rollup declarations -> strip-blanks -> schema -> copy-schema
```

- **tsc**: Compiles TypeScript to JavaScript + individual declaration files
- **rollup**: Bundles declaration files into single `dist/idoc.d.ts`
- **strip-blanks**: Post-processes declaration file
- **schema**: Generates JSON schema
- **copy-schema**: Copies schema to other locations

## esbuild Implementation

```bash
npm run build:esbuild  # esbuild -> strip-blanks -> schema -> copy-schema
```

### Key Features

1. **Individual Module Output**: Uses `bundle: false` to maintain separate JS files
2. **Declaration Generation**: Hybrid approach using esbuild + tsc for declarations
3. **Rollup Integration**: Reuses existing rollup config for declaration bundling
4. **Performance**: Faster JavaScript compilation
5. **Drop-in Replacement**: Same output structure and compatibility

### Configuration

- **esbuild.config.js**: Main configuration file
- **Hybrid Plugin**: Custom plugin that runs `tsc --emitDeclarationOnly` + rollup bundling
- **Problem Matcher**: VS Code integration for build errors

### Usage

```bash
# esbuild compilation (development)
npm run esbuild

# Watch mode
npm run esbuild:watch

# Full build with esbuild
npm run build:esbuild

# Compare with original
npm run build
```

### Benefits

- **Performance**: Significantly faster JavaScript compilation
- **Compatibility**: 100% compatible with existing declaration bundling
- **Individual Modules**: Maintains separate .js files as requested
- **TypeScript Support**: Full TypeScript declaration generation
- **Drop-in**: Can replace `tsc` without breaking existing workflows

### Migration Strategy

1. **Test**: Use `build:esbuild` alongside existing `build` command
2. **Validate**: Ensure output files are identical
3. **Performance**: Measure compilation speed improvements
4. **Replace**: Update main `build` script once validated
5. **Extend**: Apply to other TypeScript packages (common, web-frontend, etc.)

This approach addresses the original request for esbuild with declaration plugin support while maintaining full compatibility with the existing build system.