import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useMobileApp } from '../context/MobileAppContext';

interface AppHeaderProps {
  onWishlistPress?: () => void;
  onNotificationsPress?: () => void;
  onAccountPress?: () => void;
  onCartPress?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = React.memo(({
  onWishlistPress,
  onNotificationsPress,
  onAccountPress,
  onCartPress,
}) => {
  const { cart, favorites, notifications, setActiveTab, setSelectedProductId, user, isAuthenticated } = useMobileApp();
  const unreadNotifs = notifications.filter(n => !n.read).length;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const displayName = user?.name || (user as any)?.full_name || '';
  const displayEmail = user?.email || '';
  const initialLetter = (displayName.charAt(0) || displayEmail.charAt(0) || 'U').toUpperCase();

  const handleCart = () => {
    setSelectedProductId(null);
    if (onCartPress) {
      onCartPress();
    } else {
      setActiveTab('cart');
    }
  };

  const handleWishlist = () => {
    setSelectedProductId(null);
    if (onWishlistPress) {
      onWishlistPress();
    } else {
      setActiveTab('wishlist');
    }
  };

  const handleAccount = () => {
    setSelectedProductId(null);
    if (onAccountPress) {
      onAccountPress();
    } else {
      setActiveTab('account');
    }
  };

  return (
    <View style={styles.headerContainer}>
      {/* Brand Identity: Authentic Ghar Sansar Logo (matches startup screen) */}
      <TouchableOpacity
        onPress={() => {
          setSelectedProductId(null);
          setActiveTab('home');
        }}
        activeOpacity={0.8}
        style={styles.brandContainer}
      >
        <Image
          source={require('../../assets/logo.png')}
          style={styles.brandLogo}
          resizeMode="contain"
        />
        <Text style={styles.brandSubtitle}>Luxury Home & Kitchen Store</Text>
      </TouchableOpacity>

      {/* Action Buttons: Cart (Left beside Wishlist), Wishlist, Account */}
      <View style={styles.actionsRow}>
        {/* Cart Button: Black symbol outline & wheels with original orange count number */}
        <TouchableOpacity
          onPress={handleCart}
          style={styles.iconButton}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={styles.cartIconWrapper}>
            <Svg width={25} height={22} viewBox="0 0 32 28">
              {/* Cart body: Black stroke */}
              <Path
                d="M 2 5.5 L 7.5 5.5 L 11.5 17.5 L 22.5 17.5 L 26.5 8"
                fill="none"
                stroke={colors.textPrimary}
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Solid black wheels */}
              <Circle cx={13.5} cy={22.5} r={2.2} fill={colors.textPrimary} />
              <Circle cx={20.5} cy={22.5} r={2.2} fill={colors.textPrimary} />
            </Svg>

            {/* Orange quantity number in the cart basket */}
            {cartCount > 0 && (
              <View style={styles.cartCountContainer} pointerEvents="none">
                <Text
                  style={[
                    styles.cartCountNumber,
                    cartCount > 9 && { fontSize: 8.5, letterSpacing: -0.5 },
                  ]}
                  numberOfLines={1}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Wishlist Button */}
        <TouchableOpacity
          onPress={handleWishlist}
          style={styles.iconButton}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="heart" size={20} color={colors.textPrimary} />
          {favorites.length > 0 && (
            <View style={styles.miniDotBadge} />
          )}
        </TouchableOpacity>

        {/* Account Button */}
        <TouchableOpacity
          onPress={handleAccount}
          style={styles.iconButton}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {isAuthenticated && user ? (
            <View style={styles.headerAvatarCircle}>
              <Text style={styles.headerAvatarInitial}>{initialLetter}</Text>
            </View>
          ) : (
            <Feather name="user" size={20} color={colors.textPrimary} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceTertiary,
  },
  brandContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  brandLogo: {
    width: 88,
    height: 34,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.brandForestGreen,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    position: 'relative',
  },
  cartIconWrapper: {
    position: 'relative',
    width: 25,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountContainer: {
    position: 'absolute',
    left: 6,
    width: 14,
    top: -2,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountNumber: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#F08804',
    textAlign: 'center',
    lineHeight: 12,
  },
  miniDotBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.accentRed,
  },
  headerAvatarCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarInitial: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
});

