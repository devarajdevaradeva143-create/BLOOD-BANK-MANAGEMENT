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
import { useLanguage } from '../context/useLanguage'

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

const HOSPITAL_FORM_STRINGS = {
  en: {
    title: 'Hospital Blood Request',
    subtitle: 'BloodTrack enterprise workflow • Multi-patient transfusion request',
    newRequest: 'New Request',
    hospitalDetails: 'Hospital Details',
    hospitalDetailsDesc: 'Auto-filled from your registered hospital profile',
    autoFilled: 'Auto-filled',
    hospitalId: 'Hospital ID',
    hospitalName: 'Hospital Name',
    district: 'District',
    bloodBankDept: 'Blood Bank Department',
    bloodBankDeptValue: 'Blood Bank & Transfusion Medicine',
    currentDate: 'Current Date',
    currentTime: 'Current Time',
    requestInfo: 'Request Information',
    requestInfoDesc: 'Define the type, priority and schedule of this request',
    requestType: 'Request Type',
    priority: 'Priority',
    districtLabel: 'District — request goes to this district admin',
    selectDistrict: 'Select district',
    hospitalAddressSuggests: 'Hospital address suggests: {name} — please confirm and select.',
    requiredDate: 'Required Date',
    requiredTime: 'Required Time',
    patientRequirement: 'Patient Blood Requirement',
    patientRequirementDesc: 'Add one card per patient requiring transfusion',
    patient: 'Patient',
    patientId: 'Patient ID',
    patientName: 'Patient Name',
    fullName: 'Full name',
    age: 'Age',
    years: 'Years',
    gender: 'Gender',
    selectGender: 'Select gender',
    bloodGroup: 'Blood Group',
    selectGroup: 'Select group',
    bloodComponent: 'Blood Component',
    selectComponent: 'Select component',
    unitsRequired: 'Units Required',
    wardDepartment: 'Ward / Department',
    selectWard: 'Select ward',
    diagnosisReason: 'Diagnosis / Reason',
    diagnosisHint: 'Clinical indication for transfusion',
    diagnosisPlaceholder: 'e.g. Severe anaemia due to GI bleed',
    doctorDetails: 'Doctor Details',
    doctorName: 'Doctor Name',
    doctorNamePlaceholder: 'Dr. full name',
    doctorId: 'Doctor ID',
    doctorIdPlaceholder: 'e.g. DR-1024',
    department: 'Department',
    selectDepartment: 'Select department',
    contactNumber: 'Contact Number',
    contactPlaceholder: '10-digit mobile',
    addAnotherPatient: 'Add Another Patient',
    summary: 'Blood Requirement Summary',
    summaryDesc: 'Consolidated requirement across all patients',
    totalUnits: 'total units',
    unitsRequiredCol: 'Units Required',
    totalUnitsRequired: 'Total Units Required',
    noRequirements: 'No requirements yet',
    noRequirementsHint: 'Add blood group and units in the patient cards to see the summary.',
    supportingDocs: 'Supporting Documents',
    supportingDocsDesc: 'Attach reports to speed up verification',
    replace: 'Replace',
    remove: 'Remove',
    browseFile: 'Browse file',
    supportedFormats: 'Supported: PDF, JPG, PNG, WEBP • Max 5 MB per file.',
    finalConfirmation: 'Final Confirmation',
    finalConfirmationDesc: 'Review the request and submit to the blood bank',
    confirmText: 'I confirm that the patient details, blood requirement and documents above are accurate and this request is authorised by the requesting doctor on behalf of the hospital.',
    unitsForPatients: '{units} unit{s} for {patients} patient{s}',
    priorityLabel: '{type} • {priority} priority',
    saveDraft: 'Save as Draft',
    submitting: 'Submitting…',
    submitRequest: 'Submit Blood Request',
    requestedBy: 'Requested by {doctor} • {hospital}',
    draftRestored: 'Draft restored from your last session',
    draftSaved: 'Draft saved successfully',
    draftError: 'Could not save the draft',
    fixFields: 'Please fix {count} highlighted field(s)',
    otpSent: 'OTP sent',
    otpResent: 'OTP resent',
    requestSubmitted: 'Blood request submitted successfully',
    groupCopied: 'Group ID copied',
    submittedTitle: 'Blood Request Submitted',
    submittedDesc: 'The blood bank team has been notified and will respond based on priority.',
    patients: 'Patients',
    patientCount: '{count} patient(s)',
    totalUnitsLabel: 'Total Units',
    unitCount: '{count} unit(s)',
    districtAdmin: 'District Admin',
    required: 'Required',
    submitAnother: 'Submit Another Request',
    removePatient: 'Remove patient {index}',
  },
  ta: {
    title: 'மருத்துவமனை இரத்த கோரிக்கை',
    subtitle: 'BloodTrack என்டர்பிரிஸ் வொர்க்ஃப்ளோ • பல நோயாளி இரத்த மாற்று கோரிக்கை',
    newRequest: 'புதிய கோரிக்கை',
    hospitalDetails: 'மருத்துவமனை விவரங்கள்',
    hospitalDetailsDesc: 'உங்கள் பதிவு செய்யப்பட்ட மருத்துவமனை சுயவிவரத்தில் இருந்து தானாக நிரப்பப்பட்டது',
    autoFilled: 'தானாக நிரப்பப்பட்டது',
    hospitalId: 'மருத்துவமனை ஐடி',
    hospitalName: 'மருத்துவமனை பெயர்',
    district: 'மாவட்டம்',
    bloodBankDept: 'இரத்த வங்கி துறை',
    bloodBankDeptValue: 'இரத்த வங்கி & இரத்த மாற்று மருத்துவம்',
    currentDate: 'தற்போதைய தேதி',
    currentTime: 'தற்போதைய நேரம்',
    requestInfo: 'கோரிக்கை தகவல்',
    requestInfoDesc: 'இந்த கோரிக்கையின் வகை, முன்னுரிமை மற்றும் அட்டவணையை வரையறுக்கவும்',
    requestType: 'கோரிக்கை வகை',
    priority: 'முன்னுரிமை',
    districtLabel: 'மாவட்டம் — கோரிக்கை இந்த மாவட்ட நிர்வாகிக்கு செல்லும்',
    selectDistrict: 'மாவட்டத்தைத் தேர்ந்தெடுக்கவும்',
    hospitalAddressSuggests: 'மருத்துவமனை முகவரி பரிந்துரை: {name} — உறுதிப்படுத்தி தேர்ந்தெடுக்கவும்.',
    requiredDate: 'தேவையான தேதி',
    requiredTime: 'தேவையான நேரம்',
    patientRequirement: 'நோயாளி இரத்த தேவை',
    patientRequirementDesc: 'இரத்த மாற்று தேவைப்படும் ஒவ்வொரு நோயாளிக்கும் ஒரு அட்டை சேர்க்கவும்',
    patient: 'நோயாளி',
    patientId: 'நோயாளி ஐடி',
    patientName: 'நோயாளி பெயர்',
    fullName: 'முழு பெயர்',
    age: 'வயது',
    years: 'ஆண்டுகள்',
    gender: 'பாலினம்',
    selectGender: 'பாலினத்தைத் தேர்ந்தெடுக்கவும்',
    bloodGroup: 'இரத்தக் குழு',
    selectGroup: 'குழுவைத் தேர்ந்தெடுக்கவும்',
    bloodComponent: 'இரத்த கூறு',
    selectComponent: 'கூறைத் தேர்ந்தெடுக்கவும்',
    unitsRequired: 'தேவையான அலகுகள்',
    wardDepartment: 'வார்டு / துறை',
    selectWard: 'வார்டைத் தேர்ந்தெடுக்கவும்',
    diagnosisReason: 'நோயறிவு / காரணம்',
    diagnosisHint: 'இரத்த மாற்றுக்கான மருத்துவ குறிப்பு',
    diagnosisPlaceholder: 'எ.கா. GI கசிவு காரணமாக கடுமையான இரத்த சோர்வு',
    doctorDetails: 'மருத்துவர் விவரங்கள்',
    doctorName: 'மருத்துவர் பெயர்',
    doctorNamePlaceholder: 'மருத்துவர் முழு பெயர்',
    doctorId: 'மருத்துவர் ஐடி',
    doctorIdPlaceholder: 'எ.கா. DR-1024',
    department: 'துறை',
    selectDepartment: 'துறையைத் தேர்ந்தெடுக்கவும்',
    contactNumber: 'தொடர்பு எண்',
    contactPlaceholder: '10 இலக்க கைபேசி',
    addAnotherPatient: 'மற்றொரு நோயாளியைச் சேர்',
    summary: 'இரத்த தேவை சுருக்கம்',
    summaryDesc: 'அனைத்து நோயாளிகளிலும் ஒருங்கிணைந்த தேவை',
    totalUnits: 'மொத்த அலகுகள்',
    unitsRequiredCol: 'தேவையான அலகுகள்',
    totalUnitsRequired: 'மொத்த தேவையான அலகுகள்',
    noRequirements: 'இன்னும் தேவைகள் இல்லை',
    noRequirementsHint: 'சுருக்கத்தைக் காண நோயாளி அட்டைகளில் இரத்தக் குழு மற்றும் அலகுகளைச் சேர்க்கவும்.',
    supportingDocs: 'ஆதரவு ஆவணங்கள்',
    supportingDocsDesc: 'சரிபார்ப்பை விரைவுபடுத்த அறிக்கைகளை இணைக்கவும்',
    replace: 'மாற்று',
    remove: 'நீக்கு',
    browseFile: 'கோப்பைத் தேடு',
    supportedFormats: 'ஆதரவு: PDF, JPG, PNG, WEBP • கோப்பு ஒன்றுக்கு 5 MB வரை.',
    finalConfirmation: 'இறுதி உறுதிப்படுத்தல்',
    finalConfirmationDesc: 'கோரிக்கையை மதிப்பாய்வு செய்து இரத்த வங்கிக்கு சமர்ப்பிக்கவும்',
    confirmText: 'நோயாளி விவரங்கள், இரத்த தேவை மற்றும் மேலே உள்ள ஆவணங்கள் சரியானவை என்பதையும், இந்த கோரிக்கை மருத்துவமனை சார்ந்து கோரும் மருத்துவரால் அங்கீகரிக்கப்பட்டது என்பதையும் உறுதிப்படுத்துகிறேன்.',
    unitsForPatients: '{patients} நோயாளிக்கு {units} அலகு{s}',
    priorityLabel: '{type} • {priority} முன்னுரிமை',
    saveDraft: 'வரைவு சேமி',
    submitting: 'சமர்ப்பிக்கப்படுகிறது…',
    submitRequest: 'இரத்த கோரிக்கையைச் சமர்ப்பி',
    requestedBy: '{doctor} மூலம் கோரப்பட்டது • {hospital}',
    draftRestored: 'உங்கள் கடைசி அமர்வில் இருந்து வரைவு மீட்கப்பட்டது',
    draftSaved: 'வரைவு வெற்றிகரமாக சேமிக்கப்பட்டது',
    draftError: 'வரைவை சேமிக்க முடியவில்லை',
    fixFields: 'தயவுசெய்து {count} முன்னிலைப்படுத்தப்பட்ட புலம்(களை) சரிசெய்யவும்',
    otpSent: 'OTP அனுப்பப்பட்டது',
    otpResent: 'OTP மீண்டும் அனுப்பப்பட்டது',
    requestSubmitted: 'இரத்த கோரிக்கை வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது',
    groupCopied: 'குழு ஐடி நகலெடுக்கப்பட்டது',
    submittedTitle: 'இரத்த கோரிக்கை சமர்ப்பிக்கப்பட்டது',
    submittedDesc: 'இரத்த வங்கி குழுவிடம் தெரிவிக்கப்பட்டது மற்றும் முன்னுரிமையின் அடிப்படையில் பதிலளிக்கும்.',
    patients: 'நோயாளிகள்',
    patientCount: '{count} நோயாளி(கள்)',
    totalUnitsLabel: 'மொத்த அலகுகள்',
    unitCount: '{count} அலகு(கள்)',
    districtAdmin: 'மாவட்ட நிர்வாகி',
    required: 'தேவையானது',
    submitAnother: 'மற்றொரு கோரிக்கையைச் சமர்ப்பி',
    removePatient: 'நோயாளி {index} ஐ நீக்கு',
  },
}

