import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
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
const { width: screenWidth } = Dimensions.get('window');
const SPLASH_GIF_WIDTH = Math.min(screenWidth * 0.88, 360);
const SPLASH_GIF_HEIGHT = Math.round(SPLASH_GIF_WIDTH / (618 / 274));

const LuxurySplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Instantly fade in the outline animation
    Animated.timing(contentFade, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // 2. Fade in brand typography as outline takes shape
    const textTimer = setTimeout(() => {
      Animated.timing(textFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 700);

    // 3. GIF runs for ~1.62s. Keep splash on screen for ~2.1s so the animation completes, then smoothly fade out
    const exitTimer = setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 2100);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  return (
    <Animated.View style={[styles.splashContainer, { opacity: containerOpacity }]}>
      <StatusBar style="light" />
      <Animated.View style={[styles.splashContent, { opacity: contentFade }]}>
        <Image
          source={require('./assets/output-onlinegiftools.gif')}
          style={{ width: SPLASH_GIF_WIDTH, height: SPLASH_GIF_HEIGHT }}
          contentFit="contain"
          autoplay={true}
        />
        <Animated.View style={[styles.splashTextGroup, { opacity: textFade }]}>
          <Text style={styles.splashBrandName}>GHAR SANSAR</Text>
          <Text style={styles.splashTagline}>Luxury Home & Kitchen Store</Text>
        </Animated.View>
      </Animated.View>
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
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  splashTextGroup: {
    alignItems: 'center',
    marginTop: 14,
  },
  splashBrandName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  splashTagline: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D4AF37',
    letterSpacing: 1.5,
    marginTop: 6,
    textTransform: 'uppercase',
  },
});
