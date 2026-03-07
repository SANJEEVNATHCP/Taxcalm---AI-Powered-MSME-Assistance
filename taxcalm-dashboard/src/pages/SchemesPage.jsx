import { motion } from 'framer-motion'
import { ExternalLink, BadgeCheck } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.05, ease: 'easeOut' } }),
}

const schemes = [
  {
    id: 1, tag: 'Credit', tagColor: 'blue',
    title: 'Credit Guarantee Fund Scheme for MSMEs',
    desc: 'Collateral-free credit up to ₹2 Crore for MSMEs. Government provides 75–85% guarantee coverage to member lending institutions.',
    ministry: 'Ministry of MSME', benefit: 'Up to ₹2 Cr', eligible: 'All MSMEs', deadline: 'Ongoing',
  },
  {
    id: 2, tag: 'Subsidy', tagColor: 'yellow',
    title: 'PMEGP — Prime Minister Employment Generation Programme',
    desc: '15–35% capital subsidy on project cost for new manufacturing enterprises. Available for rural and urban applicants.',
    ministry: 'KVIC / MSME Ministry', benefit: '35% subsidy', eligible: 'New enterprises', deadline: 'Mar 31, 2026',
  },
  {
    id: 3, tag: 'Technology', tagColor: 'purple',
    title: 'Technology Upgradation Fund Scheme (TUFS)',
    desc: 'Interest reimbursement and capital subsidy for technology upgradation in manufacturing MSMEs.',
    ministry: 'Ministry of Textiles', benefit: '5% interest rebate', eligible: 'Textile MSMEs', deadline: 'Ongoing',
  },
  {
    id: 4, tag: 'Export', tagColor: 'green',
    title: 'Market Development Assistance (MDA)',
    desc: 'Financial support for MSMEs participating in international trade fairs. Covers airfare, stall charges, and branding costs.',
    ministry: 'MSME-DO', benefit: '₹1.5–3 L/year', eligible: 'Export-ready MSMEs', deadline: 'Apr 01, 2026',
  },
  {
    id: 5, tag: 'Digital', tagColor: 'blue',
    title: 'Digital MSME Scheme',
    desc: 'Subsidised cloud computing services for MSMEs to adopt digital tools, ERP, and modern business management software.',
    ministry: 'MSME Ministry', benefit: '₹5,000/month subsidy', eligible: 'Udyam registered', deadline: 'Ongoing',
  },
  {
    id: 6, tag: 'Credit', tagColor: 'yellow',
    title: 'Mudra Yojana — Tarun Loan',
    desc: 'Collateral-free term loans and working capital facilities for small businesses growing beyond initial phase.',
    ministry: 'MUDRA Bank / Banks', benefit: 'Up to ₹10 L', eligible: 'Non-corporate small biz', deadline: 'Ongoing',
  },
]

const tagColors = {
  blue: 'bg-blue-400/10 text-blue-400',
  yellow: 'bg-yellow-400/10 text-yellow-400',
  green: 'bg-emerald-400/10 text-emerald-400',
  purple: 'bg-violet-400/10 text-violet-400',
}

export default function SchemesPage() {
  return (
    <div className="space-y-6">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h2 className="text-base font-semibold" style={{ color: 'var(--tc-text-1)' }}>Government Schemes</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>Subsidies, credit schemes and benefits available for your business</p>
      </motion.div>

      {/* Eligibility banner */}
      <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible"
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <BadgeCheck className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">You are eligible for 4 schemes</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>Based on your Udyam registration, turnover, and business category</p>
        </div>
        <button
          className="text-xs font-semibold px-4 py-2 rounded-xl flex-shrink-0 transition-colors"
          style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
        >
          Check all →
        </button>
      </motion.div>

      {/* Schemes grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {schemes.map((scheme, i) => (
          <motion.div key={scheme.id} variants={fadeUp} custom={i + 2} initial="hidden" animate="visible"
            whileHover={{ y: -3 }}
            className="rounded-2xl p-5 flex flex-col cursor-pointer group"
            style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${tagColors[scheme.tagColor] ?? tagColors.blue}`}>
                {scheme.tag}
              </span>
              <span className="text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,0.12)' }}>
                {scheme.benefit}
              </span>
            </div>

            <h4 className="text-sm font-semibold mb-2 leading-snug group-hover:text-violet-400 transition-colors line-clamp-2" style={{ color: 'var(--tc-text-1)' }}>
              {scheme.title}
            </h4>
            <p className="text-xs leading-relaxed mb-4 flex-1 line-clamp-3" style={{ color: 'var(--tc-text-3)' }}>{scheme.desc}</p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="rounded-xl p-2.5" style={{ background: 'var(--tc-btn-micro)' }}>
                <p className="text-[10px] font-medium" style={{ color: 'var(--tc-text-3)' }}>Ministry</p>
                <p className="text-[11px] font-semibold mt-0.5 truncate" style={{ color: 'var(--tc-text-2)' }}>{scheme.ministry}</p>
              </div>
              <div className="rounded-xl p-2.5" style={{ background: 'var(--tc-btn-micro)' }}>
                <p className="text-[10px] font-medium" style={{ color: 'var(--tc-text-3)' }}>Deadline</p>
                <p className="text-[11px] font-semibold mt-0.5" style={{ color: 'var(--tc-text-2)' }}>{scheme.deadline}</p>
              </div>
            </div>

            <button
              className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ border: '1px solid var(--tc-card-border)', color: 'var(--tc-text-2)' }}
              onClick={() => window.open('https://msme.gov.in', '_blank', 'noopener noreferrer')}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.15)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; e.currentTarget.style.color = '#a78bfa' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--tc-card-border)'; e.currentTarget.style.color = 'var(--tc-text-2)' }}
            >
              Apply Now <ExternalLink className="w-3 h-3" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
