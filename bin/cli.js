#!/usr/bin/env node

'use strict';

const { program } = require('commander');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const ora = require('ora');

ffmpeg.setFfmpegPath(ffmpegStatic);

const { version } = require('../package.json');

function findMp4Files(folderPath, recursive = false) {
  const files = [];
  let entries;

  try {
    entries = fs.readdirSync(folderPath, { withFileTypes: true });
  } catch (err) {
    console.error(chalk.red(`  Error reading folder "${folderPath}": ${err.message}`));
    return files;
  }

  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name);
    if (entry.isDirectory() && recursive) {
      files.push(...findMp4Files(fullPath, recursive));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.mp4')) {
      files.push(fullPath);
    }
  }

  return files;
}

function convertFile(inputPath, outputPath, bitrate) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate(bitrate)
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });
}

async function processFiles(files, options) {
  const { output, bitrate, overwrite } = options;
  let converted = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    const inputPath = files[i];
    const ext = path.extname(inputPath);
    const filename = path.basename(inputPath, ext);
    const outputDir = output ? path.resolve(output) : path.dirname(inputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `${filename}.mp3`);
    const label = files.length > 1 ? `[${i + 1}/${files.length}] ` : '';

    if (fs.existsSync(outputPath) && !overwrite) {
      console.log(chalk.yellow(`  ${label}Skipped: ${filename}.mp3 (already exists — use --overwrite to replace)`));
      skipped++;
      continue;
    }

    const spinner = ora({
      text: `${label}Converting: ${chalk.cyan(path.basename(inputPath))}`,
      color: 'blue',
    }).start();

    try {
      await convertFile(inputPath, outputPath, bitrate);
      spinner.succeed(`${label}${path.basename(inputPath)} → ${chalk.cyan(path.basename(outputPath))}`);
      converted++;
    } catch (err) {
      spinner.fail(`${label}${chalk.red('Failed:')} ${path.basename(inputPath)} — ${err.message}`);
      failed++;
    }
  }

  return { converted, skipped, failed };
}

program
  .name('media-convert')
  .description('Convert MP4 files to MP3 — individually or in bulk')
  .version(version);

program
  .argument('[file]', 'path to a single MP4 file to convert')
  .option('-f, --folder <path>', 'path to a folder; converts all MP4 files inside it')
  .option('-o, --output <dir>', 'output directory for the converted MP3 files')
  .option('-b, --bitrate <rate>', 'audio bitrate: 128k | 192k | 320k', '192k')
  .option('-r, --recursive', 'search for MP4 files recursively inside subfolders')
  .option('--overwrite', 'overwrite existing MP3 files instead of skipping')
  .addHelpText('after', `
Examples:
  $ media-convert recording.mp4
  $ media-convert recording.mp4 --output ./audio --bitrate 320k
  $ media-convert --folder ./meetings
  $ media-convert --folder ./meetings --output ./audio --recursive
  $ media-convert --folder ./meetings --overwrite
`)
  .action(async (file, options) => {
    console.log(chalk.bold.blue('\n  Media Converter CLI') + chalk.dim(`  v${version}\n`));

    let files = [];

    if (options.folder) {
      const folderPath = path.resolve(options.folder);

      if (!fs.existsSync(folderPath)) {
        console.error(chalk.red(`Error: Folder not found: ${folderPath}`));
        process.exit(1);
      }

      process.stdout.write(chalk.dim(`Scanning: ${folderPath}${options.recursive ? ' (recursive)' : ''} ... `));
      files = findMp4Files(folderPath, !!options.recursive);
      process.stdout.write(chalk.green(`${files.length} file(s) found\n\n`));

      if (files.length === 0) {
        console.log(chalk.yellow('No MP4 files found. Nothing to convert.'));
        process.exit(0);
      }

    } else if (file) {
      const filePath = path.resolve(file);

      if (!fs.existsSync(filePath)) {
        console.error(chalk.red(`Error: File not found: ${filePath}`));
        process.exit(1);
      }

      if (!filePath.toLowerCase().endsWith('.mp4')) {
        console.error(chalk.red('Error: Input file must be an .mp4 file.'));
        process.exit(1);
      }

      files = [filePath];

    } else {
      console.error(chalk.red('Error: Provide a file path or use --folder <path> for bulk conversion.\n'));
      program.help();
    }

    const { converted, skipped, failed } = await processFiles(files, options);

    console.log('\n' + chalk.bold('  Summary'));
    console.log('  ' + '─'.repeat(24));
    if (converted > 0) console.log(chalk.green(`  ✓ Converted : ${converted}`));
    if (skipped > 0)   console.log(chalk.yellow(`  ⚠ Skipped   : ${skipped}`));
    if (failed > 0)    console.log(chalk.red(`  ✗ Failed    : ${failed}`));
    console.log('');

    if (failed > 0) process.exit(1);
  });

program.parse();
