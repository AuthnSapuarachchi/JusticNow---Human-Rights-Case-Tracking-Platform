import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppNotification } from '@/api/notificationsApi';
import { Text, useColors } from '@/design-system';
import { Layout, Radius, Spacing } from '@/design-system/spacing';

import { notificationIcon } from './notificationIcon';

const VISIBLE_MS = 5000;

/** Slides in from the top for a live notification; tap to open, auto-hides. */
export function NotificationToast({ notification, onDismiss }: { notification: AppNotification | null; onDismiss: () => void }) {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [offset] = useState(() => new Animated.Value(-160));

  useEffect(() => {
    if (!notification) return;
    offset.setValue(-160);
    Animated.spring(offset, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 4 }).start();
    const timer = setTimeout(() => {
      Animated.timing(offset, { toValue: -160, duration: 220, useNativeDriver: true }).start(() => onDismiss());
    }, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [notification, offset, onDismiss]);

  if (!notification) return null;

  return (
    <Animated.View pointerEvents="box-none" style={[styles.host, { top: insets.top + Spacing.sm, transform: [{ translateY: offset }] }]}>
      <Pressable
        accessibilityHint="Opens the related screen"
        accessibilityLiveRegion="polite"
        accessibilityRole="button"
        onPress={() => {
          onDismiss();
          router.push(notification.href as Href);
        }}
        style={({ pressed }) => [styles.toast, { backgroundColor: colors.surfaceInverse }, pressed && styles.pressed]}
      >
        <View style={[styles.icon, { backgroundColor: colors.primary }]}>
          <Ionicons color={colors.textOnPrimary} name={notificationIcon(notification.type)} size={20} />
        </View>
        <View style={styles.copy}>
          <Text numberOfLines={1} style={{ color: colors.textInverse }} variant="bodyStrong">{notification.title}</Text>
          {notification.body ? (
            <Text numberOfLines={2} style={{ color: colors.textInverse, opacity: 0.8 }} variant="caption">{notification.body}</Text>
          ) : null}
        </View>
        <Pressable accessibilityLabel="Dismiss" hitSlop={10} onPress={onDismiss}>
          <Ionicons color={colors.textInverse} name="close" size={20} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: { left: Layout.screenPadding, position: 'absolute', right: Layout.screenPadding, zIndex: 1000 },
  toast: {
    alignItems: 'center',
    borderRadius: Radius.lg,
    elevation: 8,
    flexDirection: 'row',
    gap: Spacing.md,
    maxWidth: 520,
    padding: Spacing.md,
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    width: '100%',
    alignSelf: 'center',
  },
  icon: { alignItems: 'center', borderRadius: Radius.md, height: 40, justifyContent: 'center', width: 40 },
  copy: { flex: 1, gap: 2 },
  pressed: { opacity: 0.9 },
});
