const DEFAULT_CASH = 100000

const store = {
  portfolios: new Map(),
}

export function getPortfolio(userId = 'default') {
  if (!store.portfolios.has(userId)) {
    store.portfolios.set(userId, {
      cash: DEFAULT_CASH,
      holdings: {},
      transactions: [],
      createdAt: new Date().toISOString(),
    })
  }
  return store.portfolios.get(userId)
}

export function resetPortfolio(userId = 'default') {
  store.portfolios.set(userId, {
    cash: DEFAULT_CASH,
    holdings: {},
    transactions: [],
    createdAt: new Date().toISOString(),
  })
  return store.portfolios.get(userId)
}

export default store
