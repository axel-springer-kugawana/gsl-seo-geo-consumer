import { build } from 'esbuild';
import { globSync } from "glob";
import esbuildPluginTsc from 'esbuild-plugin-tsc';

const entryPoints = globSync("./server.ts", { ignore: ["node_modules/**"] })


await build({
  entryPoints: entryPoints,
  bundle: true,
  outdir: `dist`,
  outbase: '.',
  platform: "node",
  minify: true,
  plugins: [
    esbuildPluginTsc()
  ]
})