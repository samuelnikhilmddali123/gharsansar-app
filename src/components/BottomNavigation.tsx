import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadows } from '../theme/tokens';
import { useMobileApp } from '../context/MobileAppContext';

interface BottomNavigationProps {
  activeTab: 'home' | 'explore' | 'cart' | 'wishlist' | 'account' | 'returnGifts';
  onSelectTab: (tab: 'home' | 'explore' | 'cart' | 'wishlist' | 'account' | 'returnGifts') => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = React.memo(({
  activeTab,
  onSelectTab,
}) => {
  const insets = useSafeAreaInsets();
  const { setSelectedProductId } = useMobileApp();

  const tabs: Array<{
    id: 'home' | 'explore' | 'returnGifts' | 'account';
    label: string;
    icon: keyof typeof Feather.glyphMap;
  }> = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'explore', label: 'Explore', icon: 'compass' },
    { id: 'returnGifts', label: 'Return Gifts', icon: 'gift' },
    { id: 'account', label: 'Account', icon: 'user' },
  ];

  const handleTabPress = (tabId: typeof activeTab) => {
    if (tabId === activeTab) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSelectedProductId(null);
    onSelectTab(tabId);
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.navBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const activeColor = colors.brandForestGreen;
          const inactiveColor = colors.textMuted;

          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.65}
              delayPressIn={0}
              hitSlop={{ top: 8, bottom: 8, left: 10, right: 10 }}
              onPress={() => handleTabPress(tab.id)}
              style={styles.tabButton}
            >
              <View style={styles.iconContainer}>
                <Feather
                  name={tab.icon}
                  size={22}
                  color={isActive ? activeColor : inactiveColor}
                />
              </View>

              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? activeColor : inactiveColor,
                    fontWeight: isActive ? '700' : '500',
                  }
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceTertiary,
    ...shadows.bottomNav,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 54,
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 24,
  },
  tabLabel: {
    fontSize: 10.5,
    marginTop: 2,
    letterSpacing: -0.1,
  },
});

export default BottomNavigation;
