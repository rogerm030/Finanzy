import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, generateUuid, ensureQuickTemplates } from '../db/dexie'
import { useThemeStore } from './themeStore'

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'Dólar Estadounidense (USD)' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
  { code: 'PEN', symbol: 'S/', name: 'Sol Peruano (PEN)' },
  { code: 'MXN', symbol: '$', name: 'Peso Mexicano (MXN)' },
  { code: 'COP', symbol: '$', name: 'Peso Colombiano (COP)' },
  { code: 'ARS', symbol: '$', name: 'Peso Argentino (ARS)' },
  { code: 'CLP', symbol: '$', name: 'Peso Chileno (CLP)' },
  { code: 'BRL', symbol: 'R$', name: 'Real Brasileño (BRL)' },
  { code: 'GBP', symbol: '£', name: 'Libra Esterlina (GBP)' }
]

function parseJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

export const useFinanceStore = defineStore('finance', () => {
  const themeStore = useThemeStore()

  // Auth & Sync state
  const token = ref(localStorage.getItem('finanzy_jwt') || '')
  const user = ref(JSON.parse(localStorage.getItem('finanzy_user') || 'null'))
  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const backendReachable = ref(false)
  const isSyncing = ref(false)
  const lastSyncedAt = ref(Number(localStorage.getItem('finanzy_last_sync') || 0))
  const syncError = ref('')

  // Reactive collections loaded from Dexie IndexedDB
  const accounts = ref([])
  const categories = ref([])
  const transactions = ref([])
  const goals = ref([])
  const debts = ref([])
  const recurringRules = ref([])
  const quickTemplates = ref([])

  // Selected Month filter (YYYY-MM)
  const now = new Date()
  const selectedMonth = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

  // Check if JWT is locally valid (Offline Login Validation)
  const isAuthenticated = computed(() => {
    if (!token.value || !user.value) return false
    if (token.value.startsWith('offline-local-token')) return true
    const payload = parseJwtPayload(token.value)
    if (!payload || !payload.exp) return true
    return payload.exp * 1000 > Date.now()
  })

  const currencySymbol = computed(() => {
    const code = user.value?.currency || 'USD'
    const found = CURRENCIES.find(c => c.code === code)
    return found ? found.symbol : '$'
  })

  const pendingSyncCount = computed(() => {
    const countPending = arr => arr.filter(i => i.syncStatus === 'pending').length
    return (
      countPending(accounts.value) +
      countPending(categories.value) +
      countPending(transactions.value) +
      countPending(goals.value) +
      countPending(debts.value) +
      countPending(recurringRules.value)
    )
  })

  // Format currency helper
  function formatMoney(val) {
    const num = Number(val || 0)
    return `${currencySymbol.value}${num.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  // Load all data from local Dexie IndexedDB into reactive state
  async function loadFromLocalDB() {
    const [acc, cat, tx, gl, dbts, rec, tmpl] = await Promise.all([
      db.accounts.toArray(),
      db.categories.toArray(),
      db.transactions.toArray(),
      db.goals.toArray(),
      db.debts.toArray(),
      db.recurringRules.toArray(),
      db.quickTemplates.toArray()
    ])

    accounts.value = acc.filter(a => !a.deleted)
    categories.value = cat.filter(c => !c.deleted)
    transactions.value = tx
      .filter(t => !t.deleted)
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.updatedAt || 0) - (a.updatedAt || 0))
    goals.value = gl.filter(g => !g.deleted)
    debts.value = dbts.filter(d => !d.deleted)
    recurringRules.value = rec.filter(r => !r.deleted)
    quickTemplates.value = tmpl

    if (accounts.value.length > 0 && categories.value.length > 0 && quickTemplates.value.length === 0) {
      await ensureQuickTemplates(accounts.value, categories.value)
      quickTemplates.value = await db.quickTemplates.toArray()
    }
  }

  // Seed rich local fallback data if user enters offline or backend is down
  async function seedOfflineDemoDataIfNeeded() {
    const existingCats = await db.categories.count()
    if (existingCats > 0) {
      await loadFromLocalDB()
      return
    }

    const nowTs = Date.now()
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const prevDate = new Date(yyyy, today.getMonth() - 1, 15)
    const prevYyyy = prevDate.getFullYear()
    const prevMm = String(prevDate.getMonth() + 1).padStart(2, '0')

    const accBank = { uuid: generateUuid(), name: 'Banco Principal', type: 'BANK', balance: 3450, initialBalance: 3450, currency: 'USD', color: '#3b82f6', icon: 'landmark', includeInNetWorth: true, deleted: false, updatedAt: nowTs, syncStatus: 'pending' }
    const accCash = { uuid: generateUuid(), name: 'Efectivo Billetera', type: 'CASH', balance: 280, initialBalance: 280, currency: 'USD', color: '#10b981', icon: 'wallet', includeInNetWorth: true, deleted: false, updatedAt: nowTs, syncStatus: 'pending' }
    const accCard = { uuid: generateUuid(), name: 'Tarjeta Visa Oro', type: 'CREDIT_CARD', balance: -420, initialBalance: -420, currency: 'USD', color: '#8b5cf6', icon: 'credit-card', creditLimit: 3000, cutoffDay: 15, paymentDay: 5, includeInNetWorth: true, deleted: false, updatedAt: nowTs, syncStatus: 'pending' }
    const accSav = { uuid: generateUuid(), name: 'Fondo de Ahorro', type: 'SAVINGS', balance: 5200, initialBalance: 5200, currency: 'USD', color: '#f59e0b', icon: 'piggy-bank', includeInNetWorth: true, deleted: false, updatedAt: nowTs, syncStatus: 'pending' }

    await db.accounts.bulkPut([accBank, accCash, accCard, accSav])

    const cFood = { uuid: generateUuid(), name: 'Alimentación y Super', type: 'EXPENSE', icon: 'utensils', color: '#ef4444', budgetNeedType: 'NEEDS', monthlyBudget: 500, deleted: false, updatedAt: nowTs, syncStatus: 'pending' }
    const cHome = { uuid: generateUuid(), name: 'Vivienda y Servicios', type: 'EXPENSE', icon: 'home', color: '#3b82f6', budgetNeedType: 'NEEDS', monthlyBudget: 700, deleted: false, updatedAt: nowTs, syncStatus: 'pending' }
    const cTrans = { uuid: generateUuid(), name: 'Transporte y Gasolina', type: 'EXPENSE', icon: 'car', color: '#f59e0b', budgetNeedType: 'NEEDS', monthlyBudget: 220, deleted: false, updatedAt: nowTs, syncStatus: 'pending' }
    const cHealth = { uuid: generateUuid(), name: 'Salud y Farmacia', type: 'EXPENSE', icon: 'heart-pulse', color: '#10b981', budgetNeedType: 'NEEDS', monthlyBudget: 150, deleted: false, updatedAt: nowTs, syncStatus: 'pending' }
    const cFun = { uuid: generateUuid(), name: 'Ocio y Restaurantes', type: 'EXPENSE', icon: 'gamepad-2', color: '#ec4899', budgetNeedType: 'WANTS', monthlyBudget: 250, deleted: false, updatedAt: nowTs, syncStatus: 'pending' }
    const cShop = { uuid: generateUuid(), name: 'Compras y Tecnología', type: 'EXPENSE', icon: 'shopping-bag', color: '#8b5cf6', budgetNeedType: 'WANTS', monthlyBudget: 300, deleted: false, updatedAt: nowTs, syncStatus: 'pending' }
    const cSubs = { uuid: generateUuid(), name: 'Suscripciones y Apps', type: 'EXPENSE', icon: 'tv', color: '#06b6d4', budgetNeedType: 'WANTS', monthlyBudget: 80, deleted: false, updatedAt: nowTs, syncStatus: 'pending' }
    const cInv = { uuid: generateUuid(), name: 'Ahorro e Inversión', type: 'EXPENSE', icon: 'trending-up', color: '#14b8a6', budgetNeedType: 'SAVINGS', monthlyBudget: 600, deleted: false, updatedAt: nowTs, syncStatus: 'pending' }
    const cSal = { uuid: generateUuid(), name: 'Salario Mensual', type: 'INCOME', icon: 'briefcase', color: '#10b981', budgetNeedType: 'SAVINGS', monthlyBudget: 0, deleted: false, updatedAt: nowTs, syncStatus: 'pending' }
    const cFree = { uuid: generateUuid(), name: 'Proyectos Freelance', type: 'INCOME', icon: 'laptop', color: '#6366f1', budgetNeedType: 'SAVINGS', monthlyBudget: 0, deleted: false, updatedAt: nowTs, syncStatus: 'pending' }

    await db.categories.bulkPut([cFood, cHome, cTrans, cHealth, cFun, cShop, cSubs, cInv, cSal, cFree])

    const sampleTxs = [
      { uuid: generateUuid(), accountUuid: accBank.uuid, categoryUuid: cSal.uuid, type: 'INCOME', amount: 2800, description: 'Sueldo Mensual Empresa', date: `${yyyy}-${mm}-01`, tags: 'sueldo,fijo', paymentMethod: 'Transferencia', merchant: 'Empresa Tech', deleted: false, updatedAt: nowTs, syncStatus: 'pending' },
      { uuid: generateUuid(), accountUuid: accBank.uuid, categoryUuid: cFree.uuid, type: 'INCOME', amount: 650, description: 'Consultoría Desarrollo PWA', date: `${yyyy}-${mm}-05`, tags: 'freelance,extra', paymentMethod: 'Transferencia', merchant: 'Cliente Global', deleted: false, updatedAt: nowTs, syncStatus: 'pending' },
      { uuid: generateUuid(), accountUuid: accBank.uuid, categoryUuid: cHome.uuid, type: 'EXPENSE', amount: 620, description: 'Alquiler y Mantenimiento', date: `${yyyy}-${mm}-02`, tags: 'hogar,fijo', paymentMethod: 'Transferencia', merchant: 'Inmobiliaria', deleted: false, updatedAt: nowTs, syncStatus: 'pending' },
      { uuid: generateUuid(), accountUuid: accCard.uuid, categoryUuid: cFood.uuid, type: 'EXPENSE', amount: 185.50, description: 'Compra quincenal supermercado', date: `${yyyy}-${mm}-04`, tags: 'supermercado,casa', paymentMethod: 'Tarjeta Crédito', merchant: 'Supermercado Central', deleted: false, updatedAt: nowTs, syncStatus: 'pending' },
      { uuid: generateUuid(), accountUuid: accCash.uuid, categoryUuid: cTrans.uuid, type: 'EXPENSE', amount: 65, description: 'Combustible y movilidad', date: `${yyyy}-${mm}-06`, tags: 'auto,gasolina', paymentMethod: 'Efectivo', merchant: 'Estación Primax', deleted: false, updatedAt: nowTs, syncStatus: 'pending' },
      { uuid: generateUuid(), accountUuid: accCard.uuid, categoryUuid: cFun.uuid, type: 'EXPENSE', amount: 92, description: 'Cena fin de semana con amigos', date: `${yyyy}-${mm}-08`, tags: 'cena,amigos', paymentMethod: 'Tarjeta Crédito', merchant: 'Trattoria Roma', deleted: false, updatedAt: nowTs, syncStatus: 'pending' },
      { uuid: generateUuid(), accountUuid: accCard.uuid, categoryUuid: cSubs.uuid, type: 'EXPENSE', amount: 34.90, description: 'Netflix + Spotify + Cloud', date: `${yyyy}-${mm}-10`, tags: 'streaming,mensual', paymentMethod: 'Tarjeta Crédito', merchant: 'Servicios Digitales', deleted: false, updatedAt: nowTs, syncStatus: 'pending' },
      { uuid: generateUuid(), accountUuid: accBank.uuid, categoryUuid: cInv.uuid, type: 'EXPENSE', amount: 450, description: 'Aporte mensual ETF S&P 500', date: `${yyyy}-${mm}-11`, tags: 'inversion,futuro', paymentMethod: 'Transferencia', merchant: 'Broker Global', deleted: false, updatedAt: nowTs, syncStatus: 'pending' },
      { uuid: generateUuid(), accountUuid: accBank.uuid, categoryUuid: cSal.uuid, type: 'INCOME', amount: 2800, description: 'Sueldo Mensual', date: `${prevYyyy}-${prevMm}-01`, tags: 'sueldo', paymentMethod: 'Transferencia', merchant: 'Empresa Tech', deleted: false, updatedAt: nowTs, syncStatus: 'pending' },
      { uuid: generateUuid(), accountUuid: accBank.uuid, categoryUuid: cHome.uuid, type: 'EXPENSE', amount: 620, description: 'Alquiler y Servicios', date: `${prevYyyy}-${prevMm}-03`, tags: 'hogar', paymentMethod: 'Transferencia', merchant: 'Inmobiliaria', deleted: false, updatedAt: nowTs, syncStatus: 'pending' },
      { uuid: generateUuid(), accountUuid: accCard.uuid, categoryUuid: cFood.uuid, type: 'EXPENSE', amount: 390, description: 'Supermercado del mes', date: `${prevYyyy}-${prevMm}-14`, tags: 'comida', paymentMethod: 'Tarjeta Crédito', merchant: 'Supermercado', deleted: false, updatedAt: nowTs, syncStatus: 'pending' },
      { uuid: generateUuid(), accountUuid: accBank.uuid, categoryUuid: cInv.uuid, type: 'EXPENSE', amount: 400, description: 'Ahorro programado', date: `${prevYyyy}-${prevMm}-22`, tags: 'ahorro', paymentMethod: 'Transferencia', merchant: 'Fondo Mutuo', deleted: false, updatedAt: nowTs, syncStatus: 'pending' }
    ]
    await db.transactions.bulkPut(sampleTxs)

    await db.goals.bulkPut([
      { uuid: generateUuid(), name: 'Fondo de Emergencia (6 meses)', targetAmount: 6000, currentAmount: 4200, deadline: `${yyyy + 1}-04-01`, icon: 'shield-check', color: '#10b981', deleted: false, updatedAt: nowTs, syncStatus: 'pending' },
      { uuid: generateUuid(), name: 'Viaje a Europa', targetAmount: 3500, currentAmount: 1450, deadline: `${yyyy + 1}-08-15`, icon: 'plane', color: '#3b82f6', deleted: false, updatedAt: nowTs, syncStatus: 'pending' },
      { uuid: generateUuid(), name: 'Renovar Laptop Pro', targetAmount: 2200, currentAmount: 980, deadline: `${yyyy + 1}-02-28`, icon: 'laptop', color: '#8b5cf6', deleted: false, updatedAt: nowTs, syncStatus: 'pending' }
    ])

    await db.debts.bulkPut([
      { uuid: generateUuid(), personName: 'Carlos Mendoza (Préstamo)', type: 'OWED_TO_ME', totalAmount: 300, paidAmount: 120, dueDate: `${yyyy}-${mm}-28`, notes: 'Préstamo para entradas', color: '#10b981', deleted: false, updatedAt: nowTs, syncStatus: 'pending' },
      { uuid: generateUuid(), personName: 'Cuota sin intereses TV', type: 'I_OWE', totalAmount: 600, paidAmount: 350, dueDate: `${yyyy}-${mm}-25`, notes: 'Cuotas restantes en tarjeta', color: '#f59e0b', deleted: false, updatedAt: nowTs, syncStatus: 'pending' }
    ])

    await db.recurringRules.bulkPut([
      { uuid: generateUuid(), title: 'Alquiler Departamento', type: 'EXPENSE', amount: 620, accountUuid: accBank.uuid, categoryUuid: cHome.uuid, frequency: 'MONTHLY', nextDueDate: `${yyyy}-${mm}-02`, autoCreate: true, active: true, deleted: false, updatedAt: nowTs, syncStatus: 'pending' },
      { uuid: generateUuid(), title: 'Netflix + Spotify', type: 'EXPENSE', amount: 34.90, accountUuid: accCard.uuid, categoryUuid: cSubs.uuid, frequency: 'MONTHLY', nextDueDate: `${yyyy}-${mm}-10`, autoCreate: true, active: true, deleted: false, updatedAt: nowTs, syncStatus: 'pending' },
      { uuid: generateUuid(), title: 'Sueldo Nómina', type: 'INCOME', amount: 2800, accountUuid: accBank.uuid, categoryUuid: cSal.uuid, frequency: 'MONTHLY', nextDueDate: `${yyyy}-${mm}-01`, autoCreate: true, active: true, deleted: false, updatedAt: nowTs, syncStatus: 'pending' }
    ])

    await loadFromLocalDB()
  }

  // Auth Actions
  async function login(email, password) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Credenciales inválidas')
      }
      const data = await res.json()
      saveAuthSession(data.token, data.user)
      backendReachable.value = true
      await syncWithBackend()
      return { ok: true }
    } catch (e) {
      // If offline or server unreachable and user uses demo account, allow seamless offline demo mode!
      if (email.toLowerCase() === 'demo@finanzy.app' && (e.message.includes('Failed to fetch') || e.message.includes('NetworkError'))) {
        return await startOfflineDemoSession()
      }
      return { ok: false, message: e.message || 'Error al iniciar sesión' }
    }
  }

  async function register(payload) {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'No se pudo registrar el usuario')
      }
      const data = await res.json()
      saveAuthSession(data.token, data.user)
      backendReachable.value = true
      await syncWithBackend()
      return { ok: true }
    } catch (e) {
      if (e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
        // Offline local registration fallback
        const localUser = {
          uuid: generateUuid(),
          name: payload.name || 'Usuario Offline',
          email: payload.email || 'local@finanzy.app',
          currency: payload.currency || 'USD',
          themeMode: themeStore.themeMode,
          accentColor: themeStore.accentColor,
          budgetRuleNeeds: 50,
          budgetRuleWants: 30,
          budgetRuleSavings: 20
        }
        saveAuthSession('offline-local-token-' + Date.now(), localUser)
        await seedOfflineDemoDataIfNeeded()
        return { ok: true, offlineFallback: true }
      }
      return { ok: false, message: e.message }
    }
  }

  async function startOfflineDemoSession() {
    const demoUser = {
      uuid: 'demo-local-uuid',
      name: 'Roger (Modo Demo / Offline)',
      email: 'demo@finanzy.app',
      currency: 'USD',
      themeMode: themeStore.themeMode,
      accentColor: themeStore.accentColor,
      budgetRuleNeeds: 50,
      budgetRuleWants: 30,
      budgetRuleSavings: 20
    }
    saveAuthSession('offline-local-token-' + Date.now(), demoUser)
    await seedOfflineDemoDataIfNeeded()
    return { ok: true, offlineFallback: true }
  }

  function saveAuthSession(jwt, userObj) {
    token.value = jwt
    user.value = userObj
    localStorage.setItem('finanzy_jwt', jwt)
    localStorage.setItem('finanzy_user', JSON.stringify(userObj))
    if (userObj.themeMode) themeStore.setThemeMode(userObj.themeMode)
    if (userObj.accentColor) themeStore.setAccentColor(userObj.accentColor)
  }

  async function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('finanzy_jwt')
    localStorage.removeItem('finanzy_user')
  }

  // Bidirectional Offline-First Sync with Spring Boot (/api/sync)
  async function syncWithBackend() {
    if (!token.value || token.value.startsWith('offline-local-token')) {
      await loadFromLocalDB()
      return { synced: false, reason: 'local-token' }
    }
    if (!navigator.onLine) {
      isOnline.value = false
      await loadFromLocalDB()
      return { synced: false, reason: 'offline' }
    }

    isSyncing.value = true
    syncError.value = ''

    try {
      const [allAcc, allCat, allTx, allGoals, allDebts, allRec] = await Promise.all([
        db.accounts.toArray(),
        db.categories.toArray(),
        db.transactions.toArray(),
        db.goals.toArray(),
        db.debts.toArray(),
        db.recurringRules.toArray()
      ])

      const payload = {
        accounts: allAcc,
        categories: allCat,
        transactions: allTx,
        goals: allGoals,
        debts: allDebts,
        recurringRules: allRec,
        preferences: {
          name: user.value?.name,
          currency: user.value?.currency || 'USD',
          themeMode: themeStore.themeMode,
          accentColor: themeStore.accentColor,
          budgetRuleNeeds: user.value?.budgetRuleNeeds || 50,
          budgetRuleWants: user.value?.budgetRuleWants || 30,
          budgetRuleSavings: user.value?.budgetRuleSavings || 20
        }
      }

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.value}`
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const serverState = await res.json()
      backendReachable.value = true

      if (serverState.user) {
        user.value = serverState.user
        localStorage.setItem('finanzy_user', JSON.stringify(serverState.user))
      }

      const markSynced = list => (list || []).map(item => ({ ...item, syncStatus: 'synced' }))

      await db.transaction('rw', [db.accounts, db.categories, db.transactions, db.goals, db.debts, db.recurringRules], async () => {
        if (serverState.accounts) await db.accounts.bulkPut(markSynced(serverState.accounts))
        if (serverState.categories) await db.categories.bulkPut(markSynced(serverState.categories))
        if (serverState.transactions) await db.transactions.bulkPut(markSynced(serverState.transactions))
        if (serverState.goals) await db.goals.bulkPut(markSynced(serverState.goals))
        if (serverState.debts) await db.debts.bulkPut(markSynced(serverState.debts))
        if (serverState.recurringRules) await db.recurringRules.bulkPut(markSynced(serverState.recurringRules))
      })

      lastSyncedAt.value = Date.now()
      localStorage.setItem('finanzy_last_sync', String(lastSyncedAt.value))
      await loadFromLocalDB()
      return { synced: true }
    } catch (err) {
      backendReachable.value = false
      syncError.value = 'Trabajando en Modo Offline local'
      await loadFromLocalDB()
      return { synced: false, error: err.message }
    } finally {
      isSyncing.value = false
    }
  }

  // CRUD Operations (Save locally to Dexie immediately, then trigger background sync)
  async function saveTransaction(txData) {
    const isEdit = Boolean(txData.uuid)
    const nowTs = Date.now()

    if (isEdit) {
      const oldTx = await db.transactions.get(txData.uuid)
      if (oldTx && !oldTx.deleted) {
        await revertAccountBalance(oldTx)
      }
    }

    const record = {
      uuid: txData.uuid || generateUuid(),
      accountUuid: txData.accountUuid,
      toAccountUuid: txData.type === 'TRANSFER' ? txData.toAccountUuid : null,
      categoryUuid: txData.type === 'TRANSFER' ? null : txData.categoryUuid,
      type: txData.type || 'EXPENSE',
      amount: Number(txData.amount || 0),
      description: (txData.description || '').trim() || 'Movimiento',
      notes: txData.notes || '',
      date: txData.date || new Date().toISOString().slice(0, 10),
      tags: txData.tags || '',
      paymentMethod: txData.paymentMethod || 'Efectivo',
      merchant: txData.merchant || '',
      receiptDataUrl: txData.receiptDataUrl || '',
      customFieldsJson: txData.customFieldsJson || '{}',
      deleted: false,
      updatedAt: nowTs,
      syncStatus: 'pending'
    }

    await db.transactions.put(record)
    await applyAccountBalance(record)
    await loadFromLocalDB()
    syncWithBackend()
    return record
  }

  async function deleteTransaction(uuid) {
    const existing = await db.transactions.get(uuid)
    if (!existing) return
    if (!existing.deleted) {
      await revertAccountBalance(existing)
    }
    existing.deleted = true
    existing.updatedAt = Date.now()
    existing.syncStatus = 'pending'
    await db.transactions.put(existing)
    await loadFromLocalDB()
    syncWithBackend()
  }

  async function applyAccountBalance(tx) {
    const amt = Number(tx.amount || 0)
    if (tx.accountUuid) {
      const acc = await db.accounts.get(tx.accountUuid)
      if (acc) {
        if (tx.type === 'INCOME') acc.balance = Number(acc.balance || 0) + amt
        else if (tx.type === 'EXPENSE' || tx.type === 'TRANSFER') acc.balance = Number(acc.balance || 0) - amt
        acc.updatedAt = Date.now()
        acc.syncStatus = 'pending'
        await db.accounts.put(acc)
      }
    }
    if (tx.type === 'TRANSFER' && tx.toAccountUuid) {
      const toAcc = await db.accounts.get(tx.toAccountUuid)
      if (toAcc) {
        toAcc.balance = Number(toAcc.balance || 0) + amt
        toAcc.updatedAt = Date.now()
        toAcc.syncStatus = 'pending'
        await db.accounts.put(toAcc)
      }
    }
  }

  async function revertAccountBalance(tx) {
    const amt = Number(tx.amount || 0)
    if (tx.accountUuid) {
      const acc = await db.accounts.get(tx.accountUuid)
      if (acc) {
        if (tx.type === 'INCOME') acc.balance = Number(acc.balance || 0) - amt
        else if (tx.type === 'EXPENSE' || tx.type === 'TRANSFER') acc.balance = Number(acc.balance || 0) + amt
        acc.updatedAt = Date.now()
        acc.syncStatus = 'pending'
        await db.accounts.put(acc)
      }
    }
    if (tx.type === 'TRANSFER' && tx.toAccountUuid) {
      const toAcc = await db.accounts.get(tx.toAccountUuid)
      if (toAcc) {
        toAcc.balance = Number(toAcc.balance || 0) - amt
        toAcc.updatedAt = Date.now()
        toAcc.syncStatus = 'pending'
        await db.accounts.put(toAcc)
      }
    }
  }

  async function saveAccount(accData) {
    const nowTs = Date.now()
    const record = {
      uuid: accData.uuid || generateUuid(),
      name: accData.name,
      type: accData.type || 'BANK',
      balance: Number(accData.balance || 0),
      initialBalance: Number(accData.initialBalance ?? accData.balance ?? 0),
      currency: accData.currency || user.value?.currency || 'USD',
      color: accData.color || '#3b82f6',
      icon: accData.icon || 'wallet',
      creditLimit: accData.creditLimit ? Number(accData.creditLimit) : null,
      cutoffDay: accData.cutoffDay ? Number(accData.cutoffDay) : null,
      paymentDay: accData.paymentDay ? Number(accData.paymentDay) : null,
      includeInNetWorth: accData.includeInNetWorth !== false,
      deleted: false,
      updatedAt: nowTs,
      syncStatus: 'pending'
    }
    await db.accounts.put(record)
    await loadFromLocalDB()
    syncWithBackend()
  }

  async function deleteAccount(uuid) {
    const existing = await db.accounts.get(uuid)
    if (!existing) return
    existing.deleted = true
    existing.updatedAt = Date.now()
    existing.syncStatus = 'pending'
    await db.accounts.put(existing)
    await loadFromLocalDB()
    syncWithBackend()
  }

  async function saveCategory(catData) {
    const record = {
      uuid: catData.uuid || generateUuid(),
      name: catData.name,
      type: catData.type || 'EXPENSE',
      icon: catData.icon || 'tag',
      color: catData.color || '#6366f1',
      budgetNeedType: catData.budgetNeedType || 'NEEDS',
      monthlyBudget: Number(catData.monthlyBudget || 0),
      parentUuid: catData.parentUuid || null,
      deleted: false,
      updatedAt: Date.now(),
      syncStatus: 'pending'
    }
    await db.categories.put(record)
    await loadFromLocalDB()
    syncWithBackend()
  }

  async function deleteCategory(uuid) {
    const existing = await db.categories.get(uuid)
    if (!existing) return
    existing.deleted = true
    existing.updatedAt = Date.now()
    existing.syncStatus = 'pending'
    await db.categories.put(existing)
    await loadFromLocalDB()
    syncWithBackend()
  }

  async function saveGoal(goalData) {
    const record = {
      uuid: goalData.uuid || generateUuid(),
      name: goalData.name,
      targetAmount: Number(goalData.targetAmount || 0),
      currentAmount: Number(goalData.currentAmount || 0),
      deadline: goalData.deadline || '',
      icon: goalData.icon || 'target',
      color: goalData.color || '#10b981',
      deleted: false,
      updatedAt: Date.now(),
      syncStatus: 'pending'
    }
    await db.goals.put(record)
    await loadFromLocalDB()
    syncWithBackend()
  }

  async function deleteGoal(uuid) {
    const existing = await db.goals.get(uuid)
    if (!existing) return
    existing.deleted = true
    existing.updatedAt = Date.now()
    existing.syncStatus = 'pending'
    await db.goals.put(existing)
    await loadFromLocalDB()
    syncWithBackend()
  }

  async function saveDebt(debtData) {
    const record = {
      uuid: debtData.uuid || generateUuid(),
      personName: debtData.personName,
      type: debtData.type || 'OWED_TO_ME',
      totalAmount: Number(debtData.totalAmount || 0),
      paidAmount: Number(debtData.paidAmount || 0),
      dueDate: debtData.dueDate || '',
      notes: debtData.notes || '',
      color: debtData.color || '#f59e0b',
      deleted: false,
      updatedAt: Date.now(),
      syncStatus: 'pending'
    }
    await db.debts.put(record)
    await loadFromLocalDB()
    syncWithBackend()
  }

  async function deleteDebt(uuid) {
    const existing = await db.debts.get(uuid)
    if (!existing) return
    existing.deleted = true
    existing.updatedAt = Date.now()
    existing.syncStatus = 'pending'
    await db.debts.put(existing)
    await loadFromLocalDB()
    syncWithBackend()
  }

  async function saveRecurring(ruleData) {
    const record = {
      uuid: ruleData.uuid || generateUuid(),
      title: ruleData.title,
      type: ruleData.type || 'EXPENSE',
      amount: Number(ruleData.amount || 0),
      accountUuid: ruleData.accountUuid,
      categoryUuid: ruleData.categoryUuid,
      frequency: ruleData.frequency || 'MONTHLY',
      nextDueDate: ruleData.nextDueDate || new Date().toISOString().slice(0, 10),
      autoCreate: ruleData.autoCreate !== false,
      active: ruleData.active !== false,
      deleted: false,
      updatedAt: Date.now(),
      syncStatus: 'pending'
    }
    await db.recurringRules.put(record)
    await loadFromLocalDB()
    syncWithBackend()
  }

  async function executeRecurringNow(rule) {
    await saveTransaction({
      accountUuid: rule.accountUuid,
      categoryUuid: rule.categoryUuid,
      type: rule.type,
      amount: rule.amount,
      description: `${rule.title} (Recurrente)`,
      date: new Date().toISOString().slice(0, 10),
      tags: 'recurrente,automatico',
      paymentMethod: 'Automático'
    })
  }

  async function deleteRecurring(uuid) {
    const existing = await db.recurringRules.get(uuid)
    if (!existing) return
    existing.deleted = true
    existing.updatedAt = Date.now()
    existing.syncStatus = 'pending'
    await db.recurringRules.put(existing)
    await loadFromLocalDB()
    syncWithBackend()
  }

  async function saveQuickTemplate(tmpl) {
    await db.quickTemplates.put({
      uuid: tmpl.uuid || generateUuid(),
      title: tmpl.title,
      amount: Number(tmpl.amount || 0),
      type: tmpl.type || 'EXPENSE',
      accountUuid: tmpl.accountUuid || accounts.value[0]?.uuid || '',
      categoryUuid: tmpl.categoryUuid || categories.value[0]?.uuid || '',
      icon: tmpl.icon || '⚡',
      color: tmpl.color || '#6366f1',
      tags: tmpl.tags || 'rapido'
    })
    quickTemplates.value = await db.quickTemplates.toArray()
  }

  async function deleteQuickTemplate(uuid) {
    await db.quickTemplates.delete(uuid)
    quickTemplates.value = await db.quickTemplates.toArray()
  }

  async function updatePreferences(prefs) {
    if (!user.value) return
    user.value = { ...user.value, ...prefs, updatedAt: Date.now() }
    localStorage.setItem('finanzy_user', JSON.stringify(user.value))
    if (prefs.themeMode) themeStore.setThemeMode(prefs.themeMode)
    if (prefs.accentColor) themeStore.setAccentColor(prefs.accentColor)
    syncWithBackend()
  }

  // Computed Analytics for Selected Month
  const monthTransactions = computed(() => {
    return transactions.value.filter(t => (t.date || '').startsWith(selectedMonth.value))
  })

  const totalBalance = computed(() => {
    return accounts.value
      .filter(a => a.includeInNetWorth !== false)
      .reduce((sum, a) => sum + Number(a.balance || 0), 0)
  })

  const monthlyIncome = computed(() => {
    return monthTransactions.value
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
  })

  const monthlyExpense = computed(() => {
    return monthTransactions.value
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
  })

  const monthlySavingsRate = computed(() => {
    if (monthlyIncome.value <= 0) return 0
    const net = monthlyIncome.value - monthlyExpense.value
    return Math.round((net / monthlyIncome.value) * 100)
  })

  // Category Breakdown & Budgets for Selected Month
  const categoryBreakdown = computed(() => {
    const map = {}
    for (const c of categories.value) {
      map[c.uuid] = {
        ...c,
        spent: 0,
        count: 0,
        percentageOfTotal: 0,
        budgetProgress: 0
      }
    }

    for (const t of monthTransactions.value) {
      if (t.type === 'EXPENSE' && t.categoryUuid && map[t.categoryUuid]) {
        map[t.categoryUuid].spent += Number(t.amount || 0)
        map[t.categoryUuid].count += 1
      }
    }

    const totalExp = monthlyExpense.value || 1
    return Object.values(map)
      .filter(c => c.type === 'EXPENSE')
      .map(c => {
        const budget = Number(c.monthlyBudget || 0)
        return {
          ...c,
          percentageOfTotal: Math.round((c.spent / totalExp) * 100),
          budgetProgress: budget > 0 ? Math.round((c.spent / budget) * 100) : 0
        }
      })
      .sort((a, b) => b.spent - a.spent)
  })

  // 50/30/20 Rule Analytics
  const rule503020 = computed(() => {
    let needs = 0, wants = 0, savings = 0
    const catMap = Object.fromEntries(categories.value.map(c => [c.uuid, c]))
    for (const t of monthTransactions.value) {
      if (t.type === 'EXPENSE') {
        const cat = catMap[t.categoryUuid]
        const bucket = cat?.budgetNeedType || 'NEEDS'
        const amt = Number(t.amount || 0)
        if (bucket === 'NEEDS') needs += amt
        else if (bucket === 'WANTS') wants += amt
        else savings += amt
      }
    }
    const base = monthlyIncome.value > 0 ? monthlyIncome.value : (needs + wants + savings || 1)
    return {
      needs: { amount: needs, pct: Math.round((needs / base) * 100), target: user.value?.budgetRuleNeeds || 50 },
      wants: { amount: wants, pct: Math.round((wants / base) * 100), target: user.value?.budgetRuleWants || 30 },
      savings: { amount: savings, pct: Math.round((savings / base) * 100), target: user.value?.budgetRuleSavings || 20 }
    }
  })

  // Last 6 Months Cashflow Series
  const sixMonthsSeries = computed(() => {
    const [year, month] = selectedMonth.value.split('-').map(Number)
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1)
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
      let inc = 0, exp = 0
      for (const t of transactions.value) {
        if ((t.date || '').startsWith(ym)) {
          if (t.type === 'INCOME') inc += Number(t.amount || 0)
          else if (t.type === 'EXPENSE') exp += Number(t.amount || 0)
        }
      }
      months.push({ ym, label, income: inc, expense: exp, net: inc - exp })
    }
    return months
  })

  // Listen to Online / Offline events
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      isOnline.value = true
      syncWithBackend()
    })
    window.addEventListener('offline', () => {
      isOnline.value = false
    })
  }

  return {
    token,
    user,
    isOnline,
    backendReachable,
    isSyncing,
    lastSyncedAt,
    syncError,
    pendingSyncCount,
    accounts,
    categories,
    transactions,
    goals,
    debts,
    recurringRules,
    quickTemplates,
    selectedMonth,
    isAuthenticated,
    currencySymbol,
    monthTransactions,
    totalBalance,
    monthlyIncome,
    monthlyExpense,
    monthlySavingsRate,
    categoryBreakdown,
    rule503020,
    sixMonthsSeries,
    formatMoney,
    loadFromLocalDB,
    seedOfflineDemoDataIfNeeded,
    login,
    register,
    startOfflineDemoSession,
    logout,
    syncWithBackend,
    saveTransaction,
    deleteTransaction,
    saveAccount,
    deleteAccount,
    saveCategory,
    deleteCategory,
    saveGoal,
    deleteGoal,
    saveDebt,
    deleteDebt,
    saveRecurring,
    executeRecurringNow,
    deleteRecurring,
    saveQuickTemplate,
    deleteQuickTemplate,
    updatePreferences
  }
})
