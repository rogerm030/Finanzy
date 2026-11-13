<template>
  <!-- AUTH SCREEN (When not logged in) -->
  <div v-if="!store.isAuthenticated" class="auth-wrapper">
    <div class="auth-card card">
      <div class="auth-brand">
        <div class="logo-badge">📈</div>
        <div style="min-width: 0;">
          <h1>Finanzy</h1>
          <p>Control de Gastos &amp; Finanzas PWA Offline-First</p>
        </div>
      </div>

      <!-- Quick Theme Bar on Login -->
      <div class="auth-theme-bar">
        <div class="auth-modes">
          <button class="chip-btn" :class="{ active: themeStore.themeMode === 'light' }" @click="themeStore.setThemeMode('light')">☀️</button>
          <button class="chip-btn" :class="{ active: themeStore.themeMode === 'dark' }" @click="themeStore.setThemeMode('dark')">🌙</button>
        </div>
        <div class="auth-dots">
          <button
            v-for="c in themeStore.recommendedColors.slice(0, 5)"
            :key="c.hex"
            class="mini-dot"
            :style="{ backgroundColor: c.hex }"
            @click="themeStore.setAccentColor(c.hex)"
          ></button>
          <label class="mini-picker" title="Color personalizado">
            🎨
            <input type="color" :value="themeStore.accentColor" @input="themeStore.setAccentColor($event.target.value)" />
          </label>
        </div>
      </div>

      <div class="auth-tabs">
        <button :class="{ active: authMode === 'login' }" @click="authMode = 'login'">Iniciar Sesión</button>
        <button :class="{ active: authMode === 'register' }" @click="authMode = 'register'">Crear Cuenta</button>
      </div>

      <form class="auth-form" @submit.prevent="submitAuth">
        <div v-if="authMode === 'register'">
          <label class="label">Tu Nombre</label>
          <input v-model="authForm.name" class="input" placeholder="Ej. Roger" required />
        </div>

        <div>
          <label class="label">Correo Electrónico</label>
          <input v-model="authForm.email" type="email" class="input" placeholder="demo@finanzy.app" required />
        </div>

        <div>
          <label class="label">Contraseña</label>
          <input v-model="authForm.password" type="password" class="input" placeholder="••••••••" required />
        </div>

        <div v-if="authMode === 'register'">
          <label class="label">Moneda Principal</label>
          <select v-model="authForm.currency" class="select">
            <option v-for="c in currencies" :key="c.code" :value="c.code">
              {{ c.symbol }} — {{ c.name }}
            </option>
          </select>
        </div>

        <p v-if="authError" class="auth-error">{{ authError }}</p>

        <button type="submit" class="btn btn-primary full-w" :disabled="authLoading">
          {{ authLoading ? 'Conectando...' : (authMode === 'login' ? 'Entrar a Finanzy' : 'Registrarme y Empezar') }}
        </button>
      </form>

      <div class="auth-divider"><span>O acceso instantáneo</span></div>

      <button class="btn btn-ghost full-w" style="white-space: normal; text-align: center;" @click="quickDemoLogin">
        ⚡ Entrar con Cuenta Demo (Online / Offline)
      </button>

      <p class="auth-hint">
        🔒 Arquitectura JWT + IndexedDB (Dexie.js): Funciona con o sin internet en móvil y escritorio.
      </p>
    </div>
  </div>

  <!-- MAIN APPLICATION SHELL -->
  <div v-else class="app-shell">
    <!-- MOBILE TOP STATUS BAR (Visible on iPhone / Mobile screens) -->
    <div class="mobile-top-status no-print">
      <div class="mob-brand">
        <div class="logo-badge sm">📈</div>
        <div>
          <strong>Finanzy</strong>
          <span class="mob-sync-indicator" :class="{ online: store.isOnline && store.backendReachable }">
            <span class="dot"></span>
            {{ store.isSyncing ? 'Sincronizando...' : (store.backendReachable ? 'Online' : 'Offline') }}
            <template v-if="store.pendingSyncCount > 0">({{ store.pendingSyncCount }})</template>
          </span>
        </div>
      </div>

      <div class="mob-top-actions">
        <button class="icon-btn" title="Sincronizar" @click="store.syncWithBackend()" :disabled="store.isSyncing">🔄</button>
        <button class="icon-btn" title="Cambiar Color / Tema" @click="showQuickTheme = !showQuickTheme">🎨</button>
        <button class="icon-btn" title="Cerrar sesión" @click="store.logout()">🚪</button>
      </div>
    </div>

    <!-- DESKTOP SIDEBAR -->
    <aside class="desktop-sidebar">
      <div class="brand-row">
        <div class="logo-badge">📈</div>
        <div>
          <h2 class="brand-name">Finanzy</h2>
          <span class="brand-tag">PWA Finanzas Pro</span>
        </div>
      </div>

      <button class="btn btn-primary new-tx-cta" @click="openNewTransactionModal()">
        <span>＋</span> Nuevo Movimiento
      </button>

      <nav class="side-nav">
        <button
          v-for="item in navItems"
          :key="item.id"
          class="nav-btn"
          :class="{ active: activeTab === item.id }"
          @click="activeTab = item.id"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <!-- Sidebar Footer: Sync & User -->
      <div class="sidebar-footer">
        <div class="sync-box" :class="{ online: store.isOnline && store.backendReachable, pending: store.pendingSyncCount > 0 }">
          <div class="sync-status-line">
            <span class="status-dot"></span>
            <strong>{{ store.isSyncing ? 'Sincronizando...' : (store.backendReachable ? 'Sincronizado (Spring Boot)' : 'Modo Offline (Dexie DB)') }}</strong>
          </div>
          <small v-if="store.pendingSyncCount > 0">{{ store.pendingSyncCount }} cambios guardados en local</small>
          <small v-else>Datos respaldados en dispositivo</small>
          <button class="sync-mini-btn" @click="store.syncWithBackend()" :disabled="store.isSyncing">
            🔄 Sincronizar ahora
          </button>
        </div>

        <div class="user-row">
          <div class="user-avatar">{{ (store.user?.name || 'U')[0].toUpperCase() }}</div>
          <div class="user-meta">
            <strong>{{ store.user?.name }}</strong>
            <small>{{ store.user?.currency || 'USD' }} • {{ store.user?.email }}</small>
          </div>
          <button class="logout-btn" title="Cerrar sesión" @click="store.logout()">🚪</button>
        </div>
      </div>
    </aside>

    <!-- MAIN CONTENT AREA -->
    <main class="main-area">
      <!-- TOP HEADER BAR -->
      <header class="topbar no-print">
        <div class="topbar-left">
          <h1 class="page-title">{{ currentTabObj.label }}</h1>
          <p class="page-subtitle">{{ currentTabObj.subtitle }}</p>
        </div>

        <div class="topbar-actions">
          <!-- Month Picker -->
          <div class="month-selector">
            <button class="month-step" @click="changeMonth(-1)" title="Mes anterior">◀</button>
            <input v-model="store.selectedMonth" type="month" class="month-input" />
            <button class="month-step" @click="changeMonth(1)" title="Mes siguiente">▶</button>
          </div>

          <div class="topbar-btns-row">
            <!-- Quick Floating Color & Mode Picker Toggle -->
            <div class="quick-theme-wrap">
              <button class="btn btn-ghost theme-trigger-btn" @click="showQuickTheme = !showQuickTheme">
                <span class="color-dot-indicator" :style="{ backgroundColor: themeStore.accentColor }"></span>
                <span>Tema</span>
              </button>
            </div>

            <button class="btn btn-primary register-cta-btn" @click="openNewTransactionModal()">
              ＋ Registrar
            </button>
          </div>
        </div>
      </header>

      <!-- QUICK THEME POPOVER / SHEET (Never clips on iPhone 16) -->
      <div v-if="showQuickTheme" class="quick-theme-backdrop" @click.self="showQuickTheme = false">
        <div class="quick-theme-popover card">
          <div class="pop-head">
            <strong>🎨 Apariencia Instantánea</strong>
            <button class="close-x" @click="showQuickTheme = false">✕</button>
          </div>
          <div class="pop-modes">
            <button :class="{ active: themeStore.themeMode === 'light' }" @click="selectQuickMode('light')">☀️ Claro</button>
            <button :class="{ active: themeStore.themeMode === 'dark' }" @click="selectQuickMode('dark')">🌙 Oscuro</button>
            <button :class="{ active: themeStore.themeMode === 'system' }" @click="selectQuickMode('system')">💻 Auto</button>
          </div>
          <div class="pop-swatches">
            <button
              v-for="c in themeStore.recommendedColors"
              :key="c.hex"
              class="pop-swatch"
              :style="{ backgroundColor: c.hex }"
              :title="c.name"
              @click="selectQuickColor(c.hex)"
            >
              <span v-if="themeStore.accentColor.toLowerCase() === c.hex.toLowerCase()">✓</span>
            </button>
          </div>
          <div class="pop-custom">
            <label class="label">Selector de Color Dinámico</label>
            <div class="pop-custom-row">
              <input
                type="color"
                :value="themeStore.accentColor"
                class="native-color-input"
                @input="selectQuickColor($event.target.value)"
              />
              <input
                type="range"
                min="0"
                max="360"
                :value="themeStore.hsl.h"
                class="range-input hue-rainbow"
                @input="themeStore.setFromHsl(Number($event.target.value), themeStore.hsl.s, themeStore.hsl.l)"
              />
            </div>
          </div>
          <button class="btn btn-ghost full-w" style="margin-top:0.65rem" @click="activeTab = 'appearance'; showQuickTheme = false">
            Abrir Estudio Completo de Color →
          </button>
        </div>
      </div>

      <!-- ========================================================= -->
      <!-- TAB 1: DASHBOARD GENERAL                                  -->
      <!-- ========================================================= -->
      <section v-if="activeTab === 'dashboard'" class="tab-content">
        <!-- KPI Cards (2x2 on iPhone 16, 4x1 on Desktop) -->
        <div class="kpi-grid">
          <div class="card kpi-card primary-kpi">
            <div class="kpi-top">
              <span>Patrimonio Neto</span>
              <span class="kpi-icon">🏦</span>
            </div>
            <div class="kpi-value">{{ store.formatMoney(store.totalBalance) }}</div>
            <div class="kpi-foot">{{ store.accounts.length }} cuentas activas</div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-top">
              <span>Ingresos Mes</span>
              <span class="kpi-icon income-bg">📈</span>
            </div>
            <div class="kpi-value text-success">+{{ store.formatMoney(store.monthlyIncome) }}</div>
            <div class="kpi-foot">{{ store.selectedMonth }}</div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-top">
              <span>Gastos Mes</span>
              <span class="kpi-icon expense-bg">💸</span>
            </div>
            <div class="kpi-value text-danger">-{{ store.formatMoney(store.monthlyExpense) }}</div>
            <div class="kpi-foot">{{ store.monthTransactions.filter(t => t.type === 'EXPENSE').length }} movimientos</div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-top">
              <span>Balance &amp; Ahorro</span>
              <span class="kpi-icon">🎯</span>
            </div>
            <div class="kpi-value" :class="(store.monthlyIncome - store.monthlyExpense) >= 0 ? 'text-success' : 'text-danger'">
              {{ store.formatMoney(store.monthlyIncome - store.monthlyExpense) }}
            </div>
            <div class="kpi-foot">Ahorro: <strong>{{ store.monthlySavingsRate }}%</strong></div>
          </div>
        </div>

        <!-- 1-Tap Quick Expense Templates -->
        <div class="card quick-templates-bar">
          <div class="qt-header">
            <div style="min-width: 0;">
              <strong>⚡ Registro Rápido en 1 Toque</strong>
              <small>Toca un botón para registrar gastos frecuentes al instante</small>
            </div>
            <button class="btn btn-ghost btn-sm" @click="showTemplateModal = true">＋ Crear Botón</button>
          </div>
          <div class="qt-list">
            <button
              v-for="tmpl in store.quickTemplates"
              :key="tmpl.uuid"
              class="qt-chip"
              :style="{ borderColor: tmpl.color }"
              @click="triggerQuickTemplate(tmpl)"
            >
              <span class="qt-emoji">{{ tmpl.icon }}</span>
              <div class="qt-meta">
                <strong>{{ tmpl.title }}</strong>
                <span>{{ store.formatMoney(tmpl.amount) }}</span>
              </div>
              <span class="qt-del" title="Eliminar plantilla" @click.stop="store.deleteQuickTemplate(tmpl.uuid)">×</span>
            </button>
          </div>
        </div>

        <!-- Interactive Charts -->
        <FinanceCharts :showDaily="false" />

        <!-- Bottom Dashboard Split: 50/30/20 Rule + Recent Transactions -->
        <div class="dash-bottom-grid">
          <!-- 50/30/20 Rule Analyzer -->
          <div class="card">
            <div class="section-head">
              <div style="min-width: 0;">
                <h3>Diagnóstico Regla {{ store.rule503020.needs.target }}/{{ store.rule503020.wants.target }}/{{ store.rule503020.savings.target }}</h3>
                <p class="muted-sm">Distribución inteligente de tus finanzas este mes</p>
              </div>
              <button class="btn btn-ghost btn-sm" @click="activeTab = 'appearance'">Ajustar %</button>
            </div>

            <div class="rule-bars">
              <div class="rule-row">
                <div class="rule-row-top">
                  <span>🏠 Necesidades ({{ store.rule503020.needs.target }}%)</span>
                  <strong>{{ store.formatMoney(store.rule503020.needs.amount) }} ({{ store.rule503020.needs.pct }}%)</strong>
                </div>
                <div class="progress-track">
                  <div
                    class="progress-fill"
                    :style="{
                      width: Math.min(100, store.rule503020.needs.pct) + '%',
                      backgroundColor: store.rule503020.needs.pct > store.rule503020.needs.target ? '#ef4444' : '#3b82f6'
                    }"
                  ></div>
                </div>
              </div>

              <div class="rule-row">
                <div class="rule-row-top">
                  <span>🎉 Deseos y Ocio ({{ store.rule503020.wants.target }}%)</span>
                  <strong>{{ store.formatMoney(store.rule503020.wants.amount) }} ({{ store.rule503020.wants.pct }}%)</strong>
                </div>
                <div class="progress-track">
                  <div
                    class="progress-fill"
                    :style="{
                      width: Math.min(100, store.rule503020.wants.pct) + '%',
                      backgroundColor: store.rule503020.wants.pct > store.rule503020.wants.target ? '#f59e0b' : '#ec4899'
                    }"
                  ></div>
                </div>
              </div>

              <div class="rule-row">
                <div class="rule-row-top">
                  <span>🚀 Ahorro ({{ store.rule503020.savings.target }}%)</span>
                  <strong>{{ store.formatMoney(store.rule503020.savings.amount) }} ({{ store.rule503020.savings.pct }}%)</strong>
                </div>
                <div class="progress-track">
                  <div
                    class="progress-fill"
                    :style="{
                      width: Math.min(100, store.rule503020.savings.pct) + '%',
                      backgroundColor: '#10b981'
                    }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Budget Alerts Summary -->
            <div class="budget-alerts-mini">
              <h4>Estado de Presupuestos por Categoría</h4>
              <div
                v-for="cat in store.categoryBreakdown.filter(c => c.monthlyBudget > 0).slice(0, 4)"
                :key="cat.uuid"
                class="mini-budget-item"
              >
                <div class="mb-top">
                  <span class="mb-cat-name">{{ getCategoryEmoji(cat.icon) }} {{ cat.name }}</span>
                  <span class="mb-cat-nums" :class="getBudgetColorClass(cat.budgetProgress)">
                    {{ store.formatMoney(cat.spent) }} / {{ store.formatMoney(cat.monthlyBudget) }} ({{ cat.budgetProgress }}%)
                  </span>
                </div>
                <div class="progress-track" style="height: 6px;">
                  <div
                    class="progress-fill"
                    :style="{
                      width: Math.min(100, cat.budgetProgress) + '%',
                      backgroundColor: getBudgetHex(cat.budgetProgress)
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Transactions Card -->
          <div class="card">
            <div class="section-head">
              <div>
                <h3>Últimos Movimientos</h3>
                <p class="muted-sm">Registros más recientes</p>
              </div>
              <button class="btn btn-ghost btn-sm" @click="activeTab = 'transactions'">Ver todos →</button>
            </div>

            <div class="tx-list">
              <div
                v-for="tx in store.monthTransactions.slice(0, 6)"
                :key="tx.uuid"
                class="tx-item"
                @click="editTransaction(tx)"
              >
                <div
                  class="tx-icon"
                  :style="{ backgroundColor: getCategoryByUuid(tx.categoryUuid)?.color || 'var(--primary)' }"
                >
                  {{ tx.type === 'TRANSFER' ? '🔄' : getCategoryEmoji(getCategoryByUuid(tx.categoryUuid)?.icon) }}
                </div>
                <div class="tx-info">
                  <strong class="tx-desc-truncate">{{ tx.description }}</strong>
                  <small class="tx-sub-truncate">
                    {{ tx.date }} • {{ getAccountName(tx.accountUuid) }}
                  </small>
                </div>
                <div class="tx-amount" :class="tx.type === 'INCOME' ? 'text-success' : (tx.type === 'EXPENSE' ? 'text-danger' : '')">
                  {{ tx.type === 'INCOME' ? '+' : (tx.type === 'EXPENSE' ? '-' : '⇄ ') }}{{ store.formatMoney(tx.amount) }}
                </div>
              </div>
              <p v-if="store.monthTransactions.length === 0" class="empty-msg">
                No hay movimientos registrados en este mes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- ========================================================= -->
      <!-- TAB 2: TRANSACCIONES (GASTOS, INGRESOS, TRANSFERENCIAS)   -->
      <!-- ========================================================= -->
      <section v-else-if="activeTab === 'transactions'" class="tab-content">
        <div class="card filters-bar">
          <input
            v-model="txSearch"
            class="input filter-search"
            placeholder="🔍 Buscar descripción, comercio o #tag..."
          />
          <select v-model="txTypeFilter" class="select">
            <option value="ALL">Todos los tipos</option>
            <option value="EXPENSE">📉 Solo Gastos</option>
            <option value="INCOME">📈 Solo Ingresos</option>
            <option value="TRANSFER">🔄 Transferencias</option>
          </select>
          <select v-model="txAccountFilter" class="select">
            <option value="ALL">Todas las cuentas</option>
            <option v-for="a in store.accounts" :key="a.uuid" :value="a.uuid">{{ a.name }}</option>
          </select>
          <select v-model="txCategoryFilter" class="select">
            <option value="ALL">Todas las categorías</option>
            <option v-for="c in store.categories" :key="c.uuid" :value="c.uuid">{{ c.name }}</option>
          </select>
        </div>

        <div class="card">
          <div class="section-head">
            <h3>Movimientos ({{ filteredTransactions.length }})</h3>
            <button class="btn btn-primary btn-sm" @click="openNewTransactionModal()">＋ Añadir</button>
          </div>

          <div class="tx-list detailed">
            <div
              v-for="tx in filteredTransactions"
              :key="tx.uuid"
              class="tx-item detailed-row"
            >
              <div class="tx-main-body">
                <div
                  class="tx-icon"
                  :style="{ backgroundColor: getCategoryByUuid(tx.categoryUuid)?.color || 'var(--primary)' }"
                >
                  {{ tx.type === 'TRANSFER' ? '🔄' : getCategoryEmoji(getCategoryByUuid(tx.categoryUuid)?.icon) }}
                </div>

                <div class="tx-info">
                  <div class="tx-title-line">
                    <strong>{{ tx.description }}</strong>
                    <span class="badge" :style="{ background: 'var(--bg-elevated)' }">
                      {{ tx.type === 'TRANSFER' ? 'Transferencia' : (getCategoryByUuid(tx.categoryUuid)?.name || 'General') }}
                    </span>
                    <span v-if="tx.syncStatus === 'pending'" class="badge" style="background: rgba(245,158,11,0.15); color: #f59e0b;">
                      ⏳ Local
                    </span>
                  </div>

                  <small class="tx-sub">
                    📅 {{ tx.date }} • 🏦 {{ getAccountName(tx.accountUuid) }}
                    <span v-if="tx.type === 'TRANSFER' && tx.toAccountUuid"> → {{ getAccountName(tx.toAccountUuid) }}</span>
                    <span v-if="tx.paymentMethod"> • 💳 {{ tx.paymentMethod }}</span>
                    <span v-if="tx.merchant"> • 📍 {{ tx.merchant }}</span>
                  </small>

                  <!-- Tags & Custom Fields badges -->
                  <div v-if="tx.tags || hasCustomFields(tx.customFieldsJson) || tx.receiptDataUrl" class="tx-tags-row">
                    <span
                      v-for="tag in splitTags(tx.tags)"
                      :key="tag"
                      class="tag-pill"
                    >
                      #{{ tag }}
                    </span>
                    <span
                      v-for="(val, key) in parseCustomFields(tx.customFieldsJson)"
                      :key="key"
                      class="custom-field-pill"
                    >
                      <strong>{{ key }}:</strong> {{ val }}
                    </span>
                    <button
                      v-if="tx.receiptDataUrl"
                      class="receipt-pill"
                      @click="previewReceiptUrl = tx.receiptDataUrl"
                    >
                      📎 Ver Recibo
                    </button>
                  </div>
                </div>
              </div>

              <div class="tx-right-col">
                <div class="tx-amount" :class="tx.type === 'INCOME' ? 'text-success' : (tx.type === 'EXPENSE' ? 'text-danger' : '')">
                  {{ tx.type === 'INCOME' ? '+' : (tx.type === 'EXPENSE' ? '-' : '⇄ ') }}{{ store.formatMoney(tx.amount) }}
                </div>
                <div class="row-actions">
                  <button class="icon-btn" title="Editar" @click="editTransaction(tx)">✏️</button>
                  <button class="icon-btn danger" title="Eliminar" @click="store.deleteTransaction(tx.uuid)">🗑️</button>
                </div>
              </div>
            </div>

            <p v-if="filteredTransactions.length === 0" class="empty-msg">
              No se encontraron movimientos con los filtros actuales.
            </p>
          </div>
        </div>
      </section>

      <!-- ========================================================= -->
      <!-- TAB 3: CUENTAS Y TARJETAS                                 -->
      <!-- ========================================================= -->
      <section v-else-if="activeTab === 'accounts'" class="tab-content">
        <div class="section-head">
          <div style="min-width: 0;">
            <h3>Mis Cuentas, Efectivo y Tarjetas</h3>
            <p class="muted-sm">Controla saldos individuales, tarjetas de crédito y transferencias</p>
          </div>
          <button class="btn btn-primary" @click="openAccountModal()">＋ Nueva Cuenta</button>
        </div>

        <div class="accounts-grid">
          <div
            v-for="acc in store.accounts"
            :key="acc.uuid"
            class="card account-card card-hover"
            :style="{ borderTop: `4px solid ${acc.color}` }"
          >
            <div class="acc-top">
              <div class="acc-badge" :style="{ backgroundColor: acc.color }">
                {{ getAccountTypeEmoji(acc.type) }}
              </div>
              <div class="acc-actions">
                <button class="icon-btn" @click="openAccountModal(acc)">✏️</button>
                <button class="icon-btn danger" @click="store.deleteAccount(acc.uuid)">🗑️</button>
              </div>
            </div>

            <span class="acc-type-label">{{ getAccountTypeName(acc.type) }}</span>
            <h3 class="acc-name">{{ acc.name }}</h3>
            <div class="acc-balance" :class="Number(acc.balance) < 0 ? 'text-danger' : ''">
              {{ store.formatMoney(acc.balance) }}
            </div>

            <div v-if="acc.type === 'CREDIT_CARD' && acc.creditLimit" class="cc-meta">
              <div class="cc-row">
                <span>Cupo: {{ store.formatMoney(acc.creditLimit) }}</span>
                <span>Corte {{ acc.cutoffDay || 15 }} • Pago {{ acc.paymentDay || 5 }}</span>
              </div>
              <div class="progress-track" style="height: 6px; margin-top: 6px;">
                <div
                  class="progress-fill"
                  :style="{
                    width: Math.min(100, Math.round((Math.abs(acc.balance) / acc.creditLimit) * 100)) + '%',
                    backgroundColor: acc.color
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ========================================================= -->
      <!-- TAB 4: CATEGORÍAS Y PRESUPUESTOS                          -->
      <!-- ========================================================= -->
      <section v-else-if="activeTab === 'categories'" class="tab-content">
        <div class="section-head">
          <div style="min-width: 0;">
            <h3>Categorías y Presupuestos Mensuales</h3>
            <p class="muted-sm">Personaliza colores, íconos, topes de gasto mensual y regla 50/30/20</p>
          </div>
          <button class="btn btn-primary" @click="openCategoryModal()">＋ Crear Categoría</button>
        </div>

        <div class="cats-grid">
          <div
            v-for="cat in store.categoryBreakdown"
            :key="cat.uuid"
            class="card cat-card card-hover"
          >
            <div class="cat-top">
              <div class="cat-title-wrap">
                <div class="cat-avatar" :style="{ backgroundColor: cat.color }">
                  {{ getCategoryEmoji(cat.icon) }}
                </div>
                <div style="min-width: 0;">
                  <h4 class="cat-name-trunc">{{ cat.name }}</h4>
                  <span class="badge" style="background: var(--bg-elevated)">
                    {{ cat.budgetNeedType === 'NEEDS' ? '🏠 Necesidad' : (cat.budgetNeedType === 'WANTS' ? '🎉 Deseo' : '🚀 Ahorro') }}
                  </span>
                </div>
              </div>
              <div class="row-actions">
                <button class="icon-btn" @click="openCategoryModal(cat)">✏️</button>
                <button class="icon-btn danger" @click="store.deleteCategory(cat.uuid)">🗑️</button>
              </div>
            </div>

            <div class="cat-numbers">
              <div>
                <small>Gastado este mes</small>
                <strong>{{ store.formatMoney(cat.spent) }}</strong>
              </div>
              <div style="text-align: right;">
                <small>Presupuesto Mensual</small>
                <strong>{{ cat.monthlyBudget > 0 ? store.formatMoney(cat.monthlyBudget) : 'Sin límite' }}</strong>
              </div>
            </div>

            <div v-if="cat.monthlyBudget > 0" class="cat-budget-bar">
              <div class="progress-track">
                <div
                  class="progress-fill"
                  :style="{
                    width: Math.min(100, cat.budgetProgress) + '%',
                    backgroundColor: getBudgetHex(cat.budgetProgress)
                  }"
                ></div>
              </div>
              <div class="cat-budget-foot">
                <span :class="getBudgetColorClass(cat.budgetProgress)">
                  {{ cat.budgetProgress >= 100 ? '⚠️ Excedido' : (cat.budgetProgress >= 80 ? '⚡ Cerca del límite' : '✅ En rango') }}
                </span>
                <strong>{{ cat.budgetProgress }}%</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Income Categories -->
        <div class="card">
          <h3 style="margin-bottom: 0.85rem;">Categorías de Ingresos</h3>
          <div class="income-cats-row">
            <div
              v-for="cat in store.categories.filter(c => c.type === 'INCOME')"
              :key="cat.uuid"
              class="income-cat-pill"
              :style="{ borderColor: cat.color }"
            >
              <span class="cat-avatar sm" :style="{ backgroundColor: cat.color }">{{ getCategoryEmoji(cat.icon) }}</span>
              <strong>{{ cat.name }}</strong>
              <button class="icon-btn" @click="openCategoryModal(cat)">✏️</button>
            </div>
          </div>
        </div>
      </section>

      <!-- ========================================================= -->
      <!-- TAB 5: METAS DE AHORRO, SUSCRIPCIONES Y DEUDAS            -->
      <!-- ========================================================= -->
      <section v-else-if="activeTab === 'planning'" class="tab-content">
        <!-- Savings Goals -->
        <div class="card">
          <div class="section-head">
            <div style="min-width: 0;">
              <h3>🎯 Metas de Ahorro</h3>
              <p class="muted-sm">Sigue el progreso hacia tus objetivos y registra aportes</p>
            </div>
            <button class="btn btn-primary btn-sm" @click="openGoalModal()">＋ Nueva Meta</button>
          </div>

          <div class="goals-grid">
            <div v-for="g in store.goals" :key="g.uuid" class="goal-box" :style="{ borderLeft: `4px solid ${g.color}` }">
              <div class="goal-head">
                <strong style="min-width: 0;">{{ g.name }}</strong>
                <div class="row-actions">
                  <button class="btn btn-ghost btn-xs" @click="addFundsToGoal(g)">＋ Abonar</button>
                  <button class="icon-btn" @click="openGoalModal(g)">✏️</button>
                  <button class="icon-btn danger" @click="store.deleteGoal(g.uuid)">🗑️</button>
                </div>
              </div>
              <div class="goal-nums">
                <span>{{ store.formatMoney(g.currentAmount) }}</span>
                <strong>Meta: {{ store.formatMoney(g.targetAmount) }} ({{ Math.round((g.currentAmount / (g.targetAmount || 1)) * 100) }}%)</strong>
              </div>
              <div class="progress-track">
                <div
                  class="progress-fill"
                  :style="{
                    width: Math.min(100, Math.round((g.currentAmount / (g.targetAmount || 1)) * 100)) + '%',
                    backgroundColor: g.color
                  }"
                ></div>
              </div>
              <small v-if="g.deadline" class="muted-sm">📅 Fecha objetivo: {{ g.deadline }}</small>
            </div>
          </div>
        </div>

        <!-- Recurring Subscriptions & Fixed Payments -->
        <div class="card">
          <div class="section-head">
            <div style="min-width: 0;">
              <h3>🔁 Pagos e Ingresos Recurrentes</h3>
              <p class="muted-sm">Ejecuta pagos fijos en un toque o controla cobros mensuales</p>
            </div>
            <button class="btn btn-primary btn-sm" @click="openRecurringModal()">＋ Nuevo</button>
          </div>

          <div class="tx-list">
            <div v-for="r in store.recurringRules" :key="r.uuid" class="tx-item detailed-row">
              <div class="tx-main-body">
                <div class="tx-icon" :style="{ backgroundColor: r.type === 'INCOME' ? '#10b981' : 'var(--primary)' }">
                  🔁
                </div>
                <div class="tx-info">
                  <strong>{{ r.title }}</strong>
                  <small>{{ r.frequency }} • Próximo: {{ r.nextDueDate }} • {{ getAccountName(r.accountUuid) }}</small>
                </div>
              </div>
              <div class="tx-right-col">
                <strong :class="r.type === 'INCOME' ? 'text-success' : 'text-danger'">
                  {{ store.formatMoney(r.amount) }}
                </strong>
                <div class="row-actions">
                  <button class="btn btn-ghost btn-xs" @click="store.executeRecurringNow(r)">⚡ Registrar hoy</button>
                  <button class="icon-btn danger" @click="store.deleteRecurring(r.uuid)">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Debts & Loans ("Me deben" / "Yo debo") -->
        <div class="card">
          <div class="section-head">
            <div style="min-width: 0;">
              <h3>🤝 Deudas y Préstamos (Me deben / Yo debo)</h3>
              <p class="muted-sm">Controla dinero prestado o cuotas pendientes</p>
            </div>
            <button class="btn btn-primary btn-sm" @click="openDebtModal()">＋ Registrar</button>
          </div>

          <div class="goals-grid">
            <div v-for="d in store.debts" :key="d.uuid" class="goal-box" :style="{ borderLeft: `4px solid ${d.type === 'OWED_TO_ME' ? '#10b981' : '#ef4444'}` }">
              <div class="goal-head">
                <div style="min-width: 0;">
                  <span class="badge" :style="{ background: d.type === 'OWED_TO_ME' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: d.type === 'OWED_TO_ME' ? '#10b981' : '#ef4444' }">
                    {{ d.type === 'OWED_TO_ME' ? '🟢 Me deben' : '🔴 Yo debo' }}
                  </span>
                  <strong style="display:block; margin-top:4px;">{{ d.personName }}</strong>
                </div>
                <div class="row-actions">
                  <button class="btn btn-ghost btn-xs" @click="payDebtInstallment(d)">＋ Abono</button>
                  <button class="icon-btn danger" @click="store.deleteDebt(d.uuid)">🗑️</button>
                </div>
              </div>
              <div class="goal-nums">
                <span>Pagado: {{ store.formatMoney(d.paidAmount) }}</span>
                <strong>Total: {{ store.formatMoney(d.totalAmount) }}</strong>
              </div>
              <div class="progress-track">
                <div
                  class="progress-fill"
                  :style="{
                    width: Math.min(100, Math.round((d.paidAmount / (d.totalAmount || 1)) * 100)) + '%',
                    backgroundColor: d.type === 'OWED_TO_ME' ? '#10b981' : '#f59e0b'
                  }"
                ></div>
              </div>
              <small v-if="d.notes" class="muted-sm">{{ d.notes }}</small>
            </div>
          </div>
        </div>
      </section>

      <!-- ========================================================= -->
      <!-- TAB 6: REPORTES, CALENDARIO DE CALOR Y EXPORTACIÓN        -->
      <!-- ========================================================= -->
      <section v-else-if="activeTab === 'reports'" class="tab-content">
        <div class="card export-banner no-print">
          <div style="min-width: 0;">
            <h3>📊 Centro de Reportes y Exportación</h3>
            <p class="muted-sm">Descarga Excel/CSV, imprime un informe PDF o guarda un respaldo JSON</p>
          </div>
          <div class="export-buttons">
            <button class="btn btn-primary btn-sm" @click="exportToCSV">📥 Excel (.CSV)</button>
            <button class="btn btn-ghost btn-sm" @click="printReport">🖨️ PDF</button>
            <button class="btn btn-ghost btn-sm" @click="exportBackupJSON">💾 Backup JSON</button>
          </div>
        </div>

        <FinanceCharts :showDaily="true" />

        <!-- Financial Heatmap Calendar -->
        <div class="card">
          <div class="section-head">
            <div>
              <h3>🗓️ Mapa de Calor de Gastos Diarios ({{ store.selectedMonth }})</h3>
              <p class="muted-sm">Identifica visualmente qué días del mes concentran más gastos</p>
            </div>
          </div>

          <div class="calendar-heatmap">
            <div
              v-for="day in calendarDays"
              :key="day.dayNum"
              class="cal-cell"
              :style="getHeatmapStyle(day.expense)"
            >
              <span class="cal-day-num">Día {{ day.dayNum }}</span>
              <strong v-if="day.expense > 0" class="cal-exp">-{{ store.formatMoney(day.expense) }}</strong>
              <small v-if="day.income > 0" class="cal-inc">+{{ store.formatMoney(day.income) }}</small>
              <span v-if="day.expense === 0 && day.income === 0" class="cal-zero">$0</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ========================================================= -->
      <!-- TAB 7: ESTUDIO DE COLOR Y PERSONALIZACIÓN                 -->
      <!-- ========================================================= -->
      <section v-else-if="activeTab === 'appearance'" class="tab-content">
        <ThemeCustomizer />
      </section>
    </main>

    <!-- MOBILE BOTTOM NAVIGATION (All 7 sections accessible & iPhone 16 Safe-Area ready) -->
    <nav class="mobile-bottom-nav no-print">
      <button
        v-for="item in navItems"
        :key="item.id"
        class="mob-nav-btn"
        :class="{ active: activeTab === item.id }"
        @click="activeTab = item.id"
      >
        <span class="mob-nav-icon">{{ item.icon }}</span>
        <small>{{ item.short }}</small>
      </button>
    </nav>

    <!-- ========================================================= -->
    <!-- MODAL: CREATE / EDIT TRANSACTION (MAX CUSTOMIZATION)      -->
    <!-- ========================================================= -->
    <div v-if="showTxModal" class="modal-overlay" @click.self="showTxModal = false">
      <div class="modal-box">
        <div class="modal-head">
          <h3>{{ txForm.uuid ? 'Editar Movimiento' : 'Nuevo Movimiento' }}</h3>
          <button class="close-x" @click="showTxModal = false">✕</button>
        </div>

        <!-- Type Switcher -->
        <div class="type-seg">
          <button type="button" :class="{ active: txForm.type === 'EXPENSE', exp: txForm.type === 'EXPENSE' }" @click="txForm.type = 'EXPENSE'">
            📉 Gasto
          </button>
          <button type="button" :class="{ active: txForm.type === 'INCOME', inc: txForm.type === 'INCOME' }" @click="txForm.type = 'INCOME'">
            📈 Ingreso
          </button>
          <button type="button" :class="{ active: txForm.type === 'TRANSFER', trf: txForm.type === 'TRANSFER' }" @click="txForm.type = 'TRANSFER'">
            🔄 Transferir
          </button>
        </div>

        <form class="modal-form" @submit.prevent="submitTransaction">
          <div class="form-grid-2">
            <div>
              <label class="label">Monto ({{ store.currencySymbol }}) *</label>
              <input v-model.number="txForm.amount" type="number" step="0.01" min="0.01" class="input amount-big" required />
            </div>
            <div>
              <label class="label">Fecha *</label>
              <input v-model="txForm.date" type="date" class="input" required />
            </div>
          </div>

          <div>
            <label class="label">Descripción o Concepto *</label>
            <input v-model="txForm.description" class="input" placeholder="Ej. Cena, Supermercado, Sueldo..." required />
          </div>

          <div class="form-grid-2">
            <div>
              <label class="label">{{ txForm.type === 'TRANSFER' ? 'Cuenta Origen *' : 'Cuenta *' }}</label>
              <select v-model="txForm.accountUuid" class="select" required>
                <option v-for="a in store.accounts" :key="a.uuid" :value="a.uuid">
                  {{ a.name }} ({{ store.formatMoney(a.balance) }})
                </option>
              </select>
            </div>

            <div v-if="txForm.type === 'TRANSFER'">
              <label class="label">Cuenta Destino *</label>
              <select v-model="txForm.toAccountUuid" class="select" required>
                <option v-for="a in store.accounts.filter(x => x.uuid !== txForm.accountUuid)" :key="a.uuid" :value="a.uuid">
                  {{ a.name }}
                </option>
              </select>
            </div>

            <div v-else>
              <label class="label">Categoría *</label>
              <select v-model="txForm.categoryUuid" class="select" required>
                <option
                  v-for="c in store.categories.filter(x => x.type === txForm.type)"
                  :key="c.uuid"
                  :value="c.uuid"
                >
                  {{ getCategoryEmoji(c.icon) }} {{ c.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-grid-2">
            <div>
              <label class="label">Comercio / Tienda / Lugar</label>
              <input v-model="txForm.merchant" class="input" placeholder="Ej. Supermercado, Amazon..." />
            </div>
            <div>
              <label class="label">Método de Pago</label>
              <select v-model="txForm.paymentMethod" class="select">
                <option>Efectivo</option>
                <option>Tarjeta Crédito</option>
                <option>Tarjeta Débito</option>
                <option>Transferencia</option>
                <option>Billetera Digital / QR</option>
              </select>
            </div>
          </div>

          <div>
            <label class="label">Etiquetas (#Tags separados por coma)</label>
            <input v-model="txForm.tags" class="input" placeholder="viaje, familia, trabajo, deducible" />
          </div>

          <!-- Dynamic Custom Fields Builder -->
          <div class="custom-fields-section">
            <div class="cf-head">
              <label class="label" style="margin:0">⚙️ Campos Personalizados Extra</label>
              <button type="button" class="btn btn-ghost btn-xs" @click="addCustomFieldRow">＋ Añadir Campo</button>
            </div>
            <div v-for="(cf, idx) in txCustomFields" :key="idx" class="cf-row">
              <input v-model="cf.key" class="input" placeholder="Campo (ej. Garantía)" />
              <input v-model="cf.value" class="input" placeholder="Valor (ej. 12 meses)" />
              <button type="button" class="icon-btn danger" @click="txCustomFields.splice(idx, 1)">✕</button>
            </div>
          </div>

          <!-- Photo Receipt Attachment -->
          <div>
            <label class="label">📷 Foto de Comprobante / Ticket</label>
            <input type="file" accept="image/*" class="input" @change="handleReceiptUpload" />
            <div v-if="txForm.receiptDataUrl" class="receipt-preview-wrap">
              <img :src="txForm.receiptDataUrl" alt="Recibo" />
              <button type="button" class="btn btn-danger btn-xs" @click="txForm.receiptDataUrl = ''">Quitar foto</button>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="showTxModal = false">Cancelar</button>
            <button type="submit" class="btn btn-primary">💾 Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: CREATE / EDIT ACCOUNT -->
    <div v-if="showAccModal" class="modal-overlay" @click.self="showAccModal = false">
      <div class="modal-box">
        <div class="modal-head">
          <h3>{{ accForm.uuid ? 'Editar Cuenta' : 'Nueva Cuenta o Tarjeta' }}</h3>
          <button class="close-x" @click="showAccModal = false">✕</button>
        </div>
        <form class="modal-form" @submit.prevent="submitAccount">
          <div class="form-grid-2">
            <div>
              <label class="label">Nombre de la Cuenta *</label>
              <input v-model="accForm.name" class="input" placeholder="Ej. Banco BCP, Billetera, Visa" required />
            </div>
            <div>
              <label class="label">Tipo de Cuenta *</label>
              <select v-model="accForm.type" class="select">
                <option value="BANK">🏦 Cuenta Bancaria</option>
                <option value="CASH">💵 Efectivo</option>
                <option value="CREDIT_CARD">💳 Tarjeta de Crédito</option>
                <option value="SAVINGS">🐷 Cuenta de Ahorros</option>
                <option value="INVESTMENT">📈 Inversión / Broker</option>
                <option value="DIGITAL_WALLET">📱 Billetera Digital</option>
              </select>
            </div>
          </div>
          <div class="form-grid-2">
            <div>
              <label class="label">Saldo Actual *</label>
              <input v-model.number="accForm.balance" type="number" step="0.01" class="input" required />
            </div>
            <div>
              <label class="label">Color Distintivo</label>
              <input v-model="accForm.color" type="color" class="input" style="height: 42px; padding: 4px;" />
            </div>
          </div>
          <div v-if="accForm.type === 'CREDIT_CARD'" class="form-grid-2">
            <div>
              <label class="label">Límite de Crédito</label>
              <input v-model.number="accForm.creditLimit" type="number" step="0.01" class="input" />
            </div>
            <div>
              <label class="label">Día de Pago (1-31)</label>
              <input v-model.number="accForm.paymentDay" type="number" min="1" max="31" class="input" />
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="showAccModal = false">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar Cuenta</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: CREATE / EDIT CATEGORY -->
    <div v-if="showCatModal" class="modal-overlay" @click.self="showCatModal = false">
      <div class="modal-box">
        <div class="modal-head">
          <h3>{{ catForm.uuid ? 'Editar Categoría' : 'Nueva Categoría Personalizada' }}</h3>
          <button class="close-x" @click="showCatModal = false">✕</button>
        </div>
        <form class="modal-form" @submit.prevent="submitCategory">
          <div class="form-grid-2">
            <div>
              <label class="label">Nombre de la Categoría *</label>
              <input v-model="catForm.name" class="input" placeholder="Ej. Mascotas, Gimnasio, Dividendos" required />
            </div>
            <div>
              <label class="label">Tipo *</label>
              <select v-model="catForm.type" class="select">
                <option value="EXPENSE">📉 Gasto</option>
                <option value="INCOME">📈 Ingreso</option>
              </select>
            </div>
          </div>
          <div class="form-grid-2">
            <div>
              <label class="label">Color de la Categoría</label>
              <input v-model="catForm.color" type="color" class="input" style="height: 42px; padding: 4px;" />
            </div>
            <div>
              <label class="label">Ícono</label>
              <select v-model="catForm.icon" class="select">
                <option value="utensils">🍽️ Alimentación</option>
                <option value="home">🏠 Vivienda</option>
                <option value="car">🚗 Transporte</option>
                <option value="heart-pulse">💊 Salud</option>
                <option value="gamepad-2">🎮 Ocio / Entretenimiento</option>
                <option value="shopping-bag">🛍️ Compras</option>
                <option value="tv">📺 Suscripciones</option>
                <option value="trending-up">📈 Inversión</option>
                <option value="briefcase">💼 Trabajo / Salario</option>
                <option value="laptop">💻 Tecnología / Freelance</option>
                <option value="plane">✈️ Viajes</option>
                <option value="sparkles">✨ Otros</option>
              </select>
            </div>
          </div>
          <div v-if="catForm.type === 'EXPENSE'" class="form-grid-2">
            <div>
              <label class="label">Presupuesto Mensual Tope (0 = sin límite)</label>
              <input v-model.number="catForm.monthlyBudget" type="number" step="0.01" min="0" class="input" />
            </div>
            <div>
              <label class="label">Clasificación 50/30/20</label>
              <select v-model="catForm.budgetNeedType" class="select">
                <option value="NEEDS">🏠 Necesidad Básica (50%)</option>
                <option value="WANTS">🎉 Deseo / Ocio (30%)</option>
                <option value="SAVINGS">🚀 Ahorro / Inversión (20%)</option>
              </select>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="showCatModal = false">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar Categoría</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: QUICK 1-TAP TEMPLATE -->
    <div v-if="showTemplateModal" class="modal-overlay" @click.self="showTemplateModal = false">
      <div class="modal-box">
        <div class="modal-head">
          <h3>⚡ Crear Botón de Registro Rápido</h3>
          <button class="close-x" @click="showTemplateModal = false">✕</button>
        </div>
        <form class="modal-form" @submit.prevent="submitTemplate">
          <div class="form-grid-2">
            <div>
              <label class="label">Nombre del Botón *</label>
              <input v-model="tmplForm.title" class="input" placeholder="Ej. Café, Taxi, Panadería" required />
            </div>
            <div>
              <label class="label">Monto ({{ store.currencySymbol }}) *</label>
              <input v-model.number="tmplForm.amount" type="number" step="0.01" class="input" required />
            </div>
          </div>
          <div class="form-grid-2">
            <div>
              <label class="label">Emoji</label>
              <input v-model="tmplForm.icon" class="input" placeholder="☕" maxlength="4" />
            </div>
            <div>
              <label class="label">Color</label>
              <input v-model="tmplForm.color" type="color" class="input" style="height:42px; padding:4px;" />
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="showTemplateModal = false">Cancelar</button>
            <button type="submit" class="btn btn-primary">Crear Botón Rápido</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: SAVINGS GOAL -->
    <div v-if="showGoalModal" class="modal-overlay" @click.self="showGoalModal = false">
      <div class="modal-box">
        <div class="modal-head">
          <h3>🎯 Meta de Ahorro</h3>
          <button class="close-x" @click="showGoalModal = false">✕</button>
        </div>
        <form class="modal-form" @submit.prevent="submitGoal">
          <div>
            <label class="label">Nombre de la Meta *</label>
            <input v-model="goalForm.name" class="input" placeholder="Ej. Viaje a Japón, Fondo Emergencia" required />
          </div>
          <div class="form-grid-2">
            <div>
              <label class="label">Monto Objetivo *</label>
              <input v-model.number="goalForm.targetAmount" type="number" step="0.01" class="input" required />
            </div>
            <div>
              <label class="label">Ahorrado Actualmente</label>
              <input v-model.number="goalForm.currentAmount" type="number" step="0.01" class="input" />
            </div>
          </div>
          <div class="form-grid-2">
            <div>
              <label class="label">Fecha Objetivo</label>
              <input v-model="goalForm.deadline" type="date" class="input" />
            </div>
            <div>
              <label class="label">Color</label>
              <input v-model="goalForm.color" type="color" class="input" style="height:42px; padding:4px;" />
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="showGoalModal = false">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar Meta</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: RECURRING RULE -->
    <div v-if="showRecurringModal" class="modal-overlay" @click.self="showRecurringModal = false">
      <div class="modal-box">
        <div class="modal-head">
          <h3>🔁 Nuevo Pago o Ingreso Recurrente</h3>
          <button class="close-x" @click="showRecurringModal = false">✕</button>
        </div>
        <form class="modal-form" @submit.prevent="submitRecurring">
          <div class="form-grid-2">
            <div>
              <label class="label">Concepto *</label>
              <input v-model="recForm.title" class="input" placeholder="Ej. Netflix, Gimnasio, Alquiler" required />
            </div>
            <div>
              <label class="label">Tipo</label>
              <select v-model="recForm.type" class="select">
                <option value="EXPENSE">Gasto Fijo / Suscripción</option>
                <option value="INCOME">Ingreso Fijo</option>
              </select>
            </div>
          </div>
          <div class="form-grid-2">
            <div>
              <label class="label">Monto *</label>
              <input v-model.number="recForm.amount" type="number" step="0.01" class="input" required />
            </div>
            <div>
              <label class="label">Frecuencia</label>
              <select v-model="recForm.frequency" class="select">
                <option value="MONTHLY">Mensual</option>
                <option value="WEEKLY">Semanal</option>
                <option value="YEARLY">Anual</option>
              </select>
            </div>
          </div>
          <div class="form-grid-2">
            <div>
              <label class="label">Cuenta</label>
              <select v-model="recForm.accountUuid" class="select">
                <option v-for="a in store.accounts" :key="a.uuid" :value="a.uuid">{{ a.name }}</option>
              </select>
            </div>
            <div>
              <label class="label">Próxima Fecha</label>
              <input v-model="recForm.nextDueDate" type="date" class="input" />
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="showRecurringModal = false">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar Recurrente</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: DEBT / LOAN -->
    <div v-if="showDebtModal" class="modal-overlay" @click.self="showDebtModal = false">
      <div class="modal-box">
        <div class="modal-head">
          <h3>🤝 Registrar Deuda o Préstamo</h3>
          <button class="close-x" @click="showDebtModal = false">✕</button>
        </div>
        <form class="modal-form" @submit.prevent="submitDebt">
          <div class="form-grid-2">
            <div>
              <label class="label">Persona o Entidad *</label>
              <input v-model="debtForm.personName" class="input" placeholder="Ej. Juan Pérez, Banco..." required />
            </div>
            <div>
              <label class="label">Tipo *</label>
              <select v-model="debtForm.type" class="select">
                <option value="OWED_TO_ME">🟢 Me deben dinero</option>
                <option value="I_OWE">🔴 Yo debo dinero</option>
              </select>
            </div>
          </div>
          <div class="form-grid-2">
            <div>
              <label class="label">Monto Total *</label>
              <input v-model.number="debtForm.totalAmount" type="number" step="0.01" class="input" required />
            </div>
            <div>
              <label class="label">Monto Ya Pagado</label>
              <input v-model.number="debtForm.paidAmount" type="number" step="0.01" class="input" />
            </div>
          </div>
          <div>
            <label class="label">Notas</label>
            <input v-model="debtForm.notes" class="input" placeholder="Detalle del préstamo o cuotas" />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="showDebtModal = false">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar Registro</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: RECEIPT IMAGE PREVIEW -->
    <div v-if="previewReceiptUrl" class="modal-overlay" @click="previewReceiptUrl = ''">
      <div class="modal-box" style="text-align:center;">
        <h3>Comprobante Adjunto</h3>
        <img :src="previewReceiptUrl" alt="Comprobante" style="max-width:100%; max-height:70vh; border-radius:12px; margin-top:1rem;" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFinanceStore, CURRENCIES } from './stores/financeStore'
import { useThemeStore } from './stores/themeStore'
import FinanceCharts from './components/FinanceCharts.vue'
import ThemeCustomizer from './components/ThemeCustomizer.vue'

const store = useFinanceStore()
const themeStore = useThemeStore()
const currencies = CURRENCIES

// Navigation
const activeTab = ref('dashboard')
const showQuickTheme = ref(false)

const navItems = [
  { id: 'dashboard', label: 'Dashboard General', short: 'Inicio', icon: '📊', subtitle: 'Resumen ejecutivo, plantillas rápidas y analítica en tiempo real' },
  { id: 'transactions', label: 'Movimientos', short: 'Gastos', icon: '💸', subtitle: 'Gastos, ingresos, transferencias, etiquetas y recibos' },
  { id: 'accounts', label: 'Cuentas y Tarjetas', short: 'Cuentas', icon: '🏦', subtitle: 'Bancos, efectivo, tarjetas de crédito e inversiones' },
  { id: 'categories', label: 'Categorías y Presupuestos', short: 'Presup.', icon: '🏷️', subtitle: 'Personaliza colores, íconos y límites de gasto mensual' },
  { id: 'planning', label: 'Metas, Fijos y Deudas', short: 'Metas', icon: '🎯', subtitle: 'Objetivos de ahorro, suscripciones recurrentes y préstamos' },
  { id: 'reports', label: 'Reportes y Exportación', short: 'Reportes', icon: '📈', subtitle: 'Mapa de calor diario, comparativas y exportación CSV / PDF' },
  { id: 'appearance', label: 'Color & Personalización', short: 'Color', icon: '🎨', subtitle: 'Modo Claro/Oscuro y Selector de Color Dinámico en vivo' }
]

const currentTabObj = computed(() => navItems.find(i => i.id === activeTab.value) || navItems[0])

// Auth Form
const authMode = ref('login')
const authLoading = ref(false)
const authError = ref('')
const authForm = ref({
  name: '',
  email: 'demo@finanzy.app',
  password: 'demo123',
  currency: 'USD'
})

async function submitAuth() {
  authLoading.value = true
  authError.value = ''
  const res = authMode.value === 'login'
    ? await store.login(authForm.value.email, authForm.value.password)
    : await store.register({
        name: authForm.value.name,
        email: authForm.value.email,
        password: authForm.value.password,
        currency: authForm.value.currency,
        themeMode: themeStore.themeMode,
        accentColor: themeStore.accentColor
      })
  authLoading.value = false
  if (!res.ok) {
    authError.value = res.message
  }
}

async function quickDemoLogin() {
  authLoading.value = true
  const res = await store.login('demo@finanzy.app', 'demo123')
  if (!res.ok) {
    await store.startOfflineDemoSession()
  }
  authLoading.value = false
}

// Month Navigation
function changeMonth(delta) {
  const [y, m] = store.selectedMonth.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  store.selectedMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function selectQuickMode(mode) {
  themeStore.setThemeMode(mode)
  store.updatePreferences({ themeMode: mode })
}

function selectQuickColor(hex) {
  themeStore.setAccentColor(hex)
  store.updatePreferences({ accentColor: hex })
}

// Filters for Transactions
const txSearch = ref('')
const txTypeFilter = ref('ALL')
const txAccountFilter = ref('ALL')
const txCategoryFilter = ref('ALL')

const filteredTransactions = computed(() => {
  return store.transactions.filter(t => {
    if (txTypeFilter.value !== 'ALL' && t.type !== txTypeFilter.value) return false
    if (txAccountFilter.value !== 'ALL' && t.accountUuid !== txAccountFilter.value) return false
    if (txCategoryFilter.value !== 'ALL' && t.categoryUuid !== txCategoryFilter.value) return false
    if (txSearch.value.trim()) {
      const q = txSearch.value.toLowerCase()
      const matchDesc = (t.description || '').toLowerCase().includes(q)
      const matchMerch = (t.merchant || '').toLowerCase().includes(q)
      const matchTags = (t.tags || '').toLowerCase().includes(q)
      if (!matchDesc && !matchMerch && !matchTags) return false
    }
    return true
  })
})

// Helpers
function getCategoryByUuid(uuid) {
  return store.categories.find(c => c.uuid === uuid)
}
function getAccountName(uuid) {
  return store.accounts.find(a => a.uuid === uuid)?.name || 'Cuenta'
}
function getCategoryEmoji(icon) {
  const map = {
    utensils: '🍽️',
    home: '🏠',
    car: '🚗',
    'heart-pulse': '💊',
    'gamepad-2': '🎮',
    'shopping-bag': '🛍️',
    tv: '📺',
    'trending-up': '📈',
    briefcase: '💼',
    laptop: '💻',
    plane: '✈️',
    sparkles: '✨',
    tag: '🏷️'
  }
  return map[icon] || '🏷️'
}
function getAccountTypeEmoji(type) {
  const map = {
    BANK: '🏦',
    CASH: '💵',
    CREDIT_CARD: '💳',
    SAVINGS: '🐷',
    INVESTMENT: '📈',
    DIGITAL_WALLET: '📱'
  }
  return map[type] || '🏦'
}
function getAccountTypeName(type) {
  const map = {
    BANK: 'Cuenta Bancaria',
    CASH: 'Efectivo',
    CREDIT_CARD: 'Tarjeta de Crédito',
    SAVINGS: 'Fondo de Ahorros',
    INVESTMENT: 'Inversión',
    DIGITAL_WALLET: 'Billetera Digital'
  }
  return map[type] || type
}
function getBudgetHex(pct) {
  if (pct >= 100) return '#ef4444'
  if (pct >= 80) return '#f59e0b'
  return '#10b981'
}
function getBudgetColorClass(pct) {
  if (pct >= 100) return 'text-danger'
  if (pct >= 80) return 'text-warning'
  return 'text-success'
}
function splitTags(tagsStr) {
  if (!tagsStr) return []
  return tagsStr.split(',').map(s => s.trim()).filter(Boolean)
}
function parseCustomFields(jsonStr) {
  try {
    return JSON.parse(jsonStr || '{}')
  } catch {
    return {}
  }
}
function hasCustomFields(jsonStr) {
  const obj = parseCustomFields(jsonStr)
  return Object.keys(obj).length > 0
}

// Modals State
const showTxModal = ref(false)
const txForm = ref({})
const txCustomFields = ref([])
const previewReceiptUrl = ref('')

function openNewTransactionModal(defaultType = 'EXPENSE') {
  const firstAcc = store.accounts[0]?.uuid || ''
  const firstCat = store.categories.find(c => c.type === defaultType)?.uuid || store.categories[0]?.uuid || ''
  txForm.value = {
    uuid: null,
    type: defaultType,
    amount: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    accountUuid: firstAcc,
    toAccountUuid: store.accounts[1]?.uuid || '',
    categoryUuid: firstCat,
    merchant: '',
    paymentMethod: 'Tarjeta Débito',
    tags: '',
    receiptDataUrl: ''
  }
  txCustomFields.value = []
  showTxModal.value = true
}

function editTransaction(tx) {
  txForm.value = { ...tx }
  const cfObj = parseCustomFields(tx.customFieldsJson)
  txCustomFields.value = Object.entries(cfObj).map(([key, value]) => ({ key, value }))
  showTxModal.value = true
}

function addCustomFieldRow() {
  txCustomFields.value.push({ key: '', value: '' })
}

function handleReceiptUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = ev => {
    txForm.value.receiptDataUrl = ev.target.result
  }
  reader.readAsDataURL(file)
}

async function submitTransaction() {
  const customMap = {}
  for (const item of txCustomFields.value) {
    if (item.key && item.key.trim()) {
      customMap[item.key.trim()] = item.value
    }
  }
  txForm.value.customFieldsJson = JSON.stringify(customMap)
  await store.saveTransaction(txForm.value)
  showTxModal.value = false
}

async function triggerQuickTemplate(tmpl) {
  await store.saveTransaction({
    type: tmpl.type || 'EXPENSE',
    amount: tmpl.amount,
    description: tmpl.title,
    accountUuid: tmpl.accountUuid || store.accounts[0]?.uuid,
    categoryUuid: tmpl.categoryUuid || store.categories[0]?.uuid,
    date: new Date().toISOString().slice(0, 10),
    tags: tmpl.tags || 'rapido',
    paymentMethod: 'Efectivo'
  })
}

// Account Modal
const showAccModal = ref(false)
const accForm = ref({})
function openAccountModal(acc = null) {
  accForm.value = acc
    ? { ...acc }
    : { name: '', type: 'BANK', balance: 0, color: themeStore.accentColor, creditLimit: 2000, cutoffDay: 15, paymentDay: 5 }
  showAccModal.value = true
}
async function submitAccount() {
  await store.saveAccount(accForm.value)
  showAccModal.value = false
}

// Category Modal
const showCatModal = ref(false)
const catForm = ref({})
function openCategoryModal(cat = null) {
  catForm.value = cat
    ? { ...cat }
    : { name: '', type: 'EXPENSE', color: themeStore.accentColor, icon: 'utensils', monthlyBudget: 250, budgetNeedType: 'NEEDS' }
  showCatModal.value = true
}
async function submitCategory() {
  await store.saveCategory(catForm.value)
  showCatModal.value = false
}

// Quick Template Modal
const showTemplateModal = ref(false)
const tmplForm = ref({ title: '', amount: 5, icon: '⚡', color: '#6366f1' })
async function submitTemplate() {
  await store.saveQuickTemplate(tmplForm.value)
  showTemplateModal.value = false
}

// Goal Modal
const showGoalModal = ref(false)
const goalForm = ref({})
function openGoalModal(g = null) {
  goalForm.value = g
    ? { ...g }
    : { name: '', targetAmount: 1000, currentAmount: 0, deadline: '', color: '#10b981' }
  showGoalModal.value = true
}
async function submitGoal() {
  await store.saveGoal(goalForm.value)
  showGoalModal.value = false
}
async function addFundsToGoal(g) {
  const input = prompt(`¿Cuánto deseas abonar a "${g.name}"?`, '50')
  const val = Number(input)
  if (val > 0) {
    await store.saveGoal({ ...g, currentAmount: Number(g.currentAmount || 0) + val })
  }
}

// Recurring Modal
const showRecurringModal = ref(false)
const recForm = ref({})
function openRecurringModal() {
  recForm.value = {
    title: '',
    type: 'EXPENSE',
    amount: 20,
    frequency: 'MONTHLY',
    accountUuid: store.accounts[0]?.uuid || '',
    categoryUuid: store.categories[0]?.uuid || '',
    nextDueDate: new Date().toISOString().slice(0, 10)
  }
  showRecurringModal.value = true
}
async function submitRecurring() {
  await store.saveRecurring(recForm.value)
  showRecurringModal.value = false
}

// Debt Modal
const showDebtModal = ref(false)
const debtForm = ref({})
function openDebtModal() {
  debtForm.value = { personName: '', type: 'OWED_TO_ME', totalAmount: 100, paidAmount: 0, notes: '' }
  showDebtModal.value = true
}
async function submitDebt() {
  await store.saveDebt(debtForm.value)
  showDebtModal.value = false
}
async function payDebtInstallment(d) {
  const input = prompt(`Registrar abono para "${d.personName}":`, '50')
  const val = Number(input)
  if (val > 0) {
    await store.saveDebt({ ...d, paidAmount: Math.min(d.totalAmount, Number(d.paidAmount || 0) + val) })
  }
}

// Calendar Heatmap Data
const calendarDays = computed(() => {
  const [yr, mo] = store.selectedMonth.split('-').map(Number)
  const totalDays = new Date(yr, mo, 0).getDate()
  const list = []
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${store.selectedMonth}-${String(d).padStart(2, '0')}`
    let expense = 0, income = 0
    for (const tx of store.monthTransactions) {
      if (tx.date === dateStr) {
        if (tx.type === 'EXPENSE') expense += Number(tx.amount || 0)
        if (tx.type === 'INCOME') income += Number(tx.amount || 0)
      }
    }
    list.push({ dayNum: d, dateStr, expense, income })
  }
  return list
})

function getHeatmapStyle(expense) {
  if (expense <= 0) return {}
  const alpha = Math.min(0.45, Math.max(0.1, expense / 400))
  return {
    backgroundColor: `rgba(var(--primary-rgb), ${alpha})`,
    borderColor: 'var(--primary)'
  }
}

// Export Functions
function exportToCSV() {
  const headers = ['Fecha', 'Tipo', 'Monto', 'Descripcion', 'Cuenta', 'Categoria', 'Comercio', 'MetodoPago', 'Etiquetas']
  const rows = store.transactions.map(t => [
    t.date,
    t.type,
    t.amount,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `"${getAccountName(t.accountUuid)}"`,
    `"${getCategoryByUuid(t.categoryUuid)?.name || ''}"`,
    `"${t.merchant || ''}"`,
    `"${t.paymentMethod || ''}"`,
    `"${t.tags || ''}"`
  ])
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Finanzy_Reporte_${store.selectedMonth}.csv`
  a.click()
}

function exportBackupJSON() {
  const backup = {
    exportedAt: new Date().toISOString(),
    user: store.user,
    accounts: store.accounts,
    categories: store.categories,
    transactions: store.transactions,
    goals: store.goals,
    debts: store.debts,
    recurringRules: store.recurringRules
  }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Finanzy_Backup_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
}

function printReport() {
  window.print()
}

onMounted(async () => {
  themeStore.applyThemeToDOM()
  if (store.isAuthenticated) {
    await store.loadFromLocalDB()
    await store.syncWithBackend()
  }
})
</script>

<style scoped>
/* Auth Layout */
.auth-wrapper {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: radial-gradient(circle at top right, var(--primary-soft), transparent 55%), var(--bg-app);
}
.auth-card {
  width: 100%;
  max-width: 430px;
  padding: 1.5rem 1.25rem;
}
.auth-brand {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 1.1rem;
}
.logo-badge {
  width: 44px;
  height: 44px;
  border-radius: 13px;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
  box-shadow: 0 6px 18px var(--primary-glow);
}
.logo-badge.sm {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  font-size: 1rem;
}
.auth-brand h1 { font-size: 1.4rem; font-weight: 800; }
.auth-brand p { font-size: 0.78rem; color: var(--text-muted); }

.auth-theme-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-app);
  padding: 0.45rem 0.65rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  border: 1px solid var(--border-color);
  gap: 0.5rem;
}
.auth-modes, .auth-dots {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.chip-btn {
  background: transparent;
  border: 1px solid transparent;
  padding: 0.25rem 0.45rem;
  border-radius: 8px;
  cursor: pointer;
}
.chip-btn.active {
  background: var(--primary-soft);
  border-color: var(--primary);
}
.mini-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.4);
  cursor: pointer;
  flex-shrink: 0;
}
.mini-picker {
  cursor: pointer;
  position: relative;
  font-size: 1rem;
}
.mini-picker input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
}

