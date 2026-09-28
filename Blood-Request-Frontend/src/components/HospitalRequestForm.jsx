import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CircleCheck,
  ClipboardCopy,
  ClipboardList,
  Clock,
  Droplets,
  FileCheck2,
  FileUp,
  Flame,
  Hash,
  HeartPulse,
  Phone,
  Pill,
  Plus,
  Save,
  Send,
  Siren,
  Stethoscope,
  Syringe,
  Table2,
  Trash2,
  TriangleAlert,
  UserRound,
  Users,
} from 'lucide-react'
import FormField from './FormField'
import OtpDialog from './OtpDialog'
import { getRegisteredHospital } from '../lib/auth'
import { requestOtp, submitBulkRequest, toUserMessage } from '../lib/api'
import { BLOOD_GROUPS, GENDERS, MAX_AGE, MAX_UNITS, MIN_UNITS } from '../data/constants'
import { districts } from '../data/districts'

const DRAFT_KEY = 'bloodtrack-draft-v1'

const REQUEST_TYPES = [
  { id: 'emergency', label: 'Emergency', hint: 'Immediate transfusion', icon: Siren },
  { id: 'routine', label: 'Routine', hint: 'Scheduled requirement', icon: ClipboardList },
  { id: 'surgery', label: 'Surgery', hint: 'Pre / post-operative', icon: Syringe },
  { id: 'icu', label: 'ICU', hint: 'Critical care unit', icon: HeartPulse },
]

const PRIORITIES = [
  { id: 'critical', label: 'Critical', hint: 'Respond within 1 hour', dot: 'bg-red-600', ring: 'border-red-500 bg-red-50 ring-2 ring-red-500/25 dark:bg-red-950/40' },
  { id: 'high', label: 'High', hint: 'Respond within 4 hours', dot: 'bg-amber-500', ring: 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/25 dark:bg-amber-950/40' },
  { id: 'normal', label: 'Normal', hint: 'Standard queue', dot: 'bg-emerald-500', ring: 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/25 dark:bg-emerald-950/40' },
]

const COMPONENTS = ['Whole Blood', 'PRBC', 'Platelets', 'Plasma', 'Cryoprecipitate']

const WARDS = [
  'ICU',
  'General Ward',
  'Emergency',
  'Operation Theatre',
  'Pediatrics',
  'Maternity',
  'Cardiology',
  'Oncology',
  'Others',
]

const DEPARTMENTS = [
  'General Medicine',
  'Surgery',
  'Cardiology',
  'Orthopedics',
  'Pediatrics',
  'Gynecology',
  'Emergency Medicine',
  'Anesthesiology',
  'Other',
]

const DOCUMENTS = [
  { key: 'prescription', label: 'Prescription', hint: 'Doctor prescription with seal', icon: Pill },
  { key: 'labReport', label: 'Lab Report', hint: 'CBC / grouping report', icon: FileCheck2 },
  { key: 'crossMatch', label: 'Cross Match Report', hint: 'Cross match compatibility report', icon: Droplets },
]

function makePatient(seq) {
  return {
    key: `p-${seq}-${Date.now()}`,
    pid: `PT-${String(seq).padStart(4, '0')}`,
    name: '',
    age: '',
    gender: '',
    bloodGroup: '',
    component: '',
    units: '1',
    ward: '',
    diagnosis: '',
    patientDistrict: '',
    patientAddress: '',
    doctorName: '',
    doctorId: '',
    doctorDepartment: '',
    doctorContact: '',
  }
}

function readDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function Section({ id, step, icon: Icon, title, description, badge, children }) {
  return (
    <section id={id} className="card animate-fade-in-up scroll-mt-24 overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200/80 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/60 sm:px-7">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-600 text-sm font-bold text-white shadow-sm shadow-red-600/30">
          {step}
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm dark:bg-slate-800 dark:text-red-400">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900 sm:text-base dark:text-white">
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm dark:text-slate-400">{description}</p>
        </div>
        {badge}
      </div>
      <div className="p-5 sm:p-7">{children}</div>
    </section>
  )
}

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition duration-200 hover:border-red-200 hover:bg-white dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-red-900 dark:hover:bg-slate-800">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
      </div>
    </div>
  )
}

