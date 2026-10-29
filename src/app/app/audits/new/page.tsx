import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Info } from 'lucide-react'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { env } from '@/lib/env'
import { PageHeader } from '@/components/dashboard/app-shell'
import { NewAuditForm, type ClientOption } from '@/components/dashboard/forms'
import { Badge } from '@/components/ui/badge'
import { Panel, PanelBody, PanelHeader } from '@/components/ui/card'

export const metadata = { title: 'New audit' }

export default async function NewAuditPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') redirect('/login')

  const clients = await prisma.client.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    include: {
      websites: {
        where: { status: { not: 'ARCHIVED' } },
        orderBy: { createdAt: 'asc' },
        select: { id: true, url: true, label: true, businessType: true, city: true, state: true },
      },
    },
  })

  const options: ClientOption[] = clients.map((client) => ({
    id: client.id,
    name: client.name,
    company: client.company,
    websites: client.websites,
  }))
  const config = env()

  return (
    <>
      <div className="mb-4">
        <Link href="/app/audits" className="inline-flex items-center gap-1.5 text-2xs text-faint transition-colors hover:text-ink">
          <ArrowLeft className="h-3 w-3" /> Back to audits
        </Link>
      </div>

      <PageHeader
        eyebrow="Pipeline"
        title="Run an audit"
        description="Queue a technical audit for a client website. The worker crawls the page, collects signals, validates AI output and generates the report."
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel>
          <PanelHeader
            title="Audit target"
            description="Business context is sent to the analysis prompt; it is not guessed from the page."
            actions={<Badge tone={config.USE_MOCKS ? 'warn' : 'accent'} mono>{config.USE_MOCKS ? 'mock signals' : 'live signals'}</Badge>}
          />
          <PanelBody>
            <NewAuditForm clients={options} mockMode={config.USE_MOCKS} />
          </PanelBody>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Pipeline stages" />
            <PanelBody>
              <ol className="space-y-3">
                {[
                  ['Crawl', 'fetch + Cheerio, SSRF-guarded with redirect validation'],
                  ['Integrations', 'PageSpeed, Search Console, DataForSEO, schema.org'],
                  ['Checks', '26 deterministic on-page, technical, CWV and schema checks'],
                  ['AI analysis', 'Claude with a versioned JSON contract (or deterministic fixture)'],
                  ['Report', 'Puppeteer PDF with page numbering and disclosures'],
                  ['Delivery', 'WhatsApp and email adapters, every attempt recorded'],
                ].map(([title, detail], index) => (
                  <li key={title} className="flex gap-3">
                    <span className="font-mono text-[0.6rem] text-accent">{String(index + 1).padStart(2, '0')}</span>
                    <span>
                      <span className="block text-xs text-ink">{title}</span>
                      <span className="mt-0.5 block text-2xs leading-relaxed text-faint">{detail}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelBody>
              <div className="flex gap-2.5">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-faint" />
                <p className="text-2xs leading-relaxed text-muted">
                  {config.USE_MOCKS
                    ? 'External integrations are mocked in this environment. Mock provenance is stored with each audit and disclosed in the PDF — never presented as live measurement.'
                    : 'External integrations are live. Missing credentials will fail the audit explicitly rather than silently substituting fixture data.'}
                </p>
              </div>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </>
  )
}
