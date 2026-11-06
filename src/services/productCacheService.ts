import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../context/MobileAppContext';

// Storage keys for persistent product catalog cache
export const CACHE_KEYS = {
  PRODUCTS: '@ghar_sansar_products_cache_v2',
  PRODUCTS_ETAG: '@ghar_sansar_products_etag_v2',
  PRODUCTS_LAST_SYNC: '@ghar_sansar_products_last_sync_v2',
  RETURN_GIFTS: '@ghar_sansar_return_gifts_cache_v2',
  CATEGORIES: '@ghar_sansar_categories_cache_v2',
  ACTIVE_DISCOUNTS: '@ghar_sansar_active_discounts_cache_v2',
  BANNERS: '@ghar_sansar_banners_cache_v2',
};

// Sensible fallback sync TTL (12 hours)
// Change-based synchronization via ETag ensures immediate updates if admin modifies products
export const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

export interface CachedCatalog {
  products: Product[];
  etag: string | null;
  lastSync: number;
}

/**
 * Loads products directly from persistent local storage.
 * Returns null if cache is empty or corrupted.
 */
export async function loadProductsFromCache(): Promise<CachedCatalog | null> {
  try {
    const [[, productsJson], [, etag], [, lastSyncStr]] = await AsyncStorage.multiGet([
      CACHE_KEYS.PRODUCTS,
      CACHE_KEYS.PRODUCTS_ETAG,
      CACHE_KEYS.PRODUCTS_LAST_SYNC,
    ]);

    if (!productsJson) {
      return null;
    }

    const products: Product[] = JSON.parse(productsJson);
    if (!Array.isArray(products) || products.length === 0) {
      return null;
    }

    const lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : 0;
    return {
      products,
      etag: etag || null,
      lastSync: isNaN(lastSync) ? 0 : lastSync,
    };
  } catch (error) {
    console.warn('[ProductCacheService] Failed to load products from cache:', error);
    return null;
  }
}

/**
 * Saves entire product catalogue to persistent local storage along with ETag & sync timestamp.
 */
export async function saveProductsToCache(products: Product[], etag?: string | null): Promise<void> {
  try {
    if (!Array.isArray(products) || products.length === 0) return;

    const entries: [string, string][] = [
      [CACHE_KEYS.PRODUCTS, JSON.stringify(products)],
      [CACHE_KEYS.PRODUCTS_LAST_SYNC, Date.now().toString()],
    ];

    if (etag) {
      entries.push([CACHE_KEYS.PRODUCTS_ETAG, etag]);
    }

    await AsyncStorage.multiSet(entries);
  } catch (error) {
    console.warn('[ProductCacheService] Failed to save products to cache:', error);
  }
}

/**
 * Updates a single product in persistent storage (e.g., when admin edits price, title, image, or stock).
 * Avoids redownloading the entire catalog.
 */
export async function updateProductInCache(productId: string, updates: Partial<Product>): Promise<Product[] | null> {
  try {
    const cached = await loadProductsFromCache();
    if (!cached || !cached.products) return null;

    let updated = false;
    const nextProducts = cached.products.map(p => {
      if (p.id === productId || (p as any).prod_id === productId) {
        updated = true;
        return { ...p, ...updates };
      }
      return p;
    });

    if (updated) {
      await AsyncStorage.setItem(CACHE_KEYS.PRODUCTS, JSON.stringify(nextProducts));
      return nextProducts;
    }
    return null;
  } catch (error) {
    console.warn('[ProductCacheService] Failed to update product in cache:', error);
    return null;
  }
}

/**
 * Inserts a new product into persistent cache (e.g., when admin creates a new item).
 */
export async function addProductToCache(product: Product): Promise<Product[] | null> {
  try {
    const cached = await loadProductsFromCache();
    const existing = cached?.products || [];
    
    // Check if product already exists
    const exists = existing.some(p => p.id === product.id || (p as any).prod_id === product.id);
    const nextProducts = exists
      ? existing.map(p => (p.id === product.id ? { ...p, ...product } : p))
      : [product, ...existing];

    await AsyncStorage.setItem(CACHE_KEYS.PRODUCTS, JSON.stringify(nextProducts));
    return nextProducts;
  } catch (error) {
    console.warn('[ProductCacheService] Failed to add product to cache:', error);
    return null;
  }
}

