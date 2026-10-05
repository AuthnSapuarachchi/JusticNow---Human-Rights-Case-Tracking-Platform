# JusticeNow

Sri Lankan human-rights case reporting and tracking mobile app, aligned with UN SDG 16.
SLIIT Year 3 group project, Group 054. Jira project key: **JN**.

## Repository layout

This is a monorepo with two apps:

```
JusticNow_Mobile/       ← Expo React Native app (TypeScript). My work lives here.
justicenow-backend/     ← Node/Express 5 + Prisma 7 + MySQL/MariaDB (other members)
```

**The mobile app is TypeScript** (`.ts` / `.tsx`) and uses **Expo Router** (file-based routing
under `src/app/`). Do not introduce React Navigation, and do not write `.js`/`.jsx` files.

## Who I am and what I own

I am **Member 3 — IT23665170 (Ananda M D S)**, Product Owner and UI/UX + Accessibility Designer.

I own these, and only these:

| Epic | Story | Scope |
|------|-------|-------|
| EP-06 Legal Support Directory | US-13 | Search / browse legal-aid organisations by issue and location |
| EP-06 Legal Support Directory | US-14 | Organisation profile + request support form |
| EP-07 Know Your Rights | US-15 | Read rights information by category |
| EP-09 Shared Design System | US-18 | Design tokens + reusable components used by the whole team |

**Do NOT build or modify these — they belong to other members:**

- Auth / login / JWT (M1) — `justicenow-backend/src/controllers/authController.js`,
  `src/middlewares/authMiddleware.js`
- Incident reporting flow, evidence upload (M1)
- Case tracking and timeline (M2) — `src/features/cases/`, `src/api/caseApi.ts`
- Secure messaging (M2) — `src/features/messaging/`, `src/api/messagingApi.ts`
- Officer and administrator dashboards (M4) — `src/features/officer/`

If a task seems to require one of the above, stop and tell me rather than building it.

## Where my code goes

Follow the conventions already established in this repo.

```
JusticNow_Mobile/src/
  design-system/            ← EP-09 lives here. colors.ts exists but is EMPTY — fill it.
  components/               ← shared components (themed-text, themed-view, BottomNavBar exist)
  i18n/                     ← does not exist yet; create it
  features/
    legal-directory/screens/    ← create (EP-06)
    know-your-rights/screens/   ← create (EP-07)
  app/                      ← Expo Router routes
```

**Styling: plain `StyleSheet.create`, not NativeWind.** NativeWind is *not* installed —
there is no `nativewind`/`tailwindcss` dependency, no `tailwind.config.*`, no `babel.config.*`
and no `metro.config.*` in `JusticNow_Mobile/`. Every screen currently in the repo styles with
`StyleSheet.create` and inline hex values. Match that. Introducing NativeWind would mean adding
a dependency, a Babel plugin and a Metro config, which is a bigger change than EP-09 needs —
if you want it, raise it as its own ticket first.

**Routing pattern to copy.** Existing routes are thin wrappers that import a screen from
`features/`. For example `src/app/cases.tsx` is 4 lines and renders `CaseListScreen`.
Mirror this exactly:

| Route file | Renders |
|------------|---------|
| `src/app/legal-support.tsx` | `LegalDirectoryScreen` |
| `src/app/legal-support/[orgId].tsx` | `RequestSupportScreen` |
| `src/app/rights.tsx` | `KnowYourRightsScreen` |
| `src/app/rights/[categoryId].tsx` | `RightsDetailScreen` |

**Existing files to be aware of, not duplicate:**
- `src/constants/theme.ts` — **already exports `Colors` (light/dark), `Fonts`, `Spacing`,
  `BottomTabInset`, `MaxContentWidth`.** This is more than a bare template stub, and it is the
  file that imports `global.css`. EP-09 should extend or re-export from here, not compete with it.
  Decide deliberately whether `design-system/` wraps it or replaces it, and say which in the doc.
- `src/global.css` — **not** a NativeWind entry point. It is 438 bytes of plain CSS custom
  properties (`--font-display`, `--font-mono`, `--font-rounded`, `--font-serif`) consumed by the
  `web` branch of `Fonts` in `theme.ts`. Web only; it has no effect on iOS/Android.
- `src/api/client.ts`, `endpoints.ts`, `queryClient.ts` — all empty (0 byte) stubs. Note
  `queryClient.ts` implies TanStack Query, but **it is not installed either** — existing screens
  use `useState` + `useEffect` directly. Follow that unless you add the dep on purpose.
- `src/hooks/use-theme.ts`, `use-color-scheme.ts` — existing theme hooks.
- `src/design-system/colors.ts` — 0 bytes, as noted above.

## Current sprint tasks (mine)

- **JN-28** — Design system: fill `src/design-system/colors.ts`, add spacing/radius/typography
  tokens, reconcile with the existing `constants/theme.ts` tokens, build reusable components +
  short component doc (3 pts). *(Ticket text says "wire into NativeWind" — NativeWind is not in
  this project. Treat that as stale wording and use `StyleSheet.create`.)*
- **JN-29** — Scaffold Legal Directory + Know Your Rights screens with mock data (3 pts)
- **JN-27** — Role-based navigation switch (5 pts). Depends on M1's JWT auth.
  Build against a hardcoded/mocked role for now; swap in the real role when auth lands.
  Must use Expo Router (route groups / conditional redirects), not React Navigation.

## Design references

### My screens — build these

`docs/design/mine/` holds the approved Figma exports for my four screens.

