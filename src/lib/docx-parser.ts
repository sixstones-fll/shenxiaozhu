import mammoth from "mammoth";

/**
 * 从 DOCX 文件二进制内容中提取纯文本。
 * 注意：旧版 .doc 格式不支持。
 */
export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export function isDocxFile(fileName: string): boolean {
  return /\.docx$/i.test(fileName);
}
