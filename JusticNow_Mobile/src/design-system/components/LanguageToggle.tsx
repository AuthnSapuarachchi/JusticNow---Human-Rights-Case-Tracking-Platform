import { Pressable, StyleSheet, View } from 'react-native';

import { LANGUAGES, LANGUAGE_LABELS, LANGUAGE_NAMES, type AppLanguage } from '@/i18n';

import { Layout, Radius, Spacing } from '../spacing';
import { useColors } from '../use-colors';
import { Text } from './Text';

export type LanguageToggleProps = {
  language: AppLanguage;
  onChange: (language: AppLanguage) => void;
};

/**
 * Sits in the header of every screen — a hard requirement from our user
 * research, not a per-screen decision.
 *
 * Purely presentational: it renders whatever language it is given and reports
 * changes upward. `ScreenHeader` is what wires it to `useTranslation()`.
 */
export function LanguageToggle({ language, onChange }: LanguageToggleProps) {
  const colors = useColors();

  return (
    <View accessibilityRole="radiogroup" style={[styles.group, { borderColor: colors.borderStrong }]}>
      {LANGUAGES.map((code, index) => {
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
              <Text style={{ color: selected ? colors.primary : colors.textTertiary }} variant="caption">
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
