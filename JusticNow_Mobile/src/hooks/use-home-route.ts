import { useAuth } from '@/context/AuthContext';

/**
 * The home route for the signed-in role (JN-27).
 *
 * The directory and rights screens are reachable by every role, so a hardcoded
 * '/' sent officers and admins to the citizen landing page — the auth redirect
 * then bounced them back, causing a visible double navigation.
 */
export function useHomeRoute(): '/' | '/officer' | '/admin' {
  const { session } = useAuth();

  if (session?.user.role === 'ADMIN') return '/admin';
  if (session?.user.role === 'OFFICER') return '/officer';
  return '/';
}
