const path = require('path')
const esbuild = require('esbuild')
const esbuildPluginTsc = require('esbuild-plugin-tsc');

// Long running container entrypoints, as opposed to the lambda handlers built by
// esbuild.config.js. duckdb ships prebuilt native bindings per platform, so it
// stays external and is installed by the image instead of being bundled.
esbuild.build({
  entryPoints: ['./geo-bulk-load/main.ts'],
  bundle: true,
  outdir: path.join(__dirname, 'dist'),
  outbase: '.',
  platform: 'node',
  target: 'node22',
  external: ['@duckdb/node-api', '@duckdb/node-bindings', 'pg-native'],
  plugins: [
    esbuildPluginTsc()
  ]
})
