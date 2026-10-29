import { existsSync } from 'node:fs'
import puppeteer from 'puppeteer-core'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

export class ReportRenderError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ReportRenderError'
  }
}

const CANDIDATES = [
  // Windows
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  // macOS
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  // Linux
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
]

/** Exported for tests and for surfacing a clear error in Settings → Diagnostics. */
export function resolveChromePath(): string | null {
  const configured = env().PUPPETEER_EXECUTABLE_PATH
  if (configured) return existsSync(configured) ? configured : null
  return CANDIDATES.find((candidate) => existsSync(candidate)) ?? null
}

export interface PdfRenderOptions {
  timeoutMs?: number
}

/**
 * Renders the self-contained report HTML to a PDF buffer with Puppeteer.
 * Fails loudly when no Chrome/Chromium is available — it never substitutes a
 * blank or fabricated PDF.
 */
export async function renderReportPdf(html: string, options: PdfRenderOptions = {}): Promise<Buffer> {
  const executablePath = resolveChromePath()
  if (!executablePath) {
    throw new ReportRenderError(
      'No Chrome/Chromium binary found for Puppeteer. Set PUPPETEER_EXECUTABLE_PATH, or run the worker ' +
        'in an image that installs chromium (see README → Reports).',
    )
  }

  const started = Date.now()
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none', '--disable-gpu'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 1 })
    await page.setContent(html, { waitUntil: 'load', timeout: options.timeoutMs ?? 30000 })
    await page.emulateMediaType('print')
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    })
    logger.info('PDF report rendered', {
      renderer: 'puppeteer',
      executablePath,
      bytes: pdf.byteLength,
      durationMs: Date.now() - started,
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close().catch(() => undefined)
  }
}
