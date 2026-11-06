import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { colors, radius, typography, spacing, shadows } from '../theme/tokens';
import { KeyboardSafeScrollView } from './KeyboardSafeScrollView';
import { sendInteriorWhatsAppEnquiry, getFullImageUrl } from '../utils/whatsappEnquiry';
import { useMobileApp } from '../context/MobileAppContext';

export interface InteriorDesignItem {
  name: string;
  category?: string;
  image?: string;
  description?: string;
}

interface InteriorEnquiryModalProps {
  visible: boolean;
  onClose: () => void;
  design?: InteriorDesignItem | null;
}

export const InteriorEnquiryModal: React.FC<InteriorEnquiryModalProps> = ({
  visible,
  onClose,
  design,
}) => {
  const { user } = useMobileApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [requirements, setRequirements] = useState('');

  useEffect(() => {
    if (visible) {
      if (user?.name) setName(user.name);
      if (user?.phone) setPhone(user.phone);
      if (user?.email) setEmail(user.email);
    }
  }, [visible, user]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      Alert.alert('Name Required', 'Please enter your full name.');
      return;
    }

    if (!trimmedPhone || trimmedPhone.replace(/\D/g, '').length < 10) {
      Alert.alert('Valid Phone Required', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    const designTitle = design?.name || 'Luxury Home & Kitchen Interior Styling';
    const designCategory = design?.category || 'Interior Works & Styling';
    const designImage = design?.image;

    await sendInteriorWhatsAppEnquiry({
      designTitle,
      category: designCategory,
      customerName: trimmedName,
      customerPhone: trimmedPhone,
      email: email.trim() || undefined,
      requirements: requirements.trim() || undefined,
      imageUrl: designImage,
    });

    onClose();
  };

  const previewImage = design?.image ? getFullImageUrl(design.image) : null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardSafeScrollView
          containerStyle={{ width: '100%' }}
          contentContainerStyle={styles.scrollContent}
          extraScrollHeight={130}
        >
          <View style={styles.card}>
            {/* Modal Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconCircle}>
                  <Feather name="home" size={18} color="#D4AF37" />
                </View>
                <View>
                  <Text style={styles.title}>Book Interior Enquiry</Text>
                  <Text style={styles.subtitle}>Direct consultation via WhatsApp</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Selected Design / Service Preview */}
            <View style={styles.previewBox}>
              {previewImage ? (
                <Image
                  source={{ uri: previewImage }}
                  style={styles.previewImg}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.previewImg, styles.placeholderImg]}>
                  <FontAwesome name="paint-brush" size={24} color="#D4AF37" />
                </View>
              )}
              <View style={styles.previewMeta}>
                <Text style={styles.previewCategory}>
                  {design?.category || 'INTERIOR CONSULTATION'}
                </Text>
                <Text style={styles.previewTitle} numberOfLines={2}>
                  {design?.name || 'Ghar Sansar Bespoke Home Styling & Kitchen Works'}
                </Text>
              </View>
            </View>

            {/* Input Form */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Your Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Mobile Number (WhatsApp) *</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCodeBox}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email Address (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Requirements / Details (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="E.g., Living room styling, modular kitchenware, budget, timeline..."
                placeholderTextColor={colors.textMuted}
                multiline={true}
                numberOfLines={3}
                value={requirements}
                onChangeText={setRequirements}
              />
            </View>

            {/* Submit Action */}
            <TouchableOpacity
              style={styles.submitBtn}
              activeOpacity={0.88}
              onPress={handleSubmit}
            >
              <FontAwesome name="whatsapp" size={20} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>SEND ENQUIRY ON WHATSAPP</Text>
            </TouchableOpacity>

            <Text style={styles.disclaimerText}>
              Our interior styling expert will connect with you with customized catalogs & quotes.
            </Text>
          </View>
        </KeyboardSafeScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  scrollContent: {
    justifyContent: 'flex-end',
    minHeight: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF6',
    borderRadius: radius.card,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
    gap: 12,
  },
  previewImg: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  placeholderImg: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF08A',
  },
  previewMeta: {
    flex: 1,
  },
  previewCategory: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#047857',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  previewTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCodeText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  textArea: {
    height: 72,
    textAlignVertical: 'top',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: radius.button,
    paddingVertical: 14,
    gap: 10,
    marginTop: 6,
    ...shadows.button,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  disclaimerText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 16,
  },
});
