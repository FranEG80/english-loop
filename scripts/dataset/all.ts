import { runCoverage } from "./coverage";
import { runDuplicateDetection } from "./duplicates";
import { runIndexing } from "./index";
import { runPracticeIndex } from "./practice-index";
import { runGradingTests } from "./test-grading";
import { runValidation } from "./validate";

async function runAll(): Promise<void> {
  await runIndexing();
  await runPracticeIndex();
  await runCoverage();
  await runDuplicateDetection();
  await runGradingTests();
  await runValidation();
}

runAll().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
