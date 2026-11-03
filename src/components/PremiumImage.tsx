import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { BACKEND_URL, normalizeImageUrl } from '../config/api';

// Mapping of category fallback images using verified Ghar Sansar catalog assets (no unrelated office/room images)
const CATEGORY_FALLBACKS: { [key: string]: string } = {
  'Kitchen & Steel': normalizeImageUrl('/products/sonu_steel_products/sonu_eliza_pot_16cm_1500_ml.webp'),
  'Sonu Steel Products': normalizeImageUrl('/products/sonu_steel_products/sonu_eliza_pot_16cm_1500_ml.webp'),
  'Cello': normalizeImageUrl('/products/cello_prod/cello_designer_crockery_set_31pcs_set.webp'),
  'Return Gifts': normalizeImageUrl('/return gifts/premium-gift-1.png'),
  'return_gifts': normalizeImageUrl('/return gifts/premium-gift-1.png'),
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

// Safe default product fallback from verified catalog (never an office chair)
const DEFAULT_PLACEHOLDER = normalizeImageUrl('/products/sonu_steel_products/sonu_eliza_pot_16cm_1500_ml.webp');

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
  const [attempt, setAttempt] = useState<number>(0);
  const [hasFailed, setHasFailed] = useState<boolean>(false);

  // Reset error state if URI changes
  useEffect(() => {
    setAttempt(0);
    setHasFailed(false);
  }, [uri]);

  const isReturnGift = Boolean(
    product?.category === 'Return Gifts' ||
    product?.category === 'return_gifts' ||
    String(product?.id || '').startsWith('rg-') ||
    (uri && uri.includes('return%20gifts')) ||
    (uri && uri.includes('return gifts'))
  );

  const primaryUri = useMemo(() => {
    if (!uri) return '';
    return normalizeImageUrl(uri);
  }, [uri]);

  const alternateUri = useMemo(() => {
    if (!primaryUri) return '';
    if (primaryUri.includes('backend.gharsansar.website')) {
      return primaryUri.replace('backend.gharsansar.website', 'gharsansar.website');
    }
    if (primaryUri.includes('gharsansar.website')) {
      return primaryUri.replace('gharsansar.website', 'backend.gharsansar.website');
    }
    return '';
  }, [primaryUri]);

  const currentSource = useMemo(() => {
    if (simulateError || hasFailed || !uri) {
      const cat = product?.category || (isReturnGift ? 'Return Gifts' : '');
      return CATEGORY_FALLBACKS[cat] || DEFAULT_PLACEHOLDER;
    }

    if (attempt === 0) return primaryUri;
    if (attempt === 1 && alternateUri) return alternateUri;

    const cat = product?.category || (isReturnGift ? 'Return Gifts' : '');
    return CATEGORY_FALLBACKS[cat] || DEFAULT_PLACEHOLDER;
  }, [uri, attempt, primaryUri, alternateUri, hasFailed, simulateError, product, isReturnGift]);

  const handleError = () => {
    if (attempt === 0 && alternateUri && alternateUri !== primaryUri) {
      setAttempt(1);
    } else if (attempt <= 1) {
      setAttempt(2);
    } else {
      setHasFailed(true);
    }
  };

  const containerStyle = [
    styles.container,
    style,
    style?.borderRadius ? { borderRadius: style.borderRadius } : null
  ];

  if (hasFailed) {
    return (
      <View style={[containerStyle, styles.placeholderBox]}>
        <Feather name={isReturnGift ? 'gift' : 'package'} size={24} color="#9CA3AF" />
        <Text style={styles.placeholderText}>Ghar Sansar</Text>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Image
        source={{
          uri: currentSource,
          headers: {
            'Accept': 'image/webp,image/png,image/*,*/*',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) GharSansarApp/1.0.2',
          },
        }}
        style={StyleSheet.absoluteFill}
        contentFit={contentFit}
        cachePolicy="disk"
        priority="high"
        transition={150}
        onError={handleError}
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
  placeholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    gap: 4,
  },
  placeholderText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
});

export default PremiumImage;
