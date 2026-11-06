import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useMobileApp, formatCurrency } from '../context/MobileAppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PremiumImage } from '../components/PremiumImage';
import EmptyState from '../components/EmptyState';
import { tokens } from '../theme/tokens';
import { KeyboardSafeScrollView } from '../components/KeyboardSafeScrollView';
import { sendCartWhatsAppOrder } from '../utils/whatsappEnquiry';

const CartView: React.FC = () => {
  const {
    cart,
    updateCartQuantity,
    toggleCartSelection,
    toggleAllCartSelections,
    toggleFavorite,
    favorites,
    setActiveTab,
    setSelectedProductId,
    currentAddress,
    saveShippingAddress,
    placeOrder,
    user,
    isAuthenticated,
  } = useMobileApp();

  const insets = useSafeAreaInsets();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);

  // Real Address Modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addrName, setAddrName] = useState(currentAddress?.name || user?.name || '');
  const [addrPhone, setAddrPhone] = useState(currentAddress?.phone || user?.phone || '');
  const [addrStreet, setAddrStreet] = useState(currentAddress?.address || '');
  const [addrCity, setAddrCity] = useState(currentAddress?.city || '');
  const [addrState, setAddrState] = useState(currentAddress?.state || '');
  const [addrZip, setAddrZip] = useState(currentAddress?.zipCode || '');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState<{ orderId: string } | null>(null);

  const selectedItems = cart.filter((item) => item.selected);
  const allSelected = cart.length > 0 && cart.every((item) => item.selected);
  const selectedCount = selectedItems.length;

  const handleSelectAllToggle = () => {
    toggleAllCartSelections(!allSelected);
  };

  // Subtotal & MRP calculations (3-Price Architecture: Strike Price vs Final Price)
  const rawSubtotal = selectedItems.reduce(
    (sum, item) => {
      const p = item.product;
      const finalPrice = p.finalPrice !== undefined ? p.finalPrice : (p.price !== undefined ? p.price : p.actualPrice);
      return sum + finalPrice * item.quantity;
    },
    0
  );
  const rawMrpTotal = selectedItems.reduce(
    (sum, item) => {
      const p = item.product;
      const strike = p.strikePrice || p.actPrice || (p.finalPrice !== undefined ? p.finalPrice : p.price);
      return sum + strike * item.quantity;
    },
    0
  );
  const productSavings = Math.max(0, rawMrpTotal - rawSubtotal);
  const finalTotal = Math.max(0, rawSubtotal - couponDiscount);

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      Alert.alert('Coupon Code', 'Please enter a valid promo code.');
      return;
    }
    const cleanCode = couponCode.trim().toUpperCase();
    if (cleanCode === 'GHAR10' || cleanCode === 'LUXURY' || cleanCode === 'WELCOME') {
      const discount = Math.round(rawSubtotal * 0.1);
      setAppliedCoupon(cleanCode);
      setCouponDiscount(discount);
      Alert.alert('Success', `Promo code "${cleanCode}" applied! You saved ₹${discount}.`);
    } else {
      Alert.alert('Invalid Code', 'The entered promo code is expired or invalid. Try "GHAR10".');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
  };

  const handleSaveAddress = async () => {
    if (!addrStreet.trim()) {
      Alert.alert('Required', 'Please enter your street address / house no.');
      return;
    }
    if (!addrCity.trim()) {
      Alert.alert('Required', 'Please enter your city.');
      return;
    }
    if (!addrZip.trim()) {
      Alert.alert('Required', 'Please enter your postal pincode.');
      return;
    }
    await saveShippingAddress({
      name: addrName.trim() || user?.name || (user as any)?.full_name || 'Customer',
      phone: addrPhone.trim() || user?.phone || '',
      address: addrStreet.trim(),
      city: addrCity.trim(),
      state: addrState.trim() || 'Andhra Pradesh',
      zipCode: addrZip.trim(),
      isDefault: true,
    });
    setShowAddressModal(false);
    const selectedItems = cart.filter((i) => i.selected);
    if (selectedItems.length > 0) {
      setShowConfirmModal(true);
    } else {
      Alert.alert('Address Saved', 'Your delivery address has been saved.');
    }
  };

  const executeOrderPlacement = async () => {
    setShowConfirmModal(false);
    if (!currentAddress || !currentAddress.address) {
      setShowAddressModal(true);
      return;
    }

    setCheckoutLoading(true);
    const orderPayload = {
      userId: user?.id || (user as any)?._id || user?.email || 'guest',
      customer: {
        firstName: (currentAddress.name || user?.name || (user as any)?.full_name || 'Customer').split(' ')[0],
        lastName: (currentAddress.name || user?.name || (user as any)?.full_name || 'Customer').split(' ').slice(1).join(' ') || '',
        email: user?.email || 'customer@gharsansar.website',
        phone: currentAddress.phone || user?.phone || '9999999999',
        address: currentAddress.address,
        city: currentAddress.city,
        state: currentAddress.state,
        zipCode: currentAddress.zipCode,
        country: 'India',
        notes: appliedCoupon ? `Coupon applied: ${appliedCoupon}` : ''
      },
      shippingAddress: {
        firstName: (currentAddress.name || user?.name || (user as any)?.full_name || 'Customer').split(' ')[0],
        lastName: (currentAddress.name || user?.name || (user as any)?.full_name || 'Customer').split(' ').slice(1).join(' ') || '',
        phone: currentAddress.phone || user?.phone || '9999999999',
        address: currentAddress.address,
        city: currentAddress.city,
        state: currentAddress.state,
        zipCode: currentAddress.zipCode,
        country: 'India',
        isDefault: true
      },
      items: selectedItems.map(item => ({
        id: String(item.product.id),
        productId: String(item.product.id),
        name: item.product.title || item.product.name,
        price: Number(item.product.finalPrice !== undefined ? item.product.finalPrice : item.product.price) || 0,
        quantity: item.quantity,
        image: item.product.image || '',
        selectedSize: (item as any).selectedSize || '',
        selectedColor: (item as any).selectedColor || '',
        isReturnGift: false
      })),
      subtotal: rawSubtotal,
      shipping: 0,
      tax: Math.round(finalTotal * 0.18),
      discount: couponDiscount,
      total: finalTotal,
      totalAmount: finalTotal,
      paymentStatus: 'paid',
      paymentMethod: 'Prepaid / UPI',
      paymentId: `pay_mobile_${Date.now()}`
    };

    const res = await placeOrder(orderPayload);
    setCheckoutLoading(false);

    if (res.success) {
      selectedItems.forEach(item => updateCartQuantity(item.product.id, -item.quantity));
      setOrderSuccessData({ orderId: res.orderId || 'GS-ORD' });
    } else {
      Alert.alert('Order Failed', res.error || 'Failed to place order.');
    }
  };

  const handleWhatsAppCartOrder = async () => {
    const activeItems = cart.filter((i) => i.selected);
    const itemsToOrder = activeItems.length > 0 ? activeItems : cart;

    if (itemsToOrder.length === 0) {
      Alert.alert('Empty Bag', 'Please add items to your shopping bag to order via WhatsApp.');
      return;
    }

    const formattedItems = itemsToOrder.map((item) => ({
      name: item.product.name || item.product.title,
      quantity: item.quantity,
      price: item.product.price,
      image: item.product.image,
    }));

    const itemsSubtotal = itemsToOrder.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    const deliveryCharge = 0; // Free Express Delivery
    const orderGrandTotal = Math.max(0, itemsSubtotal - couponDiscount);

    const customerAddressStr = currentAddress
      ? `${currentAddress.address}, ${currentAddress.city}, ${currentAddress.state} - ${currentAddress.zipCode}`
      : undefined;

    await sendCartWhatsAppOrder({
      items: formattedItems,
      subtotal: itemsSubtotal,
      deliveryCharge,
      grandTotal: orderGrandTotal,
      customer: {
        name: user?.name,
        phone: user?.phone,
        address: customerAddressStr,
      },
    });
  };

  const handleCheckout = () => {
    if (selectedCount === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to proceed to checkout.');
      return;
    }

    if (!isAuthenticated || !user) {
      setActiveTab('account');
      return;
    }

    if (!currentAddress || !currentAddress.address || !currentAddress.address.trim()) {
      setAddrName(user?.name || '');
      setAddrPhone(user?.phone || '');
      setAddrStreet('');
      setAddrCity('');
      setAddrState('');
      setAddrZip('');
      setShowAddressModal(true);
      return;
    }

    setShowConfirmModal(true);
  };

  const handleMoveToWishlist = (item: any) => {
    if (!favorites.includes(item.product.id)) {
      toggleFavorite(item.product.id);
    }
    updateCartQuantity(item.product.id, -item.quantity);
    Alert.alert('Saved', `${item.product.title} moved to your Wishlist.`);
  };

  return (
    <View style={styles.screen}>
      {/* 1. Header (Safe Area Aware) */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setActiveTab('home')}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="arrow-left" size={20} color={tokens.colors.primary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Shopping Bag</Text>
            <Text style={styles.headerSubtitle}>
              {cart.length} {cart.length === 1 ? 'item' : 'items'} in your bag
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.headerActionBtn}
          activeOpacity={0.7}
          onPress={() => setActiveTab('explore')}
        >
          <Feather name="plus" size={18} color={tokens.colors.primary} />
          <Text style={styles.headerActionText}>Add More</Text>
        </TouchableOpacity>
      </View>

      {cart.length === 0 ? (
        <EmptyState
          icon="shopping-bag"
          title="Shopping bag is empty"
          description="Discover something beautiful for your home."
          actionLabel="Continue Shopping"
          onAction={() => setActiveTab('home')}
        />
      ) : (
        <View style={styles.container}>
          <KeyboardSafeScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            extraScrollHeight={180}
          >
            {/* 2. Delivery Address Card */}
            <View style={styles.addressCard}>
              <View style={styles.addressLeft}>
                <View style={styles.addressIconWrapper}>
                  <Feather name="map-pin" size={16} color={tokens.colors.accent} />
                </View>
                <View style={styles.addressInfo}>
                  <View style={styles.addressTagRow}>
                    <Text style={styles.addressDeliverTo}>Deliver to:</Text>
                    <View style={styles.homeTag}>
                      <Text style={styles.homeTagText}>
                        {!isAuthenticated
                          ? 'GUEST'
                          : (currentAddress?.name ? currentAddress.name.toUpperCase() : (user?.name ? user.name.toUpperCase() : 'DESTINATION'))}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.addressLine} numberOfLines={1}>
                    {!isAuthenticated
                      ? 'Please sign in to view or enter delivery address'
                      : (currentAddress && currentAddress.address?.trim()
                          ? `${currentAddress.address}, ${currentAddress.city} - ${currentAddress.zipCode}`
                          : 'No address set — tap Add to enter shipping address')}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.changeAddressBtn}
                activeOpacity={0.7}
                onPress={() => {
                  if (!isAuthenticated) {
                    setActiveTab('account');
                    return;
                  }
                  setAddrName(currentAddress?.name || user?.name || '');
                  setAddrPhone(currentAddress?.phone || user?.phone || '');
                  setAddrStreet(currentAddress?.address || '');
                  setAddrCity(currentAddress?.city || '');
                  setAddrState(currentAddress?.state || '');
                  setAddrZip(currentAddress?.zipCode || '');
                  setShowAddressModal(true);
                }}
              >
                <Text style={styles.changeAddressText}>
                  {!isAuthenticated ? 'Sign In' : (currentAddress?.address?.trim() ? 'Change' : 'Add')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 3. Selection & Batch Bar */}
            <View style={styles.selectionBar}>
              <TouchableOpacity
                style={styles.selectAllBtn}
                activeOpacity={0.7}
                onPress={handleSelectAllToggle}
              >
                <View
                  style={[
                    styles.checkbox,
                    allSelected ? styles.checkboxChecked : styles.checkboxUnchecked,
                  ]}
                >
                  {allSelected && <Feather name="check" size={12} color="#FFFFFF" />}
                </View>
                <Text style={styles.selectAllText}>
                  Select All ({selectedCount}/{cart.length})
                </Text>
              </TouchableOpacity>

              <Text style={styles.selectionNote}>
                {selectedCount > 0 ? `₹${formatCurrency(rawSubtotal)}` : 'None selected'}
              </Text>
            </View>

            {/* 4. Cart Product Items */}
            <View style={styles.itemsList}>
              {cart.map((item) => {
                const itemFinal = item.product.finalPrice !== undefined ? item.product.finalPrice : (item.product.price !== undefined ? item.product.price : item.product.actualPrice);
                const itemStrike = item.product.strikePrice || item.product.actPrice || itemFinal;
                const qty = item.quantity || 1;
                const linePrice = itemFinal * qty;
                const lineStrike = itemStrike * qty;
                const hasItemSavings = lineStrike > linePrice;
                const hasCatPromo = Boolean(item.product.hasCategoryDiscount && item.product.categoryDiscountPercentage > 0);
                const discountBadgeText = hasCatPromo
                  ? `${item.product.categoryDiscountPercentage}% OFF`
                  : (hasItemSavings && lineStrike > 0 ? `${Math.round(((lineStrike - linePrice) / lineStrike) * 100)}% OFF` : null);

                const isItemReturnGift = Boolean(
                  item.product.isReturnGift ||
                  item.product.category === 'Return Gifts' ||
                  item.product.category === 'return_gifts' ||
                  String(item.product.id).startsWith('rg-')
                );

                return (
                  <View key={item.product.id} style={styles.cartCard}>
                    {/* Top Row: Checkbox, Thumbnail, Details */}
                    <View style={styles.cardTopRow}>
                      <TouchableOpacity
                        style={[
                          styles.checkbox,
                          item.selected ? styles.checkboxChecked : styles.checkboxUnchecked,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => toggleCartSelection(item.product.id)}
                      >
                        {item.selected && <Feather name="check" size={12} color="#FFFFFF" />}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.thumbnailWrapper}
                        activeOpacity={0.9}
                        onPress={() => setSelectedProductId(item.product.id)}
                      >
                        <PremiumImage
                          uri={item.product.image}
                          style={styles.thumbnail}
                          product={item.product}
                          contentFit="contain"
                        />
                      </TouchableOpacity>

                      <View style={styles.productDetails}>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => setSelectedProductId(item.product.id)}
                        >
                          <Text style={styles.productTitle} numberOfLines={2}>
                            {item.product.title}
                          </Text>
                        </TouchableOpacity>

                        {isItemReturnGift ? (
                          <View style={styles.returnGiftCartBadge}>
                            <Text style={styles.returnGiftCartBadgeText}>🎁 Bulk Gift (Min 50 pcs)</Text>
                          </View>
                        ) : (
                          <Text style={styles.categoryBadge}>{item.product.category}</Text>
                        )}

                        <View style={styles.priceRow}>
                          <Text style={styles.currentPrice}>
                            ₹{formatCurrency(linePrice)}
                          </Text>
                          {hasItemSavings && (
                            <>
                              <Text style={styles.mrpPrice}>
                                ₹{formatCurrency(lineStrike)}
                              </Text>
                              {discountBadgeText && (
                                <Text style={styles.discountBadge}>
                                  {discountBadgeText}
                                </Text>
                              )}
                            </>
                          )}
                        </View>
                        {qty > 1 && (
                          <Text style={styles.unitPriceHint}>
                            (₹{formatCurrency(itemFinal)} each)
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.cardDivider} />

                    {/* Bottom Row: Stepper, Wishlist, Remove */}
                    <View style={styles.cardActionsRow}>
                      <View style={styles.stepperContainer}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          activeOpacity={0.7}
                          onPress={() => {
                            if (isItemReturnGift) {
                              if (item.quantity <= 50) {
                                Alert.alert(
                                  'Remove Return Gift?',
                                  'Return gifts require a minimum order of 50 units. Would you like to remove this item from your cart?',
                                  [
                                    { text: 'Keep in Cart', style: 'cancel' },
                                    {
                                      text: 'Remove',
                                      style: 'destructive',
                                      onPress: () => updateCartQuantity(item.product.id, -item.quantity),
                                    },
                                  ]
                                );
                              } else {
                                updateCartQuantity(item.product.id, -1);
                              }
                            } else {
                              updateCartQuantity(item.product.id, -1);
                            }
                          }}
                        >
                          <Feather name="minus" size={14} color={tokens.colors.primary} />
                        </TouchableOpacity>
                        <Text style={styles.stepperValue}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          activeOpacity={0.7}
                          onPress={() => updateCartQuantity(item.product.id, 1)}
                        >
                          <Feather name="plus" size={14} color={tokens.colors.primary} />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.itemSecondaryActions}>
                        <TouchableOpacity
                          style={styles.secondaryActionBtn}
                          activeOpacity={0.7}
                          onPress={() => handleMoveToWishlist(item)}
                        >
                          <FontAwesome
                            name={favorites.includes(item.product.id) ? 'heart' : 'heart-o'}
                            size={14}
                            color={
                              favorites.includes(item.product.id)
                                ? tokens.colors.discount
                                : tokens.colors.textMuted
                            }
                          />
                          <Text style={styles.secondaryActionText}>Save for later</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.secondaryActionBtn}
                          activeOpacity={0.7}
                          onPress={() => updateCartQuantity(item.product.id, -item.quantity)}
                        >
                          <Feather name="trash-2" size={14} color={tokens.colors.discount} />
                          <Text
                            style={[styles.secondaryActionText, { color: tokens.colors.discount }]}
                          >
                            Remove
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* 5. Coupon Card */}
            <View style={styles.couponCard}>
              <View style={styles.couponTitleRow}>
                <Feather name="tag" size={16} color={tokens.colors.accent} />
                <Text style={styles.couponTitle}>Apply Coupon / Voucher</Text>
              </View>

              {appliedCoupon ? (
                <View style={styles.appliedCouponBanner}>
                  <View style={styles.appliedCouponInfo}>
                    <Feather name="check-circle" size={16} color={tokens.colors.savings} />
                    <Text style={styles.appliedCouponCode}>{appliedCoupon}</Text>
                    <Text style={styles.appliedCouponSavings}>Saved ₹{couponDiscount}</Text>
                  </View>
                  <TouchableOpacity activeOpacity={0.7} onPress={handleRemoveCoupon}>
                    <Text style={styles.removeCouponText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.couponInputRow}>
                  <TextInput
                    style={styles.couponInput}
                    placeholder="Enter coupon (e.g. GHAR10)"
                    placeholderTextColor={tokens.colors.textMuted}
                    value={couponCode}
                    onChangeText={setCouponCode}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity
                    style={[
                      styles.applyCouponBtn,
                      !couponCode.trim() && styles.applyCouponBtnDisabled,
                    ]}
                    activeOpacity={0.8}
                    onPress={handleApplyCoupon}
                    disabled={!couponCode.trim()}
                  >
                    <Text style={styles.applyCouponText}>APPLY</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* 6. Price Breakdown Summary */}
            <View style={styles.billCard}>
              <Text style={styles.billTitle}>Price Details ({selectedCount} items)</Text>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Total MRP</Text>
                <Text style={styles.billValue}>₹{formatCurrency(rawMrpTotal)}</Text>
              </View>

              {productSavings > 0 && (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Discount on MRP</Text>
                  <Text style={[styles.billValue, styles.billSavings]}>
                    -₹{formatCurrency(productSavings)}
                  </Text>
                </View>
              )}

              {couponDiscount > 0 && (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Coupon Discount</Text>
                  <Text style={[styles.billValue, styles.billSavings]}>
                    -₹{formatCurrency(couponDiscount)}
                  </Text>
                </View>
              )}

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Delivery Fee</Text>
                <View style={styles.freeDeliveryBadge}>
                  <Text style={styles.freeDeliveryText}>FREE</Text>
                </View>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Taxes & Charges</Text>
                <Text style={styles.billValueMuted}>Included</Text>
              </View>

              <View style={styles.billDivider} />

              <View style={styles.totalRow}>
                <View>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalSubLabel}>Inclusive of all taxes</Text>
                </View>
                <Text style={styles.totalAmount}>₹{formatCurrency(finalTotal)}</Text>
              </View>

              {productSavings + couponDiscount > 0 && (
                <View style={styles.totalSavingsBanner}>
                  <Feather name="check" size={15} color={tokens.colors.savings} />
                  <Text style={styles.totalSavingsText}>
                    You will save ₹{formatCurrency(productSavings + couponDiscount)} on this order
                  </Text>
                </View>
              )}

              {/* Primary In-Card Checkout Button (Proceed to Buy) */}
              <TouchableOpacity
                style={[
                  styles.proceedToBuyBtn,
                  (selectedCount === 0 || checkoutLoading) && styles.proceedToBuyBtnDisabled,
                ]}
                activeOpacity={0.85}
                onPress={handleCheckout}
                disabled={checkoutLoading || selectedCount === 0}
              >
                {checkoutLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.proceedToBuyBtnText}>
                      {selectedCount === 0
                        ? 'Select Items to Buy'
                        : `Proceed to Buy (${selectedCount} ${selectedCount === 1 ? 'item' : 'items'})`}
                    </Text>
                    <Feather name="arrow-right" size={17} color="#FFFFFF" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>

              {/* WhatsApp Alternative Order Button */}
              <TouchableOpacity
                style={styles.whatsappCheckoutBtn}
                activeOpacity={0.88}
                onPress={handleWhatsAppCartOrder}
              >
                <FontAwesome name="whatsapp" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.whatsappCheckoutBtnText}>ORDER VIA WHATSAPP</Text>
              </TouchableOpacity>
            </View>

            {/* Trust Badges */}
            <View style={styles.trustRow}>
              <View style={styles.trustItem}>
                <Feather name="shield" size={16} color={tokens.colors.accent} />
                <Text style={styles.trustText}>100% Genuine</Text>
              </View>
              <View style={styles.trustDot} />
              <View style={styles.trustItem}>
                <Feather name="lock" size={16} color={tokens.colors.accent} />
                <Text style={styles.trustText}>Secure Payments</Text>
              </View>
              <View style={styles.trustDot} />
              <View style={styles.trustItem}>
                <Feather name="refresh-cw" size={16} color={tokens.colors.accent} />
                <Text style={styles.trustText}>Easy Returns</Text>
              </View>
            </View>
          </KeyboardSafeScrollView>

          {/* 7. Fixed Bottom Checkout Bar (Above Safe Area & Navigation) */}
          <View style={styles.checkoutBar}>
            <View style={styles.checkoutPriceCol}>
              <Text style={styles.checkoutTotalLabel}>TOTAL AMOUNT</Text>
              <Text style={styles.checkoutTotalPrice}>₹{formatCurrency(finalTotal)}</Text>
            </View>

            <View style={styles.checkoutBarActionRow}>
              <TouchableOpacity
                style={styles.checkoutWhatsAppIconBtn}
                activeOpacity={0.85}
                onPress={handleWhatsAppCartOrder}
              >
                <FontAwesome name="whatsapp" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.checkoutButton,
                  (selectedCount === 0 || checkoutLoading) && styles.checkoutButtonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={handleCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.checkoutButtonText}>
                      {selectedCount === 0 ? 'Select Items' : `Secure Checkout (${selectedCount})`}
                    </Text>
                    <Feather name="arrow-right" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 8. Delivery Address Modal */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddressModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Delivery Address</Text>
                <Text style={styles.modalSubtitle}>Where should we deliver your order?</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddressModal(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color={tokens.colors.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.addressForm}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Optional Quick-Select Saved Address */}
              {user?.addresses && user.addresses.length > 0 && (
                <View style={styles.savedAddressesSection}>
                  <Text style={styles.sectionHeaderTitle}>Saved Addresses</Text>
                  {user.addresses.map((savedAddr: any, idx: number) => {
                    const isSelected =
                      (addrStreet && savedAddr.address === addrStreet) ||
                      (currentAddress?.address === savedAddr.address);
                    return (
                      <TouchableOpacity
                        key={savedAddr.id || `saved_${idx}`}
                        style={[
                          styles.savedAddressItem,
                          isSelected && styles.savedAddressItemActive,
                        ]}
                        activeOpacity={0.75}
                        onPress={() => {
                          setAddrName(savedAddr.name || user?.name || '');
                          setAddrPhone(savedAddr.phone || user?.phone || '');
                          setAddrStreet(savedAddr.address || savedAddr.street_address || '');
                          setAddrCity(savedAddr.city || '');
                          setAddrState(savedAddr.state || 'Andhra Pradesh');
                          setAddrZip(savedAddr.zipCode || savedAddr.pincode || '');
                        }}
                      >
                        <View style={styles.savedAddrHeader}>
                          <Text style={styles.savedAddrName}>{savedAddr.name || 'Recipient'}</Text>
                          {isSelected && (
                            <View style={styles.selectedBadge}>
                              <Feather name="check" size={11} color="#FFFFFF" />
                              <Text style={styles.selectedBadgeText}>SELECTED</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.savedAddrDetails} numberOfLines={2}>
                          {savedAddr.address || savedAddr.street_address}, {savedAddr.city}, {savedAddr.state} - {savedAddr.zipCode || savedAddr.pincode}
                        </Text>
                        {savedAddr.phone ? (
                          <Text style={styles.savedAddrPhone}>Phone: {savedAddr.phone}</Text>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR EDIT / ENTER BELOW</Text>
                    <View style={styles.dividerLine} />
                  </View>
                </View>
              )}

              <Text style={styles.formLabel}>Recipient Name</Text>
              <TextInput
                style={styles.formInput}
                value={addrName}
                onChangeText={setAddrName}
                placeholder="Full Name"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.formLabel}>Contact Phone</Text>
              <TextInput
                style={styles.formInput}
                value={addrPhone}
                onChangeText={setAddrPhone}
                placeholder="10-digit mobile number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />

              <Text style={styles.formLabel}>Street Address / House No.</Text>
              <TextInput
                style={styles.formInput}
                value={addrStreet}
                onChangeText={setAddrStreet}
                placeholder="Flat / House No., Landmark, Street"
                placeholderTextColor="#9CA3AF"
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.formLabel}>City</Text>
                  <TextInput
                    style={styles.formInput}
                    value={addrCity}
                    onChangeText={setAddrCity}
                    placeholder="City"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Postal Pincode</Text>
                  <TextInput
                    style={styles.formInput}
                    value={addrZip}
                    onChangeText={setAddrZip}
                    placeholder="e.g. 520001"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>State</Text>
              <TextInput
                style={styles.formInput}
                value={addrState}
                onChangeText={setAddrState}
                placeholder="State"
                placeholderTextColor="#9CA3AF"
              />

              <TouchableOpacity
                style={styles.saveAddressBtn}
                onPress={handleSaveAddress}
                activeOpacity={0.85}
              >
                <Text style={styles.saveAddressBtnText}>SAVE & DELIVER HERE</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 9. Modern Luxury Confirm Order Modal */}
      <Modal
        visible={showConfirmModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalCard}>
            {/* Top Icon & Title */}
            <View style={styles.confirmModalHeader}>
              <View style={styles.confirmModalIconCircle}>
                <Feather name="check-circle" size={26} color="#059669" />
              </View>
              <Text style={styles.confirmModalTitle}>Confirm Order</Text>
              <Text style={styles.confirmModalSubtitle}>
                Review your delivery & payment summary
              </Text>
            </View>

            {/* Address Box */}
            <View style={styles.confirmAddressBox}>
              <View style={styles.confirmAddressHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="map-pin" size={14} color={tokens.colors.primary} />
                  <Text style={styles.confirmAddressLabel}>DELIVERING TO</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setShowConfirmModal(false);
                    setShowAddressModal(true);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.confirmAddressChangeBtn}>Change</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.confirmAddressName}>
                {currentAddress?.name || user?.name || 'Customer'}
                {currentAddress?.phone ? ` • ${currentAddress.phone}` : ''}
              </Text>
              <Text style={styles.confirmAddressText} numberOfLines={2}>
                {currentAddress?.address}, {currentAddress?.city}, {currentAddress?.state} - {currentAddress?.zipCode}
              </Text>
            </View>

            {/* Order Details Summary Box */}
            <View style={styles.confirmSummaryBox}>
              <View style={styles.confirmSummaryRow}>
                <Text style={styles.confirmSummaryLabel}>Total Items</Text>
                <Text style={styles.confirmSummaryVal}>
                  {selectedCount} {selectedCount === 1 ? 'item' : 'items'}
                </Text>
              </View>
              <View style={styles.confirmSummaryRow}>
                <Text style={styles.confirmSummaryLabel}>Shipping</Text>
                <Text style={styles.confirmSummaryFree}>FREE Express Delivery</Text>
              </View>
              <View style={[styles.confirmSummaryRow, { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 10, marginTop: 4 }]}>
                <Text style={styles.confirmTotalLabel}>Total to Pay</Text>
                <Text style={styles.confirmTotalAmount}>₹{formatCurrency(finalTotal)}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.confirmActionsRow}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setShowConfirmModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmPlaceOrderBtn}
                onPress={executeOrderPlacement}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmPlaceOrderText}>Place Order</Text>
                <Feather name="arrow-right" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Alternative Order via WhatsApp */}
            <TouchableOpacity
              style={styles.confirmWhatsAppBtn}
              onPress={() => {
                setShowConfirmModal(false);
                handleWhatsAppCartOrder();
              }}
              activeOpacity={0.88}
            >
              <FontAwesome name="whatsapp" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.confirmWhatsAppBtnText}>Order on WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 10. Modern Luxury Order Success Modal */}
      <Modal
        visible={!!orderSuccessData}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setOrderSuccessData(null)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.successModalCard}>
            <View style={styles.successIconCircle}>
              <Feather name="check" size={36} color="#FFFFFF" />
            </View>
            <Text style={styles.successModalTitle}>Order Confirmed!</Text>
            <View style={styles.successBadge}>
              <Text style={styles.successBadgeText}>Order #{orderSuccessData?.orderId}</Text>
            </View>
            <Text style={styles.successModalBody}>
              Thank you for shopping at Ghar Sansar! Your order has been placed successfully and is being prepared for express delivery.
            </Text>

            <TouchableOpacity
              style={styles.successViewOrdersBtn}
              onPress={() => {
                setOrderSuccessData(null);
                setActiveTab('account');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.successViewOrdersText}>View My Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.successContinueBtn}
              onPress={() => {
                setOrderSuccessData(null);
                setActiveTab('home');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.successContinueText}>Continue Shopping</Text>
            </TouchableOpacity>
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
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
    paddingBottom: 100, // Ensures content is completely visible above bottom tabs
  },

  // Header
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: tokens.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.border,
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
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  headerActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.primary,
  },

  // Delivery Address Card
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    ...tokens.shadows.subtle,
  },
  addressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  addressIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.colors.brandGoldBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressInfo: {
    flex: 1,
  },
  addressTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  addressDeliverTo: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  homeTag: {
    backgroundColor: tokens.colors.surfaceAlt,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  homeTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  addressLine: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.primary,
  },
  changeAddressBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  changeAddressText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.accent,
  },

  // Selection Bar
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing.sm,
    marginBottom: tokens.spacing.sm,
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: tokens.colors.accent,
    borderColor: tokens.colors.accent,
  },
  checkboxUnchecked: {
    backgroundColor: tokens.colors.surface,
    borderColor: tokens.colors.border,
  },
  selectAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.primary,
  },
  selectionNote: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.textMuted,
  },

  // Cart Items List
  itemsList: {
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  cartCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    ...tokens.shadows.subtle,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  thumbnailWrapper: {
    width: 76,
    height: 76,
    borderRadius: tokens.radius.md,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  productDetails: {
    flex: 1,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.primary,
    lineHeight: 18,
    marginBottom: 4,
  },
  categoryBadge: {
    fontSize: 10,
    color: tokens.colors.textMuted,
    marginBottom: 6,
  },
  returnGiftCartBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
    borderWidth: 0.5,
    borderColor: '#FDE68A',
  },
  returnGiftCartBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#92400E',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  mrpPrice: {
    fontSize: 12,
    color: tokens.colors.textMuted,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.discount,
  },
  unitPriceHint: {
    fontSize: 11,
    fontWeight: '500',
    color: tokens.colors.textMuted,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: tokens.colors.borderLight,
    marginVertical: 12,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.surfaceAlt,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 13,
    fontWeight: '700',
    color: tokens.colors.primary,
    minWidth: 26,
    textAlign: 'center',
  },
  itemSecondaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.textMuted,
  },

  // Coupon Card
  couponCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    marginBottom: tokens.spacing.lg,
    ...tokens.shadows.subtle,
  },
  couponTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  couponTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  couponInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  couponInput: {
    flex: 1,
    height: 44,
    backgroundColor: tokens.colors.surfaceAlt,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: 12,
    fontSize: 13,
    color: tokens.colors.primary,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  applyCouponBtn: {
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyCouponBtnDisabled: {
    opacity: 0.5,
  },
  applyCouponText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  appliedCouponBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(46, 125, 50, 0.08)',
    padding: 10,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.2)',
  },
  appliedCouponInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appliedCouponCode: {
    fontSize: 13,
    fontWeight: '700',
    color: tokens.colors.savings,
  },
  appliedCouponSavings: {
    fontSize: 11,
    color: tokens.colors.savings,
  },
  removeCouponText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.discount,
  },

  // Bill Details Card
  billCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    marginBottom: tokens.spacing.lg,
    ...tokens.shadows.subtle,
  },
  billTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.primary,
    marginBottom: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 13,
    color: tokens.colors.textMuted,
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.primary,
  },
  billSavings: {
    color: tokens.colors.savings,
    fontWeight: '700',
  },
  freeDeliveryBadge: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freeDeliveryText: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.savings,
  },
  billValueMuted: {
    fontSize: 12,
    color: tokens.colors.textMuted,
  },
  billDivider: {
    height: 1,
    backgroundColor: tokens.colors.borderLight,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  totalSubLabel: {
    fontSize: 10,
    color: tokens.colors.textMuted,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: tokens.colors.primary,
  },
  totalSavingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    marginTop: 8,
  },
  totalSavingsText: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.savings,
  },
  proceedToBuyBtn: {
    backgroundColor: tokens.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: tokens.radius.button,
    marginTop: 14,
    width: '100%',
    ...tokens.shadows.button,
  },
  proceedToBuyBtnDisabled: {
    opacity: 0.5,
  },
  proceedToBuyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  whatsappCheckoutBtn: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: tokens.radius.button,
    width: '100%',
    marginTop: 10,
    ...tokens.shadows.button,
  },
  whatsappCheckoutBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Trust Row
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: tokens.spacing.md,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    fontSize: 11,
    color: tokens.colors.textMuted,
    fontWeight: '500',
  },
  trustDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: tokens.colors.border,
  },

  // Fixed Bottom Checkout Bar
  checkoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: tokens.colors.surface,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: 12,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    ...tokens.shadows.card,
  },
  checkoutPriceCol: {
    flex: 1,
  },
  checkoutTotalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.textMuted,
    letterSpacing: 0.8,
  },
  checkoutTotalPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: tokens.colors.primary,
  },
  checkoutButton: {
    backgroundColor: tokens.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: tokens.radius.button,
    minWidth: 180,
  },
  checkoutButtonDisabled: {
    opacity: 0.5,
  },
  checkoutButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  checkoutBarActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkoutWhatsAppIconBtn: {
    width: 48,
    height: 48,
    borderRadius: tokens.radius.button,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    ...tokens.shadows.subtle,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: tokens.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    maxHeight: '90%',
    paddingBottom: 24,
    overflow: 'hidden',
    ...tokens.shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: tokens.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: tokens.colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressForm: {
    padding: tokens.spacing.lg,
    paddingBottom: 40,
  },
  savedAddressesSection: {
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  savedAddressItem: {
    backgroundColor: tokens.colors.surfaceSecondary,
    borderRadius: tokens.radius.input,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
  },
  savedAddressItemActive: {
    borderColor: tokens.colors.primary,
    backgroundColor: '#F8FAFC',
  },
  savedAddrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  savedAddrName: {
    fontSize: 13,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  savedAddrDetails: {
    fontSize: 12,
    color: tokens.colors.textSecondary,
    lineHeight: 16,
  },
  savedAddrPhone: {
    fontSize: 11,
    color: tokens.colors.textSecondary,
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: tokens.colors.border,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  formInput: {
    backgroundColor: tokens.colors.surfaceSecondary,
    borderRadius: tokens.radius.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: tokens.colors.textPrimary,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveAddressBtn: {
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.radius.button,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    ...tokens.shadows.button,
  },
  saveAddressBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.8,
  },

  // Confirm Order Modal Styles
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  confirmModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  confirmModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmModalIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: tokens.colors.primary,
  },
  confirmModalSubtitle: {
    fontSize: 12.5,
    color: tokens.colors.textMuted,
    marginTop: 3,
    textAlign: 'center',
  },
  confirmAddressBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  confirmAddressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  confirmAddressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.textMuted,
    letterSpacing: 0.5,
  },
  confirmAddressChangeBtn: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.accent,
  },
  confirmAddressName: {
    fontSize: 13,
    fontWeight: '700',
    color: tokens.colors.primary,
    marginBottom: 2,
  },
  confirmAddressText: {
    fontSize: 12,
    color: tokens.colors.textMuted,
    lineHeight: 16,
  },
  confirmSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
  },
  confirmSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  confirmSummaryLabel: {
    fontSize: 13,
    color: tokens.colors.textMuted,
  },
  confirmSummaryVal: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.primary,
  },
  confirmSummaryFree: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  confirmTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  confirmTotalAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: tokens.colors.primary,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  confirmCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  confirmPlaceOrderBtn: {
    flex: 1.5,
    height: 46,
    borderRadius: 12,
    backgroundColor: tokens.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  confirmPlaceOrderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  confirmWhatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: 12,
    height: 46,
    marginTop: 10,
    ...tokens.shadows.subtle,
  },
  confirmWhatsAppBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Success Modal
  successModalCard: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 26,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: tokens.colors.primary,
    marginBottom: 8,
  },
  successBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 12,
  },
  successBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#059669',
  },
  successModalBody: {
    fontSize: 13,
    color: tokens.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  successViewOrdersBtn: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  successViewOrdersText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successContinueBtn: {
    width: '100%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContinueText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: tokens.colors.textMuted,
  },
});

export default CartView;