.auth-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--bg-app);
  padding: 4px;
  border-radius: 12px;
  margin-bottom: 1.1rem;
}
.auth-tabs button {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 0.55rem;
  font-weight: 600;
  border-radius: 9px;
  cursor: pointer;
}
.auth-tabs button.active {
  background: var(--bg-card);
  color: var(--text-main);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.auth-error {
  color: #ef4444;
  font-size: 0.82rem;
}
.auth-divider {
  text-align: center;
  margin: 0.9rem 0;
  font-size: 0.76rem;
  color: var(--text-muted);
}
.auth-hint {
  margin-top: 0.9rem;
  font-size: 0.73rem;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.4;
}
.full-w { width: 100%; }

/* Mobile Top Status Bar (iPhone 16) */
.mobile-top-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.65rem 0.9rem;
  background: var(--bg-sidebar);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 400;
}
.mob-brand {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}
.mob-brand strong {
  display: block;
  font-size: 0.95rem;
  line-height: 1.1;
}
.mob-sync-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.68rem;
  color: var(--text-muted);
}
.mob-sync-indicator .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f59e0b;
}
.mob-sync-indicator.online .dot {
  background: #10b981;
}
.mob-top-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

/* Desktop Sidebar */
.desktop-sidebar {
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  padding: 1.35rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  position: sticky;
  top: 0;
  height: 100vh;
}
.brand-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 0.4rem;
}
.brand-name { font-size: 1.25rem; font-weight: 800; }
.brand-tag { font-size: 0.72rem; color: var(--primary); font-weight: 600; }
.new-tx-cta { width: 100%; padding: 0.75rem; font-size: 0.92rem; }