const NAV = [
  { id: 'sec-1', label: 'Hospital' },
  { id: 'sec-2', label: 'Request' },
  { id: 'sec-3', label: 'Patients' },
  { id: 'sec-4', label: 'Doctor' },
  { id: 'sec-5', label: 'Summary' },
  { id: 'sec-6', label: 'Documents' },
  { id: 'sec-7', label: 'Submit' },
]

export default function HospitalRequestForm() {
  const [draft] = useState(readDraft)
  const draftShownRef = useRef(false)
  const seqRef = useRef(draft?.patients?.length || 1)

  const hospital = useMemo(() => getRegisteredHospital(), [])
  // Hospital address-la irundhu default district-ah kandupidi — aana user
  // select panna district dhaan final (andha district admin-ku tha pogum).
  const hospitalDistrict = useMemo(() => {
    const addr = (hospital?.address || '').toLowerCase()
    const hit = districts.find((d) => addr.includes(d.en.toLowerCase()))
    return hit || null
  }, [hospital])
  const district = hospitalDistrict?.en || 'Not specified'

  const [now, setNow] = useState(() => new Date())
  const [form, setForm] = useState(() => ({
    requestType: draft?.form?.requestType || 'emergency',
    priority: draft?.form?.priority || 'critical',
    districtId: draft?.form?.districtId || '',
    requiredDate: draft?.form?.requiredDate || new Date().toISOString().slice(0, 10),
    requiredTime: draft?.form?.requiredTime || '',
  }))
  const [patients, setPatients] = useState(() => {
    const saved = draft?.patients
    if (Array.isArray(saved) && saved.length) return saved
    return [makePatient(1)]
  })
  const [docs, setDocs] = useState({ prescription: null, labReport: null, crossMatch: null })
  const [confirmed, setConfirmed] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [submitted, setSubmitted] = useState(null)
  const [otpOpen, setOtpOpen] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [serverError, setServerError] = useState('')
  const [pendingPayload, setPendingPayload] = useState(null)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (draft && !draftShownRef.current && !submitted) {
      draftShownRef.current = true
      toast('Draft restored from your last session', { icon: '📝' })
    }
  }, [draft, submitted])

  useEffect(() => {
    if (attempted && Object.keys(errors).length) {
      document.querySelector('.input-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [attempted, errors])

  const summary = useMemo(() => {
    const map = new Map()
    for (const p of patients) {
      if (!p.bloodGroup) continue
      const units = Number(p.units) || 0
      map.set(p.bloodGroup, (map.get(p.bloodGroup) || 0) + units)
    }
    return BLOOD_GROUPS.filter((g) => map.has(g)).map((g) => ({ group: g, units: map.get(g) }))
  }, [patients])

  const totalUnits = summary.reduce((sum, row) => sum + row.units, 0)

  const dateLabel = now.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const timeLabel = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  function setFormField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function setPatient(index, field, value) {
    setPatients((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
    setErrors((prev) => ({ ...prev, [`patient.${index}.${field}`]: undefined }))
  }

  function addPatient() {
    seqRef.current += 1
    setPatients((prev) => [...prev, makePatient(seqRef.current)])
  }

  function removePatient(index) {
    if (patients.length === 1) return
    setPatients((prev) => prev.filter((_, i) => i !== index))
    setErrors((prev) => {
      const next = {}
      for (const key of Object.keys(prev)) {
        if (!key.startsWith(`patient.${index}.`)) next[key] = prev[key]
      }
      return next
    })
  }

  function pickDocument(key, file) {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5 MB')
      return
    }
    setDocs((prev) => ({ ...prev, [key]: file }))
  }

  function validate() {
    const next = {}

    // District select pannalum — select panna district admin-ku tha pogum.
    if (!form.districtId) next.districtId = 'District is required'
    if (!form.requiredDate) next.requiredDate = 'Required date is required'
    if (!form.requiredTime) next.requiredTime = 'Required time is required'

    patients.forEach((p, i) => {
      if (!p.name.trim()) next[`patient.${i}.name`] = 'Patient name is required'
      const age = Number(p.age)
      if (p.age === '' || Number.isNaN(age) || age < 0 || age > MAX_AGE) {
        next[`patient.${i}.age`] = `Age must be between 0 and ${MAX_AGE}`
      }
      if (!p.gender) next[`patient.${i}.gender`] = 'Gender is required'
      if (!p.bloodGroup) next[`patient.${i}.bloodGroup`] = 'Blood group is required'
      if (!p.component) next[`patient.${i}.component`] = 'Component is required'
      const units = Number(p.units)
      if (Number.isNaN(units) || units < MIN_UNITS || units > MAX_UNITS) {
        next[`patient.${i}.units`] = `Units must be ${MIN_UNITS}–${MAX_UNITS}`
      }
      if (!p.ward) next[`patient.${i}.ward`] = 'Ward / department is required'
      if (!p.diagnosis.trim()) next[`patient.${i}.diagnosis`] = 'Diagnosis is required'
    })

      if (!p.doctorName.trim()) next[`patient.${i}.doctorName`] = 'Doctor name is required'
      if (!p.doctorId.trim()) next[`patient.${i}.doctorId`] = 'Doctor ID is required'
      if (!p.doctorDepartment) next[`patient.${i}.doctorDepartment`] = 'Department is required'
      if (!/^[0-9]{10}$/.test(p.doctorContact.trim())) {
        next[`patient.${i}.doctorContact`] = 'Enter a valid 10-digit contact number'
      }

    if (!confirmed) next.confirmed = 'Please confirm the declaration before submitting'

    return next
  }

  function handleSaveDraft() {
    const payload = { form, patients, doctor, savedAt: new Date().toISOString() }
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload))
      toast.success('Draft saved successfully')
    } catch {
      toast.error('Could not save the draft')
    }
  }

  function buildPayload() {
    const districtHit = districts.find((d) => d.id === form.districtId)
    return {
      requestType: form.requestType,
      priority: form.priority,
      districtId: form.districtId,
      districtName: districtHit?.en || form.districtId,
      requiredDate: form.requiredDate,
      requiredTime: form.requiredTime,
      hospitalName: hospital?.hospitalName || '',
      hospitalAddress: hospital?.address || '',
      contact: patients[0]?.doctorContact?.trim() || '',
      patients: patients.map((p) => ({
        name: p.name.trim(),
        age: Number(p.age),
        gender: p.gender,
        bloodGroup: p.bloodGroup,
        component: p.component,
        units: Number(p.units),
        ward: p.ward,
        diagnosis: p.diagnosis.trim(),
        doctorName: p.doctorName.trim(),
        doctorId: p.doctorId.trim(),
        doctorDepartment: p.doctorDepartment,
        doctorContact: p.doctorContact.trim(),
      })),
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const next = validate()
    setErrors(next)
    setAttempted(true)
    setServerError('')

    if (Object.keys(next).length) {
      toast.error(`Please fix ${Object.keys(next).length} highlighted field(s)`)
      return
    }

    // Step 1: send OTP to the doctor contact, then verify in the dialog.
    setSubmitting(true)
    try {
      await requestOtp(patients[0]?.doctorContact?.trim() || '')
      setPendingPayload(buildPayload())
      setOtpError('')
      setOtpOpen(true)
    } catch (err) {
      setServerError(toUserMessage(err, 'Could not send OTP. Is the backend running?'))
      toast.error('Could not send OTP. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleOtpConfirm(code) {
    if (!pendingPayload) return
    setSubmitting(true)
    setOtpError('')
    try {
      const data = await submitBulkRequest({ ...pendingPayload, code })
      const created = Array.isArray(data?.requests) ? data.requests : []
      setSubmitted({
        groupId: data?.groupId || created[0]?.groupId || '—',
        requestIds: created.map((r) => r.requestId),
        patients: pendingPayload.patients.length,
        totalUnits,
        requestType: form.requestType,
        priority: form.priority,
        districtId: form.districtId,
        districtName: pendingPayload.districtName,
        requiredDate: form.requiredDate,
        requiredTime: form.requiredTime,
        summary,
      })
      setOtpOpen(false)
      setPendingPayload(null)
      setConfirmed(false)
      try {
        localStorage.removeItem(DRAFT_KEY)
      } catch {
        /* ignore */
      }
      toast.success('Blood request submitted successfully')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setOtpError(toUserMessage(err, 'Submission failed. Check the OTP and try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleOtpResend() {
    setOtpError('')
    try {
      await requestOtp(patients[0]?.doctorContact?.trim() || '')
      toast.success('OTP resent')
    } catch (err) {
      setOtpError(toUserMessage(err, 'Could not resend OTP.'))
    }
  }

  function handleNewRequest() {
    seqRef.current = 1
    setForm({
      requestType: 'emergency',
      priority: 'critical',
      districtId: '',
      requiredDate: new Date().toISOString().slice(0, 10),
      requiredTime: '',
    })
    setPatients([makePatient(1)])

    setDocs({ prescription: null, labReport: null, crossMatch: null })
    setErrors({})
    setAttempted(false)
    setSubmitted(null)
    setPendingPayload(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function copyId() {
    navigator.clipboard?.writeText(submitted.groupId)
    toast.success('Group ID copied')
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-3xl animate-fade-in-up">
        <div className="card overflow-hidden text-center">
          <div className="bg-gradient-to-br from-red-600 to-red-700 px-6 py-10 text-white">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-4 ring-white/20">
              <CircleCheck className="h-9 w-9" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-2xl font-bold">Blood Request Submitted</h2>
            <p className="mt-1 text-sm text-red-100">
              The blood bank team has been notified and will respond based on priority.
            </p>
            <button
              type="button"
              onClick={copyId}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold ring-1 ring-white/30 transition hover:bg-white/25"
            >
              <Hash className="h-4 w-4" aria-hidden="true" />
              {submitted.groupId}
              <ClipboardCopy className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid gap-4 px-6 py-6 sm:grid-cols-2">
            <InfoTile icon={Users} label="Patients" value={`${submitted.patients} patient(s)`} />
            <InfoTile icon={Droplets} label="Total Units" value={`${submitted.totalUnits} unit(s)`} />
            <InfoTile icon={Table2} label="District Admin" value={submitted.districtName || submitted.districtId || '—'} />
            <InfoTile icon={Siren} label="Priority" value={submitted.priority.toUpperCase()} />
            <InfoTile
              icon={CalendarDays}
              label="Required"
              value={`${submitted.requiredDate} • ${submitted.requiredTime}`}
            />
          </div>

          {submitted.summary.length > 0 && (
            <div className="px-6 pb-6">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <th className="py-2 font-semibold">Blood Group</th>
                    <th className="py-2 text-right font-semibold">Units</th>
                  </tr>
                </thead>
                <tbody>
                  {submitted.summary.map((row) => (
                    <tr key={row.group} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 font-semibold text-slate-800 dark:text-slate-100">{row.group}</td>
                      <td className="py-2 text-right text-slate-600 dark:text-slate-300">{row.units}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-slate-200 px-6 py-5 dark:border-slate-800">
            <button type="button" onClick={handleNewRequest} className="btn-primary w-full sm:w-auto">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Submit Another Request
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto max-w-6xl space-y-6">
      <div className="card animate-fade-in-up overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 via-red-600 to-red-700 px-5 py-6 text-white sm:px-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-2 ring-white/25">
                <Droplets className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <h1 className="text-xl font-bold sm:text-2xl">Hospital Blood Request</h1>
                <p className="mt-1 text-sm text-red-100">
                  BloodTrack enterprise workflow • Multi-patient transfusion request
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <span className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/25">
                <Hash className="h-3.5 w-3.5" aria-hidden="true" />
                New Request
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/25">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {dateLabel} • {timeLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto border-t border-slate-200/80 px-4 py-3 dark:border-slate-800 sm:px-6">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-300"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <Section
        id="sec-1"
        step="1"
        icon={Building2}
        title="Hospital Details"
        description="Auto-filled from your registered hospital profile"
        badge={
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
            Auto-filled
          </span>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoTile icon={Hash} label="Hospital ID" value={hospital?.registrationNumber || 'Not registered'} />
          <InfoTile icon={Building2} label="Hospital Name" value={hospital?.hospitalName || 'Not registered'} />
          <InfoTile icon={Table2} label="District" value={district} />
          <InfoTile icon={Droplets} label="Blood Bank Department" value="Blood Bank & Transfusion Medicine" />
          <InfoTile icon={CalendarDays} label="Current Date" value={dateLabel} />
          <InfoTile icon={Clock} label="Current Time" value={timeLabel} />
        </div>
      </Section>

      <Section
        id="sec-2"
        step="2"
        icon={ClipboardList}
        title="Request Information"
        description="Define the type, priority and schedule of this request"
      >
        <div className="space-y-6">
          <div>
            <p className="label-base">Request Type</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {REQUEST_TYPES.map((type) => {
                const active = form.requestType === type.id
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormField('requestType', type.id)}
                    className={`flex items-start gap-3 rounded-xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 ${
                      active
                        ? 'border-red-500 bg-red-50 ring-2 ring-red-500/25 dark:bg-red-950/40'
                        : 'border-slate-200 bg-white hover:border-red-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-red-900'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                        active
                          ? 'bg-red-600 text-white'
                          : 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400'
                      }`}
                    >
                      <type.icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-slate-900 dark:text-white">{type.label}</span>
                      <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{type.hint}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="label-base">Priority</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {PRIORITIES.map((level) => {
                const active = form.priority === level.id
                return (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setFormField('priority', level.id)}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 ${
                      active
                        ? level.ring
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'
                    }`}
                  >
                    <span className={`h-3 w-3 shrink-0 rounded-full ${level.dot}`} aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-slate-900 dark:text-white">{level.label}</span>
                      <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{level.hint}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <FormField
              label="District — indha district admin-ku tha request pogum"
              htmlFor="req-district"
              required
              error={errors.districtId}
            >
              <select
                id="req-district"
                value={form.districtId}
                onChange={(e) => setFormField('districtId', e.target.value)}
                className={`input-base ${errors.districtId ? 'input-error' : ''}`}
              >
                <option value="">Select district</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.en}
                  </option>
                ))}
              </select>
            </FormField>
            {hospitalDistrict && !form.districtId && (
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Hospital address prakaram: {hospitalDistrict.en} — confirm panni select pannunga.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Required Date" htmlFor="req-date" required error={errors.requiredDate}>
              <input
                id="req-date"
                type="date"
                value={form.requiredDate}
                onChange={(e) => setFormField('requiredDate', e.target.value)}
                className={`input-base ${errors.requiredDate ? 'input-error' : ''}`}
              />
            </FormField>
            <FormField label="Required Time" htmlFor="req-time" required error={errors.requiredTime}>
              <input
                id="req-time"
                type="time"
                value={form.requiredTime}
                onChange={(e) => setFormField('requiredTime', e.target.value)}
                className={`input-base ${errors.requiredTime ? 'input-error' : ''}`}
              />
            </FormField>
          </div>
        </div>
      </Section>

      <Section
        id="sec-3"
        step="3"
        icon={Users}
        title="Patient Blood Requirement"
        description="Add one card per patient requiring transfusion"
        badge={
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {patients.length} patient{patients.length > 1 ? 's' : ''}
          </span>
        }
      >
        <div className="space-y-5">
          {patients.map((patient, index) => (
            <div
              key={patient.key}
              className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition duration-200 sm:p-5 dark:border-slate-700 dark:bg-slate-900/40"
            >
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-dashed border-slate-300 pb-3 dark:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-xs font-bold text-white shadow-sm shadow-red-600/30">
                    {index + 1}
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Patient {index + 1}</p>
                  <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700">
                    <Hash className="h-3 w-3" aria-hidden="true" />
                    {patient.pid}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removePatient(index)}
                  disabled={patients.length === 1}
                  aria-label={`Remove patient ${index + 1}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-red-900"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <FormField label="Patient ID" htmlFor={`pid-${index}`}>
                  <input
                    id={`pid-${index}`}
                    value={patient.pid}
                    onChange={(e) => setPatient(index, 'pid', e.target.value)}
                    className="input-base"
                  />
                </FormField>
                <FormField label="Patient Name" htmlFor={`pname-${index}`} required error={errors[`patient.${index}.name`]}>
                  <input
                    id={`pname-${index}`}
                    type="text"
                    value={patient.name}
                    onChange={(e) => setPatient(index, 'name', e.target.value)}
                    placeholder="Full name"
                    className={`input-base ${errors[`patient.${index}.name`] ? 'input-error' : ''}`}
                  />
                </FormField>
                <FormField label="Age" htmlFor={`page-${index}`} required error={errors[`patient.${index}.age`]}>
                  <input
                    id={`page-${index}`}
                    type="number"
                    min="0"
                    max={MAX_AGE}
                    value={patient.age}
                    onChange={(e) => setPatient(index, 'age', e.target.value)}
                    placeholder="Years"
                    className={`input-base ${errors[`patient.${index}.age`] ? 'input-error' : ''}`}
                  />
                </FormField>
                <FormField label="Gender" htmlFor={`pgender-${index}`} required error={errors[`patient.${index}.gender`]}>
                  <select
                    id={`pgender-${index}`}
                    value={patient.gender}
                    onChange={(e) => setPatient(index, 'gender', e.target.value)}
                    className={`input-base ${errors[`patient.${index}.gender`] ? 'input-error' : ''}`}
                  >
                    <option value="">Select gender</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Blood Group" htmlFor={`pgroup-${index}`} required error={errors[`patient.${index}.bloodGroup`]}>
                  <select
                    id={`pgroup-${index}`}
                    value={patient.bloodGroup}
                    onChange={(e) => setPatient(index, 'bloodGroup', e.target.value)}
                    className={`input-base ${errors[`patient.${index}.bloodGroup`] ? 'input-error' : ''}`}
                  >
                    <option value="">Select group</option>
                    {BLOOD_GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Blood Component" htmlFor={`pcomp-${index}`} required error={errors[`patient.${index}.component`]}>
                  <select
                    id={`pcomp-${index}`}
                    value={patient.component}
                    onChange={(e) => setPatient(index, 'component', e.target.value)}
                    className={`input-base ${errors[`patient.${index}.component`] ? 'input-error' : ''}`}
                  >
                    <option value="">Select component</option>
                    {COMPONENTS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Units Required" htmlFor={`punits-${index}`} required error={errors[`patient.${index}.units`]}>
                  <input
                    id={`punits-${index}`}
                    type="number"
                    min={MIN_UNITS}
                    max={MAX_UNITS}
                    value={patient.units}
                    onChange={(e) => setPatient(index, 'units', e.target.value)}
                    className={`input-base ${errors[`patient.${index}.units`] ? 'input-error' : ''}`}
                  />
                </FormField>
                <FormField label="Ward / Department" htmlFor={`pward-${index}`} required error={errors[`patient.${index}.ward`]}>
                  <select
                    id={`pward-${index}`}
                    value={patient.ward}
                    onChange={(e) => setPatient(index, 'ward', e.target.value)}
                    className={`input-base ${errors[`patient.${index}.ward`] ? 'input-error' : ''}`}
                  >
                    <option value="">Select ward</option>
                    {WARDS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </FormField>
                <div className="sm:col-span-2 lg:col-span-4">
                  <FormField
                    label="Diagnosis / Reason"
                    htmlFor={`pdx-${index}`}
                    required
                    error={errors[`patient.${index}.diagnosis`]}
                    hint="Clinical indication for transfusion"
                  >
                    <input
                      id={`pdx-${index}`}
                      type="text"
                      value={patient.diagnosis}
                      onChange={(e) => setPatient(index, 'diagnosis', e.target.value)}
                      placeholder="e.g. Severe anaemia due to GI bleed"
                      className={`input-base ${errors[`patient.${index}.diagnosis`] ? 'input-error' : ''}`}
                    />
                  </FormField>
                </div>
              </div>
              <div className="mt-4 border-t border-dashed border-slate-300 pt-4 dark:border-slate-700">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-red-100 text-red-600">
                    <Stethoscope size={13} />
                  </span>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Doctor Details
                  </h4>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <FormField label="Doctor Name" htmlFor={`doc-name-${index}`} required error={errors[`patient.${index}.doctorName`]}>
                    <input
                      id={`doc-name-${index}`}
                      type="text"
                      value={patient.doctorName}
                      onChange={(e) => setPatient(index, 'doctorName', e.target.value)}
                      placeholder="Dr. full name"
                      className={`input-base ${errors[`patient.${index}.doctorName`] ? 'input-error' : ''}`}
                    />
                  </FormField>
                  <FormField label="Doctor ID" htmlFor={`doc-id-${index}`} required error={errors[`patient.${index}.doctorId`]}>
                    <input
                      id={`doc-id-${index}`}
                      type="text"
                      value={patient.doctorId}
                      onChange={(e) => setPatient(index, 'doctorId', e.target.value)}
                      placeholder="e.g. DR-1024"
                      className={`input-base ${errors[`patient.${index}.doctorId`] ? 'input-error' : ''}`}
                    />
                  </FormField>
                  <FormField label="Department" htmlFor={`doc-dept-${index}`} required error={errors[`patient.${index}.doctorDepartment`]}>
                    <select
                      id={`doc-dept-${index}`}
                      value={patient.doctorDepartment}
                      onChange={(e) => setPatient(index, 'doctorDepartment', e.target.value)}
                      className={`input-base ${errors[`patient.${index}.doctorDepartment`] ? 'input-error' : ''}`}
                    >
                      <option value="">Select department</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Contact Number" htmlFor={`doc-contact-${index}`} required error={errors[`patient.${index}.doctorContact`]}>
                    <div className="relative">
                      <Phone
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                      />
                      <input
                        id={`doc-contact-${index}`}
                        type="tel"
                        maxLength={10}
                        value={patient.doctorContact}
                        onChange={(e) => setPatient(index, 'doctorContact', e.target.value.replace(/\D/g, ''))}
                        placeholder="10-digit mobile"
                        className={`input-base pl-9 ${errors[`patient.${index}.doctorContact`] ? 'input-error' : ''}`}
                      />
                    </div>
                  </FormField>
                </div>
              </div>
            </div>
          ))}

          <button type="button" onClick={addPatient} className="btn-secondary w-full border-dashed sm:w-auto">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Another Patient
          </button>
        </div>
      </Section>

      <Section
        id="sec-5"
        step="5"
        icon={Table2}
        title="Blood Requirement Summary"
        description="Consolidated requirement across all patients"
        badge={
          <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300">
            {totalUnits} total units
          </span>
        }
      >
        {summary.length ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70 dark:text-slate-400">
                  <th className="px-4 py-3 font-semibold">Blood Group</th>
                  <th className="px-4 py-3 font-semibold">Units Required</th>
                  <th className="px-4 py-3 text-right font-semibold">Total Units</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row, i) => (
                  <tr
                    key={row.group}
                    className="border-t border-slate-100 transition hover:bg-red-50/50 dark:border-slate-800 dark:hover:bg-red-950/20"
                  >
                    <td className="px-4 py-3">
                      <span className="inline-flex min-w-12 justify-center rounded-lg bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700 dark:bg-red-950 dark:text-red-300">
                        {row.group}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{row.units}</td>
                    <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">
                      {i === summary.length - 1 ? totalUnits : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70">
                  <td className="px-4 py-3 text-sm font-bold text-slate-900 dark:text-white" colSpan={2}>
                    Total Units Required
                  </td>
                  <td className="px-4 py-3 text-right text-base font-bold text-red-600 dark:text-red-400">
                    {totalUnits}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-10 text-center dark:border-slate-700">
            <Table2 className="h-8 w-8 text-slate-300 dark:text-slate-600" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No requirements yet</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Add blood group and units in the patient cards to see the summary.
            </p>
          </div>
        )}
      </Section>

      <Section
        id="sec-6"
        step="6"
        icon={FileUp}
        title="Supporting Documents"
        description="Attach reports to speed up verification"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {DOCUMENTS.map((doc) => {
            const file = docs[doc.key]
            return (
              <div
                key={doc.key}
                className={`group relative rounded-2xl border-2 border-dashed p-5 text-center transition duration-200 ${
                  file
                    ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30'
                    : 'border-slate-300 bg-white hover:border-red-400 hover:bg-red-50/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-red-900 dark:hover:bg-red-950/20'
                }`}
              >
                <input
                  id={`doc-${doc.key}`}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  className="sr-only"
                  onChange={(e) => pickDocument(doc.key, e.target.files?.[0])}
                />
                <span
                  className={`mx-auto flex h-11 w-11 items-center justify-center rounded-xl transition ${
                    file
                      ? 'bg-emerald-600 text-white'
                      : 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white dark:bg-red-950/60 dark:text-red-400'
                  }`}
                >
                  {file ? (
                    <CircleCheck className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <doc.icon className="h-5 w-5" aria-hidden="true" />
                  )}
                </span>
                <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">{doc.label}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{doc.hint}</p>

                {file ? (
                  <div className="mt-3 space-y-2">
                    <p className="truncate text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      {file.name} • {Math.max(1, Math.round(file.size / 1024))} KB
                    </p>
                    <div className="flex justify-center gap-2">
                      <label
                        htmlFor={`doc-${doc.key}`}
                        className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                      >
                        Replace
                      </label>
                      <button
                        type="button"
                        onClick={() => setDocs((prev) => ({ ...prev, [doc.key]: null }))}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor={`doc-${doc.key}`}
                    className="mt-3 inline-block cursor-pointer rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600 dark:bg-slate-700 dark:hover:bg-red-600"
                  >
                    Browse file
                  </label>
                )}
              </div>
            )
          })}
        </div>
        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          Supported: PDF, JPG, PNG, WEBP • Max 5 MB per file.
        </p>
      </Section>

      <Section
        id="sec-7"
        step="7"
        icon={BadgeCheck}
        title="Final Confirmation"
        description="Review the request and submit to the blood bank"
      >
        <div className="space-y-5">
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition duration-200 ${
              errors.confirmed
                ? 'border-red-400 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
                : confirmed
                  ? 'border-red-300 bg-red-50/70 dark:border-red-900 dark:bg-red-950/30'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/60'
            }`}
          >
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => {
                setConfirmed(e.target.checked)
                setErrors((prev) => ({ ...prev, confirmed: undefined }))
              }}
              className="mt-0.5 h-4.5 w-4.5 shrink-0 accent-red-600"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              I confirm that the patient details, blood requirement and documents above are accurate and this request
              is authorised by the requesting doctor on behalf of the hospital.
            </span>
          </label>

          {errors.confirmed && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
              <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
              {errors.confirmed}
            </p>
          )}

          {serverError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-red-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                <Flame className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {totalUnits} unit{totalUnits === 1 ? '' : 's'} for {patients.length} patient
                  {patients.length === 1 ? '' : 's'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {form.requestType.toUpperCase()} • {form.priority.toUpperCase()} priority
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={handleSaveDraft} className="btn-secondary">
                <Save className="h-4 w-4" aria-hidden="true" />
                Save as Draft
              </button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? (
                  'Submitting…'
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden="true" />
                    Submit Blood Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Section>

      <p className="pb-4 text-center text-xs text-slate-400 dark:text-slate-500">
        <UserRound className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
        Requested by {patients[0]?.doctorName || '—'} • {hospital?.hospitalName || 'Hospital'}
      </p>

      {otpOpen && (
        <OtpDialog
          contact={pendingPayload?.contact || patients[0]?.doctorContact || ''}
          sending={submitting}
          error={otpError}
          onConfirm={handleOtpConfirm}
          onResend={handleOtpResend}
          onClose={() => setOtpOpen(false)}
        />
      )}
    </form>
  )
}
