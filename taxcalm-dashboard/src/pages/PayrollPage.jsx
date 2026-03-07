import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, IndianRupee, Shield, ChevronDown, ChevronUp, CheckCircle2, ChevronLeft } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.05, ease: 'easeOut' } }),
}

const formattedEmployees = [
  { id: 'EMP001', name: 'Ravi Sharma',     role: 'Senior Developer',   ctc: '₹96,000', pf: '₹1,800', esi: '—',    tds: '₹6,200', net: '₹88,000' },
  { id: 'EMP002', name: 'Priya Menon',     role: 'Product Manager',    ctc: '₹1,20,000',pf: '₹2,400', esi: '—',   tds: '₹9,800', net: '₹1,07,800' },
  { id: 'EMP003', name: 'Arjun Das',       role: 'UI/UX Designer',     ctc: '₹72,000', pf: '₹1,800', esi: '—',    tds: '₹3,800', net: '₹66,400' },
  { id: 'EMP004', name: 'Sneha Pillai',    role: 'Accounts Executive', ctc: '₹38,000', pf: '₹1,800', esi: '₹570', tds: '—',      net: '₹35,630' },
  { id: 'EMP005', name: 'Kiran Reddy',     role: 'Sales Executive',    ctc: '₹32,000', pf: '₹1,800', esi: '₹480', tds: '—',      net: '₹29,720' },
]

const initials = name => name.split(' ').map(n => n[0]).join('')
const colors   = ['#7c3aed', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444']

export default function PayrollPage({ setActiveNav }) {
  const [expanded, setExpanded] = useState(null)
  const [running, setRunning] = useState(false)
  const [ran, setRan] = useState(false)

  const handleRun = () => {
    setRunning(true)
    setTimeout(() => { setRunning(false); setRan(true) }, 1800)
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => setActiveNav('features')}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
        style={{ background: 'var(--tc-btn-micro)', border: '1px solid var(--tc-card-border)', color: 'var(--tc-text-2)' }}>
        <ChevronLeft className="w-3.5 h-3.5" /> Back to Features
      </button>
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--tc-text-1)' }}>Payroll</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>Manage salaries, PF, ESI and monthly payroll runs</p>
        </div>
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={handleRun} disabled={running}
          className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: ran ? 'linear-gradient(135deg,#059669,#047857)' : 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}>
          {ran ? <><CheckCircle2 className="w-3.5 h-3.5" /> Payroll Processed</> : running ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" /> Processing…</> : <><IndianRupee className="w-3.5 h-3.5" /> Run Payroll</>}
        </motion.button>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Gross Payroll',  value: '₹3,58,000', icon: IndianRupee, color: '#a78bfa', bg: 'rgba(139,92,246,0.12)' },
          { label: 'Total PF',       value: '₹9,600',    icon: Shield,      color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
          { label: 'Total ESI',      value: '₹1,050',    icon: Shield,      color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
          { label: 'Net Pay',        value: '₹3,27,550', icon: Users,       color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
        ].map((card, i) => (
          <motion.div key={card.label} variants={fadeUp} custom={i} initial="hidden" animate="visible"
            className="rounded-2xl p-5" style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: card.bg }}>
              <card.icon className="w-4 h-4" style={{ color: card.color }} strokeWidth={2} />
            </div>
            <p className="text-xl font-bold" style={{ color: 'var(--tc-text-1)' }}>{card.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Employee payroll table */}
      <motion.div variants={fadeUp} custom={5} initial="hidden" animate="visible"
        className="rounded-2xl overflow-hidden" style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--tc-divider)' }}>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>Employee Payroll</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>March 2026 · 5 employees</p>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>
            {ran ? 'Processed' : 'Draft'}
          </span>
        </div>
        {/* Header row */}
        <div className="grid px-5 py-2 text-[11px] font-semibold" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', color: 'var(--tc-text-3)', borderBottom: '1px solid var(--tc-divider)' }}>
          <span>Employee</span>
          <span className="text-right">Gross</span>
          <span className="text-right">PF</span>
          <span className="text-right">ESI</span>
          <span className="text-right">TDS</span>
          <span className="text-right">Net Pay</span>
        </div>
        {formattedEmployees.map((emp, i) => (
          <div key={emp.id}>
            <div
              className="grid items-center px-5 py-3 cursor-pointer transition-colors"
              style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', borderBottom: '1px solid var(--tc-divider)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--tc-btn-micro)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: colors[i % colors.length] }}>
                  {initials(emp.name)}
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--tc-text-1)' }}>{emp.name}</p>
                  <p className="text-[11px]" style={{ color: 'var(--tc-text-3)' }}>{emp.role}</p>
                </div>
              </div>
              <span className="text-xs text-right" style={{ color: 'var(--tc-text-2)' }}>{emp.ctc}</span>
              <span className="text-xs text-right" style={{ color: 'var(--tc-text-2)' }}>{emp.pf}</span>
              <span className="text-xs text-right" style={{ color: 'var(--tc-text-2)' }}>{emp.esi}</span>
              <span className="text-xs text-right" style={{ color: 'var(--tc-text-2)' }}>{emp.tds}</span>
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs font-semibold" style={{ color: '#34d399' }}>{emp.net}</span>
                {expanded === i ? <ChevronUp className="w-3.5 h-3.5" style={{ color: 'var(--tc-text-3)' }} /> : <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--tc-text-3)' }} />}
              </div>
            </div>
            {expanded === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="px-5 py-4 text-xs" style={{ background: 'var(--tc-btn-micro)', borderBottom: '1px solid var(--tc-divider)' }}>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Employee ID', val: emp.id },
                    { label: 'Employer PF', val: emp.pf },
                    { label: 'Employer ESI', val: emp.esi === '—' ? '—' : `₹${parseInt(emp.esi.replace(/[₹,]/g, '')) * 1.75 | 0}` },
                  ].map(item => (
                    <div key={item.label}>
                      <p style={{ color: 'var(--tc-text-3)' }}>{item.label}</p>
                      <p className="font-semibold mt-0.5" style={{ color: 'var(--tc-text-1)' }}>{item.val}</p>
                    </div>
                  ))}
                </div>
                <button className="mt-3 text-[11px] font-semibold transition-opacity hover:opacity-70" style={{ color: 'var(--tc-accent)' }}>
                  Download Payslip →
                </button>
              </motion.div>
            )}
          </div>
        ))}
      </motion.div>

      {/* Compliance status */}
      <motion.div variants={fadeUp} custom={6} initial="hidden" animate="visible"
        className="rounded-2xl p-5" style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--tc-text-1)' }}>Statutory Compliance</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'PF Deposit', due: 'Apr 15, 2026', amount: '₹19,200', status: 'due' },
            { label: 'ESI Deposit', due: 'Apr 15, 2026', amount: '₹2,153', status: 'due' },
            { label: 'TDS (Payroll)', due: 'Apr 7, 2026', amount: '₹19,800', status: 'upcoming' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'var(--tc-btn-micro)', border: '1px solid var(--tc-divider)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: item.status === 'due' ? 'rgba(251,191,36,0.15)' : 'rgba(96,165,250,0.15)' }}>
                <Shield className="w-3.5 h-3.5" style={{ color: item.status === 'due' ? '#fbbf24' : '#60a5fa' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: 'var(--tc-text-1)' }}>{item.label}</p>
                <p className="text-[11px]" style={{ color: 'var(--tc-text-3)' }}>{item.amount} · Due {item.due}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
