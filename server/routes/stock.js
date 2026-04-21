import { Router } from 'express'
import { getMockQuote, getMockPopular, getMockSearch, getMockHistory } from '../mock-data.js'

const router = Router()

router.get('/popular', (req, res) => {
  res.json({ success: true, data: getMockPopular() })
})

router.get('/quote/:symbol', (req, res) => {
  const symbol = req.params.symbol.toUpperCase()
  const data = getMockQuote(symbol)
  if (!data) return res.status(404).json({ success: false, error: `未找到 ${symbol}` })
  res.json({ success: true, data })
})

router.get('/search/:query', (req, res) => {
  res.json({ success: true, data: getMockSearch(req.params.query) })
})

router.get('/history/:symbol', (req, res) => {
  const symbol = req.params.symbol.toUpperCase()
  const { period = '1mo' } = req.query
  res.json({ success: true, data: getMockHistory(symbol, period) })
})

export default router
