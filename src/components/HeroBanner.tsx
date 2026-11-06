import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, shadows } from '../theme/tokens';

const { width: screenWidth } = Dimensions.get('window');
const BANNER_WIDTH = screenWidth - (spacing.pageHorizontal * 2);
const BANNER_HEIGHT = Math.round(BANNER_WIDTH / (16 / 9)); // Exactly 16:9 aspect ratio

interface BannerData {
  id?: string;
  title?: string;
  subtitle?: string;
  category?: string;
  image?: any;
  discount?: string;
  tag?: string;
  bgGradient?: string[];
}

// High-Resolution 16:9 Graphic Posters with built-in typography (lightweight optimized assets)
export const DEFAULT_BANNERS: BannerData[] = [
  {
    id: '1',
    title: 'SONU STEEL COOKWARE',
    category: 'Sonu Steel Products',
    image: require('../../assets/banners/steel_cookware_banner.jpg'),
  },
  {
    id: '2',
    title: 'HERITAGE IDOLS & DECOR',
    category: 'Kondapalli Toys',
    image: require('../../assets/banners/rajasthan_idols_banner.jpg'),
  },
  {
    id: '3',
    title: 'CELLO DINING & BOTTLES',
    category: 'Cello',
    image: require('../../assets/banners/cello_bottles_banner.jpg'),
  },
  {
    id: '4',
    title: 'WATER FOUNTAINS & POTS',
    category: 'Water Fountains',
    image: require('../../assets/banners/water_fountain_banner.jpg'),
  },
];

interface HeroBannerProps {
  banners?: BannerData[];
  onShopNow: (categoryName: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = React.memo(({ banners, onShopNow }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<any>(null);

  // Use backend banners when available; gracefully fall back to local high-resolution asset posters
  const displayBanners = banners && banners.length > 0 ? banners : DEFAULT_BANNERS;

  // Prefetch remote banner URLs into memory-disk cache immediately if any exist
  useEffect(() => {
    if (banners && banners.length > 0) {
      const urls = banners
        .map(b => (typeof b.image === 'string' && b.image.startsWith('http') ? b.image : null))
        .filter(Boolean) as string[];
      if (urls.length > 0) {
        Image.prefetch(urls, 'memory-disk').catch(() => {});
      }
    }
  }, [banners]);

  useEffect(() => {
    if (displayBanners.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % displayBanners.length;
      setActiveIndex(nextIndex);
      scrollRef.current?.scrollTo({
        x: nextIndex * (BANNER_WIDTH + 12),
        animated: true,
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [activeIndex, displayBanners.length]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        snapToInterval={BANNER_WIDTH + 12}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onMomentumScrollEnd={(e) => {
          const offsetX = e.nativeEvent.contentOffset.x;
          const index = Math.round(offsetX / (BANNER_WIDTH + 12));
          setActiveIndex(index);
        }}
      >
        {displayBanners.map((item, idx) => {
          const fallback = DEFAULT_BANNERS[idx % DEFAULT_BANNERS.length];
          const targetCategory = item.category || fallback.category || 'All';
          const bannerImg = item.image || fallback.image;
          const imageSource = typeof bannerImg === 'string' ? { uri: bannerImg } : bannerImg;

          return (
            <TouchableOpacity
              key={item.id || idx}
              activeOpacity={0.94}
              onPress={() => onShopNow(targetCategory)}
              style={styles.bannerCard}
            >
              {/* 1. Crystal-Clear 16:9 Poster Graphic (full artwork display with memory-disk caching) */}
              <Image
                source={imageSource}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                cachePolicy="memory-disk"
                priority={idx === 0 ? 'high' : 'normal'}
                recyclingKey={item.id ? `banner-${item.id}` : `banner-${idx}`}
                transition={0}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Clean Dot Indicators */}
      {displayBanners.length > 1 && (
        <View style={styles.dotsRow}>
          {displayBanners.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                activeIndex === i ? styles.activeDot : null
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  scrollContent: {
    paddingHorizontal: spacing.pageHorizontal,
    gap: 12,
  },
  bannerCard: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: radius.banner,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F1F5F9',
    ...shadows.card,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.cardBorderHover,
  },
  activeDot: {
    width: 16,
    backgroundColor: colors.brandGold,
  },
});

