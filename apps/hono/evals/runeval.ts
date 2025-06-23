/**
 * Run promptfoo evaluations using the CLI command instead of the node module.
 *
 * Usage:
 * bun run evals/runeval.ts <config-file-names...>
 *
 * Examples:
 * bun run evals/runeval.ts getting-started
 * bun run evals/runeval.ts hono getting-started another-config
 */

import { spawn } from 'node:child_process';

/**
 * Run a single eval using the promptfoo CLI command.
 */
async function runSingleEval(configFileName: string): Promise<void> {
  const configPath = `evals/configs/${configFileName}.yaml`;

  // Check if config file exists
  const fs = await import('node:fs/promises');
  try {
    await fs.access(configPath);
  } catch (error) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  console.log(`\n🚀 Running eval with config: ${configPath}`);

  // Build the command
  const command = 'promptfoo';
  const args = ['eval', '--config', configPath, '--verbose'];

  console.log(`Executing: ${command} ${args.join(' ')}`);

  // Spawn the process
  const child = spawn(command, args, {
    stdio: 'inherit', // This will pipe stdout/stderr to the parent process
    shell: true,
  });

  // Handle process completion
  return new Promise<void>((resolve, reject) => {
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Eval completed successfully: ${configFileName}`);
        resolve();
      } else if (code === 100) {
        console.log(
          `⚠️ Eval completed with some failed test cases: ${configFileName}`
        );
        resolve(); // Don't treat this as an error - it's a normal outcome
      } else {
        console.error(
          `❌ Eval process exited with code ${code}: ${configFileName}`
        );
        reject(
          new Error(
            `Process exited with code ${code} for config: ${configFileName}`
          )
        );
      }
    });

    child.on('error', (error) => {
      console.error(
        `❌ Failed to start eval process for ${configFileName}:`,
        error
      );
      reject(error);
    });
  });
}

/**
 * Show available config files when none are provided or when a config is not found
 */
async function showAvailableConfigs(): Promise<void> {
  console.error('Available config files:');
  try {
    const fs = await import('node:fs/promises');
    const configFiles = await fs.readdir('evals/configs');
    const yamlFiles = configFiles.filter((file) => file.endsWith('.yaml'));
    for (const file of yamlFiles) {
      console.error(`  ${file.replace('.yaml', '')}`);
    }
  } catch (dirError) {
    console.error('Could not read configs directory');
  }
}

/**
 * Run multiple evals sequentially.
 */
async function runEvals() {
  const configFileNames = process.argv.slice(2);

  if (configFileNames.length === 0) {
    console.error(
      'Please provide at least one config file name (without .yaml extension)'
    );
    console.error('Usage: bun run evals/runeval.ts <config-file-names...>');
    console.error('Examples:');
    console.error('  bun run evals/runeval.ts getting-started');
    console.error(
      '  bun run evals/runeval.ts hono getting-started another-config'
    );
    console.error('');
    await showAvailableConfigs();
    process.exit(1);
  }

  console.log(
    `📋 Running ${configFileNames.length} eval(s) sequentially: ${configFileNames.join(', ')}`
  );

  const results: Array<{ config: string; success: boolean; error?: string }> =
    [];

  // Run evals sequentially
  for (const configFileName of configFileNames) {
    try {
      await runSingleEval(configFileName);
      results.push({ config: configFileName, success: true });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`\n❌ Failed to run eval for config: ${configFileName}`);
      console.error(`Error: ${errorMessage}\n`);

      results.push({
        config: configFileName,
        success: false,
        error: errorMessage,
      });

      // Show available configs if file not found
      if (errorMessage.includes('Config file not found')) {
        await showAvailableConfigs();
      }
    }
  }

  // Print summary
  console.log('\n📊 Evaluation Summary:');
  console.log('='.repeat(50));

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  if (successful.length > 0) {
    console.log(`✅ Successful (${successful.length}):`);
    for (const result of successful) {
      console.log(`   - ${result.config}`);
    }
  }

  if (failed.length > 0) {
    console.log(`❌ Failed (${failed.length}):`);
    for (const result of failed) {
      console.log(`   - ${result.config}: ${result.error}`);
    }
  }

  console.log(
    `\n🎯 Total: ${results.length} | Success: ${successful.length} | Failed: ${failed.length}`
  );

  // Exit with error code if any evals failed
  if (failed.length > 0) {
    process.exit(1);
  }
}

runEvals().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
