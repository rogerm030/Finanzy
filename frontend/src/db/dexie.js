import Dexie from 'dexie'

export const db = new Dexie('FinanzyOfflineDB')

db.version(1).stores({
  accounts: 'uuid, type, deleted, updatedAt, syncStatus',
  categories: 'uuid, type, budgetNeedType, deleted, updatedAt, syncStatus',
  transactions: 'uuid, accountUuid, categoryUuid, type, date, deleted, updatedAt, syncStatus',
  goals: 'uuid, deleted, updatedAt, syncStatus',
  debts: 'uuid, type, deleted, updatedAt, syncStatus',
  recurringRules: 'uuid, type, frequency, deleted, updatedAt, syncStatus',
  quickTemplates: 'uuid, title'
})

export function generateUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export async function ensureQuickTemplates(accounts, categories) {
  const count = await db.quickTemplates.count()
  if (count > 0) return

  const firstAcc = accounts[0]?.uuid || ''
  const foodCat = categories.find(c => c.name.toLowerCase().includes('alimenta'))?.uuid || categories[0]?.uuid || ''
  const transCat = categories.find(c => c.name.toLowerCase().includes('transporte'))?.uuid || categories[0]?.uuid || ''
  const funCat = categories.find(c => c.name.toLowerCase().includes('ocio'))?.uuid || categories[0]?.uuid || ''

  await db.quickTemplates.bulkPut([
    {
      uuid: generateUuid(),
      title: 'Café / Snack',
      amount: 3.50,
      type: 'EXPENSE',
      accountUuid: firstAcc,
      categoryUuid: funCat,
      icon: '☕',
      color: '#f59e0b',
      tags: 'cafe,diario'
    },
    {
      uuid: generateUuid(),
      title: 'Pasaje / Transporte',
      amount: 2.00,
      type: 'EXPENSE',
      accountUuid: firstAcc,
      categoryUuid: transCat,
      icon: '🚌',
      color: '#3b82f6',
      tags: 'transporte,movilidad'
    },
    {
      uuid: generateUuid(),
      title: 'Almuerzo Ejecutivo',
      amount: 8.50,
      type: 'EXPENSE',
      accountUuid: firstAcc,
      categoryUuid: foodCat,
      icon: '🍽️',
      color: '#ef4444',
      tags: 'almuerzo,comida'
    },
    {
      uuid: generateUuid(),
      title: 'Supermercado Express',
      amount: 25.00,
      type: 'EXPENSE',
      accountUuid: firstAcc,
      categoryUuid: foodCat,
      icon: '🛒',
      color: '#10b981',
      tags: 'super,casa'
    }
  ])
}
