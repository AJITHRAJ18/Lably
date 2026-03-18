// ============================================================
// Lably — PDF Extraction Service
// Extracts raw text from a PDF buffer using pdf-parse.
// ============================================================

import pdfParse from "pdf-parse";
import { createError } from "../middleware/errorHandler.js";

const MIN_TEXT_LENGTH = 50;
const MAX_CHARS_FOR_CLAUDE = 20000;

/**
 * normalizePdfText — cleans up common artefacts from column-based PDF extraction:
 *   1. Rejoins words that are split across lines mid-parenthesis (e.g. "Pulse \nHeight").
 *   2. Collapses runs of multiple spaces into a single space per line.
 *   3. Trims trailing/leading whitespace from every line.
 *   4. Collapses 3+ consecutive blank lines to two.
 */
function normalizePdfText(text) {
  return text
    // Rejoin lines where the break is clearly mid-word / mid-parenthetical:
    // a line ending with a non-punctuation char followed by continuation lines.
    .replace(/([A-Za-z0-9,])\s*\n([a-z(])/g, "$1 $2")
    // Collapse multiple spaces on each line to one
    .split("\n")
    .map((line) => line.replace(/ {2,}/g, " ").trim())
    .join("\n")
    // Collapse 3+ blank lines to 2
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * extractPdfText — pulls plain text from an in-memory PDF buffer.
 * Throws a 422 error if the PDF is blank or appears to be image-only.
 *
 * @param {Buffer} buffer - raw PDF bytes from multer memoryStorage
 * @returns {Promise<string>} extracted text, capped at MAX_CHARS_FOR_CLAUDE
 */
export async function extractPdfText(buffer) {
  let data;
  try {
    data = await pdfParse(buffer);
  } catch {
    throw createError(
      422,
      "pdf_parse_error",
      "Could not read this PDF. Make sure the file is not password-protected or corrupted."
    );
  }

  const text = normalizePdfText((data.text || "").trim());

  if (text.length < MIN_TEXT_LENGTH) {
    throw createError(
      422,
      "pdf_no_text",
      "Could not extract text from this PDF. It may be a scanned image — try a digitally-generated PDF from your patient portal."
    );
  }

  // Cap to avoid exceeding Claude's input window
  return text.slice(0, MAX_CHARS_FOR_CLAUDE);
}
