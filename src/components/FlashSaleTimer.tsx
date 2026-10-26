import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors, radius } from '../theme/tokens';

interface FlashSaleTimerProps {
  expiryTime?: string;
}

export const FlashSaleTimer: React.FC<FlashSaleTimerProps> = React.memo(({ expiryTime }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 17, minutes: 59, seconds: 58 });

  useEffect(() => {
    if (!expiryTime) return;

    const calculate = () => {
      const target = new Date(expiryTime).getTime();
      const now = Date.now();
      const diff = Math.max(0, target - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [expiryTime]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <View style={styles.container}>
      <Text style={styles.badgeLabel}>ENDS IN</Text>
      <View style={styles.timePill}>
        <Text style={styles.timeDigit}>{pad(timeLeft.hours)}</Text>
        <Text style={styles.colon}>:</Text>
        <Text style={styles.timeDigit}>{pad(timeLeft.minutes)}</Text>
        <Text style={styles.colon}>:</Text>
        <Text style={styles.timeDigit}>{pad(timeLeft.seconds)}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accentRed,
    letterSpacing: 0.5,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentRedBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  timeDigit: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.accentRed,
    fontVariant: ['tabular-nums'],
  },
  colon: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accentRed,
    marginHorizontal: 2,
  },
});
