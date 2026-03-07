import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, BookOpen, Tag, ChevronRight, ChevronDown, ChevronUp, Star, TrendingUp, Shield, Receipt, BarChart2, ChevronLeft } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.05, ease: 'easeOut' } }),
}

const categories = [
  { id: 'gst',    label: 'GST',          icon: Receipt,   color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  count: 24 },
  { id: 'it',     label: 'Income Tax',   icon: TrendingUp,color: '#a78bfa', bg: 'rgba(139,92,246,0.12)', count: 31 },
  { id: 'comp',   label: 'Compliance',   icon: Shield,    color: '#34d399', bg: 'rgba(52,211,153,0.12)', count: 18 },
  { id: 'fin',    label: 'Finance',      icon: BarChart2, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', count: 15 },
]

const featured = [
  { title: 'GST Input Tax Credit — Complete Guide',     category: 'GST',        reads: '4.2k', time: '8 min read', star: true },
  { title: 'How to File ITR-3 for Business Income',    category: 'Income Tax', reads: '3.1k', time: '12 min read', star: true },
  { title: 'TDS Deduction Rates for FY 2025-26',       category: 'Income Tax', reads: '2.8k', time: '5 min read', star: false },
  { title: 'GSTR-9 Annual Return Filing Walkthrough',  category: 'GST',        reads: '2.3k', time: '10 min read', star: true },
]

const faqs = [
  { q: 'What is the due date for GSTR-3B filing?',            a: 'GSTR-3B is due on the 20th of the following month for regular taxpayers. For QRMP scheme taxpayers, it is the 22nd or 24th depending on state.' },
  { q: 'Can I claim ITC on capital goods?',                   a: 'Yes, ITC on capital goods is available in full in the same tax period, provided the goods are used for taxable outward supplies.' },
  { q: 'What is the threshold for TDS under Section 194C?',   a: 'TDS is deductible if the single contract value exceeds ₹30,000 or the aggregate in a financial year exceeds ₹1,00,000.' },
  { q: 'Is advance tax applicable to salaried employees?',    a: 'No. TDS deducted by the employer generally covers advance tax for salaried individuals. Advance tax applies if tax liability exceeds ₹10,000 even after TDS.' },
  { q: 'What is the presumptive taxation scheme?',            a: 'Under Section 44AD, businesses with turnover up to ₹3 crore can declare 8% (or 6% for digital receipts) as profit without maintaining detailed books.' },
]

const catColors = { 'GST': '#fbbf24', 'Income Tax': '#a78bfa', 'Compliance': '#34d399', 'Finance': '#60a5fa' }

export default function KnowledgeBasePage({ setActiveNav }) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)

  const filtered = featured.filter(a =>
    (!activeCategory || a.category === categories.find(c => c.id === activeCategory)?.label) &&
    (!query || a.title.toLowerCase().includes(query.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <button
        onClick={() => setActiveNav('features')}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
        style={{ background: 'var(--tc-btn-micro)', border: '1px solid var(--tc-card-border)', color: 'var(--tc-text-2)' }}>
        <ChevronLeft className="w-3.5 h-3.5" /> Back to Features
      </button>
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h2 className="text-base font-semibold" style={{ color: 'var(--tc-text-1)' }}>Knowledge Base</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>Guides, articles and FAQs on GST, Income Tax and compliance</p>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible"
        className="flex items-center gap-3 px-4 py-3 rounded-2xl"
        style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
        <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--tc-text-3)' }} />
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search articles, guides, and FAQs…"
          className="flex-1 bg-transparent text-sm outline-none placeholder-opacity-50"
          style={{ color: 'var(--tc-text-1)', '--placeholder-color': 'var(--tc-text-3)' }} />
        {query && <button onClick={() => setQuery('')} className="text-xs" style={{ color: 'var(--tc-text-3)' }}>Clear</button>}
      </motion.div>

      {/* Category pills */}
      <motion.div variants={fadeUp} custom={2} initial="hidden" animate="visible" className="flex gap-3 flex-wrap">
        {categories.map((cat, i) => (
          <button key={cat.id} onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
            style={activeCategory === cat.id
              ? { background: cat.bg, border: `1px solid ${cat.color}40`, color: cat.color }
              : { background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)', color: 'var(--tc-text-2)' }}>
            <cat.icon className="w-3.5 h-3.5" style={{ color: activeCategory === cat.id ? cat.color : 'var(--tc-text-3)' }} />
            {cat.label}
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: activeCategory === cat.id ? `${cat.color}20` : 'var(--tc-btn-micro)', color: activeCategory === cat.id ? cat.color : 'var(--tc-text-3)' }}>
              {cat.count}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Featured articles */}
      <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible"
        className="rounded-2xl overflow-hidden" style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--tc-divider)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>
            {query || activeCategory ? 'Search Results' : 'Popular Articles'}
          </h3>
        </div>
        {filtered.length === 0 && (
          <div className="px-5 py-8 text-center">
            <p className="text-sm" style={{ color: 'var(--tc-text-3)' }}>No articles found. Try a different search.</p>
          </div>
        )}
        {filtered.map((article, i) => (
          <motion.div key={i} variants={fadeUp} custom={i * 0.2} initial="hidden" animate="visible"
            className="flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors"
            style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--tc-divider)' : 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--tc-btn-micro)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${catColors[article.category]}1a` }}>
              <BookOpen className="w-4 h-4" style={{ color: catColors[article.category] }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--tc-text-1)' }}>{article.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: `${catColors[article.category]}1a`, color: catColors[article.category] }}>
                  {article.category}
                </span>
                <span className="text-[11px]" style={{ color: 'var(--tc-text-3)' }}>{article.time} · {article.reads} reads</span>
              </div>
            </div>
            {article.star && <Star className="w-3.5 h-3.5 flex-shrink-0 fill-yellow-400 text-yellow-400" />}
            <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--tc-text-3)' }} />
          </motion.div>
        ))}
      </motion.div>

      {/* FAQs */}
      <motion.div variants={fadeUp} custom={8} initial="hidden" animate="visible"
        className="rounded-2xl overflow-hidden" style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--tc-divider)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>Frequently Asked Questions</h3>
        </div>
        {faqs.map((faq, i) => (
          <div key={i} style={{ borderBottom: i < faqs.length - 1 ? '1px solid var(--tc-divider)' : 'none' }}>
            <button
              className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors"
              onMouseEnter={e => e.currentTarget.style.background = 'var(--tc-btn-micro)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <span className="text-xs font-medium flex-1" style={{ color: 'var(--tc-text-1)' }}>{faq.q}</span>
              {openFaq === i
                ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--tc-text-3)' }} />
                : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--tc-text-3)' }} />}
            </button>
            {openFaq === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                className="px-5 pb-4">
                <p className="text-xs leading-relaxed" style={{ color: 'var(--tc-text-3)' }}>{faq.a}</p>
              </motion.div>
            )}
          </div>
        ))}
      </motion.div>
    </div>
  )
}
