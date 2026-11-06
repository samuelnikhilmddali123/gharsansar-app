import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { colors, radius, spacing, shadows } from '../theme/tokens';
import { InteriorEnquiryModal, InteriorDesignItem } from './InteriorEnquiryModal';
import { openWhatsApp } from '../utils/whatsappEnquiry';

const { width: screenWidth } = Dimensions.get('window');

interface InteriorDesignBannerProps {
  onBookEnquiry?: () => void;
}

export const InteriorDesignBanner: React.FC<InteriorDesignBannerProps> = ({ onBookEnquiry }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<InteriorDesignItem | null>(null);

  const handleOpenModal = () => {
    setSelectedDesign({
      name: 'Luxury Home & Kitchen Interior Styling Consultation',
      category: 'Interior Design & Custom Works',
      image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=600',
      description: 'Comprehensive consultation for bespoke dining areas, custom kitchenware storage, and living room curation.'
    });
    setModalVisible(true);
    if (onBookEnquiry) onBookEnquiry();
  };

  const handleQuickChat = () => {
    openWhatsApp(
      `Hello Ghar Sansar team! I am interested in your *Interior Design & Styling Consultation* services for my home. Please share your catalog and consultation details.`
    );
  };

  return (
    <>
      <View style={styles.cardContainer}>
        {/* Visual Accent Background */}
        <View style={styles.bannerHeader}>
          <View style={styles.badgePill}>
            <Feather name="star" size={11} color="#D4AF37" />
            <Text style={styles.badgeText}>BESPOKE INTERIOR & STYLING</Text>
          </View>
          <Text style={styles.bannerTitle}>Interior Design & Custom Consultation</Text>
          <Text style={styles.bannerSubtitle}>
            Custom Crockery Units, Dining Styling, Wall Accents & Luxury Kitchenware Setups
          </Text>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.bookEnquiryBtn}
            activeOpacity={0.85}
            onPress={handleOpenModal}
          >
            <Feather name="calendar" size={15} color="#1E293B" />
            <Text style={styles.bookEnquiryText}>Book an Enquiry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.whatsAppQuickBtn}
            activeOpacity={0.85}
            onPress={handleQuickChat}
          >
            <FontAwesome name="whatsapp" size={16} color="#FFFFFF" />
            <Text style={styles.whatsAppQuickText}>Chat with Stylist</Text>
          </TouchableOpacity>
        </View>
      </View>

      <InteriorEnquiryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        design={selectedDesign}
      />
    </>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: spacing.pageHorizontal,
    marginVertical: 14,
    backgroundColor: '#0F172A',
    borderRadius: radius.card,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    ...shadows.card,
  },
  bannerHeader: {
    marginBottom: 14,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: 'rgba(212, 175, 55, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.8,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    lineHeight: 22,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bookEnquiryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#F8FAFC',
    paddingVertical: 11,
    borderRadius: radius.button,
  },
  bookEnquiryText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  whatsAppQuickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#25D366',
    paddingVertical: 11,
    borderRadius: radius.button,
  },
  whatsAppQuickText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
