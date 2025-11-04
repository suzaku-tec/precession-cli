import fs from 'fs';
import path from 'path';
import logger from '../util/logger.ts';
import { Command } from 'commander';
import { exit } from 'process';

const program = new Command();
program
  .option('-s, --status', 'output mute status')
  .option('-t, --toggle', 'toggle mute status')
  .option('-u, --unmute', 'unmute the alerts')
  ;

program.parse(process.argv);
const options = program.opts();
const muteFilePath = path.resolve('config/mute_status.txt');

if (options.status) {
  // Mute status output
  if (fs.existsSync(muteFilePath)) {
    const status = fs.readFileSync(muteFilePath, 'utf8').trim();
    logger.info(`Mute status: ${status}`);
  } else {
    logger.info('Mute status: off');
  }
  exit(0);
}

if (options.toggle) {
  if (fs.existsSync(muteFilePath)) {
    fs.unlinkSync(muteFilePath);
    logger.info("Mute status set to off");
  } else {
    fs.writeFileSync(muteFilePath, 'on', 'utf8');
    logger.info("Mute status set to on");
  }
  exit(0);
}

if (options.unmute) {
  fs.unlinkSync(muteFilePath);
  logger.info("Mute status set to off");
  exit(0);
}

if (!fs.existsSync(muteFilePath)) {
  fs.writeFileSync(muteFilePath, 'on', 'utf8');
  logger.info("Mute status set to on");
} else {
  logger.info("Mute status is already on");
}
