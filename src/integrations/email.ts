import nodemailer from 'nodemailer'
import { env } from '@/lib/env'
import { USE_MOCKS } from '@/mocks/index'
import { logger } from '@/lib/logger'

export interface EmailDelivery {
  id: string
  status: 'sent' | 'mocked'
  channel: 'email'
  to: string
  subject: string
  mock: boolean
  createdAt: string
  messageId?: string
}

export interface ReportEmailInput {
  to: string
  clientName: string
  siteUrl: string
  score: number
  reportUrl: string
}

/**
 * Email notification adapter.
 *
 * Mock mode records the intended delivery only: nothing is transmitted and the
 * attempt is persisted as MOCKED. SMTP mode performs real delivery through
 * nodemailer when EMAIL_TRANSPORT=smtp and USE_MOCKS=false.
 */
export async function sendReportEmail(input: ReportEmailInput): Promise<EmailDelivery> {
  const config = env()
  const subject = `SEO audit ready — ${input.siteUrl} scored ${input.score}/100`
  const text = [
    `Hello ${input.clientName},`,
    '',
    `Your latest EdgeLink SEO audit for ${input.siteUrl} is ready.`,
    `Overall score: ${input.score}/100.`,
    `Download the report: ${input.reportUrl}`,
    '',
    'This report is an AI-assisted technical assessment, not a guarantee of search rankings.',
    '',
    '— EdgeLink Intelligence',
  ].join('\n')

  const transport = USE_MOCKS ? 'mock' : config.EMAIL_TRANSPORT

  if (transport !== 'smtp') {
    const delivery: EmailDelivery = {
      id: `mock_email_${Date.now().toString(36)}`,
      status: 'mocked',
      channel: 'email',
      to: input.to,
      subject,
      mock: true,
      createdAt: new Date().toISOString(),
    }
    logger.info('Email notification recorded (mock mode, nothing sent)', {
      adapter: 'email.mock',
      to: input.to,
      subject,
      reportUrl: input.reportUrl,
      deliveryId: delivery.id,
    })
    return delivery
  }

  if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS) {
    throw new Error('SMTP_HOST, SMTP_USER and SMTP_PASS are required when EMAIL_TRANSPORT=smtp')
  }

  const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
  })

  const result = await transporter.sendMail({
    from: config.EMAIL_FROM,
    to: input.to,
    subject,
    text,
  })

  return {
    id: result.messageId ?? `smtp_${Date.now().toString(36)}`,
    status: 'sent',
    channel: 'email',
    to: input.to,
    subject,
    mock: false,
    createdAt: new Date().toISOString(),
    messageId: result.messageId,
  }
}
