import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * Development seed. Credentials are configurable and documented as local-only;
 * change them (or delete these users) before any real deployment.
 */
async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@edgelink.test'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'EdgelinkAdmin!2026'
  const clientEmail = process.env.SEED_CLIENT_EMAIL ?? 'client@northstar.test'
  const clientPassword = process.env.SEED_CLIENT_PASSWORD ?? 'EdgelinkClient!2026'

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: await bcrypt.hash(adminPassword, 10), role: 'ADMIN', isActive: true },
    create: {
      email: adminEmail,
      name: 'Aarav Mehta',
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: 'ADMIN',
    },
  })

  const client = await prisma.client.upsert({
    where: { id: 'seed-client-northstar' },
    update: {},
    create: {
      id: 'seed-client-northstar',
      name: 'Northstar Dental Group',
      company: 'Northstar Dental',
      contactEmail: clientEmail,
      phone: '+919876543210',
      notes: 'Multi-location dental group in Chicago. Monthly technical audits.',
    },
  })

  await prisma.user.upsert({
    where: { email: clientEmail },
    update: { passwordHash: await bcrypt.hash(clientPassword, 10), clientId: client.id, role: 'CLIENT' },
    create: {
      email: clientEmail,
      name: 'Priya Sharma',
      passwordHash: await bcrypt.hash(clientPassword, 10),
      role: 'CLIENT',
      clientId: client.id,
    },
  })

  const secondClient = await prisma.client.upsert({
    where: { id: 'seed-client-meridian' },
    update: {},
    create: {
      id: 'seed-client-meridian',
      name: 'Meridian Estates',
      company: 'Meridian Estates',
      contactEmail: 'marketing@meridian.test',
      phone: '+919812345678',
      notes: 'Residential real estate developer, Mumbai.',
    },
  })

  const website = await prisma.website.upsert({
    where: { clientId_url: { clientId: client.id, url: 'https://www.ada.org/' } },
    update: {},
    create: {
      clientId: client.id,
      url: 'https://www.ada.org/',
      label: 'Primary practice site',
      businessType: 'Dental clinic',
      city: 'Chicago',
      state: 'Illinois',
      country: 'United States',
    },
  })

  await prisma.website.upsert({
    where: { clientId_url: { clientId: secondClient.id, url: 'https://example.com/' } },
    update: {},
    create: {
      clientId: secondClient.id,
      url: 'https://example.com/',
      label: 'Corporate site',
      businessType: 'Real estate developer',
      city: 'Mumbai',
      state: 'Maharashtra',
    },
  })

  await prisma.auditSchedule.upsert({
    where: { websiteId: website.id },
    update: {},
    create: {
      websiteId: website.id,
      dayOfMonth: 1,
      hourUtc: 3,
      isEnabled: true,
      nextRunAt: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1, 3, 0, 0)),
      createdById: admin.id,
    },
  })

  console.log(
    JSON.stringify(
      {
        level: 'info',
        message: 'Seed complete',
        admin: admin.email,
        clientUser: clientEmail,
        clients: [client.name, secondClient.name],
        websites: [website.url, 'https://example.com/'],
      },
      null,
      2,
    ),
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
