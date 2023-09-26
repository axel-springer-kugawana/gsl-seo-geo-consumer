const path = require('path')
const esbuild = require('esbuild')
const {  globSync }  = require("glob");
const esbuildPluginTsc = require('esbuild-plugin-tsc');


const entryPoints = globSync("./**/lambdas/*.ts", { ignore: "node_modules/**"})
const outDir = `dist`


esbuild.build({
  entryPoints, 
  bundle: true,
  outdir: path.join(__dirname, outDir),
  outbase: '.',
  platform: "node",
  plugins: [
    esbuildPluginTsc()
  ]
})



