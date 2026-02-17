import React, { useState, useEffect } from 'react'
import { ArrowLeft, ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react'
import { api } from '../hooks/useApi'
import { formatMoney, formatPercent, formatVolume, formatMarketCap, formatDate, profitColor } from '../utils/format'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const PERIODS = [
  { key: '1w', label: '1周' },
  { key: '1mo', label: '1月' },
  { key: '3mo', label: '3月' },
  { key: '6mo', label: '6月' },
  { key: '1y', label: '1年' },
]

export default function StockDetail({ stock, onBack, onTrade, portfolio }) {
  const [quote, setQuote] = useState(null)
  const [history, setHistory] = useState([])
  const [period, setPeriod] = useState('1mo')
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [stock.symbol])

  useEffect(() => {
    loadChart()
  }, [stock.symbol, period])

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await api.getQuote(stock.symbol)
      setQuote(result.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadChart = async () => {
    setChartLoading(true)
    try {
      const result = await api.getHistory(stock.symbol, period)
      setHistory(result.data)
    } catch (err) {
      console.error(err)
    } finally {
      setChartLoading(false)
    }
  }

  const data = quote || stock
  const isUp = (data.changePercent || 0) >= 0

  const holding = portfolio?.holdings?.find((h) => h.symbol === stock.symbol)

  const chartData = history.map((item) => ({
    date: formatDate(item.date),
    price: item.close,
  }))

  const chartColor = isUp ? '#ef4444' : '#22c55e'

  return (
    <div className="flex flex-col h-full bg-bg-dark">
      <div className="px-4 pt-12 pb-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-bg-card flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-lg">{data.symbol}</h2>
          <p className="text-xs text-text-secondary">{data.name}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="px-4 mb-4">
          <div className="flex items-end gap-3">
            <span className="text-3xl font-extrabold tracking-tight">
              ${data.price?.toFixed(2) || '--'}
            </span>
            <div className={`flex items-center gap-1 pb-1 ${profitColor(data.changePercent)}`}>
              {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="text-sm font-semibold">
                {data.change != null ? `${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}` : '--'}
              </span>
              <span className="text-sm font-semibold">
                ({formatPercent(data.changePercent)})
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 mb-2">
          <div className="flex gap-1.5">
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  period === key
                    ? 'bg-primary text-white'
                    : 'bg-bg-card text-text-secondary hover:text-text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-2 mb-4" style={{ height: 200 }}>
          {chartLoading ? (
            <div className="flex items-center justify-center h-full text-text-secondary text-sm">
              加载图表中...
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                  tickFormatter={(v) => `$${v.toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value) => [`$${value.toFixed(2)}`, '价格']}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={chartColor}
                  strokeWidth={2}
                  fill="url(#priceGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-text-secondary text-sm">
              暂无图表数据
            </div>
          )}
        </div>

        {holding && (
          <div className="mx-4 mb-4 p-3.5 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border border-blue-500/15 rounded-xl">
            <div className="text-xs text-blue-400 font-semibold mb-2">我的持仓</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-[10px] text-text-secondary">持有股数</div>
                <div className="text-sm font-bold">{holding.shares}</div>
              </div>
              <div>
                <div className="text-[10px] text-text-secondary">成本均价</div>
                <div className="text-sm font-bold">${holding.avgCost?.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[10px] text-text-secondary">浮动盈亏</div>
                <div className={`text-sm font-bold ${profitColor(holding.profit)}`}>
                  {holding.profit >= 0 ? '+' : ''}{formatMoney(holding.profit)}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 mb-4">
          <div className="grid grid-cols-2 gap-2.5">
            <InfoCard label="今开" value={`$${data.open?.toFixed(2) || '--'}`} />
            <InfoCard label="昨收" value={`$${data.prevClose?.toFixed(2) || '--'}`} />
            <InfoCard label="最高" value={`$${data.high?.toFixed(2) || '--'}`} />
            <InfoCard label="最低" value={`$${data.low?.toFixed(2) || '--'}`} />
            <InfoCard label="成交量" value={formatVolume(data.volume)} />
            <InfoCard label="市值" value={formatMarketCap(data.marketCap)} />
            {quote?.pe && <InfoCard label="市盈率" value={quote.pe.toFixed(2)} />}
            {quote?.eps && <InfoCard label="每股收益" value={`$${quote.eps.toFixed(2)}`} />}
            {quote?.fiftyTwoWeekHigh && (
              <InfoCard label="52周最高" value={`$${quote.fiftyTwoWeekHigh.toFixed(2)}`} />
            )}
            {quote?.fiftyTwoWeekLow && (
              <InfoCard label="52周最低" value={`$${quote.fiftyTwoWeekLow.toFixed(2)}`} />
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-bg-dark/95 backdrop-blur-lg border-t border-border">
        <button
          onClick={() => onTrade(stock.symbol)}
          className="w-full h-12 bg-gradient-to-r from-primary to-primary-dark text-white font-bold rounded-xl flex items-center justify-center gap-2 active:scale-[0.97] transition-transform shadow-lg shadow-primary/25"
        >
          <ShoppingCart size={18} />
          交易此股票
        </button>
      </div>
    </div>
  )
}

function InfoCard({ label, value }) {
  return (
    <div className="p-2.5 bg-bg-card rounded-lg">
      <div className="text-[10px] text-text-secondary mb-0.5">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  )
}
