import { Router } from 'express'
import { isSupabaseEnabled } from '../supabase.js'
import { getMockQuote } from '../mock-data.js'
import {
  getPortfolio, savePortfolio, resetPortfolio,
  dbGetPortfolio, dbGetHoldings, dbBuy, dbSell,
  dbGetTransactions, dbResetPortfolio, dbGetQuests, dbCompleteQuest,
} from '../store.js'

const router = Router()

async function getPrice(symbol) {
  const mock = getMockQuote(symbol)
  if (mock) return { price: mock.price, name: mock.name, change: mock.change, changePercent: mock.changePercent }
  throw new Error(`未找到 ${symbol} 的价格数据`)
}

function getUserId(req) {
  return req.headers['x-user-id'] || 'default'
}

// ====== Supabase 模式路由 ======

if (isSupabaseEnabled()) {

  router.get('/', async (req, res) => {
    try {
      const userId = getUserId(req)
      const portfolio = await dbGetPortfolio(userId)
      const holdings = await dbGetHoldings(userId)
      res.json({ success: true, data: { cash: Number(portfolio.cash), holdings, transactions: [] } })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  })

  router.post('/buy', async (req, res) => {
    try {
      const userId = getUserId(req)
      const { symbol, shares } = req.body
      if (!symbol || !shares || shares <= 0) return res.status(400).json({ success: false, error: '请输入有效的股票代码和数量' })
      const { price, name } = await getPrice(symbol.toUpperCase())
      const result = await dbBuy(userId, symbol.toUpperCase(), name, shares, price)
      res.json({
        success: true,
        data: { transaction: result.transaction },
        message: `成功买入 ${shares} 股 ${symbol.toUpperCase()}，成交价 $${price.toFixed(2)}`,
      })
    } catch (error) {
      res.status(400).json({ success: false, error: error.message })
    }
  })

  router.post('/sell', async (req, res) => {
    try {
      const userId = getUserId(req)
      const { symbol, shares } = req.body
      if (!symbol || !shares || shares <= 0) return res.status(400).json({ success: false, error: '请输入有效的股票代码和数量' })
      const { price, name } = await getPrice(symbol.toUpperCase())
      const result = await dbSell(userId, symbol.toUpperCase(), name, shares, price)
      const p = result.profit
      const pp = result.profitPercent
      res.json({
        success: true,
        data: { transaction: result.transaction },
        message: `成功卖出 ${shares} 股 ${symbol.toUpperCase()}，成交价 $${price.toFixed(2)}，${p >= 0 ? '盈利' : '亏损'} $${Math.abs(p).toFixed(2)} (${pp >= 0 ? '+' : ''}${pp.toFixed(2)}%)`,
      })
    } catch (error) {
      res.status(400).json({ success: false, error: error.message })
    }
  })

  router.get('/holdings', async (req, res) => {
    try {
      const userId = getUserId(req)
      const portfolio = await dbGetPortfolio(userId)
      const holdings = await dbGetHoldings(userId)
      const cash = Number(portfolio.cash)

      if (holdings.length === 0) {
        return res.json({ success: true, data: { holdings: [], totalValue: cash, cash, totalMarketValue: 0, totalCost: 0, totalProfit: 0, totalProfitPercent: 0 } })
      }

      const enriched = await Promise.allSettled(
        holdings.map(async (h) => {
          const { price, change, changePercent } = await getPrice(h.symbol)
          const marketValue = price * h.shares
          const tc = Number(h.total_cost)
          const profit = marketValue - tc
          const profitPercent = tc > 0 ? (profit / tc) * 100 : 0
          return { symbol: h.symbol, name: h.name, shares: h.shares, avgCost: Number(h.avg_cost), totalCost: tc, currentPrice: price, marketValue, profit, profitPercent, change, changePercent }
        })
      )
      const list = enriched.filter((r) => r.status === 'fulfilled').map((r) => r.value)
      const totalMarketValue = list.reduce((s, h) => s + h.marketValue, 0)
      const totalCost = list.reduce((s, h) => s + h.totalCost, 0)
      const totalProfit = totalMarketValue - totalCost
      const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0

      res.json({ success: true, data: { holdings: list, totalValue: cash + totalMarketValue, cash, totalMarketValue, totalCost, totalProfit, totalProfitPercent } })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  })

  router.get('/transactions', async (req, res) => {
    try {
      const userId = getUserId(req)
      const txs = await dbGetTransactions(userId)
      const mapped = txs.map((t) => ({
        id: t.id, type: t.type, symbol: t.symbol, name: t.name,
        shares: t.shares, price: Number(t.price), total: Number(t.total),
        profit: t.profit != null ? Number(t.profit) : undefined,
        profitPercent: t.profit_percent != null ? Number(t.profit_percent) : undefined,
        avgCost: t.avg_cost != null ? Number(t.avg_cost) : undefined,
        timestamp: t.created_at,
      }))
      res.json({ success: true, data: mapped })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  })

  router.post('/reset', async (req, res) => {
    try {
      const userId = getUserId(req)
      await dbResetPortfolio(userId)
      res.json({ success: true, message: '账户已重置，初始资金 $100,000' })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  })

  router.get('/quests', async (req, res) => {
    try {
      const userId = getUserId(req)
      const quests = await dbGetQuests(userId)
      res.json({ success: true, data: quests })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  })

  router.post('/quests/complete', async (req, res) => {
    try {
      const userId = getUserId(req)
      const { questKey } = req.body
      const quest = await dbCompleteQuest(userId, questKey)
      res.json({ success: true, data: quest })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  })

} else {

  // ====== 本地文件模式路由 ======

  router.get('/', (req, res) => {
    const portfolio = getPortfolio()
    res.json({ success: true, data: portfolio })
  })

  router.post('/buy', async (req, res) => {
    try {
      const { symbol, shares } = req.body
      if (!symbol || !shares || shares <= 0) return res.status(400).json({ success: false, error: '请输入有效的股票代码和数量' })
      const sym = symbol.toUpperCase()
      const { price, name } = await getPrice(sym)
      const totalCost = price * shares
      const portfolio = getPortfolio()
      if (totalCost > portfolio.cash) return res.status(400).json({ success: false, error: `资金不足！需要 $${totalCost.toFixed(2)}，当前可用 $${portfolio.cash.toFixed(2)}` })
      portfolio.cash -= totalCost
      if (!portfolio.holdings[sym]) portfolio.holdings[sym] = { symbol: sym, name, shares: 0, avgCost: 0, totalCost: 0 }
      const h = portfolio.holdings[sym]
      const nc = h.totalCost + totalCost
      const ns = h.shares + shares
      h.avgCost = nc / ns; h.shares = ns; h.totalCost = nc
      const tx = { id: Date.now().toString(), type: 'buy', symbol: sym, name, shares, price, total: totalCost, timestamp: new Date().toISOString() }
      portfolio.transactions.unshift(tx)
      savePortfolio()
      res.json({ success: true, data: { portfolio, transaction: tx }, message: `成功买入 ${shares} 股 ${sym}，成交价 $${price.toFixed(2)}` })
    } catch (error) { res.status(500).json({ success: false, error: error.message }) }
  })

  router.post('/sell', async (req, res) => {
    try {
      const { symbol, shares } = req.body
      if (!symbol || !shares || shares <= 0) return res.status(400).json({ success: false, error: '请输入有效的股票代码和数量' })
      const sym = symbol.toUpperCase()
      const portfolio = getPortfolio()
      const h = portfolio.holdings[sym]
      if (!h || h.shares < shares) return res.status(400).json({ success: false, error: `持仓不足！当前持有 ${h?.shares || 0} 股 ${sym}` })
      const { price, name } = await getPrice(sym)
      const totalRevenue = price * shares
      const costBasis = h.avgCost * shares
      const profit = totalRevenue - costBasis
      const profitPercent = (profit / costBasis) * 100
      portfolio.cash += totalRevenue
      h.shares -= shares; h.totalCost = h.avgCost * h.shares
      if (h.shares === 0) delete portfolio.holdings[sym]
      const tx = { id: Date.now().toString(), type: 'sell', symbol: sym, name, shares, price, total: totalRevenue, profit, profitPercent, avgCost: h.avgCost, timestamp: new Date().toISOString() }
      portfolio.transactions.unshift(tx)
      savePortfolio()
      res.json({ success: true, data: { portfolio, transaction: tx }, message: `成功卖出 ${shares} 股 ${sym}，成交价 $${price.toFixed(2)}，${profit >= 0 ? '盈利' : '亏损'} $${Math.abs(profit).toFixed(2)} (${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%)` })
    } catch (error) { res.status(500).json({ success: false, error: error.message }) }
  })

  router.get('/holdings', async (req, res) => {
    try {
      const portfolio = getPortfolio()
      const holdings = Object.values(portfolio.holdings)
      if (holdings.length === 0) return res.json({ success: true, data: { holdings: [], totalValue: portfolio.cash, cash: portfolio.cash, totalMarketValue: 0, totalCost: 0, totalProfit: 0, totalProfitPercent: 0 } })
      const enriched = await Promise.allSettled(holdings.map(async (h) => {
        const { price, change, changePercent } = await getPrice(h.symbol)
        const mv = price * h.shares; const p = mv - h.totalCost; const pp = h.totalCost > 0 ? (p / h.totalCost) * 100 : 0
        return { ...h, currentPrice: price, marketValue: mv, profit: p, profitPercent: pp, change, changePercent }
      }))
      const list = enriched.filter((r) => r.status === 'fulfilled').map((r) => r.value)
      const tmv = list.reduce((s, h) => s + h.marketValue, 0)
      const tc = list.reduce((s, h) => s + h.totalCost, 0)
      const tp = tmv - tc; const tpp = tc > 0 ? (tp / tc) * 100 : 0
      res.json({ success: true, data: { holdings: list, totalValue: portfolio.cash + tmv, cash: portfolio.cash, totalMarketValue: tmv, totalCost: tc, totalProfit: tp, totalProfitPercent: tpp } })
    } catch (error) { res.status(500).json({ success: false, error: error.message }) }
  })

  router.post('/reset', (req, res) => {
    resetPortfolio()
    res.json({ success: true, message: '账户已重置，初始资金 $100,000' })
  })

  router.get('/transactions', (req, res) => {
    const portfolio = getPortfolio()
    res.json({ success: true, data: portfolio.transactions })
  })

  router.get('/quests', (req, res) => {
    const portfolio = getPortfolio()
    res.json({ success: true, data: Object.entries(portfolio.quests || {}).map(([k, v]) => ({ quest_key: k, completed: v })) })
  })

  router.post('/quests/complete', (req, res) => {
    const { questKey } = req.body
    const portfolio = getPortfolio()
    if (!portfolio.quests) portfolio.quests = {}
    portfolio.quests[questKey] = true
    savePortfolio()
    res.json({ success: true })
  })
}

export default router
