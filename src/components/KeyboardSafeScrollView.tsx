import React, { forwardRef, useState, useEffect, useImperativeHandle, useRef } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  ScrollViewProps,
  Platform,
  Keyboard,
  StyleSheet,
  ViewStyle,
  StyleProp,
  KeyboardEvent,
} from 'react-native';

export interface KeyboardSafeScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  keyboardVerticalOffset?: number;
  extraScrollHeight?: number;
  containerStyle?: StyleProp<ViewStyle>;
  disableAvoidance?: boolean;
}

/**
 * Reusable, production-grade KeyboardSafeScrollView component.
 * Automatically handles mobile keyboard avoidance across Android & iOS:
 * - Keeps screen scrollable whenever keyboard opens
 * - Provides dynamic bottom scroll clearance so lowest inputs & action buttons are never hidden
 * - Handles tap dismissal gracefully with keyboardShouldPersistTaps="handled"
 * - Restores normal screen layout smoothly when keyboard closes
 */
export const KeyboardSafeScrollView = forwardRef<any, KeyboardSafeScrollViewProps>(
  (
    {
      children,
      keyboardVerticalOffset = Platform.OS === 'ios' ? 0 : 0,
      extraScrollHeight = 120,
      containerStyle,
      contentContainerStyle,
      disableAvoidance = false,
      ...scrollViewProps
    },
    ref
  ) => {
    const scrollRef = useRef<any>(null);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useImperativeHandle(ref, () => scrollRef.current);

    useEffect(() => {
      const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

      const showSub = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
        setIsKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates?.height || 260);
      });

      const hideSub = Keyboard.addListener(hideEvent, () => {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      });

      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }, []);

    // Merge contentContainerStyle with dynamic bottom padding when keyboard is active
    // Ensure ample scroll room so lowest fields and buttons are never covered by keyboard
    const flattenedContentStyle = StyleSheet.flatten(contentContainerStyle) || {};
    const basePaddingBottom = typeof flattenedContentStyle.paddingBottom === 'number'
      ? flattenedContentStyle.paddingBottom
      : 24;

    const clearance = keyboardHeight > 0 ? Math.max(keyboardHeight, extraScrollHeight) : extraScrollHeight;
    const dynamicPaddingBottom = isKeyboardVisible
      ? basePaddingBottom + clearance + 40
      : basePaddingBottom;

    const mergedContentContainerStyle = [
      flattenedContentStyle,
      { paddingBottom: dynamicPaddingBottom }
    ];

    if (disableAvoidance) {
      return (
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          {...scrollViewProps}
          contentContainerStyle={mergedContentContainerStyle}
        >
          {children}
        </ScrollView>
      );
    }

    return (
      <KeyboardAvoidingView
        style={[styles.avoidingContainer, containerStyle]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardVerticalOffset}
        enabled
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          {...scrollViewProps}
          contentContainerStyle={mergedContentContainerStyle}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
);

KeyboardSafeScrollView.displayName = 'KeyboardSafeScrollView';

const styles = StyleSheet.create({
  avoidingContainer: {
    flex: 1,
    width: '100%',
  },
});

export default KeyboardSafeScrollView;
