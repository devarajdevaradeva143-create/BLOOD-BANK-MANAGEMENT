// Split grounding knowledge so each chatbot stays in its own scope:
// - DONOR_KNOWLEDGE -> Donor-Fontend widget (page='donor')
// - REQUEST_KNOWLEDGE -> Blood-request-frontend widget (page='request')
// BLOODBANK_KNOWLEDGE kept for backward compat (combined).

export const DONOR_KNOWLEDGE = `
DONOR ELIGIBILITY (Tamil Nadu):
- Age 18-65, weight >= 50kg, no donation in last 90 days.
- No fever / active infection / major illness at donation time.
- Final eligibility always decided by medical staff. Call 104 on doubt.
- Carry valid photo ID, have a light meal before donating.
- Eligibility page: 5 quick questions (age, weight, recent donation, fever, major illness).

DONATION PROCESS (45-60 min total):
1. Registration: basic details + photo ID at reception (Register page + OTP purpose 'donor').
2. Health Screening: temperature, BP, pulse, haemoglobin (confidential).
3. Blood Donation: 8-10 min, sterile single-use equipment.
4. Recovery: rest 10-15 min with refreshments, same-day normal routine.
5. Next reminder after 90 days. Whole blood max ~ every 90 days.

DONOR FAQ:
- Safe: yes, sterile single-use equipment, cannot catch infection.
- Pain: brief pinch only, occasional lightheadedness passes with rest.
- After: fluids, avoid strenuous exercise few hours, light meal.
- Testing: every unit tested HIV, Hep B/C, syphilis, malaria; blood group + Hb confirmed.
- Cost: free, voluntary, donors never paid.
- Contact: Helpline +91-44-4000-1234, Emergency donor helpline 104.

TAMIL (தமிழ்):
- Eligibility: 18-65 yrs, >=50 kg, no donation in last 90 days, no fever/infection. Final decision by medical staff. Doubt: 104.
- Process: Registration -> Screening -> 8-10 min donation -> 10-15 min rest -> Next donation after 90 days.
- Register: Check Eligibility then Register page with OTP (~2 min).
`.trim();

export const REQUEST_KNOWLEDGE = `
BLOOD REQUEST PROCESS (Blood-request-frontend):
1. Fill Request page: patient name/age/gender, blood group, units (1-50), hospital name/address/district (TN 38 districts), 10-digit contact, required date, reason (>=10 chars), type emergency|normal.
2. Check Availability page: district + blood group + units -> live stock preview.
3. Review summary -> Submit with 6-digit OTP (purpose 'request') -> get requestId (e.g. REQ-XXXXXX). Keep it for follow-up.
4. Blood bank team reviews. Emergency requests are prioritised but also call 108 + hospital blood bank desk directly.

EMERGENCY GUIDE:
- Call 108 ambulance immediately + inform hospital blood bank desk with requestId.
- Keep doctor requisition letter (seal+signature), admission proof/case sheet, govt photo ID, blood sample for cross-match if asked.
- Double-check blood group, reachable mobile, mention allergies/infections/recent transfusions.

REQUEST FAQ:
- What info required: patient/hospital/blood group/units/district/contact/date/reason.
- Emergency request = marked urgent, only for genuine emergencies + call 108.
- Can request for another person: yes, use patient details + your contact.
- Availability: Availability page -> district + group + units -> result.
- Contact: Helpline +91-44-4000-1234, help@lifesaverbloodbank.in, Emergency 108.

TAMIL (தமிழ்):
- Request: Fill Request page (patient/hospital/blood group/units 1-50), check availability, submit with OTP to get requestId.
- Emergency: Emergency request + 108 + call hospital blood bank. Required documents: doctor letter, admission proof, photo ID.
`.trim();

export const BLOODBANK_KNOWLEDGE = `${DONOR_KNOWLEDGE}\n\n${REQUEST_KNOWLEDGE}`;

export default BLOODBANK_KNOWLEDGE;
