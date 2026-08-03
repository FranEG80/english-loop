/** Temporary compatibility alias for `dataset:seed`. */
export { parseArgs, runSeed as main } from "./seed";

if (import.meta.url === `file://${process.argv[1]}`) {
  const { runSeed } = await import("./seed");
  await runSeed();
}
