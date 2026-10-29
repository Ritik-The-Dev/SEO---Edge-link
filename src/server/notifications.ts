import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'
import { sendWhatsApp } from '@/integrations/whatsapp'
import { sendReportEmail } from '@/integrations/email'
import type { NotificationChannel, NotificationStatus, Prisma } from '@prisma/client'

export interface NotificationInput {
  auditId: string
  client: { id: string; name: string; company: string | null; contactEmail: string | null; phone: string | null }
  siteUrl: string
  score: number
  reportKey: string
  generatedAt: Date
}

async function record(
  auditId: string,
  channel: NotificationChannel,
  status: NotificationStatus,
  recipient: string | null,
  providerId: string | null,
  error: string | null,
  payload: Record<string, unknown>,
) {
  await prisma.notificationAttempt.create({
    data: { auditId, channel, status, recipient, providerId, error, payload: payload as Prisma.InputJsonValue },
  })
}

async function alreadyDelivered(auditId: string, channel: NotificationChannel) {
  const existing = await prisma.notificationAttempt.findFirst({
    where: { auditId, channel, status: { in: ['SENT', 'MOCKED'] } },
    select: { id: true },
  })
  return Boolean(existing)
}

/**
 * Sends the completion notifications. Delivery problems are recorded as failed
 * attempts and never fail the audit itself; successful/mocked attempts are
 * deduplicated so a retried job cannot spam the client twice.
 */
export async function deliverNotifications(input: NotificationInput): Promise<void> {
  const reportUrl = `${env().APP_URL}/api/reports/${input.auditId}/download`

  if (!(await alreadyDelivered(input.auditId, 'WHATSAPP'))) {
    try {
      const delivery = await sendWhatsApp(
        input.client.id,
        input.reportKey,
        input.score,
        input.client.phone ?? undefined,
      )
      await record(
        input.auditId,
        'WHATSAPP',
        delivery.mock ? 'MOCKED' : 'SENT',
        delivery.to,
        delivery.id,
        null,
        {
          score: input.score,
          reportPath: input.reportKey,
          deliveryStatus: delivery.status,
          mock: delivery.mock,
        },
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'WhatsApp delivery failed'
      await record(input.auditId, 'WHATSAPP', 'FAILED', input.client.phone, null, message.slice(0, 400), {
        reportPath: input.reportKey,
        score: input.score,
      })
      logger.warn('WhatsApp notification failed', { auditId: input.auditId, error: message })
    }
  }

  if (!(await alreadyDelivered(input.auditId, 'EMAIL'))) {
    if (!input.client.contactEmail) {
      await record(input.auditId, 'EMAIL', 'FAILED', null, null, 'No contact email on file for this client', {
        reportPath: input.reportKey,
      })
    } else {
      try {
        const delivery = await sendReportEmail({
          to: input.client.contactEmail,
          clientName: input.client.company || input.client.name,
          siteUrl: input.siteUrl,
          score: input.score,
          reportUrl,
        })
        await record(
          input.auditId,
          'EMAIL',
          delivery.status === 'sent' ? 'SENT' : 'MOCKED',
          delivery.to,
          delivery.id,
          null,
          { subject: delivery.subject, mock: delivery.mock },
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Email delivery failed'
        await record(input.auditId, 'EMAIL', 'FAILED', input.client.contactEmail, null, message.slice(0, 400), {
          reportPath: input.reportKey,
        })
        logger.warn('Email notification failed', { auditId: input.auditId, error: message })
      }
    }
  }

  logger.info('Notification attempts recorded', { auditId: input.auditId, reportUrl })
}
