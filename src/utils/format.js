export function formatMoney(value, decimals = 2) {
  if (value == null || isNaN(value)) return '--'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatNumber(value, decimals = 2) {
  if (value == null || isNaN(value)) return '--'
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatPercent(value) {
  if (value == null || isNaN(value)) return '--'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatVolume(value) {
  if (value == null) return '--'
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
  return value.toString()
}

export function formatMarketCap(value) {
  if (value == null) return '--'
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  return formatMoney(value)
}

export function formatTime(isoString) {
  const d = new Date(isoString)
  const now = new Date()
  const diffMs = now - d
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`

  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

export function profitColor(value) {
  if (value > 0) return 'text-profit'
  if (value < 0) return 'text-loss'
  return 'text-text-secondary'
}

export function profitBg(value) {
  if (value > 0) return 'bg-red-500/10'
  if (value < 0) return 'bg-green-500/10'
  return 'bg-slate-500/10'
}
