import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Building2, Shield, Bell, Palette,
  Camera, Save, Eye, EyeOff, Check,
  Smartphone, Mail, MapPin, Hash, CreditCard,
  Globe, ChevronRight, AlertCircle, LogOut,
  Lock, KeyRound, ToggleLeft, ToggleRight,
  BadgeCheck, Zap,
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext.jsx'
import { useToast } from '../contexts/ToastContext.jsx'

// ── Helpers ───────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'taxcalm_profile'

function loadProfile() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch { return {} }
}
function saveProfile(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

const defaults = {
  // Personal
  firstName: 'Arjun',
  lastName: 'Sharma',
  email: 'arjun@taxcalm.in',
  phone: '+91 98765 43210',
  bio: 'MSME owner · Textile exports',
  avatar: null,
  // Business
  businessName: 'Sharma Textiles Pvt Ltd',
  gstin: '27AABCS1429B1ZB',
  pan: 'AABCS1429B',
  udyam: 'UDYAM-MH-12-0012345',
  businessType: 'Private Limited',
  industry: 'Textiles & Apparel',
  turnover: '₹25–75 Lakhs',
  address: '14B, MIDC Industrial Area, Nagpur, Maharashtra – 440018',
  // Security
  twoFA: false,
  sessionAlerts: true,
  loginAlerts: true,
  // Notifications
  emailDigest: true,
  smsAlerts: true,
  filingReminders: true,
  schemeAlerts: true,
  priceUpdates: false,
  // Preferences
  language: 'English',
  currency: 'INR (₹)',
  fiscalYear: 'April – March',
  dateFormat: 'DD/MM/YYYY',
  timezone: 'IST (UTC+5:30)',
}

const TABS = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'business',      label: 'Business',      icon: Building2 },
  { id: 'security',      label: 'Security',      icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'preferences',   label: 'Preferences',   icon: Palette },
]

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.04, ease: 'easeOut' } }),
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--tc-text-2)' }}>
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] mt-1" style={{ color: 'var(--tc-text-4)' }}>{hint}</p>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text', readOnly, icon: Icon }) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
          style={{ color: 'var(--tc-text-4)' }} />
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none transition-all"
        style={{
          paddingLeft: Icon ? '2.25rem' : undefined,
          background: readOnly ? 'var(--tc-card-bg)' : 'var(--tc-input-bg)',
          border: '1px solid var(--tc-input-border)',
          color: readOnly ? 'var(--tc-text-3)' : 'var(--tc-text-1)',
          cursor: readOnly ? 'not-allowed' : undefined,
        }}
        onFocus={e => !readOnly && (e.target.style.borderColor = 'var(--tc-acc-border)')}
        onBlur={e => (e.target.style.borderColor = 'var(--tc-input-border)')}
      />
    </div>
  )
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none transition-all appearance-none"
      style={{
        background: 'var(--tc-input-bg)',
        border: '1px solid var(--tc-input-border)',
        color: 'var(--tc-text-1)',
      }}
      onFocus={e => (e.target.style.borderColor = 'var(--tc-acc-border)')}
      onBlur={e => (e.target.style.borderColor = 'var(--tc-input-border)')}
    >
      {options.map(o => <option key={o} value={o} style={{ background: '#0f0f1f' }}>{o}</option>)}
    </select>
  )
}

function Toggle({ value, onChange, label, sub }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--tc-divider)' }}>
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--tc-text-1)' }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>{sub}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative flex-shrink-0 w-11 h-6 rounded-full transition-all duration-200"
        style={{ background: value ? 'var(--tc-logo-grad)' : 'var(--tc-btn-micro)' }}
      >
        <span
          className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200"
          style={{ left: value ? 'calc(100% - 1.25rem)' : '0.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
        />
      </button>
    </div>
  )
}

