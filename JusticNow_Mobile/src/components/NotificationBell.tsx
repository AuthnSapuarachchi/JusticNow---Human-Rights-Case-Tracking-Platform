import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StateView, Text, useColors } from '@/design-system';
import { Layout, Radius, Spacing } from '@/design-system/spacing';
import { useNotifications } from '@/context/NotificationContext';

import { notificationIcon } from './notificationIcon';

const timeAgo = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(iso));
};

/** Header bell with an unread badge; opens the notification list. */
export function NotificationBell() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { enabled, items, unreadCount, isUnread, markAllSeen } = useNotifications();
  const [open, setOpen] = useState(false);
  // Snapshot of what was unread when the sheet opened, so highlights don't vanish instantly.
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());

  if (!enabled) return null;

  const openSheet = () => {
    setUnreadIds(new Set(items.filter(isUnread).map((item) => item.id)));
    setOpen(true);
    markAllSeen();
  };

  const badge = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <>
      <Pressable
        accessibilityLabel={unreadCount ? `Notifications, ${unreadCount} new` : 'Notifications'}
        accessibilityRole="button"
        hitSlop={6}
        onPress={openSheet}
        style={({ pressed }) => [styles.bell, { backgroundColor: colors.surfaceMuted }, pressed && styles.pressed]}
      >
        <Ionicons color={colors.textPrimary} name={unreadCount ? 'notifications' : 'notifications-outline'} size={22} />
        {unreadCount ? (
          <View style={[styles.badge, { backgroundColor: colors.danger, borderColor: colors.surface }]}>
            <Text style={[styles.badgeText, { color: colors.textOnPrimary }]}>{badge}</Text>
          </View>
        ) : null}
      </Pressable>

      <Modal animationType="fade" onRequestClose={() => setOpen(false)} transparent visible={open}>
        <Pressable accessibilityLabel="Close notifications" onPress={() => setOpen(false)} style={styles.backdrop} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
          <View style={styles.sheetHeader}>
            <Text variant="heading">Notifications</Text>
            <Pressable accessibilityLabel="Close" accessibilityRole="button" hitSlop={6} onPress={() => setOpen(false)} style={styles.close}>
              <Ionicons color={colors.textSecondary} name="close" size={24} />
            </Pressable>
          </View>
          <FlatList
            contentContainerStyle={items.length ? styles.list : styles.emptyList}
            data={items}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<StateView icon="notifications-off-outline" kind="empty" message="New activity will appear here as it happens." title="You're all caught up" />}
            renderItem={({ item }) => {
              const fresh = unreadIds.has(item.id);
              return (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setOpen(false);
                    router.push(item.href as Href);
                  }}
                  style={({ pressed }) => [styles.row, { backgroundColor: fresh ? colors.primarySoft : 'transparent' }, pressed && styles.pressed]}
                >
                  <View style={[styles.rowIcon, { backgroundColor: fresh ? colors.surface : colors.surfaceMuted }]}>
                    <Ionicons color={colors.primary} name={notificationIcon(item.type)} size={20} />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text variant="bodyStrong">{item.title}</Text>
                    {item.body ? <Text color="textSecondary" numberOfLines={2} variant="caption">{item.body}</Text> : null}
                    <Text color="textTertiary" variant="caption">{timeAgo(item.createdAt)}</Text>
                  </View>
                  {fresh ? <View accessibilityLabel="New" style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bell: { alignItems: 'center', borderRadius: Layout.minTapTarget / 2, height: Layout.minTapTarget, justifyContent: 'center', width: Layout.minTapTarget },
  badge: { alignItems: 'center', borderRadius: 11, borderWidth: 2, height: 22, justifyContent: 'center', minWidth: 22, paddingHorizontal: 4, position: 'absolute', right: -4, top: -4 },
  badgeText: { fontSize: 14, fontWeight: '800', lineHeight: 16 },
  pressed: { opacity: 0.7 },
  backdrop: { backgroundColor: 'rgba(13, 27, 42, 0.45)', flex: 1 },
  sheet: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, maxHeight: '80%', minHeight: '40%' },
  handle: { alignSelf: 'center', borderRadius: 2, height: 4, marginTop: Spacing.sm, width: 40 },
  sheetHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Layout.screenPadding, paddingVertical: Spacing.sm },
  close: { alignItems: 'center', height: Layout.minTapTarget, justifyContent: 'center', width: Layout.minTapTarget },
  list: { gap: Spacing.xs, paddingHorizontal: Spacing.md },
  emptyList: { flexGrow: 1 },
  row: { alignItems: 'center', borderRadius: Radius.md, flexDirection: 'row', gap: Spacing.md, padding: Spacing.md },
  rowIcon: { alignItems: 'center', borderRadius: Radius.md, height: 40, justifyContent: 'center', width: 40 },
  rowCopy: { flex: 1, gap: 2 },
  dot: { borderRadius: 5, height: 10, width: 10 },
});
