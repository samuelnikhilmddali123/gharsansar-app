import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, typography, spacing } from '../theme/tokens';

interface EmptyStateProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  actionLabel?: string;
  onButtonPress?: () => void;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = React.memo(({
  icon,
  title,
  subtitle,
  description,
  buttonText,
  actionLabel,
  onButtonPress,
  onAction,
}) => {
  const finalDesc = description || subtitle || '';
  const finalBtnText = actionLabel || buttonText || 'Explore Products';
  const finalAction = onAction || onButtonPress;

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Feather name={icon} size={36} color={colors.brandGold} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {finalDesc ? <Text style={styles.subtitle}>{finalDesc}</Text> : null}
      {finalBtnText && finalAction && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={finalAction}
          style={styles.button}
        >
          <Text style={styles.buttonText}>{finalBtnText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 280,
  },
  button: {
    backgroundColor: colors.brandCharcoal,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  buttonText: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '700',
  },
});

export default EmptyState;
