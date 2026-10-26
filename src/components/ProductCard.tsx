import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { colors, radius, typography, shadows } from '../theme/tokens';
import { PremiumImage } from './PremiumImage';
import { Product, useMobileApp } from '../context/MobileAppContext';

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
  const { favorites, toggleFavorite, addToCart, setSelectedProductId } = useMobileApp();
  const isFav = favorites.includes(product.id);

  // Calculate discount percent
  const discountPercent = product.actPrice && product.actPrice > product.price
    ? Math.round(((product.actPrice - product.price) / product.actPrice) * 100)
    : 0;

  const handleCardPress = () => {
    if (onPress) {
      onPress(product.id);
    } else {
      setSelectedProductId(product.id);
    }
  };

  const handleToggleWishlist = () => {
    toggleFavorite(product.id);
  };

  const handleAddCart = () => {
    addToCart(product);
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

          {/* Discount Badge */}
          {discountPercent > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discountPercent}%</Text>
            </View>
          )}

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

          {/* Price & Add to Cart Row */}
          <View style={styles.priceRow}>
            <View style={styles.priceColumn}>
              <Text style={styles.currentPrice}>₹{product.price.toLocaleString()}</Text>
              {product.actPrice && product.actPrice > product.price ? (
                <Text style={styles.mrpPrice}>₹{product.actPrice.toLocaleString()}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              delayPressIn={0}
              onPress={handleAddCart}
              style={styles.cartButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="shopping-bag" size={17} color={colors.textInverse} />
            </TouchableOpacity>
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
    marginBottom: 8,
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
  },
  priceColumn: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  currentPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  mrpPrice: {
    fontSize: 11,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  cartButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.brandCharcoal,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    ...shadows.subtle,
  },
});

export default ProductCard;
