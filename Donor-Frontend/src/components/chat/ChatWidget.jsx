import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, X, Send, Loader2, Trash2 } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { sendChatMessage } from "../../lib/chat";
import chatDict from "../../i18n/dictionaries/chat";

const STORAGE_KEY = "donor-chat-history-v1";
const GREETINGS = [chatDict["chat.greeting"].en, chatDict["chat.greeting"].ta];
const isGreeting = (m) => !m?.content || GREETINGS.includes(m.content);

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(-20) : [];
  } catch {
    return [];
  }
}

export default function ChatWidget() {
  const { lang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState(() => [
    { role: "assistant", content: t("chat.greeting") },
    ...loadHistory().filter((m) => !isGreeting(m)),
  ]);
  const bottomRef = useRef(null);

  // Persist history only (greeting is re-added on mount), avoid duplicates
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(messages.filter((m) => !isGreeting(m)).slice(-20))
      );
    } catch {
      /* ignore */
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open]);

  function handleClear() {
    if (sending) return;
    setMessages([{ role: "assistant", content: t("chat.greeting") }]);
    setInput("");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  async function send(text) {
    const content = String(text ?? input).trim();
    if (!content || sending) return;
    const next = [...messages, { role: "user", content: content.slice(0, 2000) }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const data = await sendChatMessage(
        next.filter((m) => m.role === "user" || m.role === "assistant").slice(-10),
        { lang, page: "donor" }
      );
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply, fallback: data.fallback }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: e?.message || "Chat failed. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  }

  const quickReplies = [
    { label: t("chat.q.eligibility"), text: lang === "ta" ? "நான் ரத்தம் தானம் அளிக்க தகுதியா?" : "Am I eligible to donate blood?" },
    { label: t("chat.q.process"), text: lang === "ta" ? "ரத்ததான செயல்முறை என்ன?" : "What is the blood donation process?" },
    { label: t("chat.q.register"), text: lang === "ta" ? "பதிவு எப்படி செய்வது?" : "How do I register as a donor?" },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[480px] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 animate-fade-in">
          <div className="flex items-center justify-between bg-brand-600 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-bold">{t("chat.title")}</p>
              <p className="text-xs text-red-100">{t("chat.subtitle")}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                aria-label={t("chat.clear")}
                title={t("chat.clear")}
                className="rounded-lg p-1.5 hover:bg-white/20"
              >
                <Trash2 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label={t("chat.close")}
                className="rounded-lg p-1.5 hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-brand-600 text-white rounded-br-md"
                      : "bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-100 rounded-bl-md"
                  }`}
                >
                  {m.content}
                  {m.fallback && (
                    <p className="mt-1 text-[11px] opacity-70">{t("chat.offline")}</p>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-3 py-2 text-sm dark:bg-slate-800">
                  <Loader2 className="h-4 w-4 animate-spin" /> …
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-gray-100 px-3 pt-2 dark:border-slate-800">
            <div className="flex flex-wrap gap-1.5 pb-2">
              {quickReplies.map((q) => (
                <button
                  key={q.label}
                  onClick={() => send(q.text)}
                  disabled={sending}
                  className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-50 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-300"
                >
                  {q.label}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2 pb-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("chat.placeholder")}
                maxLength={2000}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                aria-label="Send"
                className="rounded-xl bg-brand-600 p-2.5 text-white hover:bg-brand-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <p className="pb-2 text-center text-[11px] text-gray-400">
              <Link to="/faq" className="underline hover:text-brand-600">FAQ</Link>
              {" · "}
              <Link to="/eligibility" className="underline hover:text-brand-600">
                {lang === "ta" ? "தகுதி" : "Eligibility"}
              </Link>
              {" · "}
              <Link to="/process" className="underline hover:text-brand-600">
                {lang === "ta" ? "செயல்முறை" : "Process"}
              </Link>
            </p>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t("chat.close") : t("chat.open")}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-xl shadow-brand-600/30 transition hover:bg-brand-700 active:scale-95"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
