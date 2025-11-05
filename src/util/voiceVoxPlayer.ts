import soundPlay from 'sound-play';
import fs from 'fs';
import logger from './logger.ts';
import path from 'path';
import SettingUtil from './settingUtil.ts';

export default class VoiceVoxPlayer {

  private constructor() {
  }

  static async playVoiceVox(text: string): Promise<void> {

    const settings = SettingUtil.loadSettings();
    const voiceVoxConfig = settings!.voicevox;
    if (!voiceVoxConfig) {
      logger.error("VOICEVOX settings not found.");
      return;
    }

    const speakerId = voiceVoxConfig.speakerId || 1;

    // 1. 音声合成クエリを作成
    const queryRes = await fetch(`http://${voiceVoxConfig.domain}:${voiceVoxConfig.port}/audio_query?text=${encodeURIComponent(text)}&speaker=${speakerId}`, {
      method: 'POST',
    });
    const queryJson = await queryRes.json();
    queryJson.speedScale = voiceVoxConfig.speedScale;

    // 2. 合成クエリで音声データ取得
    const synthesisRes = await fetch(`http://${voiceVoxConfig.domain}:${voiceVoxConfig.port}/synthesis?speaker=${speakerId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryJson),
    });

    // 3. バイナリ形式で取得
    const audioBuffer = await synthesisRes.arrayBuffer();
    const buffer = Buffer.from(audioBuffer);

    // 4. ファイルに保存
    const timestamp = Date.now();
    const date = new Date(timestamp);
    const timestampStr =
      date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0') +
      date.getHours().toString().padStart(2, '0') +
      date.getMinutes().toString().padStart(2, '0') +
      date.getSeconds().toString().padStart(2, '0');
    const outputPath = path.resolve(`tmp/output_voicevox_${timestampStr}.wav`);
    fs.writeFileSync(outputPath, buffer);

    // 5. 再生
    return soundPlay.play(outputPath).then(() => {
      logger.info(`Finished playing VOICEVOX audio: ${outputPath}`);

      // 6. 再生後にファイル削除
      fs.unlinkSync(outputPath);
      return Promise.resolve();
    }).catch((error) => {
      logger.error(`Error playing VOICEVOX audio: ${error}`);
      return Promise.reject(error);
    });
  }
}
