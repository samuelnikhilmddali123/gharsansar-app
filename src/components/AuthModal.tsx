import React from 'react';
import {
  StyleSheet,
  View,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useMobileApp } from '../context/MobileAppContext';
import { GharSansarAuth } from './GharSansarAuth';

export const AuthModal: React.FC = () => {
  const { authModalVisible, setAuthModalVisible } = useMobileApp();

  if (!authModalVisible) return null;

  return (
    <Modal
      visible={authModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setAuthModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalSheet}>
          <GharSansarAuth
            showCloseButton={true}
            onClose={() => setAuthModalVisible(false)}
            onSuccess={() => setAuthModalVisible(false)}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
});

export default AuthModal;
