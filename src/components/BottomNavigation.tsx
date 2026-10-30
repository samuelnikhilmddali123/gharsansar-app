import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, shadows } from '../theme/tokens';
import { useMobileApp } from '../context/MobileAppContext';

interface BottomNavigationProps {
  activeTab: 'home' | 'explore' | 'cart' | 'wishlist' | 'account';
  onSelectTab: (tab: 'home' | 'explore' | 'cart' | 'wishlist' | 'account') => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = React.memo(({
  activeTab,
  onSelectTab,
}) => {
  const insets = useSafeAreaInsets();
  const { cart, setSelectedProductId, user, isAuthenticated } = useMobileApp();

  const displayName = user?.name || (user as any)?.full_name || '';
  const displayEmail = user?.email || '';
  const initialLetter = (displayName.charAt(0) || displayEmail.charAt(0) || 'U').toUpperCase();

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const tabs: Array<{
    id: 'home' | 'explore' | 'wishlist' | 'account';
    label: string;
    icon: keyof typeof Feather.glyphMap;
  }> = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'explore', label: 'Explore', icon: 'compass' },
    { id: 'wishlist', label: 'Wishlist', icon: 'heart' },
    { id: 'account', label: 'Account', icon: 'user' },
  ];

  const handleTabPress = (tabId: typeof activeTab) => {
    setSelectedProductId(null);
    onSelectTab(tabId);
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.navBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const activeColor = colors.brandForestGreen;
          const inactiveColor = colors.textMuted;

          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.6}
              delayPressIn={0}
              hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
              onPress={() => handleTabPress(tab.id)}
              style={styles.tabButton}
            >
              <View style={styles.iconContainer}>
                {tab.id === 'account' && isAuthenticated && user ? (
                  <View
                    style={[
                      styles.bottomNavAvatar,
                      isActive && styles.bottomNavAvatarActive,
                    ]}
                  >
                    <Text style={styles.bottomNavAvatarText}>{initialLetter}</Text>
                  </View>
                ) : (
                  <Feather
                    name={tab.icon}
                    size={20}
                    color={isActive ? activeColor : inactiveColor}
                  />
                )}
              </View>

              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? activeColor : inactiveColor, fontWeight: isActive ? '700' : '500' }
                ]}
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
    height: 56,
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 24,
  },
  tabLabel: {
    fontSize: 10.5,
    marginTop: 3,
    letterSpacing: -0.1,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accentRed,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: colors.textInverse,
    fontSize: 9,
    fontWeight: '800',
  },
  bottomNavAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavAvatarActive: {
    backgroundColor: '#043927',
  },
  bottomNavAvatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
});
