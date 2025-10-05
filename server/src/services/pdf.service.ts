import { promises as fs } from "node:fs";
import { logger } from "../utils/logger";

type PdfParseFn = (data: Buffer) => Promise<{ text: string }>;

let pdfParser: PdfParseFn | null = null;

async function getPdfParser(): Promise<PdfParseFn> {
  if (pdfParser) return pdfParser;
  const mod = await import("pdf-parse");
  const parser = (mod.default ?? (mod as unknown)) as unknown as PdfParseFn;
  pdfParser = parser;
  return parser;
}

export async function extractTextFromPdf(filePath: string): Promise<string> {
  try {
    const buffer = await fs.readFile(filePath);
    const parse = await getPdfParser();
    const result = await parse(buffer);
    if (!result.text || !result.text.trim()) {
      logger.warn("PDF feldolgozás üres eredményt adott", { filePath });
    }
    return result.text ?? "";
  } catch (err) {
    logger.error("PDF szövegkinyerési hiba", { err, filePath });
    throw err;
  }
}
