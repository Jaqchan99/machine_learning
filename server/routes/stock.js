import { Router } from 'express'
import yahooFinance from 'yahoo-finance2'

const router = Router()

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

router.get('/popular', async (req, res) => {
  try {
    const results = await Promise.allSettled(
      POPULAR_STOCKS.map(async (stock) => {
        try {
          const quote = await yahooFinance.quote(stock.symbol)
          return {
            symbol: stock.symbol,
            name: stock.name,
            sector: stock.sector,
            price: quote.regularMarketPrice,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent,
            volume: quote.regularMarketVolume,
            marketCap: quote.marketCap,
            high: quote.regularMarketDayHigh,
            low: quote.regularMarketDayLow,
            open: quote.regularMarketOpen,
            prevClose: quote.regularMarketPreviousClose,
          }
        } catch {
          return { symbol: stock.symbol, name: stock.name, sector: stock.sector, error: true }
        }
      })
    )
    const stocks = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value)
      .filter((s) => !s.error)

    res.json({ success: true, data: stocks })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params
    const quote = await yahooFinance.quote(symbol.toUpperCase())
    const stockInfo = POPULAR_STOCKS.find(
      (s) => s.symbol === symbol.toUpperCase()
    )

    res.json({
      success: true,
      data: {
        symbol: quote.symbol,
        name: stockInfo?.name || quote.shortName || quote.longName || symbol,
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
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: `无法获取 ${req.params.symbol} 的行情数据` })
  }
})

router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params
    const localResults = POPULAR_STOCKS.filter(
      (s) =>
        s.symbol.toLowerCase().includes(query.toLowerCase()) ||
        s.name.toLowerCase().includes(query.toLowerCase())
    )

    if (localResults.length > 0) {
      const results = await Promise.allSettled(
        localResults.slice(0, 8).map(async (stock) => {
          try {
            const quote = await yahooFinance.quote(stock.symbol)
            return {
              symbol: stock.symbol,
              name: stock.name,
              sector: stock.sector,
              price: quote.regularMarketPrice,
              change: quote.regularMarketChange,
              changePercent: quote.regularMarketChangePercent,
            }
          } catch {
            return { symbol: stock.symbol, name: stock.name, sector: stock.sector }
          }
        })
      )
      res.json({
        success: true,
        data: results.filter((r) => r.status === 'fulfilled').map((r) => r.value),
      })
      return
    }

    const searchResults = await yahooFinance.search(query)
    const quotes = searchResults.quotes || []
    const mapped = quotes.slice(0, 8).map((q) => ({
      symbol: q.symbol,
      name: q.shortname || q.longname || q.symbol,
      exchange: q.exchange,
    }))

    res.json({ success: true, data: mapped })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/history/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params
    const { period = '1mo' } = req.query

    const periodMap = {
      '1w': { period1: new Date(Date.now() - 7 * 86400000), interval: '1d' },
      '1mo': { period1: new Date(Date.now() - 30 * 86400000), interval: '1d' },
      '3mo': { period1: new Date(Date.now() - 90 * 86400000), interval: '1d' },
      '6mo': { period1: new Date(Date.now() - 180 * 86400000), interval: '1wk' },
      '1y': { period1: new Date(Date.now() - 365 * 86400000), interval: '1wk' },
    }

    const config = periodMap[period] || periodMap['1mo']

    const result = await yahooFinance.chart(symbol.toUpperCase(), {
      period1: config.period1,
      interval: config.interval,
    })

    const data = result.quotes.map((item) => ({
      date: item.date,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
    })).filter(item => item.close != null)

    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
