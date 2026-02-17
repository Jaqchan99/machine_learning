import React, { useState, useEffect } from 'react'
import { RefreshCw, TrendingUp, TrendingDown, Wallet, PieChart, Clock } from 'lucide-react'
import { api } from '../hooks/useApi'
import { formatMoney, formatPercent, profitColor, formatTime } from '../utils/format'

export default function PortfolioView({ portfolio, onRefresh, onSelectStock }) {
  const [transactions, setTransactions] = useState([])
  const [activeTab, setActiveTab] = useState('holdings')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      const result = await api.getTransactions()
      setTransactions(result.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await onRefresh()
    await loadTransactions()
    setRefreshing(false)
  }

  const totalValue = portfolio?.totalValue || 100000
  const totalProfit = totalValue - 100000
  const totalProfitPercent = (totalProfit / 100000) * 100

  return (
    <div className="px-4 pt-12 pb-4">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold tracking-tight">我的持仓</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="w-9 h-9 rounded-full bg-bg-card flex items-center justify-center text-text-secondary hover:text-primary transition-colors"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="mb-5 p-4 bg-gradient-to-br from-blue-600/20 via-purple-600/15 to-cyan-600/20 border border-blue-500/15 rounded-2xl">
        <div className="text-xs text-text-secondary mb-1">总资产</div>
        <div className="text-3xl font-extrabold tracking-tight mb-2">
          {formatMoney(totalValue)}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {totalProfit >= 0 ? (
              <TrendingUp size={14} className="text-profit" />
            ) : (
              <TrendingDown size={14} className="text-loss" />
            )}
            <span className={`text-sm font-semibold ${profitColor(totalProfit)}`}>
              {totalProfit >= 0 ? '+' : ''}{formatMoney(totalProfit)}
            </span>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            totalProfit >= 0 ? 'bg-red-500/15 text-profit' : 'bg-green-500/15 text-loss'
          }`}>
            {formatPercent(totalProfitPercent)}
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-3 gap-3">
          <div>
            <div className="text-[10px] text-text-secondary">可用资金</div>
            <div className="text-sm font-bold">{formatMoney(portfolio?.cash)}</div>
          </div>
          <div>
            <div className="text-[10px] text-text-secondary">持仓市值</div>
            <div className="text-sm font-bold">{formatMoney(portfolio?.totalMarketValue || 0)}</div>
          </div>
          <div>
            <div className="text-[10px] text-text-secondary">持仓盈亏</div>
            <div className={`text-sm font-bold ${profitColor(portfolio?.totalProfit)}`}>
              {portfolio?.totalProfit != null ? `${portfolio.totalProfit >= 0 ? '+' : ''}${formatMoney(portfolio.totalProfit)}` : '--'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('holdings')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'holdings'
              ? 'bg-primary text-white'
              : 'bg-bg-card text-text-secondary'
          }`}
        >
          <PieChart size={14} />
          持仓明细
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-primary text-white'
              : 'bg-bg-card text-text-secondary'
          }`}
        >
          <Clock size={14} />
          交易记录
        </button>
      </div>

      {activeTab === 'holdings' && (
        <div className="space-y-2 animate-fade-in">
          {portfolio?.holdings?.length > 0 ? (
            portfolio.holdings.map((h) => (
              <HoldingCard key={h.symbol} holding={h} onClick={() => onSelectStock(h)} />
            ))
          ) : (
            <EmptyState
              icon={<PieChart size={40} className="text-text-secondary/30" />}
              title="暂无持仓"
              desc="去行情页面选一只股票，开始你的投资之旅吧！"
            />
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-2 animate-fade-in">
          {transactions.length > 0 ? (
            transactions.map((t) => <TransactionCard key={t.id} transaction={t} />)
          ) : (
            <EmptyState
              icon={<Clock size={40} className="text-text-secondary/30" />}
              title="暂无交易记录"
              desc="完成第一笔交易后，记录会显示在这里"
            />
          )}
        </div>
      )}
    </div>
  )
}

function HoldingCard({ holding, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full p-3.5 bg-bg-card hover:bg-bg-card-hover rounded-xl transition-all active:scale-[0.98] text-left"
    >
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <span className="font-bold text-sm">{holding.symbol}</span>
          <span className="text-xs text-text-secondary ml-2">{holding.name}</span>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold">${holding.currentPrice?.toFixed(2)}</div>
          <div className={`text-[10px] font-medium ${profitColor(holding.changePercent)}`}>
            今日 {formatPercent(holding.changePercent)}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <div className="flex gap-4">
          <span className="text-text-secondary">
            {holding.shares}股 · 均价 ${holding.avgCost?.toFixed(2)}
          </span>
        </div>
        <div className={`font-semibold ${profitColor(holding.profit)}`}>
          {holding.profit >= 0 ? '+' : ''}{formatMoney(holding.profit)}
          <span className="ml-1">({formatPercent(holding.profitPercent)})</span>
        </div>
      </div>
    </button>
  )
}

function TransactionCard({ transaction }) {
  const isBuy = transaction.type === 'buy'

  return (
    <div className="p-3.5 bg-bg-card rounded-xl">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              isBuy ? 'bg-red-500/15 text-profit' : 'bg-green-500/15 text-loss'
            }`}
          >
            {isBuy ? '买入' : '卖出'}
          </span>
          <span className="font-bold text-sm">{transaction.symbol}</span>
          <span className="text-xs text-text-secondary">{transaction.name}</span>
        </div>
        <span className="text-[10px] text-text-secondary">{formatTime(transaction.timestamp)}</span>
      </div>
      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span>
          {transaction.shares}股 × ${transaction.price?.toFixed(2)}
        </span>
        <div className="text-right">
          <span className="font-medium text-text-primary">{formatMoney(transaction.total)}</span>
          {transaction.profit !== undefined && (
            <span className={`ml-2 font-semibold ${profitColor(transaction.profit)}`}>
              {transaction.profit >= 0 ? '盈利' : '亏损'} {formatMoney(Math.abs(transaction.profit))}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon, title, desc }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      {icon}
      <span className="text-sm font-medium text-text-secondary">{title}</span>
      <span className="text-xs text-text-secondary/70 text-center max-w-[200px]">{desc}</span>
    </div>
  )
}
