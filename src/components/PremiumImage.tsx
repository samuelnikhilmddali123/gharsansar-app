import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { BACKEND_URL, normalizeImageUrl } from '../config/api';

// Mapping of category fallback images using high-quality premium Unsplash assets
const CATEGORY_FALLBACKS: { [key: string]: string } = {
  'Kitchen & Steel': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=400',
  'Cello': 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&q=80&w=400',
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
  'Aquarium & Accessories': 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&q=80&w=400',
  'Aquarium': 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&q=80&w=400',
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
