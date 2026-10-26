import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMobileApp } from '../context/MobileAppContext';
import { colors, shadows } from '../theme/tokens';

export const FloatingCartPill: React.FC = () => {
  const { cart, activeTab, setActiveTab, selectedProductId, setSelectedProductId } = useMobileApp();
  const insets = useSafeAreaInsets();

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const prevCount = useRef(totalItems);

  useEffect(() => {
    if (totalItems > 0 && activeTab !== 'cart' && !selectedProductId) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 55,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Trigger bounce on item addition
      if (totalItems > prevCount.current) {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}

        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1.14,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.spring(bounceAnim, {
            toValue: 1,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } else {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    prevCount.current = totalItems;
  }, [totalItems, activeTab, selectedProductId]);

  if (totalItems === 0 || activeTab === 'cart' || selectedProductId) {
    return null;
  }

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setSelectedProductId(null);
    setActiveTab('cart');
  };

  // Positioned above the bottom navigation bar in the bottom right corner
  const bottomPosition = Math.max(insets.bottom, 12) + 68;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: bottomPosition,
          transform: [
            { scale: Animated.multiply(scaleAnim, bounceAnim) },
          ],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handlePress}
        style={styles.cartButton}
      >
        {/* Exact Amazon-style Shopping Cart with open basket and count */}
        <View style={styles.cartIconWrapper}>
          <Svg width={28} height={24} viewBox="0 0 32 28">
            {/* Cart body: horizontal handle, slanted back, flat bottom, slanted front */}
            <Path
              d="M 2 5.5 L 7.5 5.5 L 11.5 17.5 L 22.5 17.5 L 26.5 8"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={2.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Two solid white wheels underneath */}
            <Circle cx={13.5} cy={22.5} r={2.2} fill="#FFFFFF" />
            <Circle cx={20.5} cy={22.5} r={2.2} fill="#FFFFFF" />
          </Svg>
          {/* Orange count number centered in the open trough */}
          <View style={styles.cartCountContainer} pointerEvents="none">
            <Text
              style={[
                styles.cartCountNumber,
                totalItems > 9 && { fontSize: 9.5, letterSpacing: -0.5 },
              ]}
              numberOfLines={1}
            >
              {totalItems > 99 ? '99+' : totalItems}
            </Text>
          </View>
        </View>

        {/* Prominent 'Cart' Text */}
        <Text style={styles.cartTitleText}>Cart</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    zIndex: 1000,
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brandCharcoal,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6, // Sleek rectangle with subtle corner curve
    borderWidth: 1,
    borderColor: colors.brandGold,
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 4,
  },
  cartIconWrapper: {
    position: 'relative',
    width: 28,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountContainer: {
    position: 'absolute',
    left: 7,
    width: 16,
    top: 0,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cartCountNumber: {
    fontSize: 11,
    fontWeight: '900',
    color: '#F08804',
    textAlign: 'center',
    lineHeight: 13,
  },
  cartTitleText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.2,
    lineHeight: 20,
  },
});

export default FloatingCartPill;
