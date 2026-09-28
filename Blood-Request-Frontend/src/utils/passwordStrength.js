// Shared with Donor-Frontend passwordStrength.js — 8+strong rule everywhere.
// getPasswordStrength -> 'weak' | 'medium' | 'strong' | ''
// generateStrongPassword fills password + confirm (caller sets both states).
export function getPasswordStrength(password) {
  if (!password) return ''
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 2) return 'weak'
  if (score <= 4) return 'medium'
  return 'strong'
}

export function isStrongPassword(password) {
  return getPasswordStrength(password) === 'strong'
}

function secureRandom(max) {
  try {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const buf = new Uint32Array(1)
      crypto.getRandomValues(buf)
      return buf[0] % max
    }
  } catch {
    /* fall through to Math.random */
  }
  return Math.floor(Math.random() * max)
}

export function generateStrongPassword(length = 14) {
  const sets = [
    'ABCDEFGHJKLMNPQRSTUVWXYZ',
    'abcdefghijkmnpqrstuvwxyz',
    '23456789',
    '!@#$%^&*()-_=+',
  ]
  const all = sets.join('')
  const pick = (source) => source[secureRandom(source.length)]
  const chars = sets.map((set) => pick(set))
  while (chars.length < length) chars.push(pick(all))
  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureRandom(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}
