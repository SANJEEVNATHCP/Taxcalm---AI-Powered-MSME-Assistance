import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calculator,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import Sidebar from '../components/Sidebar.jsx'
import Header from '../components/Header.jsx'
import DashboardCard from '../components/DashboardCard.jsx'
import { GSTLineChart, ExpensesBarChart } from '../components/ChartCard.jsx'
import UpdateCard from '../components/UpdateCard.jsx'
import {
  kpiCards,
  gstTrendData,
  expensesData,
  updates,
  smartTools,
} from '../data/mockData.js'
import GSTCalculator from './GSTCalculator.jsx'
import FinancePage from './FinancePage.jsx'
import CompliancePage from './CompliancePage.jsx'
import SchemesPage from './SchemesPage.jsx'
import TrendsPage from './TrendsPage.jsx'
import LearnPage from './LearnPage.jsx'
import ProfilePage from './ProfilePage.jsx'
import AccountingPage from './AccountingPage.jsx'
import GSTFilingPage from './GSTFilingPage.jsx'
import IncomeTaxPage from './IncomeTaxPage.jsx'
import PayrollPage from './PayrollPage.jsx'
import ReportsPage from './ReportsPage.jsx'
import CAAPage from './CAAPage.jsx'
import KnowledgeBasePage from './KnowledgeBasePage.jsx'
import FeaturesPage from './FeaturesPage.jsx'


// ── Tool config ───────────────────────────────────────────────────────────────
const toolIconMap = { Calculator, TrendingUp, ShieldCheck }

const toolColorConfig = {
  yellow: {
    iconBg: 'rgba(234,179,8,0.12)',
    iconColor: '#facc15',
    orbColor: 'rgba(234,179,8,0.06)',
    btnBg: 'linear-gradient(135deg,#eab308,#ca8a04)',
    badgeBg: 'rgba(234,179,8,0.12)',
    badgeColor: '#facc15',
  },
  green: {
    iconBg: 'rgba(16,185,129,0.12)',
    iconColor: '#34d399',
    orbColor: 'rgba(16,185,129,0.06)',
    btnBg: 'linear-gradient(135deg,#10b981,#059669)',
    badgeBg: 'rgba(16,185,129,0.12)',
    badgeColor: '#34d399',
  },
  blue: {
    iconBg: 'rgba(59,130,246,0.12)',
    iconColor: '#60a5fa',
    orbColor: 'rgba(59,130,246,0.06)',
    btnBg: 'linear-gradient(135deg,#3b82f6,#2563eb)',
    badgeBg: 'rgba(59,130,246,0.12)',
    badgeColor: '#60a5fa',
  },
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl p-5 animate-pulse" style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl" style={{ background: 'var(--tc-btn-micro)' }} />
        <div className="w-14 h-6 rounded-lg" style={{ background: 'var(--tc-btn-micro)' }} />
      </div>
      <div className="w-28 h-7 rounded-lg mb-2" style={{ background: 'var(--tc-btn-micro)' }} />
      <div className="w-20 h-4 rounded-md mb-1.5" style={{ background: 'var(--tc-card-bg)' }} />
      <div className="w-32 h-3 rounded-md" style={{ background: 'var(--tc-card-bg)' }} />
    </div>
  )
}

// ── Section fade-in variant ───────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

