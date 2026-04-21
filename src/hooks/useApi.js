import { useState, useCallback } from 'react'

const BASE_URL = '/api'

function getStoredUserId() {
  let uid = localStorage.getItem('stocksim_user_id')
  if (!uid) {
    uid = 'user_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('stocksim_user_id', uid)
  }
  return uid
}

export const USER_ID = getStoredUserId()

async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', 'X-User-Id': USER_ID, ...(options.headers || {}) }
  const response = await fetch(`${BASE_URL}${url}`, { ...options, headers })
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
      return await request(url, options)
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
  getQuests: () => request('/portfolio/quests'),
  completeQuest: (questKey) => request('/portfolio/quests/complete', { method: 'POST', body: JSON.stringify({ questKey }) }),
  aiReview: (transaction, apiKey) =>
    request('/ai/review', { method: 'POST', body: JSON.stringify({ transaction, apiKey }) }),
  marketAnalysis: (stocks, apiKey) =>
    request('/ai/market-analysis', { method: 'POST', body: JSON.stringify({ stocks, apiKey }) }),
}
