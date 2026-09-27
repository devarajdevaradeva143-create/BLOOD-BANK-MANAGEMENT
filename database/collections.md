# Collections (DB: `bloodbank`)

Source of truth for shapes is `backend/src/models/*.js`.
This doc mirrors those Mongoose schemas (field types, required, enums, indexes).
Collection names below are the logical names; Mongoose pluralizes
(`User` → `users`, `BloodRequest` → `bloodrequests`, etc.).

Blood groups enum (shared): `A+ | A- | B+ | B- | AB+ | AB- | O+ | O-`

---

## 1. users (`src/models/User.js` → `users`)

| Field | Type | Required | Enum / Notes |
|---|---|---|---|
| staffId | String | YES | unique, `uppercase:true`, `trim:true` (e.g. `DOC-001`) |
| name | String | YES | `trim:true` |
| role | String | YES | `DistrictAdmin \| SuperAdmin` |
| designation | String | no | `trim:true` |
| districtId | String | no | `trim:true`, `lowercase:true`, default `''` (DistrictAdmin district scope; empty = all districts, SuperAdmin-style) |
| pinHash | String | YES | bcrypt(`PIN + PIN_PEPPER`), via `utils/passwords.js#hashPin` |
| refreshTokens[] | Array | no | `{ tokenHash: String (req), expiresAt: Date (req) }`, `_id:false` |
| active | Boolean | no | default `true` |
| createdAt / updatedAt | Date | auto | `timestamps:true` |

Indexes:
- `{ staffId: 1 }` unique (`staffId_1`)

---

## 2. donors (`src/models/Donor.js` → `donors`)

| Field | Type | Required | Enum / Notes |
|---|---|---|---|
| donorId | String | YES | unique, `trim:true` |
| fullName | String | YES | `trim:true`, `minlength:3` |
| dob | Date | no | |
| age | Number | no | `min:0, max:120` |
| gender | String | no | `Male \| Female \| Other` |
| bloodGroup | String | no | `A+ \| A- \| B+ \| B- \| AB+ \| AB- \| O+ \| O-` |
| mobile | String | YES | unique, `trim:true`, `/^[6-9]\d{9}$/` (Indian 10-digit) |
| mobileVerified | Boolean | no | default `false` |
| email | String | no | `lowercase:true`, `trim:true` |
| district | String | no | `trim:true` |
| city | String | no | `trim:true` |
| pincode | String | no | `trim:true`, `/^\d{6}$/` |
| address | String | no | `trim:true`, `minlength:10` |
| eligibility | Map<Mixed> | no | default `{}` |
| consents | Map<Mixed> | no | default `{}` |
| status | String | no | `Registered \| Deferred \| Donated`, default `Registered` |
| createdAt / updatedAt | Date | auto | `timestamps:true` |

Indexes:
- `{ mobile: 1 }` unique
- `{ bloodGroup: 1, district: 1 }` (`bloodGroup_1_district_1`)

---

## 3. bloodRequests (`src/models/BloodRequest.js` → `bloodrequests`)

| Field | Type | Required | Enum / Notes |
|---|---|---|---|
| requestId | String | YES | unique, `trim:true` |
| patientName | String | YES | `trim:true` |
| patientAge | Number | no | `min:0, max:120` |
| gender | String | no | `Male \| Female \| Other` |
| bloodGroup | String | YES | `A+ \| A- \| B+ \| B- \| AB+ \| AB- \| O+ \| O-` |
| units | Number | YES | `min:1, max:50` |
| requiredDate | Date | no | |
| reason | String | no | `trim:true` |
| districtId | String | no | `trim:true` (logical *district*; indexed with group+status) |
| hospitalName | String | no | `trim:true` |
| hospitalAddress | String | no | `trim:true` |
| contact | String | no | `trim:true`, `/^\d{10}$/` |
| contactVerified | Boolean | no | default `false` |
| requestType | String | no | `emergency \| normal` |
| category | String | no | `trim:true` — original frontend category (`emergency \| routine \| surgery \| icu`); `requestType` is the normalized `emergency \| normal` value used for routing |
| priority | String | no | `critical \| high \| normal`, default `normal` |
| component | String | no | `trim:true` |
| ward | String | no | `trim:true` |
| requiredTime | String | no | `trim:true` |
| doctorName | String | no | `trim:true` |
| doctorId | String | no | `trim:true` |
| doctorDepartment | String | no | `trim:true` |
| doctorContact | String | no | `trim:true` |
| hospitalId | String | no | `trim:true` — owning hospital (`Hospital._id`); empty for public single-request submissions |
| groupId | String | no | `trim:true` — shared id for all patients of one bulk submission (e.g. `BR-2026-X7K9PQ`) |
| status | String | no | `submitted \| approved \| fulfilled \| cancelled`, default `submitted` |
| createdAt / updatedAt | Date | auto | `timestamps:true` |

Indexes:
- `{ requestId: 1 }` unique
- `{ districtId: 1, bloodGroup: 1, status: 1 }` (district+group+status)
- `{ hospitalId: 1, createdAt: -1 }`
- `{ groupId: 1 }`

