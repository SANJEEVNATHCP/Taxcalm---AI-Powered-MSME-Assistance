import { useState, useEffect, useRef, forwardRef, Suspense, Component } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import {
  Zap, ArrowRight, Play,
  ReceiptText, ShieldCheck, TrendingUp, BrainCircuit,
  FileText, BarChart3, IndianRupee, Percent,
  CheckCircle2, Users, Calculator, Layers, Sparkles,
} from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import ThreeScene from '../components/ThreeScene'

gsap.registerPlugin(ScrollTrigger)

const EASE = [0.22, 1, 0.36, 1]

/* ── Lenis smooth scroll ─────────────────────────────────────────────────── */
function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      lenis.destroy()
      gsap.ticker.remove(tick)
    }
  }, [])
}

/* ── Animated counter ─────────────────────────────────────────────────────── */
function Counter({ to, suffix = '', duration = 2 }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView) return
    let frame = 0
    const steps = 80
    const id = setInterval(() => {
      frame++
      const eased = 1 - Math.pow(1 - frame / steps, 3)
      setVal(Math.floor(eased * to))
      if (frame >= steps) { setVal(to); clearInterval(id) }
    }, (duration * 1000) / steps)
    return () => clearInterval(id)
  }, [inView, to, duration])
  return <span ref={ref}>{val.toLocaleString('en-IN')}{suffix}</span>
}

/* ── Word-by-word animated heading ──────────────────────────────────────── */
function SplitHeading({ text, className = '', delay = 0 }) {
  const ref = useRef(null)
  useEffect(() => {
    const words = ref.current.querySelectorAll('.sw')
    const ctx = gsap.context(() => {
      gsap.from(words, {
        y: '110%',
        opacity: 0,
        stagger: 0.075,
        duration: 1,
        ease: 'power4.out',
        delay,
        scrollTrigger: { trigger: ref.current, start: 'top 88%' },
      })
    })
    return () => ctx.revert()
  }, [delay])
  return (
    <div ref={ref} className={className} aria-label={text}>
      {text.split(' ').map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.28em] mb-1">
          <span className="sw inline-block">{word}</span>
        </span>
      ))}
    </div>
  )
}

/* ── Auto-scrolling marquee ──────────────────────────────────────────────── */
function Marquee({ items, reverse = false }) {
  const stripRef = useRef(null)
  useEffect(() => {
    const strip = stripRef.current
    const len = strip.scrollWidth / 2
    const tween = gsap.fromTo(
      strip,
      { x: reverse ? -len : 0 },
      { x: reverse ? 0 : -len, duration: 24, ease: 'none', repeat: -1 }
    )
    return () => tween.kill()
  }, [reverse])
  const doubled = [...items, ...items]
  return (
    <div className="overflow-hidden">
      <div ref={stripRef} className="flex whitespace-nowrap w-max">
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center text-[11px] font-bold uppercase tracking-[0.25em] px-8"
            style={{ color: 'rgba(255,255,255,0.18)' }}>
            {item}
            <span className="ml-8" style={{ color: 'rgba(139,92,246,0.5)' }}>·</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── Error boundary ──────────────────────────────────────────────────────── */
class SceneBoundary extends Component {
  constructor(props) { super(props); this.state = { error: false } }
  static getDerivedStateFromError() { return { error: true } }
  render() { return this.state.error ? null : this.props.children }
}

/* ── Glassmorphism card ──────────────────────────────────────────────────── */
const GlassCard = forwardRef(function GlassCard({ children, className = '', hover = true }, ref) {
  return (
    <motion.div ref={ref}
      whileHover={hover ? { y: -6, scale: 1.01 } : undefined}
      transition={{ duration: 0.35, ease: EASE }}
      className={`rounded-2xl border border-white/10 backdrop-blur-xl ${className}`}
      style={{ background: 'rgba(255,255,255,0.04)', boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
      {children}
    </motion.div>
  )
})

/* ── Live GST card ───────────────────────────────────────────────────────── */
function LiveGSTCard() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2400)
    return () => clearInterval(id)
  }, [])
  const vals = [
    { out: '1,24,800', inp: '48,200', net: '76,600' },
    { out: '98,400', inp: '31,500', net: '66,900' },
    { out: '1,62,000', inp: '55,800', net: '1,06,200' },
  ]
  const g = vals[tick % vals.length]
  return (
    <GlassCard className="p-5 w-64">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
          <Percent className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-white/90 text-xs font-bold">GST Summary</span>
        <span className="ml-auto text-[10px] text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">LIVE</span>
      </div>
      {[['Output GST', `\u20B9${g.out}`, 'text-white'], ['Input Credit', `\u20B9${g.inp}`, 'text-blue-300'], ['Net Payable', `\u20B9${g.net}`, 'text-violet-300 font-bold']].map(([label, val, cls]) => (
        <div key={label} className="flex justify-between py-2 border-b border-white/5 last:border-0">
          <span className="text-white/40 text-xs">{label}</span>
          <motion.span key={val} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }} className={`text-sm ${cls}`}>{val}</motion.span>
        </div>
      ))}
    </GlassCard>
  )
}

