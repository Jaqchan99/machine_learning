import React, { useState, useEffect, useCallback } from 'react'
import { Target, CheckCircle, Circle, ChevronDown, ChevronUp, Trophy, Star, Zap, Eye, ShoppingCart, PieChart, TrendingUp, Sparkles, BarChart3 } from 'lucide-react'
import { api } from '../hooks/useApi'

const QUEST_LIST = [
  {
    key: 'view_stock',
    title: '初识行情',
    desc: '点进任意一只股票，查看详情页',
    tip: '了解一只股票的基本信息：价格、涨跌、K线图',
    icon: Eye,
    reward: '🎓 学会看盘',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    key: 'first_buy',
    title: '第一笔买入',
    desc: '买入任意一只股票（不限数量）',
    tip: '去「交易」页面，输入股票代码和数量，点击买入',
    icon: ShoppingCart,
    reward: '🛒 成功下单',
    color: 'from-red-500 to-orange-500',
  },
  {
    key: 'check_portfolio',
    title: '查看持仓',
    desc: '去「持仓」页面查看你的持有情况',
    tip: '买入后，在持仓页面可以看到浮动盈亏',
    icon: PieChart,
    reward: '📊 持仓分析',
    color: 'from-purple-500 to-pink-500',
  },
  {
    key: 'diversify',
    title: '分散投资',
    desc: '同时持有 3 只不同股票',
    tip: '不把鸡蛋放在一个篮子里，降低风险',
    icon: BarChart3,
    reward: '🎯 风险管理',
    color: 'from-teal-500 to-emerald-500',
  },
  {
    key: 'first_sell',
    title: '止盈离场',
    desc: '卖出一只盈利的股票',
    tip: '会卖的才是师傅，适时落袋为安',
    icon: TrendingUp,
    reward: '💰 首次获利',
    color: 'from-green-500 to-lime-500',
  },
  {
    key: 'ai_review',
    title: 'AI 复盘',
    desc: '交易后查看一次 AI 分析',
    tip: '每笔交易后会自动弹出AI复盘，仔细阅读建议',
    icon: Sparkles,
    reward: '🤖 智能辅助',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    key: 'ten_trades',
    title: '投资老手',
    desc: '累计完成 10 笔交易',
    tip: '多交易多复盘，在实践中学习成长',
    icon: Trophy,
    reward: '🏆 交易达人',
    color: 'from-amber-500 to-yellow-500',
  },
]

export default function QuestPanel({ questEvents }) {
  const [quests, setQuests] = useState({})
  const [expanded, setExpanded] = useState(true)
  const [justCompleted, setJustCompleted] = useState(null)

  const loadQuests = useCallback(async () => {
    try {
      const result = await api.getQuests()
      const map = {}
      result.data.forEach((q) => { map[q.quest_key] = q.completed })
      setQuests(map)
    } catch {}
  }, [])

  useEffect(() => {
    loadQuests()
  }, [loadQuests])

  useEffect(() => {
    if (!questEvents) return
    const check = async () => {
      const { type, data } = questEvents
      let toComplete = null

      if (type === 'view_stock' && !quests['view_stock']) toComplete = 'view_stock'
      if (type === 'buy' && !quests['first_buy']) toComplete = 'first_buy'
      if (type === 'view_portfolio' && !quests['check_portfolio']) toComplete = 'check_portfolio'
      if (type === 'diversify' && !quests['diversify']) toComplete = 'diversify'
      if (type === 'sell_profit' && !quests['first_sell']) toComplete = 'first_sell'
      if (type === 'ai_review' && !quests['ai_review']) toComplete = 'ai_review'
      if (type === 'ten_trades' && !quests['ten_trades']) toComplete = 'ten_trades'

      if (toComplete) {
        try {
          await api.completeQuest(toComplete)
          setQuests((prev) => ({ ...prev, [toComplete]: true }))
          setJustCompleted(toComplete)
          setTimeout(() => setJustCompleted(null), 3000)
        } catch {}
      }
    }
    check()
  }, [questEvents])

  const completedCount = QUEST_LIST.filter((q) => quests[q.key]).length
  const totalCount = QUEST_LIST.length
  const progress = (completedCount / totalCount) * 100

  if (completedCount === totalCount && !expanded) return null

  return (
    <div className="mb-4">
      {justCompleted && (
        <div className="mb-3 p-3 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-xl animate-fade-in flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-lg">
            {QUEST_LIST.find((q) => q.key === justCompleted)?.reward?.slice(0, 2)}
          </div>
          <div>
            <div className="text-sm font-bold text-amber-400">任务完成！</div>
            <div className="text-xs text-text-secondary">{QUEST_LIST.find((q) => q.key === justCompleted)?.title}</div>
          </div>
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-bg-card rounded-xl"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Target size={16} className="text-white" />
          </div>
          <div className="text-left">
            <div className="text-sm font-bold">新手任务</div>
            <div className="text-[10px] text-text-secondary">{completedCount}/{totalCount} 已完成</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-20 h-1.5 bg-bg-dark rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          {expanded ? <ChevronUp size={16} className="text-text-secondary" /> : <ChevronDown size={16} className="text-text-secondary" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5 animate-fade-in">
          {QUEST_LIST.map((quest) => {
            const done = quests[quest.key]
            const Icon = quest.icon
            const isJust = justCompleted === quest.key
            return (
              <div
                key={quest.key}
                className={`p-3 rounded-xl transition-all ${done ? 'bg-bg-card/50' : 'bg-bg-card'} ${isJust ? 'ring-1 ring-amber-500/50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${done ? 'bg-green-500/20' : `bg-gradient-to-br ${quest.color} opacity-80`}`}>
                    {done ? <CheckCircle size={16} className="text-green-400" /> : <Icon size={16} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${done ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                        {quest.title}
                      </span>
                      {done && <span className="text-[10px]">{quest.reward}</span>}
                    </div>
                    <span className="text-[10px] text-text-secondary">{done ? quest.tip : quest.desc}</span>
                  </div>
                  {!done && <Circle size={14} className="text-text-secondary/30 shrink-0" />}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
