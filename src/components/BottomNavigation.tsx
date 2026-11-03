import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/tokens';
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
    id: 'home' | 'explore' | 'returnGifts';
    label: string;
    icon: keyof typeof Feather.glyphMap;
  }> = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'explore', label: 'Explore', icon: 'compass' },
    { id: 'returnGifts', label: 'Return Gifts', icon: 'gift' },
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
    <View
      pointerEvents="box-none"
      style={[
        styles.floatingWrapper,
        { bottom: Math.max(insets.bottom, 10) + 8 }
      ]}
    >
      <View style={styles.dockShadow}>
        <View style={styles.dockGlassClip}>
          {/* 1. Underlying Frosted Blur (Hardware-accelerated on iOS; skipped on Android to prevent lag) */}
          {Platform.OS === 'ios' && (
            <BlurView
              intensity={85}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
          )}

          {/* 2. Low-transparency milky backdrop */}
          <View style={styles.milkyGlassOverlay} />

          {/* 3. Glossy Specular Sheen (Apple-style top glass reflection) */}
          <View style={styles.glossHighlightLayer} />
          <View style={styles.glossTopRim} />

          {/* 4. Dock Tabs Content */}
          <View style={styles.navBar}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const activeColor = colors.brandForestGreen;
              const inactiveColor = '#374151';

              return (
                <TouchableOpacity
                  key={tab.id}
                  activeOpacity={0.65}
                  delayPressIn={0}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => handleTabPress(tab.id)}
                  style={styles.tabButton}
                >
                  {/* Circular Layer behind active button (like in the setting button reference) */}
                  <View style={[styles.iconCircle, isActive && styles.iconCircleActive]}>
                    <Feather
                      name={tab.icon}
                      size={21}
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
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    right: 16,
    zIndex: 999,
  },
  dockShadow: {
    width: 265,
    borderRadius: 36,
    // Specular glossy diffused drop shadow
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 10,
  },
  dockGlassClip: {
    width: '100%',
    height: 66,
    borderRadius: 36,
    overflow: 'hidden',
    position: 'relative',
    // Glossy 3D rim border
    borderWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftColor: 'rgba(255, 255, 255, 0.95)',
    borderRightColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomColor: 'rgba(205, 210, 218, 0.55)',
  },
  milkyGlassOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Platform.OS === 'ios'
      ? 'rgba(255, 255, 255, 0.92)'
      : 'rgba(255, 255, 255, 0.94)',
  },
  glossHighlightLayer: {
    position: 'absolute',
    top: 1,
    left: 8,
    right: 8,
    height: 28,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    borderBottomWidth: 0.6,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  glossTopRim: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1.5,
    backgroundColor: '#FFFFFF',
    opacity: 0.9,
    borderRadius: 1,
  },
  navBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    zIndex: 2,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  iconCircleActive: {
    // True circular layer matching the reference image setting button
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 1,
    letterSpacing: -0.15,
  },
});

export default BottomNavigation;
