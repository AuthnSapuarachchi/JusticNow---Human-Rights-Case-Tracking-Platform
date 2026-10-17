import { BackHandler, Linking, Platform } from 'react-native';

/** A neutral page to land on, so nothing on screen hints at this app. */
const NEUTRAL_URL = 'https://www.google.com';

/**
 * Safety feature: leaves the app immediately if someone is watching.
 *
 * - Android: closes the app.
 * - Web: replaces the page (so Back does not return here).
 * - iOS: apps cannot close themselves, so it switches to a neutral web page.
 */
export function quickExit() {
  if (Platform.OS === 'android') {
    BackHandler.exitApp();
    return;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.replace(NEUTRAL_URL);
    return;
  }

  Linking.openURL(NEUTRAL_URL).catch(() => undefined);
}
