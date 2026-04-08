import { Router } from 'express'
import YahooFinance from 'yahoo-finance2'
import { getPortfolio, resetPortfolio } from '../store.js'
import { getMockQuote } from '../mock-data.js'

const router = Router()
let yf = null

try {
  yf = new YahooFinance()
  yf.suppressNotices(['yahooSurvey'])
} catch { /* mock mode */ }

async function getPrice(symbol) {
  try {
    if (!yf) throw new Error('no yf')
    const quote = await yf.quote(symbol)
    return {
      price: quote.regularMarketPrice,
      name: quote.shortName || quote.longName || symbol,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
    }
  } catch {
    const mock = getMockQuote(symbol)
    if (mock) return { price: mock.price, name: mock.name, change: mock.change, changePercent: mock.changePercent }
    throw new Error(`无法获取 ${symbol} 的价格`)
  }
}

router.get('/', (req, res) => {
  const portfolio = getPortfolio()
  res.json({ success: true, data: portfolio })
})

router.post('/buy', async (req, res) => {
  try {
    const { symbol, shares } = req.body
    if (!symbol || !shares || shares <= 0) {
      return res.status(400).json({ success: false, error: '请输入有效的股票代码和数量' })
    }

    const sym = symbol.toUpperCase()
    const { price, name } = await getPrice(sym)
    const totalCost = price * shares
    const portfolio = getPortfolio()

    if (totalCost > portfolio.cash) {
      return res.status(400).json({
        success: false,
        error: `资金不足！需要 $${totalCost.toFixed(2)}，当前可用 $${portfolio.cash.toFixed(2)}`,
      })
    }

    portfolio.cash -= totalCost

    if (!portfolio.holdings[sym]) {
      portfolio.holdings[sym] = { symbol: sym, name, shares: 0, avgCost: 0, totalCost: 0 }
    }

    const holding = portfolio.holdings[sym]
    const newTotalCost = holding.totalCost + totalCost
    const newShares = holding.shares + shares
    holding.avgCost = newTotalCost / newShares
    holding.shares = newShares
    holding.totalCost = newTotalCost

    const transaction = {
      id: Date.now().toString(),
      type: 'buy',
      symbol: sym,
      name,
      shares,
      price,
      total: totalCost,
      timestamp: new Date().toISOString(),
    }
    portfolio.transactions.unshift(transaction)

    res.json({
      success: true,
      data: { portfolio, transaction },
      message: `成功买入 ${shares} 股 ${sym}，成交价 $${price.toFixed(2)}`,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/sell', async (req, res) => {
  try {
    const { symbol, shares } = req.body
    if (!symbol || !shares || shares <= 0) {
      return res.status(400).json({ success: false, error: '请输入有效的股票代码和数量' })
    }

    const sym = symbol.toUpperCase()
    const portfolio = getPortfolio()
    const holding = portfolio.holdings[sym]

    if (!holding || holding.shares < shares) {
      return res.status(400).json({
        success: false,
        error: `持仓不足！当前持有 ${holding?.shares || 0} 股 ${sym}`,
      })
    }

    const { price, name } = await getPrice(sym)
    const totalRevenue = price * shares
    const costBasis = holding.avgCost * shares
    const profit = totalRevenue - costBasis
    const profitPercent = (profit / costBasis) * 100

    portfolio.cash += totalRevenue
    holding.shares -= shares
    holding.totalCost = holding.avgCost * holding.shares

    if (holding.shares === 0) {
      delete portfolio.holdings[sym]
    }

    const transaction = {
      id: Date.now().toString(),
      type: 'sell',
      symbol: sym,
      name,
      shares,
      price,
      total: totalRevenue,
      profit,
      profitPercent,
      avgCost: holding.avgCost,
      timestamp: new Date().toISOString(),
    }
    portfolio.transactions.unshift(transaction)

    res.json({
      success: true,
      data: { portfolio, transaction },
      message: `成功卖出 ${shares} 股 ${sym}，成交价 $${price.toFixed(2)}，${profit >= 0 ? '盈利' : '亏损'} $${Math.abs(profit).toFixed(2)} (${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%)`,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/holdings', async (req, res) => {
  try {
    const portfolio = getPortfolio()
    const holdings = Object.values(portfolio.holdings)

    if (holdings.length === 0) {
      return res.json({
        success: true,
        data: { holdings: [], totalValue: portfolio.cash, cash: portfolio.cash, totalMarketValue: 0, totalCost: 0, totalProfit: 0, totalProfitPercent: 0 },
      })
    }

    const enriched = await Promise.allSettled(
      holdings.map(async (h) => {
        const { price, change, changePercent } = await getPrice(h.symbol)
        const marketValue = price * h.shares
        const profit = marketValue - h.totalCost
        const profitPercent = (profit / h.totalCost) * 100
        return { ...h, currentPrice: price, marketValue, profit, profitPercent, change, changePercent }
      })
    )

    const enrichedHoldings = enriched.filter((r) => r.status === 'fulfilled').map((r) => r.value)
    const totalMarketValue = enrichedHoldings.reduce((sum, h) => sum + h.marketValue, 0)
    const totalCost = enrichedHoldings.reduce((sum, h) => sum + h.totalCost, 0)
    const totalProfit = totalMarketValue - totalCost
    const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0

    res.json({
      success: true,
      data: {
        holdings: enrichedHoldings,
        totalValue: portfolio.cash + totalMarketValue,
        cash: portfolio.cash,
        totalMarketValue,
        totalCost,
        totalProfit,
        totalProfitPercent,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/reset', (req, res) => {
  const portfolio = resetPortfolio()
  res.json({ success: true, data: portfolio, message: '账户已重置，初始资金 $100,000' })
})

router.get('/transactions', (req, res) => {
  const portfolio = getPortfolio()
  res.json({ success: true, data: portfolio.transactions })
})

export default router
