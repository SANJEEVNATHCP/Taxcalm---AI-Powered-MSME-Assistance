import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LandingPage from './pages/LandingPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AIChat from './components/AIChat.jsx'
import IntroAnimation from './components/IntroAnimation.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { ToastProvider } from './contexts/ToastContext.jsx'

export default function App() {
  // Always show intro + play sound on every fresh page load
  const [introDone, setIntroDone] = useState(false)
  const [started, setStarted] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <ThemeProvider>
    <ToastProvider>
      {!introDone && (
        <IntroAnimation onComplete={() => setIntroDone(true)} />
      )}
      <AnimatePresence mode="wait">
        {!started ? (
          <motion.div key="landing"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}>
            <LandingPage onEnter={() => setStarted(true)} />
          </motion.div>
        ) : (
          <motion.div key="dashboard"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <Dashboard />
            <AIChat open={chatOpen} onToggle={() => setChatOpen((o) => !o)} />
          </motion.div>
        )}
      </AnimatePresence>
    </ToastProvider>
    </ThemeProvider>
  )
}
