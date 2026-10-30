import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, shadows } from '../theme/tokens';
import { normalizeImageUrl } from '../config/api';

interface FeaturedCollectionCardProps {
  category: {
    name: string;
    image?: string;
    count?: number;
  };
  onPress: (categoryName: string) => void;
  width?: number;
}

export const FeaturedCollectionCard: React.FC<FeaturedCollectionCardProps> = React.memo(({
  category,
  onPress,
  width = 290,
}) => {
  const staticFallbacks: { [key: string]: string } = {
    'Sonu Steel Products': normalizeImageUrl('/products/sonu_steel_products/sonu_eliza_pot_16cm_1500_ml.webp'),
    'Kitchen & Steel': normalizeImageUrl('/products/sonu_steel_products/sonu_eliza_pot_16cm_1500_ml.webp'),
    'Cello': normalizeImageUrl('/products/cello_prod/cello_designer_crockery_set_31pcs_set.webp'),
    'German Silver & More': 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=600',
    'Kondapalli Toys': 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=600',
    'Aquarium & Accessories': normalizeImageUrl('/products/aquarium_and_accesories/optimum_fish_food_500g_mini_pellets_for_aquarium_fish_high_protein_floating_feed_for_guppy_molly_tetra_betta_tropical_fish_daily_nutrition_for_growth_color_enhancement.webp'),
  };

  const bannerImg = category.image || staticFallbacks[category.name] || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=600';
  const countText = `${category.count || 24} Products`;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => onPress(category.name)}
      style={[styles.card, { width }]}
    >
      {/* 1. Center Product Showcase Image (Zero Cropping / Never Cut Off) */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: bannerImg }}
          style={styles.image}
          contentFit="contain"
          transition={200}
        />
      </View>

      {/* 2. Top Category Name Badge */}
      <View style={styles.topBadgeWrapper}>
        <View style={styles.badge}>
          <Text style={styles.badgeText} numberOfLines={1}>
            {category.name.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* 3. Bottom Row: Product Count & Action Arrow */}
      <View style={styles.footerRow}>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{countText}</Text>
        </View>
        <View style={styles.arrowIcon}>
          <Feather name="arrow-right" size={14} color="#FFFFFF" />
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    height: 195,
    borderRadius: radius.card,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE9E2',
    ...shadows.card,
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 44,
    paddingBottom: 46,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  topBadgeWrapper: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    zIndex: 2,
    alignItems: 'flex-start',
  },
  badge: {
    backgroundColor: 'rgba(18, 20, 21, 0.86)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    maxWidth: '90%',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  footerRow: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countPill: {
    backgroundColor: 'rgba(245, 246, 247, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#E2E4E7',
  },
  countText: {
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  arrowIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brandGold,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.subtle,
  },
});

export default FeaturedCollectionCard;
