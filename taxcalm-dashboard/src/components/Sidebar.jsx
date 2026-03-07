import { Fragment, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, Transition } from '@headlessui/react'
import {
  LayoutDashboard,
  Calculator,
  TrendingUp,
  Shield,
  FileText,
  BarChart2,
  BookOpen,
  X,
  Zap,
  Settings,
  ChevronRight,
  Layers,
} from 'lucide-react'

const navItems = [
  { id: 'overview',    label: 'Overview',       icon: LayoutDashboard },
  { id: 'gst',         label: 'GST Calculator', icon: Calculator },
  { id: 'finance',     label: 'Finance',        icon: TrendingUp },
  { id: 'compliance',  label: 'Compliance',     icon: Shield },
  { id: 'schemes',     label: 'Schemes',        icon: FileText },
  { id: 'trends',      label: 'Trends',         icon: BarChart2 },
  { id: 'learn',       label: 'Learn',          icon: BookOpen },
  { id: 'features',    label: 'Features',       icon: Layers },
]

function NavContent({ activeNav, setActiveNav, onClose, expanded }) {
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('taxcalm_profile')) || {} } catch { return {} }
  })

  // Refresh whenever the sidebar opens (catches saves made in ProfilePage)
  useEffect(() => {
    try { setProfile(JSON.parse(localStorage.getItem('taxcalm_profile')) || {}) } catch {}
  }, [activeNav])

  const firstName  = profile.firstName  ?? 'Arjun'
  const lastName   = profile.lastName   ?? 'Sharma'
  const email      = profile.email      ?? 'arjun@taxcalm.in'
  const avatar     = profile.avatar     ?? null
  const initials   = `${firstName[0]}${lastName[0]}`.toUpperCase()
  const fullName   = `${firstName} ${lastName}`

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--tc-sidebar-bg)', transition: 'background 0.3s ease' }}>
      {/* Logo */}
      <div className="flex items-center px-4 py-5" style={{ borderBottom: '1px solid var(--tc-sidebar-border)', minHeight: 64 }}>
        <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--tc-logo-grad)', boxShadow: 'var(--tc-logo-shadow)' }}>
          <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div className="overflow-hidden transition-all duration-300" style={{ width: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0, marginLeft: expanded ? 10 : 0, whiteSpace: 'nowrap' }}>
          <span className="font-black text-lg" style={{ letterSpacing: '-0.03em', color: 'var(--tc-text-1)' }}>TaxCalm</span>
        </div>
        <button onClick={onClose} className="lg:hidden ml-auto p-1 rounded-lg" style={{ color: 'var(--tc-text-2)' }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav label */}
      <div className="px-4 pt-5 pb-1 overflow-hidden transition-all duration-200" style={{ opacity: expanded ? 1 : 0, height: expanded ? 'auto' : 0, paddingTop: expanded ? undefined : 0, paddingBottom: expanded ? undefined : 0 }}>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] whitespace-nowrap" style={{ color: 'var(--tc-text-3)' }}>Navigation</p>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeNav === item.id
          return (
            <motion.button
              key={item.id}
              onClick={() => { setActiveNav(item.id); onClose() }}
              whileTap={{ scale: 0.97 }}
              title={!expanded ? item.label : undefined}
              className="w-full flex items-center px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={isActive
                ? { background: 'var(--tc-acc-bg)', color: 'var(--tc-accent)', border: '1px solid var(--tc-acc-border)' }
                : { color: 'var(--tc-nav-inactive)', border: '1px solid transparent' }}
            >
              <Icon
                className="w-4 h-4 flex-shrink-0 transition-colors"
                style={{ color: isActive ? 'var(--tc-accent)' : 'var(--tc-text-3)', minWidth: 16 }}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className="overflow-hidden whitespace-nowrap transition-all duration-300"
                style={{ maxWidth: expanded ? 160 : 0, opacity: expanded ? 1 : 0, marginLeft: expanded ? 10 : 0 }}
              >{item.label}</span>
              {isActive && expanded && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--tc-accent)' }} />
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-2 py-4 space-y-0.5" style={{ borderTop: '1px solid var(--tc-sidebar-border)' }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { setActiveNav('profile'); onClose() }}
          title={!expanded ? 'Settings' : undefined}
          className="w-full flex items-center px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
          style={{ color: 'var(--tc-text-2)' }}
        >
          <Settings className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--tc-text-3)', minWidth: 16 }} strokeWidth={2} />
          <span
            className="overflow-hidden whitespace-nowrap transition-all duration-300"
            style={{ maxWidth: expanded ? 160 : 0, opacity: expanded ? 1 : 0, marginLeft: expanded ? 10 : 0 }}
          >Settings</span>
        </motion.button>

        {/* User profile */}
        <motion.div
          onClick={() => { setActiveNav('profile'); onClose() }}
          title={!expanded ? fullName : undefined}
          className="flex items-center px-2 py-2 mt-1 rounded-xl cursor-pointer transition-all"
          style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}
        >
          <div
            className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-bold overflow-hidden"
            style={avatar ? undefined : { background: 'var(--tc-logo-grad)', minWidth: 32 }}
          >
            {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : initials}
          </div>
          <div
            className="overflow-hidden whitespace-nowrap transition-all duration-300 flex-1 min-w-0"
            style={{ maxWidth: expanded ? 140 : 0, opacity: expanded ? 1 : 0, marginLeft: expanded ? 10 : 0 }}
          >
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--tc-text-1)' }}>{fullName}</p>
            <p className="text-xs truncate" style={{ color: 'var(--tc-text-2)' }}>{email}</p>
          </div>
          {expanded && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 ml-auto" style={{ color: 'var(--tc-text-3)' }} />}
        </motion.div>
      </div>
    </div>
  )
}

export default function Sidebar({ activeNav, setActiveNav, mobileOpen, setMobileOpen }) {
  const [hovered, setHovered] = useState(false)

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <motion.aside
        className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 overflow-hidden"
        animate={{ width: hovered ? 256 : 64 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ background: 'var(--tc-sidebar-bg)', borderRight: '1px solid var(--tc-sidebar-border)', transition: 'background 0.3s ease' }}
      >
        <NavContent
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          onClose={() => {}}
          expanded={hovered}
        />
      </motion.aside>

      {/* ── Mobile Sidebar (Headless UI Dialog) ─────────────────────────── */}
      <Transition show={mobileOpen} as={Fragment}>
        <Dialog onClose={() => setMobileOpen(false)} className="relative z-50 lg:hidden">
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />
          </Transition.Child>

          {/* Panel */}
          <Transition.Child
            as={Fragment}
            enter="transition-transform ease-out duration-300"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition-transform ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="fixed inset-y-0 left-0 w-64 shadow-xl" style={{ background: 'var(--tc-sidebar-bg)', borderRight: '1px solid var(--tc-sidebar-border)' }}>
              <NavContent
                activeNav={activeNav}
                setActiveNav={setActiveNav}
                onClose={() => setMobileOpen(false)}
              />
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  )
}

