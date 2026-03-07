import { motion } from 'framer-motion'
import { Layers, ClipboardList, Receipt, Users, PieChart, CalendarClock, Library, ArrowRight } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.06, ease: 'easeOut' } }),
}

const features = [
  {
    id: 'accounting',
    label: 'Accounting',
    desc: 'General ledger, P&L summary and account balances',
    icon: Layers,
    color: '#a78bfa',
    bg: 'rgba(139,92,246,0.12)',
    gradient: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
  },
  {
    id: 'gstfiling',
    label: 'GST Filing',
    desc: 'Track GSTR returns, ITC claims and filing deadlines',
    icon: ClipboardList,
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.12)',
    gradient: 'linear-gradient(135deg,#d97706,#b45309)',
  },
  {
    id: 'incometax',
    label: 'Income Tax',
    desc: 'TDS, advance tax schedule and slab calculator',
    icon: Receipt,
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.12)',
    gradient: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
  },
  {
    id: 'payroll',
    label: 'Payroll',
    desc: 'Employee salary processing, PF, ESI and compliance',
    icon: Users,
    color: '#34d399',
    bg: 'rgba(52,211,153,0.12)',
    gradient: 'linear-gradient(135deg,#059669,#047857)',
  },
  {
    id: 'reports',
    label: 'Reports',
    desc: 'Generate P&L, Balance Sheet, Cash Flow and GST reports',
    icon: PieChart,
    color: '#f87171',
    bg: 'rgba(248,113,113,0.12)',
    gradient: 'linear-gradient(135deg,#dc2626,#b91c1c)',
  },
  {
    id: 'caa',
    label: 'CA Appointments',
    desc: 'Schedule consultations, share docs and track meetings',
    icon: CalendarClock,
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.12)',
    gradient: 'linear-gradient(135deg,#ea580c,#c2410c)',
  },
  {
    id: 'kb',
    label: 'Knowledge Base',
    desc: 'Guides, articles and FAQs on GST, tax and compliance',
    icon: Library,
    color: '#e879f9',
    bg: 'rgba(232,121,249,0.12)',
    gradient: 'linear-gradient(135deg,#a21caf,#86198f)',
  },
]

export default function FeaturesPage({ setActiveNav }) {
  return (
    <div className="space-y-6">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h2 className="text-base font-semibold" style={{ color: 'var(--tc-text-1)' }}>Features</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>All tools and modules available in your workspace</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {features.map((feat, i) => (
          <motion.div
            key={feat.id}
            variants={fadeUp}
            custom={i}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -4 }}
            onClick={() => setActiveNav(feat.id)}
            className="rounded-2xl p-5 cursor-pointer group relative overflow-hidden"
            style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}
          >
            {/* Decorative orb */}
            <div
              className="absolute -right-6 -top-6 w-24 h-24 rounded-full pointer-events-none transition-transform group-hover:scale-110"
              style={{ background: feat.bg }}
            />

            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 relative"
              style={{ background: feat.bg }}
            >
              <feat.icon className="w-5 h-5" style={{ color: feat.color }} strokeWidth={1.8} />
            </div>

            <h3 className="text-sm font-semibold mb-1.5 relative" style={{ color: 'var(--tc-text-1)' }}>
              {feat.label}
            </h3>
            <p className="text-xs leading-relaxed mb-5 relative" style={{ color: 'var(--tc-text-3)' }}>
              {feat.desc}
            </p>

            <button
              onClick={() => setActiveNav(feat.id)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg text-white relative transition-opacity hover:opacity-90"
              style={{ background: feat.gradient }}
            >
              Open
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
