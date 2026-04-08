import { Router } from 'express'
import YahooFinance from 'yahoo-finance2'
import { getMockQuote, getMockPopular, getMockSearch, getMockHistory } from '../mock-data.js'

const router = Router()
let yf = null
let useMock = false

try {
  yf = new YahooFinance()
  yf.suppressNotices(['yahooSurvey'])
} catch {
  useMock = true
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

async function liveQuote(symbol) {
  if (useMock || !yf) throw new Error('live unavailable')
  const quote = await yf.quote(symbol)
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

router.get('/popular', async (req, res) => {
  try {
    let stocks
    try {
      const results = await Promise.allSettled(
        POPULAR_STOCKS.map((s) => liveQuote(s.symbol))
      )
      stocks = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value)
      if (stocks.length < 5) throw new Error('too few results')
    } catch {
      console.log('[stock/popular] using mock data')
      stocks = getMockPopular()
    }
    res.json({ success: true, data: stocks })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/quote/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase()
    let data
    try {
      data = await liveQuote(symbol)
    } catch {
      console.log(`[stock/quote] ${symbol} using mock data`)
      data = getMockQuote(symbol)
      if (!data) {
        return res.status(404).json({ success: false, error: `未找到 ${symbol} 的数据` })
      }
    }
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params
    let results
    try {
      if (useMock || !yf) throw new Error('use mock')
      const localMatches = POPULAR_STOCKS.filter(
        (s) => s.symbol.toLowerCase().includes(query.toLowerCase()) ||
               s.name.toLowerCase().includes(query.toLowerCase())
      )
      if (localMatches.length > 0) {
        const quoteResults = await Promise.allSettled(
          localMatches.slice(0, 8).map((s) => liveQuote(s.symbol))
        )
        results = quoteResults
          .filter((r) => r.status === 'fulfilled')
          .map((r) => r.value)
        if (results.length === 0) throw new Error('fallback')
      } else {
        const searchResults = await yf.search(query)
        results = (searchResults.quotes || []).slice(0, 8).map((q) => ({
          symbol: q.symbol,
          name: q.shortname || q.longname || q.symbol,
          exchange: q.exchange,
        }))
      }
    } catch {
      console.log(`[stock/search] "${query}" using mock data`)
      results = getMockSearch(query)
    }
    res.json({ success: true, data: results })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/history/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase()
    const { period = '1mo' } = req.query
    let data

    try {
      if (useMock || !yf) throw new Error('use mock')
      const periodMap = {
        '1w': { period1: new Date(Date.now() - 7 * 86400000), interval: '1d' },
        '1mo': { period1: new Date(Date.now() - 30 * 86400000), interval: '1d' },
        '3mo': { period1: new Date(Date.now() - 90 * 86400000), interval: '1d' },
        '6mo': { period1: new Date(Date.now() - 180 * 86400000), interval: '1wk' },
        '1y': { period1: new Date(Date.now() - 365 * 86400000), interval: '1wk' },
      }
      const config = periodMap[period] || periodMap['1mo']
      const result = await yf.chart(symbol, { period1: config.period1, interval: config.interval })
      data = result.quotes
        .map((item) => ({
          date: item.date,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume,
        }))
        .filter((item) => item.close != null)
    } catch {
      console.log(`[stock/history] ${symbol} ${period} using mock data`)
      data = getMockHistory(symbol, period)
    }

    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
