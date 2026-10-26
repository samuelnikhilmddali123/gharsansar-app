import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TextInput, Animated, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/tokens';

interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmitEditing?: () => void;
  onFocus?: () => void;
  onClear?: () => void;
  placeholderPrefix?: string;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = React.memo(({
  value = '',
  onChangeText,
  onSubmitEditing,
  onFocus,
  onClear,
  placeholderPrefix = 'Search products, brands & categories',
  autoFocus = false,
}) => {
  const placeholders = [
    'Search products, brands & categories',
    'Search kitchen cookware & dinner sets...',
    'Search water bottles, flasks & jars...',
    'Search aquarium & home decor...',
    'Search brass & copper idols...',
  ];

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (value) return; // don't cycle when typing

    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true })
      ]).start();

      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
      }, 250);
    }, 3500);

    return () => clearInterval(interval);
  }, [value]);

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Feather name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
        
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          onFocus={onFocus}
          placeholder={placeholders[placeholderIndex]}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          autoFocus={autoFocus}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />

        {value.length > 0 ? (
          <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x-circle" size={17} color={colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <Feather name="mic" size={17} color={colors.textMuted} />
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: 10,
    backgroundColor: colors.background,
  },
  searchBar: {
    height: 50,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '400',
    padding: 0,
  },
});
