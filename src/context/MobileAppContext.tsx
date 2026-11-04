import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Platform, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image as ExpoImage } from 'expo-image';
import * as Network from 'expo-network';

WebBrowser.maybeCompleteAuthSession();

export const extractAuthCodeFromUrl = (url: string): string | null => {
  if (!url) return null;
  if (!url.startsWith('gharsansar://') && !url.includes('auth/callback')) return null;
  try {
    const queryPart = url.includes('?') ? url.split('?')[1] : '';
    if (!queryPart) return null;
    const params = new URLSearchParams(queryPart);
    return params.get('code') || null;
  } catch {
    const match = url.match(/[?&]code=([^&#]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
};

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (e) {
  console.warn('Notifications handler not supported in current environment', e);
}

export interface Product {
  id: string;
  title: string;
  name: string;
  description: string;
  price: number; // Customer purchase price = finalPrice (dominant price)
  finalPrice: number; // Customer final price (dominant price customer actually pays)
  discountedPrice: number; // Customer final price alias
  actualPrice: number; // Base selling price in backend catalog (DO NOT show when hasCategoryDiscount == true)
  strikePrice: number; // Original reference retail price (MRP, struck through when strikePrice > finalPrice)
  actPrice: number; // Backward-compatible alias for strikePrice
  categoryDiscountPercentage: number; // Promotional discount percentage from category offer (e.g. 99%)
  categoryDiscountAmount: number; // Category discount amount in currency
  currentDifference: number; // Savings difference: strikePrice - finalPrice
  hasCategoryDiscount: boolean; // Whether active category promotional discount applies
  isDiscounted: boolean; // Whether product has a discount (strikePrice > finalPrice || hasCategoryDiscount)
  discountPercentage: number; // Effective discount badge % (categoryDiscountPercentage if promo active else savings %)
  image: string;
  category: string;
  subCategory: string;
  rating: number;
  reviewsCount: number;
  matchPercent: number;
  commentsCount: number;
  isReturnGift?: boolean;
  minOrderQuantity?: number;
}

export interface CategoryDiscount {
  _id?: string;
  id: string;
  category: string;
  discountPercentage: number;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'inactive';
  isCurrentlyActive?: boolean;
  description?: string;
  affectedProductsCount?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selected: boolean;
}

export interface CustomerNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  type: 'order' | 'offer' | 'delivery' | 'info';
  read: boolean;
}

export interface UserProfile {
  id?: string;
  name?: string;
  email: string;
  phone?: string;
  role?: string;
  profilePicture?: string;
  addresses?: any[];
  createdAt?: string;
}

export interface DeliveryAddress {
  name?: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault?: boolean;
}

type TabType = 'home' | 'explore' | 'cart' | 'wishlist' | 'account' | 'returnGifts';

interface MobileAppContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (id: string, delta: number) => void;
  toggleCartSelection: (id: string) => void;
  toggleAllCartSelections: (selected: boolean) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  products: Product[];

  // Return Gifts Collection & Bulk Ordering
  returnGifts: Product[];
  returnGiftsLoading: boolean;
  fetchReturnGifts: () => Promise<void>;

  // Dynamic States & Actions
  banners: any[];
  categories: any[];
  flashSale: { expiryTime: string; products: Product[] } | null;
  paginatedProducts: Product[];
  paginatedLoading: boolean;
  hasMoreProducts: boolean;
  loadMoreProducts: () => Promise<void>;
  refreshProductsFeed: () => Promise<void>;
  searchSuggestions: (query: string) => Promise<{ products: Product[]; categories: string[] }>;
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  trendingSearches: string[];
  fetchAllProducts: () => Promise<void>;
  fetchBanners: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchFlashSale: () => Promise<void>;

  // Category Discounts & Pricing Architecture
  activeDiscounts: CategoryDiscount[];
  discountsLoading: boolean;
  fetchActiveDiscounts: () => Promise<void>;
  getCategoryDiscount: (categoryName: string) => CategoryDiscount | undefined;

  // Section loading states for skeleton loaders
  bannersLoading: boolean;
  categoriesLoading: boolean;
  flashSaleLoading: boolean;
  productsLoading: boolean;

  // Wishlist Database Sync
  fetchWishlist: () => Promise<void>;

  // Notification States
  notifications: CustomerNotification[];
  notificationsLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markNotificationsRead: (id?: string) => Promise<void>;
  clearNotifications: () => Promise<void>;

  // Recently Viewed Section
  recentlyViewed: Product[];
  addToRecentlyViewed: (product: Product) => void;

  // Real-time Authentication & User State
  user: UserProfile | null;
  authToken: string | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  exchangeMobileCode: (code: string) => Promise<{ success: boolean; error?: string; isProfileIncomplete?: boolean }>;
  register: (name: string, email: string, password: string, phone?: string, otp?: string) => Promise<{ success: boolean; error?: string }>;
  requestOtp: (email: string) => Promise<{ success: boolean; message?: string; error?: string; expiresInSeconds?: number }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; user?: UserProfile; token?: string; error?: string }>;
  logout: () => Promise<void>;
  updateUserProfile: (updatedUser: Partial<UserProfile>) => Promise<void>;
  fetchUserCart: () => Promise<void>;
  syncCartWithBackend: () => Promise<void>;

  // Real Orders State
  orders: any[];
  ordersLoading: boolean;
  fetchOrders: () => Promise<void>;
  placeOrder: (orderPayload: any) => Promise<{ success: boolean; orderId?: string; error?: string }>;

  // Real Delivery Address State
  currentAddress: DeliveryAddress | null;
  setCurrentAddress: (addr: DeliveryAddress | null) => void;
  saveShippingAddress: (addr: DeliveryAddress) => Promise<void>;
  deleteShippingAddress: (addrId: string) => Promise<void>;

  // Interactive Auth Modal Control
  authModalVisible: boolean;
  setAuthModalVisible: (visible: boolean) => void;

  // Offline & Network Connectivity State
  isOffline: boolean;
  setIsOffline: (val: boolean) => void;
  checkNetworkConnectivity: () => Promise<boolean>;
  refreshAllData: () => Promise<any>;
}

const MobileAppContext = createContext<MobileAppContextType | undefined>(undefined);

export const useMobileApp = () => {
  const context = useContext(MobileAppContext);
  if (!context) {
    throw new Error('useMobileApp must be used within a MobileAppProvider');
  }
  return context;
};

import { BACKEND_URL, normalizeImageUrl, AUTH_TOKEN_KEY, USER_PROFILE_KEY, API_ENDPOINTS } from '../config/api';
export { BACKEND_URL, normalizeImageUrl, AUTH_TOKEN_KEY, USER_PROFILE_KEY, API_ENDPOINTS };

// Currency formatter supporting both integers and decimal prices (e.g. ₹16.50 vs ₹1,650)
export const formatCurrency = (val: number | string | undefined | null): string => {
  const num = Number(val);
  if (isNaN(num)) return '0';
  if (num % 1 !== 0) {
    return num.toFixed(2);
  }
  return num.toLocaleString('en-IN');
};

// Category cleaner utility to map backend category folders to customer friendly titles
export const mapCategoryLabel = (catName: string): string => {
  const mapping: { [key: string]: string } = {
    'sonu_steel_products': 'Sonu Steel Products',
    'Kitchen & Steel': 'Sonu Steel Products',
    'birds_and_accessories': 'Birds And Accessories',
    'KondapalliBommalu': 'Kondapalli Toys',
    'waterbottles and jars': 'Water Bottles & Jars',
    'self adhesive wallpaper rolls': 'Wallpaper Rolls',
    'Traditional Rajasthan idols': 'Traditional Rajasthan Idols',
    'Garden tools and compost': 'Garden Tools & Compost',
    'Multiple purpose mats': 'Multiple Purpose Mats',
    'water fountains medium': 'Water Fountains',
    'aquarium and accesories': 'Aquarium & Accessories',
    'Aquarium & Accessories': 'Aquarium & Accessories'
  };
  return mapping[catName] || catName;
};

export const ORDERED_CATEGORY_NAMES = [
  'Sonu Steel Products',
  'Cello',
  'Aquarium & Accessories',
  'Lunch Boxes',
  'Water Bottles & Jars',
  'German Silver & More',
  'Multiple Purpose Mats',
  'Wallpaper Rolls',
  'Birds And Accessories',
  'Kondapalli Toys',
  'Water Fountains',
  'Wall Clocks',
  'Traditional Rajasthan Idols',
  'Garden Tools & Compost',
  'Handicrafts & Gifts',
  'Ceramic Pots',
  'Artificial Plants',
  'Harshdeep Planters',
  'Garlands'
];

export const MobileAppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Dynamic content states
  const [banners, setBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [flashSale, setFlashSale] = useState<{ expiryTime: string; products: Product[] } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  // Real Auth & User states
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authModalVisible, setAuthModalVisibleState] = useState<boolean>(false);

  // Synchronized refs to avoid stale closures during asynchronous authentication callbacks
  const userRef = useRef<UserProfile | null>(null);
  const authTokenRef = useRef<string | null>(null);
  const isAuthenticatedRef = useRef<boolean>(false);

  useEffect(() => {
    userRef.current = user;
    authTokenRef.current = authToken;
    isAuthenticatedRef.current = isAuthenticated;
  }, [user, authToken, isAuthenticated]);

  const setAuthModalVisible = (visible: boolean) => {
    if (visible) {
      setSelectedProductId(null);
      setActiveTab('account');
    }
    setAuthModalVisibleState(false);
  };

  // Real Orders states
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);

  // Delivery Address state
  const [currentAddress, setCurrentAddress] = useState<DeliveryAddress | null>(null);

  // Loading States for Skeletons
  const [bannersLoading, setBannersLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [flashSaleLoading, setFlashSaleLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [discountsLoading, setDiscountsLoading] = useState(false);
  const [returnGiftsLoading, setReturnGiftsLoading] = useState(false);

  // Return Gifts state
  const [returnGifts, setReturnGifts] = useState<Product[]>([]);

  // Active Category Discounts state
  const [activeDiscounts, setActiveDiscounts] = useState<CategoryDiscount[]>([]);

  // Pagination states
  const [paginatedProducts, setPaginatedProducts] = useState<Product[]>([]);
  const [paginatedLoading, setPaginatedLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);

  // Notifications states
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Recently Viewed states
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  // Search states
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Cello Dinner Set',
    'Rajasthan Idol',
    'Matte Black Bottle'
  ]);
  const trendingSearches = [
    'Artisanal Vase',
    'Luxe Candelabra',
    'Vacuum Flask',
    'German Silver',
    'Wall Clocks'
  ];

  // Offline & Network Connectivity State
  const [isOffline, setIsOffline] = useState(false);

  const checkNetworkConnectivity = async (): Promise<boolean> => {
    try {
      const state = await Network.getNetworkStateAsync();
      const connected = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOffline(!connected);
      return connected;
    } catch {
      return true;
    }
  };

  // Always fetch live from API - No caching
  const fetchWithCache = async (url: string, _forceRefresh = false, timeoutMs = 8000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      return data;
    } catch (err: any) {
      clearTimeout(timer);
      Network.getNetworkStateAsync()
        .then(state => {
          if (!state.isConnected || state.isInternetReachable === false) {
            setIsOffline(true);
          }
        })
        .catch(() => {});
      throw err;
    }
  };

  // Map backend product data format to mobile client format (3-Price Architecture: Strike, Actual & Final)
  const mapBackendProduct = (p: any): Product => {
    // 1. Strike Price (MRP / Original reference retail price)
    const rawStrike = Number(
      p.strikePrice !== undefined ? p.strikePrice :
        p.strike_price !== undefined ? p.strike_price :
          p["act-price"] !== undefined ? p["act-price"] :
            p.mrp !== undefined ? p.mrp :
              0
    );

    // 2. Actual Price (Base selling price stored in backend catalog)
    const rawActual = Number(
      p.actualPrice !== undefined ? p.actualPrice :
        p.actual_price !== undefined ? p.actual_price :
          0
    );

    // 3. Category Promotional Discount (e.g. 99% off)
    const catDiscountPercent = Number(
      p.categoryDiscountPercentage !== undefined ? p.categoryDiscountPercentage :
        p.category_discount_percentage !== undefined ? p.category_discount_percentage :
          0
    );

    const hasCatDiscount = Boolean(
      p.hasCategoryDiscount !== undefined
        ? p.hasCategoryDiscount
        : catDiscountPercent > 0
    );

    const isReturnGift = Boolean(
      p.isReturnGift ||
      p.category === 'return_gifts' ||
      p.category === 'Return Gifts' ||
      String(p.id || '').startsWith('rg-')
    );

    // 4. Final Price / Discounted Price (The dominant customer final price)
    let finalPrice: number;
    if (p.finalPrice !== undefined && Number(p.finalPrice) >= 0) {
      finalPrice = Number(p.finalPrice);
    } else if (p.discountedPrice !== undefined && Number(p.discountedPrice) >= 0) {
      finalPrice = Number(p.discountedPrice);
    } else if (isReturnGift && p.price !== undefined && Number(p.price) > 0) {
      // For Return Gifts: p.price is the discounted wholesale selling price, p.actualPrice is MRP reference
      finalPrice = Number(p.price);
    } else if (hasCatDiscount && rawActual > 0 && catDiscountPercent > 0) {
      // finalPrice = actualPrice - (actualPrice * categoryDiscountPercentage / 100)
      finalPrice = Math.round((rawActual - (rawActual * catDiscountPercent / 100)) * 100) / 100;
    } else if (rawActual > 0) {
      finalPrice = rawActual;
    } else if (p.price !== undefined && Number(p.price) >= 0) {
      finalPrice = Number(p.price);
    } else {
      finalPrice = rawStrike > 0 ? rawStrike : 0;
    }

    const actualVal = isReturnGift && rawActual > 0 ? rawActual : (rawActual > 0 ? rawActual : (finalPrice > 0 ? finalPrice : rawStrike));
    const strikeVal = isReturnGift && rawActual > finalPrice ? rawActual : (rawStrike > 0 ? rawStrike : (actualVal > finalPrice ? actualVal : finalPrice));

    // Category discount amount
    const catDiscountAmt = Number(
      p.categoryDiscountAmount !== undefined ? p.categoryDiscountAmount :
        p.category_discount_amount !== undefined ? p.category_discount_amount :
          (hasCatDiscount && catDiscountPercent > 0 && actualVal > 0
            ? Math.round((actualVal * catDiscountPercent) / 100)
            : 0)
    );

    // Regular difference & discount percentage when category discount is OFF
    const regularSavings = strikeVal > finalPrice ? strikeVal - finalPrice : 0;
    const regularDiscountPercent = strikeVal > finalPrice && strikeVal > 0
      ? Math.round((regularSavings / strikeVal) * 100)
      : 0;

    const effectiveDiscountPercent = hasCatDiscount && catDiscountPercent > 0
      ? catDiscountPercent
      : regularDiscountPercent;

    const isDiscounted = hasCatDiscount || strikeVal > finalPrice;

    return {
      id: String(p.id || p.prod_id || ''),
      title: p.title || p.name || 'Ghar Sansar Product',
      name: p.name || p.title || 'Ghar Sansar Product',
      description: p.description || '',
      price: finalPrice, // Dominant customer final price
      finalPrice, // Dominant customer final price
      discountedPrice: finalPrice, // Alias for finalPrice
      actualPrice: actualVal, // Base selling price (hidden when hasCategoryDiscount == true)
      strikePrice: strikeVal, // MRP reference price (strikethrough when strikePrice > finalPrice)
      actPrice: strikeVal, // Backward-compatible alias
      categoryDiscountPercentage: catDiscountPercent,
      categoryDiscountAmount: catDiscountAmt,
      currentDifference: regularSavings,
      hasCategoryDiscount: hasCatDiscount,
      isDiscounted,
      discountPercentage: effectiveDiscountPercent,
      image: p.image ? normalizeImageUrl(p.image) : '',
      category: isReturnGift ? 'Return Gifts' : mapCategoryLabel(p.category || ''),
      subCategory: p.subCategory || '',
      rating: Number(p.rating) || 4.5,
      reviewsCount: Number(p.reviewsCount) || 12,
      matchPercent: Number(p.matchPercent) || 85,
      commentsCount: Number(p.commentsCount) || 0,
      isReturnGift,
      minOrderQuantity: isReturnGift ? 50 : 1,
    };
  };

  // Fetch Return Gifts from API
  const fetchReturnGifts = async () => {
    setReturnGiftsLoading(true);
    try {
      const primaryUrl = 'https://gharsansar.website/api/return_gifts?category=All+Gifts&limit=1000&delay=400';
      let data: any = null;
      try {
        data = await fetchWithCache(primaryUrl, false, 8000);
      } catch (err) {
        console.warn('Fallback to backend URL for return gifts:', err);
        data = await fetchWithCache(`${BACKEND_URL}/api/return_gifts?category=All+Gifts&limit=1000`, false, 8000);
      }
      const rawList = Array.isArray(data) ? data : (data?.products || data?.data || []);
      const mapped = rawList.map((p: any) => mapBackendProduct({ ...p, isReturnGift: true, category: 'return_gifts' }));
      setReturnGifts(mapped);
    } catch (err) {
      console.warn('Failed to fetch return gifts from API:', err);
      setReturnGifts([]);
    } finally {
      setReturnGiftsLoading(false);
    }
  };

  // Fetch all banners
  const fetchBanners = async () => {
    setBannersLoading(true);
    try {
      const data = await fetchWithCache(`${BACKEND_URL}/api/banners`);
      const mappedBanners = (data || []).map((b: any) => ({
        ...b,
        image: b.image ? normalizeImageUrl(b.image) : b.image
      }));
      setBanners(mappedBanners);
    } catch (err) {
      console.warn('Failed to fetch banners from API:', err);
      setBanners([]);
    } finally {
      setBannersLoading(false);
    }
  };

  // Fetch all categories
  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const data = await fetchWithCache(`${BACKEND_URL}/api/products/categories`);
      if (data) {
        // Map backend category names to display labels
        const mapped = data.map((cat: any) => {
          const catName = mapCategoryLabel(cat.name);
          let catImage = cat.image ? normalizeImageUrl(cat.image) : '';

          // Override thumbnail for Sonu Steel Products with Sonu Eliza Pot 16cm 1500 Ml
          if (
            catName === 'Sonu Steel Products' ||
            cat.name === 'sonu_steel_products' ||
            cat.name === 'Kitchen & Steel' ||
            catName === 'Kitchen & Steel'
          ) {
            catImage = normalizeImageUrl('/products/sonu_steel_products/sonu_eliza_pot_16cm_1500_ml.webp');
          }

          // Override thumbnail for Cello with Cello Designer Crockery Set 31 Pcs Set
          if (
            catName === 'Cello' ||
            cat.name === 'Cello' ||
            cat.name?.toLowerCase() === 'cello' ||
            catName.toLowerCase() === 'cello'
          ) {
            catImage = normalizeImageUrl('/products/cello_prod/cello_designer_crockery_set_31pcs_set.webp');
          }

          // Override thumbnail for Aquarium & Accessories with Optimum Fish Food 500g
          if (
            catName === 'Aquarium & Accessories' ||
            cat.name === 'Aquarium & Accessories' ||
            cat.name?.toLowerCase().includes('aquarium') ||
            catName.toLowerCase().includes('aquarium')
          ) {
            catImage = normalizeImageUrl('/products/aquarium_and_accesories/optimum_fish_food_500g_mini_pellets_for_aquarium_fish_high_protein_floating_feed_for_guppy_molly_tetra_betta_tropical_fish_daily_nutrition_for_growth_color_enhancement.webp');
          }

          return {
            ...cat,
            name: catName,
            image: catImage,
            count: cat.count || 0
          };
        });

        // Sort mapped categories strictly in user-specified order from Image 2
        mapped.sort((a: any, b: any) => {
          const indexA = ORDERED_CATEGORY_NAMES.indexOf(a.name);
          const indexB = ORDERED_CATEGORY_NAMES.indexOf(b.name);
          const posA = indexA === -1 ? 999 : indexA;
          const posB = indexB === -1 ? 999 : indexB;
          return posA - posB;
        });

        setCategories(mapped);
      }
    } catch (err) {
      console.warn('Failed to fetch categories from API:', err);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Fetch flash sale items
  const fetchFlashSale = async () => {
    setFlashSaleLoading(true);
    try {
      const data = await fetchWithCache(`${BACKEND_URL}/api/flashsale`);
      if (data) {
        const mappedFlashSale = {
          expiryTime: data.expiryTime,
          products: (data.products || []).map(mapBackendProduct)
        };
        setFlashSale(mappedFlashSale);
      }
    } catch (err) {
      console.warn('Failed to fetch flashsale from API:', err);
      setFlashSale(null);
    } finally {
      setFlashSaleLoading(false);
    }
  };

  // Fetch active category discounts from REST API (/api/v1/discounts/active)
  const fetchActiveDiscounts = async () => {
    setDiscountsLoading(true);
    try {
      const data = await fetchWithCache(API_ENDPOINTS.ACTIVE_DISCOUNTS);
      if (data && data.success && Array.isArray(data.data)) {
        setActiveDiscounts(data.data);
      }
    } catch (err) {
      console.warn('Failed to fetch active discounts:', err);
      setActiveDiscounts([]);
    } finally {
      setDiscountsLoading(false);
    }
  };

  // Helper to query category discount for a specific category
  const getCategoryDiscount = (categoryName: string): CategoryDiscount | undefined => {
    if (!categoryName || activeDiscounts.length === 0) return undefined;
    const norm = mapCategoryLabel(categoryName).toLowerCase().trim();
    return activeDiscounts.find(d => {
      const dCat = mapCategoryLabel(d.category || '').toLowerCase().trim();
      return dCat === norm || norm.includes(dCat) || dCat.includes(norm);
    });
  };

  // Fetch general products (with offline persistence and paginated fallback)
  const fetchAllProducts = async () => {
    setProductsLoading(true);
    try {
      const data = await fetchWithCache(`${BACKEND_URL}/api/products`);
      if (data && Array.isArray(data) && data.length > 0) {
        const flatList: Product[] = [];
        data.forEach((cat: any, catIdx: number) => {
          cat.subcategories?.forEach((sub: any, subIdx: number) => {
            const itemKey = sub.images ? "images" : sub.products ? "products" : "services";
            const items = sub[itemKey] || [];
            items.forEach((item: any, idx: number) => {
              const generatedId = item.prod_id || item.id || `prod_${catIdx}_${subIdx}_${idx}`;
              flatList.push(mapBackendProduct({
                ...item,
                id: generatedId,
                prod_id: generatedId,
                category: cat.name,
                subCategory: sub.name
              }));
            });
          });
        });

        if (flatList.length > 0) {
          setProducts(flatList);
          return;
        }
      }

      // Fallback: Fetch directly from /api/products/paginated
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const pageRes = await fetch(`${BACKEND_URL}/api/products/paginated?page=1&limit=50`, { signal: controller.signal });
        clearTimeout(timer);
        if (pageRes.ok) {
          const pageData = await pageRes.json();
          if (pageData && Array.isArray(pageData.products) && pageData.products.length > 0) {
            const mapped = pageData.products.map(mapBackendProduct);
            setProducts(mapped);
            return;
          }
        }
      } catch (pageErr) {
        clearTimeout(timer);
      }
    } catch (err) {
      console.warn('Failed to fetch product list from backend API:', err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  // Fetch paginated products feed
  const loadMoreProducts = async () => {
    if (paginatedLoading || !hasMoreProducts) return;
    setPaginatedLoading(true);
    try {
      const url = `${BACKEND_URL}/api/products/paginated?page=${page}&limit=10`;
      const data = await fetchWithCache(url);
      if (data) {
        const mapped = (data.products || []).map(mapBackendProduct);
        setPaginatedProducts(prev => [...prev, ...mapped]);
        setPage(prev => prev + 1);
        setHasMoreProducts(data.hasMore);
      }
    } catch (err) {
      console.warn('Failed to load paginated products:', err);
      // Fallback
      if (products.length > 0) {
        const start = (page - 1) * 10;
        const nextBatch = products.slice(start, start + 10);
        setPaginatedProducts(prev => [...prev, ...nextBatch]);
        setPage(prev => prev + 1);
        setHasMoreProducts(start + 10 < products.length);
      }
    } finally {
      setPaginatedLoading(false);
    }
  };

  const refreshAllData = async () => {
    setProductsLoading(true);
    setCategoriesLoading(true);
    setBannersLoading(true);
    setReturnGiftsLoading(true);

    const isConnected = await checkNetworkConnectivity();
    if (!isConnected) {
      setProductsLoading(false);
      setCategoriesLoading(false);
      setBannersLoading(false);
      setReturnGiftsLoading(false);
      throw new Error('No internet connection');
    }

    try {
      const results = await Promise.allSettled([
        fetchActiveDiscounts(),
        fetchAllProducts(),
        fetchReturnGifts(),
        fetchBanners(),
        fetchCategories(),
        fetchFlashSale(),
        fetchWishlist(),
        fetchNotifications(),
      ]);
      setIsOffline(false);
      return results;
    } catch (e) {
      const recheck = await checkNetworkConnectivity();
      if (!recheck) {
        setIsOffline(true);
      }
      throw e;
    } finally {
      setProductsLoading(false);
      setCategoriesLoading(false);
      setBannersLoading(false);
      setReturnGiftsLoading(false);
    }
  };

  const refreshProductsFeed = async () => {
    setPage(1);
    setHasMoreProducts(true);
    setPaginatedProducts([]);
    setPaginatedLoading(true);
    fetchActiveDiscounts().catch(() => { });
    try {
      const url = `${BACKEND_URL}/api/products/paginated?page=1&limit=10`;
      const data = await fetchWithCache(url, true); // Force bypass cache on refresh
      if (data) {
        const mapped = (data.products || []).map(mapBackendProduct);
        setPaginatedProducts(mapped);
        setPage(2);
        setHasMoreProducts(data.hasMore);
      }
    } catch (err) {
      console.warn('Failed to refresh feed:', err);
      if (products.length > 0) {
        const initialBatch = products.slice(0, 10);
        setPaginatedProducts(initialBatch);
        setPage(2);
        setHasMoreProducts(10 < products.length);
      }
    } finally {
      setPaginatedLoading(false);
    }
  };

  // Search suggestions
  const searchSuggestions = async (query: string): Promise<{ products: Product[]; categories: string[] }> => {
    try {
      const url = `${BACKEND_URL}/api/products/search?q=${encodeURIComponent(query)}`;
      const data = await fetchWithCache(url);
      if (data) {
        return {
          products: (data.products || []).map(mapBackendProduct),
          categories: (data.categories || []).map(mapCategoryLabel)
        };
      }
    } catch (err) {
      console.warn('Failed to fetch search suggestions:', err);
    }
    return { products: [], categories: [] };
  };

  // Sync favorites locally and with MongoDB Atlas
  const fetchWishlist = async (tokenOverride?: string | null) => {
    const activeToken = tokenOverride !== undefined ? tokenOverride : authToken;
    try {
      if (activeToken) {
        const res = await fetch(`${BACKEND_URL}/api/v1/wishlist`, {
          headers: {
            'Authorization': `Bearer ${activeToken}`,
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.productIds)) {
            setFavorites(data.productIds);
            await AsyncStorage.setItem('favorites', JSON.stringify(data.productIds));
            return;
          }
        }
      }
      const stored = await AsyncStorage.getItem('favorites');
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (err) {
      console.warn('Failed to load wishlist:', err);
    }
  };

  const toggleFavorite = async (id: string) => {
    const nextFavorites = favorites.includes(id)
      ? favorites.filter(item => item !== id)
      : [...favorites, id];

    setFavorites(nextFavorites);
    try {
      await AsyncStorage.setItem('favorites', JSON.stringify(nextFavorites));
    } catch (err) {
      console.warn('Failed to save favorites locally:', err);
    }

    if (authToken) {
      const prod = products.find(p => p.id === id) || paginatedProducts.find(p => p.id === id);
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/wishlist/toggle`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            productId: id,
            name: prod?.title || prod?.name || '',
            price: prod?.price || 0,
            image: prod?.image || ''
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.productIds)) {
            setFavorites(data.productIds);
            await AsyncStorage.setItem('favorites', JSON.stringify(data.productIds));
          }
        }
      } catch (e) {
        console.warn('Failed sync toggling wishlist item on backend:', e);
      }
    }
  };

  // Notifications logic
  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const url = `${BACKEND_URL}/api/mobile/notifications`;
      const data = await fetchWithCache(url);
      if (data && data.success) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.warn('Failed to fetch customer notifications:', err);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markNotificationsRead = async (id?: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/mobile/notifications/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications);
        }
      }
    } catch (err) {
      console.warn('Failed to read notifications:', err);
    }
  };

  const clearNotifications = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/mobile/notifications/clear`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications([]);
        }
      }
    } catch (err) {
      console.warn('Failed to clear notifications:', err);
    }
  };

  // Recently Viewed product logic
  const addToRecentlyViewed = async (product: Product) => {
    if (!product) return;
    setRecentlyViewed(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      const updated = [product, ...filtered].slice(0, 10);
      AsyncStorage.setItem('recently_viewed', JSON.stringify(updated)).catch(err => {
        console.warn('Failed to save recently viewed products:', err);
      });
      return updated;
    });
  };

  // Load recently viewed on mount
  useEffect(() => {
    const loadRecentlyViewed = async () => {
      try {
        const stored = await AsyncStorage.getItem('recently_viewed');
        if (stored) {
          setRecentlyViewed(JSON.parse(stored));
        }
      } catch (err) {
        console.warn('Failed to load recently viewed:', err);
      }
    };
    loadRecentlyViewed();
  }, []);

  // Monitor selectedProductId to add to Recently Viewed history
  useEffect(() => {
    if (selectedProductId) {
      const found = products.find(p => p.id === selectedProductId) ||
        paginatedProducts.find(p => p.id === selectedProductId) ||
        (flashSale && flashSale.products.find(p => p.id === selectedProductId)) ||
        returnGifts.find(p => p.id === selectedProductId);
      if (found) {
        addToRecentlyViewed(found);
      }
    }
  }, [selectedProductId, products, paginatedProducts, flashSale, returnGifts]);

  const addRecentSearch = (query: string) => {
    if (!query.trim()) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== query.toLowerCase());
      return [query, ...filtered].slice(0, 10);
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  // Run on mount
  useEffect(() => {
    const registerForPushNotificationsAsync = async () => {
      try {
        let token;
        if (Device.isDevice) {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          if (finalStatus !== 'granted') {
            console.warn('Failed to get push token for push notification!');
            return;
          }
          token = (await Notifications.getExpoPushTokenAsync()).data;
        } else {
          console.log('Must use physical device for Push Notifications');
        }

        if (token) {
          await fetch(`${BACKEND_URL}/api/mobile/push-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token,
              userId: 'ALL',
              deviceId: Device.osBuildId || 'unknown',
            })
          });
          console.log('Push token registered successfully');
        }
      } catch (err) {
        console.warn('Push notification token registration skipped/failed in current client:', err);
      }
    };

    const restoreAuthSession = async () => {
      try {
        // 1. Restore local cart first
        const storedCart = await AsyncStorage.getItem('cart');
        if (storedCart) {
          try {
            setCart(JSON.parse(storedCart));
          } catch (e) { }
        }

        // 2. Restore token & user profile
        const storedToken = (await AsyncStorage.getItem(AUTH_TOKEN_KEY)) || (await AsyncStorage.getItem('token'));
        const storedUser = await AsyncStorage.getItem(USER_PROFILE_KEY);
        let activeUser = storedUser ? JSON.parse(storedUser) : null;

        if (storedToken && !storedToken.startsWith('token_session')) {
          setAuthToken(storedToken);
          // Verify token against /api/v1/auth/me
          try {
            const meRes = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
              headers: {
                'Authorization': `Bearer ${storedToken}`,
                'Content-Type': 'application/json',
              },
            });
            if (meRes.ok) {
              const meData = await meRes.json();
              if (meData.success && meData.user) {
                activeUser = meData.user;
                await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(meData.user));
              }
            } else if (meRes.status === 401) {
              await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
              await AsyncStorage.removeItem('token');
              setAuthToken(null);
            }
          } catch (meErr) {
            console.warn('Silent /api/v1/auth/me validation error:', meErr);
          }
        }

        if (activeUser) {
          userRef.current = activeUser;
          isAuthenticatedRef.current = true;
          authTokenRef.current = storedToken;
          setUser(activeUser);
          setIsAuthenticated(true);
          fetchOrdersForUser(activeUser, storedToken);
          fetchWishlist(storedToken);
          fetchUserCart(storedToken);

          // Restore address only for authenticated user
          const storedAddr = await AsyncStorage.getItem('user_shipping_address');
          if (storedAddr) {
            try {
              setCurrentAddress(JSON.parse(storedAddr));
            } catch (e) {
              setCurrentAddress(null);
            }
          } else if (activeUser.addresses && activeUser.addresses.length > 0) {
            const def = activeUser.addresses.find((a: any) => a.isDefault) || activeUser.addresses[0];
            setCurrentAddress(def);
          } else if (activeUser.street_address) {
            const backendAddr = {
              name: activeUser.name || (activeUser as any).full_name || 'Customer',
              phone: activeUser.phone || '',
              address: activeUser.street_address,
              city: activeUser.city || '',
              state: activeUser.state || 'Andhra Pradesh',
              zipCode: activeUser.pincode || '',
              isDefault: true,
            };
            setCurrentAddress(backendAddr);
            await AsyncStorage.setItem('user_shipping_address', JSON.stringify(backendAddr));
          } else {
            setCurrentAddress(null);
          }
        } else {
          // Explicitly clear unauthenticated guest session
          userRef.current = null;
          isAuthenticatedRef.current = false;
          authTokenRef.current = null;
          setUser(null);
          setIsAuthenticated(false);
          setCurrentAddress(null);
          setCart([]);
          await AsyncStorage.removeItem('user_shipping_address');
          await AsyncStorage.removeItem('cart');
        }
      } catch (err) {
        console.warn('Failed restoring user session:', err);
      } finally {
        setAuthLoading(false);
      }
    };

    const initializeData = async () => {
      // Clean up any previously stored offline cache
      try {
        await AsyncStorage.multiRemove([
          '@cached_products',
          '@cached_return_gifts',
          '@cached_banners',
          '@cached_categories',
          '@cached_flashsale',
          '@cached_active_discounts'
        ]);
        await ExpoImage.clearDiskCache();
        await ExpoImage.clearMemoryCache();
      } catch (e) { }

      const isConnected = await checkNetworkConnectivity();
      if (!isConnected) {
        setIsOffline(true);
        setProductsLoading(false);
        setCategoriesLoading(false);
        setBannersLoading(false);
        setReturnGiftsLoading(false);
        setDiscountsLoading(false);
        return;
      }

      await Promise.all([
        fetchActiveDiscounts(),
        fetchAllProducts(),
        fetchReturnGifts(),
        fetchBanners(),
        fetchCategories(),
        fetchFlashSale(),
        fetchWishlist(),
        fetchNotifications(),
        restoreAuthSession()
      ]);
    };

    initializeData();
    registerForPushNotificationsAsync();

    // Add network state listener
    let networkSubscription: any = null;
    try {
      networkSubscription = Network.addNetworkStateListener(state => {
        const connected = Boolean(state.isConnected && state.isInternetReachable !== false);
        setIsOffline(!connected);
        if (connected) {
          refreshAllData().catch(() => {});
        }
      });
    } catch (e) {
      console.warn('Network state listener unavailable:', e);
    }

    // Add foreground notification listener
    let notificationListener: any = null;
    try {
      notificationListener = Notifications.addNotificationReceivedListener(notification => {
        fetchNotifications();
      });
    } catch (e) {
      console.warn('Foreground notification listener unavailable:', e);
    }

    return () => {
      if (networkSubscription?.remove) {
        networkSubscription.remove();
      }
      if (notificationListener?.remove) {
        notificationListener.remove();
      }
    };
  }, []);

  // Fetch real orders for user from backend
  const fetchOrdersForUser = async (targetUser?: UserProfile | null, tokenOverride?: string | null) => {
    const target = targetUser !== undefined ? targetUser : user;
    const activeToken = tokenOverride !== undefined ? tokenOverride : authToken;
    if (!target && !activeToken) {
      setOrders([]);
      return;
    }
    setOrdersLoading(true);
    try {
      // 1. Try /api/v1/orders with JWT Bearer token
      if (activeToken) {
        const res = await fetch(`${BACKEND_URL}/api/v1/orders`, {
          headers: {
            'Authorization': `Bearer ${activeToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.orders)) {
            setOrders(data.orders);
            return;
          } else if (Array.isArray(data)) {
            setOrders(data);
            return;
          }
        }
      }

      // 2. Fallback to /api/orders
      const idOrEmail = target?.id || target?.email;
      if (idOrEmail) {
        const res = await fetch(`${BACKEND_URL}/api/orders?userId=${encodeURIComponent(idOrEmail)}&email=${encodeURIComponent(target?.email || '')}`, {
          headers: {
            'user-id': idOrEmail
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setOrders(data);
          }
        }
      }
    } catch (err) {
      console.warn('Failed fetching real orders from backend:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchOrders = async () => {
    await fetchOrdersForUser();
  };

  // Cart synchronization methods
  const fetchUserCart = async (tokenOverride?: string | null) => {
    const activeToken = tokenOverride !== undefined ? tokenOverride : authToken;
    if (!activeToken) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/cart`, {
        headers: {
          'Authorization': `Bearer ${activeToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.cart && Array.isArray(data.cart.items)) {
          const mapped: CartItem[] = data.cart.items.map((bi: any) => ({
            product: mapBackendProduct({
              ...bi,
              id: bi.productId || bi.id,
            }),
            quantity: Number(bi.quantity) || 1,
            selected: true,
          }));
          setCart(mapped);
          await AsyncStorage.setItem('cart', JSON.stringify(mapped));
        }
      }
    } catch (err) {
      console.warn('Failed to fetch user cart from backend:', err);
    }
  };

  const syncCartWithBackend = async (tokenOverride?: string | null) => {
    const activeToken = tokenOverride !== undefined ? tokenOverride : authToken;
    if (!activeToken) return;
    try {
      if (cart.length > 0) {
        await fetch(`${BACKEND_URL}/api/v1/cart/merge`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${activeToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            guestItems: cart.map(i => ({
              productId: i.product.id,
              name: i.product.title || i.product.name,
              price: i.product.finalPrice !== undefined ? i.product.finalPrice : i.product.price,
              quantity: i.quantity,
              image: i.product.image,
            })),
          }),
        });
      }
      await fetchUserCart(activeToken);
    } catch (err) {
      console.warn('Failed merging cart with backend:', err);
    }
  };

  const syncOnLogin = (targetUser: UserProfile, activeToken: string) => {
    fetchOrdersForUser(targetUser, activeToken);
    syncCartWithBackend(activeToken);
    fetchWishlist(activeToken);
  };

  // 1. Send OTP Request
  const requestOtp = async (email: string): Promise<{ success: boolean; message?: string; error?: string; expiresInSeconds?: number }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { success: false, error: 'Please enter a valid email address.' };
      }
      const res = await fetch(`${BACKEND_URL}/api/v1/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          message: data.message || 'Verification code sent to your email address.',
          expiresInSeconds: data.expiresInSeconds || 600,
        };
      }
      return {
        success: false,
        error: data.error || data.message || (res.status === 429 ? 'Please wait before requesting another OTP.' : 'Failed to send OTP.'),
      };
    } catch (err: any) {
      console.warn('requestOtp error:', err);
      return { success: false, error: 'Unable to connect to server. Please check your network connection.' };
    }
  };

  // Reusable helper to set authenticated session, tokens, address, and profile
  const applyAuthenticatedSession = async (userObj: any, token: string) => {
    userRef.current = userObj;
    isAuthenticatedRef.current = true;
    authTokenRef.current = token;
    setAuthToken(token);
    setUser(userObj);
    setIsAuthenticated(true);
    setAuthModalVisible(false);

    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userObj));

    if (userObj.addresses && userObj.addresses.length > 0) {
      const def = userObj.addresses.find((a: any) => a.isDefault) || userObj.addresses[0];
      setCurrentAddress(def);
      await AsyncStorage.setItem('user_shipping_address', JSON.stringify(def));
    } else if (userObj.street_address) {
      const backendAddr = {
        name: userObj.name || (userObj as any).full_name || 'Customer',
        phone: userObj.phone || '',
        address: userObj.street_address,
        city: userObj.city || '',
        state: userObj.state || 'Andhra Pradesh',
        zipCode: userObj.pincode || '',
        isDefault: true,
      };
      setCurrentAddress(backendAddr);
      await AsyncStorage.setItem('user_shipping_address', JSON.stringify(backendAddr));
    } else {
      setCurrentAddress(null);
      await AsyncStorage.removeItem('user_shipping_address');
    }

    syncOnLogin(userObj, token);
  };

  // Replay & race condition protection for OAuth codes (Requirement 6)
  const processedAuthCodesRef = useRef<Set<string>>(new Set());
  const activeExchangePromiseRef = useRef<Promise<{ success: boolean; error?: string; isProfileIncomplete?: boolean }> | null>(null);
  const lastExchangeResultRef = useRef<{ success: boolean; error?: string; isProfileIncomplete?: boolean } | null>(null);

  const exchangeMobileCode = async (
    code: string
  ): Promise<{ success: boolean; error?: string; isProfileIncomplete?: boolean }> => {
    if (!code || typeof code !== 'string') {
      return { success: false, error: 'Invalid authorization code' };
    }
    const cleanCode = code.trim();
    if (!cleanCode) {
      return { success: false, error: 'Invalid authorization code' };
    }

    // If an exchange is already in progress, coalesce and wait for the existing exchange
    if (activeExchangePromiseRef.current) {
      console.log('[Google Auth Bridge] Exchange already in progress, coalescing callers...');
      return await activeExchangePromiseRef.current;
    }

    // Requirement 6: Prevent Duplicate Code Processing
    if (processedAuthCodesRef.current.has(cleanCode)) {
      console.log('[Google Auth Bridge] Code already processed.');
      if (lastExchangeResultRef.current) {
        return lastExchangeResultRef.current;
      }
      if (isAuthenticatedRef.current || userRef.current) {
        return { success: true };
      }
      return { success: true };
    }

    processedAuthCodesRef.current.add(cleanCode);
    setAuthLoading(true);

    const exchangeTask = (async () => {
      try {
        console.log('[Google Auth Bridge] Exchanging one-time code with backend...');

        // 1. Primary endpoint: POST https://gharsansar.website/api/v1/auth/exchange-code
        let response: Response | null = await fetch('https://gharsansar.website/api/v1/auth/exchange-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ code: cleanCode }),
        }).catch((e) => {
          console.warn('[Google Auth Bridge] Primary endpoint network error:', e.message);
          return null;
        });

        // 2. Resilient fallback to backend domain if website proxy is unreachable or 5xx
        if (!response || !response.ok) {
          console.log('[Google Auth Bridge] Trying backend direct exchange endpoint...');
          const altRes = await fetch(`${BACKEND_URL}/api/v1/auth/exchange-code`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ code: cleanCode }),
          }).catch(() => null);

          if (altRes && altRes.ok) {
            response = altRes;
          } else {
            // 3. Fallback to /mobile-code/exchange endpoint
            const altRes2 = await fetch(`${BACKEND_URL}/api/v1/auth/mobile-code/exchange`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify({ code: cleanCode }),
            }).catch(() => null);
            if (altRes2 && altRes2.ok) {
              response = altRes2;
            }
          }
        }

        if (!response) {
          const errRes = { success: false, error: 'Unable to sign you in. Please try again.' };
          lastExchangeResultRef.current = errRes;
          return errRes;
        }

        const data = await response.json().catch(() => null);

        if (response.ok && data && (data.success || data.token) && data.user) {
          const activeToken = data.token || data.legacyToken || `user_token_${data.user.id || data.user._id}`;
          await applyAuthenticatedSession(data.user, activeToken);

          const successRes = {
            success: true,
            isProfileIncomplete: Boolean(data.isProfileIncomplete),
          };
          lastExchangeResultRef.current = successRes;

          if (data.isProfileIncomplete) {
            setActiveTab('account');
          } else {
            setActiveTab('home');
          }
          return successRes;
        }

        const failRes = {
          success: false,
          error: data?.error || data?.message || 'Unable to sign you in. Please try again.',
        };
        lastExchangeResultRef.current = failRes;
        return failRes;
      } catch (err: any) {
        console.warn('[Google Auth Bridge] Code exchange exception:', err);
        const excRes = { success: false, error: 'Unable to sign you in. Please try again.' };
        lastExchangeResultRef.current = excRes;
        return excRes;
      } finally {
        activeExchangePromiseRef.current = null;
        setAuthLoading(false);
      }
    })();

    activeExchangePromiseRef.current = exchangeTask;
    return await exchangeTask;
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthLoading(true);
      const authUrl = 'https://gharsansar.website/mobile-auth?redirect_uri=gharsansar://auth/callback';

      console.log('[Google Auth Bridge] Launching Chrome Custom Tab / Auth Session...');
      const result = await WebBrowser.openAuthSessionAsync(authUrl, 'gharsansar://auth/callback');

      // 1. If WebBrowser caught the deep link redirect directly
      if (result.type === 'success' && result.url) {
        const code = extractAuthCodeFromUrl(result.url);
        if (code) {
          return await exchangeMobileCode(code);
        }
      }

      // 2. If Linking listener already caught the intent on Android and is exchanging, await that promise!
      if (activeExchangePromiseRef.current) {
        console.log('[Google Auth Bridge] In-flight exchange detected from intent, waiting...');
        const res = await activeExchangePromiseRef.current;
        if (res.success || isAuthenticatedRef.current || userRef.current) {
          return { success: true };
        }
      }

      // 3. If session is already authenticated, return success immediately
      if (isAuthenticatedRef.current || userRef.current) {
        return { success: true };
      }

      // 4. On Android, when deep link opens the app, the custom tab dismisses.
      // Poll for up to 2.5 seconds (in 100ms increments) for intent / exchange to complete
      if (result.type === 'cancel' || result.type === 'dismiss') {
        for (let i = 0; i < 25; i++) {
          if (activeExchangePromiseRef.current) {
            const res = await activeExchangePromiseRef.current;
            if (res.success || isAuthenticatedRef.current || userRef.current) {
              return { success: true };
            }
          }
          if (isAuthenticatedRef.current || userRef.current) {
            return { success: true };
          }
          await new Promise((r) => setTimeout(r, 100));
        }

        if (isAuthenticatedRef.current || userRef.current) {
          return { success: true };
        }

        console.log('[Google Auth Bridge] Browser dismissed by user.');
        return { success: false, error: 'Authentication cancelled' };
      }

      if (isAuthenticatedRef.current || userRef.current) {
        return { success: true };
      }

      return { success: false, error: 'Authentication cancelled' };
    } catch (err: any) {
      console.warn('[Google Auth Bridge] WebBrowser error:', err);
      if (activeExchangePromiseRef.current) {
        const res = await activeExchangePromiseRef.current;
        if (res.success || isAuthenticatedRef.current || userRef.current) {
          return { success: true };
        }
      }
      if (isAuthenticatedRef.current || userRef.current) {
        return { success: true };
      }
      return { success: false, error: 'Authentication cancelled' };
    } finally {
      setAuthLoading(false);
    }
  };

  // Deep link listener for all 3 Android lifecycle states (Cold Start, Background, Foreground)
  useEffect(() => {
    // Test 3: App Completely Closed (Cold start)
    Linking.getInitialURL()
      .then((url) => {
        if (url) {
          const code = extractAuthCodeFromUrl(url);
          if (code) {
            exchangeMobileCode(code);
          }
        }
      })
      .catch((e) => console.warn('[DeepLink] Initial URL check error:', e));

    // Test 1 & 2: App Open (Foreground) or App in Background
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url) {
        const code = extractAuthCodeFromUrl(url);
        if (code) {
          exchangeMobileCode(code);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // 2. Verify OTP & Authenticate
  const verifyOtp = async (email: string, otp: string): Promise<{ success: boolean; user?: UserProfile; token?: string; error?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanOtp = otp.trim();
      if (!cleanEmail || !cleanOtp) {
        return { success: false, error: 'Email and 6-digit OTP code are required.' };
      }
      const res = await fetch(`${BACKEND_URL}/api/v1/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        const activeToken = data.token || data.legacyToken || `user_token_${data.user.id || data.user._id}`;
        await applyAuthenticatedSession(data.user, activeToken);
        return { success: true, user: data.user, token: activeToken };
      }
      return {
        success: false,
        error: data.error || data.message || 'Invalid or expired OTP code. Please try again.',
      };
    } catch (err: any) {
      console.warn('verifyOtp error:', err);
      return { success: false, error: 'Network error connecting to backend server.' };
    }
  };

  const login = async (emailOrPhone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone: emailOrPhone.trim(), password })
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        const activeToken = data.token || `user_token_${data.user.id || data.user._id}`;
        await applyAuthenticatedSession(data.user, activeToken);
        return { success: true };
      }
      return { success: false, error: data.error || 'Invalid credentials' };
    } catch (err: any) {
      console.warn('Login request error:', err);
      return { success: false, error: 'Network error connecting to backend' };
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string, otp?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          full_name: name.trim(),
          email: email.trim(),
          password,
          phone: phone?.trim() || '',
          otp: otp?.trim() || '',
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        const activeToken = data.token || `user_token_${data.user.id || data.user._id}`;
        await applyAuthenticatedSession(data.user, activeToken);
        return { success: true };
      }
      return { success: false, error: data.error || 'Registration failed' };
    } catch (err: any) {
      console.warn('Registration request error:', err);
      return { success: false, error: 'Network error connecting to backend' };
    }
  };

  const logout = async () => {
    userRef.current = null;
    authTokenRef.current = null;
    isAuthenticatedRef.current = false;
    processedAuthCodesRef.current.clear();
    lastExchangeResultRef.current = null;
    setUser(null);
    setAuthToken(null);
    setIsAuthenticated(false);
    setCurrentAddress(null);
    setCart([]);
    setOrders([]);
    setAuthModalVisible(false);
    await AsyncStorage.removeItem(USER_PROFILE_KEY);
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user_shipping_address');
    await AsyncStorage.removeItem('cart');
  };

  const updateUserProfile = async (updated: Partial<UserProfile>) => {
    if (!user) return;
    const nextUser = { ...user, ...updated };
    setUser(nextUser);
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(nextUser));

    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          email: user.email,
          full_name: nextUser.name || (nextUser as any).full_name,
          name: nextUser.name || (nextUser as any).full_name,
          phone: nextUser.phone,
          addresses: nextUser.addresses || [],
          street_address: (nextUser as any).street_address,
          city: (nextUser as any).city,
          state: (nextUser as any).state,
          pincode: (nextUser as any).pincode,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setUser(data.user);
        await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(data.user));
      }
    } catch (err) {
      console.warn('PUT /api/auth/profile error:', err);
    }
  };

  const saveShippingAddress = async (addr: any) => {
    const formattedAddr: DeliveryAddress = {
      name: addr.name || user?.name || (user as any)?.full_name || 'Customer',
      phone: addr.phone || user?.phone || '',
      address: addr.address || addr.street_address || '',
      city: addr.city || '',
      state: addr.state || 'Andhra Pradesh',
      zipCode: addr.zipCode || addr.pincode || '',
      isDefault: true,
    };

    setCurrentAddress(formattedAddr);
    await AsyncStorage.setItem('user_shipping_address', JSON.stringify(formattedAddr));

    if (user) {
      const existingAddrs: any[] = user.addresses || [];
      const updatedAddrs = [
        formattedAddr,
        ...existingAddrs.filter((a: any) => (a.id && (formattedAddr as any).id ? a.id !== (formattedAddr as any).id : a.address !== formattedAddr.address))
      ];

      // Update both addresses array and primary street_address, city, state, pincode in MongoDB Atlas backend
      await updateUserProfile({
        addresses: updatedAddrs,
        phone: formattedAddr.phone || user.phone,
        street_address: formattedAddr.address,
        city: formattedAddr.city,
        state: formattedAddr.state,
        pincode: formattedAddr.zipCode,
      } as any);
    }
  };

  const deleteShippingAddress = async (addrId: string) => {
    if (user && user.addresses) {
      const updatedAddrs = user.addresses.filter((a: any) => (a.id || a.address) !== addrId);
      await updateUserProfile({ addresses: updatedAddrs });
      if (currentAddress && ((currentAddress as any).id === addrId || currentAddress.address === addrId)) {
        const nextDef = updatedAddrs.find((a: any) => a.isDefault) || updatedAddrs[0] || null;
        setCurrentAddress(nextDef);
        if (nextDef) {
          await AsyncStorage.setItem('user_shipping_address', JSON.stringify(nextDef));
        } else {
          await AsyncStorage.removeItem('user_shipping_address');
        }
      }
    }
  };

  const placeOrder = async (orderPayload: any) => {
    const fallbackOrderId = `GS-ORD-${Date.now().toString().slice(-6)}`;
    const fallbackOrderNumber = `GS${Date.now().toString().slice(-8)}`;

    const effectiveUserId = String(orderPayload.userId || user?.id || (user as any)?._id || user?.email || 'guest');

    // Normalize customer details
    const customerObj = {
      firstName: (orderPayload.customer?.firstName || user?.name || (user as any)?.full_name || 'Customer').trim(),
      lastName: (orderPayload.customer?.lastName || '').trim(),
      email: (orderPayload.customer?.email || user?.email || 'customer@gharsansar.website').trim().toLowerCase(),
      phone: (orderPayload.customer?.phone || user?.phone || '9999999999').trim(),
      address: (orderPayload.customer?.address || '').trim(),
      city: (orderPayload.customer?.city || '').trim(),
      state: (orderPayload.customer?.state || 'Andhra Pradesh').trim(),
      zipCode: (orderPayload.customer?.zipCode || '').trim(),
      country: 'India',
      notes: orderPayload.customer?.notes || orderPayload.notes || '',
    };

    // Normalize shipping address
    const shippingAddressObj = orderPayload.shippingAddress || {
      ...customerObj,
      isDefault: true,
    };

    // Normalize items array
    const cleanItems = Array.isArray(orderPayload.items)
      ? orderPayload.items.map((item: any) => ({
        id: String(item.id || item.productId || `item_${Date.now()}`),
        productId: String(item.productId || item.id || ''),
        name: String(item.name || item.title || 'Product'),
        price: Number(item.price !== undefined ? item.price : item.finalPrice) || 0,
        quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
        image: item.image || '',
        selectedSize: item.selectedSize || '',
        selectedColor: item.selectedColor || '',
        isReturnGift: Boolean(item.isReturnGift),
      }))
      : [];

    const finalSubtotal = Number(orderPayload.subtotal) || cleanItems.reduce((acc: number, itm: any) => acc + itm.price * itm.quantity, 0);
    const finalTotal = Number(orderPayload.total || orderPayload.totalAmount) || finalSubtotal;

    const fullPayload = {
      userId: effectiveUserId,
      customer: customerObj,
      shippingAddress: shippingAddressObj,
      items: cleanItems,
      subtotal: finalSubtotal,
      shipping: Number(orderPayload.shipping || 0),
      tax: Number(orderPayload.tax || 0),
      discount: Number(orderPayload.discount || 0),
      total: finalTotal,
      totalAmount: finalTotal,
      paymentStatus: orderPayload.paymentStatus || 'paid',
      paymentMethod: orderPayload.paymentMethod || 'Prepaid / UPI',
      paymentId: orderPayload.paymentId || `pay_mobile_${Date.now()}`,
      notes: orderPayload.notes || '',
    };

    const localOrder = {
      id: fallbackOrderId,
      orderNumber: fallbackOrderNumber,
      userId: effectiveUserId,
      timestamp: new Date().toISOString(),
      customer: customerObj,
      shippingAddress: shippingAddressObj,
      items: cleanItems,
      subtotal: finalSubtotal,
      shipping: Number(orderPayload.shipping || 0),
      tax: Number(orderPayload.tax || 0),
      discount: Number(orderPayload.discount || 0),
      total: finalTotal,
      status: 'processing',
      paymentStatus: 'paid',
      paymentId: fullPayload.paymentId,
      paymentMethod: fullPayload.paymentMethod,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'user-id': effectiveUserId,
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    console.log('[GharSansar Orders] Posting order to live server:', `${BACKEND_URL}/api/v1/orders`);

    let res: Response | null = null;
    let data: any = null;

    // 1. First attempt: POST /api/v1/orders
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      res = await fetch(`${BACKEND_URL}/api/v1/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(fullPayload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      data = await res.json().catch(() => null);
    } catch (v1Err) {
      console.warn('[GharSansar Orders] /api/v1/orders error, trying /api/orders fallback:', v1Err);
    }

    // 2. Second attempt: Fallback to POST /api/orders
    if (!res || !res.ok || !(data?.success || data?.order)) {
      try {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 20000);

        const res2 = await fetch(`${BACKEND_URL}/api/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'user-id': effectiveUserId,
          },
          body: JSON.stringify(fullPayload),
          signal: controller2.signal,
        });
        clearTimeout(timeoutId2);
        const data2 = await res2.json().catch(() => null);

        if (res2.ok && (data2?.success || data2?.order)) {
          res = res2;
          data = data2;
        }
      } catch (fallbackErr) {
        console.warn('[GharSansar Orders] /api/orders fallback also error:', fallbackErr);
      }
    }

    // 3. Handle live server response
    if (res && res.ok && (data?.success || data?.order)) {
      const confirmedOrder = data.order || data;
      const confirmedId = confirmedOrder.id || confirmedOrder.orderNumber || fallbackOrderId;
      const newOrderObj = { ...localOrder, ...confirmedOrder, id: confirmedId };

      console.log('[GharSansar Orders] Successfully saved on live backend with ID:', confirmedId);

      setOrders(prev => [newOrderObj, ...prev.filter(o => o.id !== confirmedId)]);
      try {
        const stored = await AsyncStorage.getItem('user_orders');
        const current = stored ? JSON.parse(stored) : [];
        await AsyncStorage.setItem('user_orders', JSON.stringify([newOrderObj, ...current.filter((o: any) => o.id !== confirmedId)]));
      } catch { }

      // Refresh orders from server to ensure perfect sync
      fetchOrdersForUser();
      if (authToken) {
        fetchUserCart(authToken);
      }
      return { success: true, orderId: confirmedId };
    }

    // 4. Offline fallback if remote server was unreachable
    console.warn('[GharSansar Orders] Server unreachable or returned error, persisting locally.');
    setOrders(prev => [localOrder, ...prev]);
    try {
      const stored = await AsyncStorage.getItem('user_orders');
      const current = stored ? JSON.parse(stored) : [];
      await AsyncStorage.setItem('user_orders', JSON.stringify([localOrder, ...current]));
    } catch { }
    return { success: true, orderId: fallbackOrderId };
  };

  // Sync general products load with initial paginated feed
  useEffect(() => {
    if (products.length > 0 && paginatedProducts.length === 0) {
      refreshProductsFeed();
    }
  }, [products]);

  const addToCart = (product: Product, quantity?: number) => {
    if (!isAuthenticated || !user) {
      setSelectedProductId(null);
      setActiveTab('account');
      return;
    }

    const isReturnGift = Boolean(
      product.isReturnGift ||
      product.category === 'Return Gifts' ||
      product.category === 'return_gifts' ||
      String(product.id).startsWith('rg-')
    );
    const minQty = isReturnGift ? 50 : 1;
    const initialQty = quantity !== undefined 
      ? (isReturnGift ? Math.max(50, quantity) : Math.max(1, quantity))
      : minQty;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      let updated;
      if (existing) {
        const step = quantity !== undefined ? quantity : (isReturnGift ? 10 : 1);
        const newQty = existing.quantity + step;
        updated = prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      } else {
        updated = [...prevCart, { product, quantity: initialQty, selected: true }];
      }
      AsyncStorage.setItem('cart', JSON.stringify(updated)).catch(() => { });
      return updated;
    });

    if (authToken) {
      const existing = cart.find(i => i.product.id === product.id);
      const syncQty = existing 
        ? existing.quantity + (quantity !== undefined ? quantity : (isReturnGift ? 10 : 1))
        : initialQty;

      fetch(`${BACKEND_URL}/api/v1/cart/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          name: product.title || product.name,
          price: product.finalPrice !== undefined ? product.finalPrice : product.price,
          quantity: syncQty,
          image: product.image,
        }),
      }).catch(e => console.warn('Sync addToCart error:', e));
    }
  };

  const updateCartQuantity = (id: string, delta: number) => {
    if (!isAuthenticated || !user) {
      setSelectedProductId(null);
      setActiveTab('account');
      return;
    }

    let finalNextQty = 0;

    setCart((prevCart) => {
      const updated = prevCart
        .map((item) => {
          if (item.product.id === id) {
            const isReturnGift = Boolean(
              item.product.isReturnGift ||
              item.product.category === 'Return Gifts' ||
              item.product.category === 'return_gifts' ||
              String(item.product.id).startsWith('rg-')
            );
            const nextQty = item.quantity + delta;

            // Strict bulk rule: There is no concept of less than 50 products for Return Gifts
            if (isReturnGift) {
              if (nextQty < 50) {
                finalNextQty = 0;
                return { ...item, quantity: 0 };
              }
              finalNextQty = nextQty;
              return { ...item, quantity: nextQty };
            }

            finalNextQty = nextQty;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
      AsyncStorage.setItem('cart', JSON.stringify(updated)).catch(() => { });
      return updated;
    });

    if (authToken) {
      const currentItem = cart.find(i => i.product.id === id);
      if (currentItem) {
        const isReturnGift = Boolean(
          currentItem.product.isReturnGift ||
          currentItem.product.category === 'Return Gifts' ||
          currentItem.product.category === 'return_gifts' ||
          String(currentItem.product.id).startsWith('rg-')
        );
        const nextQty = currentItem.quantity + delta;
        if (nextQty > 0 && (!isReturnGift || nextQty >= 50)) {
          fetch(`${BACKEND_URL}/api/v1/cart/items/${id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ quantity: nextQty }),
          }).catch(e => console.warn('Sync updateCartQuantity error:', e));
        } else {
          fetch(`${BACKEND_URL}/api/v1/cart/items/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
          }).catch(e => console.warn('Sync delete cart item error:', e));
        }
      }
    }
  };

  const toggleCartSelection = (id: string) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const toggleAllCartSelections = (selected: boolean) => {
    setCart((prevCart) => prevCart.map((item) => ({ ...item, selected })));
  };

  return (
    <MobileAppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedProductId,
        setSelectedProductId,
        cart,
        addToCart,
        updateCartQuantity,
        toggleCartSelection,
        toggleAllCartSelections,
        favorites,
        toggleFavorite,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        products,

        // Return Gifts Collection & Bulk Ordering
        returnGifts,
        returnGiftsLoading,
        fetchReturnGifts,

        // Dynamic API properties
        banners,
        categories,
        flashSale,
        paginatedProducts,
        paginatedLoading,
        hasMoreProducts,
        loadMoreProducts,
        refreshProductsFeed,
        searchSuggestions,
        recentSearches,
        addRecentSearch,
        clearRecentSearches,
        trendingSearches,
        fetchAllProducts,
        fetchBanners,
        fetchCategories,
        fetchFlashSale,

        // Category Discounts & Pricing
        activeDiscounts,
        discountsLoading,
        fetchActiveDiscounts,
        getCategoryDiscount,

        // Loading states
        bannersLoading,
        categoriesLoading,
        flashSaleLoading,
        productsLoading,

        // Wishlist Database
        fetchWishlist,

        // Notifications
        notifications,
        notificationsLoading,
        fetchNotifications,
        markNotificationsRead,
        clearNotifications,

        // Recently Viewed
        recentlyViewed,
        addToRecentlyViewed,

        // Real-time Authentication & User Profile
        user,
        authToken,
        isAuthenticated,
        authLoading,
        login,
        loginWithGoogle,
        exchangeMobileCode,
        register,
        requestOtp,
        verifyOtp,
        logout,
        updateUserProfile,
        fetchUserCart,
        syncCartWithBackend,

        // Real Orders from Backend
        orders,
        ordersLoading,
        fetchOrders,
        placeOrder,

        // Delivery Address
        currentAddress,
        setCurrentAddress,
        saveShippingAddress,
        deleteShippingAddress,

        // Auth Modal Control
        authModalVisible,
        setAuthModalVisible,

        // Offline & Network
        isOffline,
        setIsOffline,
        checkNetworkConnectivity,
        refreshAllData
      }}
    >
      {children}
    </MobileAppContext.Provider>
  );
};
