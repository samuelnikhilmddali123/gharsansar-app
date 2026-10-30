import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useMobileApp } from '../context/MobileAppContext';
import { colors, radius, spacing, typography, shadows } from '../theme/tokens';
import { SearchBar } from '../components/SearchBar';
import { SectionHeader } from '../components/SectionHeader';
import { ProductCard } from '../components/ProductCard';
import { FeaturedCollectionCard } from '../components/FeaturedCollectionCard';
import { PremiumImage } from '../components/PremiumImage';
import { KeyboardSafeScrollView } from '../components/KeyboardSafeScrollView';

const { width: screenWidth } = Dimensions.get('window');

export default function ExploreView() {
  const {
    products,
    categories,
    selectedCategory,
    setSelectedCategory,
    setSelectedProductId,
    getCategoryDiscount,
  } = useMobileApp();

  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = React.useRef<any>(null);

  const activeCatDiscount = useMemo(() => {
    if (selectedCategory === 'All') return undefined;
    return getCategoryDiscount ? getCategoryDiscount(selectedCategory) : undefined;
  }, [selectedCategory, getCategoryDiscount]);

  // Built-in categories list with 'All'
  const filterCategories = useMemo(() => {
    const list = categories.map(c => c.name).filter(Boolean);
    return ['All', ...new Set(list)];
  }, [categories]);

  // Filtered products by category and search
  const displayedProducts = useMemo(() => {
    let result = products;

    if (selectedCategory !== 'All') {
      const targetCat = selectedCategory.toLowerCase().trim();
      result = result.filter(p => {
        if (!p.category) return false;
        const prodCat = p.category.toLowerCase().trim();
        if (prodCat === targetCat) return true;

        // Aliases check for Sonu Steel Products
        const isSonuTarget =
          targetCat === 'sonu steel products' ||
          targetCat === 'sonu_steel_products' ||
          targetCat === 'kitchen & steel';
        const isSonuProd =
          prodCat === 'sonu steel products' ||
          prodCat === 'sonu_steel_products' ||
          prodCat === 'kitchen & steel';
        if (isSonuTarget && isSonuProd) return true;

        return false;
      });
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        p =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.title && p.title.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
      );
    }

    return result;
  }, [products, selectedCategory, searchQuery]);

  const [visibleLimit, setVisibleLimit] = useState(20);

  React.useEffect(() => {
    setVisibleLimit(20);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [selectedCategory, searchQuery]);

  const visibleProducts = useMemo(() => {
    return displayedProducts.slice(0, visibleLimit);
  }, [displayedProducts, visibleLimit]);

  // Trending Categories (with subtle pastel backgrounds)
  const pastelColors = [
    '#F7F3EE', // warm beige
    '#F0F4F8', // soft slate blue
    '#F2F7F2', // sage green
    '#F9F3F6', // soft blush
    '#FBF5ED', // sand
    '#F5F5F7', // clean gray
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 1. DISCOVERY HEADER */}
      <View style={styles.header}>
        <Text style={styles.brandSubtitle}>GHAR SANSAR DISCOVERY</Text>
        <Text style={styles.headerTitle}>Explore Products</Text>
        <Text style={styles.headerDescription}>Discover curated pieces you will love</Text>
      </View>

      {/* 2. SEARCH BAR */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery('')}
        placeholderPrefix="Search products in explore..."
      />

      {/* 3. HORIZONTALLY SCROLLABLE CATEGORY PILLS (NO WRAPPING) */}
      <View style={styles.pillsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          {filterCategories.map((catName) => {
            const isActive = selectedCategory === catName;
            return (
              <TouchableOpacity
                key={catName}
                activeOpacity={0.8}
                onPress={() => setSelectedCategory(catName)}
                style={[
                  styles.filterPill,
                  isActive ? styles.filterPillActive : styles.filterPillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    isActive ? styles.pillTextActive : styles.pillTextInactive,
                  ]}
                >
                  {catName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* MAIN CONTENT SCROLL */}
      <KeyboardSafeScrollView
        ref={scrollRef as any}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        extraScrollHeight={120}
      >
        {/* If 'All' is selected and no search, show Trending Categories & Collections */}
        {selectedCategory === 'All' && searchQuery.trim().length === 0 && (
          <>
            {/* TRENDING CATEGORIES 2-COLUMN GRID */}
            {/* ALL CATEGORIES 2-COLUMN GRID */}
            <SectionHeader
              title="Shop by Category"
              subtitle="All 19 home & kitchen departments"
            />
            <View style={styles.trendingGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.name}
                  activeOpacity={0.75}
                  delayPressIn={0}
                  onPress={() => setSelectedCategory(cat.name)}
                  style={styles.trendingCard}
                >
                  <View style={styles.trendingCardTextGroup}>
                    <Text style={styles.trendingCategoryName} numberOfLines={2}>
                      {cat.name}
                    </Text>
                    <Text style={styles.trendingCount}>
                      {cat.count || 24}+ items
                    </Text>
                  </View>

                  <View style={styles.trendingImageWrapper}>
                    <PremiumImage
                      uri={cat.image || ''}
                      style={styles.trendingImage}
                      contentFit="contain"
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* FEATURED COLLECTIONS */}
            {categories.length > 0 && (
              <View style={styles.collectionsSection}>
                <SectionHeader
                  title="Featured Collections"
                  subtitle="Curated by interior stylists"
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.collectionsRow}
                >
                  {categories.slice(0, 5).map((cat) => (
                    <FeaturedCollectionCard
                      key={cat.name}
                      category={cat}
                      onPress={(name) => setSelectedCategory(name)}
                      width={290}
                    />
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}

        {/* ACTIVE CATEGORY DISCOUNT PROMOTIONAL BANNER */}
        {activeCatDiscount && (
          <View style={styles.catDiscountBanner}>
            <View style={styles.catDiscountBadge}>
              <Text style={styles.catDiscountBadgeText}>{activeCatDiscount.discountPercentage}% OFF</Text>
            </View>
            <View style={styles.catDiscountTextCol}>
              <Text style={styles.catDiscountTitle}>
                Category Promotion Active
              </Text>
              <Text style={styles.catDiscountSubtitle}>
                Flat {activeCatDiscount.discountPercentage}% off strike price on all {selectedCategory} products!
              </Text>
            </View>
          </View>
        )}

        {/* PRODUCTS SECTION / RESULTS */}
        <SectionHeader
          title={
            searchQuery.trim().length > 0
              ? `Search Results (${displayedProducts.length})`
              : selectedCategory !== 'All'
              ? `${selectedCategory} (${displayedProducts.length})`
              : `All Products (${displayedProducts.length})`
          }
          subtitle="Authentic Ghar Sansar selection"
          actionText={selectedCategory !== 'All' ? 'All Categories' : undefined}
          onActionPress={selectedCategory !== 'All' ? () => setSelectedCategory('All') : undefined}
        />

        {displayedProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="package" size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>Try choosing another category or clearing filters.</Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              style={styles.resetButton}
            >
              <Text style={styles.resetButtonText}>View All Products</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.productsGrid}>
              {visibleProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  cardWidth={(screenWidth - (spacing.pageHorizontal * 2) - 14) / 2}
                  onPress={setSelectedProductId}
                />
              ))}
            </View>

            {displayedProducts.length > visibleLimit && (
              <TouchableOpacity
                style={styles.loadMoreButton}
                activeOpacity={0.8}
                onPress={() => setVisibleLimit((prev) => prev + 20)}
              >
                <Text style={styles.loadMoreText}>
                  Load More ({displayedProducts.length - visibleLimit} more)
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <View style={{ height: 30 }} />
      </KeyboardSafeScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: 8,
    paddingBottom: 4,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.brandGold,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  headerDescription: {
    fontSize: 12.5,
    color: colors.textSecondary,
    fontWeight: '400',
    marginTop: 2,
  },
  // Filter Pills (Horizontal non-wrapping)
  pillsContainer: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceTertiary,
  },
  pillsScroll: {
    paddingHorizontal: spacing.pageHorizontal,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: colors.brandCharcoal,
  },
  filterPillInactive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  pillText: {
    fontSize: 12.5,
  },
  pillTextActive: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  pillTextInactive: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  // Scrollable Body
  scrollContent: {
    paddingBottom: 90, // safe distance above fixed bottom navigation
  },
  // Trending Categories 2-Column Grid
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.pageHorizontal,
    gap: 12,
  },
  trendingCard: {
    width: (screenWidth - (spacing.pageHorizontal * 2) - 12) / 2,
    height: 105,
    borderRadius: radius.card,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEEF0',
    ...shadows.subtle,
  },
  trendingCardTextGroup: {
    flex: 1,
    paddingRight: 6,
    justifyContent: 'center',
  },
  trendingCategoryName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 16,
    marginBottom: 4,
  },
  trendingCount: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  trendingImageWrapper: {
    width: 52,
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  trendingImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  collectionsSection: {
    marginTop: 8,
  },
  collectionsRow: {
    paddingHorizontal: spacing.pageHorizontal,
    gap: 14,
  },
  // 2-Column Products Grid
  catDiscountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.pageHorizontal,
    marginTop: 8,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 135, 90, 0.25)',
    borderRadius: radius.card,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  catDiscountBadge: {
    backgroundColor: colors.accentGreen,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  catDiscountBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  catDiscountTextCol: {
    flex: 1,
  },
  catDiscountTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  catDiscountSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.pageHorizontal,
    gap: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: spacing.pageHorizontal,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  resetButton: {
    marginTop: 8,
    backgroundColor: colors.brandCharcoal,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  resetButtonText: {
    color: colors.textInverse,
    fontSize: 12.5,
    fontWeight: '700',
  },
  loadMoreButton: {
    alignSelf: 'center',
    marginTop: 20,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brandCharcoal,
  },
});
