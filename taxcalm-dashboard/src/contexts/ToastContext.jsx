import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react'

const ToastCtx = createContext(null)

const ICONS  = { success: CheckCircle2, info: Info, error: AlertCircle }
const COLORS = {
  success: { icon: '#34d399', border: 'rgba(52,211,153,0.35)' },
  info:    { icon: '#a78bfa', border: 'rgba(139,92,246,0.35)' },
  error:   { icon: '#f87171', border: 'rgba(248,113,113,0.35)' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200)
  }, [])

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastCtx.Provider value={showToast}>
      {children}
      <div
        style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, display: 'flex', flexDirection: 'column-reverse', gap: 8,
          alignItems: 'center', pointerEvents: 'none',
        }}
      >
        <AnimatePresence>
          {toasts.map(t => {
            const Icon = ICONS[t.type] || Info
            const c    = COLORS[t.type] || COLORS.info
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                exit={{ opacity: 0,    y: 10, scale: 0.95 }}
                transition={{ type: 'spring', damping: 24, stiffness: 320 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 14,
                  background: 'var(--tc-notif-bg, #0f0f1f)',
                  border: `1px solid ${c.border}`,
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
                  pointerEvents: 'auto',
                  maxWidth: 380, minWidth: 240,
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon style={{ width: 15, height: 15, flexShrink: 0, color: c.icon }} />
                <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--tc-text-1)', flex: 1, whiteSpace: 'normal' }}>
                  {t.message}
                </span>
                <button
                  onClick={() => dismiss(t.id)}
                  style={{ marginLeft: 4, padding: 2, borderRadius: 6, color: 'var(--tc-text-3)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X style={{ width: 12, height: 12 }} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