.side-nav {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1;
}
.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.72rem 0.85rem;
  border-radius: 12px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.16s ease;
}
.nav-btn:hover {
  background: var(--primary-soft);
  color: var(--text-main);
}
.nav-btn.active {
  background: var(--primary);
  color: var(--primary-contrast);
  box-shadow: 0 4px 14px -3px var(--primary-glow);
}

.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.sync-box {
  background: var(--bg-app);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.sync-status-line {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.76rem;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f59e0b;
}
.sync-box.online .status-dot {
  background: #10b981;
}
.sync-box small {
  font-size: 0.7rem;
  color: var(--text-muted);
}
.sync-mini-btn {
  margin-top: 0.3rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-main);
  border-radius: 8px;
  padding: 0.3rem;
  font-size: 0.73rem;
  cursor: pointer;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-color);
}
.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--primary);
  color: var(--primary-contrast);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}
.user-meta {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.user-meta strong { font-size: 0.82rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-meta small { font-size: 0.68rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.logout-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

/* Main Area & Topbar */
.main-area {
  padding: 1.5rem 2rem;
  max-width: 1440px;
  width: 100%;
  min-width: 0;
  margin: 0 auto;
}
@media (max-width: 768px) {
  .main-area {
    padding: 0.85rem 0.75rem;
  }
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 1.2rem;
  flex-wrap: wrap;
}
.topbar-left {
  min-width: 0;
}
.page-title {
  font-size: clamp(1.15rem, 4.5vw, 1.45rem);
  font-weight: 800;
  line-height: 1.2;
}
.page-subtitle {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 0.15rem;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
}
.topbar-btns-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@media (max-width: 640px) {
  .topbar {
    flex-direction: column;
    align-items: stretch;
    gap: 0.65rem;
    margin-bottom: 0.95rem;
  }
  .topbar-actions {
    width: 100%;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.5rem;
  }
  .month-selector {
    width: 100%;
    justify-content: space-between;
  }
}

.month-selector {
  display: flex;
  align-items: center;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 0.18rem;
  min-width: 0;
}
.month-step {
  background: transparent;
  border: none;
  color: var(--text-main);
  padding: 0.38rem 0.5rem;
  cursor: pointer;
  border-radius: 8px;
  flex-shrink: 0;
}
.month-step:hover { background: var(--bg-elevated); }
.month-input {
  background: transparent;
  border: none;
  color: var(--text-main);
  font-family: inherit;
  font-weight: 600;
  font-size: 0.82rem;
  outline: none;
  min-width: 0;
  max-width: 130px;
  text-align: center;
}

/* Quick Theme Popover / Sheet */
.color-dot-indicator {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 2px solid #fff;
  flex-shrink: 0;
}
.quick-theme-backdrop {
  position: fixed;
  inset: 0;
  z-index: 950;
  background: rgba(9, 13, 22, 0.45);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 4.2rem 1.5rem 1rem;
}
.quick-theme-popover {
  width: 315px;
  max-width: 100%;
  box-shadow: 0 20px 40px rgba(0,0,0,0.45);
}
@media (max-width: 640px) {
  .quick-theme-backdrop {
    align-items: flex-end;
    justify-content: center;
    padding: 0.75rem;
    padding-bottom: calc(78px + var(--safe-bottom));
  }
  .quick-theme-popover {
    width: 100%;
    max-width: 100%;
  }
}
.pop-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.7rem;
}
.pop-modes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}
.pop-modes button {
  padding: 0.45rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-app);
  color: var(--text-main);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}
