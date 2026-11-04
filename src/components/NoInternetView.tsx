import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../theme/tokens';

interface NoInternetViewProps {
  onRetry: () => Promise<any> | void;
}

export const NoInternetView: React.FC<NoInternetViewProps> = ({ onRetry }) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in content smoothly
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Gentle pulse animation on the wifi icon background
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleRetry = async () => {
    if (isRetrying) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setIsRetrying(true);
    setRetryMessage(null);

    // Continuous spin animation for the retry icon
    spinAnim.setValue(0);
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinLoop.start();

    try {
      await onRetry();
    } catch (e) {
      setRetryMessage('Still offline. Please check your connection.');
    } finally {
      setTimeout(() => {
        spinLoop.stop();
        setIsRetrying(false);
      }, 500);
    }
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.brandName}>GHAR SANSAR</Text>
        </View>

        {/* Center Illustration Area */}
        <View style={styles.centerSection}>
          <View style={styles.iconWrapper}>
            {/* Pulsing Outer Aura */}
            <Animated.View
              style={[
                styles.pulseRing,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            <View style={styles.iconCircleOuter}>
              <View style={styles.iconCircleInner}>
                <Feather name="wifi-off" size={42} color={colors.brandForestGreen} />
              </View>
            </View>
          </View>

          {/* Status Badge */}
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Connection Disconnected</Text>
          </View>

          {/* Title & Description */}
          <Text style={styles.title}>No Internet Connection</Text>
          <Text style={styles.description}>
            We can’t reach the network right now. Please check your Wi-Fi or mobile data settings and tap Refresh.
          </Text>

          {retryMessage && (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={15} color={colors.accentRed} />
              <Text style={styles.errorText}>{retryMessage}</Text>
            </View>
          )}

          {/* Luxury Refresh Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleRetry}
            disabled={isRetrying}
            style={[styles.refreshButton, isRetrying && styles.refreshButtonDisabled]}
          >
            {isRetrying ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.refreshButtonText}>Checking Connection...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Animated.View style={{ transform: [{ rotate: spin }], marginRight: 10 }}>
                  <Feather name="refresh-cw" size={18} color="#FFFFFF" />
                </Animated.View>
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Help Card */}
        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>Quick Troubleshooting</Text>
          <View style={styles.helpRow}>
            <Feather name="check" size={14} color={colors.accentGreen} style={styles.helpIcon} />
            <Text style={styles.helpText}>Make sure Wi-Fi or Mobile Data is turned on</Text>
          </View>
          <View style={styles.helpRow}>
            <Feather name="check" size={14} color={colors.accentGreen} style={styles.helpIcon} />
            <Text style={styles.helpText}>Toggle Airplane Mode off and on again</Text>
          </View>
          <View style={styles.helpRow}>
            <Feather name="check" size={14} color={colors.accentGreen} style={styles.helpIcon} />
            <Text style={styles.helpText}>Check if other apps or sites can connect</Text>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  logo: {
    width: 28,
    height: 28,
  },
  brandName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.brandForestGreen,
    letterSpacing: 2,
  },
  centerSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(3, 28, 3, 0.05)',
  },
  iconCircleOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(3, 28, 3, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(3, 28, 3, 0.12)',
  },
  iconCircleInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.accentRed,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accentRed,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 18,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: colors.accentRed,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: colors.brandForestGreen,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 28,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brandForestGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  refreshButtonDisabled: {
    opacity: 0.75,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  helpCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: Platform.OS === 'ios' ? 10 : 16,
  },
  helpTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  helpIcon: {
    marginRight: 8,
  },
  helpText: {
    fontSize: 12.5,
    color: colors.textSecondary,
    flex: 1,
  },
});

export default NoInternetView;