| File | Screen | Header title |
|------|--------|--------------|
| `01-legal-support-directory.png` | Directory list | "Find Legal Help" |
| `02-request-legal-support.png` | Org profile + request form | "Request Support" |
| `03-know-your-rights.png` | Rights categories | "Know Your Rights" |
| `04-rights-detail-workplace.png` | A rights category page | "Workplace Rights" |

`04-` is the template for every rights category, not just workplace.

### Team screens — reference only, do not build

`docs/design/team/` holds other members' screens. Use them **only** to keep shared components
visually consistent (header, bottom nav, buttons, cards, badges). Never implement these screens.

### Known issues to FIX in code, not copy

`04-rights-detail-workplace.png` contains **two** blocks of US legal content, not one:

1. **"Minimum Wage & Overtime"** — references the *federal minimum wage* and overtime at *time
   and a half for hours worked over 40 in a workweek*. That is the US FLSA. Replace with the
   Sri Lankan position (Wages Boards Ordinance / Shop and Office Employees Act).
2. **"Protection from Harassment"** — the list *"race, color, religion, sex (including
   pregnancy), national origin, age, or disability"* is verbatim US Title VII / EEOC
   protected-class wording. Sri Lanka's equivalent is Article 12(2) of the Constitution:
   **race, religion, language, caste, sex, political opinion, place of birth.**

The "independent contractor / misclassification" FAQ also reads as US-framed — check it against
Sri Lankan employment tests before shipping. Everything else on that screen is localised
correctly. Apply the same sweep to every rights topic.

### Palette divergence — resolve as part of EP-09

The Figma exports and the already-merged screens do not use the same palette:

| | Figma (`docs/design/`) | Implemented screens |
|---|---|---|
| Primary | strong blue `#0B4FD8`-ish, navy headers | blue `#2875d0` |
| Accent | — | teal `#1f5d56`, `#28725b` |
| Canvas | near-white `#f7f8fa`-ish | `#f5f8f7` |

Since EP-09 (the shared design system) is mine, **I own picking the winner.** Do not silently
follow one or the other — pick, write it into `design-system/colors.ts`, and note the decision
so M2's case/messaging screens can be migrated later.

## Design rules — from our user research, always apply

These came from four participant interviews and a 27-response questionnaire. They are findings,
not preferences.

**Language and accessibility**
- The language toggle (EN / Sinhala / Tamil) appears in the header of **every** screen.
- Never hardcode user-facing strings. Every string goes through an i18n key.
- Pair icons with text labels — never icon-only controls (low-literacy users).
- Minimum 16px body text; large tap targets.
- Never use colour alone to convey meaning; always add a text label.

**Legal Support Directory**
- Every organisation card shows: name, **verified badge**, **distance in km**, supported
  **languages**, category tags, and a Request Support button.
- Filters: issue type, location, free/paid, **and language**.
- Do **not** add star ratings. Our research did not support them, and rating non-profit
  legal-aid organisations is inappropriate.

**Know Your Rights**
- Plain language only, no legal jargon.
- Every category tile carries a short plain-language description of what it covers.
- Rights detail pages link through to "Report an Incident".

**Sri Lankan context**
- Kilometres, never miles.
- Sri Lankan labour law and the Constitution of Sri Lanka.
- Never reference OSHA, the OSH Act, "federal", "state law", or any US statute.
- Placeholder organisations should be plausible Sri Lankan ones.

**Supporting research figures**
- Lack of anonymity discouraged reporting for 51.9% of respondents; fear of retaliation 48.1%
- Most valued features: anonymous reporting 70.4%, secure messaging 70.4%, case tracking 59.3%,
  Know Your Rights info 55.6%, verified lawyer directory 37.0%
- Barriers to legal aid: long waits 63.0%, high cost 48.1%, distance 40.7%,
  not knowing where to look 37.0%

## Data shapes

Mock data must match the eventual API response so swapping to a real `fetch` is a one-line
change. Cross-check against `justicenow-backend/prisma/schema.prisma` before inventing fields.

**Reality check — the backend does not model any of this yet.** As of the current `main`:

- Prisma's `LegalOrganization` has only `id` (**`Int`**, not `String`), `name`, `contactEmail`,
  `verified`, `createdAt`, `officers[]`. It has **no** `languages`, `categories`, `isFree`,
  `distanceKm`, `location` or `contact` — i.e. almost every field the directory card design
  needs is missing.
- There is **no `LegalSupportRequest` model at all**, so `SupportType` / `RequestStatus` exist
  only in this document.

So the shapes below are a **proposal**, not a contract. Build the mocks to them, and raise the
schema gap with M1/M2 rather than assuming the API will match. Note the `Int` vs `string` id
difference in particular — it will bite when the real endpoint lands.

```ts
type Organization = {
  id: string
  name: string
  verified: boolean
  languages: string[]        // e.g. ['si', 'ta', 'en']
  categories: string[]
  isFree: boolean
  distanceKm: number
  location: string
  contact: { phone?: string; email?: string }
}

type SupportType = 'LEGAL_ADVICE' | 'REPRESENTATION' | 'DOCUMENT_REVIEW' | 'STRATEGIC_CONSULTATION'
type RequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CLOSED'

type LegalSupportRequest = {
  id: string
  organizationId: string
  caseId?: string
  supportType: SupportType
  message: string
  consentGiven: boolean
  status: RequestStatus
}
```

## Conventions

- Branch naming: `feature/JN-<number>-<short-description>`
- Do not commit to `main`.
- TypeScript only. Match the existing code style in `src/features/cases/`.
