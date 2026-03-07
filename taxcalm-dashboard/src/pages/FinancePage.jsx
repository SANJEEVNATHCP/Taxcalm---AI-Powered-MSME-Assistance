import { motion } from 'framer-motion'
import { Upload, TrendingUp, TrendingDown, DollarSign, PieChart, ArrowUpRight } from 'lucide-react'
import { GSTLineChart, ExpensesBarChart } from '../components/ChartCard.jsx'
import { gstTrendData, expensesData } from '../data/mockData.js'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.05, ease: 'easeOut' } }),
}

const transactions = [
  { id: 1, desc: 'Office Rent — March', category: 'Rent', amount: -32000, date: 'Mar 01', type: 'debit' },
  { id: 2, desc: 'Client Payment — Rajan Exports', category: 'Revenue', amount: 185000, date: 'Mar 02', type: 'credit' },
  { id: 3, desc: 'AWS Cloud Services', category: 'Tech', amount: -8400, date: 'Mar 03', type: 'debit' },
  { id: 4, desc: 'Salary — March 2026', category: 'Salaries', amount: -85000, date: 'Mar 05', type: 'debit' },
  { id: 5, desc: 'Client Payment — Mehta Industries', category: 'Revenue', amount: 210000, date: 'Mar 06', type: 'credit' },
  { id: 6, desc: 'Google Ads', category: 'Marketing', amount: -18000, date: 'Mar 06', type: 'debit' },
]

export default function FinancePage() {
  const fmt = (n) => `₹${Math.abs(n).toLocaleString('en-IN')}`

  return (
    <div className="space-y-6">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h2 className="text-base font-semibold" style={{ color: 'var(--tc-text-1)' }}>Financial Hub</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>Track revenue, expenses, and P&amp;L in real time</p>
      </motion.div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: '₹8,42,000', icon: TrendingUp, color: 'emerald', change: '+12%' },
          { label: 'Total Expenses', value: '₹2,18,500', icon: TrendingDown, color: 'red', change: '+5%' },
          { label: 'Net P&L', value: '₹6,23,500', icon: DollarSign, color: 'yellow', change: '+18%' },
          { label: 'Profit Margin', value: '74%', icon: PieChart, color: 'blue', change: '+6%' },
        ].map((item, i) => {
          const Icon = item.icon
          const iconBg = { emerald: 'rgba(52,211,153,0.15)', red: 'rgba(248,113,113,0.15)', yellow: 'rgba(251,191,36,0.15)', blue: 'rgba(96,165,250,0.15)' }[item.color]
          const iconColor = { emerald: '#34d399', red: '#f87171', yellow: '#fbbf24', blue: '#60a5fa' }[item.color]
          return (
            <motion.div key={item.label} variants={fadeUp} custom={i} initial="hidden" animate="visible"
              whileHover={{ y: -3 }}
              className="rounded-2xl p-5 cursor-pointer"
              style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: iconBg }}>
                <Icon className="w-4.5 h-4.5" style={{ color: iconColor }} strokeWidth={2} />
              </div>
              <p className="text-xl font-bold" style={{ color: 'var(--tc-text-1)' }}>{item.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>{item.label}</p>
              <span className="mt-2 text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full inline-block" style={{ background: 'rgba(52,211,153,0.12)' }}>{item.change}</span>
            </motion.div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GSTLineChart data={gstTrendData} />
        <ExpensesBarChart data={expensesData} />
      </div>

      {/* Recent Transactions */}
      <motion.div variants={fadeUp} custom={5} initial="hidden" animate="visible"
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--tc-divider)' }}>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>Recent Transactions</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>March 2026</p>
          </div>
          <button
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--tc-text-2)', background: 'var(--tc-btn-micro)', border: '1px solid var(--tc-input-border)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--tc-card-border)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--tc-btn-micro)'}
          >
            <Upload className="w-3.5 h-3.5" /> Upload statement
          </button>
        </div>

        <div>
          {transactions.map((tx, i) => (
            <motion.div key={tx.id} variants={fadeUp} custom={i * 0.5} initial="hidden" animate="visible"
              className="flex items-center gap-4 px-5 py-3.5 transition-colors"
              style={{ borderBottom: i < transactions.length - 1 ? '1px solid var(--tc-divider)' : 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--tc-btn-micro)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: tx.type === 'credit' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)' }}>
                {tx.type === 'credit'
                  ? <TrendingUp className="w-4 h-4 text-emerald-400" strokeWidth={2} />
                  : <TrendingDown className="w-4 h-4 text-red-400" strokeWidth={2} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--tc-text-1)' }}>{tx.desc}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--tc-text-3)' }}>{tx.category} · {tx.date}</p>
              </div>
              <span className={`text-sm font-semibold flex-shrink-0 ${tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                {tx.type === 'credit' ? '+' : '-'}{fmt(tx.amount)}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="px-5 py-3" style={{ borderTop: '1px solid var(--tc-divider)' }}>
          <button className="flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors">
            View all transactions <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  )
}
