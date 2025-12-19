import ollama from 'ollama';
import { webSearch } from './searxngUtil.ts';
import type { ChatResponse } from 'ollama';
import logger from './logger.ts';

export default class OllamaSearxngUtil {

  private static instance: OllamaSearxngUtil;

  private constructor() {
  }

  public static getInstance(): OllamaSearxngUtil {
    if (!OllamaSearxngUtil.instance) {
      logger.debug(`Gemini API Initializing...`);
      OllamaSearxngUtil.instance = new OllamaSearxngUtil();
    }
    return OllamaSearxngUtil.instance;
  }

  async question(question: string): Promise<ChatResponse> {
    const results = await webSearch(question);

    const context = results.map((r: { title: any; snippet: any; url: any; }) =>
      `【${r.title}】\n${r.snippet}\n出典: ${r.url}`
    ).join('\n\n');

    const prompt = `${question}\n\n以下はWeb検索結果です。参考にして日本語で答えてください。\n\n${context}`;

    const res = await ollama.chat({
      model: 'gemma3:4b',
      messages: [{ role: 'user', content: prompt }]
    });

    return res;
  }

}