// ── Overview page (default) ───────────────────────────────────────────────────
function OverviewPage({ loading, setActiveNav }) {
  return (
    <div className="space-y-8">
      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <motion.section variants={fadeUp} initial="hidden" animate="visible">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>Analytics Overview</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>Your key metrics at a glance</p>
          </div>
          <button
            onClick={() => setActiveNav('finance')}
            className="flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-70"
            style={{ color: 'var(--tc-accent)' }}
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {loading
            ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : kpiCards.map((card, i) => (
                <DashboardCard key={card.id} card={card} index={i} onNavigate={setActiveNav} />
              ))}
        </div>
      </motion.section>

      {/* ── Smart Tools ────────────────────────────────────────────────── */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.08 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>Smart Tools</h2>
            <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.25)' }}>
              <Sparkles className="w-3 h-3" />
              AI-Powered
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {smartTools.map((tool, index) => {
            const Icon = toolIconMap[tool.icon] || Calculator
            const colors = toolColorConfig[tool.color] || toolColorConfig.yellow
            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + index * 0.07, ease: 'easeOut' }}
                whileHover={{ y: -4 }}
                className="rounded-2xl p-5 cursor-pointer group relative overflow-hidden"
                style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}                  onClick={() => setActiveNav(tool.navTarget)}              >
                {/* Decorative orb */}
                <div
                  className="absolute -right-5 -top-5 w-20 h-20 rounded-full pointer-events-none"
                  style={{ background: colors.orbColor }}
                />

                {/* Badge */}
                {tool.badge && (
                  <span
                    className="absolute top-4 right-4 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: colors.badgeBg, color: colors.badgeColor, border: `1px solid ${colors.badgeBg}` }}
                  >
                    {tool.badge}
                  </span>
                )}

                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 relative"
                  style={{ background: colors.iconBg }}
                >
                  <Icon className="w-5 h-5" style={{ color: colors.iconColor }} strokeWidth={2} />
                </div>

                <h3 className="text-sm font-semibold mb-1.5 transition-colors" style={{ color: 'var(--tc-text-1)' }}>
                  {tool.title}
                </h3>
                <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--tc-text-3)' }}>{tool.description}</p>

                <button
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
                  style={{ background: colors.btnBg }}
                >
                  Launch tool
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      {/* ── Charts ─────────────────────────────────────────────────────── */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.16 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>Financial Insights</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>FY 2025–26</p>
          </div>
          <button
            onClick={() => setActiveNav('trends')}
            className="flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-70"
            style={{ color: 'var(--tc-accent)' }}
          >
            Export <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GSTLineChart data={gstTrendData} />
          <ExpensesBarChart data={expensesData} />
        </div>
      </motion.section>

      {/* ── Latest Updates ──────────────────────────────────────────────── */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.22 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>Latest Updates</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>Tax policy news &amp; GST notifications</p>
          </div>
          <button
            onClick={() => setActiveNav('learn')}
            className="flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-70"
            style={{ color: 'var(--tc-accent)' }}
          >
            See all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {updates.map((update, i) => (
            <UpdateCard key={update.id} update={update} index={i} />
          ))}
        </div>
      </motion.section>
    </div>
  )
}

// ── Page router ───────────────────────────────────────────────────────────────
function renderPage(activeNav, loading, setActiveNav) {
  switch (activeNav) {
    case 'gst':         return <GSTCalculator />
    case 'finance':     return <FinancePage />
    case 'compliance':  return <CompliancePage />
    case 'schemes':     return <SchemesPage />
    case 'trends':      return <TrendsPage />
    case 'learn':       return <LearnPage />
    case 'profile':     return <ProfilePage />
    case 'features':    return <FeaturesPage setActiveNav={setActiveNav} />
    case 'accounting':  return <AccountingPage setActiveNav={setActiveNav} />
    case 'gstfiling':   return <GSTFilingPage setActiveNav={setActiveNav} />
    case 'incometax':   return <IncomeTaxPage setActiveNav={setActiveNav} />
    case 'payroll':     return <PayrollPage setActiveNav={setActiveNav} />
    case 'reports':     return <ReportsPage setActiveNav={setActiveNav} />
    case 'caa':         return <CAAPage setActiveNav={setActiveNav} />
    case 'kb':          return <KnowledgeBasePage setActiveNav={setActiveNav} />
    default:            return <OverviewPage loading={loading} setActiveNav={setActiveNav} />
  }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [activeNav, setActiveNav] = useState('overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1400)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--tc-app-bg)', position: 'relative', overflow: 'hidden', transition: 'background 0.3s ease' }}>
      {/* ── Ambient background design ── */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {/* Large orb — top-left */}
        <div style={{
          position: 'absolute', top: '-18%', left: '-10%',
          width: '55vw', height: '55vw', borderRadius: '50%',
          background: 'radial-gradient(circle, var(--tc-orb-1) 0%, var(--tc-orb-2) 50%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        {/* Medium orb — bottom-right */}
        <div style={{
          position: 'absolute', bottom: '-15%', right: '-8%',
          width: '45vw', height: '45vw', borderRadius: '50%',
          background: 'radial-gradient(circle, var(--tc-orb-2) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }} />
        {/* Small accent orb — center-right */}
        <div style={{
          position: 'absolute', top: '40%', right: '15%',
          width: '25vw', height: '25vw', borderRadius: '50%',
          background: 'radial-gradient(circle, var(--tc-orb-1) 0%, transparent 65%)',
          filter: 'blur(30px)',
        }} />
        {/* Dot-grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(128,128,128,0.05) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
      </div>
      {/* Sidebar */}
      <div style={{ position: 'relative', zIndex: 40 }}>
      <Sidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen" style={{ position: 'relative', zIndex: 1 }}>
        <Header setMobileOpen={setMobileOpen} />
        {/* Spacer so content clears the fixed header (~64px tall) */}
        <div style={{ height: 64, flexShrink: 0 }} />

        <main className="flex-1 px-4 sm:px-6 py-6 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeNav}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {renderPage(activeNav, loading, setActiveNav)}
            </motion.div>
          </AnimatePresence>

          {/* Footer */}
          <footer className="text-center py-8 mt-8 text-[11px]" style={{ color: 'var(--tc-text-4)', borderTop: '1px solid var(--tc-divider)' }}>
            © 2026 TaxCalm · Built for Indian MSMEs ·{' '}
            <a href="#" className="transition-colors hover:opacity-60">Privacy</a>
            {' '}·{' '}
            <a href="#" className="transition-colors hover:opacity-60">Terms</a>
          </footer>
        </main>
      </div>
    </div>
  )
}
