import esbuild from "esbuild"

await esbuild.build({
	entryPoints: ["lambda.ts"],
	bundle: true,
	platform: "node",
	outdir: "./dist",
})
