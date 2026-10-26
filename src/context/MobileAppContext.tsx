import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  price: number;
  actPrice: number;
  image: string;
  category: string;
  subCategory: string;
  rating: number;
  reviewsCount: number;
  matchPercent: number;
  commentsCount: number;
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

type TabType = 'home' | 'explore' | 'cart' | 'wishlist' | 'account';

interface MobileAppContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  cart: CartItem[];
  addToCart: (product: Product) => void;
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
  register: (name: string, email: string, password: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
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
  const [authModalVisible, setAuthModalVisible] = useState<boolean>(false);

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

  // React Query Equivalent Cache Engine with Timeout Protection
  const cacheRegistry = React.useRef<{ [key: string]: { data: any; timestamp: number } }>({});
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL

  const fetchWithCache = async (url: string, forceRefresh = false, timeoutMs = 8000) => {
    const now = Date.now();
    if (!forceRefresh && cacheRegistry.current[url] && now - cacheRegistry.current[url].timestamp < CACHE_TTL) {
      return cacheRegistry.current[url].data;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      cacheRegistry.current[url] = { data, timestamp: now };
      return data;
    } catch (err: any) {
      clearTimeout(timer);
      throw err;
    }
  };

  // Map backend product data format to mobile client format
  const mapBackendProduct = (p: any): Product => ({
    id: p.id || p.prod_id,
    title: p.title || p.name,
    name: p.name || p.title,
    description: p.description || '',
    price: Number(p.price) || 0,
    actPrice: Number(p["act-price"]) || Number(p.actual_price) || Number(p.price) || 0,
    image: p.image ? normalizeImageUrl(p.image) : '',
    category: mapCategoryLabel(p.category || ''),
    subCategory: p.subCategory || '',
    rating: Number(p.rating) || 4.2,
    reviewsCount: Number(p.reviewsCount) || 12,
    matchPercent: Number(p.matchPercent) || 85,
    commentsCount: Number(p.commentsCount) || 2
  });

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
      AsyncStorage.setItem('@cached_banners', JSON.stringify(mappedBanners)).catch(() => {});
    } catch (err) {
      console.warn('Failed to fetch banners from API:', err);
      try {
        const cached = await AsyncStorage.getItem('@cached_banners');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) setBanners(parsed);
        }
      } catch (cErr) {}
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

          // Override thumbnail for Sonu Steel Products with Sonu Crysta Pot 14cm 1000 Ml
          if (
            catName === 'Sonu Steel Products' ||
            cat.name === 'sonu_steel_products' ||
            cat.name === 'Kitchen & Steel' ||
            catName === 'Kitchen & Steel'
          ) {
            catImage = normalizeImageUrl('/products/sonu_steel_products/sonu_crysta_pot_14cm_1000_ml.webp');
          }

          // Override thumbnail for Cello with Cello 12 Pcs Soup Set
          if (
            catName === 'Cello' ||
            cat.name === 'Cello' ||
            cat.name?.toLowerCase() === 'cello' ||
            catName.toLowerCase() === 'cello'
          ) {
            catImage = normalizeImageUrl('/products/cello_prod/cello_12_pcs_soup_set.webp');
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
        AsyncStorage.setItem('@cached_categories', JSON.stringify(mapped)).catch(() => {});
      }
    } catch (err) {
      console.warn('Failed to fetch categories from API:', err);
      try {
        const cached = await AsyncStorage.getItem('@cached_categories');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) setCategories(parsed);
        }
      } catch (cErr) {}
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
        AsyncStorage.setItem('@cached_flashsale', JSON.stringify(mappedFlashSale)).catch(() => {});
      }
    } catch (err) {
      console.warn('Failed to fetch flashsale from API:', err);
      try {
        const cached = await AsyncStorage.getItem('@cached_flashsale');
        if (cached) setFlashSale(JSON.parse(cached));
      } catch (cErr) {}
    } finally {
      setFlashSaleLoading(false);
    }
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
          AsyncStorage.setItem('@cached_products', JSON.stringify(flatList)).catch(() => {});
          return;
        }
      }

      // Tier 2 Fallback: Fetch directly from /api/products/paginated
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
            AsyncStorage.setItem('@cached_products', JSON.stringify(mapped)).catch(() => {});
            return;
          }
        }
      } catch (pageErr) {
        clearTimeout(timer);
      }
    } catch (err) {
      console.warn('Failed to fetch product list from backend API:', err);
      // Tier 3 Fallback: Load previously cached catalog from storage
      try {
        const cached = await AsyncStorage.getItem('@cached_products');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProducts(parsed);
            return;
          }
        }
      } catch (cacheErr) {}
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

  const refreshProductsFeed = async () => {
    setPage(1);
    setHasMoreProducts(true);
    setPaginatedProducts([]);
    setPaginatedLoading(true);
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
          // Invalidate cache
          if (cacheRegistry.current[`${BACKEND_URL}/api/mobile/notifications`]) {
            delete cacheRegistry.current[`${BACKEND_URL}/api/mobile/notifications`];
          }
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
          if (cacheRegistry.current[`${BACKEND_URL}/api/mobile/notifications`]) {
            delete cacheRegistry.current[`${BACKEND_URL}/api/mobile/notifications`];
          }
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
                    (flashSale && flashSale.products.find(p => p.id === selectedProductId));
      if (found) {
        addToRecentlyViewed(found);
      }
    }
  }, [selectedProductId, products, paginatedProducts, flashSale]);

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
          } catch (e) {}
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
          setUser(activeUser);
          setIsAuthenticated(true);
          fetchOrdersForUser(activeUser, storedToken);
          fetchWishlist(storedToken);
          fetchUserCart(storedToken);
        }

        const storedAddr = await AsyncStorage.getItem('user_shipping_address');
        if (storedAddr) {
          setCurrentAddress(JSON.parse(storedAddr));
        }
      } catch (err) {
        console.warn('Failed restoring user session:', err);
      } finally {
        setAuthLoading(false);
      }
    };

    const initializeData = async () => {
      await Promise.all([
        fetchAllProducts(),
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
            product: {
              id: String(bi.productId || bi.id || ''),
              title: bi.name || bi.title || '',
              name: bi.name || bi.title || '',
              description: bi.description || '',
              price: Number(bi.price) || 0,
              actPrice: Number(bi.actPrice || bi.price) || 0,
              image: bi.image ? normalizeImageUrl(bi.image) : '',
              category: mapCategoryLabel(bi.category || ''),
              subCategory: bi.subCategory || '',
              rating: 4.5,
              reviewsCount: 12,
              matchPercent: 90,
              commentsCount: 0,
            },
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
              price: i.product.price,
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
        setAuthToken(activeToken);
        setUser(data.user);
        setIsAuthenticated(true);
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, activeToken);
        await AsyncStorage.setItem('token', activeToken);
        await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(data.user));

        if (data.user.addresses && data.user.addresses.length > 0) {
          const def = data.user.addresses.find((a: any) => a.isDefault) || data.user.addresses[0];
          setCurrentAddress(def);
          await AsyncStorage.setItem('user_shipping_address', JSON.stringify(def));
        }

        syncOnLogin(data.user, activeToken);
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
        setAuthToken(activeToken);
        setUser(data.user);
        setIsAuthenticated(true);
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, activeToken);
        await AsyncStorage.setItem('token', activeToken);
        await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(data.user));
        if (data.user.addresses && data.user.addresses.length > 0) {
          const def = data.user.addresses.find((a: any) => a.isDefault) || data.user.addresses[0];
          setCurrentAddress(def);
          await AsyncStorage.setItem('user_shipping_address', JSON.stringify(def));
        }
        syncOnLogin(data.user, activeToken);
        return { success: true };
      }
      return { success: false, error: data.error || 'Invalid credentials' };
    } catch (err: any) {
      console.warn('Login request error:', err);
      return { success: false, error: 'Network error connecting to backend' };
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, phone: phone?.trim() || '' })
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        const activeToken = data.token || `user_token_${data.user.id || data.user._id}`;
        setAuthToken(activeToken);
        setUser(data.user);
        setIsAuthenticated(true);
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, activeToken);
        await AsyncStorage.setItem('token', activeToken);
        await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(data.user));
        syncOnLogin(data.user, activeToken);
        return { success: true };
      }
      return { success: false, error: data.error || 'Registration failed' };
    } catch (err: any) {
      console.warn('Registration request error:', err);
      return { success: false, error: 'Network error connecting to backend' };
    }
  };

  const logout = async () => {
    setUser(null);
    setAuthToken(null);
    setIsAuthenticated(false);
    setOrders([]);
    setAuthModalVisible(false);
    await AsyncStorage.removeItem(USER_PROFILE_KEY);
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem('token');
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
    setCurrentAddress(addr);
    await AsyncStorage.setItem('user_shipping_address', JSON.stringify(addr));
    if (user) {
      const existingAddrs: any[] = user.addresses || [];
      const updatedAddrs = [
        addr,
        ...existingAddrs.filter((a: any) => (a.id && addr.id ? a.id !== addr.id : a.address !== addr.address))
      ];
      await updateUserProfile({ addresses: updatedAddrs });
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
    try {
      const headers: any = {
        'Content-Type': 'application/json',
        'user-id': user?.id || user?.email || 'guest'
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      const endpoint = authToken ? `${BACKEND_URL}/api/v1/orders` : `${BACKEND_URL}/api/orders`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();
      if (res.ok && (data.success || data.order)) {
        fetchOrdersForUser();
        if (authToken) {
          fetchUserCart(authToken);
        }
        return { success: true, orderId: data.order?.id || data.order?.orderNumber || 'GS-ORD' };
      }
      return { success: false, error: data.error || 'Failed to place order' };
    } catch (err) {
      console.warn('Place order error:', err);
      return { success: false, error: 'Network error submitting order' };
    }
  };

  // Sync general products load with initial paginated feed
  useEffect(() => {
    if (products.length > 0 && paginatedProducts.length === 0) {
      refreshProductsFeed();
    }
  }, [products]);

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      let updated;
      if (existing) {
        updated = prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        updated = [...prevCart, { product, quantity: 1, selected: true }];
      }
      AsyncStorage.setItem('cart', JSON.stringify(updated)).catch(() => {});
      return updated;
    });

    if (authToken) {
      fetch(`${BACKEND_URL}/api/v1/cart/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          name: product.title || product.name,
          price: product.price,
          quantity: 1,
          image: product.image,
        }),
      }).catch(e => console.warn('Sync addToCart error:', e));
    }
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart((prevCart) => {
      const updated = prevCart
        .map((item) => {
          if (item.product.id === id) {
            const nextQty = item.quantity + delta;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
      AsyncStorage.setItem('cart', JSON.stringify(updated)).catch(() => {});
      return updated;
    });

    if (authToken) {
      const currentItem = cart.find(i => i.product.id === id);
      if (currentItem) {
        const nextQty = currentItem.quantity + delta;
        if (nextQty > 0) {
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
        setAuthModalVisible
      }}
    >
      {children}
    </MobileAppContext.Provider>
  );
};