function SaveBar({ dirty, onSave, saving, saved }) {
  if (!dirty && !saved) return null
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
        style={{ background: 'var(--tc-notif-bg)', border: '1px solid var(--tc-acc-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
      >
        {saved ? (
          <span className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
            <Check className="w-4 h-4" /> Saved successfully
          </span>
        ) : (
          <>
            <span className="text-sm" style={{ color: 'var(--tc-text-2)' }}>You have unsaved changes</span>
            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

// ── Tab panes ─────────────────────────────────────────────────────────────────
function ProfileTab({ data, onChange }) {
  const fileRef = useRef()
  const initials = `${data.firstName?.[0] ?? ''}${data.lastName?.[0] ?? ''}`.toUpperCase() || 'A'

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <motion.div variants={fadeUp} className="flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white overflow-hidden"
            style={{ background: data.avatar ? undefined : 'linear-gradient(135deg,#7c3aed,#a855f7)' }}
          >
            {data.avatar
              ? <img src={data.avatar} alt="avatar" className="w-full h-full object-cover" />
              : initials}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-2 -right-2 w-7 h-7 rounded-xl flex items-center justify-center transition-opacity hover:opacity-80"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', border: '2px solid #080814' }}
          >
            <Camera className="w-3.5 h-3.5 text-white" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = ev => onChange('avatar', ev.target.result)
              reader.readAsDataURL(file)
            }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>{data.firstName} {data.lastName}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>{data.email}</p>
          <p className="text-[11px] mt-2 font-medium text-violet-400">Click the camera to change photo</p>
        </div>
      </motion.div>

      <div className="h-px" style={{ background: 'var(--tc-divider)' }} />

      {/* Name row */}
      <motion.div variants={fadeUp} custom={1} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First Name">
          <Input value={data.firstName} onChange={e => onChange('firstName', e.target.value)} placeholder="First name" />
        </Field>
        <Field label="Last Name">
          <Input value={data.lastName} onChange={e => onChange('lastName', e.target.value)} placeholder="Last name" />
        </Field>
      </motion.div>

      <motion.div variants={fadeUp} custom={2} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Email Address" hint="Used for login and notifications">
          <Input value={data.email} onChange={e => onChange('email', e.target.value)} placeholder="email@example.com" type="email" icon={Mail} />
        </Field>
        <Field label="Phone Number">
          <Input value={data.phone} onChange={e => onChange('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" icon={Smartphone} />
        </Field>
      </motion.div>

      <motion.div variants={fadeUp} custom={3}>
        <Field label="Bio / Role">
          <textarea
            value={data.bio}
            onChange={e => onChange('bio', e.target.value)}
            rows={3}
            placeholder="Describe your role or business..."
            className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none transition-all resize-none"
            style={{
              background: 'var(--tc-input-bg)',
              border: '1px solid var(--tc-input-border)',
              color: 'var(--tc-text-1)',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--tc-acc-border)')}
            onBlur={e => (e.target.style.borderColor = 'var(--tc-input-border)')}
          />
        </Field>
      </motion.div>

      {/* Account info */}
      <motion.div variants={fadeUp} custom={4}
        className="rounded-2xl p-4 space-y-3"
        style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--tc-text-4)' }}>Account Info</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Plan', value: 'Free Tier', badge: 'Upgrade', badgeViolet: true },
            { label: 'Member Since', value: 'Jan 2025' },
            { label: 'Account Status', value: 'Active', badge: 'Verified', green: true },
          ].map(item => (
            <div key={item.label} className="rounded-xl p-3" style={{ background: 'var(--tc-btn-micro)' }}>
              <p className="text-[11px] font-medium mb-1" style={{ color: 'var(--tc-text-3)' }}>{item.label}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-white">{item.value}</p>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={item.badgeViolet
                      ? { background: 'rgba(124,58,237,0.2)', color: '#a78bfa' }
                      : { background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
                    {item.green && <Check className="w-2.5 h-2.5 inline mr-0.5" />}
                    {item.badge}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function BusinessTab({ data, onChange }) {
  return (
    <div className="space-y-5">
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Business / Company Name">
          <Input value={data.businessName} onChange={e => onChange('businessName', e.target.value)} placeholder="Your business name" icon={Building2} />
        </Field>
        <Field label="Business Type">
          <Select value={data.businessType} onChange={e => onChange('businessType', e.target.value)}
            options={['Sole Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'Public Limited', 'OPC', 'Trust / NGO']} />
        </Field>
      </motion.div>

      <motion.div variants={fadeUp} custom={1} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="GSTIN" hint="15-character GST Identification Number">
          <Input value={data.gstin} onChange={e => onChange('gstin', e.target.value.toUpperCase().slice(0, 15))}
            placeholder="e.g. 27AABCS1429B1ZB" icon={Hash} />
        </Field>
        <Field label="PAN Number" hint="10-character Permanent Account Number">
          <Input value={data.pan} onChange={e => onChange('pan', e.target.value.toUpperCase().slice(0, 10))}
            placeholder="e.g. AABCS1429B" icon={CreditCard} />
        </Field>
      </motion.div>

      <motion.div variants={fadeUp} custom={2} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Udyam Registration No." hint="For MSME benefits & schemes">
          <Input value={data.udyam} onChange={e => onChange('udyam', e.target.value.toUpperCase())}
            placeholder="UDYAM-MH-XX-XXXXXXX" icon={BadgeCheck} />
        </Field>
        <Field label="Industry / Sector">
          <Select value={data.industry} onChange={e => onChange('industry', e.target.value)}
            options={['Agriculture & Allied', 'Textiles & Apparel', 'Food Processing', 'Manufacturing', 'IT & Software', 'Trading & Retail', 'Construction', 'Healthcare', 'Education', 'Logistics', 'Other']} />
        </Field>
      </motion.div>

      <motion.div variants={fadeUp} custom={3}>
        <Field label="Annual Turnover Range">
          <Select value={data.turnover} onChange={e => onChange('turnover', e.target.value)}
            options={['Below ₹20 Lakhs', '₹20–40 Lakhs', '₹40–75 Lakhs', '₹75 L – 1 Cr', '₹1–5 Crore', '₹5–25 Crore', 'Above ₹25 Crore']} />
        </Field>
      </motion.div>

      <motion.div variants={fadeUp} custom={4}>
        <Field label="Business Address">
          <textarea
            value={data.address}
            onChange={e => onChange('address', e.target.value)}
            rows={3}
            placeholder="Full address with PIN code..."
            className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none transition-all resize-none"
            style={{ background: 'var(--tc-input-bg)', border: '1px solid var(--tc-input-border)', color: 'var(--tc-text-1)' }}
            onFocus={e => (e.target.style.borderColor = 'var(--tc-acc-border)')}
            onBlur={e => (e.target.style.borderColor = 'var(--tc-input-border)')}
          />
        </Field>
      </motion.div>

      {/* GSTIN validity indicator */}
      <motion.div variants={fadeUp} custom={5}
        className="flex items-start gap-3 rounded-xl p-3.5"
        style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)' }}>
        <BadgeCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-emerald-400">GSTIN Verified</p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--tc-text-3)' }}>
            Your GSTIN is active and matches the registered business name.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

function SecurityTab({ data, onChange }) {
  const showToast = useToast()
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false })
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [sessions, setSessions] = useState([
    { device: 'Chrome · Windows 11', location: 'Nagpur, MH', time: 'Active now', current: true },
    { device: 'Safari · iPhone 15',   location: 'Nagpur, MH', time: '2 hours ago', current: false },
    { device: 'Chrome · MacBook Air', location: 'Mumbai, MH', time: '3 days ago', current: false },
  ])

  const handleChangePassword = () => {
    if (!passwords.current) return setPwError('Enter your current password.')
    if (passwords.new.length < 8) return setPwError('New password must be at least 8 characters.')
    if (passwords.new !== passwords.confirm) return setPwError('Passwords do not match.')
    setPwError('')
    setPwSuccess(true)
    setPasswords({ current: '', new: '', confirm: '' })
    setTimeout(() => setPwSuccess(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Password */}
      <motion.div variants={fadeUp}
        className="rounded-2xl p-5 space-y-4"
        style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="w-4 h-4" style={{ color: 'var(--tc-accent)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>Change Password</h3>
        </div>

        {['current', 'new', 'confirm'].map((field, i) => (
          <Field key={field} label={field === 'current' ? 'Current Password' : field === 'new' ? 'New Password' : 'Confirm New Password'}>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                style={{ color: 'var(--tc-text-4)' }} />
              <input
                type={showPass[field] ? 'text' : 'password'}
                value={passwords[field]}
                onChange={e => setPasswords(p => ({ ...p, [field]: e.target.value }))}
                placeholder={field === 'current' ? '••••••••' : field === 'new' ? 'Min. 8 characters' : 'Repeat new password'}
                className="w-full text-sm rounded-xl pl-8 pr-10 py-2.5 focus:outline-none transition-all"
                style={{ background: 'var(--tc-input-bg)', border: '1px solid var(--tc-input-border)', color: 'var(--tc-text-1)' }}
                onFocus={e => (e.target.style.borderColor = 'var(--tc-acc-border)')}
                onBlur={e => (e.target.style.borderColor = 'var(--tc-input-border)')}
              />
              <button onClick={() => setShowPass(p => ({ ...p, [field]: !p[field] }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                style={{ color: 'var(--tc-text-3)' }}>
                {showPass[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
        ))}

        {pwError && (
          <div className="flex items-center gap-2 text-xs text-red-400">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {pwError}
          </div>
        )}
        {pwSuccess && (
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <Check className="w-3.5 h-3.5 flex-shrink-0" /> Password updated successfully.
          </div>
        )}

        <button
          onClick={handleChangePassword}
          className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-85"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}
        >
          Update Password
        </button>
      </motion.div>

      {/* 2FA + Alerts */}
      <motion.div variants={fadeUp} custom={1}
        className="rounded-2xl p-5"
        style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4" style={{ color: 'var(--tc-accent)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>Security Settings</h3>
        </div>
        <Toggle value={data.twoFA} onChange={v => onChange('twoFA', v)}
          label="Two-Factor Authentication"
          sub="Require OTP via SMS or TOTP app on each login" />
        <Toggle value={data.sessionAlerts} onChange={v => onChange('sessionAlerts', v)}
          label="Session Activity Alerts"
          sub="Get notified when a new session is created" />
        <Toggle value={data.loginAlerts} onChange={v => onChange('loginAlerts', v)}
          label="Failed Login Alerts"
          sub="Email alert on failed login attempts" />
      </motion.div>

      {/* Active sessions */}
      <motion.div variants={fadeUp} custom={2}
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--tc-divider)' }}>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" style={{ color: 'var(--tc-accent)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>Active Sessions</h3>
          </div>
          <button onClick={() => { setSessions(prev => prev.filter(s => s.current)); showToast('All other sessions revoked', 'success') }} className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors">
            Revoke all others
          </button>
        </div>
        {sessions.map((s, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5"
            style={{ borderBottom: i < sessions.length - 1 ? '1px solid var(--tc-divider)' : 'none' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: s.current ? 'var(--tc-acc-bg)' : 'var(--tc-btn-micro)' }}>
              <Globe className="w-4 h-4" style={{ color: s.current ? 'var(--tc-accent)' : 'var(--tc-text-3)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--tc-text-1)' }}>{s.device}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--tc-text-3)' }}>
                {s.location} · {s.time}
              </p>
            </div>
            {s.current
              ? <span className="text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(52,211,153,0.1)' }}>This device</span>
              : <button onClick={() => { setSessions(prev => prev.filter((_, j) => j !== i)); showToast('Session revoked', 'success') }} className="text-[11px] font-semibold text-red-400 hover:text-red-300 transition-colors">Revoke</button>
            }
          </div>
        ))}
      </motion.div>

      {/* Danger zone */}
      <motion.div variants={fadeUp} custom={3}
        className="rounded-2xl p-5"
        style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
        <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-3">Danger Zone</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>Delete Account</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>Permanently delete your account and all data</p>
          </div>
          <button onClick={() => showToast('Account deletion requires email confirmation. A verification link will be sent to your registered email.', 'error')} className="text-xs font-semibold px-3 py-1.5 rounded-xl text-red-400 transition-all"
            style={{ border: '1px solid rgba(239,68,68,0.3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function NotificationsTab({ data, onChange }) {
  const groups = [
    {
      title: 'Communication',
      icon: Mail,
      items: [
        { key: 'emailDigest', label: 'Weekly Email Digest', sub: 'Summary of GST activity, deadlines and news' },
        { key: 'smsAlerts', label: 'SMS Alerts', sub: 'Critical filing reminders via SMS' },
      ],
    },
    {
      title: 'Compliance',
      icon: Shield,
      items: [
        { key: 'filingReminders', label: 'Filing Deadline Reminders', sub: '7 days and 1 day before each due date' },
      ],
    },
    {
      title: 'Updates',
      icon: Bell,
      items: [
        { key: 'schemeAlerts', label: 'New Scheme Alerts', sub: 'Government schemes matching your business profile' },
        { key: 'priceUpdates', label: 'GST Rate Change Alerts', sub: 'Notifications when GST rates change for your industry' },
      ],
    },
  ]

  return (
    <div className="space-y-5">
      {groups.map((group, gi) => {
        const Icon = group.icon
        return (
          <motion.div key={group.title} variants={fadeUp} custom={gi}
            className="rounded-2xl p-5"
            style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4" style={{ color: 'var(--tc-accent)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>{group.title}</h3>
            </div>
            {group.items.map(item => (
              <Toggle key={item.key} value={data[item.key]} onChange={v => onChange(item.key, v)}
                label={item.label} sub={item.sub} />
            ))}
          </motion.div>
        )
      })}
    </div>
  )
}

function PreferencesTab({ data, onChange }) {
  const showToast = useToast()
  const prefs = [
    { key: 'language',   label: 'Language',       icon: Globe,     options: ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Gujarati', 'Bengali'] },
    { key: 'currency',   label: 'Currency',        icon: CreditCard, options: ['INR (₹)', 'USD ($)', 'EUR (€)'] },
    { key: 'fiscalYear', label: 'Fiscal Year',     icon: Hash,      options: ['April – March', 'January – December'] },
    { key: 'dateFormat', label: 'Date Format',     icon: Hash,      options: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] },
    { key: 'timezone',   label: 'Timezone',        icon: Globe,     options: ['IST (UTC+5:30)', 'UTC', 'GST (UTC+4)', 'EST (UTC-5)'] },
  ]

  return (
    <div className="space-y-5">
      <motion.div variants={fadeUp}
        className="rounded-2xl p-5 space-y-4"
        style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Palette className="w-4 h-4" style={{ color: 'var(--tc-accent)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>Regional &amp; Display</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prefs.map((pref, i) => (
            <motion.div key={pref.key} variants={fadeUp} custom={i}>
              <Field label={pref.label}>
                <Select value={data[pref.key]} onChange={e => onChange(pref.key, e.target.value)} options={pref.options} />
              </Field>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Theme card */}
      <ThemeCard />

      {/* Upgrade CTA */}
      <motion.div variants={fadeUp} custom={6}
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(91,33,182,0.25))', border: '1px solid rgba(124,58,237,0.3)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(124,58,237,0.3)' }}>
          <Zap className="w-5 h-5 text-violet-300" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: 'var(--tc-text-1)' }}>Upgrade to TaxCalm Pro</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-2)' }}>AI auto-filing, bank sync, CA connect &amp; more</p>
        </div>
        <button
          onClick={() => showToast('TaxCalm Pro is coming soon — AI auto-filing, bank sync & CA connect', 'info')}
          className="text-xs font-semibold px-4 py-2 rounded-xl text-white flex-shrink-0 transition-opacity hover:opacity-85"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}>
          Upgrade
        </button>
      </motion.div>
    </div>
  )
}

// ── Theme definitions ─────────────────────────────────────────────────────────
const THEMES = [
  { value: 'dark',  label: 'Dark',          swatch: '#080814',  border: '#1e1b4b' },
  { value: 'light', label: 'Light',         swatch: '#f8fafc',  border: '#e2e8f0' },
  { value: 'rose',  label: 'White & Rose',  swatch: 'linear-gradient(135deg,#FFD700 0%,#F43F5E 100%)', border: '#FECDD3' },
]

function ThemeCard() {
  const { themeName, setTheme } = useTheme()

  return (
    <motion.div variants={fadeUp} custom={5}
      className="rounded-2xl p-5"
      style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-4 h-4" style={{ color: 'var(--tc-accent)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>Appearance</h3>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {THEMES.map(theme => {
          const isActive = themeName === theme.value
          return (
            <div key={theme.value}
              onClick={() => setTheme(theme.value)}
              className="rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all"
              style={{
                background: isActive ? 'var(--tc-acc-bg)' : 'var(--tc-card-bg)',
                border: isActive ? '1px solid var(--tc-acc-border)' : '1px solid var(--tc-card-border)',
              }}>
              <div className="w-8 h-8 rounded-lg flex-shrink-0"
                style={{ background: theme.swatch, border: `1px solid ${theme.border}` }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--tc-text-1)' }}>{theme.label}</p>
                {isActive && <p className="text-[10px]" style={{ color: 'var(--tc-accent)' }}>Active</p>}
              </div>
              {isActive && <Check className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: 'var(--tc-accent)' }} />}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [data, setData] = useState(() => ({ ...defaults, ...loadProfile() }))
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const onChange = (key, value) => {
    setData(prev => ({ ...prev, [key]: value }))
    setDirty(true)
    setSaved(false)
  }

  const onSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    saveProfile(data)
    setSaving(false)
    setDirty(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const tabProps = { data, onChange }

  return (
    <div className="space-y-6 pb-24">
      {/* Page header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h2 className="text-base font-semibold" style={{ color: 'var(--tc-text-1)' }}>Profile &amp; Settings</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>
          Manage your personal info, business details, and preferences
        </p>
      </motion.div>

      {/* Tab bar */}
      <motion.div
        variants={fadeUp} custom={1} initial="hidden" animate="visible"
        className="flex items-center gap-1 p-1 rounded-2xl overflow-x-auto"
        style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0"
              style={isActive
                ? { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: 'white' }
                : { color: 'var(--tc-nav-inactive)' }}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </motion.div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {activeTab === 'profile'       && <ProfileTab       {...tabProps} />}
          {activeTab === 'business'      && <BusinessTab      {...tabProps} />}
          {activeTab === 'security'      && <SecurityTab      {...tabProps} />}
          {activeTab === 'notifications' && <NotificationsTab {...tabProps} />}
          {activeTab === 'preferences'   && <PreferencesTab   {...tabProps} />}
        </motion.div>
      </AnimatePresence>

      <SaveBar dirty={dirty} onSave={onSave} saving={saving} saved={saved} />
    </div>
  )
}
