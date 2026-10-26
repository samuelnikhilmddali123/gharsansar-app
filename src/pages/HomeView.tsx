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
import { useMobileApp, Product } from '../context/MobileAppContext';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { AppHeader } from '../components/AppHeader';
import { SearchBar } from '../components/SearchBar';
import { HeroBanner } from '../components/HeroBanner';
import { CategoryCarousel } from '../components/CategoryCarousel';
import { SectionHeader } from '../components/SectionHeader';
import { FlashSaleTimer } from '../components/FlashSaleTimer';
import { ProductCard } from '../components/ProductCard';
import { FeaturedCollectionCard } from '../components/FeaturedCollectionCard';

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
      ]);
    } catch (err) {
      console.warn('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refreshProductsFeed, fetchAllProducts, fetchBanners, fetchCategories, fetchFlashSale]);

  // Handle banner or category click - navigates directly to that category's products in explore
  const handleCategoryClick = useCallback((categoryName: string) => {
    setSelectedCategory(categoryName);
    setActiveTab('explore');
  }, [setSelectedCategory, setActiveTab]);

  // Best Sellers (Highest rated or matching Sonu cookware)
  const bestSellers = useMemo(() => {
    if (!products || products.length === 0) return [];
    return [...products]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 10);
  }, [products]);

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
          {/* 3. HERO PROMOTIONAL BANNER */}
          <HeroBanner
            banners={banners}
            onShopNow={handleCategoryClick}
          />

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

          {/* 7. FEATURED COLLECTIONS */}
          {categories.length > 0 && (
            <View style={styles.sectionBlock}>
              <SectionHeader
                title="Featured Collections"
                subtitle="Designed for elegance & luxury"
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredCollectionsScroll}
              >
                {categories.slice(0, 5).map((cat) => (
                  <FeaturedCollectionCard
                    key={cat.name}
                    category={cat}
                    onPress={handleCategoryClick}
                    width={290}
                  />
                ))}
              </ScrollView>
            </View>
          )}

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
  featuredCollectionsScroll: {
    paddingHorizontal: spacing.pageHorizontal,
    gap: 14,
    paddingBottom: 4,
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
