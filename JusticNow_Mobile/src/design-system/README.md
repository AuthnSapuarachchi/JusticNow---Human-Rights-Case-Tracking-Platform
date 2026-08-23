# JusticeNow Design System

**EP-09 / US-18 · JN-28 · Owner: M3 (Ananda M. D. S., IT23665170)**

Shared tokens and components for every JusticeNow screen. Built with
`StyleSheet.create` and the packages already in this repo — no new dependencies.

```ts
import { Card, Button, Badge, Spacing, useColors } from '@/design-system';
```

Import from `@/design-system` only. Never reach into `design-system/components/*`
directly, and never import the raw `palette` — it is module-private on purpose.

---

## Two decisions this ticket had to make

### 1. Which palette wins

The Figma exports and the already-merged screens used different colours:

| | Figma | Merged screens |
|---|---|---|
| Primary | blue `#1355D6`, navy headers | blue `#2875d0` |
| Accent | — | teal `#1f5d56`, `#28725b` |
| Canvas | `#F7F8FA` | `#f5f8f7` |

**Figma wins.** It is the approved design, EP-09 owns the call, and the merged
screens were written before any design system existed to follow.

The teal is not discarded — it survives as `success` / `successSoft`, which is
what it was actually doing on those screens (resolved states, the secure-messaging
lock). So the migration is mostly mechanical.

> **Follow-up ticket needed.** M2's case and messaging screens still hardcode the
> old hex values. They are not mine to change — raise a migration ticket with M2
> rather than editing `src/features/cases/` or `src/features/messaging/`.

### 2. How this relates to `constants/theme.ts`

`src/constants/theme.ts` is left **untouched**, deliberately.

- Its `Spacing` export uses an unnamed scale (`half`, `one`, `two` …) that does
  not map to the Figma. Re-exporting would collide with ours.
- Its `Colors` is the 5-key Expo-template light/dark pair that `themed-text.tsx`,
  `themed-view.tsx` and `app/explore.tsx` still depend on. Changing its shape
  breaks all three for no gain.
- Its `Fonts` export **is** reused — `typography.ts` re-exports it rather than
  duplicating the per-platform logic and the web `global.css` wiring.

So: `design-system/` is the system for all new work; `constants/theme.ts` stays
as the template-screen compatibility layer. Migrating those three files is a
follow-up, not part of JN-28.

---

## Tokens

### Colour — `colors.ts`

Semantic names only. Screens never write hex.

| Group | Tokens |
|---|---|
| Surfaces | `canvas` `surface` `surfaceMuted` `surfaceInverse` `border` `borderStrong` |
| Text | `textPrimary` `textSecondary` `textTertiary` `textInverse` `textOnPrimary` |
| Brand | `primary` `primaryPressed` `primarySoft` `primarySoftText` `link` `focusRing` |
| Status | `verified` `success` `successSoft` `warning` `warningSoft` `danger` `dangerSoft` |
| Tags | `tagBackground` `tagText` |

Light and dark are both defined. Resolve them with the hook, never by importing
a set directly:

```tsx
const colors = useColors();
<View style={{ backgroundColor: colors.canvas }} />
```

### Spacing and layout — `spacing.ts`

4pt grid: `xs 4` · `sm 8` · `md 12` · `lg 16` · `xl 20` · `xxl 24` · `xxxl 32` · `huge 48`

Radius: `sm 8` · `md 12` · `lg 16` · `xl 20` · `pill 999`

`Layout` carries the four values screens keep re-deriving:

| Token | Value | Use |
|---|---|---|
| `screenPadding` | 20 | Horizontal padding on every screen |
| `bottomNavInset` | 105 | Bottom padding so scroll content clears `BottomNavBar` |
| `minTapTarget` | 44 | Accessibility floor for anything tappable |
| `hairline` | 1 | Row and card separators |

### Type — `typography.ts`

| Variant | Size / line | Use |
|---|---|---|
| `display` | 28 / 34 | Screen titles |
| `title` | 22 / 28 | Section titles |
| `heading` | 18 / 24 | Card titles, org names |
| `body` | 16 / 24 | Reading text — **the floor** |
| `bodyStrong` | 16 / 24 | Emphasised body |
| `label` | 15 / 20 | Buttons, field labels |
| `caption` | 14 / 20 | Distance, languages, timestamps |
| `eyebrow` | 14 / 18 | All-caps kicker |

`BODY_SIZE_FLOOR` (16) and `FONT_SIZE_FLOOR` (14) are exported so a reviewer can
assert against them. Both come from user research, not taste — do not relax them.

---

## Components

| Component | Use |
|---|---|
| `Text` | All user-facing text. Enforces the scale and the 16px body floor. |
| `Card` | White rounded container. Pass `onPress` to make it a button. |
| `Button` | `primary` / `secondary` / `ghost`. Supports `loading`, `fullWidth`. |
| `Badge` | Status with a tone — `verified`, `success`, `warning`, `danger`, `info`, `neutral`. |
| `Tag` | Non-interactive category label. |
| `FilterChip` | Selectable filter pill. |
| `IconTile` | Soft rounded icon square for category rows. Decorative, hidden from AT. |
| `SearchField` | Search input with leading magnifier. |
| `SectionHeading` | Section title with an optional trailing action. |
| `LanguageToggle` | EN / සිං / தமிழ் switch. |
| `ScreenHeader` | Title + language toggle + optional back and notifications. |

### Example — a directory card

```tsx
import { Badge, Button, Card, Tag, Text, Spacing, useColors } from '@/design-system';

<Card>
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
    <Text variant="heading">{org.name}</Text>
    {org.verified ? <Badge icon="checkmark-circle" label={t('org.verified')} tone="verified" /> : null}
  </View>

  <Text color="textSecondary" variant="caption">
    {org.location} · {t('org.distance', { km: org.distanceKm })}
  </Text>

  <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' }}>
    {org.categories.map((c) => <Tag key={c} label={t(`category.${c}`)} />)}
  </View>

  <Button
    fullWidth
    icon="arrow-forward"
    label={t('org.requestSupport')}
    onPress={() => router.push(`/legal-support/${org.id}`)}
  />
</Card>
```

---

## Rules these components enforce

Each one is a finding from our four interviews and 27-response questionnaire,
not a style preference.

1. **No icon-only controls.** `Button.label` and `Badge.label` are required, not
   optional. An icon always accompanies a label rather than replacing it.
2. **Never colour alone.** Every `Badge` tone carries a text label. `FilterChip`
   reports selection through `accessibilityState.selected` as well as colour.
3. **16px body minimum.** `Text` defaults to `body`; nothing in the scale is
   below 14.
4. **44pt tap targets.** `Button`, `FilterChip`, `SearchField`, `SectionHeading`
   actions and every `ScreenHeader` control set `minHeight: Layout.minTapTarget`.
5. **Language toggle everywhere.** `ScreenHeader` requires `language` and
   `onLanguageChange` — a screen cannot render a header without it.

---

## Known gap: i18n does not exist yet

Every string above is shown going through a `t()` call, but **`src/i18n/` has not
been built** and no ticket in the plan creates it. `LanguageToggle` therefore
takes `language` and `onChange` as props and owns no state.

`AppLanguage` (`'en' | 'si' | 'ta'`) is temporarily declared in
`components/LanguageToggle.tsx`. When the i18n module lands it should own that
type and this file should import it instead.

This blocks JN-29 — screens cannot be built string-free without it. It needs its
own ticket, sized and scheduled before JN-29 starts. No new dependency is
required: plain TypeScript dictionaries, a React Context and a `useTranslation()`
hook are enough for three languages.
