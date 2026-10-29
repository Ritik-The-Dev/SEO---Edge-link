import Link from 'next/link'
import { Wordmark } from '@/components/brand'

const GROUPS = [
  {
    title: 'Platform',
    links: [
      { href: '#platform', label: 'Technical checks' },
      { href: '#workflow', label: 'Audit workflow' },
      { href: '#reports', label: 'Reporting' },
      { href: '#security', label: 'Security model' },
    ],
  },
  {
    title: 'Workspace',
    links: [
      { href: '/login', label: 'Sign in' },
      { href: '/app', label: 'Admin portal' },
      { href: '/client', label: 'Client portal' },
      { href: '/app/audits/new', label: 'Start an audit' },
    ],
  },
  {
    title: 'Operations',
    links: [
      { href: '/api/health', label: 'Service health' },
      { href: '#reports', label: 'Report methodology' },
      { href: '#security', label: 'Data handling' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-[1280px] px-5 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-muted">
              Technical SEO intelligence, automated audits and actionable recommendations in one connected workflow.
            </p>
            <p className="mt-4 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-faint">
              Edgelink Technology · SEO automation
            </p>
          </div>

          {GROUPS.map((group) => (
            <div key={group.title}>
              <h2 className="mono-label">{group.title}</h2>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('#') ? (
                      <a href={link.href} className="text-xs text-muted transition-colors hover:text-ink">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="text-xs text-muted transition-colors hover:text-ink">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-2xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Edgelink Technology. Working product demonstration.</p>
          <p className="max-w-xl leading-relaxed">
            Scores are AI-assisted technical assessments, not Google ranking metrics. No ranking, traffic or revenue
            outcome is promised.
          </p>
        </div>
      </div>
    </footer>
  )
}