export default function HospitalRequestForm() {
  const { lang } = useLanguage()
  const s = HOSPITAL_FORM_STRINGS[lang] || HOSPITAL_FORM_STRINGS.en

  const NAV = [
    { id: 'sec-1', label: s.hospitalDetails },
    { id: 'sec-2', label: s.requestInfo },
    { id: 'sec-3', label: s.patientRequirement },
    { id: 'sec-4', label: s.doctorDetails },
    { id: 'sec-5', label: s.summary },
    { id: 'sec-6', label: s.supportingDocs },
    { id: 'sec-7', label: s.finalConfirmation },
  ]

  const [draft] = useState(readDraft)
  const draftShownRef = useRef(false)
  const seqRef = useRef(draft?.patients?.length || 1)

  const hospital = useMemo(() => getRegisteredHospital(), [])
  // Detect default district from hospital address — but user-selected
  // district is final (goes to that district admin).
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
      toast(s.draftRestored, { icon: '📝' })
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

    // District is required — request goes to the selected district admin.
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
      toast.success(s.draftSaved)
    } catch {
      toast.error(s.draftError)
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
      toast.error(s.fixFields.replace('{count}', Object.keys(next).length))
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
      toast.success(s.requestSubmitted)
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
      toast.success(s.otpResent)
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
    toast.success(s.groupCopied)
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-3xl animate-fade-in-up">
        <div className="card overflow-hidden text-center">
          <div className="bg-gradient-to-br from-red-600 to-red-700 px-6 py-10 text-white">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-4 ring-white/20">
              <CircleCheck className="h-9 w-9" aria-hidden="true" />
            </div>
              <h2 className="mt-4 text-2xl font-bold">{s.submittedTitle}</h2>
            <p className="mt-1 text-sm text-red-100">{s.submittedDesc}</p>
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
                <InfoTile icon={Users} label={s.patients} value={s.patientCount.replace('{count}', submitted.patients)} />
            <InfoTile icon={Droplets} label={s.totalUnitsLabel} value={s.unitCount.replace('{count}', submitted.totalUnits)} />
            <InfoTile icon={Table2} label={s.districtAdmin} value={submitted.districtName || submitted.districtId || '—'} />
            <InfoTile icon={Siren} label={s.priority} value={submitted.priority.toUpperCase()} />
            <InfoTile
              icon={CalendarDays}
              label={s.required}
              value={`${submitted.requiredDate} • ${submitted.requiredTime}`}
            />
          </div>

          {submitted.summary.length > 0 && (
            <div className="px-6 pb-6">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <th className="py-2 font-semibold">{s.bloodGroup}</th>
                    <th className="py-2 text-right font-semibold">{s.unitsRequiredCol}</th>
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
                {s.submitAnother}
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
                <h1 className="text-xl font-bold sm:text-2xl">{s.title}</h1>
                <p className="mt-1 text-sm text-red-100">{s.subtitle}</p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <span className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/25">
                <Hash className="h-3.5 w-3.5" aria-hidden="true" />
                {s.newRequest}
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
        title={s.hospitalDetails}
        description={s.hospitalDetailsDesc}
        badge={
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
            {s.autoFilled}
          </span>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoTile icon={Hash} label={s.hospitalId} value={hospital?.registrationNumber || 'Not registered'} />
          <InfoTile icon={Building2} label={s.hospitalName} value={hospital?.hospitalName || 'Not registered'} />
          <InfoTile icon={Table2} label={s.district} value={district} />
          <InfoTile icon={Droplets} label={s.bloodBankDept} value={s.bloodBankDeptValue} />
          <InfoTile icon={CalendarDays} label={s.currentDate} value={dateLabel} />
          <InfoTile icon={Clock} label={s.currentTime} value={timeLabel} />
        </div>
      </Section>

      <Section
        id="sec-2"
        step="2"
        icon={ClipboardList}
        title={s.requestInfo}
        description={s.requestInfoDesc}
      >
        <div className="space-y-6">
          <div>
            <p className="label-base">{s.requestType}</p>
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
            <p className="label-base">{s.priority}</p>
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
              label={s.districtLabel}
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
                <option value="">{s.selectDistrict}</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.en}
                  </option>
                ))}
              </select>
            </FormField>
            {hospitalDistrict && !form.districtId && (
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                {s.hospitalAddressSuggests.replace('{name}', hospitalDistrict.en)}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={s.requiredDate} htmlFor="req-date" required error={errors.requiredDate}>
              <input
                id="req-date"
                type="date"
                value={form.requiredDate}
                onChange={(e) => setFormField('requiredDate', e.target.value)}
                className={`input-base ${errors.requiredDate ? 'input-error' : ''}`}
              />
            </FormField>
            <FormField label={s.requiredTime} htmlFor="req-time" required error={errors.requiredTime}>
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
        title={s.patientRequirement}
        description={s.patientRequirementDesc}
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
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{s.patient} {index + 1}</p>
                  <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700">
                    <Hash className="h-3 w-3" aria-hidden="true" />
                    {patient.pid}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removePatient(index)}
                  disabled={patients.length === 1}
                  aria-label={s.removePatient.replace('{index}', index + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-red-900"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <FormField label={s.patientId} htmlFor={`pid-${index}`}>
                  <input
                    id={`pid-${index}`}
                    value={patient.pid}
                    onChange={(e) => setPatient(index, 'pid', e.target.value)}
                    className="input-base"
                  />
                </FormField>
                <FormField label={s.patientName} htmlFor={`pname-${index}`} required error={errors[`patient.${index}.name`]}>
                  <input
                    id={`pname-${index}`}
                    type="text"
                    value={patient.name}
                    onChange={(e) => setPatient(index, 'name', e.target.value)}
                    placeholder={s.fullName}
                    className={`input-base ${errors[`patient.${index}.name`] ? 'input-error' : ''}`}
                  />
                </FormField>
                <FormField label={s.age} htmlFor={`page-${index}`} required error={errors[`patient.${index}.age`]}>
                  <input
                    id={`page-${index}`}
                    type="number"
                    min="0"
                    max={MAX_AGE}
                    value={patient.age}
                    onChange={(e) => setPatient(index, 'age', e.target.value)}
                    placeholder={s.years}
                    className={`input-base ${errors[`patient.${index}.age`] ? 'input-error' : ''}`}
                  />
                </FormField>
                <FormField label={s.gender} htmlFor={`pgender-${index}`} required error={errors[`patient.${index}.gender`]}>
                  <select
                    id={`pgender-${index}`}
                    value={patient.gender}
                    onChange={(e) => setPatient(index, 'gender', e.target.value)}
                    className={`input-base ${errors[`patient.${index}.gender`] ? 'input-error' : ''}`}
                  >
                    <option value="">{s.selectGender}</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label={s.bloodGroup} htmlFor={`pgroup-${index}`} required error={errors[`patient.${index}.bloodGroup`]}>
                  <select
                    id={`pgroup-${index}`}
                    value={patient.bloodGroup}
                    onChange={(e) => setPatient(index, 'bloodGroup', e.target.value)}
                    className={`input-base ${errors[`patient.${index}.bloodGroup`] ? 'input-error' : ''}`}
                  >
                    <option value="">{s.selectGroup}</option>
                    {BLOOD_GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label={s.bloodComponent} htmlFor={`pcomp-${index}`} required error={errors[`patient.${index}.component`]}>
                  <select
                    id={`pcomp-${index}`}
                    value={patient.component}
                    onChange={(e) => setPatient(index, 'component', e.target.value)}
                    className={`input-base ${errors[`patient.${index}.component`] ? 'input-error' : ''}`}
                  >
                    <option value="">{s.selectComponent}</option>
                    {COMPONENTS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label={s.unitsRequired} htmlFor={`punits-${index}`} required error={errors[`patient.${index}.units`]}>
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
                <FormField label={s.wardDepartment} htmlFor={`pward-${index}`} required error={errors[`patient.${index}.ward`]}>
                  <select
                    id={`pward-${index}`}
                    value={patient.ward}
                    onChange={(e) => setPatient(index, 'ward', e.target.value)}
                    className={`input-base ${errors[`patient.${index}.ward`] ? 'input-error' : ''}`}
                  >
                    <option value="">{s.selectWard}</option>
                    {WARDS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </FormField>
                <div className="sm:col-span-2 lg:col-span-4">
                  <FormField
                    label={s.diagnosisReason}
                    htmlFor={`pdx-${index}`}
                    required
                    error={errors[`patient.${index}.diagnosis`]}
                    hint={s.diagnosisHint}
                  >
                    <input
                      id={`pdx-${index}`}
                      type="text"
                      value={patient.diagnosis}
                      onChange={(e) => setPatient(index, 'diagnosis', e.target.value)}
                      placeholder={s.diagnosisPlaceholder}
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
                    {s.doctorDetails}
                  </h4>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <FormField label={s.doctorName} htmlFor={`doc-name-${index}`} required error={errors[`patient.${index}.doctorName`]}>
                    <input
                      id={`doc-name-${index}`}
                      type="text"
                      value={patient.doctorName}
                      onChange={(e) => setPatient(index, 'doctorName', e.target.value)}
                      placeholder={s.doctorNamePlaceholder}
                      className={`input-base ${errors[`patient.${index}.doctorName`] ? 'input-error' : ''}`}
                    />
                  </FormField>
                  <FormField label={s.doctorId} htmlFor={`doc-id-${index}`} required error={errors[`patient.${index}.doctorId`]}>
                    <input
                      id={`doc-id-${index}`}
                      type="text"
                      value={patient.doctorId}
                      onChange={(e) => setPatient(index, 'doctorId', e.target.value)}
                      placeholder={s.doctorIdPlaceholder}
                      className={`input-base ${errors[`patient.${index}.doctorId`] ? 'input-error' : ''}`}
                    />
                  </FormField>
                  <FormField label={s.department} htmlFor={`doc-dept-${index}`} required error={errors[`patient.${index}.doctorDepartment`]}>
                    <select
                      id={`doc-dept-${index}`}
                      value={patient.doctorDepartment}
                      onChange={(e) => setPatient(index, 'doctorDepartment', e.target.value)}
                      className={`input-base ${errors[`patient.${index}.doctorDepartment`] ? 'input-error' : ''}`}
                    >
                      <option value="">{s.selectDepartment}</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label={s.contactNumber} htmlFor={`doc-contact-${index}`} required error={errors[`patient.${index}.doctorContact`]}>
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
                        placeholder={s.contactPlaceholder}
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
            {s.addAnotherPatient}
          </button>
        </div>
      </Section>

      <Section
        id="sec-5"
        step="5"
        icon={Table2}
        title={s.summary}
        description={s.summaryDesc}
        badge={
          <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300">
            {totalUnits} {s.totalUnits}
          </span>
        }
      >
        {summary.length ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70 dark:text-slate-400">
                  <th className="px-4 py-3 font-semibold">{s.bloodGroup}</th>
                  <th className="px-4 py-3 font-semibold">{s.unitsRequiredCol}</th>
                  <th className="px-4 py-3 text-right font-semibold">{s.totalUnits}</th>
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
                    {s.totalUnitsRequired}
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
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{s.noRequirements}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{s.noRequirementsHint}</p>
          </div>
        )}
      </Section>

      <Section
        id="sec-6"
        step="6"
        icon={FileUp}
        title={s.supportingDocs}
        description={s.supportingDocsDesc}
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
                        {s.replace}
                      </label>
                      <button
                        type="button"
                        onClick={() => setDocs((prev) => ({ ...prev, [doc.key]: null }))}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                      >
                        {s.remove}
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor={`doc-${doc.key}`}
                    className="mt-3 inline-block cursor-pointer rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600 dark:bg-slate-700 dark:hover:bg-red-600"
                  >
                    {s.browseFile}
                  </label>
                )}
              </div>
            )
          })}
        </div>
        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          {s.supportedFormats}
        </p>
      </Section>

      <Section
        id="sec-7"
        step="7"
        icon={BadgeCheck}
        title={s.finalConfirmation}
        description={s.finalConfirmationDesc}
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
              {s.confirmText}
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
                  {s.unitsForPatients.replace('{units}', totalUnits).replace('{patients}', patients.length).replace('{s}', totalUnits === 1 ? '' : 's')}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {s.priorityLabel.replace('{type}', form.requestType.toUpperCase()).replace('{priority}', form.priority.toUpperCase())}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={handleSaveDraft} className="btn-secondary">
                <Save className="h-4 w-4" aria-hidden="true" />
                {s.saveDraft}
              </button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? (
                  s.submitting
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden="true" />
                    {s.submitRequest}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Section>

      <p className="pb-4 text-center text-xs text-slate-400 dark:text-slate-500">
        <UserRound className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
        {s.requestedBy.replace('{doctor}', patients[0]?.doctorName || '—').replace('{hospital}', hospital?.hospitalName || 'Hospital')}
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
