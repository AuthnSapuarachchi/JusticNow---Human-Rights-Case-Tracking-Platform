import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/context/AuthContext';

/**
 * Sends anyone who is not an ADMIN away from the content management screens.
 *
 * These screens live outside /admin, so the shared auth redirect does not gate
 * them by role — this guard does it explicitly rather than relying on where the
 * route happens to sit. The API is admin-only regardless, so this is about
 * showing the right screen, not about protecting the data.
 *
 * Returns false while loading or when the user should not be here, so callers
 * can hold off rendering.
 */
export function useManageAccess(): boolean {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const canManage = session?.user.role === 'ADMIN';

  useEffect(() => {
    if (isLoading || canManage) return;
    router.replace(session ? '/' : '/login');
  }, [isLoading, canManage, session, router]);

  return canManage;
}
