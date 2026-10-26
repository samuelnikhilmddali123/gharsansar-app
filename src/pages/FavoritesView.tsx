import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useMobileApp } from '../context/MobileAppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import { tokens } from '../theme/tokens';

const { width: screenWidth } = Dimensions.get('window');
const COLUMN_GAP = 12;
const HORIZONTAL_PADDING = tokens.spacing.lg;
const CARD_WIDTH = (screenWidth - (HORIZONTAL_PADDING * 2) - COLUMN_GAP) / 2;

const FavoritesView: React.FC = () => {
  const { products, favorites, setActiveTab } = useMobileApp();
  const insets = useSafeAreaInsets();

  const favoriteProducts = products.filter((p) => favorites.includes(p.id));

  return (
    <View style={styles.screen}>
      {/* 1. Header (Safe-Area Aware) */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
        <View>
          <Text style={styles.headerTitle}>Wishlist</Text>
          <Text style={styles.headerSubtitle}>
            {favoriteProducts.length} {favoriteProducts.length === 1 ? 'item' : 'items'} saved
          </Text>
        </View>
        {favoriteProducts.length > 0 && (
          <TouchableOpacity
            style={styles.exploreMoreBtn}
            activeOpacity={0.7}
            onPress={() => setActiveTab('explore')}
          >
            <Text style={styles.exploreMoreText}>Discover More</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Content */}
      {favoriteProducts.length === 0 ? (
        <EmptyState
          icon="heart"
          title="Your Wishlist is Empty"
          description="Explore our curated collections and save your favorite home & kitchen essentials."
          actionLabel="Explore Collections"
          onAction={() => setActiveTab('explore')}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.productGrid}>
            {favoriteProducts.map((product) => (
              <View key={product.id} style={{ width: CARD_WIDTH }}>
                <ProductCard product={product} />
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md,
    backgroundColor: tokens.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
    ...tokens.shadows.subtle,
  },
  headerTitle: {
    fontSize: tokens.typography.sectionTitle.fontSize,
    fontWeight: '700',
    color: tokens.colors.primary,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: tokens.typography.tiny.fontSize,
    color: tokens.colors.textMuted,
    marginTop: 2,
  },
  exploreMoreBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  exploreMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.primary,
  },
  scrollContent: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.lg,
    paddingBottom: 110, // Content is never hidden behind the bottom navigation
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: COLUMN_GAP,
  },
});

export default FavoritesView;
