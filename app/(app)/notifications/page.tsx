'use client'

import { motion } from 'framer-motion'
import { BellIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { mockNotifications } from '@/data/mockData'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

export default function NotificationsPage() {
  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return CheckCircleIcon
      case 'warning':
        return ExclamationTriangleIcon
      case 'info':
        return InformationCircleIcon
      default:
        return BellIcon
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">通知</h1>
        <p className="text-gray-600">最新の更新情報</p>
      </div>

      {/* Notifications List */}
      <div className="max-w-4xl space-y-4">
        {mockNotifications.map((notification, index) => {
          const Icon = getIcon(notification.type)
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: 4 }}
              className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all ${
                notification.read ? 'border-gray-200' : 'border-gray-900'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Icon className="w-6 h-6 text-gray-900" />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{notification.title}</h3>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-black rounded-full" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: ja })}
                  </p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
