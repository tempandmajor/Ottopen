// Editor Error Logging Service
import { toast } from 'react-hot-toast'

type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: string
  context?: Record<string, any>
  error?: Error
}

class EditorLogger {
  private logs: LogEntry[] = []
  private maxLogs = 100

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      error,
    }

    this.logs.push(entry)

    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // In development, still log to console
    if (process.env.NODE_ENV === 'development') {
      const logFn =
        level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
      logFn(`[${level.toUpperCase()}] ${message}`, context, error)
    }

    // In production, send to monitoring service (Sentry, etc.)
    if (process.env.NODE_ENV === 'production' && level === 'error') {
      // TODO: Send to Sentry or other monitoring service
      // Sentry.captureException(error || new Error(message), { contexts: { custom: context } })
    }
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context)
    toast.error(message) // Show warning to user
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log('error', message, context, error)
    // Don't show technical errors to users, show friendly message
  }

  userError(message: string) {
    toast.error(message)
  }

  getLogs() {
    return this.logs
  }

  clearLogs() {
    this.logs = []
  }
}

export const logger = new EditorLogger()
