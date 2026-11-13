<template>
  <div class="charts-grid">
    <!-- Cashflow 6 Months Chart -->
    <div class="card">
      <div class="chart-header">
        <div>
          <h3 class="chart-title">Flujo de Caja (Últimos 6 Meses)</h3>
          <p class="chart-subtitle">Comparativa de Ingresos vs. Gastos y Balance Neto</p>
        </div>
        <span class="badge" :style="{ background: 'var(--primary-soft)', color: 'var(--primary)' }">
          Interactivo
        </span>
      </div>
      <div class="chart-canvas-wrap">
        <Bar :data="cashflowChartData" :options="barChartOptions" />
      </div>
    </div>

    <!-- Category Distribution Doughnut -->
    <div class="card">
      <div class="chart-header">
        <div>
          <h3 class="chart-title">Distribución de Gastos por Categoría</h3>
          <p class="chart-subtitle">Desglose porcentual del mes seleccionado</p>
        </div>
      </div>
      <div v-if="hasExpenses" class="doughnut-layout">
        <div class="doughnut-canvas">
          <Doughnut :data="categoryDoughnutData" :options="doughnutOptions" />
        </div>
        <div class="doughnut-legend">
          <div
            v-for="cat in topCategories"
            :key="cat.uuid"
            class="legend-item"
          >
            <div class="legend-left">
              <span class="legend-dot" :style="{ backgroundColor: cat.color }"></span>
              <span class="legend-name">{{ cat.name }}</span>
            </div>
            <div class="legend-right">
              <strong>{{ store.formatMoney(cat.spent) }}</strong>
              <span class="legend-pct">{{ cat.percentageOfTotal }}%</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-chart">
        <p>Sin gastos registrados en {{ store.selectedMonth }} para graficar.</p>
      </div>
    </div>

    <!-- Daily Evolution Line Chart (Full width if showDaily) -->
    <div v-if="showDaily" class="card full-span">
      <div class="chart-header">
        <div>
          <h3 class="chart-title">Ritmo Diario de Gastos e Ingresos ({{ store.selectedMonth }})</h3>
          <p class="chart-subtitle">Detecta los días pico de mayor consumo en el mes</p>
        </div>
      </div>
      <div class="chart-canvas-wrap" style="height: 230px;">
        <Line :data="dailyLineData" :options="lineChartOptions" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Filler
} from 'chart.js'
import { Bar, Doughnut, Line } from 'vue-chartjs'
import { useFinanceStore } from '../stores/financeStore'
import { useThemeStore } from '../stores/themeStore'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Filler
)

defineProps({
  showDaily: {
    type: Boolean,
    default: false
  }
})

const store = useFinanceStore()
const themeStore = useThemeStore()

const hasExpenses = computed(() => store.monthlyExpense > 0)
const topCategories = computed(() => store.categoryBreakdown.filter(c => c.spent > 0).slice(0, 6))

const cashflowChartData = computed(() => {
  const series = store.sixMonthsSeries
  return {
    labels: series.map(s => s.label),
    datasets: [
      {
        label: 'Ingresos',
        backgroundColor: '#10b981',
        borderRadius: 6,
        data: series.map(s => s.income)
      },
      {
        label: 'Gastos',
        backgroundColor: '#ef4444',
        borderRadius: 6,
        data: series.map(s => s.expense)
      },
      {
        label: 'Ahorro Neto',
        backgroundColor: themeStore.accentColor,
        borderRadius: 6,
        data: series.map(s => Math.max(0, s.net))
      }
    ]
  }
})

const categoryDoughnutData = computed(() => {
  const active = store.categoryBreakdown.filter(c => c.spent > 0)
  return {
    labels: active.map(c => c.name),
    datasets: [
      {
        data: active.map(c => c.spent),
        backgroundColor: active.map(c => c.color),
        borderWidth: 2,
        borderColor: themeStore.isDark ? '#1e293b' : '#ffffff',
        hoverOffset: 6
      }
    ]
  }
})

