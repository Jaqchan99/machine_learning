import React, { useState, useEffect } from 'react'
import { Sparkles, X, Loader2 } from 'lucide-react'
import { api } from '../hooks/useApi'

export default function AIReviewPanel({ transaction, apiKey, onClose }) {
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState('')

  useEffect(() => {
    loadReview()
  }, [transaction])

  const loadReview = async () => {
    setLoading(true)
    try {
      const result = await api.aiReview(transaction, apiKey)
      setReview(result.data.review)
      setSource(result.data.source)
    } catch {
      setReview('暂时无法获取AI复盘分析，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-bg-card rounded-t-2xl animate-slide-up max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold">AI 交易复盘</h3>
              <p className="text-[10px] text-text-secondary">
                {source === 'openai' ? 'Powered by GPT-4o-mini' : '智能分析引擎'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-bg-dark flex items-center justify-center text-text-secondary hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 size={24} className="text-primary animate-spin" />
              <span className="text-sm text-text-secondary">AI 正在分析你的交易...</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-bg-dark/50 rounded-xl">
                <div className="text-[10px] text-text-secondary mb-1">交易摘要</div>
                <div className="text-xs font-medium">
                  {transaction.type === 'buy' ? '买入' : '卖出'}{' '}
                  <span className="text-primary">{transaction.shares}股 {transaction.symbol}</span>
                  {' '}@ ${transaction.price?.toFixed(2)}
                  {transaction.profit !== undefined && (
                    <span className={transaction.profit >= 0 ? 'text-profit' : 'text-loss'}>
                      {' '}({transaction.profit >= 0 ? '盈利' : '亏损'} ${Math.abs(transaction.profit).toFixed(2)})
                    </span>
                  )}
                </div>
              </div>

              <div className="prose prose-sm prose-invert max-w-none">
                <div className="text-sm leading-relaxed text-text-secondary whitespace-pre-line">
                  {review}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-border">
          <button
            onClick={onClose}
            className="w-full h-10 bg-primary/10 text-primary font-semibold rounded-xl text-sm hover:bg-primary/20 transition-colors"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  )
}
