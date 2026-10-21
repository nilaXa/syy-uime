#!/usr/bin/env node
import { Command } from 'commander';
import { config } from 'dotenv';
import pc from 'picocolors';
import { loadConfig, validateConfig } from '../config.js';
import { runAssessment } from '../assess.js';
import { generateHtmlReport } from '@syy-uime/html-reporter';
import { EXIT_SUCCESS, EXIT_TECHNICAL_FAILURE } from '@syy-uime/scoring';
import type { Dimension } from '@syy-uime/core';

config({ path: '.env' });

const program = new Command();

program.name('syy-uime').description('UI Maturity Assessment Engine').version('0.1.0');

program
  .command('assess')
  .description('Run a UI maturity assessment')
  .option('--config <path>', 'Path to syy-uime configuration file')
  .option('--url <url>', 'Override base URL')
  .option('--output <path>', 'Override output directory')
  .option('--no-llm', 'Disable Gemini analysis', false)
  .option('--headed', 'Run Playwright in headed mode', false)
  .option('--debug', 'Enable debug output', false)
  .option('--dimension <dimension>', 'Run only a specific dimension (repeatable)', collectDimensions, [])
  .action(async (options) => {
    try {
      if (!options.config) {
        console.error(pc.red('Error: --config is required'));
        process.exit(EXIT_TECHNICAL_FAILURE);
      }

      const assessmentConfig = await loadConfig(options.config);
      const errors = validateConfig(assessmentConfig);
      if (errors.length > 0) {
        for (const error of errors) console.error(pc.red(`Config error: ${error}`));
        process.exit(EXIT_TECHNICAL_FAILURE);
      }

      const assessmentOptions = {
        configPath: options.config,
        url: options.url,
        output: options.output,
        noLlm: options.noLlm,
        headed: options.headed,
        debug: options.debug,
        dimensions: options.dimension.length > 0 ? (options.dimension as Dimension[]) : undefined,
      };

      const { assessment, exitCode } = await runAssessment(assessmentConfig, assessmentOptions);

      printSummary(assessment);
      process.exit(exitCode);
    } catch (err) {
      console.error(pc.red(`Assessment failed: ${(err as Error).message}`));
      if (options.debug) console.error(err);
      process.exit(EXIT_TECHNICAL_FAILURE);
    }
  });

program
  .command('validate-config')
  .description('Validate a syy-uime configuration file')
  .argument('<path>', 'Path to configuration file')
  .action(async (path) => {
    try {
      const assessmentConfig = await loadConfig(path);
      const errors = validateConfig(assessmentConfig);
      if (errors.length > 0) {
        for (const error of errors) console.error(pc.red(`Config error: ${error}`));
        process.exit(EXIT_TECHNICAL_FAILURE);
      }
      console.log(pc.green('Configuration is valid.'));
      process.exit(EXIT_SUCCESS);
    } catch (err) {
      console.error(pc.red(`Validation failed: ${(err as Error).message}`));
      process.exit(EXIT_TECHNICAL_FAILURE);
    }
  });

program
  .command('report')
  .description('Generate an HTML report from an assessment JSON file')
  .argument('<assessment>', 'Path to assessment.json')
  .option('--output <path>', 'Output HTML path', 'report.html')
  .action(async (assessmentPath, options) => {
    try {
      const outputPath = await generateHtmlReport({
        assessmentPath,
        outputPath: options.output,
      });
      console.log(pc.green(`Report generated: ${outputPath}`));
      process.exit(EXIT_SUCCESS);
    } catch (err) {
      console.error(pc.red(`Report generation failed: ${(err as Error).message}`));
      process.exit(EXIT_TECHNICAL_FAILURE);
    }
  });

program.parse();

function collectDimensions(value: string, previous: string[]): string[] {
  return previous.concat(value);
}

function printSummary(assessment: import('@syy-uime/core').Assessment): void {
  console.log(pc.bold(`\nAssessment complete: ${assessment.id}`));
  console.log(`Overall score: ${pc.bold(String(assessment.overallScore))} / 100`);
  console.log(`Overall confidence: ${assessment.overallConfidence}\n`);

  for (const [dimension, data] of Object.entries(assessment.dimensions)) {
    console.log(
      `${pc.bold(pc.cyan(dimension))}: ${data.score} (confidence: ${data.confidence}, ${data.checksFailed} findings)`,
    );
  }

  console.log(`\nArtifacts written to .syy-uime/runs/${assessment.id}/`);
}
