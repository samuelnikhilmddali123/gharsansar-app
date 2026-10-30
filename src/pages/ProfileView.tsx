import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMobileApp } from '../context/MobileAppContext';
import { GharSansarAuth } from '../components/GharSansarAuth';
import { KeyboardSafeScrollView } from '../components/KeyboardSafeScrollView';
import { PremiumImage } from '../components/PremiumImage';

export const ProfileView: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    user,
    isAuthenticated,
    logout,
    orders,
    ordersLoading,
    fetchOrders,
    currentAddress,
    saveShippingAddress,
    deleteShippingAddress,
    updateUserProfile,
    setActiveTab,
    setSelectedProductId,
    products,
  } = useMobileApp();

  // Active section tab: 'overview' | 'orders' | 'address' | 'settings'
  const [activeSection, setActiveSection] = useState<'overview' | 'orders' | 'address' | 'settings'>('overview');

  // Address Form State (matching Image 3)
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState('');
  const [isDefaultAddress, setIsDefaultAddress] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);

  // Profile Settings Form State
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Initialize form fields when user loads
  useEffect(() => {
    if (user) {
      const parts = (user.name || (user as any).full_name || '').trim().split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setPhone(user.phone || '');
      setEditName(user.name || (user as any).full_name || '');
      setEditPhone(user.phone || '');
    }
  }, [user]);

  // Refresh orders when opening overview or orders tab
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, activeSection]);

  // If not authenticated, render the exact Ghar Sansar Sign In & Register page from Image 1 & 2!
  if (!isAuthenticated) {
    return (
      <View style={[styles.screen, { paddingTop: Math.max(insets.top, 14) }]}>
        <GharSansarAuth />
      </View>
    );
  }

  // User details
  const displayName = user?.name || (user as any).full_name || 'Customer';
  const displayEmail = user?.email || '';
  const displayPhone = user?.phone || '';
  const initialLetter = (displayName.charAt(0) || displayEmail.charAt(0) || 'G').toUpperCase();

  // Formatted Member Date
  const memberDate = user?.createdAt || (user as any).created_at
    ? new Date(user?.createdAt || (user as any).created_at).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : 'May 2026';

  // Stats Calculations
  const totalOrdersCount = orders.length;
  const totalSpent = orders.reduce((sum: number, o: any) => sum + (Number(o.totalAmount || o.total || 0)), 0);
  const activeDeliveriesCount = orders.filter((o: any) => {
    const s = (o.status || '').toLowerCase();
    return s === 'placed' || s === 'processing' || s === 'shipped';
  }).length;
  const deliveredCount = orders.filter((o: any) => (o.status || '').toLowerCase() === 'delivered').length;

  // Handle Save Address (Image 3)
  const handleAddAddress = async () => {
    if (!firstName.trim()) {
      Alert.alert('Required', 'Please enter your First Name.');
      return;
    }
    if (!streetAddress.trim()) {
      Alert.alert('Required', 'Please enter your Street Address.');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Required', 'Please enter your City.');
      return;
    }
    if (!stateName.trim()) {
      Alert.alert('Required', 'Please enter your State.');
      return;
    }
    if (!zipCode.trim()) {
      Alert.alert('Required', 'Please enter your Zip/Postal Code.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Required', 'Please enter your Phone Number.');
      return;
    }

    setSavingAddress(true);
    try {
      const newAddr = {
        id: `addr_${Date.now()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        address: streetAddress.trim(),
        street_address: streetAddress.trim(),
        city: city.trim(),
        state: stateName.trim(),
        zipCode: zipCode.trim(),
        pincode: zipCode.trim(),
        phone: phone.trim(),
        country: 'India',
        isDefault: isDefaultAddress,
      };

      await saveShippingAddress(newAddr);
      Alert.alert('Success', 'Shipping address added and synced with your Ghar Sansar account!');

      // Reset form
      setStreetAddress('');
      setCity('');
      setStateName('');
      setZipCode('');
      setShowAddAddressForm(false);
    } catch (err) {
      Alert.alert('Error', 'Unable to save shipping address to server.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleCancelAddress = () => {
    setStreetAddress('');
    setCity('');
    setStateName('');
    setZipCode('');
    setShowAddAddressForm(false);
    if (savedAddresses.length === 0) {
      setActiveSection('overview');
    }
  };

  // Handle Save Profile Settings (Only Name per Image 1 requirement)
  const handleSaveProfileSettings = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }

    setSavingProfile(true);
    try {
      await updateUserProfile({
        name: editName.trim(),
      });
      Alert.alert('Success', 'Profile name updated successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile settings.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Logout Confirmation
  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your Ghar Sansar account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const savedAddresses: any[] = user?.addresses || [];

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 14) }]}>
      <KeyboardSafeScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        extraScrollHeight={160}
      >
        {/* ============================================================== */}
        {/* TOP PROFILE HEADER CARD (IMAGE 2) */}
        {/* ============================================================== */}
        <View style={styles.profileHeaderCard}>
          {/* Logout Button directly inside Profile Card (Image 2) */}
          <TouchableOpacity
            style={styles.cardLogoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="log-out" size={13} color="#DC2626" />
            <Text style={styles.cardLogoutBtnText}>Logout</Text>
          </TouchableOpacity>

          <View style={styles.headerLeftGroup}>
            {/* Circle Avatar with Initials */}
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{initialLetter}</Text>
            </View>

            {/* Profile Info */}
            <View style={styles.userInfoCol}>
              <Text style={styles.userName}>{displayName}</Text>

              {displayEmail ? (
                <View style={styles.infoRow}>
                  <Feather name="mail" size={13} color="#64748B" style={styles.infoIcon} />
                  <Text style={styles.infoText}>{displayEmail}</Text>
                </View>
              ) : null}

              {displayPhone ? (
                <View style={styles.infoRow}>
                  <Feather name="phone" size={13} color="#64748B" style={styles.infoIcon} />
                  <Text style={styles.infoText}>{displayPhone}</Text>
                </View>
              ) : null}

              {/* Badges */}
              <View style={styles.badgeRow}>
                <View style={styles.accountTypeBadge}>
                  <Text style={styles.accountTypeBadgeText}>
                    {user?.role === 'admin' ? 'ADMINISTRATOR' : 'CUSTOMER ACCOUNT'}
                  </Text>
                </View>

                <View style={styles.memberSinceBadge}>
                  <Text style={styles.memberSinceBadgeText}>
                    Member since {memberDate}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ============================================================== */}
        {/* HORIZONTAL / SIDEBAR NAVIGATION TABS (IMAGES 3, 4, 5) */}
        {/* ============================================================== */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.navTabsContainer}
        >
          {/* Account Overview */}
          <TouchableOpacity
            style={[
              styles.navTab,
              activeSection === 'overview' && styles.navTabActive
            ]}
            onPress={() => setActiveSection('overview')}
            activeOpacity={0.8}
          >
            <Feather
              name="user"
              size={15}
              color={activeSection === 'overview' ? '#FFFFFF' : '#475569'}
            />
            <Text
              style={[
                styles.navTabText,
                activeSection === 'overview' && styles.navTabTextActive
              ]}
            >
              Account Overview
            </Text>
          </TouchableOpacity>

          {/* My Orders */}
          <TouchableOpacity
            style={[
              styles.navTab,
              activeSection === 'orders' && styles.navTabActive
            ]}
            onPress={() => setActiveSection('orders')}
            activeOpacity={0.8}
          >
            <Feather
              name="shopping-bag"
              size={15}
              color={activeSection === 'orders' ? '#FFFFFF' : '#475569'}
            />
            <Text
              style={[
                styles.navTabText,
                activeSection === 'orders' && styles.navTabTextActive
              ]}
            >
              My Orders
            </Text>
          </TouchableOpacity>

          {/* Shipping Address */}
          <TouchableOpacity
            style={[
              styles.navTab,
              activeSection === 'address' && styles.navTabActive
            ]}
            onPress={() => setActiveSection('address')}
            activeOpacity={0.8}
          >
            <Feather
              name="map-pin"
              size={15}
              color={activeSection === 'address' ? '#FFFFFF' : '#475569'}
            />
            <Text
              style={[
                styles.navTabText,
                activeSection === 'address' && styles.navTabTextActive
              ]}
            >
              Shipping Address
            </Text>
          </TouchableOpacity>

          {/* Account Settings */}
          <TouchableOpacity
            style={[
              styles.navTab,
              activeSection === 'settings' && styles.navTabActive
            ]}
            onPress={() => setActiveSection('settings')}
            activeOpacity={0.8}
          >
            <Feather
              name="settings"
              size={15}
              color={activeSection === 'settings' ? '#FFFFFF' : '#475569'}
            />
            <Text
              style={[
                styles.navTabText,
                activeSection === 'settings' && styles.navTabTextActive
              ]}
            >
              Account Settings
            </Text>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            style={[styles.navTab, styles.logoutTab]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Feather name="log-out" size={15} color="#DC2626" />
            <Text style={styles.logoutTabText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ============================================================== */}
        {/* SECTION 1: ACCOUNT OVERVIEW (IMAGES 4 & 5) */}
        {/* ============================================================== */}
        {activeSection === 'overview' && (
          <View style={styles.sectionWrapper}>
            {/* 4 Stat Metric Cards Grid */}
            <View style={styles.statsGrid}>
              {/* Card 1: Total Orders */}
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>TOTAL ORDERS</Text>
                <Text style={styles.statValueDark}>{totalOrdersCount}</Text>
              </View>

              {/* Card 2: Total Spent */}
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>TOTAL SPENT</Text>
                <Text style={styles.statValueDark}>₹{totalSpent.toLocaleString('en-IN')}</Text>
              </View>

              {/* Card 3: Active Deliveries */}
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>ACTIVE DELIVERIES</Text>
                <Text style={styles.statValueBlue}>{activeDeliveriesCount}</Text>
              </View>

              {/* Card 4: Delivered */}
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>DELIVERED</Text>
                <Text style={styles.statValueGreen}>{deliveredCount}</Text>
              </View>
            </View>

            {/* Recent Order Overview Card */}
            <View style={styles.contentCard}>
              <Text style={styles.cardHeaderTitle}>Recent Order Overview</Text>

              {ordersLoading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color="#031c03" />
                  <Text style={styles.loadingText}>Loading...</Text>
                </View>
              ) : orders.length === 0 ? (
                <View style={styles.emptyOrdersBox}>
                  <Text style={styles.emptyOrdersText}>
                    No orders placed yet. Explore our luxury collection!
                  </Text>
                  <TouchableOpacity
                    style={styles.browseButton}
                    onPress={() => setActiveTab('home')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.browseButtonText}>Explore Products</Text>
                    <Feather name="arrow-right" size={14} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.ordersList}>
                  {orders.slice(0, 3).map((ord: any, idx: number) => {
                    const statusStr = (ord.status || 'Placed').toUpperCase();
                    const isDelivered = statusStr === 'DELIVERED';
                    const isShipped = statusStr === 'SHIPPED';
                    const firstItem = ord.items?.[0];
                    const firstItemImage =
                      firstItem?.image ||
                      products.find(
                        (p: any) =>
                          String(p.id) === String(firstItem?.productId || firstItem?.id) ||
                          p.title?.toLowerCase() === (firstItem?.name || firstItem?.title || '').toLowerCase()
                      )?.image ||
                      '';

                    return (
                      <View key={ord.id || ord._id || idx} style={styles.orderItemRow}>
                        {firstItemImage ? (
                          <PremiumImage
                            uri={firstItemImage}
                            style={styles.recentOrderThumb}
                            contentFit="contain"
                            product={{
                              id: String(firstItem?.productId || firstItem?.id || ''),
                              title: firstItem?.name || firstItem?.title || 'Product',
                              category: (firstItem as any)?.category,
                            }}
                          />
                        ) : null}
                        <View style={styles.orderLeftCol}>
                          <Text style={styles.orderNumberText}>
                            Order #{ord.id || ord.orderNumber || (ord._id ? ord._id.slice(-6) : `00${idx + 1}`)}
                          </Text>
                          <Text style={styles.orderDateText}>
                            {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : 'Recent'} • {ord.items?.length || 1} Item(s)
                          </Text>
                        </View>
                        <View style={styles.orderRightCol}>
                          <Text style={styles.orderPriceText}>
                            ₹{Number(ord.totalAmount || ord.total || 0).toLocaleString('en-IN')}
                          </Text>
                          <View
                            style={[
                              styles.orderStatusBadge,
                              isDelivered && { backgroundColor: '#DCFCE7' },
                              isShipped && { backgroundColor: '#DBEAFE' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.orderStatusText,
                                isDelivered && { color: '#15803D' },
                                isShipped && { color: '#1D4ED8' },
                              ]}
                            >
                              {statusStr}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ============================================================== */}
        {/* SECTION 2: SHIPPING ADDRESS (IMAGES 4 & 5) */}
        {/* ============================================================== */}
        {activeSection === 'address' && (
          <View style={styles.sectionWrapper}>
            {/* Existing Saved Addresses (Shown first when user has saved address) */}
            {savedAddresses.length > 0 && (
              <View style={styles.contentCard}>
                <View style={styles.cardHeaderWithAction}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardHeaderTitle}>Saved Addresses</Text>
                    <Text style={styles.cardHeaderSubtitle}>
                      Manage your delivery destinations.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addAddressHeaderBtn}
                    onPress={() => setShowAddAddressForm(!showAddAddressForm)}
                    activeOpacity={0.8}
                  >
                    <Feather name={showAddAddressForm ? "x" : "plus"} size={14} color="#FFFFFF" />
                    <Text style={styles.addAddressHeaderBtnText}>
                      {showAddAddressForm ? "Close Form" : "+ Add"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.savedList}>
                  {savedAddresses.map((addr: any, idx: number) => {
                    const isDef = addr.isDefault || (!currentAddress && idx === 0);
                    const addrId = addr.id || addr.address;
                    return (
                      <View key={addrId || idx} style={styles.savedAddressItem}>
                        <View style={styles.savedAddrHeader}>
                          <Text style={styles.savedAddrName}>
                            {addr.name || `${addr.firstName || ''} ${addr.lastName || ''}`.trim() || 'Saved Address'}
                          </Text>
                          {isDef && (
                            <View style={styles.defaultBadge}>
                              <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.savedAddrStreet}>{addr.address || addr.street_address}</Text>
                        <Text style={styles.savedAddrCity}>
                          {addr.city}, {addr.state} - {addr.zipCode || addr.pincode}
                        </Text>
                        {addr.phone ? (
                          <Text style={styles.savedAddrPhone}>Phone: {addr.phone}</Text>
                        ) : null}

                        <View style={styles.addrActionsRow}>
                          {!isDef && (
                            <TouchableOpacity
                              style={styles.setDefaultBtn}
                              onPress={() => saveShippingAddress({ ...addr, isDefault: true })}
                            >
                              <Text style={styles.setDefaultBtnText}>Set as Default</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={styles.deleteAddrBtn}
                            onPress={() => deleteShippingAddress(addrId)}
                          >
                            <Feather name="trash-2" size={14} color="#DC2626" />
                            <Text style={styles.deleteAddrBtnText}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Add New Shipping Address Card: Shown if no addresses exist OR user clicked + Add */}
            {(showAddAddressForm || savedAddresses.length === 0) && (
              <View style={[styles.contentCard, savedAddresses.length > 0 && { marginTop: 16 }]}>
                <Text style={styles.cardHeaderTitle}>Add New Shipping Address</Text>
                <Text style={styles.cardHeaderSubtitle}>
                  Fill out the delivery contact and address details.
                </Text>

                {/* Form */}
                <View style={styles.formContainer}>
                  {/* FIRST NAME & LAST NAME ROW */}
                  <View style={styles.rowTwoCols}>
                    <View style={styles.colHalf}>
                      <Text style={styles.inputFieldLabel}>FIRST NAME</Text>
                      <TextInput
                        style={styles.fieldInput}
                        placeholder="Enter first name"
                        placeholderTextColor="#94A3B8"
                        value={firstName}
                        onChangeText={setFirstName}
                      />
                    </View>
                    <View style={styles.colHalf}>
                      <Text style={styles.inputFieldLabel}>LAST NAME</Text>
                      <TextInput
                        style={styles.fieldInput}
                        placeholder="Enter last name"
                        placeholderTextColor="#94A3B8"
                        value={lastName}
                        onChangeText={setLastName}
                      />
                    </View>
                  </View>

                  {/* STREET ADDRESS */}
                  <View style={styles.fullWidthCol}>
                    <Text style={styles.inputFieldLabel}>STREET ADDRESS</Text>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="Enter street address / flat / door no"
                      placeholderTextColor="#94A3B8"
                      value={streetAddress}
                      onChangeText={setStreetAddress}
                    />
                  </View>

                  {/* CITY & STATE ROW */}
                  <View style={styles.rowTwoCols}>
                    <View style={styles.colHalf}>
                      <Text style={styles.inputFieldLabel}>CITY</Text>
                      <TextInput
                        style={styles.fieldInput}
                        placeholder="Enter city"
                        placeholderTextColor="#94A3B8"
                        value={city}
                        onChangeText={setCity}
                      />
                    </View>
                    <View style={styles.colHalf}>
                      <Text style={styles.inputFieldLabel}>STATE</Text>
                      <TextInput
                        style={styles.fieldInput}
                        placeholder="Enter state"
                        placeholderTextColor="#94A3B8"
                        value={stateName}
                        onChangeText={setStateName}
                      />
                    </View>
                  </View>

                  {/* ZIP/POSTAL CODE & PHONE ROW */}
                  <View style={styles.rowTwoCols}>
                    <View style={styles.colHalf}>
                      <Text style={styles.inputFieldLabel}>ZIP/POSTAL CODE</Text>
                      <TextInput
                        style={styles.fieldInput}
                        placeholder="Enter pincode"
                        placeholderTextColor="#94A3B8"
                        value={zipCode}
                        onChangeText={setZipCode}
                        keyboardType="number-pad"
                      />
                    </View>
                    <View style={styles.colHalf}>
                      <Text style={styles.inputFieldLabel}>PHONE</Text>
                      <TextInput
                        style={styles.fieldInput}
                        placeholder="Enter phone number"
                        placeholderTextColor="#94A3B8"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>

                  {/* Checkbox: Set as default shipping address */}
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    activeOpacity={0.8}
                    onPress={() => setIsDefaultAddress(!isDefaultAddress)}
                  >
                    <View style={[styles.checkboxBox, isDefaultAddress && styles.checkboxBoxChecked]}>
                      {isDefaultAddress && <Feather name="check" size={14} color="#FFFFFF" />}
                    </View>
                    <Text style={styles.checkboxLabel}>Set as default shipping address</Text>
                  </TouchableOpacity>

                  {/* Buttons: Cancel & Add Address */}
                  <View style={styles.formButtonRow}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={handleCancelAddress}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.addAddressBtn}
                      onPress={handleAddAddress}
                      activeOpacity={0.85}
                      disabled={savingAddress}
                    >
                      {savingAddress ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.addAddressBtnText}>Add Address</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ============================================================== */}
        {/* SECTION 3: MY ORDERS */}
        {/* ============================================================== */}
        {activeSection === 'orders' && (
          <View style={styles.sectionWrapper}>
            <View style={styles.contentCard}>
              <Text style={styles.cardHeaderTitle}>My Orders</Text>

              {ordersLoading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color="#031c03" />
                  <Text style={styles.loadingText}>Loading...</Text>
                </View>
              ) : orders.length === 0 ? (
                <View style={styles.emptyOrdersBox}>
                  <Feather name="shopping-bag" size={36} color="#94A3B8" style={{ marginBottom: 10 }} />
                  <Text style={styles.emptyOrdersText}>
                    No orders placed yet. Explore our luxury collection!
                  </Text>
                  <TouchableOpacity
                    style={styles.browseButton}
                    onPress={() => setActiveTab('home')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.browseButtonText}>Start Shopping</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.ordersList}>
                  {orders.map((ord: any, idx: number) => {
                    const statusStr = (ord.status || 'Placed').toUpperCase();
                    return (
                      <View key={ord.id || ord._id || idx} style={styles.orderCardExpanded}>
                        <View style={styles.orderCardHeader}>
                          <View>
                            <Text style={styles.orderNumberText}>
                              Order #{ord.id || ord.orderNumber || (ord._id ? ord._id.slice(-6) : `00${idx + 1}`)}
                            </Text>
                            <Text style={styles.orderDateText}>
                              {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : 'Recent'}
                            </Text>
                          </View>
                          <View style={styles.orderStatusBadge}>
                            <Text style={styles.orderStatusText}>{statusStr}</Text>
                          </View>
                        </View>

                        {/* Order Items */}
                        <View style={styles.orderItemsContainer}>
                          {(ord.items || []).map((item: any, itemIdx: number) => {
                            const itemImage =
                              item.image ||
                              products.find(
                                (p: any) =>
                                  String(p.id) === String(item.productId || item.id) ||
                                  p.title?.toLowerCase() === (item.name || item.title || '').toLowerCase()
                              )?.image ||
                              '';

                            return (
                              <TouchableOpacity
                                key={itemIdx}
                                style={styles.orderItemLine}
                                activeOpacity={0.75}
                                onPress={() => {
                                  const prodId = item.productId || item.id;
                                  if (prodId && setSelectedProductId) {
                                    setSelectedProductId(String(prodId));
                                  }
                                }}
                              >
                                <View style={styles.orderItemLeft}>
                                  <PremiumImage
                                    uri={itemImage}
                                    style={styles.orderItemThumb}
                                    contentFit="contain"
                                    product={{
                                      id: String(item.productId || item.id || ''),
                                      title: item.name || item.title || 'Product',
                                      category: (item as any)?.category,
                                    }}
                                  />
                                  <View style={styles.orderItemDetails}>
                                    <Text style={styles.orderItemName} numberOfLines={2}>
                                      {item.name || item.title || 'Product'}
                                    </Text>
                                    <Text style={styles.orderItemQty}>Qty: {item.quantity || 1}</Text>
                                  </View>
                                </View>
                                <Text style={styles.orderItemPrice}>
                                  ₹{Number((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>

                        {/* Order Footer */}
                        <View style={styles.orderCardFooter}>
                          <Text style={styles.orderPaymentText}>
                            Payment: {ord.paymentMethod || 'UPI / COD'}
                          </Text>
                          <Text style={styles.orderTotalAmount}>
                            Total: ₹{Number(ord.totalAmount || ord.total || 0).toLocaleString('en-IN')}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ============================================================== */}
        {/* SECTION 4: ACCOUNT SETTINGS (IMAGE 1) */}
        {/* ============================================================== */}
        {activeSection === 'settings' && (
          <View style={styles.sectionWrapper}>
            <View style={styles.contentCard}>
              <Text style={styles.cardHeaderTitle}>Account Settings</Text>
              <Text style={styles.cardHeaderSubtitle}>
                Update your account profile information.
              </Text>

              <View style={styles.formContainer}>
                <View style={styles.fullWidthCol}>
                  <Text style={styles.inputFieldLabel}>FULL NAME</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter your name"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <TouchableOpacity
                  style={styles.addAddressBtn}
                  onPress={handleSaveProfileSettings}
                  activeOpacity={0.85}
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.addAddressBtnText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </KeyboardSafeScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 90,
  },

  // 1. Top Profile Header Card (Images 3, 4, 5)
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
    position: 'relative',
  },
  cardLogoutBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    zIndex: 10,
  },
  cardLogoutBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  cardHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addAddressHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#031c03',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addAddressHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  userInfoCol: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  infoIcon: {
    width: 14,
  },
  infoText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '400',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  accountTypeBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  accountTypeBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.4,
  },
  memberSinceBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  memberSinceBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#4F46E5',
  },

  // 2. Navigation Tabs (Images 3, 4, 5)
  navTabsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 16,
  },
  navTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navTabActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  navTabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  navTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  logoutTab: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  logoutTabText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#DC2626',
  },

  // 3. Section Wrapper & Content Cards
  sectionWrapper: {
    width: '100%',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  statValueDark: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
  },
  statValueBlue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2563EB',
  },
  statValueGreen: {
    fontSize: 28,
    fontWeight: '800',
    color: '#16A34A',
  },

  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 4,
  },
  cardHeaderSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 18,
  },

  // Empty State / Loading
  loadingBox: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 8,
  },
  emptyOrdersBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyOrdersText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#031c03',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },

  // Orders List
  ordersList: {
    marginTop: 10,
    gap: 12,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  orderLeftCol: {
    flex: 1,
  },
  orderNumberText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  orderDateText: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  orderRightCol: {
    alignItems: 'flex-end',
  },
  orderPriceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderStatusBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  orderStatusText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#475569',
  },

  // Expanded Order Card
  orderCardExpanded: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FAFAF9',
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderItemsContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    gap: 8,
  },
  orderItemLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  orderItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  orderItemThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 10,
  },
  orderItemDetails: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
    lineHeight: 17,
  },
  orderItemQty: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  orderItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  recentOrderThumb: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 10,
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  orderPaymentText: {
    fontSize: 11.5,
    color: '#64748B',
  },
  orderTotalAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },

  // Shipping Address Form (Image 3)
  formContainer: {
    gap: 14,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  colHalf: {
    flex: 1,
  },
  fullWidthCol: {
    width: '100%',
  },
  inputFieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  fieldInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxBoxChecked: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  checkboxLabel: {
    fontSize: 12.5,
    color: '#334155',
    fontWeight: '500',
  },
  formButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    height: 42,
    paddingHorizontal: 18,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  addAddressBtn: {
    height: 42,
    paddingHorizontal: 22,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  addAddressBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Saved Addresses List
  savedList: {
    marginTop: 12,
    gap: 12,
  },
  savedAddressItem: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FAFAF9',
  },
  savedAddrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  savedAddrName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  defaultBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  savedAddrStreet: {
    fontSize: 12.5,
    color: '#334155',
  },
  savedAddrCity: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  savedAddrPhone: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  addrActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  setDefaultBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  setDefaultBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  deleteAddrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteAddrBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#DC2626',
  },
});

export default ProfileView;
