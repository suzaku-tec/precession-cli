import logger from "../util/logger.ts";
import audioPlayer from 'sound-play';
import fs from 'fs';
import path from 'path';

export default class AudioTask implements TaskExecutor, TaskParamChecker {
  check(param: TaskParam): boolean {

    if (!param) {
      logger.error("AudioTask: param is undefined");
      return false;
    }

    const audioParam = param as AudioTaskParam;
    if (!audioParam.audioFilePath) {
      logger.error("AudioTask: audioFilePath is undefined");
      return false;
    }

    const audioFilePath = path.join(process.cwd(), audioParam.audioFilePath);

    if (!fs.existsSync(audioFilePath)) {
      logger.error(`AudioTask: audio file does not exist at path: ${audioParam.audioFilePath}`);
      return false;
    }

    return true;
  }

  async execute(taskInfo: TaskInfo, taskParam: AudioTaskParam): Promise<void> {

    // Check mute status
    const muteFilePath = path.resolve('config/mute_status.txt');
    if (fs.existsSync(muteFilePath)) {
      logger.info(`AudioTask: Mute is enabled. Skipping audio playback for task: ${taskInfo.name}`);
      return;
    }

    const audioFilePath = path.join(process.cwd(), taskParam.audioFilePath);

    logger.info(`Executing audio task: ${taskInfo.name}: param=${audioFilePath}`);
    await audioPlayer.play(audioFilePath).then(() => {
      logger.info(`AudioTask: Finished playing audio file: ${audioFilePath}`);
    }).catch((error) => {
      logger.error(`AudioTask: Error playing audio file: ${error}`);
    });
    return Promise.resolve();
  }
}

