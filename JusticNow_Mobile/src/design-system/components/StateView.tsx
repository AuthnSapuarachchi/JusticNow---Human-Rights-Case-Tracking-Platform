import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Spacing } from '../spacing';
import { useColors } from '../use-colors';
import { Button } from './Button';
import { IconTile } from './IconTile';
import { Text } from './Text';

export type StateViewProps = {
  /** `loading` shows a spinner; `empty` and `error` show an icon tile. */
  kind: 'loading' | 'empty' | 'error';
  title?: string;
  message?: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  actionLabel?: string;
  onAction?: () => void;
};

/**
 * The one way a screen says "loading", "nothing here yet" or "something went
 * wrong", so those moments look and read the same everywhere.
 */
export function StateView({ kind, title, message, icon, actionLabel, onAction }: StateViewProps) {
  const colors = useColors();
  const fallbackIcon = kind === 'error' ? 'cloud-offline-outline' : 'file-tray-outline';

  return (
    <View accessibilityLiveRegion="polite" style={styles.container}>
      {kind === 'loading' ? (
        <ActivityIndicator color={colors.primary} size="large" />
      ) : (
        <IconTile name={icon ?? fallbackIcon} tone={kind === 'error' ? 'danger' : 'neutral'} />
      )}
      {title ? (
        <Text style={styles.center} variant="heading">
          {title}
        </Text>
      ) : null}
      {message ? (
        <Text color="textSecondary" style={[styles.center, styles.message]}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.md,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.huge,
  },
  center: {
    textAlign: 'center',
  },
  message: {
    maxWidth: 320,
  },
  action: {
    marginTop: Spacing.sm,
  },
});
