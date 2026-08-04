import { runSeed } from "../scripts/dataset/seed";

/**
 * Entry point used by `prisma db seed`.
 *
 * The dataset is the editorial source of truth: lessons are read from
 * Markdown and activities/taxonomy from JSON. The importer validates the
 * complete dataset, writes a versioned release and publishes it atomically.
 * User accounts and settings deliberately stay outside this seed; they are
 * owned by Better Auth and the account use cases.
 */
runSeed(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
