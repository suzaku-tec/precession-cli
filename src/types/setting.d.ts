interface Setting {
  voicevox?: VoiceVoxSetting;
  ollama?: OllamaSetting;
}

interface VoiceVoxSetting {
  enabled: boolean;
  speakerId: number;
  domain: string;
  port: number;
  speedScale: number;
}

interface OllamaSetting {
  model: string;
}
