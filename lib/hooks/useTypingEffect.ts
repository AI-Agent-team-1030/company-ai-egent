/**
 * タイピングエフェクトフック
 *
 * テキストを1文字ずつ表示するアニメーション効果を提供
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { TYPING } from '../constants'

export interface UseTypingEffectOptions {
  /** 1フレームあたりの文字数 */
  charsPerFrame?: number
  /** タイピング速度（ミリ秒） */
  speed?: number
  /** 完了時のコールバック */
  onComplete?: () => void
  /** 更新時のコールバック */
  onUpdate?: (displayText: string, isComplete: boolean) => void
  /** 自動開始するかどうか */
  autoStart?: boolean
}

export interface UseTypingEffectReturn {
  /** 現在表示されているテキスト */
  displayText: string
  /** タイピング中かどうか */
  isTyping: boolean
  /** タイピングが完了したかどうか */
  isComplete: boolean
  /** タイピングを開始 */
  start: (text: string) => void
  /** タイピングを停止（現在位置で中断） */
  stop: () => void
  /** タイピングをリセット */
  reset: () => void
  /** 即座に全文表示 */
  complete: () => void
}

/**
 * タイピングエフェクトを提供するカスタムフック
 *
 * @example
 * ```tsx
 * const { displayText, isTyping, start, stop } = useTypingEffect({
 *   onComplete: () => console.log('Typing complete!'),
 * })
 *
 * // タイピング開始
 * start('Hello, World!')
 *
 * // 停止ボタン
 * <button onClick={stop}>Stop</button>
 * ```
 */
export function useTypingEffect(
  options: UseTypingEffectOptions = {}
): UseTypingEffectReturn {
  const {
    charsPerFrame = TYPING.CHARS_PER_FRAME,
    speed = TYPING.SPEED_MS,
    onComplete,
    onUpdate,
    autoStart = false,
  } = options

  const [displayText, setDisplayText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  // Refs for managing state across renders
  const fullTextRef = useRef('')
  const currentIndexRef = useRef(0)
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])
  const shouldStopRef = useRef(false)

  // タイムアウトをクリア
  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
    timeoutsRef.current = []
  }, [])

  // クリーンアップ
  useEffect(() => {
    return () => {
      clearTimeouts()
    }
  }, [clearTimeouts])

  // タイピングを開始
  const start = useCallback(
    (text: string) => {
      // 既存のタイピングをクリア
      clearTimeouts()
      shouldStopRef.current = false

      // 状態を初期化
      fullTextRef.current = text
      currentIndexRef.current = 0
      setDisplayText('')
      setIsTyping(true)
      setIsComplete(false)

      const typeNextCharacter = () => {
        if (shouldStopRef.current) {
          const currentText = fullTextRef.current.substring(
            0,
            currentIndexRef.current
          )
          setDisplayText(currentText)
          setIsTyping(false)
          onUpdate?.(currentText, false)
          return
        }

        if (currentIndexRef.current < fullTextRef.current.length) {
          currentIndexRef.current = Math.min(
            currentIndexRef.current + charsPerFrame,
            fullTextRef.current.length
          )
          const currentText = fullTextRef.current.substring(
            0,
            currentIndexRef.current
          )
          setDisplayText(currentText)
          onUpdate?.(currentText, false)

          const timeoutId = setTimeout(typeNextCharacter, speed)
          timeoutsRef.current.push(timeoutId)
        } else {
          // 完了
          setIsTyping(false)
          setIsComplete(true)
          onComplete?.()
          onUpdate?.(fullTextRef.current, true)
        }
      }

      // 最初の文字をすぐに表示
      typeNextCharacter()
    },
    [charsPerFrame, speed, onComplete, onUpdate, clearTimeouts]
  )

  // タイピングを停止
  const stop = useCallback(() => {
    shouldStopRef.current = true
    clearTimeouts()
    setIsTyping(false)
  }, [clearTimeouts])

  // リセット
  const reset = useCallback(() => {
    clearTimeouts()
    shouldStopRef.current = false
    fullTextRef.current = ''
    currentIndexRef.current = 0
    setDisplayText('')
    setIsTyping(false)
    setIsComplete(false)
  }, [clearTimeouts])

  // 即座に全文表示
  const complete = useCallback(() => {
    clearTimeouts()
    shouldStopRef.current = false
    setDisplayText(fullTextRef.current)
    setIsTyping(false)
    setIsComplete(true)
    onComplete?.()
    onUpdate?.(fullTextRef.current, true)
  }, [clearTimeouts, onComplete, onUpdate])

  return {
    displayText,
    isTyping,
    isComplete,
    start,
    stop,
    reset,
    complete,
  }
}

