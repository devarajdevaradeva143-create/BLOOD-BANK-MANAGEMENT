import bcrypt from 'bcryptjs';

const PEPPER = process.env.PIN_PEPPER || process.env.PEPPER || '';

function withPepper(pin) {
  return `${String(pin)}${PEPPER}`;
}

export async function hashPin(pin) {
  return bcrypt.hash(withPepper(pin), 10);
}

export async function comparePin(pin, hash) {
  if (!hash) return false;
  return bcrypt.compare(withPepper(pin), hash);
}

// Donor / hospital passwords are longer than staff PINs — same peppered
// bcrypt scheme, higher cost. Aliases keep intent clear at call sites.
export async function hashPassword(password) {
  return bcrypt.hash(withPepper(password), 12);
}

export async function comparePassword(password, hash) {
  if (!hash) return false;
  return bcrypt.compare(withPepper(password), hash);
}

export default { hashPin, comparePin, hashPassword, comparePassword };
