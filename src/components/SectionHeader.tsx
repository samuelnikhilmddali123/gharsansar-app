import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing } from '../theme/tokens';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onActionPress?: () => void;
  rightComponent?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = React.memo(({
  title,
  subtitle,
  actionText,
  onActionPress,
  rightComponent,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleColumn}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {rightComponent ? (
        <View style={styles.rightSlot}>{rightComponent}</View>
      ) : actionText && onActionPress ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onActionPress}
          style={styles.actionButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.actionText}>{actionText}</Text>
          <Feather name="arrow-right" size={13} color={colors.brandGold} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.pageHorizontal,
    marginBottom: 12,
    marginTop: 20,
  },
  titleColumn: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    ...typography.sectionTitle,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '400',
  },
  rightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brandGold,
  },
});

export default SectionHeader;
