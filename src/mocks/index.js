/**
 * Central mock switch required by the assessment.
 *
 * USE_MOCKS=true  → every external signal returns the deterministic assessment
 *                   fixtures in this folder (PageSpeed, GSC, DataForSEO, WhatsApp).
 * USE_MOCKS=false → adapters call the real integrations; missing credentials
 *                   raise explicit errors instead of silently fabricating data.
 *
 * AI analysis has its own flag (AI_USE_MOCKS) so a demo can use real external
 * mocks together with the deterministic AI fixture, or any other combination.
 */
import pagespeedMock from './pagespeed.mock.js'
import gscMock from './gsc.mock.js'
import dataForSeoMock from './dataforseo.mock.js'
import twilioMock from './twilio.mock.js'
import aiMock from './ai.mock.js'

export const USE_MOCKS = process.env.USE_MOCKS === 'true'
export const AI_USE_MOCKS = process.env.AI_USE_MOCKS === 'true' || !process.env.ANTHROPIC_API_KEY

export function isMockMode() {
  return USE_MOCKS
}

export function isAiMockMode() {
  return AI_USE_MOCKS
}

/** Human-readable provenance label used in logs, API responses and the PDF. */
export function mockLabel(adapter) {
  return { adapter, source: USE_MOCKS ? 'mock' : 'live', mock: USE_MOCKS }
}

export const mocks = {
  pagespeed: pagespeedMock,
  gsc: gscMock,
  dataforseo: dataForSeoMock,
  twilio: twilioMock,
  ai: aiMock,
}

export { pagespeedMock, gscMock, dataForSeoMock, twilioMock, aiMock }
export default mocks
