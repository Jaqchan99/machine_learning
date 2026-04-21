import { Router } from 'express'
import { getMockQuote, getMockPopular, getMockSearch, getMockHistory } from '../mock-data.js'

const router = Router()

let yf = null
let liveFailCount = 0
const MAX_FAILS = 3

try {
  const YahooFinance = (await import('yahoo-finance2')).default
  yf = new YahooFinance()
  yf.suppressNotices(['yahooSurvey', 'yahooFinanceApiSurvey'])
} catch {
  console.log('[stock] yahoo-finance2 不可用，使用模拟数据')
}

const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: '苹果', sector: '科技' },
  { symbol: 'GOOGL', name: '谷歌', sector: '科技' },
  { symbol: 'MSFT', name: '微软', sector: '科技' },
  { symbol: 'AMZN', name: '亚马逊', sector: '消费' },
  { symbol: 'TSLA', name: '特斯拉', sector: '汽车' },
  { symbol: 'NVDA', name: '英伟达', sector: '半导体' },
  { symbol: 'META', name: 'Meta', sector: '科技' },
  { symbol: 'BABA', name: '阿里巴巴', sector: '电商' },
  { symbol: 'JD', name: '京东', sector: '电商' },
  { symbol: 'PDD', name: '拼多多', sector: '电商' },
  { symbol: 'NIO', name: '蔚来', sector: '汽车' },
  { symbol: 'LI', name: '理想汽车', sector: '汽车' },
  { symbol: 'XPEV', name: '小鹏汽车', sector: '汽车' },
  { symbol: 'AMD', name: 'AMD', sector: '半导体' },
  { symbol: 'INTC', name: '英特尔', sector: '半导体' },
  { symbol: 'NFLX', name: '奈飞', sector: '娱乐' },
  { symbol: 'DIS', name: '迪士尼', sector: '娱乐' },
  { symbol: 'BA', name: '波音', sector: '工业' },
  { symbol: 'JPM', name: '摩根大通', sector: '金融' },
  { symbol: 'V', name: 'Visa', sector: '金融' },
]

function shouldUseMock() {
  return !yf || liveFailCount >= MAX_FAILS
}

async function liveQuote(symbol) {
  if (shouldUseMock()) throw new Error('mock mode')

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), 5000)
  )

  const quote = await Promise.race([yf.quote(symbol), timeoutPromise])
  liveFailCount = 0

  const meta = POPULAR_STOCKS.find((s) => s.symbol === symbol)
  return {
    symbol: quote.symbol,
    name: meta?.name || quote.shortName || quote.longName || symbol,
    sector: meta?.sector || '',
    price: quote.regularMarketPrice,
    change: quote.regularMarketChange,
    changePercent: quote.regularMarketChangePercent,
    volume: quote.regularMarketVolume,
    marketCap: quote.marketCap,
    high: quote.regularMarketDayHigh,
    low: quote.regularMarketDayLow,
    open: quote.regularMarketOpen,
    prevClose: quote.regularMarketPreviousClose,
    fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
    pe: quote.trailingPE,
    eps: quote.epsTrailingTwelveMonths,
    regularMarketPrice: quote.regularMarketPrice,
    shortName: meta?.name || quote.shortName || symbol,
  }
}

function getQuote(symbol) {
  const mock = getMockQuote(symbol)
  if (!mock) return null
  return mock
}

router.get('/popular', async (req, res) => {
  try {
    if (shouldUseMock()) {
      return res.json({ success: true, data: getMockPopular(), source: 'mock' })
    }

    try {
      const sample = await Promise.race([
        yf.quote('AAPL'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ])

      if (!sample?.regularMarketPrice) throw new Error('bad response')
      liveFailCount = 0

      const results = await Promise.allSettled(
        POPULAR_STOCKS.map((s) => liveQuote(s.symbol))
      )
      const stocks = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value)

      if (stocks.length >= 5) {
        return res.json({ success: true, data: stocks, source: 'live' })
      }
      throw new Error('too few')
    } catch (err) {
      liveFailCount++
      console.log(`[stock/popular] Yahoo API 失败 (${liveFailCount}/${MAX_FAILS}): ${err.message}，使用模拟数据`)
      res.json({ success: true, data: getMockPopular(), source: 'mock' })
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/quote/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase()
    try {
      const data = await liveQuote(symbol)
      return res.json({ success: true, data, source: 'live' })
    } catch {
      liveFailCount++
      const mock = getQuote(symbol)
      if (!mock) return res.status(404).json({ success: false, error: `未找到 ${symbol}` })
      res.json({ success: true, data: mock, source: 'mock' })
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/search/:query', async (req, res) => {
  try {
    const results = getMockSearch(req.params.query)
    res.json({ success: true, data: results })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/history/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase()
    const { period = '1mo' } = req.query

    if (!shouldUseMock()) {
      try {
        const periodMap = {
          '1w': { period1: new Date(Date.now() - 7 * 86400000), interval: '1d' },
          '1mo': { period1: new Date(Date.now() - 30 * 86400000), interval: '1d' },
          '3mo': { period1: new Date(Date.now() - 90 * 86400000), interval: '1d' },
          '6mo': { period1: new Date(Date.now() - 180 * 86400000), interval: '1wk' },
          '1y': { period1: new Date(Date.now() - 365 * 86400000), interval: '1wk' },
        }
        const config = periodMap[period] || periodMap['1mo']
        const result = await Promise.race([
          yf.chart(symbol, { period1: config.period1, interval: config.interval }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ])
        const data = result.quotes
          .map((item) => ({ date: item.date, open: item.open, high: item.high, low: item.low, close: item.close, volume: item.volume }))
          .filter((item) => item.close != null)
        if (data.length > 0) {
          liveFailCount = 0
          return res.json({ success: true, data, source: 'live' })
        }
      } catch {
        liveFailCount++
      }
    }

    res.json({ success: true, data: getMockHistory(symbol, period), source: 'mock' })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      yahooAvailable: !!yf,
      usingMock: shouldUseMock(),
      failCount: liveFailCount,
      maxFails: MAX_FAILS,
    }
  })
})

export default router
