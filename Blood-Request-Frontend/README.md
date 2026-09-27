# Life Saver Blood Bank Management — Blood Request

A frontend demo for a Tamil Nadu blood request and district-wise blood availability system. Built with React 19, Vite, and Tailwind CSS v4. **No backend or database — all stock data is mocked.**

## Features

- **Multi-step blood request form** — patient details, blood requirement, district, hospital, request type, and a review section with edit shortcuts
- **Field & form validation** — inline blur validation plus full-form validation on submit (age, units, date, 10-digit Indian mobile number, etc.)
- **Availability checker** — look up mock blood stock for any Tamil Nadu district and blood group
- **Inline stock preview** — shows in-district stock while filling the form
- **English / Tamil (தமிழ்) toggle** — full i18n for every label, placeholder, and error message
- **Light / dark theme** — persisted to `localStorage`
- **Confirmation screen** — generates a request ID (`BR-YYYY-XXXXXX`), copy-to-clipboard, and a summary of the submitted request

## Tech Stack

| Layer    | Choice                          |
| -------- | ------------------------------- |
| Framework | React 19                       |
| Build     | Vite 8                         |
| Styling   | Tailwind CSS 4 (`@tailwindcss/vite`) |
| Routing   | react-router-dom               |
| Notifications | react-hot-toast            |
| Icons     | lucide-react                   |
| Linting   | Oxlint                         |

## Getting Started

```bash
npm install
npm run dev      # start dev server
npm run build    # production build (outputs to dist/)
npm run preview  # preview the production build
npm run lint     # run Oxlint
```

## Project Structure

```
src/
├── components/
│   ├── AvailabilityChecker.jsx   # standalone stock lookup with loading + suggestions
│   ├── BloodRequestForm.jsx      # multi-step request form with submit loading + toast
│   ├── ConfirmationCard.jsx      # post-submit confirmation + summary + copy toast
│   ├── ReviewSummary.jsx         # review section of the form
│   ├── SectionCard.jsx           # numbered form section wrapper
│   ├── FormField.jsx             # label + error/hint wrapper
│   ├── Navbar.jsx                # top navigation with language/theme toggles
│   ├── Layout.jsx                # app shell (Navbar + Outlet + Footer)
│   ├── PageHeader.jsx            # shared page title/subtitle header
│   ├── Accordion.jsx             # accessible FAQ accordion
│   ├── MedicalIllustration.jsx   # decorative medical SVG illustration
│   ├── ScrollToTop.jsx           # scrolls to top on route change
│   ├── ThemedToaster.jsx         # theme-aware react-hot-toast wrapper
│   ├── Footer.jsx                # 3-column portal footer (quick links + emergency)
│   ├── Header.jsx
│   ├── LanguageToggle.jsx / ThemeToggle.jsx
├── pages/
│   ├── HomePage.jsx              # hero + quick cards + steps + emergency notice
│   ├── RequestPage.jsx           # blood request form page
│   ├── AvailabilityPage.jsx      # availability checker page
│   ├── EmergencyPage.jsx         # emergency blood guide page
│   ├── FaqPage.jsx               # FAQ page with accordion
│   ├── ContactPage.jsx           # contact form with sending state + toast
├── context/
│   ├── LanguageContext.js         # i18n context object
│   ├── LanguageProvider.jsx       # i18n provider (persists tnbb-lang)
│   ├── ThemeContext.js            # theme context object
│   ├── ThemeProvider.jsx          # theme provider (persists tnbb-theme)
│   ├── useLanguage.js             # language hook
│   └── useTheme.js                # theme hook
├── data/
│   ├── constants.js              # blood groups, genders, limits
│   ├── districts.js              # 38 Tamil Nadu districts (EN/TA)
│   └── mockAvailability.js       # deterministic mock stock data
├── i18n/
│   └── translations.js           # English & Tamil strings
├── utils/
│   └── validation.js             # field validators + form validation
├── App.jsx / main.jsx / index.css
```

## Routes

| Path          | Page              | Description                          |
| ------------- | ----------------- | ------------------------------------ |
| `/`           | HomePage          | Hero, quick links, how-it-works steps |
| `/request`    | RequestPage       | Blood request form + confirmation    |
| `/availability` | AvailabilityPage | District-wise stock checker          |
| `/emergency`  | EmergencyPage     | Emergency blood guide + 108 CTA      |
| `/faq`        | FaqPage           | Frequently asked questions           |
| `/contact`    | ContactPage       | Contact form + blood bank details    |

## Notes

- Stock numbers are deterministic mocks (hash-based with a few fixed overrides) — refreshes won't change them, and submitting a request does not decrement stock.
- Language and theme preferences persist in `localStorage` under `tnbb-lang` and `tnbb-theme`.
- Submit/check flows are simulated with `setTimeout` loading states (`btn.submitting` / `avail.checking` with `Loader2` spinners) and `react-hot-toast` feedback via `ThemedToaster` (`toast.requestSubmitted`, `toast.notAvailable`, `toast.copied`, `toast.contactSent`).
- Availability checker suggests up to 3 alternative districts with enough stock when the selected district is short, using `getAvailableUnits`.
- Check buttons are disabled while checking/submitting to prevent double clicks.
