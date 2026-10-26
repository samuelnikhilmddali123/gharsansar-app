import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

const resolveBackendUrl = (): string => {
  const envUrl = (process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5001').replace(/\/+$/, '');

  // 1. On Web: Connect directly to localhost:5001
  if (Platform.OS === 'web') {
    return envUrl;
  }

  // 2. If an explicit remote or LAN IP/domain is set (e.g. ngrok, cloudflare, or 10.x/192.168.x)
  if (!envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // 3. On Native Device / Expo Go / Emulators:
  // "localhost" on a mobile device refers to the phone itself.
  // We resolve the computer's actual reachable IP.

  // Priority A: Extract the Metro bundler host from NativeModules.SourceCode.scriptURL
  // In React Native / Expo Go, this is 100% accurate because the phone downloaded the JS bundle from this exact host!
  const scriptUrl = NativeModules.SourceCode?.scriptURL;
  if (scriptUrl) {
    const match = scriptUrl.match(/^https?:\/\/([^/:]+)/);
    if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
      return envUrl.replace(/localhost|127\.0\.0\.1/, match[1]);
    }
  }

  // Priority B: Expo hostUri from config or manifest
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return envUrl.replace(/localhost|127\.0\.0\.1/, hostIp);
    }
  }

  // Priority C: Expo linkingUri or experienceUrl
  const linking = Constants.linkingUri || (Constants as any).experienceUrl;
  if (linking) {
    const match = linking.match(/^(?:exp|https?):\/\/([^/:]+)/);
    if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
      return envUrl.replace(/localhost|127\.0\.0\.1/, match[1]);
    }
  }

  // Priority D: Android Emulator loopback ONLY when verified not to be a physical device
  if (Platform.OS === 'android' && !Device.isDevice) {
    return envUrl.replace(/localhost|127\.0\.0\.1/, '10.0.2.2');
  }

  // Priority E: Fallback to current host machine LAN Wi-Fi IP
  return envUrl.replace(/localhost|127\.0\.0\.1/, '10.44.114.185');
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
      .replace(/^https?:\/\/backend\.gharsansar\.website/, BACKEND_URL)
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

  // Cart (v1)
  CART: `${BACKEND_URL}/api/v1/cart`,
  CART_ITEMS: `${BACKEND_URL}/api/v1/cart/items`,
  CART_MERGE: `${BACKEND_URL}/api/v1/cart/merge`,

  // Wishlist (v1)
  WISHLIST: `${BACKEND_URL}/api/v1/wishlist`,
  WISHLIST_TOGGLE: `${BACKEND_URL}/api/v1/wishlist/toggle`,
  WISHLIST_SYNC: `${BACKEND_URL}/api/v1/wishlist/sync`,

  // Orders (v1)
  ORDERS: `${BACKEND_URL}/api/v1/orders`,
};
