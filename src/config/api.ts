import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

export const LIVE_BACKEND_URL = 'https://backend.gharsansar.website';

const resolveBackendUrl = (): string => {
  const envUrl = (process.env.EXPO_PUBLIC_BACKEND_URL || LIVE_BACKEND_URL).trim().replace(/\/+$/, '');

  // Only allow valid public HTTPS domain or explicit live backend
  if (envUrl.startsWith('https://backend.gharsansar.website') || envUrl.startsWith('https://gharsansar.website')) {
    return envUrl;
  }

  // Always force live server, rejecting all private LAN IPs (10.*, 192.168.*, 172.*, localhost, 127.0.0.1)
  return LIVE_BACKEND_URL;
};

export const BACKEND_URL = resolveBackendUrl();
console.log('[GharSansar API] Configured BACKEND_URL:', BACKEND_URL);

export const normalizeImageUrl = (url: string): string => {
  if (!url) return '';
  let cleaned = url;
  if (cleaned.startsWith('/')) {
    cleaned = `${BACKEND_URL}${cleaned}`;
  } else {
    cleaned = cleaned
      .replace(/^https?:\/\/(backend\.)?gharsansar\.website/, BACKEND_URL)
      .replace(/^http:\/\/(192\.168\.\d+\.\d+|localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+):\d+/, BACKEND_URL);
  }

  let decoded = cleaned;
  try {
    decoded = decodeURIComponent(cleaned);
  } catch {}

  decoded = decoded.replace(/aquarium\s+and\s+accesories/gi, 'aquarium and accesories');
  return encodeURI(decoded);
};

export const AUTH_TOKEN_KEY = '@auth_token';
export const USER_PROFILE_KEY = '@user_profile';

export const API_ENDPOINTS = {
  // Authentication & OTP (v1)
  SEND_OTP: `${BACKEND_URL}/api/v1/auth/send-otp`,
  VERIFY_OTP: `${BACKEND_URL}/api/v1/auth/verify-otp`,
  AUTH_ME: `${BACKEND_URL}/api/v1/auth/me`,
  LOGIN: `${BACKEND_URL}/api/auth/login`,
  REGISTER: `${BACKEND_URL}/api/auth/register`,
  PROFILE: `${BACKEND_URL}/api/auth/profile`,
  AUTH_CHECK: `${BACKEND_URL}/api/auth/check`,
  MOBILE_CODE: `${BACKEND_URL}/api/v1/auth/mobile-code`,
  MOBILE_CODE_EXCHANGE: `${BACKEND_URL}/api/v1/auth/mobile-code/exchange`,

  // Cart (v1)
  CART: `${BACKEND_URL}/api/v1/cart`,
  CART_ITEMS: `${BACKEND_URL}/api/v1/cart/items`,
  CART_MERGE: `${BACKEND_URL}/api/v1/cart/merge`,

  // Wishlist (v1)
  WISHLIST: `${BACKEND_URL}/api/v1/wishlist`,
  WISHLIST_TOGGLE: `${BACKEND_URL}/api/v1/wishlist/toggle`,
  WISHLIST_SYNC: `${BACKEND_URL}/api/v1/wishlist/sync`,
  LEGACY_WISHLIST: `${BACKEND_URL}/api/mobile/wishlist`,

  // Orders (v1)
  ORDERS: `${BACKEND_URL}/api/v1/orders`,
  ORDERS_LEGACY: `${BACKEND_URL}/api/orders`,

  // Discounts & Pricing Architecture (Two-price: Strike Price & Actual Price)
  DISCOUNTS: `${BACKEND_URL}/api/v1/discounts`,
  ACTIVE_DISCOUNTS: `${BACKEND_URL}/api/v1/discounts/active`,
  DISCOUNT_STATS: `${BACKEND_URL}/api/v1/discounts/stats`,

  // Products & Catalog
  PRODUCTS: `${BACKEND_URL}/api/products`,
  PRODUCTS_PAGINATED: `${BACKEND_URL}/api/products/paginated`,
  PRODUCTS_CATEGORIES: `${BACKEND_URL}/api/products/categories`,
  PRODUCTS_SEARCH: `${BACKEND_URL}/api/products/search`,
  RETURN_GIFTS: `${BACKEND_URL}/api/return_gifts`,

  // CMS & Marketing
  BANNERS: `${BACKEND_URL}/api/banners`,
  FLASHSALE: `${BACKEND_URL}/api/flashsale`,
  CMS_HOMEPAGE_LAYOUT: `${BACKEND_URL}/api/cms/homepage_layout`,
  CMS_CATEGORIES: `${BACKEND_URL}/api/cms/categories`,
  CMS_COLLECTIONS: `${BACKEND_URL}/api/cms/collections`,

  // Shipping & Tracking
  SHIPPING_SERVICEABILITY: `${BACKEND_URL}/api/shipping/serviceability`,
  SHIPPING_TRACK: (awb: string) => `${BACKEND_URL}/api/shipping/track/${awb}`,

  // Customer Reviews
  REVIEWS: (productId: string) => `${BACKEND_URL}/api/reviews/${productId}`,

  // Mobile Features & Push Notifications
  MOBILE_NOTIFICATIONS: `${BACKEND_URL}/api/mobile/notifications`,
  MOBILE_NOTIFICATIONS_READ: `${BACKEND_URL}/api/mobile/notifications/read`,
  MOBILE_NOTIFICATIONS_CLEAR: `${BACKEND_URL}/api/mobile/notifications/clear`,
  MOBILE_PUSH_TOKEN: `${BACKEND_URL}/api/mobile/push-token`,

  // System Health
  HEALTH: `${BACKEND_URL}/api/health`,
};