---

## 4. bloodUnits (`src/models/BloodUnit.js` → `bloodunits`)

| Field | Type | Required | Enum / Notes |
|---|---|---|---|
| unitCode | String | YES | unique, `trim:true` |
| bloodGroup | String | YES | `A+ \| A- \| B+ \| B- \| AB+ \| AB- \| O+ \| O-` |
| component | String | YES | `wholeBlood \| prbc \| ffp \| platelets \| cryo` |
| district | String | no | `trim:true` |
| collectionDate | Date | no | |
| expiryDate | Date | no | indexed (expiry sweep) |
| storageLocation | String | no | `trim:true` |
| quantity | Number | no | `min:1` |
| collectionStaff | String | no | `trim:true` (staffId) |
| testStatus | String | no | `Pending \| Passed \| Failed`, default `Pending` |
| status | String | no | `Available \| UnderTesting \| Reserved \| Used \| Expired \| Discarded`, default `UnderTesting` |
| screeningResult | String | no | |
| testedBy | String | no | |
| testDate | Date | no | |
| remarks | String | no | |
| history[] | Array | no | `{ type: registered \| testingStarted \| testCompleted \| statusUpdated (req), at: Date default now, note, status, byUser }`, `_id:false` |
| createdAt / updatedAt | Date | auto | `timestamps:true` |

Indexes:
- `{ unitCode: 1 }` unique
- `{ bloodGroup: 1, district: 1, status: 1 }` (group/district/status)
- `{ expiryDate: 1 }`

---

## 5. otps (`src/models/Otp.js` → `otps`, TTL 300s)

| Field | Type | Required | Enum / Notes |
|---|---|---|---|
| purpose | String | YES | `donor \| request \| reset \| donation` |
| targetHash | String | YES | sha256(mobile/contact), indexed |
| codeHash | String | YES | bcrypt(OTP code) |
| attempts | Number | no | default `0` |
| expiresAt | Date | YES | absolute expiry; Mongoose `expires:300` |
| consumed | Boolean | no | default `false` |
| createdAt / updatedAt | Date | auto | `timestamps:true`; `createdAt` drives TTL parity index |

Indexes:
- `{ targetHash: 1 }`
- TTL: `{ createdAt: 1 }` with `expireAfterSeconds: 300` (local parity for 5-min OTP window; mirrors `expiresAt … expires:300` in the model)
- Model also creates `{ expiresAt: 1 }` `expireAfterSeconds: 0` via `expires:300` — both are kept in `mongo-init` for parity.

TTL semantics: documents auto-delete ~300s after `createdAt`. App must ALSO
check `expiresAt > now && !consumed && attempts < max` — TTL is cleanup, not auth.

---

## 6. auditLogs (`src/models/AuditLog.js` → `auditlogs`)

| Field | Type | Required | Enum / Notes |
|---|---|---|---|
| actorId | String | no | staffId performing action |
| action | String | no | e.g. `donor.create`, `request.approve` |
| entity | String | no | e.g. `donor`, `request`, `unit` |
| entityId | String | no | e.g. `donorId` / `requestId` / `unitCode` |
| ip | String | no | request IP |
| at | Date | no | default `Date.now`, indexed |
| createdAt / updatedAt | Date | auto | `timestamps:true` |

Indexes:
- `{ at: 1 }` (`at_1`)

---

## 7. donations (`src/models/Donation.js` → `donations`)

| Field | Type | Required | Enum / Notes |
|---|---|---|---|
| donationId | String | YES | unique, `trim:true`, `DON-XXXXXX` via `utils/ids.js#genDonationId` |
| donorName | String | YES | `trim:true`, `minlength:3` |
| bloodGroup | String | YES | `A+ \| A- \| B+ \| B- \| AB+ \| AB- \| O+ \| O-` |
| mobile | String | YES | `trim:true`, `/^[6-9]\d{9}$/` (Indian 10-digit, OTP-verified purpose `donation`) |
| contactVerified | Boolean | no | default `false` (set `true` on OTP-verified create) |
| districtId | String | YES | `trim:true`, `lowercase:true` — normalized slug for district scoping |
| district | String | no | `trim:true` — display name |
| city | String | no | `trim:true` |
| pincode | String | no | `trim:true` |
| address | String | no | `trim:true` |
| availableDate | Date | YES | donation availability date |
| preferredTime | String | no | `trim:true` |
| hospitalId | String | no | `trim:true` — owning hospital (`Hospital._id`); Hospital role list scope |
| campId | String | no | `trim:true` |
| notes | String | no | `trim:true` |
| status | String | no | `pending \| approved \| completed \| cancelled`, default `pending` (transitions: `pending→approved\|cancelled`, `approved→completed\|cancelled`) |
| createdAt / updatedAt | Date | auto | `timestamps:true` |

Indexes:
- `{ donationId: 1 }` unique
- `{ districtId: 1, bloodGroup: 1, status: 1 }` (district+group+status)
- `{ mobile: 1, createdAt: -1 }`
