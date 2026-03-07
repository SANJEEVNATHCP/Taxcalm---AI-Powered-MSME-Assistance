import { Fragment, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Popover, Transition } from '@headlessui/react'
import { Bell, HelpCircle, Search, Menu, FileText, TrendingUp, Info, Check } from 'lucide-react'
import { notifications } from '../data/mockData'

const notifIconMap = { FileText, TrendingUp, Info }

export default function Header({ setMobileOpen }) {
  const unreadCount = notifications.filter((n) => n.unread).length

  const [firstName, setFirstName] = useState(() => {
    try { return JSON.parse(localStorage.getItem('taxcalm_profile'))?.firstName ?? 'Arjun' } catch { return 'Arjun' }
  })

  useEffect(() => {
    const onStorage = () => {
      try { setFirstName(JSON.parse(localStorage.getItem('taxcalm_profile'))?.firstName ?? 'Arjun') } catch {}
    }
    window.addEventListener('storage', onStorage)
    // Also poll once on mount in case saved in same tab
    onStorage()
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="fixed top-0 right-0 z-30 px-4 sm:px-6 py-3.5"
      style={{
        left: 0,
        background: 'var(--tc-header-bg)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--tc-divider)',
      }}
    >
      <div className="flex items-center gap-3 lg:pl-16">
        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-xl transition-colors"
          style={{ color: 'var(--tc-text-2)', background: 'var(--tc-btn-micro)' }}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Welcome */}
        <div className="hidden sm:block">
          <h1 className="text-base font-semibold leading-tight" style={{ color: 'var(--tc-text-1)' }}>
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-xs" style={{ color: 'var(--tc-text-3)' }}>Here's what's happening with your taxes today.</p>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xs ml-auto sm:ml-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--tc-text-4)' }} />
            <input
              type="text"
              placeholder="Search reports, transactions..."
              className="w-full pl-8 pr-4 py-2 text-sm rounded-xl focus:outline-none transition-all placeholder:opacity-40"
              style={{ background: 'var(--tc-input-bg)', border: '1px solid var(--tc-input-border)', color: 'var(--tc-input-text)' }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          {/* Notifications popover */}
          <Popover className="relative">
            <Popover.Button as="div">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 rounded-xl transition-colors"
                style={{ color: 'var(--tc-text-2)', background: 'var(--tc-btn-micro)' }}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2" style={{ background: '#8b5cf6', ringColor: 'rgba(8,8,20,1)' }} />
                )}
              </motion.button>
            </Popover.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-150"
              enterFrom="opacity-0 translate-y-1 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-1 scale-95"
            >
              <Popover.Panel className="absolute right-0 mt-2 w-72 rounded-2xl overflow-hidden origin-top-right z-50" style={{ background: 'var(--tc-notif-bg)', border: '1px solid var(--tc-notif-border)', boxShadow: '0 24px 48px rgba(0,0,0,0.6)' }}>
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--tc-divider)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>Notifications</p>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.2)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.3)' }}>
                    {unreadCount} new
                  </span>
                </div>
                <div>
                  {notifications.map((n) => {
                    const Icon = notifIconMap[n.icon] || Info
                    return (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${ n.unread ? '' : 'opacity-50' }`}
                        style={{ borderBottom: '1px solid var(--tc-divider)' }}
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)' }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: '#a78bfa' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold leading-snug" style={{ color: 'var(--tc-text-1)' }}>{n.title}</p>
                          <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--tc-text-3)' }}>{n.desc}</p>
                          <p className="text-[11px] mt-1" style={{ color: 'var(--tc-text-4)' }}>{n.time}</p>
                        </div>
                        {n.unread && (
                          <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: '#8b5cf6' }} />
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="px-4 py-2.5" style={{ borderTop: '1px solid var(--tc-divider)' }}>
                  <button className="w-full text-xs font-semibold text-center py-1 transition-colors" style={{ color: 'var(--tc-accent)' }}>
                    Mark all as read
                  </button>
                </div>
              </Popover.Panel>
            </Transition>
          </Popover>

          {/* Help */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-xl transition-colors"
            style={{ color: 'var(--tc-text-2)', background: 'var(--tc-btn-micro)' }}
          >
            <HelpCircle className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.header>
  )
}
