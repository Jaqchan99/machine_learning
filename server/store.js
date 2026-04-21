import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import supabase, { isSupabaseEnabled } from './supabase.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DEFAULT_CASH = 100000
const DATA_DIR = join(__dirname, '..', 'data')
const DATA_FILE = join(DATA_DIR, 'portfolios.json')

// ========================
//  Supabase 模式
// ========================

export async function dbGetPortfolio(userId) {
  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code === 'PGRST116') {
    const { data: newP } = await supabase
      .from('portfolios')
      .insert({ user_id: userId, cash: DEFAULT_CASH })
      .select()
      .single()
    return newP
  }
  if (error) throw error
  return data
}

export async function dbGetHoldings(userId) {
  const { data, error } = await supabase
    .from('holdings')
    .select('*')
    .eq('user_id', userId)
    .gt('shares', 0)
  if (error) throw error
  return data || []
}

export async function dbBuy(userId, symbol, name, shares, price) {
  const portfolio = await dbGetPortfolio(userId)
  const totalCost = price * shares

  if (totalCost > portfolio.cash) {
    throw new Error(`资金不足！需要 $${totalCost.toFixed(2)}，当前可用 $${portfolio.cash.toFixed(2)}`)
  }

  const newCash = portfolio.cash - totalCost
  await supabase.from('portfolios').update({ cash: newCash, updated_at: new Date().toISOString() }).eq('user_id', userId)

  const { data: existing } = await supabase
    .from('holdings')
    .select('*')
    .eq('user_id', userId)
    .eq('symbol', symbol)
    .single()

  if (existing) {
    const newShares = existing.shares + shares
    const newTotalCost = existing.total_cost + totalCost
    const newAvgCost = newTotalCost / newShares
    await supabase.from('holdings').update({
      shares: newShares, avg_cost: newAvgCost, total_cost: newTotalCost, updated_at: new Date().toISOString()
    }).eq('id', existing.id)
  } else {
    await supabase.from('holdings').insert({
      user_id: userId, symbol, name, shares, avg_cost: price, total_cost: totalCost
    })
  }

  const { data: tx } = await supabase.from('transactions').insert({
    user_id: userId, type: 'buy', symbol, name, shares, price, total: totalCost
  }).select().single()

  return { transaction: tx, cash: newCash }
}

export async function dbSell(userId, symbol, name, shares, price) {
  const { data: holding } = await supabase
    .from('holdings')
    .select('*')
    .eq('user_id', userId)
    .eq('symbol', symbol)
    .single()

  if (!holding || holding.shares < shares) {
    throw new Error(`持仓不足！当前持有 ${holding?.shares || 0} 股 ${symbol}`)
  }

  const totalRevenue = price * shares
  const costBasis = holding.avg_cost * shares
  const profit = totalRevenue - costBasis
  const profitPercent = (profit / costBasis) * 100

  const portfolio = await dbGetPortfolio(userId)
  const newCash = portfolio.cash + totalRevenue
  await supabase.from('portfolios').update({ cash: newCash, updated_at: new Date().toISOString() }).eq('user_id', userId)

  const newShares = holding.shares - shares
  if (newShares === 0) {
    await supabase.from('holdings').delete().eq('id', holding.id)
  } else {
    await supabase.from('holdings').update({
      shares: newShares, total_cost: holding.avg_cost * newShares, updated_at: new Date().toISOString()
    }).eq('id', holding.id)
  }

  const { data: tx } = await supabase.from('transactions').insert({
    user_id: userId, type: 'sell', symbol, name, shares, price,
    total: totalRevenue, profit, profit_percent: profitPercent, avg_cost: holding.avg_cost
  }).select().single()

  return { transaction: tx, cash: newCash, profit, profitPercent }
}

export async function dbGetTransactions(userId) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data || []
}

export async function dbResetPortfolio(userId) {
  await supabase.from('holdings').delete().eq('user_id', userId)
  await supabase.from('transactions').delete().eq('user_id', userId)
  await supabase.from('quests').delete().eq('user_id', userId)
  await supabase.from('portfolios').update({ cash: DEFAULT_CASH, updated_at: new Date().toISOString() }).eq('user_id', userId)
}

export async function dbGetQuests(userId) {
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return data || []
}

export async function dbCompleteQuest(userId, questKey) {
  const { data, error } = await supabase
    .from('quests')
    .upsert({ user_id: userId, quest_key: questKey, completed: true, completed_at: new Date().toISOString() },
      { onConflict: 'user_id,quest_key' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ========================
//  本地文件回退模式
// ========================

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

function loadFromDisk() {
  try {
    if (existsSync(DATA_FILE)) return JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
  } catch {}
  return {}
}

function saveToDisk(data) {
  try { writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8') } catch {}
}

const localStore = loadFromDisk()

function newPortfolio() {
  return { cash: DEFAULT_CASH, holdings: {}, transactions: [], quests: {}, createdAt: new Date().toISOString() }
}

export function getPortfolio(userId = 'default') {
  if (!localStore[userId]) {
    localStore[userId] = newPortfolio()
    saveToDisk(localStore)
  }
  return localStore[userId]
}

export function savePortfolio() {
  saveToDisk(localStore)
}

export function resetPortfolio(userId = 'default') {
  localStore[userId] = newPortfolio()
  saveToDisk(localStore)
  return localStore[userId]
}
