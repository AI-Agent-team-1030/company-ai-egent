import crypto from 'crypto'

// 暗号化キー（環境変数から取得、なければデフォルト値）
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key!!'
const ALGORITHM = 'aes-256-cbc'

// キーを32バイトに調整
function getEncryptionKey(): Buffer {
  const key = ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)
  return Buffer.from(key, 'utf-8')
}

/**
 * データを暗号化
 */
export function encrypt(text: string): string {
  if (!text) return text

  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  // ivと暗号化データを結合して返す
  return iv.toString('hex') + ':' + encrypted
}

/**
 * データを復号化
 */
export function decrypt(text: string): string {
  if (!text || !text.includes(':')) return text

  try {
    const parts = text.split(':')
    const iv = Buffer.from(parts[0], 'hex')
    const encryptedText = parts[1]

    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv)

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    return text // 復号化失敗時は元の値を返す
  }
}

/**
 * センシティブなキーかどうかを判定
 */
export function isSensitiveKey(key: string): boolean {
  const sensitiveKeys = [
    'anthropic_api_key',
    'openai_api_key',
    'api_key',
    'secret',
    'password',
    'token',
  ]

  return sensitiveKeys.some(sensitive =>
    key.toLowerCase().includes(sensitive)
  )
}
