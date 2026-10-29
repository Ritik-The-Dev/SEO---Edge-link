/**
 * Extracts a JSON object from raw model text.
 *
 * Handles the common failure modes seen with LLM output: Markdown fences,
 * leading prose, trailing commentary, curly quotes and trailing commas.
 * This is a bounded, deterministic repair — it never invents missing fields.
 */
export function extractJsonObject(raw: string): unknown {
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new Error('Empty model response')
  }

  let text = raw.trim()

  // Strip fenced code blocks (```json ... ``` or ``` ... ```).
  const fence = text.match(/```(?:json|JSON)?\s*([\s\S]*?)```/)
  if (fence?.[1]) text = fence[1].trim()

  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('Model response did not contain a JSON object')
  }
  text = text.slice(firstBrace, lastBrace + 1)

  const attempts = [
    text,
    text.replace(/,\s*([}\]])/g, '$1'),
    text
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/[\u2018\u2019]/g, "'"),
  ]

  let lastError: unknown
  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate)
    } catch (error) {
      lastError = error
    }
  }

  throw new Error(`Could not parse model JSON: ${lastError instanceof Error ? lastError.message : 'invalid JSON'}`)
}
