import { API_BASE } from './api';

/**
 * POST /api/chat via backend proxy (OPENAI key never leaves server).
 * @param {{role:string,content:string}[]} messages
 * @param {{lang:'en'|'ta', page:'donor'|'request'}} opts
 */
export async function sendChatMessage(messages, { lang = 'en', page = 'donor' } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  let res;
  try {
    res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, lang, page }),
      signal: controller.signal,
    });
  } catch (err) {
    throw new Error(err?.name === 'AbortError' ? 'Request timed out. Please try again.' : 'Cannot reach the server. Is the backend running?');
  } finally {
    clearTimeout(timer);
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Chat failed (${res.status})`);
  }
  return data; // { reply, model, fallback }
}

export default { sendChatMessage };