.pop-modes button.active {
  border-color: var(--primary);
  background: var(--primary-soft);
}
.pop-swatches {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.45rem;
  margin-bottom: 0.8rem;
}
.pop-swatch {
  height: 34px;
  border-radius: 8px;
  border: 2px solid rgba(255,255,255,0.2);
  color: #fff;
  font-weight: 800;
  cursor: pointer;
}
.pop-custom-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.native-color-input {
  width: 42px;
  height: 36px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: transparent;
  flex-shrink: 0;
}

/* Dashboard Content */
.tab-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  min-width: 0;
}
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
  width: 100%;
  min-width: 0;
}
@media (max-width: 960px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.65rem;
  }
}
.kpi-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}
@media (max-width: 480px) {
  .kpi-card {
    padding: 0.8rem;
  }
}
.primary-kpi {
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: var(--primary-contrast);
  border: none;
}
.primary-kpi .kpi-foot {
  color: var(--primary-contrast);
  opacity: 0.85;
}
.kpi-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.76rem;
  font-weight: 600;
  opacity: 0.9;
}
.kpi-top span:first-child {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.kpi-value {
  font-size: clamp(1.08rem, 4.2vw, 1.6rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.kpi-foot {
  font-size: 0.7rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.text-success { color: #10b981 !important; }
.text-danger { color: #ef4444 !important; }
.text-warning { color: #f59e0b !important; }

/* Quick Templates Bar */
.qt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.qt-header small {
  display: block;
  color: var(--text-muted);
  font-size: 0.74rem;
}
.qt-list {
  display: flex;
  gap: 0.55rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  width: 100%;
  max-width: 100%;
  -webkit-overflow-scrolling: touch;
}
.qt-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 13px;
  background: var(--bg-app);
  border: 1.5px solid var(--border-color);
  color: var(--text-main);
  cursor: pointer;
  flex-shrink: 0;
}
.qt-emoji { font-size: 1.15rem; }
.qt-meta { display: flex; flex-direction: column; text-align: left; }
.qt-meta strong { font-size: 0.78rem; }
.qt-meta span { font-size: 0.72rem; color: var(--primary); font-weight: 700; }
.qt-del {
  margin-left: 0.2rem;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.dash-bottom-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1rem;
  width: 100%;
  min-width: 0;
}
@media (max-width: 960px) {
  .dash-bottom-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.9rem;
  gap: 0.65rem;
  flex-wrap: wrap;
}
.section-head h3 {
  font-size: 0.98rem;
}
.muted-sm { font-size: 0.76rem; color: var(--text-muted); }

.rule-bars {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.rule-row-top {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.78rem;
  margin-bottom: 0.3rem;
}
.budget-alerts-mini {
  margin-top: 1.1rem;
  padding-top: 0.9rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.budget-alerts-mini h4 { font-size: 0.84rem; }
.mb-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  margin-bottom: 0.2rem;
}
.mb-cat-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.mb-cat-nums {
  flex-shrink: 0;
  font-size: 0.72rem;
}

/* Transaction List */
.tx-list {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  width: 100%;
  min-width: 0;
}
.tx-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  padding: 0.7rem 0.8rem;
  border-radius: 14px;
  background: var(--bg-app);
  border: 1px solid var(--border-color);
  cursor: pointer;
  min-width: 0;
  max-width: 100%;
}
.tx-main-body {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  min-width: 0;
  flex: 1;
}
.tx-icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05rem;
  flex-shrink: 0;
  color: #fff;
}
.tx-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}
.tx-desc-truncate, .tx-sub-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
.tx-title-line {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.tx-title-line strong {
  font-size: 0.88rem;
  word-break: break-word;
}
.tx-sub {
  font-size: 0.73rem;
  color: var(--text-muted);
  line-height: 1.3;
  word-break: break-word;
}
.tx-tags-row {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  margin-top: 0.2rem;
}
.tag-pill {
  font-size: 0.68rem;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 600;
}
.custom-field-pill {
  font-size: 0.68rem;
  padding: 0.1rem 0.45rem;
  border-radius: 6px;
  background: var(--bg-elevated);
  color: var(--text-secondary);
}
.receipt-pill {
  font-size: 0.68rem;
  padding: 0.1rem 0.5rem;
  border-radius: 6px;
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: none;
  cursor: pointer;
  font-weight: 600;
}
.tx-amount {
  font-weight: 800;
  font-size: 0.9rem;
  white-space: nowrap;
  flex-shrink: 0;
}
.tx-right-col {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-shrink: 0;
}
@media (max-width: 520px) {
  .tx-item.detailed-row {
    flex-direction: column;
    align-items: stretch;
    gap: 0.55rem;
  }
  .tx-item.detailed-row .tx-right-col {
    justify-content: space-between;
    padding-top: 0.45rem;
    border-top: 1px dashed var(--border-color);
  }
}
.row-actions {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;
}
.icon-btn {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.3rem 0.45rem;
  cursor: pointer;
  font-size: 0.78rem;
  flex-shrink: 0;
}

.filters-bar {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 0.65rem;
}
@media (max-width: 860px) {
  .filters-bar {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
  .filter-search {
    grid-column: 1 / -1;
  }
}
@media (max-width: 420px) {
  .filters-bar {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* Accounts & Categories Grids */
.accounts-grid, .cats-grid, .goals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.85rem;
  width: 100%;
  min-width: 0;
}
@media (max-width: 560px) {
  .accounts-grid, .cats-grid, .goals-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
.acc-top, .cat-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.65rem;
}
.acc-badge, .cat-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #fff;
  flex-shrink: 0;
}
.cat-avatar.sm {
  width: 28px;
  height: 28px;
  font-size: 0.9rem;
  border-radius: 8px;
}
.acc-type-label {
  font-size: 0.72rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.acc-name { font-size: 1.02rem; margin: 0.15rem 0; }
.acc-balance { font-size: 1.4rem; font-weight: 800; }
.cc-meta {
  margin-top: 0.7rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--border-color);
  font-size: 0.72rem;
  color: var(--text-muted);
}
.cc-row { display: flex; justify-content: space-between; gap: 0.4rem; flex-wrap: wrap; }

.cat-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
  flex: 1;
}
.cat-name-trunc {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.94rem;
}
.cat-numbers {
  display: flex;
  justify-content: space-between;
  margin: 0.65rem 0;
  font-size: 0.82rem;
}
.cat-numbers small {
  display: block;
  color: var(--text-muted);
  font-size: 0.7rem;
}
.cat-budget-foot {
  display: flex;
  justify-content: space-between;
  font-size: 0.73rem;
  margin-top: 0.35rem;
}
.income-cats-row {
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
}
.income-cat-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.7rem;
  border-radius: 12px;
  background: var(--bg-app);
  border: 1.5px solid var(--border-color);
  font-size: 0.82rem;
}

/* Goals & Debts */
.goal-box {
  background: var(--bg-app);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-width: 0;
}
.goal-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}
.goal-nums {
  display: flex;
  justify-content: space-between;
  gap: 0.4rem;
  font-size: 0.78rem;
  flex-wrap: wrap;
}

/* Reports & Calendar Heatmap */
.export-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.85rem;
}
.export-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.calendar-heatmap {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(105px, 1fr));
  gap: 0.5rem;
}
@media (max-width: 480px) {
  .calendar-heatmap {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.45rem;
  }
}
.cal-cell {
  background: var(--bg-app);
  border: 1px solid var(--border-color);
  border-radius: 11px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-height: 68px;
  min-width: 0;
}
.cal-day-num { font-size: 0.68rem; color: var(--text-muted); font-weight: 600; }
.cal-exp { font-size: 0.78rem; color: #ef4444; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cal-inc { font-size: 0.7rem; color: #10b981; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cal-zero { font-size: 0.72rem; color: var(--text-muted); opacity: 0.5; }

/* Modals */
.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.9rem;
}
.close-x {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.2rem;
  cursor: pointer;
}
.type-seg {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.4rem;
  margin-bottom: 0.9rem;
}
.type-seg button {
  padding: 0.55rem 0.35rem;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--bg-app);
  color: var(--text-secondary);
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
}
.type-seg button.active.exp { background: rgba(239,68,68,0.18); border-color: #ef4444; color: #ef4444; }
.type-seg button.active.inc { background: rgba(16,185,129,0.18); border-color: #10b981; color: #10b981; }
.type-seg button.active.trf { background: var(--primary-soft); border-color: var(--primary); color: var(--primary); }

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.form-grid-2 {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.75rem;
}
@media (max-width: 520px) {
  .form-grid-2 {
    grid-template-columns: minmax(0, 1fr);
  }
}
.amount-big {
  font-size: 1.15rem;
  font-weight: 800;
}
.custom-fields-section {
  background: var(--bg-app);
  padding: 0.65rem;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.cf-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}
.cf-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 0.4rem;
}
.receipt-preview-wrap {
  margin-top: 0.45rem;
  display: flex;
  align-items: center;
  gap: 0.65rem;
}
.receipt-preview-wrap img {
  height: 54px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 0.4rem;
}
.btn-sm { padding: 0.42rem 0.75rem; font-size: 0.78rem; }
.btn-xs { padding: 0.24rem 0.5rem; font-size: 0.72rem; }
.empty-msg {
  text-align: center;
  padding: 1.25rem;
  color: var(--text-muted);
  font-size: 0.84rem;
}

/* Mobile Bottom Nav (Optimized for iPhone 16 393px width & Home Indicator) */
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-sidebar);
  border-top: 1px solid var(--border-color);
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  padding: 0.35rem 0.15rem calc(0.35rem + var(--safe-bottom));
  z-index: 500;
  backdrop-filter: blur(12px);
}
.mob-nav-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.12rem;
  padding: 0.25rem 0.1rem;
  border-radius: 10px;
  cursor: pointer;
  min-width: 0;
}
.mob-nav-icon {
  font-size: 1.05rem;
  line-height: 1;
}
.mob-nav-btn.active {
  color: var(--primary);
  font-weight: 700;
}
.mob-nav-btn small {
  font-size: 0.58rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
</style>
