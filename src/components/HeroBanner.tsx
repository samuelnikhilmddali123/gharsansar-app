import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, ScrollView, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, shadows } from '../theme/tokens';

const { width: screenWidth } = Dimensions.get('window');
const BANNER_WIDTH = screenWidth - (spacing.pageHorizontal * 2);
const BANNER_HEIGHT = Math.round(BANNER_WIDTH / 2.1); // 2.1:1 aspect ratio

interface BannerData {
  id?: string;
  title?: string;
  subtitle?: string;
  category?: string;
  image?: string;
  discount?: string;
  bgGradient?: string[];
}

interface HeroBannerProps {
  banners: BannerData[];
  onShopNow: (categoryName: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = React.memo(({ banners, onShopNow }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // High quality lifestyle fallbacks if backend banner doesn't have an image
  const defaultBanners: BannerData[] = [
    {
      id: '1',
      title: 'Kitchen Essentials',
      subtitle: 'Premium cookware & dinnerware for modern living',
      category: 'Kitchen & Steel',
      discount: 'UP TO 50% OFF',
      image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=800',
    },
    {
      id: '2',
      title: 'Cello Designer Ware',
      subtitle: 'Elegance & durability for your dining space',
      category: 'Cello',
      discount: 'FLAT 40% OFF',
      image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&q=80&w=800',
    },
    {
      id: '3',
      title: 'Heritage Decor',
      subtitle: 'Handcrafted Kondapalli & Rajasthan showpieces',
      category: 'Kondapalli Toys',
      discount: 'SPECIAL OFFER',
      image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&q=80&w=800',
    },
  ];

  const displayBanners = banners && banners.length > 0 ? banners : defaultBanners;

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
          const title = item.title || 'Luxury Essentials';
          const subtitle = item.subtitle || 'Curated home & kitchen collections';
          const discount = item.discount || 'LIMITED OFFER';
          const targetCategory = item.category || 'All';
          const bannerImg = item.image || defaultBanners[idx % defaultBanners.length].image;

          return (
            <TouchableOpacity
              key={item.id || idx}
              activeOpacity={0.94}
              onPress={() => onShopNow(targetCategory)}
              style={styles.bannerCard}
            >
              {/* Full Background Lifestyle Image */}
              <Image
                source={{ uri: bannerImg }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={200}
              />

              {/* Cinematic Gradient Overlay for High Text Readability */}
              <View style={styles.darkGradientOverlay} />

              {/* Text & CTA Content Layer */}
              <View style={styles.contentLayer}>
                <View style={styles.tagBadge}>
                  <Text style={styles.tagBadgeText}>{discount}</Text>
                </View>

                <Text style={styles.bannerTitle} numberOfLines={1}>
                  {title}
                </Text>

                <Text style={styles.bannerSubtitle} numberOfLines={2}>
                  {subtitle}
                </Text>

                <View style={styles.ctaButton}>
                  <Text style={styles.ctaText}>Shop Now</Text>
                  <Feather name="arrow-right" size={13} color={colors.textPrimary} />
                </View>
              </View>
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
    backgroundColor: '#1C2024',
    ...shadows.card,
  },
  darkGradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  contentLayer: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 16,
    top: 16,
    justifyContent: 'center',
    alignItems: 'flex-start',
    maxWidth: '75%',
  },
  tagBadge: {
    backgroundColor: colors.brandGold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginBottom: 6,
  },
  tagBadgeText: {
    color: colors.textInverse,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.88)',
    fontWeight: '400',
    lineHeight: 16,
    marginBottom: 10,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
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
