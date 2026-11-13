import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const RECOMMENDED_COLORS = [
  { name: 'Índigo Finanzy', hex: '#6366f1', desc: 'Equilibrio y modernidad' },
  { name: 'Esmeralda Riqueza', hex: '#10b981', desc: 'Crecimiento y ahorro' },
  { name: 'Violeta Imperial', hex: '#8b5cf6', desc: 'Creativo y elegante' },
  { name: 'Azul Océano', hex: '#3b82f6', desc: 'Seguridad bancaria' },
  { name: 'Rosa Coral', hex: '#f43f5e', desc: 'Energía y dinamismo' },
  { name: 'Cian Turquesa', hex: '#06b6d4', desc: 'Fresco y tecnológico' },
  { name: 'Ámbar Dorado', hex: '#f59e0b', desc: 'Calidez y prosperidad' },
  { name: 'Fucsia Vibrante', hex: '#d946ef', desc: 'Alto contraste' },
  { name: 'Naranja Terracota', hex: '#f97316', desc: 'Vitalidad diaria' },
  { name: 'Verde Bosque', hex: '#14b8a6', desc: 'Estabilidad financiera' }
]

export function hexToRgb(hex) {
  const clean = (hex || '#6366f1').replace('#', '').trim()
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean.padEnd(6, '0').slice(0, 6)
  const num = parseInt(full, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  }
}

export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

export function hslToHex(h, s, l) {
  l /= 100
  const a = (s * Math.min(l, 1 - l)) / 100
  const f = n => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export const useThemeStore = defineStore('theme', () => {
  const themeMode = ref(localStorage.getItem('finanzy_theme_mode') || 'dark') // 'light' | 'dark' | 'system'
  const accentColor = ref(localStorage.getItem('finanzy_accent_color') || '#6366f1')
  const surfaceTint = ref(localStorage.getItem('finanzy_surface_tint') !== 'false') // subtle color tint on background
  const glassmorphism = ref(localStorage.getItem('finanzy_glass') !== 'false')

  const systemPrefersDark = ref(
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : true
  )

  if (typeof window !== 'undefined' && window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      systemPrefersDark.value = e.matches
    })
  }

  const isDark = computed(() => {
    if (themeMode.value === 'system') return systemPrefersDark.value
    return themeMode.value === 'dark'
  })

  const hsl = computed(() => {
    const { r, g, b } = hexToRgb(accentColor.value)
    return rgbToHsl(r, g, b)
  })

  function applyThemeToDOM() {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    const { r, g, b } = hexToRgb(accentColor.value)
    const { h, s, l } = rgbToHsl(r, g, b)

    // Calculate accessible contrast text for buttons (#ffffff or #0f172a)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    const contrastText = luminance > 0.66 ? '#0f172a' : '#ffffff'

    root.style.setProperty('--primary', accentColor.value)
    root.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`)
    root.style.setProperty('--primary-h', `${h}`)
    root.style.setProperty('--primary-s', `${s}%`)
    root.style.setProperty('--primary-l', `${l}%`)
    root.style.setProperty('--primary-hover', hslToHex(h, Math.min(100, s + 5), Math.max(25, l - 7)))
    root.style.setProperty('--primary-light', hslToHex(h, Math.min(100, s), Math.min(92, l + 28)))
    root.style.setProperty('--primary-soft', `rgba(${r}, ${g}, ${b}, ${isDark.value ? 0.16 : 0.11})`)
    root.style.setProperty('--primary-border', `rgba(${r}, ${g}, ${b}, ${isDark.value ? 0.38 : 0.28})`)
    root.style.setProperty('--primary-glow', `rgba(${r}, ${g}, ${b}, 0.35)`)
    root.style.setProperty('--primary-contrast', contrastText)

    if (isDark.value) {
      root.setAttribute('data-theme', 'dark')
      if (surfaceTint.value) {
        root.style.setProperty('--bg-app', `hsl(${h}, ${Math.min(28, Math.round(s * 0.3))}%, 7%)`)
        root.style.setProperty('--bg-sidebar', `hsl(${h}, ${Math.min(26, Math.round(s * 0.28))}%, 9.5%)`)
        root.style.setProperty('--bg-card', `hsl(${h}, ${Math.min(24, Math.round(s * 0.25))}%, 12%)`)
        root.style.setProperty('--bg-elevated', `hsl(${h}, ${Math.min(22, Math.round(s * 0.22))}%, 16%)`)
        root.style.setProperty('--border-color', `hsla(${h}, ${Math.min(30, s)}%, 50%, 0.14)`)
      } else {
        root.style.setProperty('--bg-app', '#090d16')
        root.style.setProperty('--bg-sidebar', '#0f172a')
        root.style.setProperty('--bg-card', '#1e293b')
        root.style.setProperty('--bg-elevated', '#334155')
        root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.09)')
      }
      root.style.setProperty('--text-main', '#f8fafc')
      root.style.setProperty('--text-secondary', '#cbd5e1')
      root.style.setProperty('--text-muted', '#94a3b8')
    } else {
      root.setAttribute('data-theme', 'light')
      if (surfaceTint.value) {
        root.style.setProperty('--bg-app', `hsl(${h}, ${Math.min(35, Math.round(s * 0.35))}%, 96.5%)`)
        root.style.setProperty('--bg-sidebar', `hsl(${h}, ${Math.min(30, Math.round(s * 0.25))}%, 99%)`)
        root.style.setProperty('--bg-card', '#ffffff')
        root.style.setProperty('--bg-elevated', `hsl(${h}, ${Math.min(30, Math.round(s * 0.3))}%, 93.5%)`)
        root.style.setProperty('--border-color', `hsla(${h}, ${Math.min(30, s)}%, 35%, 0.14)`)
      } else {
        root.style.setProperty('--bg-app', '#f1f5f9')
        root.style.setProperty('--bg-sidebar', '#ffffff')
        root.style.setProperty('--bg-card', '#ffffff')
        root.style.setProperty('--bg-elevated', '#e2e8f0')
        root.style.setProperty('--border-color', 'rgba(15, 23, 42, 0.09)')
      }
      root.style.setProperty('--text-main', '#0f172a')
      root.style.setProperty('--text-secondary', '#334155')
      root.style.setProperty('--text-muted', '#64748b')
    }

    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) {
      metaTheme.setAttribute('content', accentColor.value)
    }
  }

  function setThemeMode(mode) {
    themeMode.value = mode
    localStorage.setItem('finanzy_theme_mode', mode)
    applyThemeToDOM()
  }

  function setAccentColor(hex) {
    if (!hex || !hex.startsWith('#')) return
    accentColor.value = hex
    localStorage.setItem('finanzy_accent_color', hex)
    applyThemeToDOM()
  }

  function setFromHsl(h, s, l) {
    const hex = hslToHex(h, s, l)
    setAccentColor(hex)
  }

  function setSurfaceTint(val) {
    surfaceTint.value = val
    localStorage.setItem('finanzy_surface_tint', String(val))
    applyThemeToDOM()
  }

  watch([themeMode, accentColor, surfaceTint, systemPrefersDark], () => {
    applyThemeToDOM()
  }, { immediate: true })

  return {
    themeMode,
    accentColor,
    surfaceTint,
    glassmorphism,
    isDark,
    hsl,
    recommendedColors: RECOMMENDED_COLORS,
    setThemeMode,
    setAccentColor,
    setFromHsl,
    setSurfaceTint,
    applyThemeToDOM
  }
})
