import { config } from '../config/env.js';
import { DONOR_KNOWLEDGE, REQUEST_KNOWLEDGE } from '../data/bloodbank-faq.js';

const GEMINI_URL = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

function systemPrompt(lang, page) {
  const languageLine =
    lang === 'ta'
      ? 'Reply in Tamil (தமிழ்). Keep English medical terms in brackets when helpful.'
      : 'Reply in English. Keep it simple and friendly.';
  if (page === 'request') {
    return [
      'You are LifeSaver Blood Request assistant for Tamil Nadu.',
      'The user is on the Blood Request portal (request/availability/emergency pages).',
      languageLine,
      'Scope: answer ONLY blood-requester topics: request form steps, availability check, OTP request flow, emergency guide, hospital documents, request FAQ, helpline 108.',
      'Do NOT answer donor topics (eligibility, donation process, donor registration, donor safety/frequency). If asked donor topics, say briefly you only handle blood requests and redirect to the Donor portal Eligibility/Register pages.',
      'Never diagnose, never prescribe, never decide transfusion.',
      'For urgent blood need always say: raise an emergency request + call 108 and the hospital blood bank desk.',
      'Keep answers under 120 words. Use short bullet lists for steps.',
      'If asked outside blood-request scope, politely refuse + redirect.',
      'KNOWLEDGE:',
      REQUEST_KNOWLEDGE,
    ].join('\n');
  }
  return [
    'You are LifeSaver Donor assistant for Tamil Nadu.',
    'The user is on the Donor portal (register/eligibility/process/benefits/faq pages).',
    languageLine,
    'Scope: answer ONLY donor topics: eligibility, donation process (5 steps), donor registration + OTP donor flow, donor FAQ (safety, pain, after-care, testing, frequency, cost), helpline 104.',
    'Do NOT answer blood-requester topics (request form, availability stock, emergency requests, hospital documents). If asked those, say briefly you only handle donor topics and redirect to the Blood Request portal Request/Availability pages.',
    'Never diagnose, never prescribe. For health edge cases add: "Final decision by medical staff — call 104."',
    'Keep answers under 120 words. Use short bullet lists for steps.',
    'If asked outside donor scope, politely refuse + redirect.',
    'KNOWLEDGE:',
    DONOR_KNOWLEDGE,
  ].join('\n');
}

