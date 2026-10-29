import Anthropic from '@anthropic-ai/sdk'
import { ZodError } from 'zod'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'
import { AI_USE_MOCKS, USE_MOCKS } from '@/mocks/index'
import { buildMockAnalysis } from '@/mocks/ai.mock'
import { analysisSchema, type AiAnalysis, type AnalysisProvenance } from './schema'
import { extractJsonObject } from './parse'
import { SYSTEM_PROMPT, buildRepairPrompt, buildUserPrompt } from './prompt'
import type { AuditSignals, AuditTarget } from '@/types/audit'

export class AiAnalysisError extends Error {
  code: string
  constructor(message: string, code = 'AI_ANALYSIS_FAILED') {
    super(message)
    this.name = 'AiAnalysisError'
    this.code = code
  }
}

export interface AnalysisOutcome {
  analysis: AiAnalysis
  provenance: AnalysisProvenance
}

function formatZodIssues(error: ZodError): string {
  return error.issues
    .slice(0, 20)
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n')
}

function textFromMessage(message: Anthropic.Messages.Message): string {
  return message.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('\n')
    .trim()
}

/**
 * Runs the AI analysis stage.
 *
 * Mock mode (`AI_USE_MOCKS=true`, or no API key) returns a deterministic object
 * derived from the crawled signals and is persisted with source=MOCK. Real mode
 * calls Claude, validates against the versioned schema and performs exactly one
 * repair attempt; invalid output fails the audit rather than being replaced by
 * fabricated "successful" analysis.
 */
export async function analyzeAudit(target: AuditTarget, signals: AuditSignals): Promise<AnalysisOutcome> {
  const started = Date.now()

  if (AI_USE_MOCKS) {
    const raw = buildMockAnalysis(signals, { url: target.url })
    const mockMeta = (raw as { _meta?: unknown })._meta
    const { _meta: _ignored, ...payload } = raw as Record<string, unknown>
    try {
      const analysis = analysisSchema.parse(payload)
      return {
        analysis,
        provenance: {
          source: 'MOCK',
          model: null,
          latencyMs: Date.now() - started,
          attempts: 1,
          repaired: false,
          note: `Deterministic fixture from src/mocks/ai.mock.js (not a Claude response). ${
            mockMeta ? 'Signals-derived scoring.' : ''
          }`.trim(),
        },
      }
    } catch (error) {
      const detail = error instanceof ZodError ? formatZodIssues(error) : String(error)
      throw new AiAnalysisError(`The mock analysis fixture failed schema validation: ${detail}`, 'MOCK_INVALID')
    }
  }

  const config = env()
  if (!config.ANTHROPIC_API_KEY) {
    throw new AiAnalysisError(
      'ANTHROPIC_API_KEY is required when AI_USE_MOCKS=false. Set AI_USE_MOCKS=true for the deterministic fixture.',
      'AI_NOT_CONFIGURED',
    )
  }

  const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY, maxRetries: 2, timeout: 90000 })
  const userPrompt = buildUserPrompt({ target, signals, provenance: { useMocks: USE_MOCKS, aiMock: false } })
  const model = config.ANTHROPIC_MODEL

  logger.info('Requesting Claude SEO analysis', {
    model,
    url: target.url,
    useMocks: USE_MOCKS,
  })

  let rawText: string
  try {
    const message = await client.messages.create({
      model,
      max_tokens: 4096,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })
    rawText = textFromMessage(message)
  } catch (error) {
    throw new AiAnalysisError(
      `Claude request failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      'AI_REQUEST_FAILED',
    )
  }

  const first = validate(rawText)
  if (first.ok) {
    return {
      analysis: first.analysis,
      provenance: {
        source: 'CLAUDE',
        model,
        latencyMs: Date.now() - started,
        attempts: 1,
        repaired: false,
      },
    }
  }

  logger.warn('Claude response failed validation, attempting one repair', {
    model,
    errors: first.errors.slice(0, 600),
  })

  try {
    const repair = await client.messages.create({
      model,
      max_tokens: 4096,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: rawText.slice(0, 12000) },
        { role: 'user', content: buildRepairPrompt(first.errors) },
      ],
    })
    const second = validate(textFromMessage(repair))
    if (second.ok) {
      return {
        analysis: second.analysis,
        provenance: {
          source: 'CLAUDE',
          model,
          latencyMs: Date.now() - started,
          attempts: 2,
          repaired: true,
        },
      }
    }
    throw new AiAnalysisError(
      `Claude returned invalid analysis after repair: ${second.errors.slice(0, 600)}`,
      'AI_INVALID_RESPONSE',
    )
  } catch (error) {
    if (error instanceof AiAnalysisError) throw error
    throw new AiAnalysisError(
      `Claude repair attempt failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      'AI_REQUEST_FAILED',
    )
  }
}

function validate(text: string): { ok: true; analysis: AiAnalysis } | { ok: false; errors: string } {
  if (!text) return { ok: false, errors: 'Model returned an empty response' }
  try {
    const parsed = extractJsonObject(text)
    const analysis = analysisSchema.parse(parsed)
    return { ok: true, analysis }
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, errors: formatZodIssues(error) }
    return { ok: false, errors: error instanceof Error ? error.message : 'Unknown validation error' }
  }
}
