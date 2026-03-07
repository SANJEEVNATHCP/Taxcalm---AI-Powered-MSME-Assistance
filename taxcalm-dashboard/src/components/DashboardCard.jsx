import { motion } from 'framer-motion'
import { Receipt, TrendingUp, TrendingDown, FileWarning, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const iconMap = {
  Receipt,
  TrendingUp,
  FileWarning,
  Wallet,
}

const colorConfig = {
  yellow: {
    iconBg: 'rgba(234,179,8,0.12)',
    iconColor: '#facc15',
    glow: 'rgba(234,179,8,0.15)',
    accent: '#facc15',
  },
  green: {
    iconBg: 'rgba(16,185,129,0.12)',
    iconColor: '#34d399',
    glow: 'rgba(16,185,129,0.15)',
    accent: '#10b981',
  },
  red: {
    iconBg: 'rgba(239,68,68,0.12)',
    iconColor: '#f87171',
    glow: 'rgba(239,68,68,0.15)',
    accent: '#ef4444',
  },
  blue: {
    iconBg: 'rgba(59,130,246,0.12)',
    iconColor: '#60a5fa',
    glow: 'rgba(59,130,246,0.15)',
    accent: '#3b82f6',
  },
}

export default function DashboardCard({ card, index, onNavigate }) {
  const Icon = iconMap[card.icon] || Receipt
  const colors = colorConfig[card.color] || colorConfig.yellow

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
      whileHover={{ y: -4, boxShadow: `0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)` }}
      onClick={() => onNavigate && card.navTarget && onNavigate(card.navTarget)}
      className="rounded-2xl p-5 cursor-pointer transition-all relative overflow-hidden"
      style={{
        background: 'var(--tc-card-bg)',
        border: '1px solid var(--tc-card-border)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}
    >
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${colors.accent}66, transparent)` }} />

      <div className="flex items-start justify-between mb-4">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: colors.iconBg, boxShadow: `0 0 12px ${colors.glow}` }}>
          <Icon className="w-5 h-5" style={{ color: colors.iconColor }} strokeWidth={2} />
        </div>

        {/* Trend badge */}
        <span
          className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg"
          style={card.trendUp
            ? { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }
            : { background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          {card.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {card.trend}
        </span>
      </div>

      <p className="text-2xl font-bold tracking-tight leading-none mb-1" style={{ color: 'var(--tc-text-1)' }}>
        {card.value}
      </p>
      <p className="text-sm font-medium" style={{ color: 'var(--tc-text-2)' }}>{card.title}</p>
      <p className="text-xs mt-1" style={{ color: 'var(--tc-text-3)' }}>{card.subtitle}</p>
    </motion.div>
  )
}


