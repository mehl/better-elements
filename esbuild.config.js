import esbuild from "esbuild";
import { startDevServer } from "./server.js";

const isWatch = process.argv.includes("--watch");
const isServe = process.argv.includes("--serve");

const ctx = await esbuild.context({
  entryPoints: { betterElements: "src/index.tsx" },
  bundle: true,
  format: "esm",
  target: ["es2019"],
  sourcemap: true,
  outdir: "dist",
});

if (isServe) {
  await ctx.watch();
  await startDevServer();
} else if (isWatch) {
  await ctx.watch();
  await new Promise(() => { });
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
