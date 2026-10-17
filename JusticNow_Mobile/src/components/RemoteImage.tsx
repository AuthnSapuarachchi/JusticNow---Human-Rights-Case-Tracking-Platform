import { Ionicons } from '@expo/vector-icons';
import { Image, type ImageContentFit } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ImageStyle, type ViewStyle } from 'react-native';

import { Text, useColors } from '@/design-system';
import { Spacing } from '@/design-system/spacing';

interface RemoteImageProps {
  uri: string;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  /** Placeholder text colour; use 'light' over the dark full-screen viewer. */
  tone?: 'default' | 'light';
  accessibilityLabel?: string;
}

/**
 * A photo from the server. If it cannot load (file missing, or a HEIC photo the
 * device cannot decode) it shows a labelled "Photo unavailable" box instead of a
 * blank space, so the person knows something is there.
 */
export function RemoteImage({ uri, style, contentFit = 'cover', tone = 'default', accessibilityLabel }: RemoteImageProps) {
  const colors = useColors();
  // Remember which uri failed, so a new uri gets a fresh attempt without an effect.
  const [failedUri, setFailedUri] = useState<string | null>(null);

  if (failedUri === uri) {
    const foreground = tone === 'light' ? '#FFFFFF' : colors.textSecondary;
    return (
      <View
        accessibilityLabel="Photo unavailable"
        accessibilityRole="image"
        style={[style as StyleProp<ViewStyle>, styles.placeholder, tone === 'default' && { backgroundColor: colors.surfaceMuted }]}
      >
        <Ionicons color={foreground} name="image-outline" size={28} />
        <Text style={[styles.label, { color: foreground }]} variant="caption">Photo unavailable</Text>
      </View>
    );
  }

  return (
    <Image
      accessibilityLabel={accessibilityLabel}
      contentFit={contentFit}
      onError={() => setFailedUri(uri)}
      source={{ uri }}
      style={style}
      transition={150}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', gap: Spacing.xs, justifyContent: 'center', padding: Spacing.sm },
  label: { textAlign: 'center' },
});
