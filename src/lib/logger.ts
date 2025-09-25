// Simple client-side compatible logger
interface LogEntry {
  level: string
  message: string
  timestamp: string
  meta?: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isClient = typeof window !== 'undefined'

  private formatMessage(level: string, message: string, meta?: any): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      meta,
    }
  }

  private output(entry: LogEntry) {
    if (this.isClient) {
      // Client-side logging
      const style = this.getConsoleStyle(entry.level)
      if (entry.meta) {
        console.log(`%c[${entry.level.toUpperCase()}] ${entry.message}`, style, entry.meta)
      } else {
        console.log(`%c[${entry.level.toUpperCase()}] ${entry.message}`, style)
      }
    } else {
      // Server-side logging (simple console)
      if (entry.meta) {
        console.log(`[${entry.level.toUpperCase()}] ${entry.message}`, entry.meta)
      } else {
        console.log(`[${entry.level.toUpperCase()}] ${entry.message}`)
      }
    }
  }

  private getConsoleStyle(level: string): string {
    const styles = {
      error: 'color: #ef4444; font-weight: bold',
      warn: 'color: #f59e0b; font-weight: bold',
      info: 'color: #10b981; font-weight: bold',
      debug: 'color: #6b7280',
    }
    return styles[level as keyof typeof styles] || styles.info
  }

  error(message: string, meta?: any) {
    const entry = this.formatMessage('error', message, meta)
    this.output(entry)
  }

  warn(message: string, meta?: any) {
    const entry = this.formatMessage('warn', message, meta)
    this.output(entry)
  }

  info(message: string, meta?: any) {
    if (this.isDevelopment || process.env.NODE_ENV === 'production') {
      const entry = this.formatMessage('info', message, meta)
      this.output(entry)
    }
  }

  debug(message: string, meta?: any) {
    if (this.isDevelopment) {
      const entry = this.formatMessage('debug', message, meta)
      this.output(entry)
    }
  }
}

const logger = new Logger()
export default logger

// Utility functions for structured logging
export const logError = (message: string, error?: Error, meta?: any) => {
  logger.error(message, { error: error?.message, stack: error?.stack, ...meta })
}

export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta)
}

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta)
}

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta)
}
