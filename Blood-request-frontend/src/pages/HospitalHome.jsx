import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Activity,
  BadgeCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  Droplet,
  Edit3,
  FileClock,
  Globe,
  Hash,
  Hospital,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Siren,
  Trash2,
  Upload,
  UserRound,
  X,
} from 'lucide-react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { getHospitalProfile, isLoggedIn, updateHospitalProfile } from '../lib/auth'
import { getRequests, getStats } from '../lib/requests'
import { districts } from '../data/districts'
import FormField from '../components/FormField'

const EMPTY_FORM = {
  hospitalName: '',
  hospitalId: '',
  registrationNumber: '',
  hospitalType: 'Private',
  district: '',
  address: '',
  pincode: '',
  phone: '',
  emergencyContact: '',
  email: '',
  website: '',
  officerName: '',
  officerDesignation: '',
  officerContact: '',
  logo: '',
}

const LOGO_MAX_BYTES = 5 * 1024 * 1024
const LOGO_MAX_SIDE = 256

function fileToLogo(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file'))
      return
    }
    if (file.size > LOGO_MAX_BYTES) {
      reject(new Error('Image must be under 5 MB'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Invalid image file'))
      img.onload = () => {
        const scale = Math.min(1, LOGO_MAX_SIDE / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/png'))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

function initials(name) {
  if (!name) return 'H'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

function LogoAvatar({ logo, name, size = 'h-16 w-16 text-2xl' }) {
  if (logo) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white ring-4 ring-white/25 ${size}`}
      >
        <img src={logo} alt={`${name || 'Hospital'} logo`} className="h-full w-full object-cover" />
      </span>
    )
  }
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-white/15 font-bold ring-4 ring-white/25 ${size}`}
    >
      {initials(name)}
    </span>
  )
}

function LogoUploader({ value, onChange, name }) {
  const inputId = 'pf-logo-upload'

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const dataUrl = await fileToLogo(file)
      onChange(dataUrl)
      toast.success('Logo updated — save changes to apply')
    } catch (err) {
      toast.error(err?.message || 'Could not load the image')
    }
  }

  return (
    <div className="mb-5 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
      <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-xl font-bold text-red-600 dark:border-slate-700 dark:bg-slate-900 dark:text-red-400">
        {value ? (
          <img src={value} alt="Hospital logo preview" className="h-full w-full object-cover" />
        ) : (
          initials(name)
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900 dark:text-white">Hospital Logo</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          PNG or JPG • auto-resized to 256px • max 5 MB
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <label
            htmlFor={inputId}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            {value ? 'Replace' : 'Upload logo'}
          </label>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Remove
            </button>
          )}
        </div>
      </div>

      <input
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="sr-only"
        onChange={handleFile}
      />
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition duration-200 hover:border-red-200 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-red-900">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="break-words text-sm font-semibold text-slate-800 dark:text-slate-100">
          {value || '—'}
        </p>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, tone }) {
  const tones = {
    red: 'from-red-600 to-red-700 shadow-red-600/25',
    emerald: 'from-emerald-600 to-emerald-700 shadow-emerald-600/25',
    amber: 'from-amber-500 to-amber-600 shadow-amber-500/25',
    slate: 'from-slate-700 to-slate-800 shadow-slate-700/25',
  }
  return (
    <div
      className={`group flex items-center gap-4 rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg transition duration-200 hover:-translate-y-0.5 ${tones[tone]}`}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-2 ring-white/25 transition group-hover:scale-105">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="mt-1.5 text-xs font-medium text-white/85">{label}</p>
      </div>
    </div>
  )
}

function ActionCard({ icon: Icon, label, hint, to, onClick }) {
  const className =
    'group flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-red-900'
  const inner = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 transition group-hover:bg-red-600 group-hover:text-white dark:bg-red-950/60 dark:text-red-400">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-slate-900 dark:text-white">{label}</span>
        <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">{hint}</span>
      </span>
    </>
  )
  if (to) {
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  )
}

const DEFAULT_STATS = { total: 0, approved: 0, pending: 0, emergency: 0 }

export default function HospitalHome({ onLogout }) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const logged = isLoggedIn()

  const [profile, setProfile] = useState(() => getHospitalProfile())
  const [stats] = useState(() => getStats())
  const [recent] = useState(() => getRequests().slice(0, 4))
  const [editing, setEditing] = useState(() => searchParams.get('edit') === '1')
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, ...(getHospitalProfile() || {}) }))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editing !== (searchParams.get('edit') === '1')) {
      setSearchParams(editing ? { edit: '1' } : {}, { replace: true })
    }
  }, [editing, searchParams, setSearchParams])

  const display = useMemo(() => profile || {}, [profile])

  if (!logged) {
    return <Navigate to="/hospital/login" replace />
  }

  function startEdit() {
    setForm({ ...EMPTY_FORM, ...(profile || {}) })
    setErrors({})
    setEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function validate() {
    const next = {}
    if (!form.hospitalName.trim()) next.hospitalName = 'Hospital name is required'
    if (!form.email.trim()) next.email = 'Official email is required'
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email'
    if (form.phone && !/^[0-9]{10}$/.test(form.phone.trim()))
      next.phone = 'Enter a 10-digit number'
    if (form.emergencyContact && !/^[0-9]{10}$/.test(form.emergencyContact.trim()))
      next.emergencyContact = 'Enter a 10-digit number'
    if (form.officerContact && !/^[0-9]{10}$/.test(form.officerContact.trim()))
      next.officerContact = 'Enter a 10-digit number'
    if (form.pincode && !/^[0-9]{6}$/.test(form.pincode.trim()))
      next.pincode = 'PIN code must be 6 digits'
    if (form.website && !/^https?:\/\//i.test(form.website.trim()))
      next.website = 'Start with http:// or https://'
    return next
  }

  function handleSave(e) {
    e.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length) {
      toast.error(`Please fix ${Object.keys(next).length} field(s)`)
      return
    }
    setSaving(true)
    setTimeout(() => {
      const saved = updateHospitalProfile(form)
      setProfile(saved)
      setSaving(false)
      setEditing(false)
      toast.success('Profile updated successfully')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 600)
  }

  const statsList = [
    { key: 'total', icon: Droplet, label: 'Total Blood Requests', tone: 'red' },
    { key: 'approved', icon: CheckCircle2, label: 'Approved Requests', tone: 'emerald' },
    { key: 'pending', icon: Clock, label: 'Pending Requests', tone: 'amber' },
    { key: 'emergency', icon: Siren, label: 'Emergency Requests', tone: 'slate' },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      {/* ============ HEADER ============ */}
      <div className="card animate-fade-in-up overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 via-red-600 to-red-700 px-5 py-6 text-white sm:px-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <LogoAvatar logo={display.logo} name={display.hospitalName} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold sm:text-2xl">
                    {display.hospitalName || 'Hospital Profile'}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold ring-1 ring-white/25">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    {display.hospitalType || 'Hospital'}
                  </span>
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-red-100">
                  <span className="inline-flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5" aria-hidden="true" />
                    {display.hospitalId || '—'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {display.district || 'District not set'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <span className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/25">
                <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              {!editing && (
                <button
                  type="button"
                  onClick={startEdit}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-xs font-bold text-red-700 shadow-sm transition hover:bg-red-50"
                >
                  <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 px-5 py-4 sm:grid-cols-3 sm:px-7">
          <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span className="truncate">Reg. No: {display.registrationNumber || '—'}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
            <Phone className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
            <span className="truncate">{display.phone || 'No phone'}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
            <Mail className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
            <span className="truncate">{display.email || 'No email'}</span>
          </div>
        </div>
      </div>

      {editing ? (
        /* ============ EDIT PROFILE ============ */
        <form onSubmit={handleSave} noValidate className="card animate-fade-in-up p-5 sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm shadow-red-600/30">
                <Edit3 className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Edit Profile</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update hospital, contact and authorized officer details
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-red-300 hover:text-red-600 dark:border-slate-700"
              aria-label="Cancel editing"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Hospital Information */}
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <Building2 className="h-4 w-4 text-red-600" aria-hidden="true" />
            Hospital Information
          </p>
          <LogoUploader value={form.logo} onChange={(v) => setField('logo', v)} name={form.hospitalName} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Hospital Name" htmlFor="pf-name" required error={errors.hospitalName}>
              <input
                id="pf-name"
                value={form.hospitalName}
                onChange={(e) => setField('hospitalName', e.target.value)}
                className={`input-base ${errors.hospitalName ? 'input-error' : ''}`}
              />
            </FormField>
            <FormField label="Hospital ID" htmlFor="pf-id">
              <input
                id="pf-id"
                value={form.hospitalId}
                onChange={(e) => setField('hospitalId', e.target.value)}
                placeholder="e.g. HOSP-TN-0001"
                className="input-base"
              />
            </FormField>
            <FormField label="Registration Number" htmlFor="pf-reg">
              <input
                id="pf-reg"
                value={form.registrationNumber}
                onChange={(e) => setField('registrationNumber', e.target.value)}
                className="input-base"
              />
            </FormField>
            <FormField label="Hospital Type" htmlFor="pf-type">
              <select
                id="pf-type"
                value={form.hospitalType}
                onChange={(e) => setField('hospitalType', e.target.value)}
                className="input-base"
              >
                <option value="Government">Government</option>
                <option value="Private">Private</option>
              </select>
            </FormField>
            <FormField label="District" htmlFor="pf-district">
              <select
                id="pf-district"
                value={form.district}
                onChange={(e) => setField('district', e.target.value)}
                className="input-base"
              >
                <option value="">Select district</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.en}>
                    {d.en}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="PIN Code" htmlFor="pf-pin" error={errors.pincode}>
              <input
                id="pf-pin"
                value={form.pincode}
                onChange={(e) => setField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6 digits"
                className={`input-base ${errors.pincode ? 'input-error' : ''}`}
              />
            </FormField>
            <div className="sm:col-span-2 lg:col-span-3">
              <FormField label="Full Address" htmlFor="pf-address">
                <textarea
                  id="pf-address"
                  rows={2}
                  value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                  className="input-base resize-none"
                />
              </FormField>
            </div>
          </div>

          {/* Contact Information */}
          <p className="mb-3 mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <Phone className="h-4 w-4 text-red-600" aria-hidden="true" />
            Contact Information
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Hospital Phone" htmlFor="pf-phone" error={errors.phone}>
              <input
                id="pf-phone"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                className={`input-base ${errors.phone ? 'input-error' : ''}`}
              />
            </FormField>
            <FormField label="Emergency Contact (24×7)" htmlFor="pf-emg" error={errors.emergencyContact}>
              <input
                id="pf-emg"
                value={form.emergencyContact}
                onChange={(e) =>
                  setField('emergencyContact', e.target.value.replace(/\D/g, '').slice(0, 10))
                }
                className={`input-base ${errors.emergencyContact ? 'input-error' : ''}`}
              />
            </FormField>
            <FormField label="Official Email" htmlFor="pf-email" required error={errors.email}>
              <input
                id="pf-email"
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                className={`input-base ${errors.email ? 'input-error' : ''}`}
              />
            </FormField>
            <FormField label="Website (optional)" htmlFor="pf-web" error={errors.website}>
              <input
                id="pf-web"
                value={form.website}
                onChange={(e) => setField('website', e.target.value)}
                placeholder="https://..."
                className={`input-base ${errors.website ? 'input-error' : ''}`}
              />
            </FormField>
          </div>

          {/* Authorized Officer */}
          <p className="mb-3 mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <UserRound className="h-4 w-4 text-red-600" aria-hidden="true" />
            Authorized Officer
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Officer Name" htmlFor="pf-officer">
              <input
                id="pf-officer"
                value={form.officerName}
                onChange={(e) => setField('officerName', e.target.value)}
                className="input-base"
              />
            </FormField>
            <FormField label="Designation" htmlFor="pf-designation">
              <input
                id="pf-designation"
                value={form.officerDesignation}
                onChange={(e) => setField('officerDesignation', e.target.value)}
                placeholder="e.g. Medical Superintendent"
                className="input-base"
              />
            </FormField>
            <FormField label="Contact Number" htmlFor="pf-officer-contact" error={errors.officerContact}>
              <input
                id="pf-officer-contact"
                value={form.officerContact}
                onChange={(e) =>
                  setField('officerContact', e.target.value.replace(/\D/g, '').slice(0, 10))
                }
                className={`input-base ${errors.officerContact ? 'input-error' : ''}`}
              />
            </FormField>
          </div>

          <div className="mt-7 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-800">
            <button type="button" onClick={() => setEditing(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              <Save className="h-4 w-4" aria-hidden="true" />
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* ============ STATS ============ */}
          <div className="grid gap-4 animate-fade-in-up sm:grid-cols-2 lg:grid-cols-4">
            {statsList.map((s) => (
              <StatCard
                key={s.key}
                icon={s.icon}
                label={s.label}
                value={stats[s.key] ?? DEFAULT_STATS[s.key]}
                tone={s.tone}
              />
            ))}
          </div>

          {/* ============ QUICK ACTIONS ============ */}
          <div className="card animate-fade-in-up p-5 sm:p-7">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Quick Actions
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ActionCard
                icon={Plus}
                label="New Blood Request"
                hint="Raise a transfusion request"
                to="/request"
              />
              <ActionCard
                icon={Search}
                label="View Blood Availability"
                hint="Check district-wise stock"
                to="/availability"
              />
              <ActionCard
                icon={FileClock}
                label="Request History"
                hint={`${stats.total} request(s) so far`}
                to="/hospital/history"
              />
              <ActionCard icon={Edit3} label="Edit Profile" hint="Update hospital details" onClick={startEdit} />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* ============ HOSPITAL INFORMATION ============ */}
            <div className="card animate-fade-in-up p-5 sm:p-7">
              <div className="mb-4 flex items-center gap-2.5 border-b border-slate-200 pb-4 dark:border-slate-800">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm shadow-red-600/30">
                  <Building2 className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900 dark:text-white">
                    Hospital Information
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Registered facility details</p>
                </div>
              </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition duration-200 hover:border-red-200 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-red-900">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-red-50 text-base font-bold text-red-600 dark:border-slate-700 dark:bg-red-950/60 dark:text-red-400">
                      {display.logo ? (
                        <img
                          src={display.logo}
                          alt="Hospital logo"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initials(display.hospitalName)
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Hospital Logo
                      </p>
                      <p className="break-words text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {display.logo ? 'Logo uploaded' : 'No logo uploaded'}
                      </p>
                    </div>
                  </div>
                  <InfoRow icon={Hospital} label="Hospital Name" value={display.hospitalName} />
                <InfoRow icon={Hash} label="Hospital ID" value={display.hospitalId} />
                <InfoRow icon={ShieldCheck} label="Registration Number" value={display.registrationNumber} />
                <InfoRow icon={BadgeCheck} label="Hospital Type" value={display.hospitalType} />
                <InfoRow icon={MapPin} label="District" value={display.district} />
                <InfoRow icon={Building2} label="Full Address" value={display.address} />
                <InfoRow icon={Hash} label="PIN Code" value={display.pincode} />
              </div>
            </div>

            <div className="space-y-6">
              {/* ============ CONTACT INFORMATION ============ */}
              <div className="card animate-fade-in-up p-5 sm:p-7">
                <div className="mb-4 flex items-center gap-2.5 border-b border-slate-200 pb-4 dark:border-slate-800">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm shadow-red-600/30">
                    <Phone className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900 dark:text-white">
                      Contact Information
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Reach the hospital 24×7</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <InfoRow icon={Phone} label="Hospital Phone Number" value={display.phone} />
                  <InfoRow
                    icon={Siren}
                    label="Emergency Contact (24×7)"
                    value={display.emergencyContact}
                  />
                  <InfoRow icon={Mail} label="Official Email" value={display.email} />
                  <InfoRow icon={Globe} label="Website" value={display.website} />
                </div>
              </div>

              {/* ============ AUTHORIZED OFFICER ============ */}
              <div className="card animate-fade-in-up p-5 sm:p-7">
                <div className="mb-4 flex items-center gap-2.5 border-b border-slate-200 pb-4 dark:border-slate-800">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm shadow-red-600/30">
                    <UserRound className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900 dark:text-white">
                      Authorized Officer
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Person authorised to approve requests
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <InfoRow icon={UserRound} label="Officer Name" value={display.officerName} />
                  <InfoRow icon={Activity} label="Designation" value={display.officerDesignation} />
                  <InfoRow icon={Phone} label="Contact Number" value={display.officerContact} />
                </div>
              </div>
            </div>
          </div>

          {/* ============ RECENT REQUESTS ============ */}
          <div className="card animate-fade-in-up p-5 sm:p-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm shadow-red-600/30">
                  <FileClock className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900 dark:text-white">
                    Recent Requests
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Latest transfusion requests raised
                  </p>
                </div>
              </div>
              <Link
                to="/hospital/history"
                className="text-xs font-semibold text-red-600 transition hover:underline dark:text-red-400"
              >
                View all →
              </Link>
            </div>

            {recent.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px] text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <th className="pb-3 font-semibold">Request ID</th>
                      <th className="pb-3 font-semibold">Type</th>
                      <th className="pb-3 font-semibold">Priority</th>
                      <th className="pb-3 font-semibold">Units</th>
                      <th className="pb-3 text-right font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((r) => (
                      <tr
                        key={r.requestId}
                        className="border-t border-slate-100 transition hover:bg-red-50/40 dark:border-slate-800 dark:hover:bg-red-950/20"
                      >
                        <td className="py-3 font-semibold text-slate-800 dark:text-slate-100">
                          {r.requestId}
                        </td>
                        <td className="py-3 capitalize text-slate-600 dark:text-slate-300">
                          {r.requestType}
                        </td>
                        <td className="py-3 capitalize text-slate-600 dark:text-slate-300">
                          {r.priority}
                        </td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">{r.totalUnits}</td>
                        <td className="py-3 text-right">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              r.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {r.status === 'approved' ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-8 text-center dark:border-slate-700">
                <Droplet className="h-7 w-7 text-slate-300 dark:text-slate-600" aria-hidden="true" />
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  No requests yet
                </p>
                <Link to="/request" className="btn-primary mt-1 !py-2 text-xs">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Raise your first request
                </Link>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============ FOOTER ACTIONS ============ */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={onLogout} className="btn-secondary flex-1">
          Logout
        </button>
        <button
          type="button"
          onClick={() => navigate('/request')}
          className="btn-primary flex-1"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Blood Request
        </button>
      </div>
    </div>
  )
}
