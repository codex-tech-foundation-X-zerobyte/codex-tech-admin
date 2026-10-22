export type Theme = 'light' | 'dark'
const KEY = 'codex-admin-theme'

export function getTheme(): Theme {
  const saved = localStorage.getItem(KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
export function applyTheme(t: Theme) { document.documentElement.dataset.theme = t }
export function setTheme(t: Theme) { localStorage.setItem(KEY, t); applyTheme(t) }
export function initTheme() { applyTheme(getTheme()) }
