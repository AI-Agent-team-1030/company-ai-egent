/**
 * ロガーユーティリティ
 *
 * 環境に応じたログ出力を提供
 * - 開発環境: 全てのログを出力
 * - 本番環境: warn, error のみ出力
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LoggerOptions {
  prefix?: string
  enabledInProduction?: boolean
}

const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * フォーマットされたタイムスタンプを取得
 */
function getTimestamp(): string {
  return new Date().toISOString()
}

/**
 * ログレベルに応じた色を取得（コンソール用）
 */
function getLogStyle(level: LogLevel): string {
  switch (level) {
    case 'debug':
      return 'color: #888'
    case 'info':
      return 'color: #0066cc'
    case 'warn':
      return 'color: #ff9900'
    case 'error':
      return 'color: #cc0000'
    default:
      return ''
  }
}

/**
 * ロガークラス
 */
class Logger {
  private prefix: string
  private enabledInProduction: boolean

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix || ''
    this.enabledInProduction = options.enabledInProduction || false
  }

  private formatMessage(level: LogLevel, message: string): string {
    const prefix = this.prefix ? `[${this.prefix}]` : ''
    return `${prefix}[${level.toUpperCase()}] ${message}`
  }

  private shouldLog(level: LogLevel): boolean {
    if (isDevelopment) return true
    if (this.enabledInProduction) return true
    return level === 'warn' || level === 'error'
  }

  /**
   * デバッグログ（開発環境のみ）
   */
  debug(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('debug')) return
    console.log(this.formatMessage('debug', message), ...args)
  }

  /**
   * 情報ログ
   */
  info(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('info')) return
    console.log(this.formatMessage('info', message), ...args)
  }

  /**
   * 警告ログ
   */
  warn(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('warn')) return
    console.warn(this.formatMessage('warn', message), ...args)
  }

  /**
   * エラーログ
   */
  error(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('error')) return
    console.error(this.formatMessage('error', message), ...args)
  }

  /**
   * グループ化されたログを開始
   */
  group(label: string): void {
    if (!isDevelopment) return
    console.group(this.prefix ? `[${this.prefix}] ${label}` : label)
  }

  /**
   * グループ化されたログを終了
   */
  groupEnd(): void {
    if (!isDevelopment) return
    console.groupEnd()
  }

  /**
   * テーブル形式でログ出力
   */
  table(data: unknown): void {
    if (!isDevelopment) return
    console.table(data)
  }

  /**
   * 時間計測開始
   */
  time(label: string): void {
    if (!isDevelopment) return
    console.time(this.prefix ? `[${this.prefix}] ${label}` : label)
  }

  /**
   * 時間計測終了
   */
  timeEnd(label: string): void {
    if (!isDevelopment) return
    console.timeEnd(this.prefix ? `[${this.prefix}] ${label}` : label)
  }
}

/**
 * プレフィックス付きロガーを作成
 */
export function createLogger(prefix: string, options?: Omit<LoggerOptions, 'prefix'>): Logger {
  return new Logger({ prefix, ...options })
}

/**
 * デフォルトロガー
 */
export const logger = new Logger()

/**
 * 各モジュール用のロガーをエクスポート
 */
export const chatLogger = createLogger('Chat')
export const knowledgeLogger = createLogger('Knowledge')
export const sidebarLogger = createLogger('Sidebar')
export const authLogger = createLogger('Auth')
export const apiLogger = createLogger('API')
export const driveLogger = createLogger('Drive')
export const geminiLogger = createLogger('Gemini')
export const firestoreLogger = createLogger('Firestore')
export const aiLogger = createLogger('AI')
export const settingsLogger = createLogger('Settings')
