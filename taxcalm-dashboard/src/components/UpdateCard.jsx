import { motion } from 'framer-motion'
import { ArrowUpRight, Clock } from 'lucide-react'

const tagColorMap = {
  yellow: { bg: 'rgba(234,179,8,0.12)', color: '#facc15', border: 'rgba(234,179,8,0.25)' },
  green:  { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.25)' },
  blue:   { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
  purple: { bg: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: 'rgba(139,92,246,0.25)' },
  red:    { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.25)' },
}

export default function UpdateCard({ update, index }) {
  const tag = tagColorMap[update.tagColor] ?? tagColorMap.blue
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      className="rounded-2xl p-5 cursor-pointer group flex flex-col"
      style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}
    >
      {/* Tag + read time */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: tag.bg, color: tag.color, border: `1px solid ${tag.border}` }}>
          {update.tag}
        </span>
        <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--tc-text-3)' }}>
          <Clock className="w-3 h-3" />
          {update.readTime}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold leading-snug mb-2 line-clamp-2 transition-colors" style={{ color: 'var(--tc-text-1)' }}>
        {update.title}
      </h4>

      {/* Description */}
      <p className="text-xs leading-relaxed mb-4 line-clamp-3 flex-1" style={{ color: 'var(--tc-text-3)' }}>
        {update.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--tc-divider)' }}>
        <span className="text-[11px] truncate max-w-[60%]" style={{ color: 'var(--tc-text-4)' }}>
          {update.source} · {update.date}
        </span>
        <button className="flex items-center gap-1 text-[11px] font-semibold transition-colors flex-shrink-0" style={{ color: 'var(--tc-accent)' }}>
          Read more
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    </motion.article>
  )
}


