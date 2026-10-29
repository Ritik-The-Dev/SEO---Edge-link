type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogContext = Record<string, unknown>

const levelWeight: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 }

function threshold(): number {
  const configured = (process.env.LOG_LEVEL ?? 'info') as LogLevel
  return levelWeight[configured] ?? levelWeight.info
}

function write(level: LogLevel, message: string, context: LogContext = {}) {
  if (levelWeight[level] < threshold()) return
  const entry = {
    level,
    time: new Date().toISOString(),
    message,
    ...context,
  }
  const line = JSON.stringify(entry)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

/**
 * Structured logger. Every pipeline log carries the audit id / job id so a
 * single run can be traced across web and worker processes.
 */
export const logger = {
  debug: (message: string, context?: LogContext) => write('debug', message, context),
  info: (message: string, context?: LogContext) => write('info', message, context),
  warn: (message: string, context?: LogContext) => write('warn', message, context),
  error: (message: string, context?: LogContext) => write('error', message, context),
  child(bindings: LogContext) {
    return {
      debug: (m: string, c?: LogContext) => write('debug', m, { ...bindings, ...c }),
      info: (m: string, c?: LogContext) => write('info', m, { ...bindings, ...c }),
      warn: (m: string, c?: LogContext) => write('warn', m, { ...bindings, ...c }),
      error: (m: string, c?: LogContext) => write('error', m, { ...bindings, ...c }),
    }
  },
}

/** Reduces an unknown thrown value to a log-safe string (never a full stack in API errors). */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown error'
}
