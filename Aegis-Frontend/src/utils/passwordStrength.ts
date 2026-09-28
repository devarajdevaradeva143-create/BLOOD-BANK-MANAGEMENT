// Shared 8+strong rule (same as Donor/Blood frontends + backend strongPassword).
// generateStrongPassword fills password + confirm (caller sets both states).
export type PasswordStrength = '' | 'weak' | 'medium' | 'strong';

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return '';
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
}

export function isStrongPassword(password: string): boolean {
  return getPasswordStrength(password) === 'strong';
}

export function strongPasswordMessage(): string {
  return 'Use 8+ characters with uppercase, lowercase, number & symbol';
}

function secureRandom(max: number): number {
  try {
    const g = globalThis as unknown as { crypto?: { getRandomValues?: (a: Uint32Array) => void } };
    if (g.crypto?.getRandomValues) {
      const buf = new Uint32Array(1);
      g.crypto.getRandomValues(buf);
      return Number(buf[0] % max);
    }
  } catch {
    /* fall through */
  }
  return Math.floor(Math.random() * max);
}

export function generateStrongPassword(length = 14): string {
  const sets = [
    'ABCDEFGHJKLMNPQRSTUVWXYZ',
    'abcdefghijkmnpqrstuvwxyz',
    '23456789',
    '!@#$%^&*()-_=+',
  ];
  const all = sets.join('');
  const pick = (source: string): string => source[secureRandom(source.length)] ?? source[0] ?? '';
  const chars: string[] = sets.map((set) => pick(set));
  while (chars.length < length) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureRandom(i + 1);
    const tmp = chars[i] ?? '';
    chars[i] = chars[j] ?? '';
    chars[j] = tmp;
  }
  return chars.join('');
}
