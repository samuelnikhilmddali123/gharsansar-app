import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  TextInput,
  Dimensions,
  Modal,
} from 'react-native';
import { Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import { useMobileApp, Product } from '../context/MobileAppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PremiumImage } from '../components/PremiumImage';
import ProductCard from '../components/ProductCard';
import SectionHeader from '../components/SectionHeader';
import { tokens } from '../theme/tokens';
import { KeyboardSafeScrollView } from '../components/KeyboardSafeScrollView';

import { BACKEND_URL } from '../config/api';

const { width: screenWidth } = Dimensions.get('window');

const getBrandName = (title: string, category: string) => {
  const brandKeywords = ['Cello', 'MUMASTORE', 'Sobo', 'Sunsun', 'Bluepet', 'Hailea', 'Nubios', 'Xinxiu', 'Yu Fei Yang', 'Aquacartman', 'Kondapalli'];
  for (const keyword of brandKeywords) {
    if (title.toLowerCase().includes(keyword.toLowerCase())) {
      return keyword.toUpperCase();
    }
  }
  if (category.includes('Steel') || category.includes('Kitchen')) return 'SONU STEEL';
  if (category.includes('Decor') || category.includes('Idol')) return 'RAJASTHAN ARTS';
  if (category.includes('Toys')) return 'KONDAPALLI CRAFTS';
  return 'GHAR SANSAR ELITE';
};

const getProductTagline = (category: string) => {
  const taglines: { [key: string]: string } = {
    'Sonu Steel Products': 'Premium Quality Food-Grade Cook & Serveware',
    'Kitchen & Steel': 'Premium Quality Food-Grade Cook & Serveware',
    'Garden & Birds': 'Handcrafted Natural Nesting & Garden Aesthetics',
    'Kondapalli Toys': 'Charming Hand-Carved Traditional Wood Crafts',
    'Bottles & Jars': 'Premium Grade Leak-Proof Hydration Flasks',
    'Wallpaper Rolls': 'Self-Adhesive Luxurious Wall Aesthetics',
    'Rajasthan Decor': 'Exquisite Handcrafted Traditional Indian Sculptures',
    'Garden Essentials': 'Nourishing Essentials for Lush Indoor & Outdoor Gardens',
    'Premium Mats': 'All-Purpose Durable Anti-Slip Comfort Mats',
    'Water Fountains': 'Serene Indoor Water Fountains for Positive Energy',
    'Aquarium & Accessories': 'High-Performance Advanced Aquatic Filtration & Gear',
    'German Silver & More': 'Elegant Premium German Silver Decorative Arts',
    'Lunch Boxes': 'Leak-Proof Insulated Durable Meal Lockers'
  };
  return taglines[category] || 'Curated Premium Quality Home Essentials';
};

const getProductSpecs = (product: Product) => {
  const brand = getBrandName(product.title, product.category);
  const baseSpecs = [
    { label: 'Brand', value: brand },
    { label: 'Collection', value: product.category },
    { label: 'Sub-Category', value: product.subCategory || 'General' },
    { label: 'Customer Rating', value: `${product.rating || 4.5} / 5.0` },
  ];
  
  if (product.category.includes('Steel') || product.category.includes('Kitchen')) {
    return [
      ...baseSpecs,
      { label: 'Material', value: 'Food-Grade Stainless Steel' },
      { label: 'Dishwasher Safe', value: 'Yes (Highly Safe)' },
      { label: 'Coating', value: 'Mirror Polish Finish' },
    ];
  }
  if (product.category.includes('Aquarium')) {
    return [
      ...baseSpecs,
      { label: 'Material', value: 'Heavy Duty ABS Plastic' },
      { label: 'Power Source', value: 'Electric (Corded 220V)' },
      { label: 'Tank Suitability', value: 'Freshwater & Marine Tanks' },
    ];
  }
  if (product.category.includes('Bottles') || product.category.includes('Lunch')) {
    return [
      ...baseSpecs,
      { label: 'Material', value: 'BPA-Free, Eco-Friendly Material' },
      { label: 'Insulated Type', value: 'Double Walled Vacuum Flask' },
      { label: 'Leak-proof Seal', value: 'Airtight Silicon Seal' },
    ];
  }
  return [
    ...baseSpecs,
    { label: 'Material', value: 'Premium Eco-Composite' },
    { label: 'Origin', value: 'Proudly Crafted in India' },
    { label: 'Design Theme', value: 'Contemporary Luxury' },
  ];
};

const getProductGalleryImages = (product: Product): string[] => {
  if (!product.image) return [];
  return typeof product.image === 'string'
    ? product.image.split(',').map((img) => img.trim()).filter(Boolean)
    : [product.image];
};

const ProductDetailView: React.FC = () => {
  const {
    products,
    paginatedProducts,
    flashSale,
    selectedProductId,
    setSelectedProductId,
    addToCart,
    toggleFavorite,
    favorites
  } = useMobileApp();

  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeAccordion, setActiveAccordion] = useState<string | null>('specs');
  const [pincode, setPincode] = useState('');
  const [checking, setChecking] = useState(false);
  const [serviceInfo, setServiceInfo] = useState<{
    checked: boolean;
    serviceable: boolean;
    city?: string;
    state?: string;
    estimatedDays?: number;
  } | null>(null);

  // Reviews dynamic states
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [ratingAverage, setRatingAverage] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  // Write Review Form states
  const [formName, setFormName] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Zoom modal
  const [zoomModalVisible, setZoomModalVisible] = useState(false);

  // Lookup product
  const product = useMemo(() => {
    return (
      products.find((p) => p.id === selectedProductId) ||
      paginatedProducts.find((p) => p.id === selectedProductId) ||
      (flashSale && flashSale.products.find((p) => p.id === selectedProductId))
    );
  }, [products, paginatedProducts, flashSale, selectedProductId]);

  // Fetch reviews from backend when product changes
  useEffect(() => {
    if (product) {
      setActiveImageIndex(0);
      setServiceInfo(null);
      setPincode('');

      const fetchReviews = async () => {
        setReviewsLoading(true);
        try {
          const res = await fetch(`${BACKEND_URL}/api/reviews/${product.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              setReviews(data.reviews || []);
              setRatingAverage(data.rating_average || product.rating || 0);
              setRatingCount(data.rating_count || product.reviewsCount || 0);
            }
          }
        } catch (err) {
          // fallback to product default
          setRatingAverage(product.rating || 0);
          setRatingCount(product.reviewsCount || 0);
        } finally {
          setReviewsLoading(false);
        }
      };
      fetchReviews();
    }
  }, [product?.id]);

  if (!product) {
    return (
      <View style={styles.errorScreen}>
        <Ionicons name="alert-circle-outline" size={54} color={tokens.colors.discount} />
        <Text style={styles.errorText}>Product Not Found</Text>
        <TouchableOpacity style={styles.errorBtn} onPress={() => setSelectedProductId(null)}>
          <Text style={styles.errorBtnText}>Return to Catalog</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = getProductGalleryImages(product);
  const isFav = favorites.includes(product.id);
  const brandName = getBrandName(product.title, product.category);
  const tagline = getProductTagline(product.category);
  const specifications = getProductSpecs(product);

  const savingsValue = Math.max(0, (product.actPrice || product.price) - product.price);
  const discountPercent =
    product.actPrice > product.price
      ? Math.round((savingsValue / product.actPrice) * 100)
      : 0;

  // Related products from the same category
  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 6);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${product.title} on Ghar Sansar: ₹${product.price.toLocaleString()}! https://gharsansar.website/products/${product.id}`,
      });
    } catch (e) {
      console.log('Share error', e);
    }
  };

  const handleAddToCart = () => {
    addToCart(product);
    Alert.alert('Added to Bag', `${product.title} has been added to your shopping bag.`);
  };

  const handleBuyNow = () => {
    addToCart(product);
    setSelectedProductId(null);
    Alert.alert('Proceeding to Checkout', `Item added to bag. Please open your Shopping Bag to complete checkout.`);
  };

  const handleCheckPincode = async () => {
    if (!pincode || pincode.length < 6) {
      Alert.alert('Pincode', 'Please enter a valid 6-digit Indian PIN code.');
      return;
    }
    setChecking(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/shipping/serviceability/${pincode}`);
      if (res.ok) {
        const data = await res.json();
        setServiceInfo({
          checked: true,
          serviceable: data.serviceable !== false,
          city: data.city || 'Your City',
          state: data.state || 'India',
          estimatedDays: data.estimated_days || 3,
        });
      } else {
        setServiceInfo({
          checked: true,
          serviceable: true,
          city: 'Local Area',
          state: 'Express Hub',
          estimatedDays: 3,
        });
      }
    } catch {
      setServiceInfo({
        checked: true,
        serviceable: true,
        city: 'Local Area',
        state: 'Express Hub',
        estimatedDays: 3,
      });
    } finally {
      setChecking(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!formName.trim() || !formComment.trim()) {
      Alert.alert('Error', 'Please fill in both name and review comment.');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/reviews/${product.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          rating: formRating,
          comment: formComment.trim(),
          image: '',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setReviews(data.reviews || []);
          setRatingAverage(data.rating_average || formRating);
          setRatingCount(data.rating_count || 1);
          setShowReviewModal(false);
          setFormName('');
          setFormComment('');
          Alert.alert('Thank You', 'Your review has been published.');
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Could not post review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* 1. TOP HEADER (Back, Wishlist, Share) */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          activeOpacity={0.7}
          onPress={() => setSelectedProductId(null)}
        >
          <Feather name="arrow-left" size={22} color={tokens.colors.primary} />
        </TouchableOpacity>

        <Text style={styles.headerBrandTitle} numberOfLines={1}>
          {brandName}
        </Text>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            onPress={() => toggleFavorite(product.id)}
          >
            <FontAwesome
              name={isFav ? 'heart' : 'heart-o'}
              size={20}
              color={isFav ? tokens.colors.discount : tokens.colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            onPress={handleShare}
          >
            <Feather name="share-2" size={20} color={tokens.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardSafeScrollView
        ref={scrollViewRef as any}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        extraScrollHeight={140}
      >
        {/* 2. CONTROLLED SQUARE GALLERY */}
        <View style={styles.galleryContainer}>
          <TouchableOpacity
            style={styles.mainImageWrapper}
            activeOpacity={0.95}
            onPress={() => setZoomModalVisible(true)}
          >
            <PremiumImage
              uri={images[activeImageIndex] || product.image}
              style={styles.mainImage}
              product={product}
              contentFit="contain"
            />
            {discountPercent > 0 && (
              <View style={styles.galleryDiscountBadge}>
                <Text style={styles.galleryDiscountText}>{discountPercent}% OFF</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Small thumbnail carousel if multiple images exist */}
          {images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailRow}
            >
              {images.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.thumbBtn,
                    activeImageIndex === idx && styles.thumbBtnActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setActiveImageIndex(idx)}
                >
                  <PremiumImage
                    uri={img}
                    style={styles.thumbImage}
                    product={product}
                    contentFit="contain"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 3. PRODUCT INFO & BRAND HIERARCHY */}
        <View style={styles.infoSection}>
          <Text style={styles.brandSubtitle}>{brandName}</Text>
          <Text style={styles.productTitle}>{product.title}</Text>
          <Text style={styles.productTagline}>{tagline}</Text>

          {/* Feature Tags */}
          <View style={styles.featureTagsRow}>
            <View style={styles.featureTag}>
              <Feather name="award" size={12} color={tokens.colors.accent} />
              <Text style={styles.featureTagText}>Premium Quality</Text>
            </View>
            <View style={styles.featureTag}>
              <Feather name="truck" size={12} color={tokens.colors.accent} />
              <Text style={styles.featureTagText}>Fast Delivery</Text>
            </View>
            <View style={styles.featureTag}>
              <Feather name="shield" size={12} color={tokens.colors.accent} />
              <Text style={styles.featureTagText}>Safe Packaging</Text>
            </View>
          </View>
        </View>

        {/* 4. RATING & REVIEWS SUMMARY */}
        <View style={styles.ratingSection}>
          {ratingCount > 0 ? (
            <View style={styles.ratingRow}>
              <View style={styles.starBadge}>
                <FontAwesome name="star" size={12} color="#FFFFFF" />
                <Text style={styles.starBadgeText}>
                  {ratingAverage ? ratingAverage.toFixed(1) : '4.5'}
                </Text>
              </View>
              <Text style={styles.ratingCountText}>
                {ratingCount} verified {ratingCount === 1 ? 'review' : 'reviews'}
              </Text>
            </View>
          ) : (
            <View style={styles.ratingRow}>
              <Text style={styles.noReviewsText}>No reviews yet</Text>
              <Text style={styles.ratingCountText}>Be the first to review this product</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.writeReviewBtn}
            activeOpacity={0.7}
            onPress={() => setShowReviewModal(true)}
          >
            <Feather name="edit-2" size={13} color={tokens.colors.accent} />
            <Text style={styles.writeReviewText}>Write a Review</Text>
          </TouchableOpacity>
        </View>

        {/* 5. PRICE SECTION (Clean, Not Oversized) */}
        <View style={styles.priceSection}>
          <View style={styles.priceTopRow}>
            {discountPercent > 0 && (
              <View style={styles.priceDiscountPill}>
                <Text style={styles.priceDiscountPillText}>{discountPercent}% OFF</Text>
              </View>
            )}
            <Text style={styles.heroPrice}>₹{product.price.toLocaleString()}</Text>
            {product.actPrice > product.price && (
              <Text style={styles.heroMrp}>MRP ₹{product.actPrice.toLocaleString()}</Text>
            )}
          </View>

          <View style={styles.savingsRow}>
            {savingsValue > 0 && (
              <Text style={styles.savingsHighlight}>
                You Save ₹{savingsValue.toLocaleString()}
              </Text>
            )}
            <Text style={styles.taxesMuted}>Inclusive of all taxes</Text>
          </View>
        </View>

        {/* 6. PINCODE & DELIVERY CHECKER */}
        <View style={styles.pincodeCard}>
          <View style={styles.pincodeHeader}>
            <Feather name="map-pin" size={16} color={tokens.colors.accent} />
            <Text style={styles.pincodeTitle}>Delivery Options</Text>
          </View>

          <View style={styles.pincodeInputRow}>
            <TextInput
              style={styles.pincodeInput}
              placeholder="Enter 6-digit Pincode"
              placeholderTextColor={tokens.colors.textMuted}
              keyboardType="number-pad"
              maxLength={6}
              value={pincode}
              onChangeText={setPincode}
            />
            <TouchableOpacity
              style={styles.pincodeCheckBtn}
              activeOpacity={0.8}
              onPress={handleCheckPincode}
            >
              <Text style={styles.pincodeCheckText}>
                {checking ? 'Checking...' : 'Check'}
              </Text>
            </TouchableOpacity>
          </View>

          {serviceInfo && (
            <View style={styles.serviceResult}>
              <Feather
                name={serviceInfo.serviceable ? 'check-circle' : 'x-circle'}
                size={16}
                color={serviceInfo.serviceable ? tokens.colors.savings : tokens.colors.discount}
              />
              <Text style={styles.serviceResultText}>
                {serviceInfo.serviceable
                  ? `Delivery available in ${serviceInfo.estimatedDays} days to ${serviceInfo.city}`
                  : 'Currently unavailable for this pin code'}
              </Text>
            </View>
          )}
        </View>

        {/* 7. SPECIFICATIONS & CARE ACCORDION */}
        <View style={styles.accordionContainer}>
          <TouchableOpacity
            style={styles.accordionHeader}
            activeOpacity={0.7}
            onPress={() =>
              setActiveAccordion(activeAccordion === 'specs' ? null : 'specs')
            }
          >
            <Text style={styles.accordionTitle}>Product Specifications</Text>
            <Feather
              name={activeAccordion === 'specs' ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={tokens.colors.primary}
            />
          </TouchableOpacity>

          {activeAccordion === 'specs' && (
            <View style={styles.specsBody}>
              {specifications.map((spec, i) => (
                <View key={i} style={styles.specRow}>
                  <Text style={styles.specLabel}>{spec.label}</Text>
                  <Text style={styles.specValue}>{spec.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 8. CUSTOMER REVIEWS LIST */}
        {reviews.length > 0 && (
          <View style={styles.reviewsListSection}>
            <Text style={styles.reviewsListTitle}>Customer Feedback ({reviews.length})</Text>
            {reviews.slice(0, 3).map((rev, index) => (
              <View key={index} style={styles.reviewItemCard}>
                <View style={styles.reviewItemHeader}>
                  <Text style={styles.reviewerName}>{rev.name || 'Verified Buyer'}</Text>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <FontAwesome
                        key={s}
                        name="star"
                        size={11}
                        color={s <= rev.rating ? '#FFB800' : tokens.colors.border}
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewComment}>{rev.comment}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 9. SIMILAR PRODUCTS CAROUSEL */}
        {relatedProducts.length > 0 && (
          <View style={styles.relatedSection}>
            <SectionHeader title="Similar Essentials" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedCarousel}
            >
              {relatedProducts.map((p) => (
                <View key={p.id} style={{ width: 165 }}>
                  <ProductCard product={p} />
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </KeyboardSafeScrollView>

      {/* 10. FIXED BOTTOM PURCHASE BAR (Safe-area aware) */}
      <View style={styles.bottomPurchaseBar}>
        <View style={styles.purchasePriceCol}>
          <Text style={styles.purchaseCurrentPrice}>₹{product.price.toLocaleString()}</Text>
          {product.actPrice > product.price && (
            <Text style={styles.purchaseMrp}>MRP ₹{product.actPrice.toLocaleString()}</Text>
          )}
        </View>

        <View style={styles.purchaseButtonsRow}>
          <TouchableOpacity
            style={styles.addToCartBtn}
            activeOpacity={0.8}
            onPress={handleAddToCart}
          >
            <Feather name="shopping-bag" size={15} color={tokens.colors.primary} />
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buyNowBtn}
            activeOpacity={0.85}
            onPress={handleBuyNow}
          >
            <Text style={styles.buyNowText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Write Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardSafeScrollView
            containerStyle={{ width: '100%' }}
            contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', minHeight: '100%', paddingVertical: 20 }}
            extraScrollHeight={140}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Rate & Review</Text>
                <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                  <Feather name="x" size={20} color={tokens.colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.starPickerRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} onPress={() => setFormRating(s)}>
                    <FontAwesome
                      name={s <= formRating ? 'star' : 'star-o'}
                      size={28}
                      color={s <= formRating ? '#FFB800' : tokens.colors.border}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.modalInput}
                placeholder="Your Full Name"
                placeholderTextColor={tokens.colors.textMuted}
                value={formName}
                onChangeText={setFormName}
              />

              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Share your experience with this home essential..."
                placeholderTextColor={tokens.colors.textMuted}
                multiline
                numberOfLines={4}
                value={formComment}
                onChangeText={setFormComment}
              />

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                activeOpacity={0.8}
                onPress={handleReviewSubmit}
              >
                <Text style={styles.modalSubmitText}>
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardSafeScrollView>
        </View>
      </Modal>

      {/* Fullscreen Zoom Modal */}
      <Modal
        visible={zoomModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setZoomModalVisible(false)}
      >
        <View style={styles.zoomModalOverlay}>
          <TouchableOpacity
            style={styles.zoomCloseBtn}
            onPress={() => setZoomModalVisible(false)}
          >
            <Feather name="x" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.zoomImageContainer}>
            <PremiumImage
              uri={images[activeImageIndex] || product.image}
              style={styles.zoomImage}
              product={product}
              contentFit="contain"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  scrollContent: {
    paddingBottom: 110, // Content is never covered by the fixed bottom purchase bar
  },

  // Error screen
  errorScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacing.xl,
    backgroundColor: tokens.colors.background,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.primary,
    marginTop: 12,
    marginBottom: 20,
  },
  errorBtn: {
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: tokens.radius.button,
  },
  errorBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // 1. Header Bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: 12,
    backgroundColor: tokens.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.borderLight,
    ...tokens.shadows.subtle,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: tokens.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  headerBrandTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // 2. Controlled Gallery
  galleryContainer: {
    backgroundColor: tokens.colors.surface,
    paddingVertical: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.borderLight,
  },
  mainImageWrapper: {
    width: screenWidth - 32,
    height: screenWidth - 48,
    maxHeight: 340,
    alignSelf: 'center',
    borderRadius: tokens.radius.card,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  mainImage: {
    width: '90%',
    height: '90%',
  },
  galleryDiscountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: tokens.colors.discount,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: tokens.radius.pill,
  },
  galleryDiscountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  thumbnailRow: {
    flexDirection: 'row',
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
    gap: 10,
  },
  thumbBtn: {
    width: 56,
    height: 56,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbBtnActive: {
    borderColor: tokens.colors.accent,
  },
  thumbImage: {
    width: '85%',
    height: '85%',
  },

  // 3. Info Section
  infoSection: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.lg,
    backgroundColor: tokens.colors.surface,
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.accent,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.primary,
    lineHeight: 24,
    marginBottom: 4,
  },
  productTagline: {
    fontSize: 13,
    color: tokens.colors.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  featureTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: tokens.spacing.md,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: tokens.colors.brandGoldBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(3, 28, 3, 0.2)',
  },
  featureTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: tokens.colors.primary,
  },

  // 4. Rating Section
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    backgroundColor: tokens.colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: tokens.colors.borderLight,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: tokens.colors.savings,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  starBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  ratingCountText: {
    fontSize: 12,
    color: tokens.colors.textMuted,
    fontWeight: '500',
  },
  noReviewsText: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.primary,
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  writeReviewText: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.accent,
  },

  // 5. Price Section
  priceSection: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    backgroundColor: tokens.colors.surface,
    marginBottom: tokens.spacing.sm,
  },
  priceTopRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 4,
  },
  priceDiscountPill: {
    backgroundColor: tokens.colors.discount,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priceDiscountPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  heroPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: tokens.colors.primary,
  },
  heroMrp: {
    fontSize: 14,
    color: tokens.colors.textMuted,
    textDecorationLine: 'line-through',
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savingsHighlight: {
    fontSize: 13,
    fontWeight: '700',
    color: tokens.colors.savings,
  },
  taxesMuted: {
    fontSize: 11,
    color: tokens.colors.textMuted,
  },

  // 6. Pincode Card
  pincodeCard: {
    backgroundColor: tokens.colors.surface,
    marginHorizontal: tokens.spacing.lg,
    marginVertical: tokens.spacing.sm,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    ...tokens.shadows.subtle,
  },
  pincodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  pincodeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  pincodeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pincodeInput: {
    flex: 1,
    height: 42,
    backgroundColor: tokens.colors.surfaceAlt,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: 12,
    fontSize: 13,
    color: tokens.colors.primary,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  pincodeCheckBtn: {
    height: 42,
    paddingHorizontal: 18,
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pincodeCheckText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  serviceResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    backgroundColor: 'rgba(46, 125, 50, 0.08)',
    padding: 8,
    borderRadius: tokens.radius.sm,
  },
  serviceResultText: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.savings,
  },

  // 7. Specifications Accordion
  accordionContainer: {
    backgroundColor: tokens.colors.surface,
    marginHorizontal: tokens.spacing.lg,
    marginVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    overflow: 'hidden',
    ...tokens.shadows.subtle,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacing.md,
  },
  accordionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  specsBody: {
    paddingHorizontal: tokens.spacing.md,
    paddingBottom: tokens.spacing.md,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.borderLight,
  },
  specLabel: {
    fontSize: 13,
    color: tokens.colors.textMuted,
  },
  specValue: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.primary,
  },

  // 8. Reviews list
  reviewsListSection: {
    backgroundColor: tokens.colors.surface,
    marginHorizontal: tokens.spacing.lg,
    marginVertical: tokens.spacing.sm,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    ...tokens.shadows.subtle,
  },
  reviewsListTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.primary,
    marginBottom: 10,
  },
  reviewItemCard: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.borderLight,
  },
  reviewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.primary,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 12,
    color: tokens.colors.textSecondary,
    lineHeight: 16,
  },

  // 9. Related section
  relatedSection: {
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  relatedCarousel: {
    paddingHorizontal: tokens.spacing.lg,
    gap: 12,
  },

  // 10. Fixed Bottom Purchase Bar
  bottomPurchaseBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: tokens.colors.surface,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: 10,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...tokens.shadows.card,
  },
  purchasePriceCol: {
    justifyContent: 'center',
  },
  purchaseCurrentPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: tokens.colors.primary,
  },
  purchaseMrp: {
    fontSize: 11,
    color: tokens.colors.textMuted,
    textDecorationLine: 'line-through',
  },
  purchaseButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: tokens.colors.surface,
    borderWidth: 1.5,
    borderColor: tokens.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: tokens.radius.button,
  },
  addToCartText: {
    fontSize: 13,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  buyNowBtn: {
    backgroundColor: tokens.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: tokens.radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyNowText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Modal Review
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: tokens.colors.surface,
    borderTopLeftRadius: tokens.radius.card,
    borderTopRightRadius: tokens.radius.card,
    padding: tokens.spacing.lg,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  starPickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalInput: {
    height: 44,
    backgroundColor: tokens.colors.surfaceAlt,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: 12,
    fontSize: 13,
    color: tokens.colors.primary,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    marginBottom: 12,
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  modalSubmitBtn: {
    backgroundColor: tokens.colors.primary,
    paddingVertical: 14,
    borderRadius: tokens.radius.button,
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // Zoom Modal
  zoomModalOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomImageContainer: {
    width: screenWidth,
    height: screenWidth,
  },
  zoomImage: {
    width: '100%',
    height: '100%',
  },
});

export default ProductDetailView;
