import { Image } from 'expo-image';
import type { StyleProp, ImageStyle } from 'react-native';

export type BrandLogoProps = {
  /** Rendered width and height in points. */
  size?: number;
  style?: StyleProp<ImageStyle>;
};

/**
 * The JusticeNow logo (gold scales on a navy rounded tile, transparent
 * corners). Use it wherever the app
 * identifies itself — auth screens and dashboard headers — instead of a
 * generic icon.
 */
export function BrandLogo({ size = 64, style }: BrandLogoProps) {
  return (
    <Image
      accessibilityLabel="JusticeNow logo"
      accessibilityRole="image"
      contentFit="contain"
      source={require('@/assets/images/justiceNow-logo.png')}
      style={[{ height: size, width: size }, style]}
    />
  );
}
