import React, { useState, useEffect, useCallback } from 'react'
import { TrendingUp, ArrowLeftRight, Briefcase, User } from 'lucide-react'
import MarketView from './components/MarketView'
import TradeView from './components/TradeView'
import PortfolioView from './components/PortfolioView'
import ProfileView from './components/ProfileView'
import StockDetail from './components/StockDetail'
import Toast from './components/Toast'
import { api } from './hooks/useApi'

const TABS = [
  { id: 'market', label: '行情', icon: TrendingUp },
  { id: 'trade', label: '交易', icon: ArrowLeftRight },
  { id: 'portfolio', label: '持仓', icon: Briefcase },
  { id: 'profile', label: '我的', icon: User },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('market')
  const [selectedStock, setSelectedStock] = useState(null)
  const [toast, setToast] = useState(null)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai_api_key') || '')
  const [portfolio, setPortfolio] = useState(null)
  const [questEvents, setQuestEvents] = useState(null)

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() })
  }, [])

  const triggerQuest = useCallback((type, data) => {
    setQuestEvents({ type, data, ts: Date.now() })
  }, [])

  const refreshPortfolio = useCallback(async () => {
    try {
      const result = await api.getHoldings()
      setPortfolio(result.data)
    } catch (err) {
      console.error('Failed to refresh portfolio:', err)
    }
  }, [])

  useEffect(() => {
    refreshPortfolio()
  }, [refreshPortfolio])

  const handleSelectStock = (stock) => {
    setSelectedStock(stock)
    triggerQuest('view_stock')
  }

  const handleBack = () => {
    setSelectedStock(null)
  }

  const handleTrade = (symbol) => {
    setSelectedStock(null)
    setActiveTab('trade')
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('setTradeSymbol', { detail: symbol }))
    }, 100)
  }

  const handleSaveApiKey = (key) => {
    setApiKey(key)
    localStorage.setItem('openai_api_key', key)
    showToast('API Key 已保存', 'success')
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'portfolio') triggerQuest('view_portfolio')
  }

  if (selectedStock) {
    return (
      <>
        <StockDetail
          stock={selectedStock}
          onBack={handleBack}
          onTrade={handleTrade}
          apiKey={apiKey}
          portfolio={portfolio}
        />
        {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    )
  }

  return (
    <div className="flex flex-col h-full bg-bg-dark">
      <div className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'market' && (
          <MarketView onSelectStock={handleSelectStock} apiKey={apiKey} questEvents={questEvents} triggerQuest={triggerQuest} />
        )}
        {activeTab === 'trade' && (
          <TradeView
            showToast={showToast}
            onRefreshPortfolio={refreshPortfolio}
            apiKey={apiKey}
            triggerQuest={triggerQuest}
            portfolio={portfolio}
          />
        )}
        {activeTab === 'portfolio' && (
          <PortfolioView
            portfolio={portfolio}
            onRefresh={refreshPortfolio}
            onSelectStock={handleSelectStock}
            apiKey={apiKey}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileView
            apiKey={apiKey}
            onSaveApiKey={handleSaveApiKey}
            showToast={showToast}
            onRefreshPortfolio={refreshPortfolio}
          />
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                activeTab === id ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon size={22} strokeWidth={activeTab === id ? 2.5 : 1.5} />
              <span className={`text-[10px] mt-1 ${activeTab === id ? 'font-semibold' : ''}`}>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
