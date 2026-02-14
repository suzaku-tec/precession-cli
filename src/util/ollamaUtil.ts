import ollama from 'ollama';
import logger from './logger.ts';

export default class OllamaUtil {

  static async extractKeywords(prompt: string): Promise<{ "keywords": [string] }> {
    const res = await ollama.chat({
      model: 'gemma3:4b',
      messages: [{ role: 'user', content: `あなたはテキストから重要なキーワードを抽出するエキスパートです。\n\n# 指示\n- 入力テキストから重要なキーワード・フレーズを抽出してください。\n- 入力文に実際に出てくる語だけを使ってください。\n- 名詞中心に、日本語として自然な単語単位で抽出してください。\n- 出力はJSONで、次の形式だけを返してください：\n  {"keywords": ["キーワード1", "キーワード2", ...]}\n\n# 対象テキスト\n${prompt}\n` }],
      stream: false,
    });

    const jsonMatch = res.message.content.match(/```json\s*([\s\S]*?)\s*```/);
    logger.info(`Extracted keywords response: ${res.message.content}`);
    try {
      return JSON.parse(jsonMatch![1]!);
    } catch (e) {
      throw new Error(`JSONパースエラー: ${(e as Error).message}`);
    }
  }
}
