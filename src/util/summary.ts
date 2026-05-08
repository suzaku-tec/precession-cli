import OllamaUtil from "./ollamaUtil.ts";

class Summary {

  private static instance: Summary;

  private constructor() { }

  public static getInstance(): Summary {
    if (!Summary.instance) {
      Summary.instance = new Summary();
    }
    return Summary.instance;
  }

  /**
   * テキストを要約する関数
   * 
   * @param text 要約対象のテキスト
   * @returns 要約内容
   */
  async execute(text: string): Promise<string> {
    const prompt = `以下の文章を要約してください。重要なポイントを簡潔にまとめてください。\n\n${text}`;
    return await OllamaUtil.question(prompt);
  }
}

export default Summary;
