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

interface HeroBannerProps {
  banners?: BannerData[];
  onShopNow: (categoryName: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = React.memo(({ banners, onShopNow }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<any>(null);

  // High-Resolution 16:9 Graphic Posters with built-in typography
  const defaultBanners: BannerData[] = [
    {
      id: '1',
      title: 'SONU STEEL COOKWARE',
      category: 'Sonu Steel Products',
      image: require('../../assets/banners/sonu banner.png'),
    },
    {
      id: '2',
      title: 'HERITAGE IDOLS & DECOR',
      category: 'Kondapalli Toys',
      image: require('../../assets/banners/rajasthani idol banner.png'),
    },
    {
      id: '3',
      title: 'CELLO DINING & BOTTLES',
      category: 'Cello',
      image: require('../../assets/banners/cello banner.png'),
    },
    {
      id: '4',
      title: 'WATER FOUNTAINS & POTS',
      category: 'Water Fountains',
      image: require('../../assets/banners/water fountain banner.png'),
    },
  ];

  // Strictly use local high-resolution 16:9 graphic posters from assets/banners/ directly
  const displayBanners = defaultBanners;

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
          const fallback = defaultBanners[idx % defaultBanners.length];
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
              {/* 1. Crystal-Clear 16:9 Poster Graphic (full artwork display) */}
              <Image
                source={imageSource}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={200}
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

