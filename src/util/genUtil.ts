import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import logger from './logger.ts';
import type { GenerateContentResponse } from "@google/genai";

export default class GenUtil {

  private static instance: GenUtil;

  private ai: GoogleGenAI;

  private constructor() {
    // プライベートコンストラクタでインスタンス化を防止
    dotenv.config({ debug: true, override: true });
    this.ai = new GoogleGenAI({});
  }

  public static getInstance(): GenUtil {
    if (!GenUtil.instance) {
      logger.debug(`Gemini API Initializing...`);
      GenUtil.instance = new GenUtil();
    }
    return GenUtil.instance;
  }

  public async question(prompt: string): Promise<GenerateContentResponse> {
    logger.info(`Gemini prompt: ${prompt}`);
    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    logger.debug(`Gemini response: ${response}`);
    return response;
  }
}
