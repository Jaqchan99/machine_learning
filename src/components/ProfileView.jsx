import React, { useState } from 'react'
import { Key, RotateCcw, Info, Github, Heart, Shield, ChevronRight, AlertTriangle } from 'lucide-react'
import { api } from '../hooks/useApi'

export default function ProfileView({ apiKey, onSaveApiKey, showToast, onRefreshPortfolio }) {
  const [inputKey, setInputKey] = useState(apiKey)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)

  const handleSaveKey = () => {
    onSaveApiKey(inputKey.trim())
  }

  const handleReset = async () => {
    setResetting(true)
    try {
      const result = await api.resetPortfolio()
      showToast(result.message, 'success')
      onRefreshPortfolio()
      setShowResetConfirm(false)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="px-4 pt-12 pb-4">
      <h1 className="text-2xl font-bold tracking-tight mb-1">我的</h1>
      <p className="text-text-secondary text-xs mb-6">账户设置与帮助</p>

      <div className="space-y-4">
        <section className="bg-bg-card rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Key size={16} className="text-primary" />
              <span className="text-sm font-semibold">AI 复盘设置</span>
            </div>
            <p className="text-[10px] text-text-secondary mt-1">
              配置 OpenAI API Key 以启用 AI 智能复盘（可选，不配置则使用内置分析）
            </p>
          </div>
          <div className="p-4">
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="sk-..."
              className="w-full h-10 px-3 bg-bg-dark rounded-lg text-sm text-text-primary placeholder-text-secondary border border-border focus:border-primary focus:outline-none transition-colors mb-3"
            />
            <button
              onClick={handleSaveKey}
              className="w-full h-9 bg-primary/10 text-primary text-sm font-semibold rounded-lg hover:bg-primary/20 transition-colors"
            >
              保存 API Key
            </button>
          </div>
        </section>

        <section className="bg-bg-card rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <RotateCcw size={16} className="text-yellow-500" />
              <span className="text-sm font-semibold">重置账户</span>
            </div>
            <p className="text-[10px] text-text-secondary mt-1">
              清空所有持仓和交易记录，重置为初始资金 $100,000
            </p>
          </div>
          <div className="p-4">
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full h-9 bg-yellow-500/10 text-yellow-500 text-sm font-semibold rounded-lg hover:bg-yellow-500/20 transition-colors"
              >
                重置账户
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-yellow-500/10 rounded-lg">
                  <AlertTriangle size={14} className="text-yellow-500 shrink-0" />
                  <span className="text-xs text-yellow-500">确定要重置吗？所有数据将被清除！</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 h-9 bg-bg-dark text-text-secondary text-sm font-medium rounded-lg"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={resetting}
                    className="flex-1 h-9 bg-red-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
                  >
                    {resetting ? '重置中...' : '确认重置'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="bg-bg-card rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-blue-400" />
              <span className="text-sm font-semibold">使用说明</span>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <HelpItem
              num="1"
              title="浏览行情"
              desc="在「行情」页面查看热门美股实时价格，点击查看详情和K线图"
            />
            <HelpItem
              num="2"
              title="模拟交易"
              desc="在「交易」页面输入股票代码，选择买入或卖出，输入数量即可交易"
            />
            <HelpItem
              num="3"
              title="查看持仓"
              desc="在「持仓」页面查看你的持仓详情、浮动盈亏和交易历史"
            />
            <HelpItem
              num="4"
              title="AI 复盘"
              desc="每次交易后，AI 会自动对你的操作进行分析和建议"
            />
            <HelpItem
              num="5"
              title="初始资金"
              desc="模拟账户初始资金 $100,000，用完可重置"
            />
          </div>
        </section>

        <section className="bg-bg-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={14} className="text-text-secondary" />
            <span className="text-xs text-text-secondary font-medium">免责声明</span>
          </div>
          <p className="text-[10px] text-text-secondary/70 leading-relaxed">
            本应用为股票模拟交易学习工具，使用真实市场数据但不涉及真实资金。
            AI 分析建议仅供学习参考，不构成投资建议。投资有风险，入市需谨慎。
          </p>
        </section>

        <div className="text-center py-4">
          <p className="text-[10px] text-text-secondary/50">
            StockSim v1.0 · 股票模拟盘
          </p>
          <p className="text-[10px] text-text-secondary/30 mt-1">
            Made with care for investment beginners
          </p>
        </div>
      </div>
    </div>
  )
}

function HelpItem({ num, title, desc }) {
  return (
    <div className="flex gap-3">
      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
        {num}
      </div>
      <div>
        <div className="text-xs font-medium text-text-primary">{title}</div>
        <div className="text-[10px] text-text-secondary leading-relaxed">{desc}</div>
      </div>
    </div>
  )
}
