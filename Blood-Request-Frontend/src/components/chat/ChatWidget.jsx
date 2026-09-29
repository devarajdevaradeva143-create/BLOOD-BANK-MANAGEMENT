import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, X, Send, Loader2, Trash2 } from 'lucide-react'
import { useLanguage } from '../../context/useLanguage'
import { sendChatMessage } from '../../lib/chat'

const STORAGE_KEY = 'request-chat-history-v1'

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.slice(-20) : []
  } catch {
    return []
  }
}

const STRINGS = {
  en: {
    title: 'Blood Request Assistant',
    subtitle: 'Request • Availability • Emergency',
    placeholder: 'Ask about requesting blood…',
    open: 'Open chat',
    close: 'Close chat',
    clear: 'Clear chat',
    greeting: 'Hi! I can help with blood requests, availability, and emergency steps.',
    q1: 'How to request?',
    q1text: 'How do I request blood?',
    q2: 'Check availability?',
    q2text: 'How do I check blood availability?',
    q3: 'Emergency?',
    q3text: 'What to do in a blood emergency?',
    offline: 'Offline answer (AI key not set). See FAQ page.',
  },
  ta: {
    title: 'இரத்த கோரிக்கை உதவியாளர்',
    subtitle: 'கோரிக்கை • இருப்பு • அவசரம்',
    placeholder: 'இரத்தம் கோருவது பற்றி கேளுங்கள்…',
    open: 'அரட்டையைத் திற',
    close: 'அரட்டையை மூடு',
    clear: 'அரட்டையை அழி',
    greeting: 'வணக்கம்! இரத்த கோரிக்கை, இருப்பு, அவசர வழிகளில் உதவுவேன்.',
    q1: 'கோருவது எப்படி?',
    q1text: 'இரத்தம் எவ்வாறு கோருவது?',
    q2: 'இருப்பு சரிபார்ப்பு?',
    q2text: 'இரத்த இருப்பை எவ்வாறு சரிபார்ப்பது?',
    q3: 'அவசரம்?',
    q3text: 'இரத்த அவசரநிலையில் என்ன செய்ய வேண்டும்?',
    offline: 'ஆஃப்லைன் பதில் (AI விசை இல்லை). FAQ பக்கத்தைப் பார்க்கவும்.',
  },
}

export default function ChatWidget() {
  const { lang } = useLanguage()
  const s = STRINGS[lang] || STRINGS.en
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState(() => [
    { role: 'assistant', content: STRINGS[lang]?.greeting || STRINGS.en.greeting },
    ...loadHistory().filter(
      (m) => m?.content && m.content !== STRINGS.en.greeting && m.content !== STRINGS.ta.greeting,
    ),
  ])
  const bottomRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          messages
            .filter((m) => m?.content && m.content !== STRINGS.en.greeting && m.content !== STRINGS.ta.greeting)
            .slice(0, 20),
        ),
      )
    } catch {
      /* ignore */
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, open])

  async function send(text) {
    const content = String(text ?? input).trim()
    if (!content || sending) return
    const next = [...messages, { role: 'user', content: content.slice(0, 2000) }]
    setMessages(next)
    setInput('')
    setSending(true)
    try {
      const data = await sendChatMessage(
        next.filter((m) => m.role === 'user' || m.role === 'assistant').slice(-10),
        { lang, page: 'request' },
      )
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply, fallback: data.fallback }])
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: e?.message || 'Chat failed. Please try again.' }])
    } finally {
      setSending(false)
    }
  }

  const quickReplies = [
    { label: s.q1, text: s.q1text },
    { label: s.q2, text: s.q2text },
    { label: s.q3, text: s.q3text },
  ]

  function clearChat() {
    setSending(false)
    setInput('')
    setMessages([{ role: 'assistant', content: s.greeting }])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="fixed right-5 bottom-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="card flex h-[480px] w-[min(92vw,380px)] flex-col overflow-hidden shadow-2xl animate-scale-in">
          <div className="flex items-center justify-between bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-bold">{s.title}</p>
              <p className="text-xs text-red-100">{s.subtitle}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                disabled={sending || messages.length <= 1}
                aria-label={s.clear}
                title={s.clear}
                className="rounded-lg p-1.5 text-red-100 hover:bg-white/20 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <Trash2 className="h-5 w-5" />
              </button>
              <button onClick={() => setOpen(false)} aria-label={s.close} className="rounded-lg p-1.5 hover:bg-white/20">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'rounded-br-md bg-red-600 text-white'
                      : 'rounded-bl-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                  }`}
                >
                  {m.content}
                  {m.fallback && <p className="mt-1 text-[11px] opacity-70">{s.offline}</p>}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
                  <Loader2 className="h-4 w-4 animate-spin" /> …
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-slate-200/80 px-3 pt-2 dark:border-slate-800">
            <div className="flex flex-wrap gap-1.5 pb-2">
              {quickReplies.map((q) => (
                <button
                  key={q.label}
                  onClick={() => send(q.text)}
                  disabled={sending}
                  className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                >
                  {q.label}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send()
              }}
              className="flex items-center gap-2 pb-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={s.placeholder}
                maxLength={2000}
                className="input-base flex-1"
              />
              <button type="submit" disabled={sending || !input.trim()} aria-label="Send" className="btn-primary !px-3 !py-2.5">
                <Send className="h-4 w-4" />
              </button>
            </form>
            <p className="pb-2 text-center text-[11px] text-slate-400">
              <Link to="/faq" className="underline hover:text-red-600">FAQ</Link>
              {' · '}
              <Link to="/request" className="underline hover:text-red-600">
                {lang === 'ta' ? 'கோரிக்கை' : 'Request'}
              </Link>
              {' · '}
              <Link to="/availability" className="underline hover:text-red-600">
                {lang === 'ta' ? 'இருப்பு' : 'Availability'}
              </Link>
              {' · '}
              <Link to="/emergency" className="underline hover:text-red-600">
                {lang === 'ta' ? 'அவசரம்' : 'Emergency'}
              </Link>
            </p>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? s.close : s.open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-red-600 to-red-700 text-white shadow-lg shadow-red-600/30 transition hover:from-red-500 hover:to-red-600 active:scale-95"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  )
}
