/**
 * Removes terminal (completed/failed) jobs from the audit queue.
 * Useful after test runs so the pipeline panel reflects the current audit table.
 *
 * Usage: npx tsx scripts/clean-queue.ts [failed|completed|all]
 */
import 'dotenv/config'
import { Queue } from 'bullmq'

const target = (process.argv[2] ?? 'all') as 'failed' | 'completed' | 'all'
const queue = new Queue('seo-audit-jobs', {
  connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' },
})

async function main() {
  const before = await queue.getJobCounts('completed', 'failed')

  if (target === 'all' || target === 'failed') {
    const removed = await queue.clean(0, 1000, 'failed')
    console.log(`failed: removed ${removed.length}`)
  }
  if (target === 'all' || target === 'completed') {
    const removed = await queue.clean(0, 1000, 'completed')
    console.log(`completed: removed ${removed.length}`)
  }

  console.log('before', before, 'after', await queue.getJobCounts('completed', 'failed'))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await queue.close()
  })
