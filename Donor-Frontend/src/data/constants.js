export const TN_DISTRICTS = [
  "Ariyalur",
  "Chengalpattu",
  "Chennai",
  "Coimbatore",
  "Cuddalore",
  "Dharmapuri",
  "Dindigul",
  "Erode",
  "Kallakurichi",
  "Kanchipuram",
  "Kanniyakumari",
  "Karur",
  "Krishnagiri",
  "Madurai",
  "Mayiladuthurai",
  "Nagapattinam",
  "Namakkal",
  "Nilgiris",
  "Perambalur",
  "Pudukkottai",
  "Ramanathapuram",
  "Ranipet",
  "Salem",
  "Sivaganga",
  "Tenkasi",
  "Thanjavur",
  "Theni",
  "Thoothukudi",
  "Tiruchirappalli",
  "Tirunelveli",
  "Tirupattur",
  "Tiruvallur",
  "Tiruvannamalai",
  "Tiruvarur",
  "Vellore",
  "Viluppuram",
  "Virudhunagar",
];

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const GENDERS = ["Male", "Female", "Transgender"];

export const ELIGIBILITY_QUESTIONS = [
  {
    id: "age18to65",
    question: "Are you between 18 and 65 years old?",
    healthyAnswer: true,
  },
  {
    id: "weight50",
    question: "Is your weight 50 kg or more?",
    healthyAnswer: true,
  },
  {
    id: "recentDonation",
    question: "Have you donated blood within the last 90 days?",
    healthyAnswer: false,
  },
  {
    id: "fever",
    question: "Do you currently have a fever or active infection?",
    healthyAnswer: false,
  },
  {
    id: "majorIllness",
    question: "Do you have any major illness or serious medical condition?",
    healthyAnswer: false,
  },
];

export const CONSENT_ITEMS = [
  {
    id: "confirmCorrect",
    label: "I confirm that the information provided is correct.",
  },
  {
    id: "voluntary",
    label: "I am voluntarily registering as a blood donor.",
  },
  {
    id: "screeningAgree",
    label: "I agree to undergo the required donor health screening.",
  },
  {
    id: "finalEligibility",
    label:
      "I understand that final eligibility will be decided by qualified medical staff.",
  },
];

export const EMPTY_ELIGIBILITY = Object.fromEntries(
  ELIGIBILITY_QUESTIONS.map((q) => [q.id, null])
);

export const EMPTY_CONSENTS = Object.fromEntries(
  CONSENT_ITEMS.map((c) => [c.id, false])
);

export function isEligible(answers) {
  return ELIGIBILITY_QUESTIONS.every((q) => answers[q.id] === q.healthyAnswer);
}

export function isEligibilityComplete(answers) {
  return ELIGIBILITY_QUESTIONS.every((q) => answers[q.id] !== null);
}

export function allConsentsChecked(consents) {
  return CONSENT_ITEMS.every((c) => consents[c.id] === true);
}

export const HOME_STATS = [
  { id: "donors", label: "Registered Donors", value: 12500, suffix: "+" },
  { id: "lives", label: "Lives Supported", value: 28400, suffix: "+" },
  { id: "camps", label: "Blood Donation Camps", value: 340, suffix: "+" },
];

export const WHY_DONATE = [
  {
    id: "save-lives",
    title: "Save Lives Instantly",
    description:
      "A single donation can help up to three patients survive accidents, surgeries, and serious illnesses.",
    icon: "heart-pulse",
  },
  {
    id: "free-checkup",
    title: "Free Health Screening",
    description:
      "Every donor receives a complimentary health check including pulse, blood pressure, and haemoglobin.",
    icon: "stethoscope",
  },
  {
    id: "community",
    title: "Strengthen Your Community",
    description:
      "Regular donors keep local blood banks ready for emergencies, natural disasters, and thalassaemia care.",
    icon: "users",
  },
];

export const PROCESS_STEPS = [
  {
    id: "registration",
    step: 1,
    title: "Registration",
    description:
      "Fill in your basic details and show a valid photo ID at the blood bank reception desk.",
    icon: "clipboard-list",
  },
  {
    id: "screening",
    step: 2,
    title: "Health Screening",
    description:
      "A quick confidential health check covering temperature, blood pressure, pulse, and haemoglobin level.",
    icon: "stethoscope",
  },
  {
    id: "donation",
    step: 3,
    title: "Blood Donation",
    description:
      "The actual donation takes only 8–10 minutes using sterile, single-use disposable equipment.",
    icon: "droplet",
  },
  {
    id: "recovery",
    step: 4,
    title: "Recovery",
    description:
      "Rest for 10–15 minutes while enjoying refreshments. Most donors return to normal activities the same day.",
    icon: "armchair",
  },
  {
    id: "reminder",
    step: 5,
    title: "Next Donation Reminder",
    description:
      "You are eligible to donate again after 90 days. We will remind you when your next donation is due.",
    icon: "bell",
  },
];

