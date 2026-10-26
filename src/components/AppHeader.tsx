import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useMobileApp } from '../context/MobileAppContext';

interface AppHeaderProps {
  onWishlistPress?: () => void;
  onNotificationsPress?: () => void;
  onAccountPress?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = React.memo(({
  onWishlistPress,
  onNotificationsPress,
  onAccountPress,
}) => {
  const { favorites, notifications, setActiveTab, setSelectedProductId } = useMobileApp();
  const unreadNotifs = notifications.filter(n => !n.read).length;

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
      {/* Brand Identity: Logo + Typography */}
      <View style={styles.brandRow}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.brandTextGroup}>
          <Text style={styles.brandTitle}>GHAR SANSAR</Text>
          <Text style={styles.brandSubtitle}>Luxury Home & Kitchen Store</Text>
        </View>
      </View>

      {/* Action Buttons: Clean 38-40px touch targets */}
      <View style={styles.actionsRow}>
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


        <TouchableOpacity
          onPress={handleAccount}
          style={styles.iconButton}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="user" size={20} color={colors.textPrimary} />
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  brandTextGroup: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.brandForestGreen,
    letterSpacing: 0.3,
    marginTop: 1,
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
  miniDotBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.accentRed,
  },
  badgeContainer: {
    position: 'absolute',
    top: 5,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accentRed,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: 9,
    fontWeight: '800',
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 19,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    height: 38,
    gap: 3,
  },
  cartIconWrapper: {
    position: 'relative',
    width: 25,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountContainer: {
    position: 'absolute',
    top: -4,
    left: 7,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountNumber: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#E67A00',
  },
  cartWord: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
});
