# JusticeNow Internationalisation

**Owner: M3 (Ananda M. D. S., IT23665170)**

English, Sinhala and Tamil. Hand-rolled with React Context and plain TypeScript
dictionaries — no `i18next`, no new dependency.

```tsx
import { useTranslation } from '@/i18n';

const { t, language, setLanguage } = useTranslation();
<Text>{t('directory.title')}</Text>
```

---

## Why this exists

Sinhala and Tamil are Sri Lanka's official languages; English is the link
language. An app for reporting human-rights violations that only speaks English
excludes most of the people it exists to serve.

Our user research turned that into a rule: **the language toggle appears in the
header of every screen, and no user-facing string is ever hardcoded.**

---

## Layout

```
src/i18n/
├── types.ts               AppLanguage, language labels and names
├── I18nProvider.tsx       Context + provider, holds the active language
├── use-translation.ts     useTranslation() hook
├── index.ts               barrel — the only import surface
└── translations/
    ├── en.ts              canonical dictionary; defines the key set
    ├── si.ts              partial, falls back to English
    ├── ta.ts              partial, falls back to English
    └── index.ts
```

The provider is mounted once, in `src/app/_layout.tsx`, wrapping `<Slot />`.

---

## How the types protect you

`en.ts` is the source of truth. `TranslationKey` is derived from it:

```ts
export type TranslationKey = keyof typeof en;
```

So:

- **Using a key that does not exist is a compile error.** No silent `undefined`
  rendering as blank text.
- **`si.ts` and `ta.ts` are `Partial<Record<TranslationKey, string>>`.** They may
  be incomplete, but they cannot invent a key that English does not have — a typo
  in a translation file fails the build rather than silently never matching.
- **Missing keys fall back to English per key**, not per file. A half-translated
  Sinhala dictionary still renders a fully usable screen.

---

## Adding a string

1. Add it to `translations/en.ts` under the right namespace, alphabetically.
2. Use it: `t('yourNamespace.yourKey')`.
3. Add the Sinhala and Tamil entries when a speaker can verify them.

Never skip step 1 and hardcode "just this once" — that is how the rule erodes.

### Interpolation

Use `{{name}}` placeholders:

```ts
'directory.distance': '{{km}} km away',
```

```tsx
t('directory.distance', { km: org.distanceKm })   // "2.4 km away"
```

---

## Translation status

⚠️ **Sinhala and Tamil need native-speaker review before submission.**

Only navigation and a few common UI terms are filled in, as starting points.
Everything else falls back to English at runtime.

**Legal and rights content is deliberately untranslated.** Mistranslating a legal
term in a human-rights app is a real harm, not a cosmetic bug — those strings
need someone who can check them against Sri Lankan law. Partial is fine; wrong
is not.

Check coverage at any time:

```ts
import { translationCoverage } from '@/i18n';
translationCoverage('si');   // { done: 8, total: 60 }
```

Suggested priority when filling them in: `directory.*` → `rights.category.*` →
`request.*`.

---

## Known limitation: the choice does not persist

Switching language works, but the app forgets it on restart. The provider holds
the language in `useState` and nothing writes it to disk.

Persisting it needs a storage package — `@react-native-async-storage/async-storage`
or `expo-secure-store` — and **neither is installed**. Adding one is a team
dependency decision, not something to slip into this ticket.

When that lands, the change is small and contained: read the stored value in
`I18nProvider` to seed `initialLanguage`, and write on `setLanguage`. Nothing
outside this folder needs to change.

---

## Device language detection

Not implemented. The app always starts in English.

`expo-localization` would give the device's preferred language, but it is also
not installed. Same call as above — raise it as its own ticket. Until then,
`I18nProvider` accepts an `initialLanguage` prop, so the wiring point already
exists.
