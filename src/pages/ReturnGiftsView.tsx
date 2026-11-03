import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMobileApp, formatCurrency } from '../context/MobileAppContext';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import { colors, typography, spacing, radius, shadows } from '../theme/tokens';

const { width: screenWidth } = Dimensions.get('window');
const COLUMN_GAP = 12;
const HORIZONTAL_PADDING = spacing.pageHorizontal;
const CARD_WIDTH = (screenWidth - (HORIZONTAL_PADDING * 2) - COLUMN_GAP) / 2;

const PRICE_FILTERS = [
  'All Gifts',
  'Under ₹150',
  '₹150 - ₹200',
  '₹200 - ₹300',
  '₹300+',
];

export const ReturnGiftsView: React.FC = () => {
  const {
    returnGifts,
    returnGiftsLoading,
    fetchReturnGifts,
    cart,
    setActiveTab,
    setSelectedProductId,
  } = useMobileApp();

  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All Gifts');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (returnGifts.length === 0) {
      fetchReturnGifts();
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReturnGifts();
    setRefreshing(false);
  };

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const filteredGifts = useMemo(() => {
    return returnGifts.filter((product) => {
      // Search query filter
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const titleMatch = product.title?.toLowerCase().includes(query);
        const nameMatch = product.name?.toLowerCase().includes(query);
        const descMatch = product.description?.toLowerCase().includes(query);
        if (!titleMatch && !nameMatch && !descMatch) return false;
      }

      // Price chip filter
      const price = product.finalPrice || product.price || 0;
      if (selectedFilter === 'Under ₹150') return price < 150;
      if (selectedFilter === '₹150 - ₹200') return price >= 150 && price <= 200;
      if (selectedFilter === '₹200 - ₹300') return price > 200 && price <= 300;
      if (selectedFilter === '₹300+') return price > 300;

      return true;
    });
  }, [returnGifts, search, selectedFilter]);

  const renderProductItem = useCallback(({ item }: { item: any }) => (
    <View style={{ width: CARD_WIDTH }}>
      <ProductCard product={item} cardWidth={CARD_WIDTH} />
    </View>
  ), []);

  const ListHeader = useMemo(() => (
    <View>
      {/* 2. Search Bar */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={17} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          placeholder="Search return gifts, hot pots, casseroles..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* 3. Price Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {PRICE_FILTERS.map((filter) => {
          const isSelected = selectedFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              activeOpacity={0.7}
              onPress={() => setSelectedFilter(filter)}
              style={[
                styles.filterChip,
                isSelected && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 4. Products Count Bar */}
      <View style={styles.resultMetaRow}>
        <Text style={styles.resultCountText}>
          Showing <Text style={styles.resultCountBold}>{filteredGifts.length}</Text> return gifts
        </Text>
        <Text style={styles.minRequirementNotice}>
          Starts at 50 pcs / product
        </Text>
      </View>
    </View>
  ), [search, selectedFilter, filteredGifts.length]);

  return (
    <View style={styles.screen}>
      {/* 1. Header (Safe-Area Aware) */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
        <View style={styles.headerTitleContainer}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Return Gifts</Text>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>Min 50 Pcs</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>
            Wholesale bulk gifts for weddings, housewarming & pooja
          </Text>
        </View>

        {/* Cart Quick Button */}
        <TouchableOpacity
          style={styles.cartBtn}
          activeOpacity={0.7}
          onPress={() => setActiveTab('cart')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="shopping-bag" size={20} color={colors.textPrimary} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cartCount > 99 ? '99+' : cartCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* High-Performance Virtualized Grid (instant rendering, 0ms lag) */}
      <FlatList
        data={filteredGifts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderProductItem}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 100 }
        ]}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={3}
        removeClippedSubviews={Platform.OS === 'android'}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          returnGiftsLoading && returnGifts.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.brandForestGreen} />
              <Text style={styles.loadingText}>Loading luxury return gifts collection...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <EmptyState
                icon="gift"
                title="No Return Gifts Found"
                description={
                  search
                    ? `No return gifts matched "${search}". Try checking your spelling or clear filters.`
                    : 'No gifts available in this price bracket right now.'
                }
                actionLabel="View All Return Gifts"
                onAction={() => {
                  setSearch('');
                  setSelectedFilter('All Gifts');
                }}
              />
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brandForestGreen}
            colors={[colors.brandForestGreen]}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundWarm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceTertiary,
  },
  headerTitleContainer: {
    flex: 1,
    paddingRight: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  badgePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  cartBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.surfaceTertiary,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.accentRed,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  scrollContent: {
    paddingTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    marginHorizontal: spacing.pageHorizontal,
    marginTop: 6,
    marginBottom: 10,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.subtle,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  filterRow: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterChipActive: {
    backgroundColor: colors.brandForestGreen,
    borderColor: colors.brandForestGreen,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  resultMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.pageHorizontal,
    marginVertical: 6,
  },
  resultCountText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  resultCountBold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  minRequirementNotice: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.brandForestGreen,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.pageHorizontal,
    marginBottom: COLUMN_GAP,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptyContainer: {
    paddingVertical: 30,
  },
});

export default ReturnGiftsView;
