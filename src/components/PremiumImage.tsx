import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { BACKEND_URL, normalizeImageUrl } from '../config/api';

// Mapping of category fallback images using high-quality premium Unsplash assets
const CATEGORY_FALLBACKS: { [key: string]: string } = {
  'Kitchen & Steel': normalizeImageUrl('/products/sonu_steel_products/sonu_eliza_pot_16cm_1500_ml.webp'),
  'Sonu Steel Products': normalizeImageUrl('/products/sonu_steel_products/sonu_eliza_pot_16cm_1500_ml.webp'),
  'Cello': normalizeImageUrl('/products/cello_prod/cello_designer_crockery_set_31pcs_set.webp'),
  'Garden & Birds': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=400',
  'Garden Essentials': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=400',
  'Kondapalli Toys': 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=400',
  'Handicrafts & Gifts': 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=400',
  'Bottles & Jars': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=400',
  'Bottles & Flasks': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=400',
  'Wallpaper Rolls': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400',
  'Wallpaper': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400',
  'Rajasthan Decor': 'https://images.unsplash.com/photo-1608976328267-e673d3ec06ce?auto=format&fit=crop&q=80&w=400',
  'Water Fountains': 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=400',
  'Aquarium & Accessories': normalizeImageUrl('/products/aquarium_and_accesories/optimum_fish_food_500g_mini_pellets_for_aquarium_fish_high_protein_floating_feed_for_guppy_molly_tetra_betta_tropical_fish_daily_nutrition_for_growth_color_enhancement.webp'),
  'Aquarium': normalizeImageUrl('/products/aquarium_and_accesories/optimum_fish_food_500g_mini_pellets_for_aquarium_fish_high_protein_floating_feed_for_guppy_molly_tetra_betta_tropical_fish_daily_nutrition_for_growth_color_enhancement.webp'),
  'Premium Mats': 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&q=80&w=400',
};

const DEFAULT_PLACEHOLDER = 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=400';

interface PremiumImageProps {
  uri: string;
  style: any;
  product?: {
    id: string;
    title: string;
    category?: string;
  };
  contentFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  simulateError?: boolean;
}

export const PremiumImage: React.FC<PremiumImageProps> = React.memo(({
  uri,
  style,
  product,
  contentFit = 'contain',
  simulateError = false
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state if URI changes
  useEffect(() => {
    setHasError(false);
  }, [uri]);

  const sourceUri = useMemo(() => {
    if (simulateError || hasError || !uri) {
      const cat = product?.category || '';
      return CATEGORY_FALLBACKS[cat] || DEFAULT_PLACEHOLDER;
    }

    return normalizeImageUrl(uri);
  }, [uri, hasError, simulateError, product]);

  const containerStyle = [
    styles.container,
    style,
    style?.borderRadius ? { borderRadius: style.borderRadius } : null
  ];

  return (
    <View style={containerStyle}>
      <Image
        source={{ uri: sourceUri }}
        style={StyleSheet.absoluteFill}
        contentFit={contentFit}
        cachePolicy="disk"
        transition={150}
        onError={() => setHasError(true)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
    position: 'relative',
  },
});

export default PremiumImage;
