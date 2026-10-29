import { sendWhatsApp as sendWhatsAppMock } from '@/mocks/twilio.mock'
import { USE_MOCKS } from '@/mocks/index'

export interface WhatsAppDelivery {
  id: string
  status: 'mock_sent' | 'sent' | 'failed'
  channel: 'whatsapp'
  to: string
  score: number
  pdfPath: string
  mock: boolean
  createdAt: string
  error?: string
}

/**
 * WhatsApp notification adapter.
 *
 * Mock mode is the mandated `sendWhatsApp(clientId, pdfPath, score)` fixture:
 * it logs the attempt and returns `mock_sent` — never a real delivery claim.
 * Live mode sends through Twilio's Messages API when credentials are present.
 */
export async function sendWhatsApp(
  clientId: string,
  pdfPath: string,
  score: number,
  toNumber?: string,
): Promise<WhatsAppDelivery> {
  if (USE_MOCKS) {
    return (await sendWhatsAppMock(clientId, pdfPath, score)) as WhatsAppDelivery
  }

  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM
  if (!sid || !token || !from) {
    throw new Error('Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM) are required when USE_MOCKS=false')
  }
  if (!toNumber) {
    throw new Error('A WhatsApp recipient number is required for live delivery')
  }

  const body = new URLSearchParams({
    From: from,
    To: `whatsapp:${toNumber}`,
    Body: `Your EdgeLink SEO audit is ready. Overall score: ${score}/100. Report: ${pdfPath}`,
  })

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
    signal: AbortSignal.timeout(20000),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Twilio responded with ${response.status}: ${detail.slice(0, 180)}`)
  }
  const result = (await response.json()) as { sid?: string; status?: string }

  return {
    id: result.sid ?? 'unknown',
    status: 'sent',
    channel: 'whatsapp',
    to: `whatsapp:${toNumber}`,
    score,
    pdfPath,
    mock: false,
    createdAt: new Date().toISOString(),
  }
}
