import React, { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, TrendingUp, Sparkles, X } from 'lucide-react'
import { api } from '../hooks/useApi'
import { formatMoney, formatPercent, formatVolume, profitColor } from '../utils/format'
import QuestPanel from './QuestPanel'

const SECTORS = ['全部', '科技', '电商', '汽车', '半导体', '金融', '娱乐', '工业', '消费']

export default function MarketView({ onSelectStock, apiKey, questEvents, triggerQuest }) {
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [activeSector, setActiveSector] = useState('全部')
  const [marketInsight, setMarketInsight] = useState('')
  const [insightLoading, setInsightLoading] = useState(false)

  const loadStocks = useCallback(async () => {
    setLoading(true)
    try {
      const result = await api.getPopularStocks()
      setStocks(result.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStocks()
  }, [loadStocks])

  const handleSearch = async (query) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults(null)
      return
    }
    if (query.length < 1) return
    setSearching(true)
    try {
      const result = await api.searchStock(query)
      setSearchResults(result.data)
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const getMarketInsight = async () => {
    if (stocks.length === 0) return
    setInsightLoading(true)
    try {
      const result = await api.marketAnalysis(stocks.slice(0, 10), apiKey)
      setMarketInsight(result.data.analysis)
    } catch {
      setMarketInsight('暂时无法获取市场分析，请稍后重试。')
    } finally {
      setInsightLoading(false)
    }
  }

  const filteredStocks = activeSector === '全部'
    ? stocks
    : stocks.filter((s) => s.sector === activeSector)

  const displayStocks = searchResults || filteredStocks

  const today = new Date()
  const dateStr = today.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })
  const gainCount = stocks.filter((s) => (s.changePercent || 0) > 0).length
  const lossCount = stocks.filter((s) => (s.changePercent || 0) < 0).length

  return (
    <div className="px-4 pt-12 pb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">行情中心</h1>
          <p className="text-text-secondary text-xs mt-0.5">{dateStr}</p>
        </div>
        <button
          onClick={loadStocks}
          disabled={loading}
          className="w-9 h-9 rounded-full bg-bg-card flex items-center justify-center text-text-secondary hover:text-primary transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {stocks.length > 0 && (
        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-600/30 via-purple-600/20 to-pink-600/20 border border-indigo-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-xl font-extrabold text-red-400">{gainCount}</div>
                <div className="text-[10px] text-text-secondary mt-0.5">上涨</div>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div className="text-center">
                <div className="text-xl font-extrabold text-green-400">{lossCount}</div>
                <div className="text-[10px] text-text-secondary mt-0.5">下跌</div>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div className="text-center">
                <div className="text-xl font-extrabold text-text-primary">{stocks.length - gainCount - lossCount}</div>
                <div className="text-[10px] text-text-secondary mt-0.5">平盘</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-text-secondary">热门股数量</div>
              <div className="text-lg font-bold text-primary">{stocks.length}</div>
            </div>
          </div>
        </div>
      )}

      <QuestPanel questEvents={questEvents} />

      <div className="relative mb-4">
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} className="text-text-secondary pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="搜索股票代码或名称..."
          style={{ paddingLeft: 50 }}
          className="w-full h-10 pr-9 bg-bg-card rounded-xl text-sm text-text-primary placeholder-text-secondary border border-border focus:border-primary focus:outline-none transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); setSearchResults(null) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {!searchResults && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-none">
          {SECTORS.map((sector) => (
            <button
              key={sector}
              onClick={() => setActiveSector(sector)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeSector === sector
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'bg-bg-card text-text-secondary hover:text-text-primary'
              }`}
            >
              {sector}
            </button>
          ))}
        </div>
      )}

      {!searchResults && !marketInsight && stocks.length > 0 && (
        <button
          onClick={getMarketInsight}
          disabled={insightLoading}
          className="w-full mb-4 p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-xl flex items-center gap-2 text-sm text-blue-300 hover:from-blue-600/30 hover:to-purple-600/30 transition-all"
        >
          <Sparkles size={16} className={insightLoading ? 'animate-pulse' : ''} />
          <span>{insightLoading ? 'AI 分析中...' : '获取 AI 市场分析'}</span>
        </button>
      )}

      {marketInsight && (
        <div className="mb-4 p-3.5 bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/15 rounded-xl animate-fade-in">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={14} className="text-blue-400" />
            <span className="text-xs font-semibold text-blue-400">AI 市场洞察</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">{marketInsight}</p>
          <button
            onClick={() => setMarketInsight('')}
            className="mt-2 text-[10px] text-text-secondary hover:text-text-primary"
          >
            收起
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw size={24} className="text-primary animate-spin" />
          <span className="text-sm text-text-secondary">加载行情数据中...</span>
        </div>
      ) : (
        <div className="space-y-2">
          {displayStocks.map((stock) => (
            <StockCard key={stock.symbol} stock={stock} onClick={() => onSelectStock(stock)} />
          ))}
          {displayStocks.length === 0 && (
            <div className="text-center py-16 text-text-secondary text-sm">
              {searchResults !== null ? '未找到匹配的股票' : '该板块暂无数据'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StockCard({ stock, onClick }) {
  const isUp = (stock.changePercent || 0) >= 0

  return (
    <button
      onClick={onClick}
      className="w-full p-3.5 bg-bg-card hover:bg-bg-card-hover rounded-xl transition-all active:scale-[0.98] text-left"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-text-primary">{stock.symbol}</span>
            {stock.sector && (
              <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-medium">
                {stock.sector}
              </span>
            )}
          </div>
          <span className="text-xs text-text-secondary mt-0.5 block truncate">
            {stock.name}
          </span>
        </div>

        <div className="text-right ml-4">
          <div className="font-bold text-sm">{stock.price ? `$${stock.price.toFixed(2)}` : '--'}</div>
          <div className={`text-xs font-medium ${profitColor(stock.changePercent)}`}>
            {stock.changePercent != null ? formatPercent(stock.changePercent) : '--'}
          </div>
        </div>

        <div
          className={`ml-3 px-2.5 py-1.5 rounded-lg text-xs font-bold min-w-[68px] text-center ${
            isUp ? 'bg-red-500/15 text-profit' : 'bg-green-500/15 text-loss'
          }`}
        >
          {stock.change != null
            ? `${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}`
            : '--'}
        </div>
      </div>
    </button>
  )
}
