import { useState, useCallback } from 'react'

const BASE_URL = '/api'

async function request(url, options = {}) {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await response.json()
  if (!data.success) throw new Error(data.error || '请求失败')
  return data
}

export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const call = useCallback(async (url, options) => {
    setLoading(true)
    setError(null)
    try {
      const result = await request(url, options)
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { call, loading, error, setError }
}

export const api = {
  getPopularStocks: () => request('/stock/popular'),
  getQuote: (symbol) => request(`/stock/quote/${symbol}`),
  searchStock: (query) => request(`/stock/search/${query}`),
  getHistory: (symbol, period) => request(`/stock/history/${symbol}?period=${period}`),
  getPortfolio: () => request('/portfolio'),
  getHoldings: () => request('/portfolio/holdings'),
  getTransactions: () => request('/portfolio/transactions'),
  buy: (symbol, shares) => request('/portfolio/buy', { method: 'POST', body: JSON.stringify({ symbol, shares }) }),
  sell: (symbol, shares) => request('/portfolio/sell', { method: 'POST', body: JSON.stringify({ symbol, shares }) }),
  resetPortfolio: () => request('/portfolio/reset', { method: 'POST' }),
  aiReview: (transaction, apiKey) =>
    request('/ai/review', { method: 'POST', body: JSON.stringify({ transaction, apiKey }) }),
  marketAnalysis: (stocks, apiKey) =>
    request('/ai/market-analysis', { method: 'POST', body: JSON.stringify({ stocks, apiKey }) }),
}
