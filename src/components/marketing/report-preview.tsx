import { ScoreBreakdown, ScoreRing } from '@/components/ui/score'
import { Badge } from '@/components/ui/badge'

const BREAKDOWN = {
  technical: 68,
  on_page: 82,
  content: 75,
  core_web_vitals: 60,
  schema: 80,
}

/**
 * Visual preview of the generated PDF. Sample values are clearly labelled and
 * are the assessment fixtures, not a real client result.
 */
export function ReportPreview() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="mono-label">Sample report · 6 pages</span>
        <Badge tone="outline" mono>
          sample data
        </Badge>
      </div>

      <div className="group relative">
        <div className="relative">
          <div className="absolute -bottom-2 -right-2 hidden h-full w-[97%] rotate-[1.6deg] rounded-md border border-line/60 bg-[#e7e0d2] transition-transform duration-700 group-hover:rotate-[3deg] sm:block" aria-hidden />
          <div className="relative overflow-hidden rounded-md border border-line bg-[#06110e] text-[#f2efe6] shadow-lift transition-transform duration-700 group-hover:-translate-y-1">
        <div className="relative px-6 py-7">
          <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(hsl(160_40%_40%/0.14)_1px,transparent_1px),linear-gradient(90deg,hsl(160_40%_40%/0.14)_1px,transparent_1px)] [background-size:22px_22px]" />
          <div className="absolute -right-24 top-10 h-64 w-64 rounded-full border border-accent/25" />
          <div className="absolute -right-10 top-24 h-40 w-40 rounded-full border border-[#f2efe6]/10" />

          <div className="relative flex items-center justify-between">
            <span className="text-[0.68rem] font-semibold tracking-[0.22em]">EDGE<span className="text-accent">LINK</span></span>
            <span className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[#9fb2a9]">Technical audit</span>
          </div>

          <div className="relative mt-9">
            <span className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-[#9fb2a9]">Website health report</span>
            <h3 className="mt-2 font-display text-3xl leading-[1.02]">
              example-dental-clinic.com
              <br />
              <em className="text-accent">technical SEO audit</em>
            </h3>

            <div className="mt-6 flex items-center gap-5">
              <ScoreRing score={61} size={96} stroke={5} className="text-[#f2efe6]" />
              <div>
                <div className="font-display text-3xl leading-none">61<span className="text-sm text-[#9fb2a9]"> / 100</span></div>
                <div className="mt-1.5 font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[#9fb2a9]">
                  AI-assisted audit score
                </div>
              </div>
            </div>
          </div>

          <dl className="relative mt-8 grid grid-cols-3 gap-4 border-t border-white/15 pt-4 text-[0.6rem]">
            <div>
              <dt className="uppercase tracking-[0.16em] text-[#8ea198]">Prepared for</dt>
              <dd className="mt-1">Northstar Dental</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.16em] text-[#8ea198]">Business</dt>
              <dd className="mt-1">Dental clinic · Pune</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.16em] text-[#8ea198]">Analysis</dt>
              <dd className="mt-1">Claude sonnet</dd>
            </div>
          </dl>
        </div>
        </div>
      </div>

      <div className="relative mt-4 rounded-md border border-line bg-[#f7f4ee] p-5 text-[#12181a] shadow-lift transition-transform duration-700 group-hover:translate-y-1">
        <div className="flex items-center justify-between border-b border-[#d8d2c4] pb-2">
          <span className="text-[0.6rem] font-semibold tracking-[0.2em]">EDGE<span className="text-[#0f7a5f]">LINK</span></span>
          <span className="font-mono text-[0.52rem] uppercase tracking-[0.16em] text-[#6f7a72]">
            01 · Executive summary
          </span>
        </div>
        <p className="mt-4 font-display text-lg leading-tight">What the audit found</p>
        <p className="mt-2 text-[0.68rem] leading-relaxed text-[#3d4a44]">
          The site scores 61/100, with 4 failed and 6 warning checks across technical, on-page and Core Web
          Vitals signals. The highest-leverage fix is compressing and preloading the hero image.
        </p>
        <div className="mt-4 grid gap-3 text-[0.65rem] sm:grid-cols-2">
          <div className="rounded-[2px] border border-[#d8d2c4] p-3">
            <span className="block font-mono text-[0.5rem] uppercase tracking-[0.16em] text-[#6f7a72]">Score breakdown</span>
            <ScoreBreakdown
              breakdown={BREAKDOWN}
              className="mt-2.5 [&_span]:text-[0.58rem] [&_.h-1\.5]:h-1 [&_.grid]:grid-cols-[4.5rem_1fr_1.2rem]"
            />
          </div>
          <div className="rounded-[2px] border border-[#d8d2c4] p-3">
            <span className="block font-mono text-[0.5rem] uppercase tracking-[0.16em] text-[#6f7a72]">
              Recommendation
            </span>
            <p className="mt-2 text-[0.62rem] font-semibold leading-snug">Reduce mobile LCP below 2.5s</p>
            <p className="mt-1.5 text-[0.58rem] leading-relaxed text-[#3d4a44]">
              Compress and preload the hero image, then serve it in a modern format from the same origin.
            </p>
            <p className="mt-2 border-t border-dashed border-[#d8d2c4] pt-1.5 text-[0.55rem] text-[#0f5c49]">
              Verify: re-run PageSpeed; LCP &lt; 2.5s on mobile.
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
