const path = require('path')
const esbuild = require('esbuild')
const {  globSync }  = require("glob");
const esbuildPluginTsc = require('esbuild-plugin-tsc');


const entryPoints = globSync("./**/lambda-handlers/*.ts", { ignore: ["node_modules/**"]})
const outDir = `dist`


esbuild.build({
  entryPoints: entryPoints.filter(f => f.indexOf(".test.ts") < 0), 
  bundle: true,
  outdir: path.join(__dirname, outDir),
  outbase: '.',
  platform: "node",
  plugins: [
    esbuildPluginTsc()
  ]
})