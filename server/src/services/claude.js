// ============================================================
// Lably — Gemini AI Translation Service
// Sends extracted PDF text to Gemini and parses the structured
// JSON response describing each biomarker in plain English.
// ============================================================

import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config/index.js";
import { createError } from "../middleware/errorHandler.js";

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

// ─────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// Core instruction set for Gemini — role, output schema, safety
// ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
You are a medical lab report translator. Your job is to help patients
understand their own lab results in plain, calm, accurate English.

STRICT RULES — never break these:
- NEVER diagnose any condition. Never say "you have X" or "this means you have X".
- NEVER use alarming language. Be calm, factual, and reassuring.
- ALWAYS recommend discussing results with a healthcare provider.
- NEVER invent reference ranges — only use ranges explicitly present in the report.
- If a marker's meaning is ambiguous or unclear, say so honestly.
- If you cannot find a clear value for a marker, skip it rather than guess.

YOUR TONE:
- Write like a knowledgeable friend, not a doctor or a textbook.
- Plain English only. No medical jargon in plain_english or summary fields.
- Be specific but not scary. "This is below the typical range" not "This is dangerously low".

OUTPUT FORMAT:
Respond ONLY with a single valid JSON object. No preamble, no explanation,
no markdown code fences. Just the raw JSON object matching this exact schema:

{
  "report_date": string | null,
  "lab_name": string | null,
  "patient_name": string | null,
  "markers": [
    {
      "name": string,
      "value": string,
      "unit": string,
      "reference_range": string | null,
      "status": "normal" | "low" | "high" | "borderline_low" | "borderline_high" | "unknown",
      "plain_english": string,
      "why_it_matters": string,
      "flag": boolean,
      "possible_reasons": string[] | null,
      "food_habits": string[] | null
    }
  ],
  "flagged_count": number,
  "doctor_questions": string[],
  "overall_summary": string,
  "disclaimer": "This report translation is for educational purposes only and does not constitute medical advice. Please discuss your results with a qualified healthcare provider."
}

FIELD DEFINITIONS:
- name: The biomarker name as it appears in the report
- value: The numeric result as a string (e.g. "11.2", ">200", "<0.01")
- unit: Unit of measurement (e.g. "g/dL", "mIU/L", "%")
- reference_range: The lab's stated normal range, exactly as written
- status: Classification based on the lab's own reference range
- plain_english: 2-3 sentences explaining what this marker measures and what the result suggests. Write directly to the patient as "your".
- why_it_matters: One sentence on why doctors track this marker.
- flag: true if the value is outside the normal reference range OR borderline
- possible_reasons: (ONLY for flagged markers) 2-4 common, non-alarming reasons this value may be off. Use plain language. null for normal markers.
- food_habits: (ONLY for flagged markers) 3-5 specific foods or dietary changes that can help improve this marker. Be specific (e.g. "Spinach and lentils for iron" not just "eat healthy"). null for normal markers.
- doctor_questions: 4-6 specific, actionable questions based on flagged values
- overall_summary: One calm paragraph summarising the report as a whole
- flagged_count: Total number of markers where flag is true
`.trim();

// ─────────────────────────────────────────────────────────────
// USER PROMPT BUILDER
// ─────────────────────────────────────────────────────────────

function buildUserPrompt(rawText) {
  return `Here is the full text extracted from a lab report PDF.
Please extract every biomarker you can find and translate the report.

IMPORTANT — PDF table format note: The text was extracted column-by-column from a
tabular lab report. Each biomarker typically appears as four consecutive lines:
  1. Reference range (e.g. "13-17" or "<200")
  2. Test name (may span multiple lines if the name is long)
  3. Unit of measurement (e.g. "gm%", "mg/dL")
  4. Measured value, optionally followed by " *" when flagged out of range
Use this structure to correctly identify name, value, unit, and reference range
for every marker, even when the ordering looks unusual.

--- START OF LAB REPORT ---
${rawText}
--- END OF LAB REPORT ---

Return only the JSON object as specified. Do not include any text outside the JSON.`;
}

// ─────────────────────────────────────────────────────────────
// TRANSLATION ENGINE
// ─────────────────────────────────────────────────────────────

/**
 * translateLabReport — sends extracted text to Gemini and returns
 * a structured, validated translation object.
 *
 * @param {string} rawText - plain text extracted from the PDF
 * @returns {Promise<Object>} validated lab translation result
 */
export async function translateLabReport(rawText) {
  console.log(`[Gemini] Sending ${rawText.length} chars to Gemini...`);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  let result;
  try {
    result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: buildUserPrompt(rawText) }] }],
      generationConfig: {
        maxOutputTokens: 65536,
        temperature: 0.2,
      },
    });
  } catch (err) {
    console.error("[Gemini] API call failed:", err.message);
    throw createError(503, "ai_unavailable", "Translation service is temporarily unavailable. Please try again.");
  }

  const response = result.response;
  const finishReason = response.candidates?.[0]?.finishReason;

  // Guard: if Gemini hit the token limit the JSON will be truncated and unparseable.
  if (finishReason === "MAX_TOKENS") {
    console.error("[Gemini] Response truncated — increase maxOutputTokens or reduce input.");
    throw createError(500, "response_truncated", "The report is too large to process in one pass. Try uploading just the results pages of your lab report.");
  }

  const text = response.text();
  console.log(`[Gemini] Response received — finishReason: ${finishReason}, length: ${text.length} chars`);

  if (!text) {
    throw createError(500, "ai_unexpected_response", "Unexpected response from translation engine.");
  }

  // Strip any accidental markdown fences before parsing
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("[Gemini] Non-JSON response:", cleaned.slice(0, 300));
    throw createError(500, "ai_parse_error", "Failed to parse translation result. Please try again.");
  }

  // Validate required schema fields
  if (!Array.isArray(parsed.markers) || parsed.markers.length === 0) {
    throw createError(422, "no_markers_found", "No biomarkers could be found in this report. Check that the PDF contains lab results.");
  }

  // Recalculate flagged_count from actual marker flags — don't trust the model's count.
  parsed.flagged_count = parsed.markers.filter((m) => m.flag === true).length;

  return parsed;
}
