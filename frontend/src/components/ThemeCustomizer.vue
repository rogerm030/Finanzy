<template>
  <div class="theme-studio">
    <!-- Mode Selector Card -->
    <div class="card">
      <h3 class="section-title">1. Modo de Iluminación</h3>
      <p class="section-desc">Elige entre modo claro, modo oscuro profundo o sincronizado con tu dispositivo.</p>

      <div class="mode-grid">
        <button
          class="mode-card"
          :class="{ active: themeStore.themeMode === 'light' }"
          @click="selectMode('light')"
        >
          <div class="mode-preview light-prev">
            <div class="prev-bar"></div>
            <div class="prev-box"></div>
          </div>
          <div class="mode-info">
            <span>☀️ Claro</span>
            <small>Alto contraste</small>
          </div>
        </button>

        <button
          class="mode-card"
          :class="{ active: themeStore.themeMode === 'dark' }"
          @click="selectMode('dark')"
        >
          <div class="mode-preview dark-prev">
            <div class="prev-bar"></div>
            <div class="prev-box"></div>
          </div>
          <div class="mode-info">
            <span>🌙 Oscuro</span>
            <small>Ahorro OLED</small>
          </div>
        </button>

        <button
          class="mode-card"
          :class="{ active: themeStore.themeMode === 'system' }"
          @click="selectMode('system')"
        >
          <div class="mode-preview sys-prev">
            <div class="prev-bar"></div>
            <div class="prev-box"></div>
          </div>
          <div class="mode-info">
            <span>💻 Auto</span>
            <small>Según sistema</small>
          </div>
        </button>
      </div>

      <div class="tint-toggle-row">
        <div style="min-width: 0;">
          <strong>Armonizar fondo con el color elegido (Material You)</strong>
          <p class="section-desc">Aplica un matiz sutil del color de acento en las tarjetas.</p>
        </div>
        <label class="switch">
          <input
            type="checkbox"
            :checked="themeStore.surfaceTint"
            @change="themeStore.setSurfaceTint($event.target.checked)"
          />
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <!-- Recommended Colors Card -->
    <div class="card">
      <h3 class="section-title">2. Colores Recomendados (1-Toque)</h3>
      <p class="section-desc">Paletas diseñadas especialmente para lectura financiera y gráficos.</p>

      <div class="swatches-grid">
        <button
          v-for="item in themeStore.recommendedColors"
          :key="item.hex"
          class="swatch-btn"
          :class="{ selected: themeStore.accentColor.toLowerCase() === item.hex.toLowerCase() }"
          @click="selectColor(item.hex)"
        >
          <span class="swatch-circle" :style="{ backgroundColor: item.hex }">
            <span v-if="themeStore.accentColor.toLowerCase() === item.hex.toLowerCase()">✓</span>
          </span>
          <div class="swatch-text">
            <strong>{{ item.name }}</strong>
            <small>{{ item.desc }}</small>
          </div>
        </button>
      </div>
    </div>

    <!-- Dynamic Custom Color Picker -->
    <div class="card">
      <div class="picker-header">
        <div style="min-width: 0;">
          <h3 class="section-title">3. Selector de Color Dinámico y Personalizado</h3>
          <p class="section-desc">Elige cualquier color imaginable: la app calcula contrastes y brillos en tiempo real.</p>
        </div>
        <div class="live-badge" :style="{ backgroundColor: themeStore.accentColor, color: 'var(--primary-contrast)' }">
          {{ themeStore.accentColor.toUpperCase() }}
        </div>
      </div>

      <div class="dynamic-picker-layout">
        <!-- Color Wheel Input + Hex Input -->
        <div class="wheel-box">
          <label class="color-wheel-trigger" :style="{ backgroundColor: themeStore.accentColor }">
            <input
              type="color"
              :value="themeStore.accentColor"
              @input="selectColor($event.target.value)"
            />
            <span class="wheel-caption">🎨 Toca para abrir Selector Libre</span>
          </label>
          <div class="hex-input-group">
            <label class="label">Código HEX directo</label>
            <input
              type="text"
              class="input"
              :value="themeStore.accentColor"
              maxlength="7"
              placeholder="#6366f1"
              @input="onHexInput($event.target.value)"
            />
          </div>
        </div>

        <!-- Interactive HSL Sliders -->
        <div class="hsl-sliders">
          <div class="slider-group">
            <div class="slider-label-row">
              <span>Matiz (Tono de color)</span>
              <strong>{{ themeStore.hsl.h }}°</strong>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              :value="themeStore.hsl.h"
              class="range-input hue-rainbow"
              @input="updateHsl(Number($event.target.value), themeStore.hsl.s, themeStore.hsl.l)"
            />
          </div>

          <div class="slider-group">
            <div class="slider-label-row">
              <span>Saturación (Intensidad)</span>
              <strong>{{ themeStore.hsl.s }}%</strong>
            </div>
            <input
              type="range"
              min="25"
              max="100"
              :value="themeStore.hsl.s"
              class="range-input"
              :style="{ background: `linear-gradient(to right, hsl(${themeStore.hsl.h}, 20%, 50%), hsl(${themeStore.hsl.h}, 100%, 50%))` }"
              @input="updateHsl(themeStore.hsl.h, Number($event.target.value), themeStore.hsl.l)"
            />
          </div>

          <div class="slider-group">
            <div class="slider-label-row">
              <span>Brillo / Luminosidad</span>
              <strong>{{ themeStore.hsl.l }}%</strong>
            </div>
            <input
              type="range"
              min="32"
              max="68"
              :value="themeStore.hsl.l"
              class="range-input"
              :style="{ background: `linear-gradient(to right, hsl(${themeStore.hsl.h}, ${themeStore.hsl.s}%, 25%), hsl(${themeStore.hsl.h}, ${themeStore.hsl.s}%, 50%), hsl(${themeStore.hsl.h}, ${themeStore.hsl.s}%, 75%))` }"
              @input="updateHsl(themeStore.hsl.h, themeStore.hsl.s, Number($event.target.value))"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Financial Preferences & 50/30/20 Customization -->
    <div class="card">
      <h3 class="section-title">4. Moneda y Regla de Presupuesto (50/30/20)</h3>
      <p class="section-desc">Personaliza tu divisa principal y la distribución ideal de tus ingresos.</p>

      <div class="prefs-grid">
        <div>
          <label class="label">Nombre para mostrar</label>
          <input
            v-model="localName"
            class="input"
            placeholder="Tu nombre"
            @change="saveUserPrefs"
          />
        </div>
        <div>
          <label class="label">Moneda Principal</label>
          <select v-model="localCurrency" class="select" @change="saveUserPrefs">
            <option v-for="c in currencies" :key="c.code" :value="c.code">
              {{ c.symbol }} — {{ c.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="rule-inputs">
        <div>
          <label class="label">% Necesidades</label>
          <input v-model.number="needsPct" type="number" min="10" max="90" class="input" @change="saveUserPrefs" />
        </div>
        <div>
          <label class="label">% Deseos</label>
          <input v-model.number="wantsPct" type="number" min="5" max="80" class="input" @change="saveUserPrefs" />
        </div>
        <div>
          <label class="label">% Ahorro</label>
          <input v-model.number="savingsPct" type="number" min="5" max="80" class="input" @change="saveUserPrefs" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useThemeStore } from '../stores/themeStore'
import { useFinanceStore, CURRENCIES } from '../stores/financeStore'

const themeStore = useThemeStore()
const financeStore = useFinanceStore()
const currencies = CURRENCIES

const localName = ref(financeStore.user?.name || 'Roger')
const localCurrency = ref(financeStore.user?.currency || 'USD')
const needsPct = ref(financeStore.user?.budgetRuleNeeds || 50)
const wantsPct = ref(financeStore.user?.budgetRuleWants || 30)
const savingsPct = ref(financeStore.user?.budgetRuleSavings || 20)

watch(() => financeStore.user, u => {
  if (u) {
    localName.value = u.name || 'Roger'
    localCurrency.value = u.currency || 'USD'
    needsPct.value = u.budgetRuleNeeds || 50
    wantsPct.value = u.budgetRuleWants || 30
    savingsPct.value = u.budgetRuleSavings || 20
  }
}, { deep: true })

function selectMode(mode) {
  themeStore.setThemeMode(mode)
  financeStore.updatePreferences({ themeMode: mode })
}

function selectColor(hex) {
  themeStore.setAccentColor(hex)
  financeStore.updatePreferences({ accentColor: hex })
}

function onHexInput(val) {
  if (/^#[0-9A-Fa-f]{6}$/.test(val.trim())) {
    selectColor(val.trim())
  }
}

function updateHsl(h, s, l) {
  themeStore.setFromHsl(h, s, l)
  financeStore.updatePreferences({ accentColor: themeStore.accentColor })
}

function saveUserPrefs() {
  financeStore.updatePreferences({
    name: localName.value,
    currency: localCurrency.value,
    budgetRuleNeeds: needsPct.value,
    budgetRuleWants: wantsPct.value,
    budgetRuleSavings: savingsPct.value
  })
}
</script>

<style scoped>
.theme-studio {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  min-width: 0;
}
.section-title {
  font-size: 1rem;
  font-weight: 700;
}
.section-desc {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 0.2rem;
  line-height: 1.35;
}
.mode-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
  margin-top: 0.9rem;
}
.mode-card {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.65rem;
  border-radius: 14px;
  background: var(--bg-app);
  border: 2px solid var(--border-color);
  color: var(--text-main);
  cursor: pointer;
  text-align: left;
  min-width: 0;
  transition: all 0.2s ease;
}
.mode-card.active {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}
.mode-preview {
  height: 48px;
  border-radius: 8px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  border: 1px solid rgba(128,128,128,0.2);
}
.light-prev { background: #f8fafc; }
.light-prev .prev-bar { height: 8px; width: 45%; background: var(--primary); border-radius: 4px; }
.light-prev .prev-box { flex: 1; background: #e2e8f0; border-radius: 5px; }

.dark-prev { background: #0f172a; }
.dark-prev .prev-bar { height: 8px; width: 45%; background: var(--primary); border-radius: 4px; }
.dark-prev .prev-box { flex: 1; background: #1e293b; border-radius: 5px; }

.sys-prev { background: linear-gradient(135deg, #0f172a 50%, #f8fafc 50%); }
.sys-prev .prev-bar { height: 8px; width: 45%; background: var(--primary); border-radius: 4px; }
.sys-prev .prev-box { flex: 1; background: rgba(128,128,128,0.25); border-radius: 5px; }

.mode-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}
.mode-info span { font-weight: 700; font-size: 0.82rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mode-info small { color: var(--text-muted); font-size: 0.68rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.tint-toggle-row {
  margin-top: 1rem;
  padding-top: 0.9rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}
.tint-toggle-row strong {
  font-size: 0.86rem;
}

.swatches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(185px, 1fr));
  gap: 0.6rem;
  margin-top: 0.9rem;
}
@media (max-width: 480px) {
  .swatches-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
  }
}
.swatch-btn {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.6rem 0.65rem;
  border-radius: 13px;
  background: var(--bg-app);
  border: 2px solid var(--border-color);
  color: var(--text-main);
  cursor: pointer;
  text-align: left;
  min-width: 0;
  transition: all 0.18s ease;
}
.swatch-btn.selected {
  border-color: var(--primary);
  background: var(--primary-soft);
}
.swatch-circle {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 800;
  font-size: 0.8rem;
  flex-shrink: 0;
  box-shadow: 0 3px 10px rgba(0,0,0,0.25);
}
.swatch-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}
.swatch-text strong {
  font-size: 0.78rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.swatch-text small {
  font-size: 0.66rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}
.live-badge {
  padding: 0.35rem 0.7rem;
  border-radius: 10px;
  font-weight: 800;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}
.dynamic-picker-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 1.25rem;
  margin-top: 1rem;
  align-items: center;
}
@media (max-width: 720px) {
  .dynamic-picker-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
  }
}
.wheel-box {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.color-wheel-trigger {
  height: 92px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 25px -5px var(--primary-glow);
  border: 2px solid rgba(255,255,255,0.25);
}
.color-wheel-trigger input[type="color"] {
  position: absolute;
  inset: -10px;
  width: 120%;
  height: 120%;
  opacity: 0;
  cursor: pointer;
}
.wheel-caption {
  background: rgba(0, 0, 0, 0.48);
  color: #fff;
  padding: 0.38rem 0.75rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 600;
  backdrop-filter: blur(4px);
  pointer-events: none;
}
.hsl-sliders {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  min-width: 0;
}
.slider-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.slider-label-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  color: var(--text-secondary);
}
.range-input {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 14px;
  border-radius: 999px;
  outline: none;
  cursor: pointer;
  border: 1px solid var(--border-color);
}
.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #ffffff;
  border: 3px solid var(--primary);
  box-shadow: 0 2px 6px rgba(0,0,0,0.35);
  cursor: grab;
}
.hue-rainbow {
  background: linear-gradient(
    to right,
    #ff0000 0%,
    #ffff00 17%,
    #00ff00 33%,
    #00ffff 50%,
    #0000ff 67%,
    #ff00ff 83%,
    #ff0000 100%
  );
}
.prefs-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.85rem;
  margin-top: 0.9rem;
}
.rule-inputs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 0.85rem;
}
@media (max-width: 560px) {
  .prefs-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* Toggle Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 46px;
  height: 26px;
  flex-shrink: 0;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: var(--bg-elevated);
  transition: 0.25s;
  border-radius: 34px;
}
.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.25s;
  border-radius: 50%;
}
input:checked + .slider {
  background-color: var(--primary);
}
input:checked + .slider:before {
  transform: translateX(20px);
}
</style>