// Scoped keyword fallback when GEMINI_API_KEY is missing or Gemini fails.
// page='donor' -> donor-only answers, redirects request topics out.
// page='request' -> request-only answers, redirects donor topics out.
export function fallbackReply(text, lang = 'en', page = 'donor') {
  const s = String(text || '').toLowerCase();
  const ta = lang === 'ta';
  const has = (...keys) => keys.some((k) => s.includes(k));
  const isDonor = page !== 'request';

  const outOfScopeDonor = has(
    'request', 'requestid', 'request id', 'req-', 'availab', 'stock', 'emergency',
    '108', 'hospital', 'patient', 'district',     'request', 'availab', 'stock', 'emergency', 'hospital', 'patient'
  );
  const outOfScopeRequest = has(
    'eligib', 'donate', 'donor', 'donation process',
    'how long does the donation', 'weight', '50 kg',
    'eligib', 'donate', 'donor', 'process', 'weight', 'age'
  );

  if (isDonor && outOfScopeDonor && !has('donor', 'eligib', 'தகுதி', 'தானம்')) {
    return ta
      ? 'நான் தானமளிப்போர் உதவியாளர் — தகுதி, செயல்முறை, பதிவு பற்றி மட்டும் பதிலளிப்பேன். இரத்த கோரிக்கை/இருப்பு/அவசர உதவிக்கு Blood Request portal (Request/Availability பக்கம்) பயன்படுத்தவும் அல்லது 108 அழைக்கவும்.'
      : 'I am the donor assistant — I only cover eligibility, donation process and donor registration. For blood requests/availability/emergency use the Blood Request portal (Request/Availability pages) or call 108.';
  }
  if (!isDonor && outOfScopeRequest && !has('request', 'availab', 'emergency', 'கோரிக்கை', 'கோரு', 'இருப்பு')) {
    return ta
      ? 'நான் இரத்த கோரிக்கை உதவியாளர் — கோரிக்கை, இருப்பு, அவசர வழி பற்றி மட்டும் பதிலளிப்பேன். தானம்/தகுதி/செயல்முறைக்கு Donor portal (Eligibility/Register பக்கம்) பயன்படுத்தவும் அல்லது 104 அழைக்கவும்.'
      : 'I am the blood-request assistant — I only cover requests, availability and emergency steps. For donation/eligibility/process use the Donor portal (Eligibility/Register pages) or call 104.';
  }

  if (isDonor) {
    if (has('eligib', 'தகுதி', 'age', 'weight', 'வயது', 'எடை', 'can i donate', 'யார்')) {
      return ta
        ? 'தகுதி: 18–65 வயது, ≥50 கிலோ, கடந்த 90 நாட்களில் தானம் இல்லை, காய்ச்சல்/தொற்று இல்லை. புகைப்பட அடையாள அட்டை + இலகு உணவுடன் வரவும். இறுதி முடிவு மருத்துவரிடம் — சந்தேகம்: 104. Eligibility பக்கத்தில் 5 கேள்விகளுக்கு பதிலளித்து சரிபார்க்கவும்.'
        : 'Eligibility: 18–65 yrs, ≥50 kg, no donation in last 90 days, no fever/infection. Bring photo ID + light meal. Final call by medical staff — call 104. Check the Eligibility page (5 quick questions).';
    }
    if (has('process', 'செயல்முறை', 'steps', 'how long', 'எவ்வளவு நேரம்', 'படி', 'donation take')) {
      return ta
        ? 'செயல்முறை (45–60 நிமிடம்): 1) பதிவு + ID 2) பரிசோதனை 3) 8–10 நிமிட தானம் 4) 10–15 நிமிட ஓய்வு 5) 90 நாட்களுக்குப் பின் அடுத்த தானம். Process பக்கத்தைப் பார்க்கவும்.'
        : 'Process (45–60 min): 1) Registration + ID 2) Screening 3) 8–10 min donation 4) 10–15 min rest 5) Next after 90 days. See the Process page timeline.';
    }
    if (has('register', 'பதிவு', 'sign up', 'how to donate', 'எப்படி')) {
      return ta
        ? 'பதிவு: Eligibility சரிபார்த்து, Register பக்கத்தில் விவரங்கள் + OTP உடன் பதிவு செய்யவும். ~2 நிமிடம் ஆகும்.'
        : 'Register: check Eligibility first, then complete the Register page with OTP verification. Takes ~2 minutes.';
    }
    if (has('safe', 'பாதுகாப்பு', 'pain', 'வலி', 'test', 'பரிசோதனை', 'cost', 'கட்டணம்', 'after', 'பின்', 'frequency', 'often')) {
      return ta
        ? 'பாதுகாப்பானது: ஒருமுறை கருவிகள், தொற்று ஏற்படாது. சிறு கூச்சம் மட்டும். பின் நிறைய திரவம் + சில மணி ஓய்வு. ஒவ்வொரு அலகும் HIV/ஹெபடைடிஸ்/சிஃபிலிஸ்/மலேரியா பரிசோதனை. இலவசம். 90 நாட்களுக்கு ஒருமுறை தானம்.'
        : 'Safe: single-use sterile equipment, no infection risk. Brief pinch only. After: fluids + rest few hours. Every unit tested (HIV/Hep B-C/syphilis/malaria). Free & voluntary. Donate every 90 days.';
    }
    return ta
      ? 'நான் தானமளிப்போர் உதவியாளர் — தகுதி, செயல்முறை, பதிவு, பாதுகாப்பு பற்றி மட்டும் கேளுங்கள் (எ.கா: தகுதியா? செயல்முறை? பதிவு எப்படி?).'
      : 'I am the donor assistant — ask only about eligibility, donation process, registration or donor safety (e.g. "Am I eligible?", "What is the process?", "How to register?").';
  }

  // --- Request scope ---
  if (has('request', 'கோரிக்கை', 'how to request', 'patient', 'நோயாளி', 'register request', 'otp', 'requestid')) {
    return ta
      ? 'கோரிக்கை: Request பக்கத்தில் நோயாளி/மருத்துவமனை/இரத்தக்குழு/அலகுகள் (1–50) நிரப்பி, OTP-உடன் சமர்ப்பித்து requestId பெறவும். விவரங்கள்: 10 இலக்க தொடர்பு, தேதி, காரணம் (≥10 எழுத்து), emergency|normal.'
      : 'Request: fill Request page (patient/hospital/blood group/units 1–50, 10-digit contact, date, reason ≥10 chars, emergency|normal), submit with OTP to get a requestId.';
  }
  if (has('availab', 'இருப்பு', 'stock', 'district', 'மாவட்டம்', 'check')) {
    return ta
      ? 'இருப்பு: Availability பக்கத்தில் மாவட்டம் + இரத்தக்குழு + அலகுகள் தேர்ந்து Check Availability அழுத்தவும். பற்றாக்குறை எனில் அருகில் இருப்புள்ள மாவட்டத்தை முயற்சிக்கவும்.'
      : 'Availability: open Availability page, select district + blood group + units, click Check Availability. If shortage, try a nearby district with stock.';
  }
  if (has('emergency', 'அவசர', '108', 'hospital', 'மருத்துவமனை', 'document')) {
    return ta
      ? 'அவசரம்: emergency கோரிக்கை பதிவு + 108 + மருத்துவமனை இரத்த வங்கிக்கு requestId தெரிவிக்கவும். தயார்: மருத்துவர் கடிதம், அனுமதி சான்று, அடையாள அட்டை, cross-match மாதிரி.'
      : 'Emergency: raise emergency request + call 108 + hospital blood bank desk with requestId. Keep: doctor letter, admission proof, photo ID, cross-match sample.';
  }
  return ta
    ? 'நான் இரத்த கோரிக்கை உதவியாளர் — கோரிக்கை, இருப்பு, அவசர வழி பற்றி மட்டும் கேளுங்கள் (எ.கா: கோருவது எப்படி? இருப்பு? அவசரம்?).'
    : 'I am the blood-request assistant — ask only about requests, availability or emergency (e.g. "How to request?", "Check availability?", "Emergency?").';
}

export async function chatCompletion(messages, { lang = 'en', page = 'donor' } = {}) {
  const apiKey = config.chat.apiKey;
  const model = config.chat.model;
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');

  if (!apiKey) {
    return { reply: fallbackReply(lastUser?.content, lang, page), fallback: true, model: 'faq-fallback' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const url = `${GEMINI_URL(model)}?key=${apiKey}`;
    const contents = [
      { role: 'user', parts: [{ text: systemPrompt(lang, page) }] },
      ...messages.map((m) => ({ role: m.role, parts: [{ text: m.content }] })),
    ];
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Gemini ${res.status}: ${errText.slice(0, 200)}`);
    }
    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!reply) throw new Error('Empty Gemini reply');
    return { reply, fallback: false, model };
  } catch (err) {
    console.error('chatCompletion failed, using fallback:', err?.message || err);
    return { reply: fallbackReply(lastUser?.content, lang, page), fallback: true, model: 'faq-fallback' };
  } finally {
    clearTimeout(timer);
  }
}

export default { chatCompletion, fallbackReply };
