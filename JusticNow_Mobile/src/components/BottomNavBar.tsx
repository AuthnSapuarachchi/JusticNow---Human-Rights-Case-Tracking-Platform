import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export enum NavTab {
  Home = 'Home',
  Cases = 'Cases',
  Messages = 'Messages',
  Support = 'Support',
}

interface BottomNavBarProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const tabs: Array<{ label: NavTab; activeIcon: IoniconName; inactiveIcon: IoniconName }> = [
  { label: NavTab.Home, activeIcon: 'home', inactiveIcon: 'home-outline' },
  { label: NavTab.Cases, activeIcon: 'folder', inactiveIcon: 'folder-outline' },
  { label: NavTab.Messages, activeIcon: 'chatbubble', inactiveIcon: 'chatbubble-outline' },
  { label: NavTab.Support, activeIcon: 'help-circle', inactiveIcon: 'help-circle-outline' },
];

export function BottomNavBar({ activeTab, onTabPress }: BottomNavBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safeArea, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        {tabs.map(({ label, activeIcon, inactiveIcon }) => {
          const isActive = activeTab === label;

          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              key={label}
              onPress={() => onTabPress(label)}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
            >
              <View style={[styles.iconCircle, isActive && styles.activeIconCircle]}>
                <Ionicons
                  color={isActive ? '#ffffff' : '#87939b'}
                  name={isActive ? activeIcon : inactiveIcon}
                  size={21}
                />
              </View>
              <Text style={[styles.label, isActive && styles.activeLabel]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#ffffff',
    borderTopColor: '#e4e9ec',
    borderTopWidth: StyleSheet.hairlineWidth,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  bar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    minHeight: 68,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  iconCircle: {
    alignItems: 'center',
    borderRadius: 20,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  activeIconCircle: {
    backgroundColor: '#2875d0',
  },
  label: {
    color: '#87939b',
    fontSize: 11,
    fontWeight: '600',
  },
  activeLabel: {
    color: '#2875d0',
  },
  pressed: {
    opacity: 0.7,
  },
});