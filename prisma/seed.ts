import { runSeed } from "../scripts/dataset/seed";

/**
 * Entry point used by `prisma db seed`.
 *
 * The dataset is the editorial source of truth: lessons are read from
 * Markdown and activities/taxonomy from JSON. The importer validates the
 * complete dataset, writes a versioned release and publishes it atomically.
 * The public demo account and its settings are also seeded as a fixture. It
 * is not a normal sign-in account: the demo route is read-only and does not
 * create a Better Auth session.
 */
runSeed(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
