import { createContext, useContext, useState, useEffect } from 'react'

const THEME_KEY = 'taxcalm_dashboard_theme'

// CSS variables injected onto :root for each theme.
// Components use var(--tc-xxx) in inline styles — no context import needed.
const cssVars = {
  dark: {
    '--tc-app-bg':        '#080814',
    '--tc-header-bg':     'rgba(8,8,20,0.88)',
    '--tc-sidebar-bg':    'rgba(10,10,26,0.98)',
    '--tc-sidebar-border':'rgba(255,255,255,0.07)',
    '--tc-card-bg':       'rgba(255,255,255,0.04)',
    '--tc-card-border':   'rgba(255,255,255,0.08)',
    '--tc-text-1':        'rgba(255,255,255,0.92)',
    '--tc-text-2':        'rgba(255,255,255,0.6)',
    '--tc-text-3':        'rgba(255,255,255,0.35)',
    '--tc-text-4':        'rgba(255,255,255,0.22)',
    '--tc-input-bg':      'rgba(255,255,255,0.06)',
    '--tc-input-border':  'rgba(255,255,255,0.1)',
    '--tc-input-text':    'rgba(255,255,255,0.8)',
    '--tc-accent':        '#a78bfa',
    '--tc-acc-bg':        'rgba(124,58,237,0.15)',
    '--tc-acc-border':    'rgba(124,58,237,0.4)',
    '--tc-nav-active-bg': 'linear-gradient(135deg,#7c3aed,#5b21b6)',
    '--tc-nav-active':    '#c4b5fd',
    '--tc-nav-inactive':  'rgba(255,255,255,0.45)',
    '--tc-btn-micro':     'rgba(255,255,255,0.06)',
    '--tc-divider':       'rgba(255,255,255,0.07)',
    '--tc-orb-1':         'rgba(124,58,237,0.12)',
    '--tc-orb-2':         'rgba(91,33,182,0.08)',
    '--tc-logo-shadow':   '0 0 16px rgba(124,58,237,0.5)',
    '--tc-logo-grad':     'linear-gradient(135deg,#7c3aed,#5b21b6)',
    '--tc-notif-bg':      'rgba(14,14,32,0.98)',
    '--tc-notif-border':  'rgba(255,255,255,0.1)',
  },
  light: {
    '--tc-app-bg':        '#f1f5f9',
    '--tc-header-bg':     'rgba(248,250,252,0.92)',
    '--tc-sidebar-bg':    'rgba(255,255,255,0.98)',
    '--tc-sidebar-border':'rgba(0,0,0,0.07)',
    '--tc-card-bg':       '#ffffff',
    '--tc-card-border':   'rgba(0,0,0,0.08)',
    '--tc-text-1':        'rgba(17,24,39,0.92)',
    '--tc-text-2':        'rgba(17,24,39,0.65)',
    '--tc-text-3':        'rgba(17,24,39,0.4)',
    '--tc-text-4':        'rgba(17,24,39,0.25)',
    '--tc-input-bg':      'rgba(0,0,0,0.04)',
    '--tc-input-border':  'rgba(0,0,0,0.1)',
    '--tc-input-text':    'rgba(17,24,39,0.9)',
    '--tc-accent':        '#7c3aed',
    '--tc-acc-bg':        'rgba(124,58,237,0.08)',
    '--tc-acc-border':    'rgba(124,58,237,0.25)',
    '--tc-nav-active-bg': 'linear-gradient(135deg,#7c3aed,#5b21b6)',
    '--tc-nav-active':    '#7c3aed',
    '--tc-nav-inactive':  'rgba(17,24,39,0.5)',
    '--tc-btn-micro':     'rgba(0,0,0,0.05)',
    '--tc-divider':       'rgba(0,0,0,0.07)',
    '--tc-orb-1':         'rgba(124,58,237,0.06)',
    '--tc-orb-2':         'rgba(91,33,182,0.04)',
    '--tc-logo-shadow':   '0 0 16px rgba(124,58,237,0.3)',
    '--tc-logo-grad':     'linear-gradient(135deg,#7c3aed,#5b21b6)',
    '--tc-notif-bg':      'rgba(255,255,255,0.99)',
    '--tc-notif-border':  'rgba(0,0,0,0.1)',
  },
  rose: {
    '--tc-app-bg':        '#fff0f3',
    '--tc-header-bg':     'rgba(255,240,243,0.92)',
    '--tc-sidebar-bg':    'rgba(255,255,255,0.98)',
    '--tc-sidebar-border':'rgba(244,63,94,0.12)',
    '--tc-card-bg':       '#ffffff',
    '--tc-card-border':   'rgba(244,63,94,0.15)',
    '--tc-text-1':        'rgba(17,24,39,0.92)',
    '--tc-text-2':        'rgba(17,24,39,0.65)',
    '--tc-text-3':        'rgba(17,24,39,0.4)',
    '--tc-text-4':        'rgba(17,24,39,0.25)',
    '--tc-input-bg':      'rgba(244,63,94,0.04)',
    '--tc-input-border':  'rgba(244,63,94,0.15)',
    '--tc-input-text':    'rgba(17,24,39,0.9)',
    '--tc-accent':        '#F43F5E',
    '--tc-acc-bg':        'rgba(244,63,94,0.1)',
    '--tc-acc-border':    'rgba(244,63,94,0.35)',
    '--tc-nav-active-bg': 'linear-gradient(135deg,#F43F5E,#E11D48)',
    '--tc-nav-active':    '#F43F5E',
    '--tc-nav-inactive':  'rgba(17,24,39,0.5)',
    '--tc-btn-micro':     'rgba(244,63,94,0.06)',
    '--tc-divider':       'rgba(244,63,94,0.1)',
    '--tc-orb-1':         'rgba(244,63,94,0.08)',
    '--tc-orb-2':         'rgba(255,200,210,0.2)',
    '--tc-logo-shadow':   '0 0 16px rgba(244,63,94,0.4)',
    '--tc-logo-grad':     'linear-gradient(135deg,#F43F5E,#E11D48)',
    '--tc-notif-bg':      'rgba(255,255,255,0.99)',
    '--tc-notif-border':  'rgba(244,63,94,0.15)',
  },
}

function injectVars(name) {
  const vars = cssVars[name] || cssVars.dark
  const root = document.documentElement
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
  root.classList.remove('dark', 'light', 'rose')
  root.classList.add(name)
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(
    () => localStorage.getItem(THEME_KEY) || 'dark'
  )

  function setTheme(name) {
    setThemeName(name)
    localStorage.setItem(THEME_KEY, name)
    injectVars(name)
  }

  useEffect(() => { injectVars(themeName) }, [themeName])

  return (
    <ThemeContext.Provider value={{ themeName, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
