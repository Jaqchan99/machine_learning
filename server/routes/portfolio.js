import { Router } from 'express'
import yahooFinance from 'yahoo-finance2'
import { getPortfolio, resetPortfolio } from '../store.js'

const router = Router()

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

    const quote = await yahooFinance.quote(symbol.toUpperCase())
    const price = quote.regularMarketPrice
    const totalCost = price * shares

    const portfolio = getPortfolio()

    if (totalCost > portfolio.cash) {
      return res.status(400).json({
        success: false,
        error: `资金不足！需要 $${totalCost.toFixed(2)}，当前可用 $${portfolio.cash.toFixed(2)}`,
      })
    }

    portfolio.cash -= totalCost

    if (!portfolio.holdings[symbol.toUpperCase()]) {
      portfolio.holdings[symbol.toUpperCase()] = {
        symbol: symbol.toUpperCase(),
        name: quote.shortName || quote.longName || symbol,
        shares: 0,
        avgCost: 0,
        totalCost: 0,
      }
    }

    const holding = portfolio.holdings[symbol.toUpperCase()]
    const newTotalCost = holding.totalCost + totalCost
    const newShares = holding.shares + shares
    holding.avgCost = newTotalCost / newShares
    holding.shares = newShares
    holding.totalCost = newTotalCost

    const transaction = {
      id: Date.now().toString(),
      type: 'buy',
      symbol: symbol.toUpperCase(),
      name: quote.shortName || quote.longName || symbol,
      shares,
      price,
      total: totalCost,
      timestamp: new Date().toISOString(),
    }
    portfolio.transactions.unshift(transaction)

    res.json({
      success: true,
      data: { portfolio, transaction },
      message: `成功买入 ${shares} 股 ${symbol.toUpperCase()}，成交价 $${price.toFixed(2)}`,
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

    const upperSymbol = symbol.toUpperCase()
    const portfolio = getPortfolio()
    const holding = portfolio.holdings[upperSymbol]

    if (!holding || holding.shares < shares) {
      return res.status(400).json({
        success: false,
        error: `持仓不足！当前持有 ${holding?.shares || 0} 股 ${upperSymbol}`,
      })
    }

    const quote = await yahooFinance.quote(upperSymbol)
    const price = quote.regularMarketPrice
    const totalRevenue = price * shares
    const costBasis = holding.avgCost * shares
    const profit = totalRevenue - costBasis
    const profitPercent = ((profit / costBasis) * 100)

    portfolio.cash += totalRevenue
    holding.shares -= shares
    holding.totalCost = holding.avgCost * holding.shares

    if (holding.shares === 0) {
      delete portfolio.holdings[upperSymbol]
    }

    const transaction = {
      id: Date.now().toString(),
      type: 'sell',
      symbol: upperSymbol,
      name: quote.shortName || quote.longName || symbol,
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
      message: `成功卖出 ${shares} 股 ${upperSymbol}，成交价 $${price.toFixed(2)}，${profit >= 0 ? '盈利' : '亏损'} $${Math.abs(profit).toFixed(2)} (${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%)`,
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
        data: { holdings: [], totalValue: portfolio.cash, cash: portfolio.cash, totalProfit: 0, totalProfitPercent: 0 },
      })
    }

    const enriched = await Promise.allSettled(
      holdings.map(async (h) => {
        try {
          const quote = await yahooFinance.quote(h.symbol)
          const currentPrice = quote.regularMarketPrice
          const marketValue = currentPrice * h.shares
          const profit = marketValue - h.totalCost
          const profitPercent = (profit / h.totalCost) * 100
          return {
            ...h,
            currentPrice,
            marketValue,
            profit,
            profitPercent,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent,
          }
        } catch {
          return { ...h, currentPrice: h.avgCost, marketValue: h.totalCost, profit: 0, profitPercent: 0 }
        }
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
