import 'dotenv/config'
import { prisma } from '../src/lib/db'

const rows = await prisma.notificationAttempt.findMany({
  orderBy: { createdAt: 'desc' },
  take: 8,
  select: { channel: true, status: true, recipient: true, providerId: true, error: true, auditId: true },
})
console.table(rows)
await prisma.$disconnect()
