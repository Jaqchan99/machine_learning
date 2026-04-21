import React, { useEffect } from 'react'
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react'

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

const colorMap = {
  success: 'bg-green-600/90 text-white',
  error: 'bg-red-600/90 text-white',
  info: 'bg-blue-600/90 text-white',
  warning: 'bg-yellow-600/90 text-white',
}

export default function Toast({ message, type = 'info', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  const Icon = iconMap[type] || Info

  return (
    <div className="fixed top-12 left-4 right-4 z-50 flex justify-center animate-slide-down pointer-events-none">
      <div
        className={`${colorMap[type]} px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 max-w-sm pointer-events-auto`}
      >
        <Icon size={18} className="shrink-0" />
        <span className="text-sm font-medium leading-snug">{message}</span>
      </div>
    </div>
  )
}