const dailyLineData = computed(() => {
  const [yr, mo] = store.selectedMonth.split('-').map(Number)
  const daysInMonth = new Date(yr, mo, 0).getDate()
  const labels = []
  const expData = []
  const incData = []

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${store.selectedMonth}-${String(d).padStart(2, '0')}`
    labels.push(String(d))
    let dayExp = 0
    let dayInc = 0
    for (const t of store.monthTransactions) {
      if (t.date === dayStr) {
        if (t.type === 'EXPENSE') dayExp += Number(t.amount || 0)
        if (t.type === 'INCOME') dayInc += Number(t.amount || 0)
      }
    }
    expData.push(dayExp)
    incData.push(dayInc)
  }

  return {
    labels,
    datasets: [
      {
        label: 'Gasto Diario',
        data: expData,
        borderColor: themeStore.accentColor,
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        fill: true,
        tension: 0.35,
        pointRadius: 2.5
      },
      {
        label: 'Ingreso Diario',
        data: incData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        fill: false,
        tension: 0.35,
        pointRadius: 2.5
      }
    ]
  }
})

const textColor = computed(() => (themeStore.isDark ? '#cbd5e1' : '#334155'))
const gridColor = computed(() => (themeStore.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'))

const barChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: { color: textColor.value, usePointStyle: true, boxWidth: 8, font: { size: 11 } }
    }
  },
  scales: {
    x: {
      ticks: { color: textColor.value, font: { size: 11 } },
      grid: { display: false }
    },
    y: {
      ticks: { color: textColor.value, font: { size: 10 }, maxTicksLimit: 6 },
      grid: { color: gridColor.value }
    }
  }
}))

const lineChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: { color: textColor.value, usePointStyle: true, boxWidth: 8, font: { size: 11 } }
    }
  },
  scales: {
    x: {
      ticks: { color: textColor.value, font: { size: 10 }, maxTicksLimit: 10 },
      grid: { display: false }
    },
    y: {
      ticks: { color: textColor.value, font: { size: 10 }, maxTicksLimit: 5 },
      grid: { color: gridColor.value }
    }
  }
}))

const doughnutOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: { display: false }
  }
}))
</script>

<style scoped>
.charts-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 1.15rem;
  width: 100%;
  min-width: 0;
}
.full-span {
  grid-column: 1 / -1;
}
@media (max-width: 980px) {
  .charts-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.9rem;
  }
}
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.85rem;
}
.chart-title {
  font-size: 0.96rem;
  font-weight: 700;
  line-height: 1.25;
}
.chart-subtitle {
  font-size: 0.76rem;
  color: var(--text-muted);
  margin-top: 0.15rem;
}
.chart-canvas-wrap {
  height: 250px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  position: relative;
  overflow: hidden;
}
@media (max-width: 480px) {
  .chart-canvas-wrap {
    height: 215px;
  }
}
.doughnut-layout {
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr);
  align-items: center;
  gap: 1rem;
  width: 100%;
  min-width: 0;
}
@media (max-width: 580px) {
  .doughnut-layout {
    grid-template-columns: minmax(0, 1fr);
    justify-items: center;
  }
  .doughnut-legend {
    width: 100%;
  }
}
.doughnut-canvas {
  height: 170px;
  width: 170px;
  max-width: 100%;
  position: relative;
}
.doughnut-legend {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 0;
  width: 100%;
}
.legend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  padding: 0.38rem 0.55rem;
  border-radius: 8px;
  background: var(--bg-app);
  min-width: 0;
}
.legend-left {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  overflow: hidden;
  min-width: 0;
  flex: 1;
}
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.legend-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.legend-right {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}
.legend-pct {
  font-size: 0.72rem;
  color: var(--text-muted);
  min-width: 30px;
  text-align: right;
}
.empty-chart {
  height: 190px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 0.85rem;
  text-align: center;
}
</style>
