import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_TOKEN_KEY, USER_PROFILE_KEY } from '../config/api';

export const API_BASE_URL = "https://backend.gharsansar.website/api";
export const FALLBACK_API_BASE_URL = "https://gharsansar.website/api";

// In-memory token cache to prevent asynchronous delay on rapid API calls
let inMemoryAuthToken: string | null = null;
let inMemoryUserId: string | null = null;

export const setApiAuthToken = (token: string | null) => {
  inMemoryAuthToken = token;
};

export const setApiUserId = (userId: string | null) => {
  inMemoryUserId = userId;
};

// Registered callbacks for session lifecycle
type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export const registerUnauthorizedHandler = (handler: UnauthorizedHandler) => {
  unauthorizedHandler = handler;
};

/**
 * Production Axios instance configured for Ghar Sansar
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor:
 * - Automatically attaches stored JWT token
 * - Attaches User-Id identifier when available
 * - Ensures Content-Type is application/json
 * - Sanitizes logs to never expose JWT tokens
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // 1. Resolve Auth Token (memory first, fallback to AsyncStorage)
      let token = inMemoryAuthToken;
      if (!token) {
        token = (await AsyncStorage.getItem(AUTH_TOKEN_KEY)) || (await AsyncStorage.getItem('token'));
        if (token) inMemoryAuthToken = token;
      }

      // 2. Resolve User Identifier (memory first, fallback to AsyncStorage)
      let userId = inMemoryUserId;
      if (!userId) {
        const storedProfile = await AsyncStorage.getItem(USER_PROFILE_KEY);
        if (storedProfile) {
          try {
            const user = JSON.parse(storedProfile);
            userId = user?.id || user?._id || user?.email || null;
            if (userId) inMemoryUserId = userId;
          } catch {}
        }
      }

      // 3. Attach Authenticated Headers
      config.headers = config.headers || {};
      config.headers['Content-Type'] = 'application/json';

      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      if (userId) {
        config.headers['User-Id'] = userId;
      }

      // Safe debug logging (sanitized: never log JWT tokens)
      const sanitizedAuth = token ? 'Bearer [PROTECTED]' : 'None';
      console.log(`[GharSansar API] -> ${config.method?.toUpperCase()} ${config.url} (Auth: ${sanitizedAuth}, User-Id: ${userId || 'guest'})`);

    } catch (interceptorErr) {
      console.warn('[GharSansar API] Request interceptor warning:', interceptorErr);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor:
 * - Handles expired tokens and HTTP 401 responses
 * - Retries safe GET requests on fallback server when primary is unreachable
 * - STRICT RULE: Never silently switch to fallback for mutating requests (POST/PUT/DELETE)
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 1. Handle HTTP 401 Unauthorized (Expired / Invalid Token)
    if (error.response && error.response.status === 401) {
      console.warn('[GharSansar API] HTTP 401 Unauthorized encountered. Invalidating expired session.');
      inMemoryAuthToken = null;
      if (unauthorizedHandler) {
        unauthorizedHandler();
      }
      return Promise.reject(error);
    }

    // 2. Safe Fallback handling for idempotent GET requests only
    const isGetRequest = originalRequest?.method?.toLowerCase() === 'get';
    const isNetworkErrorOrServerDown = !error.response || (error.response.status >= 500 && error.response.status < 600);

    if (isGetRequest && isNetworkErrorOrServerDown && originalRequest && !originalRequest._retriedOnFallback) {
      originalRequest._retriedOnFallback = true;
      console.warn(`[GharSansar API] Primary GET ${originalRequest.url} failed. Retrying on fallback: ${FALLBACK_API_BASE_URL}`);
      originalRequest.baseURL = FALLBACK_API_BASE_URL;
      return apiClient(originalRequest);
    }

    // Mutating requests (POST, PUT, DELETE) reject directly to prevent duplicate executions
    return Promise.reject(error);
  }
);

// ----------------------------------------------------------------------
// DATA TYPES FOR BACKEND INTEGRATION
// ----------------------------------------------------------------------

export interface CustomerPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  notes?: string;
}

export interface OrderItemPayload {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  selectedSize?: string;
  selectedColor?: string;
}

export interface BackendOrderPayload {
  customer: CustomerPayload;
  items: OrderItemPayload[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod: 'razorpay' | 'cod' | 'upi' | 'whatsapp';
  paymentId?: string;
  notes?: string;
}

export interface BackendOrderResponse {
  success: boolean;
  message?: string;
  order?: {
    id: string;
    orderNumber: string;
    userId?: string;
    customer?: CustomerPayload;
    items?: any[];
    total?: number;
    subtotal?: number;
    shipping?: number;
    status?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    paymentId?: string;
    _id?: string;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: any;
  };
  error?: string;
}

export interface SavedAddressPayload {
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone: string;
  address: string;
  street_address?: string;
  city: string;
  state: string;
  zipCode?: string;
  pincode?: string;
  country?: string;
  isDefault?: boolean;
}

export interface ProfileSyncPayload {
  email: string;
  street_address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  addresses?: SavedAddressPayload[];
  name?: string;
  full_name?: string;
}

// ----------------------------------------------------------------------
// ORDER API SERVICES
// ----------------------------------------------------------------------

// Mutex lock to strictly prevent duplicate order submissions
let isOrderPlacementActive = false;
let lastPlacedOrderHash = '';
let lastPlacedOrderTime = 0;

/**
 * Places an order onto the live Ghar Sansar MongoDB Atlas backend.
 * Primary endpoint: POST /v1/orders
 * Returns official order object with orderNumber and id.
 */
