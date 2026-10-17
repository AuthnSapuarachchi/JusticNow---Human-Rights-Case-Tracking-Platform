import { Ionicons } from '@expo/vector-icons';
import { Children, isValidElement, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Layout, Spacing } from '../spacing';
import { useColors } from '../use-colors';

export type HorizontalScrollerProps = {
  children: ReactNode;
  /** Space between items. */
  gap?: number;
  /** Inner side padding, so the first/last item line up with the screen edge. */
  inset?: number;
  /** Colour of whatever sits behind the row; the edge fades blend into it. */
  backgroundColor?: string;
  /** Index of the selected child; it is scrolled into view when it changes. */
  activeIndex?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const FADE_WIDTH = 28;
const FADE_STEPS = 7;
const EDGE_SLOP = 4;

/**
 * A horizontally scrolling row (filter chips, tabs).
 *
 * Scrolls edge to edge while keeping the usual screen padding inside, fades the
 * edge that has more content so people can tell the row scrolls, and on the web
 * adds wheel scrolling and arrow buttons because there is no swipe.
 */
export function HorizontalScroller({
  children,
  gap = Spacing.sm,
  inset = Layout.screenPadding,
  backgroundColor,
  activeIndex,
  style,
  accessibilityLabel,
}: HorizontalScrollerProps) {
  const colors = useColors();
  const fadeColor = backgroundColor ?? colors.canvas;
  const scrollRef = useRef<ScrollView>(null);
  const itemLayouts = useRef<{ x: number; width: number }[]>([]);
  const [viewWidth, setViewWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [offset, setOffset] = useState(0);

  const canScroll = contentWidth > viewWidth + EDGE_SLOP;
  const showStart = canScroll && offset > EDGE_SLOP;
  const showEnd = canScroll && offset + viewWidth < contentWidth - EDGE_SLOP;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => setOffset(event.nativeEvent.contentOffset.x);

  const scrollBy = (direction: 1 | -1) => {
    const target = Math.max(0, Math.min(contentWidth - viewWidth, offset + direction * viewWidth * 0.7));
    scrollRef.current?.scrollTo({ x: target, animated: true });
  };

  // Keep the selected chip visible (e.g. after a filter is restored or changed elsewhere).
  useEffect(() => {
    if (activeIndex === undefined || !viewWidth) return;
    const item = itemLayouts.current[activeIndex];
    if (!item) return;
    const visibleStart = offset;
    const visibleEnd = offset + viewWidth;
    if (item.x - inset < visibleStart || item.x + item.width + inset > visibleEnd) {
      const centred = item.x + item.width / 2 - viewWidth / 2;
      scrollRef.current?.scrollTo({ x: Math.max(0, Math.min(contentWidth - viewWidth, centred)), animated: true });
    }
    // Only react to selection changes, not every scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, viewWidth]);

  // Web: let a normal mouse wheel scroll the row sideways.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = (scrollRef.current as unknown as { getScrollableNode?: () => HTMLElement | null })?.getScrollableNode?.();
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const max = node.scrollWidth - node.clientWidth;
      const next = node.scrollLeft + event.deltaY;
      // Only hijack the wheel while the row can still move that way; otherwise the page scrolls.
      if ((event.deltaY > 0 && node.scrollLeft < max) || (event.deltaY < 0 && node.scrollLeft > 0)) {
        event.preventDefault();
        node.scrollLeft = Math.max(0, Math.min(max, next));
      }
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, []);

  // Flattens mapped arrays and drops null/false so they don't add empty gaps.
  const items = Children.toArray(children);

  return (
    <View accessibilityLabel={accessibilityLabel} style={[styles.container, style]}>
      <ScrollView
        contentContainerStyle={[styles.content, { gap, paddingHorizontal: inset }]}
        decelerationRate="fast"
        horizontal
        onContentSizeChange={(width) => setContentWidth(width)}
        onLayout={(event: LayoutChangeEvent) => setViewWidth(event.nativeEvent.layout.width)}
        onScroll={handleScroll}
        ref={scrollRef}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
      >
        {items.map((child, index) => (
          <View
            key={isValidElement(child) && child.key != null ? child.key : index}
            onLayout={(event) => { itemLayouts.current[index] = event.nativeEvent.layout; }}
          >
            {child}
          </View>
        ))}
      </ScrollView>

      {showStart ? <EdgeFade color={fadeColor} side="start" /> : null}
      {showEnd ? <EdgeFade color={fadeColor} side="end" /> : null}

      {Platform.OS === 'web' && showStart ? (
        <ArrowButton direction={-1} onPress={() => scrollBy(-1)} />
      ) : null}
      {Platform.OS === 'web' && showEnd ? (
        <ArrowButton direction={1} onPress={() => scrollBy(1)} />
      ) : null}
    </View>
  );
}

/** A soft gradient built from a few translucent strips (no gradient dependency needed). */
function EdgeFade({ color, side }: { color: string; side: 'start' | 'end' }) {
  const strips = Array.from({ length: FADE_STEPS }, (_, index) => {
    const strength = (index + 1) / FADE_STEPS; // 0 → 1 towards the edge
    const alpha = Math.round(strength * strength * 255).toString(16).padStart(2, '0');
    return <View key={index} style={[styles.strip, { backgroundColor: `${color}${alpha}` }]} />;
  });

  return (
    <View
      pointerEvents="none"
      style={[styles.fade, side === 'start' ? styles.fadeStart : styles.fadeEnd]}
    >
      {side === 'start' ? strips.reverse() : strips}
    </View>
  );
}

function ArrowButton({ direction, onPress }: { direction: 1 | -1; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityLabel={direction > 0 ? 'Scroll right' : 'Scroll left'}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.arrow,
        direction > 0 ? styles.arrowEnd : styles.arrowStart,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons color={colors.textPrimary} name={direction > 0 ? 'chevron-forward' : 'chevron-back'} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  content: { alignItems: 'center', flexDirection: 'row' },
  fade: { bottom: 0, flexDirection: 'row', position: 'absolute', top: 0, width: FADE_WIDTH },
  fadeStart: { left: 0 },
  fadeEnd: { right: 0 },
  strip: { flex: 1 },
  arrow: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    height: 32,
    justifyContent: 'center',
    marginTop: -16,
    position: 'absolute',
    top: '50%',
    width: 32,
  },
  arrowStart: { left: Spacing.xs },
  arrowEnd: { right: Spacing.xs },
  pressed: { opacity: 0.7 },
});
