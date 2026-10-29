import { z } from 'zod'

/**
 * Single source of truth for runtime configuration.
 * Parsed lazily so that `next build` can import modules without a live database.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.string().url().default('http://localhost:3000'),

  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  CRON_SECRET: z.string().min(16, 'CRON_SECRET must be at least 16 characters'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  USE_MOCKS: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
  AI_USE_MOCKS: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
  ANTHROPIC_API_KEY: z.string().optional().default(''),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-6'),
  PAGESPEED_API_KEY: z.string().optional().default(''),

  REPORT_STORAGE: z.enum(['local']).default('local'),
  REPORT_DIR: z.string().default('.data/reports'),
  PUPPETEER_EXECUTABLE_PATH: z.string().optional().default(''),
  PUPPETEER_HEADLESS: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),

  EMAIL_TRANSPORT: z.enum(['mock', 'smtp']).default('mock'),
  EMAIL_FROM: z.string().default('EdgeLink Reports <reports@edgelink.example>'),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),

  TWILIO_ACCOUNT_SID: z.string().optional().default(''),
  TWILIO_AUTH_TOKEN: z.string().optional().default(''),
  TWILIO_WHATSAPP_FROM: z.string().optional().default(''),

  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(10).default(2),
  AUDIT_TIMEOUT_MS: z.coerce.number().int().min(5000).default(45000),
})

export type AppEnv = z.infer<typeof envSchema>

let cached: AppEnv | null = null

export function env(): AppEnv {
  if (cached) return cached
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    throw new Error(`Invalid environment configuration — ${detail}`)
  }
  cached = parsed.data
  return cached
}

/** Test seam: clears the memoised environment (used by unit tests). */
export function resetEnvCache() {
  cached = null
}
