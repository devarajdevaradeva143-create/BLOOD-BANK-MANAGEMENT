import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

const ACCESS_TTL = config.jwt.accessExpires;
const REFRESH_TTL = config.jwt.refreshExpires;

function basePayload(user) {
  return {
    id: String(user._id || user.id),
    role: user.role,
    districtId: String(user.districtId || '').trim().toLowerCase(),
  };
}

export function signAccess(user) {
  return jwt.sign(basePayload(user), config.jwt.accessSecret, { expiresIn: ACCESS_TTL });
}

export function signRefresh(user) {
  return jwt.sign(basePayload(user), config.jwt.refreshSecret, { expiresIn: REFRESH_TTL });
}

export function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: config.isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: config.isProd,
    sameSite: config.isProd ? 'none' : 'lax',
    path: '/',
  });
}

export default { signAccess, signRefresh, setRefreshCookie, clearRefreshCookie };