export const BENEFITS = [
  {
    id: "screening",
    title: "Free Health Screening",
    description:
      "A complete mini health check-up is performed before every donation at no cost.",
    icon: "clipboard-check",
  },
  {
    id: "bp",
    title: "Blood Pressure Check",
    description:
      "Monitor your blood pressure at every visit and stay aware of your cardiovascular health.",
    icon: "activity",
  },
  {
    id: "haemoglobin",
    title: "Hemoglobin Check",
    description:
      "Know your haemoglobin level each time — an early indicator of anaemia and other conditions.",
    icon: "droplets",
  },
  {
    id: "certificate",
    title: "Donation Certificate",
    description:
      "Receive an official certificate acknowledging each of your life-saving donations.",
    icon: "award",
  },
  {
    id: "history",
    title: "Donation History",
    description:
      "Keep a complete record of your past donations, blood groups served, and health readings.",
    icon: "history",
  },
  {
    id: "reminder",
    title: "Next Donation Reminder",
    description:
      "Get notified as soon as you become eligible again after the 90-day donation interval.",
    icon: "bell",
  },
  {
    id: "recognition",
    title: "Recognition for Regular Donors",
    description:
      "Dedicated regular donors are recognised with special appreciation awards and badges.",
    icon: "medal",
  },
];

export const FAQS = [
  {
    id: "safe",
    question: "Is blood donation safe?",
    answer:
      "Yes. Blood donation is completely safe when performed by trained professionals using sterile, single-use disposable equipment. You cannot contract any infection from donating blood.",
  },
  {
    id: "duration",
    question: "How long does the donation process take?",
    answer:
      "Plan for about 45–60 minutes in total, including registration, screening, and refreshments. The actual blood collection itself takes only 8–10 minutes.",
  },
  {
    id: "who-cannot",
    question: "Who cannot donate blood?",
    answer:
      "People under 18 or over 65, those weighing less than 50 kg, anyone who donated in the last 90 days, and persons with fever, active infection, or certain major medical conditions may be deferred. Final eligibility is always decided by medical staff.",
  },
  {
    id: "frequency",
    question: "How often can I donate blood?",
    answer:
      "Whole blood donors can safely donate once every 90 days (12 times a year). Platelet donors may donate more frequently, subject to medical guidance.",
  },
  {
    id: "pain",
    question: "Does donating blood hurt?",
    answer:
      "You may feel a brief pinch when the needle is inserted, but the donation itself is generally painless. Some donors feel mildly lightheaded afterwards, which usually passes within a few minutes of resting.",
  },
  {
    id: "after-care",
    question: "What should I do after donating?",
    answer:
      "Drink plenty of fluids, avoid strenuous exercise for a few hours, and eat a light meal. Most people return to their normal routine the same day.",
  },
  {
    id: "blood-tests",
    question: "Will my blood be tested?",
    answer:
      "Yes. Every unit is tested for HIV, hepatitis B and C, syphilis, and malaria, and your blood group and haemoglobin are confirmed. You will be informed confidentially if any result is unsuitable for transfusion.",
  },
  {
    id: "cost",
    question: "Is blood donation free of charge?",
    answer:
      "Yes. Blood donation is entirely voluntary and free. Blood banks never pay donors, and no fee is charged for donating.",
  },
];

export const MYTHS_AND_FACTS = [
  {
    id: "myth-weak",
    myth: "Donating blood makes you weak and unable to work.",
    fact: "Your body replaces the fluid within 24 hours and red cells within a few weeks. Most donors resume work the same day.",
  },
  {
    id: "myth-disease",
    myth: "You can catch diseases by donating blood.",
    fact: "Sterile, single-use needles and equipment are used for every donor, so infection transmission is impossible.",
  },
  {
    id: "myth-pain",
    myth: "Blood donation is extremely painful.",
    fact: "You only feel a brief needle stick; the collection itself is virtually painless and lasts 8–10 minutes.",
  },
  {
    id: "myth-eligible",
    myth: "Only people with rare blood groups are needed.",
    fact: "All blood groups are essential. O+ is the most common group and is in constant demand across hospitals.",
  },
  {
    id: "myth-weight",
    myth: "Thin or lean people cannot donate.",
    fact: "The requirement is a weight of at least 50 kg — body shape alone does not affect eligibility.",
  },
  {
    id: "myth-frequency",
    myth: "You can donate as often as you like.",
    fact: "Whole blood donors must wait 90 days between donations so the body can fully replenish its supply.",
  },
];

export const CONTACT_INFO = {
  phone: "+91 44 2850 1010",
  emergency: "104",
  email: "donors@lifesaverbloodbank.in",
  address:
    "Life Saver Blood Bank Management in Tamil Nadu, 24 Anna Salai, Chennai, Tamil Nadu 600002",
  hours: "Mon – Sat: 8:00 AM – 8:00 PM  |  Emergency: 24/7",
};

export const MOCK_DONOR = {
  name: "Arun Kumar",
  email: "arun@example.com",
  phone: "9876543210",
  dob: "1990-05-15",
  gender: "Male",
  bloodGroup: "O+",
  address: "123, Anna Salai, Chennai",
  district: "Chennai",
  donorId: "DB-2026001",
  registrationDate: "2024-01-15",
  lastDonationDate: "2025-09-20",
  totalDonations: 12,
  eligibilityStatus: "Eligible",
  nextEligibleDate: "2025-12-19",
  isActive: true,
};

export const DONATION_CENTERS = [
  "Government General Hospital, Chennai",
  "Stanley Medical College, Chennai",
  "Coimbatore Medical College Hospital",
  "Madurai Medical College Hospital",
  "Sri Ramachandra Blood Bank, Chennai",
  "JIPMER Blood Centre, Puducherry",
  "Trichy SRM Blood Bank",
  "Salem Government Hospital Blood Centre",
];
