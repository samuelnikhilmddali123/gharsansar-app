import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography, shadows } from '../theme/tokens';
import { PremiumImage } from './PremiumImage';
import { Product, useMobileApp, formatCurrency } from '../context/MobileAppContext';

interface ProductCardProps {
  product: Product;
  cardWidth?: number;
  onPress?: (productId: string) => void;
  style?: any;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({
  product,
  cardWidth,
  onPress,
  style,
}) => {
  const {
    favorites,
    toggleFavorite,
    cart,
    addToCart,
    updateCartQuantity,
    setSelectedProductId,
    isAuthenticated,
    user,
    setActiveTab,
  } = useMobileApp();
  const isFav = favorites.includes(product.id);

  // Get current quantity of this product in cart
  const cartItem = cart.find(
    (item) => item.product?.id === product.id || (item as any).id === product.id
  );
  const quantity = cartItem ? cartItem.quantity : 0;

  // 3-Price Architecture: Dominant Customer Final Price & Strikethrough Strike Price (MRP)
  const finalPrice = product.finalPrice !== undefined ? product.finalPrice : (product.price !== undefined ? product.price : product.actualPrice);
  const strike = product.strikePrice || product.actPrice || 0;
  const hasSavings = strike > finalPrice;
  const hasCategoryPromo = Boolean(product.hasCategoryDiscount && product.categoryDiscountPercentage > 0);

  // Return Gift bulk rules
  const isReturnGift = Boolean(
    product.isReturnGift ||
    product.category === 'Return Gifts' ||
    product.category === 'return_gifts' ||
    String(product.id).startsWith('rg-')
  );

  // Badge Display Rules:
  // Rule A (Category Discount ON): Show `{categoryDiscountPercentage}% OFF`
  // Rule B (Category Discount OFF): Show `round(((strikePrice - finalPrice) / strikePrice) * 100)% OFF` if strike > finalPrice
  const discountBadgeText = hasCategoryPromo
    ? `${product.categoryDiscountPercentage}% OFF`
    : (hasSavings && strike > 0 ? `${Math.round(((strike - finalPrice) / strike) * 100)}% OFF` : null);

  const handleCardPress = () => {
    if (onPress) {
      onPress(product.id);
    } else {
      setSelectedProductId(product.id);
    }
  };

  const handleToggleWishlist = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    toggleFavorite(product.id);
  };

  const handleAddCart = (e?: any) => {
    e?.stopPropagation?.();
    if (!isAuthenticated || !user) {
      setSelectedProductId(null);
      setActiveTab('account');
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    addToCart(product, isReturnGift ? 50 : 1);
  };

  const handleIncrement = (e?: any) => {
    e?.stopPropagation?.();
    if (!isAuthenticated || !user) {
      setSelectedProductId(null);
      setActiveTab('account');
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    updateCartQuantity(product.id, 1);
  };

  const handleDecrement = (e?: any) => {
    e?.stopPropagation?.();
    if (!isAuthenticated || !user) {
      setSelectedProductId(null);
      setActiveTab('account');
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (isReturnGift && quantity <= 50) {
      updateCartQuantity(product.id, -quantity);
    } else {
      updateCartQuantity(product.id, -1);
    }
  };

  return (
    <View style={[styles.card, cardWidth ? { width: cardWidth } : { flex: 1 }, style]}>
      <TouchableOpacity
        activeOpacity={0.8}
        delayPressIn={0}
        onPress={handleCardPress}
        style={styles.cardTouchable}
      >
        {/* Top Image Container - Pure white, seamless without square layer */}
        <View style={styles.imageContainer}>
          <PremiumImage
            uri={product.image}
            style={styles.image}
            contentFit="contain"
            product={product}
          />

          {/* Discount Badge (Promotional category discount or strike/actual price difference) */}
          {discountBadgeText ? (
            <View style={[styles.discountBadge, hasCategoryPromo && styles.categoryDiscountBadge]}>
              <Text style={styles.discountText}>{discountBadgeText}</Text>
            </View>
          ) : null}

          {/* Wishlist Heart Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            delayPressIn={0}
            onPress={handleToggleWishlist}
            style={styles.wishlistButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={18}
              color={isFav ? colors.accentRed : colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Product Details Block */}
        <View style={styles.infoBlock}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {product.title}
          </Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color={colors.starYellow} />
            <Text style={styles.ratingScore}>{product.rating ? product.rating.toFixed(1) : '4.5'}</Text>
            <Text style={styles.reviewsCount}>({product.reviewsCount || 12})</Text>
          </View>

          {/* Price & Stepper Row - Image 4 Format */}
          <View style={styles.priceRow}>
            {/* Price Column: Strikethrough Strike Price (MRP) on top if strike > finalPrice, Dominant Final Price below */}
            <View style={styles.priceColumn}>
              {hasSavings ? (
                <Text style={styles.mrpPrice}>₹{formatCurrency(strike)}</Text>
              ) : (
                <View style={styles.mrpPlaceholder} />
              )}
              <View style={styles.priceWithUnitRow}>
                <Text style={styles.currentPrice}>₹{formatCurrency(finalPrice)}</Text>
                {isReturnGift && (
                  <Text style={styles.unitText}>/pc</Text>
                )}
              </View>
            </View>

            {/* Stepper / ADD Pill Button (Image 4 Design) */}
            {quantity > 0 ? (
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleDecrement}
                  style={styles.stepperBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Feather name="minus" size={13} color={colors.accentGreen} />
                </TouchableOpacity>

                <Text style={styles.stepperValue}>{quantity}</Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleIncrement}
                  style={styles.stepperBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Feather name="plus" size={13} color={colors.accentGreen} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleAddCart}
                style={styles.addBtn}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <Text style={styles.addBtnText}>ADD</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    ...shadows.subtle,
  },
  cardTouchable: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF', // Seamless white, no square layer
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.accentRed,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
    zIndex: 2,
  },
  categoryDiscountBadge: {
    backgroundColor: colors.accentGreen,
  },
  discountText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  infoBlock: {
    padding: 10,
    paddingTop: 4,
    justifyContent: 'space-between',
    flex: 1,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 17,
    minHeight: 34,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 6,
  },
  ratingScore: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  reviewsCount: {
    fontSize: 11,
    color: colors.textMuted,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  priceColumn: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    flex: 1,
    marginRight: 6,
  },
  mrpPrice: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textMuted,
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  mrpPlaceholder: {
    height: 15,
  },
  currentPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.4,
    lineHeight: 22,
  },
  priceWithUnitRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  unitText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#DFE2E5',
    height: 32,
    minWidth: 72,
    paddingHorizontal: 2,
    ...shadows.subtle,
  },
  stepperBtn: {
    width: 24,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    minWidth: 18,
    textAlign: 'center',
  },
  addBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.sm,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 135, 90, 0.4)',
    height: 32,
    minWidth: 72,
    paddingHorizontal: 12,
    ...shadows.subtle,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.accentGreen,
    letterSpacing: 0.6,
  },
});

export default ProductCard;
