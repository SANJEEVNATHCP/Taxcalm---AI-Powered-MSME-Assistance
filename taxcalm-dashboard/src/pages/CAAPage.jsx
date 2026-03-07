import { useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarClock, Video, Phone, MessageSquare, Clock, CheckCircle2, Star, Upload, FileText, ChevronLeft } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.05, ease: 'easeOut' } }),
}

const appointments = [
  { id: 1, ca: 'CA Meera Joshi',    topic: 'GST Annual Return',         date: 'Apr 10, 2026', time: '11:00 AM', mode: 'video',  status: 'upcoming' },
  { id: 2, ca: 'CA Suresh Iyer',    topic: 'ITR Filing & Tax Planning',  date: 'Apr 14, 2026', time: '3:00 PM',  mode: 'phone',  status: 'upcoming' },
  { id: 3, ca: 'CA Meera Joshi',    topic: 'TDS Review Q4 FY26',         date: 'Mar 22, 2026', time: '10:30 AM', mode: 'video',  status: 'completed' },
  { id: 4, ca: 'CA Rajan Pillai',   topic: 'New Business Registration',  date: 'Mar 8, 2026',  time: '2:00 PM',  mode: 'office', status: 'completed' },
]

const documents = [
  { name: 'GST Registration Certificate', shared: 'Feb 12, 2026', size: '210 KB' },
  { name: 'Bank Statements (Oct–Dec)',     shared: 'Jan 28, 2026', size: '1.2 MB' },
  { name: 'Profit & Loss FY25',           shared: 'Jan 15, 2026', size: '88 KB'  },
]

const modeIcon = { video: Video, phone: Phone, office: MessageSquare }
const modeLabel = { video: 'Video Call', phone: 'Phone Call', office: 'In-Office' }

export default function CAAPage({ setActiveNav }) {
  const [booking, setBooking] = useState(false)
  const [booked, setBooked] = useState(false)

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
          <h2 className="text-base font-semibold" style={{ color: 'var(--tc-text-1)' }}>CA Appointments</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>Schedule consultations, share documents and track meetings</p>
        </div>
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => { setBooking(true); setTimeout(() => { setBooking(false); setBooked(true) }, 1600) }}
          disabled={booking}
          className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: booked ? 'linear-gradient(135deg,#059669,#047857)' : 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}>
          {booked ? <><CheckCircle2 className="w-3.5 h-3.5" /> Meeting Booked</> : booking ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" /> Booking…</> : <><CalendarClock className="w-3.5 h-3.5" /> Book Consultation</>}
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Upcoming',       value: '2',  color: '#a78bfa', bg: 'rgba(139,92,246,0.12)' },
          { label: 'Completed',      value: '11', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
          { label: 'Hours Consulted',value: '16', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
          { label: 'Docs Shared',    value: '3',  color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
        ].map((stat, i) => (
          <motion.div key={stat.label} variants={fadeUp} custom={i} initial="hidden" animate="visible"
            className="rounded-2xl p-5" style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: stat.bg }}>
              <CalendarClock className="w-4 h-4" style={{ color: stat.color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--tc-text-1)' }}>{stat.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Appointments list */}
        <motion.div variants={fadeUp} custom={5} initial="hidden" animate="visible"
          className="lg:col-span-2 rounded-2xl overflow-hidden" style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--tc-divider)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>Consultations</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>Upcoming and past meetings</p>
          </div>
          {appointments.map((appt, i) => {
            const ModeIcon = modeIcon[appt.mode]
            return (
              <div key={appt.id}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors"
                style={{ borderBottom: i < appointments.length - 1 ? '1px solid var(--tc-divider)' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--tc-btn-micro)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: appt.status === 'upcoming' ? 'rgba(139,92,246,0.12)' : 'rgba(52,211,153,0.1)' }}>
                  {appt.status === 'upcoming'
                    ? <CalendarClock className="w-4.5 h-4.5" style={{ color: '#a78bfa' }} />
                    : <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--tc-text-1)' }}>{appt.topic}</p>
                  <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--tc-text-3)' }}>{appt.ca}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium" style={{ color: 'var(--tc-text-2)' }}>{appt.date}</p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5" style={{ color: 'var(--tc-text-3)' }} />
                    <span className="text-[11px]" style={{ color: 'var(--tc-text-3)' }}>{appt.time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg flex-shrink-0"
                  style={{ background: 'var(--tc-btn-micro)', border: '1px solid var(--tc-divider)' }}>
                  <ModeIcon className="w-3 h-3" style={{ color: 'var(--tc-text-3)' }} />
                  <span className="text-[10px] hidden sm:block" style={{ color: 'var(--tc-text-3)' }}>{modeLabel[appt.mode]}</span>
                </div>
              </div>
            )
          })}
        </motion.div>

        {/* Shared documents */}
        <motion.div variants={fadeUp} custom={6} initial="hidden" animate="visible"
          className="rounded-2xl" style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--tc-divider)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>Shared Documents</h3>
          </div>
          <div className="p-4 space-y-2.5">
            {documents.map((doc, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'var(--tc-btn-micro)', border: '1px solid var(--tc-divider)' }}>
                <FileText className="w-4 h-4 flex-shrink-0" style={{ color: '#a78bfa' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--tc-text-1)' }}>{doc.name}</p>
                  <p className="text-[11px]" style={{ color: 'var(--tc-text-3)' }}>{doc.shared} · {doc.size}</p>
                </div>
              </div>
            ))}
            <button className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl transition-colors hover:opacity-80 mt-2"
              style={{ background: 'var(--tc-btn-micro)', border: '1px dashed var(--tc-input-border)', color: 'var(--tc-text-3)' }}>
              <Upload className="w-3.5 h-3.5" /> Upload Document
            </button>
          </div>

          {/* CA ratings */}
          <div className="px-5 pb-4">
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--tc-text-2)' }}>Your CAs</p>
            {[{ name: 'CA Meera Joshi', rating: 4.9, sessions: 8 }, { name: 'CA Suresh Iyer', rating: 4.7, sessions: 3 }].map((ca, i) => (
              <div key={i} className="flex items-center gap-3 mb-2.5 last:mb-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: i === 0 ? '#7c3aed' : '#0ea5e9' }}>
                  {ca.name.split(' ')[1][0]}{ca.name.split(' ')[2][0]}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium" style={{ color: 'var(--tc-text-1)' }}>{ca.name}</p>
                  <p className="text-[11px]" style={{ color: 'var(--tc-text-3)' }}>{ca.sessions} sessions</p>
                </div>
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-semibold" style={{ color: 'var(--tc-text-2)' }}>{ca.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
