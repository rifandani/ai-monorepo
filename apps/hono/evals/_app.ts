/**
 * We don't use promptfoo as node module.
 * This is just an example how to use it as node module.
 * Use it as CLI instead by running `bun eval`.
 */

import path from 'node:path';
import promptfoo from 'promptfoo';
import type { EvaluateOptions, EvaluateTestSuite } from 'promptfoo';

const options: EvaluateOptions = {
  maxConcurrency: 5,
};

/**
 * Run an eval and print the results.
 *
 * The promptfoo CLI didn't work well with Typescript / ES modules, so we wrap the node library instead.
 *
 * Usage:
 * npm run eval <path to eval file>
 */
async function runEval() {
  const evalFilePath = process.argv[2];
  if (!evalFilePath) {
    console.error('Please provide the path to an eval file');
    process.exit(1);
  }

  const { testSuite } = await import(path.resolve(evalFilePath));

  const finalTestSuite: EvaluateTestSuite = {
    // Write the latest results to promptfoo storage to use the web viewer.
    writeLatestResults: true,
    ...testSuite,
  };

  console.log('Running eval test suite hitting', finalTestSuite.description);
  const evalResults = await promptfoo.evaluate(finalTestSuite, options);
  const summary = await evalResults.toEvaluateSummary();
  console.log('Eval summary', summary.stats);

  const file = await evalResults.toResultsFile();
  console.log('Eval results file', file);

  await evalResults.save();
}

runEval();
