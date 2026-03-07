import { motion } from 'framer-motion'
import { BookOpen, Clock, PlayCircle, ChevronRight, Star } from 'lucide-react'
import { useToast } from '../contexts/ToastContext.jsx'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.05, ease: 'easeOut' } }),
}

const courses = [
  {
    id: 1, category: 'GST Basics', tag: 'Beginner', color: 'green',
    title: 'GST Fundamentals for Small Business Owners',
    desc: 'Learn the basics of GST, registration thresholds, invoice formats, and how to file your first return.',
    lessons: 8, duration: '2.5 hrs', rating: 4.8, students: '12,400',
  },
  {
    id: 2, category: 'ITC', tag: 'Intermediate', color: 'blue',
    title: 'Mastering Input Tax Credit (ITC) Claims',
    desc: 'Deep dive into ITC eligibility, blocked credits, GSTR-2B reconciliation, and maximising your refunds.',
    lessons: 12, duration: '4 hrs', rating: 4.9, students: '8,200',
  },
  {
    id: 3, category: 'Compliance', tag: 'All levels', color: 'yellow',
    title: 'Zero-Penalty GST Compliance Guide',
    desc: 'Stay compliant with filing calendars, late fee calculators, and best practices for avoiding notices.',
    lessons: 6, duration: '1.5 hrs', rating: 4.7, students: '19,800',
  },
  {
    id: 4, category: 'Finance', tag: 'Intermediate', color: 'purple',
    title: 'Reading Your P&L and Balance Sheet',
    desc: 'Understand financial statements, cash flow management, and profit forecasting for MSMEs.',
    lessons: 10, duration: '3 hrs', rating: 4.6, students: '6,100',
  },
  {
    id: 5, category: 'E-Invoice', tag: 'Beginner', color: 'green',
    title: 'E-Invoice & E-Way Bill: Complete Guide',
    desc: 'Everything about generating e-invoices, IRN, QR codes, and e-way bills for goods transport.',
    lessons: 5, duration: '1 hr', rating: 4.8, students: '22,300',
  },
  {
    id: 6, category: 'Schemes', tag: 'All levels', color: 'blue',
    title: 'Government Schemes & Subsidies for MSMEs',
    desc: 'Navigate PMEGP, Mudra, CGTMSE and other schemes to unlock free capital for your business.',
    lessons: 9, duration: '2 hrs', rating: 4.5, students: '9,700',
  },
]

const tagColors = {
  green: 'bg-emerald-400/10 text-emerald-400',
  blue: 'bg-blue-400/10 text-blue-400',
  yellow: 'bg-yellow-400/10 text-yellow-400',
  purple: 'bg-violet-400/10 text-violet-400',
}

export default function LearnPage() {
  const showToast = useToast()
  return (
    <div className="space-y-6">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h2 className="text-base font-semibold" style={{ color: 'var(--tc-text-1)' }}>Learn</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>Bite-sized courses on GST, compliance, and MSME finance</p>
      </motion.div>

      {/* Featured banner */}
      <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible"
        className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(91,33,182,0.4))', border: '1px solid rgba(124,58,237,0.3)' }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(124,58,237,0.4)' }}>
          <BookOpen className="w-6 h-6 text-violet-300" />
        </div>
        <div className="flex-1">
          <span className="text-[11px] font-semibold text-violet-400 px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.2)' }}>Featured</span>
          <h3 className="text-base font-bold mt-1.5" style={{ color: 'var(--tc-text-1)' }}>GST Fundamentals for Small Business Owners</h3>
          <p className="text-xs mt-1" style={{ color: 'var(--tc-text-3)' }}>8 lessons · 2.5 hrs · 12,400 learners</p>
        </div>
        <button
          className="flex items-center gap-2 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex-shrink-0 transition-colors"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          onClick={() => showToast('Opening course: GST Fundamentals for Small Business Owners…', 'info')}
        >
          <PlayCircle className="w-4 h-4" /> Start Learning
        </button>
      </motion.div>

      {/* Courses grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {courses.map((course, i) => (
          <motion.div key={course.id} variants={fadeUp} custom={i + 2} initial="hidden" animate="visible"
            whileHover={{ y: -3 }}
            className="rounded-2xl p-5 flex flex-col cursor-pointer group"
            style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${tagColors[course.color] ?? tagColors.blue}`}>
                {course.category}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ color: 'var(--tc-text-3)', background: 'var(--tc-btn-micro)', border: '1px solid var(--tc-card-border)' }}>
                {course.tag}
              </span>
            </div>

            <h4 className="text-sm font-semibold mb-2 leading-snug group-hover:text-violet-400 transition-colors line-clamp-2" style={{ color: 'var(--tc-text-1)' }}>
              {course.title}
            </h4>
            <p className="text-xs leading-relaxed mb-4 flex-1 line-clamp-2" style={{ color: 'var(--tc-text-3)' }}>{course.desc}</p>

            <div className="flex items-center gap-3 text-[11px] mb-4" style={{ color: 'var(--tc-text-3)' }}>
              <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {course.lessons} lessons</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration}</span>
              <span className="flex items-center gap-1 text-amber-400"><Star className="w-3 h-3 fill-amber-400" /> {course.rating}</span>
            </div>

            <button
              className="flex items-center justify-between w-full py-2 px-3.5 rounded-xl text-xs font-semibold transition-all"
              style={{ background: 'var(--tc-btn-micro)', border: '1px solid var(--tc-card-border)', color: 'var(--tc-text-2)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.15)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.35)'; e.currentTarget.style.color = '#a78bfa' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--tc-btn-micro)'; e.currentTarget.style.borderColor = 'var(--tc-card-border)'; e.currentTarget.style.color = 'var(--tc-text-2)' }}
              onClick={() => showToast(`Opening: ${course.title}…`, 'info')}
            >
              <span>{course.students} learners</span>
              <span className="flex items-center gap-1">Start <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" /></span>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
