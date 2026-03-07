import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calculator, RefreshCw, Info } from 'lucide-react'

const GST_RATES = [0, 0.1, 0.25, 3, 5, 12, 18, 28]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.05, ease: 'easeOut' } }),
}

function ResultRow({ label, value, highlight }) {
  return (
    <div className={`flex items-center justify-between py-3 last:border-0`} style={{ borderBottom: '1px solid var(--tc-divider)' }}>
      <span className="text-sm" style={{ color: 'var(--tc-text-2)' }}>{label}</span>
      <span className={`text-sm font-semibold`} style={highlight ? { color: '#a78bfa', fontSize: '1rem' } : { color: 'var(--tc-text-1)' }}>{value}</span>
    </div>
  )
}

export default function GSTCalculator() {
  const [amount, setAmount] = useState('')
  const [rate, setRate] = useState(18)
  const [mode, setMode] = useState('exclusive') // exclusive | inclusive
  const [result, setResult] = useState(null)

  const fmt = (n) => `₹${Number(n.toFixed(2)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

  const calculate = () => {
    const base = parseFloat(amount)
    if (!base || base <= 0) return
    let taxableAmount, cgst, sgst, totalGst, totalAmount

    if (mode === 'exclusive') {
      taxableAmount = base
      totalGst = base * (rate / 100)
    } else {
      taxableAmount = base / (1 + rate / 100)
      totalGst = base - taxableAmount
    }
    cgst = totalGst / 2
    sgst = totalGst / 2
    totalAmount = taxableAmount + totalGst

    setResult({ taxableAmount, cgst, sgst, totalGst, totalAmount })
  }

  const reset = () => { setAmount(''); setResult(null) }

  return (
    <div className="space-y-6">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h2 className="text-base font-semibold" style={{ color: 'var(--tc-text-1)' }}>GST Calculator</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>Calculate GST liability, CGST, SGST and total payable</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input card */}
        <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible"
          className="rounded-2xl p-6"
          style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)' }}>
              <Calculator className="w-4 h-4" style={{ color: '#a78bfa' }} />
            </div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>Input Details</h3>
          </div>

          {/* Mode toggle */}
          <div className="mb-5">
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--tc-text-2)' }}>Calculation Mode</label>
            <div className="flex rounded-xl overflow-hidden text-sm" style={{ border: '1px solid var(--tc-input-border)' }}>
              {['exclusive', 'inclusive'].map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className="flex-1 py-2 text-xs font-semibold transition-all capitalize"
                  style={mode === m
                    ? { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff' }
                    : { background: 'transparent', color: 'var(--tc-text-3)' }}>
                  GST {m}
                </button>
              ))}
            </div>
            <p className="text-[11px] mt-1.5 flex items-center gap-1" style={{ color: 'var(--tc-text-3)' }}>
              <Info className="w-3 h-3" />
              {mode === 'exclusive' ? 'Amount does not include GST — GST added on top' : 'Amount already includes GST — GST extracted from total'}
            </p>
          </div>

          {/* Amount */}
          <div className="mb-4">
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--tc-text-2)' }}>Amount (₹)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 10000"
              className="w-full px-4 py-2.5 text-sm rounded-xl focus:outline-none transition-all"
              style={{ background: 'var(--tc-input-bg)', border: '1px solid var(--tc-input-border)', color: 'var(--tc-input-text)' }} />
          </div>

          {/* GST Rate */}
          <div className="mb-6">
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--tc-text-2)' }}>GST Rate</label>
            <div className="flex flex-wrap gap-2">
              {GST_RATES.map((r) => (
                <button key={r} onClick={() => setRate(r)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={rate === r
                    ? { background: 'rgba(124,58,237,0.3)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.5)' }
                    : { background: 'var(--tc-btn-micro)', color: 'var(--tc-text-3)', border: '1px solid var(--tc-card-border)' }}>
                  {r}%
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={calculate}
              className="flex-1 text-white text-sm font-semibold py-2.5 rounded-xl transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}>
              Calculate GST
            </button>
            <button onClick={reset}
              className="px-4 py-2.5 rounded-xl transition-colors"
              style={{ border: '1px solid var(--tc-input-border)', color: 'var(--tc-text-3)', background: 'var(--tc-btn-micro)' }}>
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Result card */}
        <motion.div variants={fadeUp} custom={2} initial="hidden" animate="visible"
          className="rounded-2xl p-6"
          style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
          <h3 className="text-sm font-semibold mb-5" style={{ color: 'var(--tc-text-1)' }}>Breakdown</h3>
          {result ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <ResultRow label="Taxable Amount" value={fmt(result.taxableAmount)} />
              <ResultRow label={`CGST (${rate / 2}%)`} value={fmt(result.cgst)} />
              <ResultRow label={`SGST (${rate / 2}%)`} value={fmt(result.sgst)} />
              <ResultRow label={`Total GST (${rate}%)`} value={fmt(result.totalGst)} />
              <ResultRow label="Total Amount Payable" value={fmt(result.totalAmount)} highlight />

              {/* Visual bar */}
              <div className="mt-5 rounded-xl overflow-hidden h-3 flex">
                <div className="bg-blue-400 transition-all" style={{ width: `${(result.taxableAmount / result.totalAmount) * 100}%` }} />
                <div className="flex-1" style={{ background: '#8b5cf6' }} />
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--tc-text-3)' }}><span className="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block" /> Base amount</span>
                <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--tc-text-3)' }}><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#8b5cf6' }} /> GST portion</span>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'var(--tc-btn-micro)' }}>
                <Calculator className="w-6 h-6" style={{ color: 'var(--tc-text-3)' }} />
              </div>
              <p className="text-sm" style={{ color: 'var(--tc-text-3)' }}>Enter an amount and click <br /><span className="font-semibold" style={{ color: 'var(--tc-text-2)' }}>Calculate GST</span></p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Rate reference table */}
      <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible"
        className="rounded-2xl p-5"
        style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--tc-text-1)' }}>GST Rate Reference Guide</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { rate: '0%', items: 'Fresh vegetables, milk, bread, eggs, salt' },
            { rate: '5%', items: 'Packaged food, medicines, footwear (under ₹1000)' },
            { rate: '12%', items: 'Butter, ghee, cheese, frozen meat, mobile phones' },
            { rate: '18%', items: 'Most services, IT, restaurants, telecom' },
            { rate: '28%', items: 'Luxury cars, tobacco, aerated drinks, casinos' },
            { rate: '3%', items: 'Gold, silver, precious metals, jewellery' },
            { rate: '0.25%', items: 'Rough diamonds, precious stones' },
            { rate: '0.1%', items: 'Agricultural equipment, seeds' },
          ].map((item) => (
            <div key={item.rate} className="p-3.5 rounded-xl" style={{ background: 'var(--tc-btn-micro)', border: '1px solid var(--tc-card-border)' }}>
              <span className="text-lg font-bold" style={{ color: 'var(--tc-text-1)' }}>{item.rate}</span>
              <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--tc-text-3)' }}>{item.items}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
