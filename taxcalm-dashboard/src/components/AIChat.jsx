import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, Sparkles, Zap } from 'lucide-react'
import { aiResponses } from '../data/mockData'

const SUGGESTIONS = [
  'When is my GSTR-3B due?',
  'How much ITC can I claim?',
  'Explain e-invoicing rules',
]

export default function AIChat({ open, onToggle }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      text: "Hello! I'm TaxCalm AI 👋 I can help with GST calculations, compliance deadlines, and financial insights. How can I help you today?",
      time: 'now',
    },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const sendMessage = async (text) => {
    const content = (text ?? input).trim()
    if (!content) return

    const userMsg = {
      id: Date.now(),
      type: 'user',
      text: content,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setTyping(true)

    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 700))

    setTyping(false)
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        type: 'assistant',
        text: aiResponses[Math.floor(Math.random() * aiResponses.length)],
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      },
    ])
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="w-80 sm:w-96 rounded-2xl overflow-hidden flex flex-col"
            style={{
              maxHeight: 'calc(100vh - 100px)',
              background: 'var(--tc-notif-bg)',
              border: '1px solid var(--tc-notif-border)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.15)',
            }}
          >
            {/* Header */}
            <div
              className="px-4 py-3 flex items-center justify-between flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">TaxCalm AI</p>
                  <p className="text-[11px] flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
                    Online · Powered by AI
                  </p>
                </div>
              </div>
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'rgba(255,255,255,0.7)' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
              style={{ background: 'var(--tc-card-bg)' }}
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.type === 'assistant' && (
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center mr-2 mt-0.5 flex-shrink-0"
                      style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }}
                    >
                      <Bot className="w-3.5 h-3.5" style={{ color: '#a78bfa' }} />
                    </div>
                  )}
                  <div className="max-w-[76%]">
                    <div
                      className="text-xs px-3.5 py-2.5 rounded-2xl leading-relaxed"
                      style={
                        msg.type === 'user'
                          ? {
                              background: 'rgba(124,58,237,0.3)',
                              border: '1px solid rgba(124,58,237,0.4)',
                              color: 'rgba(255,255,255,0.9)',
                              fontWeight: 500,
                              borderTopRightRadius: 4,
                            }
                          : {
                              background: 'var(--tc-btn-micro)',
                              border: '1px solid var(--tc-input-border)',
                              color: 'var(--tc-text-1)',
                              borderTopLeftRadius: 4,
                            }
                      }
                    >
                      {msg.text}
                    </div>
                    <p
                      className={`text-[10px] mt-1 ${msg.type === 'user' ? 'text-right' : ''}`}
                      style={{ color: 'var(--tc-text-4)' }}
                    >
                      {msg.time}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              <AnimatePresence>
                {typing && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-start"
                  >
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center mr-2 mt-0.5 flex-shrink-0"
                      style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }}
                    >
                      <Bot className="w-3.5 h-3.5" style={{ color: '#a78bfa' }} />
                    </div>
                    <div
                      className="rounded-2xl px-4 py-3"
                      style={{
                        background: 'var(--tc-btn-micro)',
                        border: '1px solid var(--tc-input-border)',
                        borderTopLeftRadius: 4,
                      }}
                    >
                      <div className="flex gap-1 items-center">
                        {[0, 0.18, 0.36].map((delay, i) => (
                          <motion.div
                            key={i}
                            animate={{ y: [0, -4, 0] }}
                            transition={{ repeat: Infinity, duration: 0.55, delay }}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: 'rgba(167,139,250,0.6)' }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={endRef} />
            </div>

            {/* Suggestions */}
            {messages.length === 1 && (
              <div
                className="px-3 pt-2 pb-1 flex flex-wrap gap-1.5 flex-shrink-0"
                style={{ borderTop: '1px solid var(--tc-divider)' }}
              >
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full transition-all"
                    style={{
                      background: 'var(--tc-btn-micro)',
                      border: '1px solid var(--tc-input-border)',
                      color: 'var(--tc-text-2)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(124,58,237,0.2)'
                      e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'
                      e.currentTarget.style.color = '#a78bfa'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'var(--tc-btn-micro)'
                      e.currentTarget.style.borderColor = 'var(--tc-input-border)'
                      e.currentTarget.style.color = 'var(--tc-text-2)'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div
              className="p-3 flex-shrink-0"
              style={{ borderTop: '1px solid var(--tc-divider)' }}
            >
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-1.5 transition-all"
                style={{
                  background: 'var(--tc-input-bg)',
                  border: '1px solid var(--tc-input-border)',
                }}
                onFocusCapture={e => e.currentTarget.style.borderColor='rgba(124,58,237,0.5)'}
                onBlurCapture={e => e.currentTarget.style.borderColor='var(--tc-input-border)'}  
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask about GST, compliance..."
                  className="flex-1 bg-transparent text-sm focus:outline-none py-1 placeholder-white/30"
                  style={{ color: 'var(--tc-text-1)' }}
                />
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => sendMessage()}
                  disabled={!input.trim()}
                  className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 transition-opacity"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </motion.button>
              </div>
              <p className="text-center text-[10px] mt-2" style={{ color: 'var(--tc-text-4)' }}>
                AI responses are for guidance only. Consult a CA for advice.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.button
        onClick={onToggle}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-2xl flex items-center justify-center relative"
        style={{
          background: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
          boxShadow: '0 8px 28px rgba(124,58,237,0.5)',
        }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>


      </motion.button>
    </div>
  )
}
