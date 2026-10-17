import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';

import { getNotifications, type AppNotification } from '@/api/notificationsApi';
import { getSocket } from '@/api/socket';
import { NotificationToast } from '@/components/NotificationToast';
import { useAuth } from '@/context/AuthContext';

type NotificationContextValue = {
  /** False for citizens and for officers still awaiting verification. */
  enabled: boolean;
  items: AppNotification[];
  unreadCount: number;
  isUnread: (item: AppNotification) => boolean;
  markAllSeen: () => void;
  refresh: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const seenKey = (userId: number) => `justicenow.notifications.seenAt.${userId}`;

/** One player for the app; replays from the start each time. */
let chime: AudioPlayer | null = null;
function playChime() {
  try {
    chime ??= createAudioPlayer(require('@/assets/sounds/notification.wav'));
    chime.seekTo(0);
    chime.play();
  } catch {
    // Sound is a nice-to-have (e.g. browsers may block autoplay); never break the app over it.
  }
}

/**
 * Notifications for admins and officers.
 *
 * The list comes from the server; "read" is tracked on this device as the time
 * the user last opened the bell. A chime plays once after login when there is
 * something new, and again for every live event that is not silent.
 */
export function NotificationProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const user = session?.user;
  const isVerified = user?.verificationStatus === 'APPROVED' || user?.verificationStatus === 'NOT_REQUIRED' || !user?.verificationStatus;
  const enabled = Boolean(user && (user.role === 'ADMIN' || (user.role === 'OFFICER' && isVerified)));
  const userId = enabled ? user?.id : undefined;

  const [items, setItems] = useState<AppNotification[]>([]);
  const [seenAt, setSeenAt] = useState(0);
  const [toast, setToast] = useState<AppNotification | null>(null);
  const chimedForUser = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      setItems(await getNotifications());
    } catch {
      // Keep the last list; the next live event or app resume will retry.
    }
  }, [userId]);

  // Load once per signed-in user, then chime if anything arrived since they last looked.
  useEffect(() => {
    if (!userId) return;
    let active = true;
    (async () => {
      const storedSeenAt = Number(await AsyncStorage.getItem(seenKey(userId)).catch(() => null)) || 0;
      let loaded: AppNotification[] = [];
      try {
        loaded = await getNotifications();
      } catch {
        loaded = [];
      }
      if (!active) return;
      setSeenAt(storedSeenAt);
      setItems(loaded);
      const hasNew = loaded.some((item) => new Date(item.createdAt).getTime() > storedSeenAt);
      if (hasNew && chimedForUser.current !== userId) {
        chimedForUser.current = userId;
        playChime();
      }
    })();
    return () => { active = false; };
  }, [userId]);

  // Live events from the server.
  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    const handle = (event: AppNotification) => {
      refresh();
      if (event.silent) return;
      playChime();
      setToast(event);
    };
    socket.on('notification:new', handle);
    return () => { socket.off('notification:new', handle); };
  }, [userId, refresh]);

  // Catch up when the app returns to the foreground.
  useEffect(() => {
    if (!userId) return;
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    return () => subscription.remove();
  }, [userId, refresh]);

  const dismissToast = useCallback(() => setToast(null), []);

  const markAllSeen = useCallback(() => {
    if (!userId) return;
    const now = Date.now();
    setSeenAt(now);
    AsyncStorage.setItem(seenKey(userId), String(now)).catch(() => undefined);
  }, [userId]);

  const value = useMemo<NotificationContextValue>(() => {
    const isUnread = (item: AppNotification) => new Date(item.createdAt).getTime() > seenAt;
    // After logout the last user's list is hidden rather than cleared in an effect.
    const visible = enabled ? items : [];
    return { enabled, items: visible, unreadCount: visible.filter(isUnread).length, isUnread, markAllSeen, refresh };
  }, [enabled, items, seenAt, markAllSeen, refresh]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationToast notification={toast} onDismiss={dismissToast} />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used inside NotificationProvider');
  return context;
}
