import { Router } from 'express'
import OpenAI from 'openai'
import { getPortfolio } from '../store.js'

const router = Router()

function getOpenAIClient(apiKey) {
  return new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY })
}

router.post('/review', async (req, res) => {
  try {
    const { transaction, apiKey } = req.body
    const key = apiKey || process.env.OPENAI_API_KEY

    if (!key) {
      return res.json({
        success: true,
        data: {
          review: generateLocalReview(transaction),
          source: 'local',
        },
      })
    }

    const openai = getOpenAIClient(key)
    const portfolio = getPortfolio()

    const prompt = buildReviewPrompt(transaction, portfolio)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            '你是一位专业的投资顾问和股票分析师，擅长用简洁易懂的语言为投资新手提供交易复盘分析。请用中文回答，语气友好亲切，适当使用emoji让内容更生动。分析应包含：1) 交易概述 2) 操作点评 3) 风险提示 4) 学习建议。每部分2-3句话即可，总体控制在200字以内。',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    res.json({
      success: true,
      data: {
        review: completion.choices[0].message.content,
        source: 'openai',
      },
    })
  } catch (error) {
    res.json({
      success: true,
      data: {
        review: generateLocalReview(req.body.transaction),
        source: 'local',
        fallbackReason: error.message,
      },
    })
  }
})

router.post('/market-analysis', async (req, res) => {
  try {
    const { stocks, apiKey } = req.body
    const key = apiKey || process.env.OPENAI_API_KEY

    if (!key) {
      return res.json({
        success: true,
        data: { analysis: generateLocalMarketAnalysis(stocks), source: 'local' },
      })
    }

    const openai = getOpenAIClient(key)
    const stockInfo = stocks
      .map((s) => `${s.name}(${s.symbol}): $${s.price?.toFixed(2)}, 涨跌${s.changePercent?.toFixed(2)}%`)
      .join('\n')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            '你是一位亲切的投资顾问，为投资新手提供每日市场简报。请用简洁易懂的中文分析当前市场行情，控制在150字以内。',
        },
        {
          role: 'user',
          content: `以下是今日部分热门股票行情：\n${stockInfo}\n\n请给出简短的市场分析和操作建议。`,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    })

    res.json({
      success: true,
      data: { analysis: completion.choices[0].message.content, source: 'openai' },
    })
  } catch (error) {
    res.json({
      success: true,
      data: {
        analysis: generateLocalMarketAnalysis(req.body.stocks),
        source: 'local',
      },
    })
  }
})

function buildReviewPrompt(transaction, portfolio) {
  const { type, symbol, name, shares, price, total, profit, profitPercent, avgCost } = transaction

  let prompt = `我刚刚进行了一笔交易：\n`
  prompt += `- 操作：${type === 'buy' ? '买入' : '卖出'}\n`
  prompt += `- 股票：${name}（${symbol}）\n`
  prompt += `- 数量：${shares}股\n`
  prompt += `- 成交价：$${price?.toFixed(2)}\n`
  prompt += `- 成交金额：$${total?.toFixed(2)}\n`

  if (type === 'sell' && profit !== undefined) {
    prompt += `- 盈亏：${profit >= 0 ? '盈利' : '亏损'} $${Math.abs(profit).toFixed(2)} (${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%)\n`
    prompt += `- 成本均价：$${avgCost?.toFixed(2)}\n`
  }

  prompt += `\n当前账户：\n`
  prompt += `- 可用资金：$${portfolio.cash.toFixed(2)}\n`
  prompt += `- 持仓数量：${Object.keys(portfolio.holdings).length}只股票\n`

  prompt += `\n请对这次交易进行复盘分析。`
  return prompt
}

function generateLocalReview(transaction) {
  if (!transaction) return '暂无交易数据可分析。'

  const { type, symbol, name, shares, price, profit, profitPercent } = transaction

  if (type === 'buy') {
    const tips = [
      `📊 你买入了 ${shares} 股 ${name}（${symbol}），成交价 $${price?.toFixed(2)}。`,
      `\n💡 **操作点评**：买入操作已完成。建议设定好止盈止损点位，不要频繁查看盘面波动。`,
      `\n⚠️ **风险提示**：单只股票仓位建议不超过总资金的30%，注意分散投资降低风险。`,
      `\n📚 **学习建议**：建议了解该公司的基本面（财报、行业前景），做到心中有数。`,
    ]
    return tips.join('')
  }

  if (type === 'sell') {
    const profitStr = profit >= 0 ? `盈利 $${Math.abs(profit).toFixed(2)}` : `亏损 $${Math.abs(profit).toFixed(2)}`
    const tips = [
      `📊 你卖出了 ${shares} 股 ${name}（${symbol}），${profitStr}（${profitPercent >= 0 ? '+' : ''}${profitPercent?.toFixed(2)}%）。`,
    ]

    if (profit >= 0) {
      tips.push(`\n🎉 **操作点评**：恭喜获利！及时止盈是好习惯。不过也要反思是否卖早了，错过更多收益。`)
      tips.push(`\n💡 **学习建议**：记录你的卖出理由，日后回顾时可以不断优化自己的交易策略。`)
    } else {
      tips.push(`\n🤔 **操作点评**：本次交易产生亏损，不要灰心。及时止损同样是一种智慧。`)
      tips.push(`\n💡 **学习建议**：反思买入时的决策依据是否充分，下次可以更谨慎地评估入场时机。`)
    }
    tips.push(`\n⚠️ **风险提示**：避免情绪化交易，每次操作前先想清楚逻辑再行动。`)
    return tips.join('')
  }

  return '交易已记录，继续加油！'
}

function generateLocalMarketAnalysis(stocks) {
  if (!stocks || stocks.length === 0) return '暂无市场数据。'

  const gainers = stocks.filter((s) => s.changePercent > 0).length
  const losers = stocks.filter((s) => s.changePercent < 0).length
  const topGainer = stocks.reduce((a, b) => ((a.changePercent || 0) > (b.changePercent || 0) ? a : b))
  const topLoser = stocks.reduce((a, b) => ((a.changePercent || 0) < (b.changePercent || 0) ? a : b))

  let analysis = `📈 **今日市场概览**\n\n`
  analysis += `热门股中 ${gainers} 只上涨，${losers} 只下跌。`

  if (topGainer.changePercent > 0) {
    analysis += `领涨：${topGainer.name}（+${topGainer.changePercent?.toFixed(2)}%）。`
  }
  if (topLoser.changePercent < 0) {
    analysis += `领跌：${topLoser.name}（${topLoser.changePercent?.toFixed(2)}%）。`
  }

  analysis += `\n\n💡 **建议**：市场波动是常态，新手投资者建议以学习为主，小仓位试水，不追涨杀跌。`

  return analysis
}

export default router
