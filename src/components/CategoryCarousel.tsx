import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { colors, radius, spacing, shadows } from '../theme/tokens';
import { PremiumImage } from './PremiumImage';

interface CategoryItem {
  name: string;
  image?: string;
  count?: number;
}

interface CategoryCarouselProps {
  categories: CategoryItem[];
  onSelectCategory: (name: string) => void;
  selectedCategory?: string;
}

export const CategoryCarousel: React.FC<CategoryCarouselProps> = React.memo(({
  categories,
  onSelectCategory,
  selectedCategory,
}) => {
  const handlePress = (name: string) => {
    onSelectCategory(name);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
    >
      {categories.map((cat, idx) => {
        const isSelected = selectedCategory === cat.name;

        return (
          <TouchableOpacity
            key={cat.name || idx}
            activeOpacity={0.7}
            delayPressIn={0}
            onPress={() => handlePress(cat.name)}
            style={styles.categoryItem}
          >
            {/* 72px Pure White Container - Seamlessly blending with image background */}
            <View style={[
              styles.imageWrapper,
              isSelected && styles.imageWrapperSelected
            ]}>
              <PremiumImage
                uri={cat.image || ''}
                style={styles.image}
                contentFit="contain"
              />
            </View>

            <Text
              style={[styles.label, isSelected && styles.labelSelected]}
              numberOfLines={2}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 14,
  },
  categoryItem: {
    alignItems: 'center',
    width: 76,
  },
  imageWrapper: {
    width: 72,
    height: 72,
    borderRadius: radius.card,
    backgroundColor: '#FFFFFF', // Seamless pure white
    borderWidth: 1,
    borderColor: '#ECEEF0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    overflow: 'hidden',
    ...shadows.subtle,
  },
  imageWrapperSelected: {
    borderColor: colors.brandGold,
    borderWidth: 2,
    backgroundColor: colors.brandGoldBg,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
  },
  labelSelected: {
    color: colors.brandGold,
    fontWeight: '800',
  },
});

export default CategoryCarousel;