export async function createBackendOrder(payload: BackendOrderPayload): Promise<BackendOrderResponse> {
  // 1. Prevent duplicate submissions from rapid multi-taps
  if (isOrderPlacementActive) {
    throw new Error('An order is already being processed. Please wait.');
  }

  // 2. Debounce duplicate orders (same items and total placed within 15 seconds)
  const orderFingerprint = `${payload.customer.phone}_${payload.total}_${payload.items.map(i => `${i.productId}:${i.quantity}`).join(',')}`;
  const now = Date.now();
  if (orderFingerprint === lastPlacedOrderHash && now - lastPlacedOrderTime < 15000) {
    throw new Error('Duplicate order detected. Your previous order was already submitted.');
  }

  isOrderPlacementActive = true;

  try {
    const idempotencyKey = `mob_ord_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const response = await apiClient.post<BackendOrderResponse>('/v1/orders', payload, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });

    if (response.data && (response.data.success || response.data.order)) {
      lastPlacedOrderHash = orderFingerprint;
      lastPlacedOrderTime = now;
      return response.data;
    }

    throw new Error(response.data?.error || response.data?.message || 'Failed to place order on backend');
  } catch (err: any) {
    console.warn('[GharSansar API] Order placement failed:', err.response?.data || err.message);
    throw err;
  } finally {
    isOrderPlacementActive = false;
  }
}

/**
 * Fetches authenticated customer orders from live backend.
 * Primary endpoint: GET /v1/orders
 */
export async function fetchCustomerBackendOrders(): Promise<any[]> {
  try {
    const response = await apiClient.get('/v1/orders');
    const data = response.data;

    if (Array.isArray(data)) {
      return data;
    }
    if (data?.success && Array.isArray(data.orders)) {
      return data.orders;
    }
    if (Array.isArray(data?.data)) {
      return data.data;
    }
    return [];
  } catch (err: any) {
    // If 401 or offline, caller can fallback to local cache
    console.warn('[GharSansar API] fetchCustomerBackendOrders error:', err.response?.status || err.message);
    throw err;
  }
}

// ----------------------------------------------------------------------
// ADDRESS & PROFILE SYNCHRONIZATION SERVICES
// ----------------------------------------------------------------------

/**
 * Synchronizes customer shipping addresses and profile with backend.
 * Primary endpoint: PUT /v1/auth/profile
 */
export async function syncCustomerProfile(profile: ProfileSyncPayload): Promise<any> {
  try {
    const response = await apiClient.put('/v1/auth/profile', profile);
    return response.data;
  } catch (err: any) {
    // Fallback to /api/auth/profile if v1 router routes differently
    if (err.response?.status === 404 || err.response?.status === 400) {
      try {
        const fallbackRes = await apiClient.put('/auth/profile', profile);
        return fallbackRes.data;
      } catch (fbErr) {
        console.warn('[GharSansar API] Profile fallback sync error:', fbErr);
      }
    }
    throw err;
  }
}

/**
 * Clears the remote user cart on backend after order confirmation.
 * Primary endpoint: DELETE /v1/cart
 */
export async function clearBackendCart(): Promise<void> {
  try {
    await apiClient.delete('/v1/cart');
  } catch (err: any) {
    // Non-fatal: if endpoint differs, log warning without breaking checkout flow
    console.warn('[GharSansar API] Clear remote cart warning:', err.response?.status || err.message);
  }
}
