import React, { useState, useEffect, useRef } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Search, Loader2, Sparkles, X } from 'lucide-react'
import { api } from '../hooks/useApi'
import { formatMoney, profitColor, formatPercent } from '../utils/format'
import AIReviewPanel from './AIReviewPanel'

export default function TradeView({ showToast, onRefreshPortfolio, apiKey, triggerQuest, portfolio: parentPortfolio }) {
  const [symbol, setSymbol] = useState('')
  const [shares, setShares] = useState('')
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(false)
  const [trading, setTrading] = useState(false)
  const [tradeType, setTradeType] = useState('buy')
  const [portfolio, setPortfolio] = useState(null)
  const [lastTransaction, setLastTransaction] = useState(null)
  const [showReview, setShowReview] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    loadPortfolio()
  }, [])

  useEffect(() => {
    const handler = (e) => {
      setSymbol(e.detail)
      fetchQuote(e.detail)
    }
    window.addEventListener('setTradeSymbol', handler)
    return () => window.removeEventListener('setTradeSymbol', handler)
  }, [])

  const loadPortfolio = async () => {
    try {
      const result = await api.getHoldings()
      setPortfolio(result.data)

      if (triggerQuest && result.data.holdings?.length >= 3) triggerQuest('diversify')
    } catch (err) {
      console.error(err)
    }
  }

  const checkTenTrades = async () => {
    try {
      const result = await api.getTransactions()
      if (triggerQuest && result.data?.length >= 10) triggerQuest('ten_trades')
    } catch {}
  }

  const fetchQuote = async (sym) => {
    if (!sym?.trim()) return
    setLoading(true)
    try {
      const result = await api.getQuote(sym)
      setQuote(result.data)
    } catch {
      showToast(`无法获取 ${sym} 的行情`, 'error')
      setQuote(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSymbolSearch = (e) => {
    e.preventDefault()
    fetchQuote(symbol)
  }

  const totalCost = quote && shares ? quote.price * Number(shares) : 0

  const holding = portfolio?.holdings?.find(
    (h) => h.symbol === symbol.toUpperCase()
  )

  const handleTrade = async () => {
    if (!symbol || !shares || Number(shares) <= 0) {
      showToast('请输入有效的股票代码和数量', 'warning')
      return
    }

    setTrading(true)
    try {
      const result =
        tradeType === 'buy'
          ? await api.buy(symbol.toUpperCase(), Number(shares))
          : await api.sell(symbol.toUpperCase(), Number(shares))

      showToast(result.message, 'success')
      setLastTransaction(result.data.transaction)
      setShares('')
      setShowReview(true)
      loadPortfolio()
      onRefreshPortfolio()

      if (triggerQuest) {
        if (tradeType === 'buy') triggerQuest('buy')
        if (tradeType === 'sell' && result.data.transaction?.profit > 0) triggerQuest('sell_profit')
        triggerQuest('ai_review')
        checkTenTrades()
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setTrading(false)
    }
  }

  const setMaxShares = () => {
    if (!quote) return
    if (tradeType === 'buy' && portfolio) {
      const max = Math.floor(portfolio.cash / quote.price)
      setShares(max.toString())
    } else if (tradeType === 'sell' && holding) {
      setShares(holding.shares.toString())
    }
  }

  return (
    <div className="px-4 pt-12 pb-4">
      <h1 className="text-2xl font-bold tracking-tight mb-1">股票交易</h1>
      <p className="text-text-secondary text-xs mb-5">输入股票代码，开始模拟交易</p>

      <form onSubmit={handleSymbolSearch} className="relative mb-4">
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} className="text-text-secondary pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="输入股票代码，如 AAPL、TSLA"
          style={{ paddingLeft: 42 }}
          className="w-full h-11 pr-20 bg-bg-card rounded-xl text-sm text-text-primary placeholder-text-secondary border border-border focus:border-primary focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg disabled:opacity-50"
        >
          {loading ? '查询中' : '查询'}
        </button>
      </form>

      {portfolio && (
        <div className="mb-4 p-3 bg-bg-card rounded-xl flex items-center justify-between">
          <span className="text-xs text-text-secondary">可用资金</span>
          <span className="text-sm font-bold text-primary">{formatMoney(portfolio.cash)}</span>
        </div>
      )}

      {quote && (
        <div className="animate-fade-in">
          <div className="mb-4 p-4 bg-bg-card rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-bold text-lg">{quote.symbol}</span>
                <span className="text-xs text-text-secondary ml-2">{quote.name}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">${quote.price?.toFixed(2)}</div>
                <div className={`text-xs font-medium ${profitColor(quote.changePercent)}`}>
                  {formatPercent(quote.changePercent)}
                </div>
              </div>
            </div>

            {holding && (
              <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-xs">
                <span className="text-text-secondary">
                  当前持有 <span className="text-text-primary font-semibold">{holding.shares}</span> 股
                </span>
                <span className={profitColor(holding.profit)}>
                  浮动盈亏 {holding.profit >= 0 ? '+' : ''}{formatMoney(holding.profit)}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTradeType('buy')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                tradeType === 'buy'
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                  : 'bg-bg-card text-text-secondary'
              }`}
            >
              <ArrowDownCircle size={16} />
              买入
            </button>
            <button
              onClick={() => setTradeType('sell')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                tradeType === 'sell'
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                  : 'bg-bg-card text-text-secondary'
              }`}
            >
              <ArrowUpCircle size={16} />
              卖出
            </button>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-text-secondary">交易数量（股）</label>
              <button
                onClick={setMaxShares}
                className="text-[10px] text-primary font-medium"
              >
                {tradeType === 'buy' ? '最大可买' : '全部卖出'}
              </button>
            </div>
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="输入股数"
              min="1"
              step="1"
              className="w-full h-12 px-4 bg-bg-card rounded-xl text-lg font-bold text-text-primary placeholder-text-secondary border border-border focus:border-primary focus:outline-none transition-colors text-center"
            />
          </div>

          {shares && Number(shares) > 0 && (
            <div className="mb-4 p-3 bg-bg-card rounded-xl space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">成交价格</span>
                <span className="font-medium">${quote.price?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">交易数量</span>
                <span className="font-medium">{Number(shares).toLocaleString()} 股</span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-border">
                <span className="text-text-secondary font-medium">预估金额</span>
                <span className="font-bold text-primary">{formatMoney(totalCost)}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleTrade}
            disabled={trading || !shares || Number(shares) <= 0}
            className={`w-full h-12 rounded-xl font-bold text-white transition-all active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 ${
              tradeType === 'buy'
                ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/25'
                : 'bg-gradient-to-r from-green-500 to-green-600 shadow-lg shadow-green-500/25'
            }`}
          >
            {trading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : tradeType === 'buy' ? (
              <>
                <ArrowDownCircle size={18} />
                确认买入
              </>
            ) : (
              <>
                <ArrowUpCircle size={18} />
                确认卖出
              </>
            )}
          </button>
        </div>
      )}

      {showReview && lastTransaction && (
        <AIReviewPanel
          transaction={lastTransaction}
          apiKey={apiKey}
          onClose={() => setShowReview(false)}
        />
      )}
    </div>
  )
}
