/**
 * One-off maintenance for the seeded clinic website, used after the demo target
 * moved from the brief's fictional domain to a resolvable one.
 * Deletes the failed test audits for the old URL, then updates the website.
 *
 * Run: npx tsx scripts/refresh-seed-site.ts
 */
import 'dotenv/config'
import { prisma } from '../src/lib/db'

const OLD_URL = 'https://example-dental-clinic.com/'
const NEW_URL = 'https://www.ada.org/'

async function main() {
  const website = await prisma.website.findFirst({ where: { url: OLD_URL } })
  if (!website) {
    console.log('No seeder website on the old URL; nothing to do.')
    return
  }

  const removed = await prisma.audit.deleteMany({ where: { websiteId: website.id } })
  await prisma.website.update({
    where: { id: website.id },
    data: { url: NEW_URL, label: 'Primary practice site', city: 'Chicago', state: 'Illinois' },
  })
  console.log(`Moved ${website.id} to ${NEW_URL}; removed ${removed.count} test audit(s).`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
