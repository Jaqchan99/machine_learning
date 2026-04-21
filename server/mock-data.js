function randomFluctuation(base, pct = 0.03) {
  const change = base * (Math.random() * pct * 2 - pct)
  return Math.round((base + change) * 100) / 100
}

const BASE_PRICES = {
  AAPL: 228.50, GOOGL: 185.30, MSFT: 415.20, AMZN: 228.70, TSLA: 355.80,
  NVDA: 138.50, META: 612.80, BABA: 130.20, JD: 42.10, PDD: 110.50,
  NIO: 4.80, LI: 27.30, XPEV: 18.60, AMD: 119.80, INTC: 24.30,
  NFLX: 1015.40, DIS: 110.20, BA: 180.50, JPM: 258.70, V: 332.10,
}

const STOCK_META = {
  AAPL: { name: '苹果', sector: '科技', marketCap: 3.5e12, pe: 33.5, eps: 6.82 },
  GOOGL: { name: '谷歌', sector: '科技', marketCap: 2.3e12, pe: 24.1, eps: 7.69 },
  MSFT: { name: '微软', sector: '科技', marketCap: 3.1e12, pe: 35.2, eps: 11.80 },
  AMZN: { name: '亚马逊', sector: '消费', marketCap: 2.4e12, pe: 42.3, eps: 5.41 },
  TSLA: { name: '特斯拉', sector: '汽车', marketCap: 1.1e12, pe: 173.5, eps: 2.05 },
  NVDA: { name: '英伟达', sector: '半导体', marketCap: 3.4e12, pe: 55.8, eps: 2.48 },
  META: { name: 'Meta', sector: '科技', marketCap: 1.6e12, pe: 27.4, eps: 22.37 },
  BABA: { name: '阿里巴巴', sector: '电商', marketCap: 320e9, pe: 20.1, eps: 6.48 },
  JD: { name: '京东', sector: '电商', marketCap: 60e9, pe: 13.8, eps: 3.05 },
  PDD: { name: '拼多多', sector: '电商', marketCap: 150e9, pe: 11.2, eps: 9.87 },
  NIO: { name: '蔚来', sector: '汽车', marketCap: 10e9, pe: null, eps: -1.42 },
  LI: { name: '理想汽车', sector: '汽车', marketCap: 28e9, pe: 25.3, eps: 1.08 },
  XPEV: { name: '小鹏汽车', sector: '汽车', marketCap: 17e9, pe: null, eps: -0.95 },
  AMD: { name: 'AMD', sector: '半导体', marketCap: 194e9, pe: 103.2, eps: 1.16 },
  INTC: { name: '英特尔', sector: '半导体', marketCap: 105e9, pe: null, eps: -0.21 },
  NFLX: { name: '奈飞', sector: '娱乐', marketCap: 430e9, pe: 50.1, eps: 20.27 },
  DIS: { name: '迪士尼', sector: '娱乐', marketCap: 200e9, pe: 38.5, eps: 2.86 },
  BA: { name: '波音', sector: '工业', marketCap: 112e9, pe: null, eps: -7.94 },
  JPM: { name: '摩根大通', sector: '金融', marketCap: 750e9, pe: 13.2, eps: 19.60 },
  V: { name: 'Visa', sector: '金融', marketCap: 630e9, pe: 32.5, eps: 10.22 },
}

const priceCache = {}

export function getMockQuote(symbol) {
  const sym = symbol.toUpperCase()
  const base = BASE_PRICES[sym]
  if (!base) return null

  if (!priceCache[sym] || Date.now() - priceCache[sym].time > 10000) {
    const price = randomFluctuation(base)
    const prevClose = randomFluctuation(base, 0.01)
    priceCache[sym] = {
      price,
      prevClose,
      change: Math.round((price - prevClose) * 100) / 100,
      changePercent: Math.round(((price - prevClose) / prevClose) * 10000) / 100,
      open: randomFluctuation(base, 0.015),
      high: Math.round((price * (1 + Math.random() * 0.02)) * 100) / 100,
      low: Math.round((price * (1 - Math.random() * 0.02)) * 100) / 100,
      volume: Math.floor(20e6 + Math.random() * 80e6),
      time: Date.now(),
    }
  }

  const meta = STOCK_META[sym] || {}
  const c = priceCache[sym]
  return {
    symbol: sym,
    name: meta.name || sym,
    sector: meta.sector || '',
    price: c.price,
    change: c.change,
    changePercent: c.changePercent,
    open: c.open,
    high: c.high,
    low: c.low,
    prevClose: c.prevClose,
    volume: c.volume,
    marketCap: meta.marketCap,
    pe: meta.pe,
    eps: meta.eps,
    fiftyTwoWeekHigh: Math.round(base * 1.35 * 100) / 100,
    fiftyTwoWeekLow: Math.round(base * 0.65 * 100) / 100,
    regularMarketPrice: c.price,
    shortName: meta.name || sym,
  }
}

export function getMockPopular() {
  return Object.keys(BASE_PRICES).map((sym) => getMockQuote(sym))
}

export function getMockSearch(query) {
  const q = query.toLowerCase()
  return Object.entries(STOCK_META)
    .filter(([sym, meta]) =>
      sym.toLowerCase().includes(q) || meta.name.toLowerCase().includes(q)
    )
    .slice(0, 8)
    .map(([sym]) => getMockQuote(sym))
}

export function getMockHistory(symbol, period = '1mo') {
  const base = BASE_PRICES[symbol.toUpperCase()]
  if (!base) return []

  const periodDays = { '1w': 7, '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365 }
  const days = periodDays[period] || 30
  const data = []
  let price = base * (0.85 + Math.random() * 0.15)

  for (let i = days; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000)
    if (date.getDay() === 0 || date.getDay() === 6) continue

    const dailyChange = price * (Math.random() * 0.04 - 0.02)
    price = Math.max(price + dailyChange, base * 0.5)
    const high = price * (1 + Math.random() * 0.015)
    const low = price * (1 - Math.random() * 0.015)
    const open = low + Math.random() * (high - low)

    data.push({
      date: date.toISOString(),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(price * 100) / 100,
      volume: Math.floor(10e6 + Math.random() * 60e6),
    })
  }
  return data
}
