import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useMobileApp, Product, ORDERED_CATEGORY_NAMES, mapCategoryLabel } from '../context/MobileAppContext';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { AppHeader } from '../components/AppHeader';
import { SearchBar } from '../components/SearchBar';
import { HeroBanner } from '../components/HeroBanner';
import { CategoryCarousel } from '../components/CategoryCarousel';
import { SectionHeader } from '../components/SectionHeader';
import { FlashSaleTimer } from '../components/FlashSaleTimer';
import { ProductCard } from '../components/ProductCard';

const { width: screenWidth } = Dimensions.get('window');
const GRID_CARD_WIDTH = Math.floor((screenWidth - (spacing.pageHorizontal * 2) - 12) / 2);

export default function HomeView() {
  const {
    products,
    productsLoading,
    banners,
    bannersLoading,
    categories,
    categoriesLoading,
    flashSale,
    flashSaleLoading,
    notifications,
    markNotificationsRead,
    clearNotifications,
    setSelectedProductId,
    setSelectedCategory,
    setActiveTab,
    refreshProductsFeed,
    fetchAllProducts,
    fetchBanners,
    fetchCategories,
    fetchFlashSale,
    activeDiscounts,
    fetchActiveDiscounts,
    recentlyViewed,
  } = useMobileApp();

  const [refreshing, setRefreshing] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        refreshProductsFeed(),
        fetchAllProducts(),
        fetchBanners(),
        fetchCategories(),
        fetchFlashSale(),
        fetchActiveDiscounts(),
      ]);
    } catch (err) {
      console.warn('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refreshProductsFeed, fetchAllProducts, fetchBanners, fetchCategories, fetchFlashSale, fetchActiveDiscounts]);

  // Handle banner or category click - navigates directly to that category's products in explore
  const handleCategoryClick = useCallback((categoryName: string) => {
    setSelectedCategory(categoryName);
    setActiveTab('explore');
  }, [setSelectedCategory, setActiveTab]);

  // Normalize raw category names to customer-friendly titles
  const normalizeCategory = useCallback((raw?: string): string => {
    if (!raw) return 'Other';
    const clean = mapCategoryLabel(raw);
    const lower = clean.toLowerCase();
    if (lower.includes('sonu') || lower.includes('steel')) return 'Sonu Steel Products';
    if (lower.includes('cello')) return 'Cello';
    if (lower.includes('aquarium')) return 'Aquarium & Accessories';
    if (lower.includes('lunch')) return 'Lunch Boxes';
    if (lower.includes('water bottle') || lower.includes('waterbottles') || lower.includes('jars')) return 'Water Bottles & Jars';
    if (lower.includes('fountain')) return 'Water Fountains';
    if (lower.includes('rajasthan')) return 'Traditional Rajasthan Idols';
    if (lower.includes('kondapalli') || lower.includes('toy')) return 'Kondapalli Toys';
    if (lower.includes('german silver')) return 'German Silver & More';
    if (lower.includes('ceramic') || lower.includes('pot')) return 'Ceramic Pots';
    if (lower.includes('artificial plant')) return 'Artificial Plants';
    if (lower.includes('harshdeep')) return 'Harshdeep Planters';
    if (lower.includes('garland')) return 'Garlands';
    if (lower.includes('mat')) return 'Multiple Purpose Mats';
    if (lower.includes('wallpaper')) return 'Wallpaper Rolls';
    if (lower.includes('bird')) return 'Birds And Accessories';
    if (lower.includes('clock')) return 'Wall Clocks';
    if (lower.includes('garden')) return 'Garden Tools & Compost';
    if (lower.includes('handicraft')) return 'Handicrafts & Gifts';
    return clean;
  }, []);

  // Products grouped by normalized category
  const productsByCategory = useMemo(() => {
    const map = new Map<string, Product[]>();
    if (!products || products.length === 0) return map;

    for (const p of products) {
      const cat = normalizeCategory(p.category);
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(p);
    }
    return map;
  }, [products, normalizeCategory]);

  // Best Sellers: Exactly 1 representative product from each category (Sonu, Cello, Aquarium, etc.)
  const bestSellers = useMemo(() => {
    if (!products || products.length === 0) return [];

    const orderedCats: string[] = [];
    // Prioritize ORDERED_CATEGORY_NAMES first
    for (const name of ORDERED_CATEGORY_NAMES) {
      if (productsByCategory.has(name)) {
        orderedCats.push(name);
      }
    }
    // Add any remaining categories
    for (const cat of productsByCategory.keys()) {
      if (!orderedCats.includes(cat)) {
        orderedCats.push(cat);
      }
    }

    const items: Product[] = [];
    for (const cat of orderedCats) {
      const catProds = productsByCategory.get(cat) || [];
      if (catProds.length > 0) {
        // Pick top product in this category
        const topProduct = [...catProds].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
        if (topProduct) {
          items.push(topProduct);
        }
      }
    }
    return items;
  }, [products, productsByCategory]);

  // Category Carousels: Sonu first, Cello second, then every other category with up to 5 products + See all
  const categorySections = useMemo(() => {
    if (!products || products.length === 0) return [];

    const orderedCats: string[] = [];
    for (const name of ORDERED_CATEGORY_NAMES) {
      if (productsByCategory.has(name)) {
        orderedCats.push(name);
      }
    }
    for (const cat of productsByCategory.keys()) {
      if (!orderedCats.includes(cat)) {
        orderedCats.push(cat);
      }
    }

    return orderedCats.map(cat => {
      const allCatProds = productsByCategory.get(cat) || [];
      return {
        category: cat,
        products: allCatProds.slice(0, 5),
        totalCount: allCatProds.length,
      };
    }).filter(sec => sec.products.length > 0);
  }, [products, productsByCategory]);

  // Recommended For You (Grid)
  const recommendedProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    return products.slice(0, 12);
  }, [products]);

  // Search filter
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return products.filter(
      p =>
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.title && p.title.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query))
    );
  }, [searchQuery, products]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 1. COMPACT LUXURY APP HEADER */}
      <AppHeader
        onNotificationsPress={() => setNotificationsVisible(true)}
      />

      {/* 2. UNIFIED SEARCH BAR */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery('')}
      />

      {/* SEARCH ACTIVE RESULTS OVERLAY */}
      {searchQuery.trim().length > 0 ? (
        <View style={styles.searchResultsContainer}>
          <View style={styles.searchHeaderRow}>
            <Text style={styles.searchResultsTitle}>
              Search Results ({filteredProducts.length})
            </Text>
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchText}>Clear</Text>
            </TouchableOpacity>
          </View>

          {filteredProducts.length === 0 ? (
            <View style={styles.emptySearchContainer}>
              <Feather name="search" size={40} color={colors.textMuted} />
              <Text style={styles.emptySearchText}>No products found matching "{searchQuery}"</Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              numColumns={2}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              columnWrapperStyle={styles.searchGridColumn}
              contentContainerStyle={styles.searchGridContent}
              renderItem={({ item }) => (
                <ProductCard
                  product={item}
                  cardWidth={168}
                  onPress={(id) => {
                    setSearchQuery('');
                    setSelectedProductId(id);
                  }}
                />
              )}
            />
          )}
        </View>
      ) : (
        /* MAIN HOMEPAGE SCROLL FEED */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.brandGold}
              colors={[colors.brandGold]}
            />
          }
        >
          {/* 3. HERO PROMOTIONAL BANNER (Uses local assets/banners PNG images directly) */}
          <HeroBanner
            onShopNow={handleCategoryClick}
          />

          {/* 3b. ACTIVE CATEGORY DISCOUNT PROMOTIONS (Controlled Two-Price Architecture) */}
          {activeDiscounts && activeDiscounts.length > 0 && (
            <View style={styles.promotionsSection}>
              <View style={styles.promoHeader}>
                <Ionicons name="sparkles" size={15} color={colors.accentGreen} />
                <Text style={styles.promoHeaderTitle}>Active Promotional Offers</Text>
                <View style={styles.promoLiveBadge}>
                  <View style={styles.promoLiveDot} />
                  <Text style={styles.promoLiveText}>LIVE</Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.promoCardsScroll}
              >
                {activeDiscounts.map((disc) => (
                  <TouchableOpacity
                    key={disc.id || disc._id || disc.category}
                    activeOpacity={0.85}
                    style={styles.promoCard}
                    onPress={() => handleCategoryClick(disc.category)}
                  >
                    <View style={styles.promoDiscountBadge}>
                      <Text style={styles.promoDiscountText}>{disc.discountPercentage}% OFF</Text>
                    </View>
                    <View style={styles.promoInfoCol}>
                      <Text style={styles.promoCategoryName} numberOfLines={1}>
                        {mapCategoryLabel(disc.category)}
                      </Text>
                      <Text style={styles.promoSubText}>
                        Flat discount on Strike Price
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={15} color={colors.accentGreen} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* 4. SHOP CATEGORIES CAROUSEL */}
          <SectionHeader
            title="Shop Categories"
            subtitle="Browse by curated collections"
            actionText="See all"
            onActionPress={() => {
              setSelectedCategory('All');
              setActiveTab('explore');
            }}
          />
          <CategoryCarousel
            categories={categories.slice(0, 10)}
            onSelectCategory={handleCategoryClick}
          />

          {/* 5. BEST SELLERS CAROUSEL */}
          {bestSellers.length > 0 && (
            <View style={styles.sectionBlock}>
              <SectionHeader
                title="Best Sellers"
                subtitle="Most loved products by our customers"
                actionText="See all"
                onActionPress={() => {
                  setSelectedCategory('All');
                  setActiveTab('explore');
                }}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalProductRow}
              >
                {bestSellers.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    cardWidth={165}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* 6. CATEGORY-WISE PRODUCT SECTIONS (Sonu 5 items, Cello 5 items, etc. with See all) */}
          {categorySections.map((sec) => (
            <View key={sec.category} style={styles.sectionBlock}>
              <SectionHeader
                title={sec.category}
                subtitle={`Top ${sec.products.length} ${sec.category.toLowerCase()} picks`}
                actionText="See all"
                onActionPress={() => {
                  setSelectedCategory(sec.category);
                  setActiveTab('explore');
                }}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalProductRow}
              >
                {sec.products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    cardWidth={165}
                  />
                ))}
              </ScrollView>
            </View>
          ))}


          {/* 8. JUST FOR YOU / RECOMMENDED GRID */}
          {recommendedProducts.length > 0 && (
            <View style={styles.sectionBlock}>
              <SectionHeader
                title="Recommended For You"
                subtitle="Handpicked home & kitchen essentials"
              />
              <View style={styles.productGrid}>
                {recommendedProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    cardWidth={GRID_CARD_WIDTH}
                  />
                ))}
              </View>
            </View>
          )}

          {/* 9. RECENTLY VIEWED */}
          {recentlyViewed && recentlyViewed.length > 0 && (
            <View style={styles.sectionBlock}>
              <SectionHeader
                title="Recently Viewed"
                subtitle="Pick up where you left off"
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalProductRow}
              >
                {recentlyViewed.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    cardWidth={165}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Extra bottom spacer so content is never covered by bottom navigation */}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* NOTIFICATIONS MODAL */}
      <Modal
        visible={notificationsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setNotificationsVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setNotificationsVisible(false)}
              style={styles.modalCloseBtn}
            >
              <Feather name="x" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Notifications</Text>
            {notifications.length > 0 && (
              <TouchableOpacity onPress={() => clearNotifications()}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {notifications.length === 0 ? (
            <View style={styles.emptyNotifs}>
              <Feather name="bell-off" size={44} color={colors.textMuted} />
              <Text style={styles.emptyNotifsText}>No new notifications</Text>
              <Text style={styles.emptyNotifsSub}>We'll notify you when discounts & orders update.</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: spacing.md }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => markNotificationsRead(item.id)}
                  style={[styles.notifCard, !item.read && styles.unreadNotifCard]}
                >
                  <View style={styles.notifIconCircle}>
                    <Feather name="bell" size={16} color={colors.brandGold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    <Text style={styles.notifBody}>{item.body}</Text>
                    <Text style={styles.notifDate}>
                      {item.time || 'Recently'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 90, // safe distance above fixed bottom navigation
  },
  sectionBlock: {
    marginBottom: 8,
  },
  flashSaleBlock: {
    marginBottom: 8,
  },
  horizontalProductRow: {
    paddingHorizontal: spacing.pageHorizontal,
    gap: 12,
    paddingBottom: 4,
  },
  seeAllCard: {
    width: 130,
    height: 230,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  seeAllCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  seeAllCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  seeAllCardSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
  featuredCollectionsScroll: {
    paddingHorizontal: spacing.pageHorizontal,
    gap: 14,
    paddingBottom: 4,
  },
  promotionsSection: {
    marginVertical: spacing.sm,
  },
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.pageHorizontal,
    marginBottom: 8,
    gap: 6,
  },
  promoHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.2,
  },
  promoLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 135, 90, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginLeft: 'auto',
  },
  promoLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentGreen,
  },
  promoLiveText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.accentGreen,
    letterSpacing: 0.5,
  },
  promoCardsScroll: {
    paddingHorizontal: spacing.pageHorizontal,
    gap: 10,
    paddingVertical: 2,
  },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 135, 90, 0.25)',
    borderRadius: radius.card,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  promoDiscountBadge: {
    backgroundColor: colors.accentGreen,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  promoDiscountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  promoInfoCol: {
    justifyContent: 'center',
  },
  promoCategoryName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  promoSubText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.pageHorizontal,
    rowGap: 12,
  },
  // Search Overlay
  searchResultsContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  clearSearchText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.brandGold,
  },
  searchGridContent: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: 12,
    paddingBottom: 90,
  },
  searchGridColumn: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  emptySearchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptySearchText: {
    ...typography.body,
    color: colors.textMuted,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accentRed,
  },
  emptyNotifs: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyNotifsText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyNotifsSub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.card,
    padding: 12,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  unreadNotifCard: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.brandGold,
  },
  notifIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandGoldBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  notifBody: {
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  notifDate: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 4,
  },
});
