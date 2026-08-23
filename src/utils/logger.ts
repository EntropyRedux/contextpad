/**
 * Structured logger for ContextPad with environment-aware levels
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'NONE'

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
}

class Logger {
  private level: LogLevel = import.meta.env.DEV ? 'DEBUG' : 'WARN'
  private prefix = '[ContextPad]'

  setLevel(level: LogLevel) {
    this.level = level
  }

  getLevel(): LogLevel {
    return this.level
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level]
  }

  debug(...args: unknown[]) {
    if (this.shouldLog('DEBUG')) {
      console.debug(this.prefix, ...args)
    }
  }

  info(...args: unknown[]) {
    if (this.shouldLog('INFO')) {
      console.info(this.prefix, ...args)
    }
  }

  warn(...args: unknown[]) {
    if (this.shouldLog('WARN')) {
      console.warn(this.prefix, ...args)
    }
  }

  error(...args: unknown[]) {
    if (this.shouldLog('ERROR')) {
      console.error(this.prefix, ...args)
    }
  }
}

export const logger = new Logger()
