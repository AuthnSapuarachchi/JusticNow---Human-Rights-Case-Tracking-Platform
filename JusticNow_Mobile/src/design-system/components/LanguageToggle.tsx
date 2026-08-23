import { Pressable, StyleSheet, View } from 'react-native';

import { Layout, Radius, Spacing } from '../spacing';
import { useColors } from '../use-colors';
import { Text } from './Text';

/**
 * The three languages the app ships in.
 *
 * Defined here for now because `src/i18n/` does not exist yet. When that module
 * lands it should own this type and this file should import it instead — see the
 * i18n note in `README.md`.
 */
export type AppLanguage = 'en' | 'si' | 'ta';

/** Each language is written in its own script, which is the point of the control. */
const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  en: 'EN',
  si: 'සිං',
  ta: 'தமிழ்',
};

/** Spoken names, for screen readers that cannot pronounce the short forms. */
const LANGUAGE_NAMES: Record<AppLanguage, string> = {
  en: 'English',
  si: 'Sinhala',
  ta: 'Tamil',
};

const ORDER: AppLanguage[] = ['en', 'si', 'ta'];

export type LanguageToggleProps = {
  language: AppLanguage;
  onChange: (language: AppLanguage) => void;
};

/**
 * Sits in the header of every screen — a hard requirement from our user
 * research, not a per-screen decision.
 */
export function LanguageToggle({ language, onChange }: LanguageToggleProps) {
  const colors = useColors();

  return (
    <View
      accessibilityRole="radiogroup"
      style={[styles.group, { borderColor: colors.borderStrong }]}
    >
      {ORDER.map((code, index) => {
        const selected = code === language;
        return (
          <View key={code} style={styles.segment}>
            {index > 0 ? <View style={[styles.divider, { backgroundColor: colors.border }]} /> : null}
            <Pressable
              accessibilityLabel={LANGUAGE_NAMES[code]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(code)}
              style={({ pressed }) => [styles.option, pressed && styles.pressed]}
            >
              <Text
                style={{ color: selected ? colors.primary : colors.textTertiary }}
                variant="caption"
              >
                {LANGUAGE_LABELS[code]}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
  },
  segment: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  divider: {
    height: 16,
    width: 1,
  },
  option: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Layout.minTapTarget,
    paddingHorizontal: Spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
});