/* ── Mini chart card ─────────────────────────────────────────────────────── */
function MiniChartCard() {
  const bars = [45, 62, 38, 78, 55, 90, 67]
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  return (
    <GlassCard className="p-4 w-52" ref={ref}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <BarChart3 className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/80 text-xs font-bold">Revenue</span>
        <span className="ml-auto text-emerald-400 text-xs font-bold">+18%</span>
      </div>
      <div className="flex items-end gap-1 h-10">
        {bars.map((h, i) => (
          <motion.div key={i}
            initial={{ scaleY: 0 }} animate={inView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.05 * i, ease: EASE }}
            style={{ height: `${h}%`, transformOrigin: 'bottom' }}
            className={`flex-1 rounded-t-sm ${i === 5 ? 'bg-gradient-to-t from-violet-600 to-purple-400' : 'bg-white/15'}`} />
        ))}
      </div>
    </GlassCard>
  )
}

/* ── Invoice card ────────────────────────────────────────────────────────── */
function InvoiceCard() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 3000)
    return () => clearInterval(id)
  }, [])
  return (
    <GlassCard className="p-4 w-56">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="text-white/80 text-xs font-bold">Invoice</span>
        <span className="ml-auto text-emerald-400 text-[10px] font-bold">Paid</span>
      </div>
      <motion.div key={`inv-${tick}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="text-white/60 font-mono text-[11px] mb-2">INV-2026-0{(tick % 99) + 101}</motion.div>
      <div className="flex justify-between text-xs">
        <span className="text-white/40">Amount</span>
        <span className="text-white font-bold">\u20B984,200</span>
      </div>
    </GlassCard>
  )
}

/* ── AI badge ────────────────────────────────────────────────────────────── */
function AIBadge() {
  return (
    <GlassCard className="px-4 py-3 flex items-center gap-3 w-auto">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
        <BrainCircuit className="w-4 h-4 text-white" />
      </div>
      <div>
        <div className="text-white text-xs font-bold">AI Assistant</div>
        <div className="text-white/40 text-[10px]">24/7 compliance guard</div>
      </div>
      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse ml-1" />
    </GlassCard>
  )
}

/* ── Navbar ──────────────────────────────────────────────────────────────── */
function Navbar({ onEnter }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])
  return (
    <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 lg:px-16 py-4 transition-all duration-500"
      style={{
        background: scrolled ? 'rgba(5,5,20,0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      }}>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center shadow-lg shadow-violet-900/50">
          <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-lg font-black text-white" style={{ letterSpacing: '-0.03em' }}>TaxCalm</span>
      </div>
      <div className="hidden md:flex items-center gap-8">
        {['Features', 'Pricing', 'About'].map(l => (
          <a key={l} href="#" className="text-sm font-medium text-white/50 hover:text-white/90 transition-colors">{l}</a>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button className="hidden sm:block text-sm font-semibold text-white/50 hover:text-white transition-colors">Sign in</button>
        <button onClick={onEnter}
          className="relative overflow-hidden flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl text-white group"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 0 20px rgba(124,58,237,0.5)' }}>
          <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }} />
          <span className="relative">Get Started</span>
          <ArrowRight className="relative w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </nav>
  )
}

/* ── Feature data ────────────────────────────────────────────────────────── */
const features = [
  {
    icon: Percent, grad: 'from-violet-500 to-purple-700', glow: 'rgba(124,58,237,0.22)', color: '#8b5cf6',
    tag: 'GST Management', num: '01',
    title: 'Smart GST.', sub: 'Zero effort.',
    body: 'Auto-compute CGST, SGST, IGST. Reconcile returns, track ITC, file GSTR-1 & GSTR-3B with one click.',
    bullets: ['All 8 GST slabs', 'Auto ITC reconciliation', 'GSTR filing reminders', 'Penalty prevention alerts'],
  },
  {
    icon: FileText, grad: 'from-blue-500 to-cyan-600', glow: 'rgba(59,130,246,0.22)', color: '#3b82f6',
    tag: 'Invoice Management', num: '02',
    title: 'Professional invoices.', sub: 'Instant.',
    body: 'GST-compliant e-invoices with IRN & QR, auto payment reminders, WhatsApp sharing, PDF export.',
    bullets: ['E-invoice with IRN & QR', 'Auto payment reminders', 'Multi-currency support', 'WhatsApp & email delivery'],
  },
  {
    icon: BarChart3, grad: 'from-emerald-500 to-teal-600', glow: 'rgba(16,185,129,0.22)', color: '#10b981',
    tag: 'Accounting & Analytics', num: '03',
    title: 'Live P&L.', sub: 'No accountant needed.',
    body: 'Connect your bank, auto-categorize expenses, get real-time profit & loss — CA-ready reports at any time.',
    bullets: ['Bank statement import', 'Auto expense categorization', 'Cash flow forecasting', 'CA-ready reports'],
  },
  {
    icon: IndianRupee, grad: 'from-amber-500 to-orange-600', glow: 'rgba(245,158,11,0.22)', color: '#f59e0b',
    tag: 'Income Tax Filing', num: '04',
    title: 'File ITR.', sub: 'Stress-free.',
    body: 'AI computes your liability across all slabs, maximizes 80C/80D deductions, and pre-fills ITR forms.',
    bullets: ['FY 2025-26 slabs', 'Auto 80C/80D optimize', 'Advance tax reminders', 'Pre-filled ITR forms'],
  },
]

const trustStats = [
  { icon: Users, value: 42000, suffix: '+', label: 'MSMEs Trusted Us', grad: 'from-violet-500 to-purple-600' },
  { icon: Calculator, value: 8500000, suffix: '+', label: 'GST Calculations', grad: 'from-blue-500 to-cyan-500' },
  { icon: ReceiptText, value: 3200000, suffix: '+', label: 'Invoices Generated', grad: 'from-emerald-500 to-teal-500' },
]

/* ══════════════════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage({ onEnter }) {
  useLenis()

  const containerRef = useRef(null)
  const heroRef      = useRef(null)
  const heroContentRef = useRef(null)
  const hScrollRef   = useRef(null)
  const hStripRef    = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {

      /* 1 ── Hero: pinned, scroll drives word + fade animation ─────── */
      const heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: '+=220%',
          scrub: 1.2,
          pin: true,
        },
      })
      heroTl
        .from('.hero-line',  { y: '115%', stagger: 0.18, duration: 1.5, ease: 'power4.out' }, 0)
        .from('.hero-sub',   { opacity: 0, y: 35, duration: 1, ease: 'power3.out' }, 0.4)
        .from('.hero-cta',   { opacity: 0, y: 25, duration: 0.9, ease: 'power3.out' }, 0.7)
        .from('.hero-cards', { opacity: 0, x: 60, duration: 1, ease: 'power3.out' }, 0.5)
        .to(heroContentRef.current, { opacity: 0, scale: 0.93, duration: 1.2, ease: 'power2.in' }, 2.2)

      /* 2 ── Horizontal scroll: feature panels ────────────────────── */
      const strip = hStripRef.current
      if (strip) {
        const moveX = -(window.innerWidth * (features.length - 1))
        gsap.to(strip, {
          x: moveX,
          ease: 'none',
          scrollTrigger: {
            trigger: hScrollRef.current,
            start: 'top top',
            end: () => `+=${Math.abs(moveX)}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        })
      }

      /* 3 ── Clip-path reveals ─────────────────────────────────────── */
      gsap.utils.toArray('.clip-reveal').forEach(el => {
        gsap.from(el, {
          clipPath: 'inset(100% 0% 0% 0%)',
          duration: 1.1, ease: 'power4.inOut',
          scrollTrigger: { trigger: el, start: 'top 92%' },
        })
      })

      /* 4 ── General fade-up ───────────────────────────────────────── */
      gsap.utils.toArray('.gsap-reveal').forEach(el => {
        gsap.from(el, {
          opacity: 0, y: 55, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        })
      })

      /* 5 ── Line scale reveals ────────────────────────────────────── */
      gsap.utils.toArray('.gsap-line').forEach(el => {
        gsap.from(el, {
          scaleX: 0, transformOrigin: 'left',
          duration: 1.3, ease: 'power4.out',
          scrollTrigger: { trigger: el, start: 'top 90%' },
        })
      })

      /* 6 ── Parallax glows ────────────────────────────────────────── */
      gsap.utils.toArray('.parallax-slow').forEach(el => {
        gsap.to(el, {
          y: -90, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        })
      })
      gsap.utils.toArray('.parallax-fast').forEach(el => {
        gsap.to(el, {
          y: -170, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        })
      })

    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef}
      style={{ background: '#050510', color: 'white', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>
      <Navbar onEnter={onEnter} />

      {/* ═══════════════════════════════════════════════════════════════
          HERO — pinned with scroll-driven animations
      ═══════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen overflow-hidden">
        {/* Three.js canvas */}
        <div className="absolute inset-0 z-0">
          <SceneBoundary>
            <Suspense fallback={null}><ThreeScene /></Suspense>
          </SceneBoundary>
        </div>
        {/* Gradient overlays */}
        <div className="absolute inset-0 z-[1] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 65% at 20% 55%, rgba(76,29,149,0.3) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 inset-x-0 h-52 z-[1] pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #050510)' }} />

        {/* Content wrapper (fades out on scroll end) */}
        <div ref={heroContentRef}
          className="relative z-10 min-h-screen flex flex-col justify-center px-6 lg:px-20 pt-24 pb-20">
          <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            {/* ── Text ── */}
            <div className="flex-1">
              {/* Badge */}
              <div className="hero-sub inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-10 text-xs font-bold"
                style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)', color: '#c4b5fd' }}>
                <Sparkles className="w-3 h-3" />
                AI-Powered Tax Platform for Indian MSMEs
              </div>

              {/* Giant headline — each line wrapped for clip animation */}
              <div className="mb-10">
                <div className="overflow-hidden">
                  <div className="hero-line font-black"
                    style={{ fontSize: 'clamp(4rem,10vw,9.5rem)', letterSpacing: '-0.04em', lineHeight: 0.92, color: 'white' }}>
                    Tax Filing,
                  </div>
                </div>
                <div className="overflow-hidden">
                  <div className="hero-line font-black"
                    style={{
                      fontSize: 'clamp(4rem,10vw,9.5rem)', letterSpacing: '-0.04em', lineHeight: 0.92,
                      background: 'linear-gradient(120deg, #a78bfa, #818cf8, #38bdf8)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                    Simplified.
                  </div>
                </div>
              </div>

              {/* Subtitle */}
              <p className="hero-sub text-lg text-white/50 leading-relaxed mb-10 max-w-lg">
                One AI-powered platform for GST, invoices, accounting, payroll &amp; income tax.
                Built for 42,000+ Indian MSMEs who deserve better tools.
              </p>

              {/* CTAs */}
              <div className="hero-cta flex flex-col sm:flex-row gap-4 mb-10">
                <button onClick={onEnter}
                  className="group relative overflow-hidden flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 0 40px rgba(124,58,237,0.5), 0 4px 24px rgba(0,0,0,0.4)' }}>
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }} />
                  <Zap className="relative w-4 h-4" />
                  <span className="relative">Get Started Free</span>
                  <ArrowRight className="relative w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base font-semibold text-white/80 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <Play className="w-3 h-3 fill-white ml-0.5" />
                  </span>
                  Watch Demo
                </button>
              </div>

              {/* Trust */}
              <div className="hero-sub flex flex-wrap gap-5">
                {['GSTN Compliant', 'Bank-grade AES-256', 'No credit card'].map(t => (
                  <span key={t} className="flex items-center gap-1.5 text-xs text-white/35">
                    <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />{t}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Floating cards ── */}
            <div className="hero-cards relative w-full max-w-[420px] h-[400px] hidden lg:block flex-shrink-0">
              {[
                { comp: <LiveGSTCard />,  cls: 'top-0 left-0',    delay: 0,   r: [-2, 0] },
                { comp: <InvoiceCard />,  cls: 'top-4 right-0',   delay: 1.2, r: [3, 5] },
                { comp: <MiniChartCard />,cls: 'bottom-16 left-8', delay: 2,  r: [-1, 1] },
                { comp: <AIBadge />,      cls: 'bottom-0 right-8', delay: 0.6, r: [1, 3] },
              ].map(({ comp, cls, delay, r }, i) => (
                <motion.div key={i} className={`absolute ${cls}`}
                  animate={{ y: [0, -12, 0], rotate: [r[0], r[1], r[0]] }}
                  transition={{ duration: 5 + delay, repeat: Infinity, ease: 'easeInOut', delay }}>
                  {comp}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Scroll line */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-white/20">Scroll</span>
            <motion.div className="w-px bg-gradient-to-b from-white/30 to-transparent"
              animate={{ height: [12, 40, 12] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          MARQUEE 1
      ═══════════════════════════════════════════════════════════════ */}
      <div className="py-5 border-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <Marquee items={['GST Filing', 'E-Invoicing', 'Income Tax', 'Bank Sync', 'AI Accounting', 'Compliance', 'Payroll', 'Smart Analytics', 'Cash Flow']} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          STATEMENT
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-36 px-6 lg:px-20 relative overflow-hidden">
        <div className="parallax-slow absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(109,40,217,0.1), transparent)' }} />
        <div className="max-w-5xl mx-auto">
          <p className="gsap-reveal text-xs font-bold uppercase tracking-[0.3em] mb-8"
            style={{ color: 'rgba(255,255,255,0.22)' }}>What we do</p>
          <SplitHeading
            text="One platform. Every tax need covered."
            className="font-black text-white leading-[1.0] mb-8"
          />
          <div className="gsap-line h-px w-28 mb-10"
            style={{ background: 'linear-gradient(to right, rgba(139,92,246,0.7), transparent)' }} />
          <p className="gsap-reveal text-lg leading-relaxed max-w-2xl"
            style={{ color: 'rgba(255,255,255,0.38)', fontSize: 'clamp(1rem,1.2vw,1.2rem)' }}>
            TaxCalm unifies GST, invoicing, accounting, income tax and compliance into a single
            AI-driven workspace — so 42,000+ Indian MSMEs can focus on growing, not filing.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          HORIZONTAL SCROLL — 4 feature panels
      ═══════════════════════════════════════════════════════════════ */}
      <section ref={hScrollRef} style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
        <div ref={hStripRef} className="flex h-full"
          style={{ width: `${features.length * 100}vw` }}>
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <div key={f.tag} className="relative flex items-center justify-center px-8 lg:px-24 h-full flex-shrink-0"
                style={{ width: '100vw', background: i % 2 === 0 ? '#050510' : '#07071c' }}>
                {/* Panel glow */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse 60% 60% at 65% 50%, ${f.glow} 0%, transparent 70%)` }} />

                <div className="relative z-10 max-w-6xl w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
                  {/* Left */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-8">
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${f.grad} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-[0.22em]"
                        style={{ color: 'rgba(255,255,255,0.35)' }}>{f.tag}</span>
                      <span className="ml-auto font-black"
                        style={{ fontSize: '5rem', color: 'rgba(255,255,255,0.04)', lineHeight: 1 }}>{f.num}</span>
                    </div>
                    {/* Title */}
                    <div style={{ fontSize: 'clamp(3rem,5.5vw,5rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.95, color: 'white', marginBottom: '0.4rem' }}>
                      {f.title}
                    </div>
                    <div style={{ fontSize: 'clamp(3rem,5.5vw,5rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.95, marginBottom: '2rem' }}>
                      <span style={{
                        background: `linear-gradient(120deg, ${f.color}, white)`,
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      }}>{f.sub}</span>
                    </div>
                    <div className="h-px w-16 mb-6" style={{ background: f.color }} />
                    <p className="text-base leading-relaxed mb-8 max-w-md"
                      style={{ color: 'rgba(255,255,255,0.38)' }}>{f.body}</p>
                    <ul className="space-y-3">
                      {f.bullets.map(b => (
                        <li key={b} className="flex items-center gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                          <span className={`w-5 h-5 rounded-full bg-gradient-to-br ${f.grad} flex items-center justify-center flex-shrink-0`}>
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Right visual */}
                  <div className="flex-shrink-0">
                    <FeatureVisual f={f} index={i} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="absolute bottom-8 right-12 z-20 text-xs font-bold uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.18)' }}>Scroll to explore →</div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          MARQUEE 2 (reverse)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="py-5 border-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <Marquee reverse items={['GSTR-1', 'GSTR-3B', 'ITR Filing', 'E-Invoice', 'TDS', 'Payroll', 'Balance Sheet', 'Cash Flow Forecast']} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          TRUST STATS
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-36 px-6 lg:px-20 relative overflow-hidden">
        <div className="parallax-fast absolute -right-40 -top-20 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(76,29,149,0.13), transparent)' }} />
        <div className="max-w-5xl mx-auto">
          <p className="gsap-reveal text-xs font-bold uppercase tracking-[0.3em] mb-4"
            style={{ color: 'rgba(255,255,255,0.22)' }}>Trusted by Indian MSMEs</p>
          <SplitHeading text="Numbers that speak." className="font-black text-white leading-tight mb-16" />
          <div className="grid grid-cols-1 sm:grid-cols-3 rounded-3xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            {trustStats.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={s.label} className="clip-reveal p-12 text-center"
                  style={{ background: 'rgba(255,255,255,0.02)', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                  <div className={`w-12 h-12 mx-auto mb-5 rounded-2xl bg-gradient-to-br ${s.grad} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-5xl font-black text-white mb-2">
                    <Counter to={s.value} suffix={s.suffix} />
                  </p>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ICON GRID
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 lg:px-20">
        <div className="max-w-5xl mx-auto">
          <p className="gsap-reveal text-center text-xs font-bold uppercase tracking-[0.3em] mb-12"
            style={{ color: 'rgba(255,255,255,0.22)' }}>Everything in one platform</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Percent,      label: 'GST Filing',  grad: 'from-violet-500 to-purple-700' },
              { icon: FileText,     label: 'E-Invoicing', grad: 'from-blue-500 to-cyan-600' },
              { icon: BarChart3,    label: 'Accounting',  grad: 'from-emerald-500 to-teal-600' },
              { icon: IndianRupee,  label: 'Income Tax',  grad: 'from-amber-500 to-orange-600' },
              { icon: Layers,       label: 'Payroll',     grad: 'from-pink-500 to-rose-600' },
              { icon: BrainCircuit, label: 'AI Assistant',grad: 'from-fuchsia-500 to-purple-700' },
              { icon: ShieldCheck,  label: 'Compliance',  grad: 'from-teal-500 to-green-600' },
              { icon: TrendingUp,   label: 'Analytics',   grad: 'from-indigo-500 to-blue-600' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="clip-reveal">
                  <GlassCard className="flex flex-col items-center gap-3 p-5 cursor-default group">
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.grad} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-white/60 group-hover:text-white/90 transition-colors">{item.label}</span>
                  </GlassCard>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CTA
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-44 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(109,40,217,0.22) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="gsap-reveal inline-block mb-8 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
            style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#c4b5fd' }}>
            Free to start &middot; No credit card
          </div>
          <SplitHeading
            text="Take control of your taxes with TaxCalm."
            className="font-black text-white leading-[1.0] mb-6"
          />
          <p className="gsap-reveal text-lg mb-12 max-w-xl mx-auto"
            style={{ color: 'rgba(255,255,255,0.38)' }}>
            Join 42,000+ Indian MSMEs who file GST, manage invoices, and grow with confidence.
          </p>
          <div className="gsap-reveal flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={onEnter}
              className="group relative overflow-hidden flex items-center justify-center gap-2.5 px-10 py-4 rounded-2xl text-base font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 0 50px rgba(124,58,237,0.5)' }}>
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }} />
              <Zap className="relative w-4 h-4" />
              <span className="relative">Start Free</span>
              <ArrowRight className="relative w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="flex items-center justify-center gap-2.5 px-10 py-4 rounded-2xl text-base font-semibold text-white/60 hover:text-white/90 transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Play className="w-4 h-4" /> Book a Demo
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════ */}
      <footer className="py-8 px-6 lg:px-20 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-black text-white/80">TaxCalm</span>
          <span className="text-xs text-white/25 ml-1">&copy; 2026 &middot; Built for Indian MSMEs</span>
        </div>
        <div className="flex gap-6">
          {['Privacy', 'Terms', 'Help', 'Blog'].map(l => (
            <a key={l} href="#" className="text-xs text-white/25 hover:text-white/60 transition-colors">{l}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}

/* ── Feature card visuals ─────────────────────────────────────────────────── */
function FeatureVisual({ f, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const Icon = f.icon

  if (index === 0) {
    const rows = [
      { label: 'Taxable Amount', val: '\u20B91,00,000', cls: 'text-white/80' },
      { label: 'CGST (9%)',      val: '\u20B99,000',    cls: 'text-violet-400' },
      { label: 'SGST (9%)',      val: '\u20B99,000',    cls: 'text-violet-400' },
      { label: 'Total GST',      val: '\u20B918,000',   cls: 'text-purple-300 font-bold' },
      { label: 'Invoice Total',  val: '\u20B91,18,000', cls: 'text-white font-bold' },
    ]
    return (
      <GlassCard className="p-6 w-full max-w-sm" ref={ref} hover>
        <div className="flex items-center gap-2 mb-5">
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${f.grad} flex items-center justify-center`}><Icon className="w-4 h-4 text-white" /></div>
          <span className="font-bold text-white/80 text-sm">GST Calculator</span>
          <span className="ml-auto text-[11px] font-bold text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded-full border border-violet-400/20">18% slab</span>
        </div>
        {rows.map((r, i) => (
          <motion.div key={r.label}
            initial={{ opacity: 0, x: -12 }} animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.45, delay: 0.1 + i * 0.09, ease: EASE }}
            className="flex justify-between items-center py-2.5 border-b last:border-0"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <span className="text-xs text-white/35">{r.label}</span>
            <span className={`text-sm ${r.cls}`}>{r.val}</span>
          </motion.div>
        ))}
      </GlassCard>
    )
  }

  if (index === 1) {
    return (
      <GlassCard className="p-6 w-full max-w-sm" hover>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${f.grad} flex items-center justify-center`}><Icon className="w-4 h-4 text-white" /></div>
            <div>
              <p className="text-sm font-bold text-white/80">Tax Invoice</p>
              <p className="text-xs text-blue-400 font-mono">INV-2026-0847</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">Paid</span>
        </div>
        {[['Consulting Services', '\u20B975,000'], ['Cloud Infrastructure', '\u20B925,000']].map(([item, amt]) => (
          <div key={item} className="flex justify-between text-sm py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <span className="text-white/40">{item}</span>
            <span className="text-white/70 font-medium">{amt}</span>
          </div>
        ))}
        <div className="mt-4 rounded-xl p-3 flex justify-between items-center"
          style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <span className="text-sm font-semibold text-white/60">Total (incl. GST 18%)</span>
          <span className="text-base font-black text-blue-400">\u20B91,18,000</span>
        </div>
      </GlassCard>
    )
  }

  if (index === 2) {
    const bars = [{ v: 72, l: 'O' }, { v: 85, l: 'N' }, { v: 68, l: 'D' }, { v: 91, l: 'J' }, { v: 78, l: 'F' }, { v: 96, l: 'M' }]
    return (
      <GlassCard className="p-6 w-full max-w-sm" ref={ref} hover>
        <div className="flex items-center gap-2 mb-5">
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${f.grad} flex items-center justify-center`}><Icon className="w-4 h-4 text-white" /></div>
          <span className="font-bold text-white/80 text-sm">P&amp;L Overview</span>
          <span className="ml-auto text-emerald-400 text-xs font-bold bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">+18%</span>
        </div>
        <div className="flex items-end gap-2 h-28">
          {bars.map((b, i) => (
            <div key={b.l} className="flex-1 flex flex-col items-center justify-end gap-0.5 h-full">
              <motion.div className="w-full rounded-t"
                style={{ background: i === 5 ? 'linear-gradient(to top, #7c3aed, #a78bfa)' : 'rgba(255,255,255,0.12)' }}
                initial={{ height: 0 }} animate={inView ? { height: `${b.v}%` } : {}}
                transition={{ duration: 0.7, delay: 0.06 * i, ease: EASE }} />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {bars.map(b => <span key={b.l} className="flex-1 text-center text-[10px] text-white/25">{b.l}</span>)}
        </div>
      </GlassCard>
    )
  }

  if (index === 3) {
    const slabs = [
      { range: 'Up to \u20B93L',              rate: '0%',  active: false },
      { range: '\u20B93L \u2013 \u20B97L',    rate: '5%',  active: false },
      { range: '\u20B97L \u2013 \u20B910L',   rate: '10%', active: true  },
      { range: '\u20B910L \u2013 \u20B912L',  rate: '15%', active: false },
    ]
    return (
      <GlassCard className="p-6 w-full max-w-sm" ref={ref} hover>
        <div className="flex items-center gap-2 mb-5">
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${f.grad} flex items-center justify-center`}><Icon className="w-4 h-4 text-white" /></div>
          <span className="font-bold text-white/80 text-sm">Tax Slab</span>
          <span className="ml-auto text-amber-400 text-[11px] font-bold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">FY 2025-26</span>
        </div>
        {slabs.map((s, i) => (
          <motion.div key={s.range}
            initial={{ opacity: 0, x: -10 }} animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.1 + i * 0.09, ease: EASE }}
            className="flex items-center justify-between p-2.5 rounded-xl mb-2 text-sm"
            style={s.active
              ? { background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }
              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span className={s.active ? 'text-amber-400 font-bold text-xs' : 'text-white/40 text-xs'}>{s.range}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.active ? 'bg-amber-400/20 text-amber-300' : 'bg-white/5 text-white/30'}`}>{s.rate}</span>
          </motion.div>
        ))}
        <div className="rounded-xl p-3 flex justify-between"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <span className="text-sm font-semibold text-white/60">Total Liability</span>
          <span className="text-sm font-black text-amber-400">\u20B980,000</span>
        </div>
      </GlassCard>
    )
  }

  return null
}
