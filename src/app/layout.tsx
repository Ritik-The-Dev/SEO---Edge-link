import type { Metadata } from 'next'
import { Inter, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const sans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

const display = Instrument_Serif({
  subsets: ['latin'],
  display: 'swap',
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-display',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'EdgeLink — SEO Intelligence',
    template: '%s · EdgeLink',
  },
  description:
    'Technical SEO intelligence, automated audits and actionable recommendations in one connected workflow. Crawl, analyse with AI, and deliver branded reports to every client.',
  applicationName: 'EdgeLink',
  keywords: ['SEO audit', 'technical SEO', 'SEO automation', 'agency reporting', 'Core Web Vitals'],
  openGraph: {
    title: 'EdgeLink — SEO Intelligence',
    description:
      'Technical SEO intelligence, automated audits and actionable recommendations in one connected workflow.',
    type: 'website',
    siteName: 'EdgeLink',
  },
  robots: { index: true, follow: true },
}

const themeScript = `(function(){try{var t=localStorage.getItem('edgelink-theme');var m=window.matchMedia('(prefers-color-scheme: light)').matches;document.documentElement.dataset.theme=t||'dark';}catch(e){document.documentElement.dataset.theme='dark';}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${sans.variable} ${display.variable} ${mono.variable} font-sans`}>{children}</body>
    </html>
  )
}