/**
 * Removes a product from persistent storage (e.g., when admin deletes an item).
 */
export async function removeProductFromCache(productId: string): Promise<Product[] | null> {
  try {
    const cached = await loadProductsFromCache();
    if (!cached || !cached.products) return null;

    const nextProducts = cached.products.filter(p => p.id !== productId && (p as any).prod_id !== productId);
    await AsyncStorage.setItem(CACHE_KEYS.PRODUCTS, JSON.stringify(nextProducts));
    return nextProducts;
  } catch (error) {
    console.warn('[ProductCacheService] Failed to remove product from cache:', error);
    return null;
  }
}

/**
 * Loads return gifts from cache.
 */
export async function loadReturnGiftsFromCache(): Promise<Product[] | null> {
  try {
    const json = await AsyncStorage.getItem(CACHE_KEYS.RETURN_GIFTS);
    if (!json) return null;
    const list = JSON.parse(json);
    return Array.isArray(list) && list.length > 0 ? list : null;
  } catch {
    return null;
  }
}

/**
 * Saves return gifts to cache.
 */
export async function saveReturnGiftsToCache(gifts: Product[]): Promise<void> {
  try {
    if (Array.isArray(gifts) && gifts.length > 0) {
      await AsyncStorage.setItem(CACHE_KEYS.RETURN_GIFTS, JSON.stringify(gifts));
    }
  } catch (err) {
    console.warn('[ProductCacheService] Failed to cache return gifts:', err);
  }
}

/**
 * Loads categories from cache.
 */
export async function loadCategoriesFromCache(): Promise<any[] | null> {
  try {
    const json = await AsyncStorage.getItem(CACHE_KEYS.CATEGORIES);
    if (!json) return null;
    const list = JSON.parse(json);
    return Array.isArray(list) && list.length > 0 ? list : null;
  } catch {
    return null;
  }
}

/**
 * Saves categories to cache.
 */
export async function saveCategoriesToCache(categories: any[]): Promise<void> {
  try {
    if (Array.isArray(categories) && categories.length > 0) {
      await AsyncStorage.setItem(CACHE_KEYS.CATEGORIES, JSON.stringify(categories));
    }
  } catch (err) {
    console.warn('[ProductCacheService] Failed to cache categories:', err);
  }
}

/**
 * Loads banners from cache.
 */
export async function loadBannersFromCache(): Promise<any[] | null> {
  try {
    const json = await AsyncStorage.getItem(CACHE_KEYS.BANNERS);
    if (!json) return null;
    const list = JSON.parse(json);
    return Array.isArray(list) && list.length > 0 ? list : null;
  } catch {
    return null;
  }
}

/**
 * Saves banners to cache.
 */
export async function saveBannersToCache(banners: any[]): Promise<void> {
  try {
    if (Array.isArray(banners) && banners.length > 0) {
      await AsyncStorage.setItem(CACHE_KEYS.BANNERS, JSON.stringify(banners));
    }
  } catch (err) {
    console.warn('[ProductCacheService] Failed to cache banners:', err);
  }
}

/**
 * Checks whether the cache has expired based on TTL.
 */
export function isCacheExpired(lastSyncTime: number, ttlMs: number = CACHE_TTL_MS): boolean {
  if (!lastSyncTime || lastSyncTime <= 0) return true;
  return Date.now() - lastSyncTime > ttlMs;
}

/**
 * Clears the persistent product cache.
 */
export async function clearProductCache(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      CACHE_KEYS.PRODUCTS,
      CACHE_KEYS.PRODUCTS_ETAG,
      CACHE_KEYS.PRODUCTS_LAST_SYNC,
      CACHE_KEYS.RETURN_GIFTS,
      CACHE_KEYS.CATEGORIES,
      CACHE_KEYS.ACTIVE_DISCOUNTS,
      CACHE_KEYS.BANNERS,
    ]);
  } catch (error) {
    console.warn('[ProductCacheService] Failed to clear product cache:', error);
  }
}
