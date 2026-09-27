import { MAX_AGE, MAX_UNITS, MIN_AGE, MIN_UNITS } from '../data/constants'

function isBlank(v) {
  return v === undefined || v === null || String(v).trim() === ''
}

export const fieldValidators = {
  patientName(v) {
    if (isBlank(v)) return 'err.patientName'
    if (String(v).trim().length < 2) return 'err.patientName'
    return null
  },
  patientAge(v) {
    if (isBlank(v)) return 'err.required'
    const n = Number(v)
    if (!Number.isInteger(n) || n < MIN_AGE || n > MAX_AGE) return 'err.ageInvalid'
    return null
  },
  gender(v) {
    if (isBlank(v)) return 'err.gender'
    return null
  },
  bloodGroup(v) {
    if (isBlank(v)) return 'err.bloodGroup'
    return null
  },
  units(v) {
    if (isBlank(v)) return 'err.required'
    const n = Number(v)
    if (!Number.isInteger(n) || n < MIN_UNITS || n > MAX_UNITS) return 'err.unitsRange'
    return null
  },
  requiredDate(v) {
    if (isBlank(v)) return 'err.dateRequired'
    const selected = new Date(`${v}T23:59:59`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (Number.isNaN(selected.getTime())) return 'err.dateRequired'
    const selectedDay = new Date(v)
    selectedDay.setHours(0, 0, 0, 0)
    if (selectedDay < today) return 'err.datePast'
    return null
  },
  reason(v) {
    if (isBlank(v)) return 'err.required'
    if (String(v).trim().length < 10) return 'err.reasonShort'
    return null
  },
  districtId(v) {
    if (isBlank(v)) return 'err.district'
    return null
  },
  hospitalName(v) {
    if (isBlank(v)) return 'err.hospitalName'
    if (String(v).trim().length < 2) return 'err.hospitalName'
    return null
  },
  hospitalAddress(v) {
    if (isBlank(v)) return 'err.required'
    if (String(v).trim().length < 10) return 'err.addressShort'
    return null
  },
  contact(v) {
    if (isBlank(v)) return 'err.required'
    if (!/^[6-9]\d{9}$/.test(String(v).trim())) return 'err.phoneInvalid'
    return null
  },
  requestType(v) {
    if (isBlank(v)) return 'err.requestType'
    return null
  },
}

export function validateField(name, value) {
  const fn = fieldValidators[name]
  return fn ? fn(value) : null
}

export function validateForm(values) {
  const errors = {}
  Object.keys(fieldValidators).forEach((name) => {
    const err = fieldValidators[name](values[name])
    if (err) errors[name] = err
  })
  return errors
}

export function todayISO() {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}
