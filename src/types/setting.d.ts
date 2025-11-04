interface Setting {
  voicevox?: VoiceVoxSetting;
}

interface VoiceVoxSetting {
  enabled: boolean;
  speakerId: number;
  domain: string;
  port: number;
}
