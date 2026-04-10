import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DEFAULT_CASH = 100000
const DATA_DIR = join(__dirname, '..', 'data')
const DATA_FILE = join(DATA_DIR, 'portfolios.json')

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true })
}

function loadFromDisk() {
  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, 'utf-8')
      const parsed = JSON.parse(raw)
      return new Map(Object.entries(parsed))
    }
  } catch (err) {
    console.error('读取持仓数据失败，使用默认数据:', err.message)
  }
  return new Map()
}

function saveToDisk(portfolios) {
  try {
    const obj = Object.fromEntries(portfolios)
    writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), 'utf-8')
  } catch (err) {
    console.error('保存持仓数据失败:', err.message)
  }
}

const store = {
  portfolios: loadFromDisk(),
}

function newPortfolio() {
  return {
    cash: DEFAULT_CASH,
    holdings: {},
    transactions: [],
    createdAt: new Date().toISOString(),
  }
}

export function getPortfolio(userId = 'default') {
  if (!store.portfolios.has(userId)) {
    store.portfolios.set(userId, newPortfolio())
    saveToDisk(store.portfolios)
  }
  return store.portfolios.get(userId)
}

export function savePortfolio() {
  saveToDisk(store.portfolios)
}

export function resetPortfolio(userId = 'default') {
  store.portfolios.set(userId, newPortfolio())
  saveToDisk(store.portfolios)
  return store.portfolios.get(userId)
}

export default store
