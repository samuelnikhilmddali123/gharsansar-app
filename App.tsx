import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { useAssets } from 'expo-asset';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MobileAppProvider, useMobileApp } from './src/context/MobileAppContext';
import { BottomNavigation } from './src/components/BottomNavigation';
import { colors, typography } from './src/theme/tokens';

import HomeView from './src/pages/HomeView';
import ExploreView from './src/pages/ExploreView';
import CartView from './src/pages/CartView';
import FavoritesView from './src/pages/FavoritesView';
import ReturnGiftsView from './src/pages/ReturnGiftsView';
import ProfileView from './src/pages/ProfileView';
import ProductDetailView from './src/pages/ProductDetailView';
import { NoInternetView } from './src/components/NoInternetView';
import { OfflineBanner } from './src/components/OfflineBanner';

// ----------------------------------------------------------------------
// LUXURY STARTUP SPLASH SCREEN (Animated House Outline GIF on Black)
// ----------------------------------------------------------------------
const LuxurySplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [assets] = useAssets([require('./assets/output-onlinegiftools.gif')]);
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // GIF plays for ~1.62 seconds. Keep on screen for ~2.0s so animation finishes completely before fading into app
    const exitTimer = setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 2000);

    return () => clearTimeout(exitTimer);
  }, []);

  const gifUri = assets?.[0]?.localUri || assets?.[0]?.uri;
  const gifSource = gifUri ? { uri: gifUri } : require('./assets/output-onlinegiftools.gif');

  return (
    <Animated.View style={[styles.splashContainer, { opacity: containerOpacity }]}>
      <StatusBar style="light" />
      <View style={styles.splashGifWrapper}>
        <Image
          source={gifSource}
          style={styles.splashGif}
          contentFit="contain"
          autoplay={true}
        />
      </View>
    </Animated.View>
  );
};

// ----------------------------------------------------------------------
// MAIN NAVIGATION & SCREEN ROUTER
// ----------------------------------------------------------------------
const AppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedProductId,
    isOffline,
    refreshAllData,
    products,
    productsLoading,
  } = useMobileApp();
  const [isSplashing, setIsSplashing] = useState(true);

  // If offline and no products are loaded: display full-screen luxury NoInternetView
  if (isOffline && products.length === 0 && !productsLoading && !isSplashing) {
    return <NoInternetView onRetry={refreshAllData} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style={isSplashing ? "light" : "dark"} />

      {/* Floating Offline Banner when disconnected while browsing */}
      {isOffline && !isSplashing && (
        <OfflineBanner onRetry={refreshAllData} />
      )}
      
      {/* Active Screen View */}
      <View style={styles.screenWrapper}>
        {selectedProductId ? (
          <ProductDetailView />
        ) : activeTab === 'home' ? (
          <HomeView />
        ) : activeTab === 'explore' ? (
          <ExploreView />
        ) : activeTab === 'cart' ? (
          <CartView />
        ) : activeTab === 'returnGifts' ? (
          <ReturnGiftsView />
        ) : activeTab === 'wishlist' ? (
          <FavoritesView />
        ) : (
          <ProfileView />
        )}
      </View>

      {/* Fixed, Solid White, Safe-Area Bottom Navigation (Cart removed as requested) */}
      {!selectedProductId && !isSplashing && (
        <BottomNavigation
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />
      )}

      {/* Startup Screen */}
      {isSplashing && (
        <LuxurySplashScreen onFinish={() => setIsSplashing(false)} />
      )}
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <MobileAppProvider>
        <AppContent />
      </MobileAppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContent: {
    flex: 1,
  },
  splashContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  splashGifWrapper: {
    width: '90%',
    maxWidth: 380,
    aspectRatio: 618 / 274,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashGif: {
    width: '100%',
    height: '100%',
  },
});
