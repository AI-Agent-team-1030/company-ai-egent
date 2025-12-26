/**
 * トースト通知コンポーネント
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface ToastNotificationProps {
  isVisible: boolean
  message: string
}

export function ToastNotification({ isVisible, message }: ToastNotificationProps) {
  const isError = message.includes('失敗')

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 z-50"
        >
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              isError ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
            }`}
          >
            {isError ? (
              <XCircleIcon className="w-5 h-5" />
            ) : (
              <CheckCircleIcon className="w-5 h-5" />
            )}
            <span className="font-medium">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
