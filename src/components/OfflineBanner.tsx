import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/tokens';

interface OfflineBannerProps {
  onRetry: () => Promise<any> | void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ onRetry }) => {
  const insets = useSafeAreaInsets();
  const [retrying, setRetrying] = useState(false);

  const handlePress = async () => {
    if (retrying) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setTimeout(() => setRetrying(false), 500);
    }
  };

  return (
    <View style={[styles.wrapper, { top: Math.max(insets.top, 12) + 6 }]}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handlePress}
        style={styles.bannerPill}
      >
        <View style={styles.content}>
          <View style={styles.dot} />
          <Feather name="wifi-off" size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.bannerText}>You are offline</Text>
          <Text style={styles.divider}>•</Text>
          {retrying ? (
            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginLeft: 4 }} />
          ) : (
            <Text style={styles.retryText}>Tap to refresh</Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 9999,
  },
  bannerPill: {
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    color: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 8,
    fontSize: 12,
  },
  retryText: {
    color: '#6EE7B7',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default OfflineBanner;