/**
 * 複数のメッセージに対するタイピングエフェクト管理
 *
 * @example
 * ```tsx
 * const { startTyping, stopTyping, getDisplayText, isTyping } = useMultiTypingEffect()
 *
 * // メッセージIDごとにタイピング管理
 * startTyping('msg-1', 'Hello!')
 * const text = getDisplayText('msg-1')
 * ```
 */
export function useMultiTypingEffect(options: UseTypingEffectOptions = {}) {
  const [typingStates, setTypingStates] = useState<
    Map<string, { displayText: string; isTyping: boolean; isComplete: boolean }>
  >(new Map())

  const timeoutsMapRef = useRef<Map<string, NodeJS.Timeout[]>>(new Map())
  const fullTextsRef = useRef<Map<string, string>>(new Map())
  const currentIndicesRef = useRef<Map<string, number>>(new Map())

  const { charsPerFrame = TYPING.CHARS_PER_FRAME, speed = TYPING.SPEED_MS } =
    options

  // クリーンアップ
  useEffect(() => {
    return () => {
      timeoutsMapRef.current.forEach((timeouts) => {
        timeouts.forEach((t) => clearTimeout(t))
      })
    }
  }, [])

  const startTyping = useCallback(
    (
      id: string,
      text: string,
      onComplete?: () => void,
      onUpdate?: (displayText: string) => void
    ) => {
      // 既存のタイムアウトをクリア
      const existingTimeouts = timeoutsMapRef.current.get(id) || []
      existingTimeouts.forEach((t) => clearTimeout(t))
      timeoutsMapRef.current.set(id, [])

      // 初期化
      fullTextsRef.current.set(id, text)
      currentIndicesRef.current.set(id, 0)
      setTypingStates((prev) => {
        const next = new Map(prev)
        next.set(id, { displayText: '', isTyping: true, isComplete: false })
        return next
      })

      const typeNext = () => {
        const fullText = fullTextsRef.current.get(id) || ''
        const currentIndex = currentIndicesRef.current.get(id) || 0

        if (currentIndex < fullText.length) {
          const newIndex = Math.min(currentIndex + charsPerFrame, fullText.length)
          currentIndicesRef.current.set(id, newIndex)
          const currentText = fullText.substring(0, newIndex)

          setTypingStates((prev) => {
            const next = new Map(prev)
            next.set(id, { displayText: currentText, isTyping: true, isComplete: false })
            return next
          })
          onUpdate?.(currentText)

          const timeoutId = setTimeout(typeNext, speed)
          const timeouts = timeoutsMapRef.current.get(id) || []
          timeouts.push(timeoutId)
          timeoutsMapRef.current.set(id, timeouts)
        } else {
          setTypingStates((prev) => {
            const next = new Map(prev)
            next.set(id, { displayText: fullText, isTyping: false, isComplete: true })
            return next
          })
          onComplete?.()
        }
      }

      typeNext()
    },
    [charsPerFrame, speed]
  )

  const stopTyping = useCallback((id: string) => {
    const timeouts = timeoutsMapRef.current.get(id) || []
    timeouts.forEach((t) => clearTimeout(t))
    timeoutsMapRef.current.set(id, [])

    setTypingStates((prev) => {
      const next = new Map(prev)
      const current = next.get(id)
      if (current) {
        next.set(id, { ...current, isTyping: false })
      }
      return next
    })
  }, [])

  const completeTyping = useCallback((id: string) => {
    const timeouts = timeoutsMapRef.current.get(id) || []
    timeouts.forEach((t) => clearTimeout(t))
    timeoutsMapRef.current.set(id, [])

    const fullText = fullTextsRef.current.get(id) || ''
    setTypingStates((prev) => {
      const next = new Map(prev)
      next.set(id, { displayText: fullText, isTyping: false, isComplete: true })
      return next
    })
  }, [])

  const getDisplayText = useCallback(
    (id: string): string => {
      return typingStates.get(id)?.displayText || ''
    },
    [typingStates]
  )

  const isTyping = useCallback(
    (id: string): boolean => {
      return typingStates.get(id)?.isTyping || false
    },
    [typingStates]
  )

  const isComplete = useCallback(
    (id: string): boolean => {
      return typingStates.get(id)?.isComplete || false
    },
    [typingStates]
  )

  return {
    startTyping,
    stopTyping,
    completeTyping,
    getDisplayText,
    isTyping,
    isComplete,
  }
}

export default useTypingEffect
