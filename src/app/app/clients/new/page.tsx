import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/app-shell'
import { NewClientForm } from '@/components/dashboard/forms'
import { Panel, PanelBody, PanelHeader } from '@/components/ui/card'

export const metadata = { title: 'New client' }

export default function NewClientPage() {
  return (
    <>
      <div className="mb-4">
        <Link href="/app/clients" className="inline-flex items-center gap-1.5 text-2xs text-faint transition-colors hover:text-ink">
          <ArrowLeft className="h-3 w-3" /> Back to clients
        </Link>
      </div>

      <PageHeader
        eyebrow="Portfolio"
        title="Create a client"
        description="Add the business context the audit needs. The website and location are used in the AI prompt, so keep them accurate."
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel>
          <PanelHeader title="Client details" description="Name and contact information. Portal access is optional." />
          <PanelBody>
            <NewClientForm />
          </PanelBody>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader title="What happens next" />
            <PanelBody>
              <ol className="space-y-3 text-xs text-muted">
                {[
                  'Create the client record and optional portal login.',
                  'Add the website with its business type, city and state.',
                  'Queue an audit — a BullMQ job is submitted and tracked.',
                  'Review the analysis, download the PDF and schedule monthly runs.',
                ].map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="font-mono text-[0.6rem] text-accent">{String(index + 1).padStart(2, '0')}</span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Client scope" />
            <PanelBody>
              <p className="text-xs leading-relaxed text-muted">
                Clients you create portal access for can only read their own websites, audits and reports. That
                boundary is enforced in every API route and server page — not in the navigation.
              </p>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </>
  )
}
