import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
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
import ProfileView from './src/pages/ProfileView';
import ProductDetailView from './src/pages/ProductDetailView';

// ----------------------------------------------------------------------
// LUXURY STARTUP SPLASH SCREEN (1.2 Seconds)
// ----------------------------------------------------------------------
const LuxurySplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true })
    ]).start();

    const fadeTimeout = setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true
      }).start(() => {
        onFinish();
      });
    }, 1100);

    return () => clearTimeout(fadeTimeout);
  }, []);

  return (
    <Animated.View style={[styles.splashContainer, { opacity: containerOpacity }]}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim, alignItems: 'center' }}>
        <Image
          source={require('./assets/logo.png')}
          style={styles.splashLogo}
          contentFit="contain"
        />
        <Text style={styles.splashBrandName}>GHAR SANSAR</Text>
        <Text style={styles.splashTagline}>Luxury Home & Kitchen Store</Text>
      </Animated.View>
    </Animated.View>
  );
};

// ----------------------------------------------------------------------
// MAIN NAVIGATION & SCREEN ROUTER
// ----------------------------------------------------------------------
const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, selectedProductId } = useMobileApp();
  const [isSplashing, setIsSplashing] = useState(true);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  splashLogo: {
    width: 90,
    height: 90,
    borderRadius: 20,
  },
  splashBrandName: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 1.6,
    marginTop: 18,
  },
  splashTagline: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.brandForestGreen,
    letterSpacing: 0.8,
    marginTop: 6,
  },
});
