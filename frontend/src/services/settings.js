const SETTINGS_KEY = 'requirement_analyzer_ui_settings'

export const DEFAULT_VIEW_OPTIONS = [
  { value: 'result', label: '完整结果' },
  { value: 'compact', label: '精简结果' },
  { value: 'process', label: '分析过程' }
]

export const FONT_SCALE_OPTIONS = [
  { value: 'small', label: '偏小', scale: 0.93 },
  { value: 'medium', label: '标准', scale: 1 },
  { value: 'large', label: '偏大', scale: 1.08 }
]

export const DENSITY_OPTIONS = [
  { value: 'compact', label: '紧凑', cardPadding: '18px', containerPadding: '16px', sectionGap: '16px' },
  { value: 'standard', label: '标准', cardPadding: '24px', containerPadding: '20px', sectionGap: '20px' },
  { value: 'comfortable', label: '宽松', cardPadding: '30px', containerPadding: '24px', sectionGap: '24px' }
]

export const DEFAULT_UI_SETTINGS = {
  defaultView: 'result',
  fontScale: 'medium',
  density: 'standard',
  autoSaveHistory: true
}

export function getUISettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_UI_SETTINGS
    return {
      ...DEFAULT_UI_SETTINGS,
      ...JSON.parse(raw)
    }
  } catch {
    return DEFAULT_UI_SETTINGS
  }
}

export function saveUISettings(settings) {
  const merged = { ...DEFAULT_UI_SETTINGS, ...settings }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged))
  return merged
}

export function applyUISettings(settings) {
  const root = document.documentElement
  const merged = { ...DEFAULT_UI_SETTINGS, ...settings }
  const density = DENSITY_OPTIONS.find(item => item.value === merged.density) || DENSITY_OPTIONS[1]
  const fontScale = FONT_SCALE_OPTIONS.find(item => item.value === merged.fontScale) || FONT_SCALE_OPTIONS[1]

  root.style.setProperty('--font-scale', String(fontScale.scale))
  root.style.setProperty('--card-padding', density.cardPadding)
  root.style.setProperty('--container-padding', density.containerPadding)
  root.style.setProperty('--section-gap', density.sectionGap)
}
