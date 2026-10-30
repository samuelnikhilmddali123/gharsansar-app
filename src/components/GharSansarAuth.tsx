import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
  Alert,
  NativeSyntheticEvent,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  KeyboardEvent,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useMobileApp } from '../context/MobileAppContext';

interface GharSansarAuthProps {
  onSuccess?: () => void;
  initialMode?: 'signin' | 'register';
  showCloseButton?: boolean;
  onClose?: () => void;
}

// Google 4-Color "G" Icon Component
const GoogleIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <View style={[styles.googleIconBox, { width: size, height: size }]}>
    <Text style={[styles.googleGLetter, { fontSize: size * 0.9 }]}>
      <Text style={{ color: '#4285F4' }}>G</Text>
    </Text>
  </View>
);

export const GharSansarAuth: React.FC<GharSansarAuthProps> = ({
  onSuccess,
  initialMode = 'signin',
  showCloseButton = false,
  onClose,
}) => {
  const { login, register, requestOtp, verifyOtp, loginWithGoogle } = useMobileApp();

  // Screen Mode: 'signin' | 'register'
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode);

  // Sign In Sub-Method: 'password' | 'otp'
  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');

  // OTP Step: 'email' | 'code'
  const [otpStep, setOtpStep] = useState<'email' | 'code'>('email');

  // Feedback & Loading
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password Sign In State
  const [loginEmailOrPhone, setLoginEmailOrPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // OTP Sign In State
  const [otpEmail, setOtpEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [focusedOtpIndex, setFocusedOtpIndex] = useState<number | null>(null);
  const [resendCountdown, setResendCountdown] = useState<number>(0);
  const [otpFeedbackNotice, setOtpFeedbackNotice] = useState<string>('Verification code sent to your email address.');
  const otpInputRefs = useRef<any[]>([]);

  // Register State
  const [regStep, setRegStep] = useState<'form' | 'otp'>('form');
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [regOtpDigits, setRegOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [regFocusedOtpIndex, setRegFocusedOtpIndex] = useState<number | null>(null);
  const [regResendCountdown, setRegResendCountdown] = useState<number>(0);
  const [regOtpFeedbackNotice, setRegOtpFeedbackNotice] = useState<string>('Verification code sent to your email address.');
  const regOtpInputRefs = useRef<any[]>([]);

  // Password criteria check
  const criteriaLength = regPassword.length >= 8;
  const criteriaUpper = /[A-Z]/.test(regPassword);
  const criteriaLower = /[a-z]/.test(regPassword);
  const criteriaNumber = /[0-9]/.test(regPassword);

  // Keyboard and Auto-Scroll Engine for Android & iOS
  const scrollViewRef = useRef<any>(null);
  const fieldLayouts = useRef<{ [key: string]: { y: number; height: number } }>({});
  const activeFieldRef = useRef<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
      const kHeight = e.endCoordinates?.height || 280;
      setKeyboardHeight(kHeight);
      setIsKeyboardVisible(true);

      // Auto-scroll to focused field once keyboard height is captured
      if (activeFieldRef.current) {
        const fieldName = activeFieldRef.current;
        setTimeout(() => {
          scrollToField(fieldName);
        }, 50);
        setTimeout(() => {
          scrollToField(fieldName);
        }, 220);
      }
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
      activeFieldRef.current = null;
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToField = (fieldName: string) => {
    activeFieldRef.current = fieldName;
    const layout = fieldLayouts.current[fieldName];
    if (!layout || !scrollViewRef.current) return;

    // Smart vertical scroll calculation
    let targetY = Math.max(0, layout.y - 25);

    if (fieldName === 'confirmPassword') {
      // Keep Confirm Password, its label, and the CREATE ACCOUNT button clearly visible
      targetY = Math.max(0, layout.y - 15);
    } else if (fieldName === 'regPassword') {
      // Keep Password, its label, and all 4 criteria bullets in view
      targetY = Math.max(0, layout.y - 20);
    } else if (fieldName === 'phone' || fieldName === 'regEmail') {
      targetY = Math.max(0, layout.y - 25);
    } else if (fieldName === 'fullName') {
      targetY = Math.max(0, layout.y - 30);
    }

    scrollViewRef.current.scrollTo({
      y: targetY,
      animated: true,
    });
  };

  const handleFocusField = (fieldName: string) => {
    activeFieldRef.current = fieldName;
    scrollToField(fieldName);
  };

  // Resend Countdown Timer (Login OTP)
  useEffect(() => {
    let timer: any = null;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCountdown]);

  // Resend Countdown Timer (Registration OTP)
  useEffect(() => {
    let timer: any = null;
    if (regResendCountdown > 0) {
      timer = setInterval(() => {
        setRegResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [regResendCountdown]);

  const resetErrors = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSwitchMode = (newMode: 'signin' | 'register') => {
    Keyboard.dismiss();
    resetErrors();
    setMode(newMode);
    setRegStep('form');
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: false });
    }
  };

  // 1. Password Login Submit
  const handlePasswordSignIn = async () => {
    resetErrors();
    const identifier = loginEmailOrPhone.trim();
    if (!identifier) {
      setErrorMessage('Please enter your email or phone number.');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(identifier, loginPassword);
      if (result.success) {
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(result.error || 'Invalid credentials. Please check and try again.');
      }
    } catch (err: any) {
      setErrorMessage('Unable to connect to Ghar Sansar backend server.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Request OTP Code
  const handleSendOtp = async () => {
    resetErrors();
    const emailTrim = otpEmail.trim().toLowerCase();
    if (!emailTrim) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!emailTrim.includes('@') || !emailTrim.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const result = await requestOtp(emailTrim);
      if (result.success) {
        setOtpFeedbackNotice(result.message || 'Verification code sent to your email address.');
        setOtpStep('code');
        setOtpDigits(['', '', '', '', '', '']);
        setResendCountdown(45);
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 300);
      } else {
        setErrorMessage(result.error || 'Failed to send OTP code. Please try again.');
        const match = (result.error || '').match(/(\d+)\s*seconds?/i);
        if (match && match[1]) {
          setResendCountdown(parseInt(match[1], 10));
        }
      }
    } catch (err) {
      setErrorMessage('Unable to connect to Ghar Sansar backend server.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Resend OTP
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || loading) return;
    await handleSendOtp();
  };

  // 4. Verify OTP & Login
  const handleVerifyOtp = async () => {
    resetErrors();
    const code = otpDigits.join('').trim();
    if (code.length < 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOtp(otpEmail, code);
      if (result.success) {
        setSuccessMessage('Login successful! Welcome to Ghar Sansar.');
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 400);
      } else {
        setErrorMessage(result.error || 'Invalid OTP code. Please try again.');
      }
    } catch (err) {
      setErrorMessage('Unable to connect to Ghar Sansar backend server.');
    } finally {
      setLoading(false);
    }
  };

  // OTP 6-Box Input Change Handler
  const handleOtpDigitChange = (text: string, index: number) => {
    resetErrors();
    const cleanNumbers = text.replace(/\D/g, '');

    // Case A: User pasted multi-digit code (e.g. from SMS/Email clipboard)
    if (cleanNumbers.length > 1) {
      const nextDigits = [...otpDigits];
      for (let i = 0; i < cleanNumbers.length; i++) {
        if (index + i < 6) {
          nextDigits[index + i] = cleanNumbers[i];
        }
      }
      setOtpDigits(nextDigits);
      const nextFocus = Math.min(index + cleanNumbers.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    // Case B: Single digit entered
    const singleDigit = cleanNumbers.slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = singleDigit;
    setOtpDigits(nextDigits);

    if (singleDigit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // OTP Backspace Handler
  const handleOtpKeyPress = (
    e: any,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (otpDigits[index] === '' && index > 0) {
        const nextDigits = [...otpDigits];
        nextDigits[index - 1] = '';
        setOtpDigits(nextDigits);
        otpInputRefs.current[index - 1]?.focus();
      }
    }
  };

  // 5. Register: Step 1 Submit (Validate & Send OTP to Email)
  const handleRegister = async () => {
    resetErrors();
    const nameTrim = fullName.trim();
    const emailTrim = regEmail.trim().toLowerCase();
    const phoneTrim = phone.trim();

    if (!nameTrim) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!emailTrim || !emailTrim.includes('@') || !emailTrim.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!phoneTrim || phoneTrim.length < 10) {
      setErrorMessage('Please enter a valid 10-digit phone number.');
      return;
    }
    if (!criteriaLength || !criteriaUpper || !criteriaLower || !criteriaNumber) {
      setErrorMessage('Please satisfy all password security requirements.');
      return;
    }
    if (regPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const result = await requestOtp(emailTrim);
      if (result.success) {
        setRegOtpFeedbackNotice(result.message || `Verification code sent to ${emailTrim}`);
        setRegStep('otp');
        setRegOtpDigits(['', '', '', '', '', '']);
        setRegResendCountdown(45);
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: true });
        }
        setTimeout(() => {
          regOtpInputRefs.current[0]?.focus();
        }, 350);
      } else {
        setErrorMessage(result.error || 'Failed to send OTP verification code. Please try again.');
        const match = (result.error || '').match(/(\d+)\s*seconds?/i);
        if (match && match[1]) {
          setRegResendCountdown(parseInt(match[1], 10));
        }
      }
    } catch (err: any) {
      setErrorMessage('Unable to connect to Ghar Sansar backend server.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Resend Registration OTP
  const handleResendRegOtp = async () => {
    if (regResendCountdown > 0 || loading) return;
    await handleRegister();
  };

  // 7. Verify OTP & Complete Registration
  const handleVerifyAndRegister = async () => {
    resetErrors();
    const code = regOtpDigits.join('').trim();
    if (code.length < 6) {
      setErrorMessage('Please enter all 6 digits of the verification code sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const result = await register(
        fullName.trim(),
        regEmail.trim().toLowerCase(),
        regPassword,
        phone.trim(),
        code
      );
      if (result.success) {
        setSuccessMessage('Account created successfully! Welcome to Ghar Sansar.');
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 400);
      } else {
        setErrorMessage(result.error || 'Registration failed. The OTP code may be incorrect or expired.');
      }
    } catch (err: any) {
      setErrorMessage('Unable to connect to Ghar Sansar backend server.');
    } finally {
      setLoading(false);
    }
  };

  // Registration OTP 6-Box Input Change Handler
  const handleRegOtpDigitChange = (text: string, index: number) => {
    resetErrors();
    const cleanNumbers = text.replace(/\D/g, '');

    // Case A: User pasted multi-digit code
    if (cleanNumbers.length > 1) {
      const nextDigits = [...regOtpDigits];
      for (let i = 0; i < cleanNumbers.length; i++) {
        if (index + i < 6) {
          nextDigits[index + i] = cleanNumbers[i];
        }
      }
      setRegOtpDigits(nextDigits);
      const nextFocus = Math.min(index + cleanNumbers.length, 5);
      regOtpInputRefs.current[nextFocus]?.focus();
      return;
    }

    // Case B: Single digit entered
    const singleDigit = cleanNumbers.slice(-1);
    const nextDigits = [...regOtpDigits];
    nextDigits[index] = singleDigit;
    setRegOtpDigits(nextDigits);

    if (singleDigit && index < 5) {
      regOtpInputRefs.current[index + 1]?.focus();
    }
  };

  // Registration OTP Backspace Handler
  const handleRegOtpKeyPress = (
    e: any,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (regOtpDigits[index] === '' && index > 0) {
        const nextDigits = [...regOtpDigits];
        nextDigits[index - 1] = '';
        setRegOtpDigits(nextDigits);
        regOtpInputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleGoogleSignIn = async () => {
    resetErrors();
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result.success) {
        if (onSuccess) onSuccess();
      } else if (result.error && result.error !== 'Authentication cancelled') {
        setErrorMessage('Unable to sign you in. Please try again.');
      }
    } catch (err) {
      setErrorMessage('Unable to sign you in. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Title and subtitle matching design
  const getHeaderTitle = () => {
    if (mode === 'register') {
      return regStep === 'otp' ? 'Verify Email' : 'Create Account';
    }
    if (authMethod === 'otp') return 'Sign In with OTP';
    return 'Sign In';
  };

  const getHeaderSubtitle = () => {
    if (mode === 'register') {
      return regStep === 'otp'
        ? `Enter the 6-digit code sent to ${regEmail}`
        : 'Join our community today';
    }
    if (authMethod === 'otp') return 'Passwordless login with a 6-digit code sent to your email';
    return 'Welcome back! Please enter your details';
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidWrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.container,
          {
            paddingBottom: isKeyboardVisible ? keyboardHeight + 140 : 40,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
      {/* Optional Close Button for Modal */}
      {showCloseButton && onClose && (
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="x" size={22} color="#0F172A" />
        </TouchableOpacity>
      )}

      {/* Brand Logo matching Images 1, 2, 3 */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      {/* Screen Title & Subtitle */}
      <View style={styles.headerTextGroup}>
        <Text style={styles.titleText}>{getHeaderTitle()}</Text>
        <Text style={styles.subtitleText}>{getHeaderSubtitle()}</Text>
      </View>

      {/* Segmented Control Tabs (Only in Sign In mode - matches Images 1, 2, 3) */}
      {mode === 'signin' && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              authMethod === 'password' && styles.tabButtonActivePassword,
            ]}
            onPress={() => {
              setAuthMethod('password');
              resetErrors();
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabButtonText,
                authMethod === 'password' && styles.tabButtonTextActivePassword,
              ]}
            >
              Password Login
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              authMethod === 'otp' && styles.tabButtonActiveOtp,
            ]}
            onPress={() => {
              setAuthMethod('otp');
              resetErrors();
            }}
            activeOpacity={0.8}
          >
            <Feather
              name="key"
              size={13}
              color={authMethod === 'otp' ? '#FFFFFF' : '#64748B'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabButtonText,
                authMethod === 'otp' && styles.tabButtonTextActiveOtp,
              ]}
            >
              Email OTP
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Error / Success Alerts */}
      {errorMessage ? (
        <View style={styles.alertError}>
          <Feather name="alert-circle" size={16} color="#DC2626" style={{ marginRight: 8 }} />
          <Text style={styles.alertErrorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {successMessage ? (
        <View style={styles.alertSuccess}>
          <Feather name="check-circle" size={16} color="#16A34A" style={{ marginRight: 8 }} />
          <Text style={styles.alertSuccessText}>{successMessage}</Text>
        </View>
      ) : null}

      {/* ============================================================== */}
      {/* 1. PASSWORD SIGN IN (IMAGE 1) */}
      {/* ============================================================== */}
      {mode === 'signin' && authMethod === 'password' && (
        <View style={styles.formSection}>
          {/* Email or Phone */}
          <View
            style={styles.inputGroup}
            onLayout={(e) => {
              fieldLayouts.current['loginEmail'] = e.nativeEvent.layout;
            }}
          >
            <Text style={styles.label}>Email or Phone</Text>
            <View style={styles.inputWrapper}>
              <Feather name="mail" size={18} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email or phone"
                placeholderTextColor="#94A3B8"
                value={loginEmailOrPhone}
                onChangeText={setLoginEmailOrPhone}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => handleFocusField('loginEmail')}
              />
            </View>
          </View>

          {/* Password */}
          <View
            style={styles.inputGroup}
            onLayout={(e) => {
              fieldLayouts.current['loginPassword'] = e.nativeEvent.layout;
            }}
          >
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={18} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showLoginPassword}
                value={loginPassword}
                onChangeText={setLoginPassword}
                autoCapitalize="none"
                onFocus={() => handleFocusField('loginPassword')}
              />
              <TouchableOpacity
                onPress={() => setShowLoginPassword(!showLoginPassword)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.eyeBtn}
              >
                <Feather
                  name={showLoginPassword ? 'eye-off' : 'eye'}
                  size={18}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* SIGN IN Button */}
          <TouchableOpacity
            style={styles.primaryButtonBlack}
            activeOpacity={0.85}
            onPress={handlePasswordSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>SIGN IN</Text>
            )}
          </TouchableOpacity>

          {/* Or continue with */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Continue with Google */}
          <TouchableOpacity
            style={[styles.googleButton, googleLoading && { opacity: 0.7 }]}
            activeOpacity={0.8}
            onPress={handleGoogleSignIn}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#4285F4" style={{ marginRight: 8 }} />
            ) : (
              <GoogleIcon size={18} />
            )}
            <Text style={styles.googleButtonText}>
              {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          {/* Switch to Register */}
          <TouchableOpacity
            onPress={() => handleSwitchMode('register')}
            activeOpacity={0.7}
            style={styles.switchRow}
          >
            <Text style={styles.switchLinkRed}>
              DON'T HAVE AN ACCOUNT? REGISTER
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ============================================================== */}
      {/* 2. EMAIL OTP SIGN IN - STEP 1: EMAIL ENTRY (IMAGE 2) */}
      {/* ============================================================== */}
      {mode === 'signin' && authMethod === 'otp' && otpStep === 'email' && (
        <View style={styles.formSection}>
          {/* Email Address */}
          <View
            style={styles.inputGroup}
            onLayout={(e) => {
              fieldLayouts.current['otpEmail'] = e.nativeEvent.layout;
            }}
          >
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Feather name="mail" size={18} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email (e.g. name@gmail.com)"
                placeholderTextColor="#94A3B8"
                value={otpEmail}
                onChangeText={setOtpEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                onFocus={() => handleFocusField('otpEmail')}
              />
            </View>
            <Text style={styles.helperText}>
              A secure 6-digit verification code will be sent to your Gmail inbox.
            </Text>
          </View>

          {/* SEND VERIFICATION CODE Button */}
          <TouchableOpacity
            style={styles.primaryButtonForestGreen}
            activeOpacity={0.85}
            onPress={handleSendOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>SEND VERIFICATION CODE</Text>
            )}
          </TouchableOpacity>

          {/* Or continue with */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Continue with Google */}
          <TouchableOpacity
            style={[styles.googleButton, googleLoading && { opacity: 0.7 }]}
            activeOpacity={0.8}
            onPress={handleGoogleSignIn}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#4285F4" style={{ marginRight: 8 }} />
            ) : (
              <GoogleIcon size={18} />
            )}
            <Text style={styles.googleButtonText}>
              {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          {/* Switch to Register */}
          <TouchableOpacity
            onPress={() => handleSwitchMode('register')}
            activeOpacity={0.7}
            style={styles.switchRow}
          >
            <Text style={styles.switchLinkRed}>
              DON'T HAVE AN ACCOUNT? REGISTER
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ============================================================== */}
      {/* 3. EMAIL OTP SIGN IN - STEP 2: 6-DIGIT CODE ENTRY (IMAGE 3) */}
      {/* ============================================================== */}
      {mode === 'signin' && authMethod === 'otp' && otpStep === 'code' && (
        <View style={styles.formSection}>
          {/* Header Row: Enter 6-Digit Code + Change Email */}
          <View style={styles.otpHeaderRow}>
            <Text style={styles.otpLabel}>Enter 6-Digit Code</Text>
            <TouchableOpacity
              onPress={() => {
                setOtpStep('email');
                resetErrors();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.changeEmailText}>Change Email</Text>
            </TouchableOpacity>
          </View>

          {/* 6 Individual Square Digit Boxes */}
          <View
            style={styles.otpBoxesRow}
            onLayout={(e) => {
              fieldLayouts.current['otpDigits'] = e.nativeEvent.layout;
            }}
          >
            {otpDigits.map((digit, idx) => {
              const isFocused = focusedOtpIndex === idx;
              return (
                <View
                  key={idx}
                  style={[
                    styles.otpBox,
                    isFocused && styles.otpBoxFocused,
                    digit !== '' && styles.otpBoxFilled,
                  ]}
                >
                  <TextInput
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    style={styles.otpInput}
                    keyboardType="number-pad"
                    maxLength={idx === 0 ? 6 : 1}
                    value={digit}
                    onChangeText={(txt) => handleOtpDigitChange(txt, idx)}
                    onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                    onFocus={() => {
                      setFocusedOtpIndex(idx);
                      handleFocusField('otpDigits');
                    }}
                    onBlur={() => setFocusedOtpIndex(null)}
                    selectTextOnFocus
                    caretHidden={false}
                  />
                </View>
              );
            })}
          </View>

          {/* Mint Green Verification Banner matching Image 3 */}
          <View style={styles.verificationBanner}>
            <Text style={styles.verificationBannerText}>{otpFeedbackNotice}</Text>
          </View>

          {/* Didn't receive code? Resend in 43s */}
          <View style={styles.resendRow}>
            <Text style={styles.resendQuestion}>Didn’t receive code?</Text>
            {resendCountdown > 0 ? (
              <Text style={styles.resendCountdown}>
                Resend in {resendCountdown}s
              </Text>
            ) : (
              <TouchableOpacity
                onPress={handleResendOtp}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.resendAction}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* VERIFY & SIGN IN Button */}
          <TouchableOpacity
            style={styles.primaryButtonForestGreen}
            activeOpacity={0.85}
            onPress={handleVerifyOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>VERIFY & SIGN IN</Text>
            )}
          </TouchableOpacity>

          {/* Or continue with */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Continue with Google */}
          <TouchableOpacity
            style={[styles.googleButton, googleLoading && { opacity: 0.7 }]}
            activeOpacity={0.8}
            onPress={handleGoogleSignIn}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#4285F4" style={{ marginRight: 8 }} />
            ) : (
              <GoogleIcon size={18} />
            )}
            <Text style={styles.googleButtonText}>
              {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          {/* Switch to Register */}
          <TouchableOpacity
            onPress={() => handleSwitchMode('register')}
            activeOpacity={0.7}
            style={styles.switchRow}
          >
            <Text style={styles.switchLinkRed}>
              DON'T HAVE AN ACCOUNT? REGISTER
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ============================================================== */}
      {/* 4. CREATE ACCOUNT FORM (REGISTER MODE) */}
      {/* ============================================================== */}
      {mode === 'register' && regStep === 'form' && (
        <View style={styles.formSection}>
          {/* Full Name */}
          <View
            style={styles.inputGroup}
            onLayout={(e) => {
              fieldLayouts.current['fullName'] = e.nativeEvent.layout;
            }}
          >
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Feather name="user" size={18} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#94A3B8"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                onFocus={() => handleFocusField('fullName')}
              />
            </View>
          </View>

          {/* Email Address */}
          <View
            style={styles.inputGroup}
            onLayout={(e) => {
              fieldLayouts.current['regEmail'] = e.nativeEvent.layout;
            }}
          >
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Feather name="mail" size={18} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#94A3B8"
                value={regEmail}
                onChangeText={setRegEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => handleFocusField('regEmail')}
              />
            </View>
          </View>

          {/* Phone Number */}
          <View
            style={styles.inputGroup}
            onLayout={(e) => {
              fieldLayouts.current['phone'] = e.nativeEvent.layout;
            }}
          >
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Feather name="smartphone" size={18} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your 10-digit phone"
                placeholderTextColor="#94A3B8"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                onFocus={() => handleFocusField('phone')}
              />
            </View>
          </View>

          {/* Password */}
          <View
            style={styles.inputGroup}
            onLayout={(e) => {
              fieldLayouts.current['regPassword'] = e.nativeEvent.layout;
            }}
          >
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={18} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showRegPassword}
                value={regPassword}
                onChangeText={setRegPassword}
                autoCapitalize="none"
                onFocus={() => handleFocusField('regPassword')}
              />
              <TouchableOpacity
                onPress={() => setShowRegPassword(!showRegPassword)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.eyeBtn}
              >
                <Feather
                  name={showRegPassword ? 'eye-off' : 'eye'}
                  size={18}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>

            {/* Checklist criteria */}
            <View style={styles.checklistContainer}>
              <View style={styles.checkItem}>
                <Feather
                  name={criteriaLength ? 'check-circle' : 'circle'}
                  size={13}
                  color={criteriaLength ? '#10B981' : '#94A3B8'}
                />
                <Text style={[styles.checkText, criteriaLength && styles.checkTextActive]}>
                  At least 8 characters
                </Text>
              </View>

              <View style={styles.checkItem}>
                <Feather
                  name={criteriaUpper ? 'check-circle' : 'circle'}
                  size={13}
                  color={criteriaUpper ? '#10B981' : '#94A3B8'}
                />
                <Text style={[styles.checkText, criteriaUpper && styles.checkTextActive]}>
                  One uppercase letter
                </Text>
              </View>

              <View style={styles.checkItem}>
                <Feather
                  name={criteriaLower ? 'check-circle' : 'circle'}
                  size={13}
                  color={criteriaLower ? '#10B981' : '#94A3B8'}
                />
                <Text style={[styles.checkText, criteriaLower && styles.checkTextActive]}>
                  One lowercase letter
                </Text>
              </View>

              <View style={styles.checkItem}>
                <Feather
                  name={criteriaNumber ? 'check-circle' : 'circle'}
                  size={13}
                  color={criteriaNumber ? '#10B981' : '#94A3B8'}
                />
                <Text style={[styles.checkText, criteriaNumber && styles.checkTextActive]}>
                  One number
                </Text>
              </View>
            </View>
          </View>

          {/* Confirm Password */}
          <View
            style={styles.inputGroup}
            onLayout={(e) => {
              fieldLayouts.current['confirmPassword'] = e.nativeEvent.layout;
            }}
          >
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={18} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Re-enter your password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
                onFocus={() => handleFocusField('confirmPassword')}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.eyeBtn}
              >
                <Feather
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={18}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Button & Sign In Link Footer */}
          <View
            onLayout={(e) => {
              fieldLayouts.current['registerFooter'] = e.nativeEvent.layout;
            }}
          >
            {/* CREATE ACCOUNT Button */}
            <TouchableOpacity
              style={styles.primaryButtonForestGreen}
              activeOpacity={0.85}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>CREATE ACCOUNT</Text>
              )}
            </TouchableOpacity>

            {/* Or continue with */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Continue with Google */}
            <TouchableOpacity
              style={[styles.googleButton, googleLoading && { opacity: 0.7 }]}
              activeOpacity={0.8}
              onPress={handleGoogleSignIn}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color="#4285F4" style={{ marginRight: 8 }} />
              ) : (
                <GoogleIcon size={18} />
              )}
              <Text style={styles.googleButtonText}>
                {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>

            {/* Switch to Sign In */}
            <TouchableOpacity
              onPress={() => handleSwitchMode('signin')}
              activeOpacity={0.7}
              style={styles.switchRow}
            >
              <Text style={styles.switchLinkRed}>
                ALREADY HAVE AN ACCOUNT? SIGN IN
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ============================================================== */}
      {/* 5. REGISTRATION OTP VERIFICATION STEP */}
      {/* ============================================================== */}
      {mode === 'register' && regStep === 'otp' && (
        <View style={styles.formSection}>
          {/* Header Row: Enter 6-Digit Code + Change/Edit Details */}
          <View style={styles.otpHeaderRow}>
            <Text style={styles.otpLabel}>Enter 6-Digit Code</Text>
            <TouchableOpacity
              onPress={() => {
                setRegStep('form');
                resetErrors();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.changeEmailText}>Edit Details</Text>
            </TouchableOpacity>
          </View>

          {/* 6 Individual Square Digit Boxes */}
          <View
            style={styles.otpBoxesRow}
            onLayout={(e) => {
              fieldLayouts.current['regOtpDigits'] = e.nativeEvent.layout;
            }}
          >
            {regOtpDigits.map((digit, idx) => {
              const isFocused = regFocusedOtpIndex === idx;
              return (
                <View
                  key={idx}
                  style={[
                    styles.otpBox,
                    isFocused && styles.otpBoxFocused,
                    digit !== '' && styles.otpBoxFilled,
                  ]}
                >
                  <TextInput
                    ref={(el) => {
                      regOtpInputRefs.current[idx] = el;
                    }}
                    style={styles.otpInput}
                    keyboardType="number-pad"
                    maxLength={idx === 0 ? 6 : 1}
                    value={digit}
                    onChangeText={(txt) => handleRegOtpDigitChange(txt, idx)}
                    onKeyPress={(e) => handleRegOtpKeyPress(e, idx)}
                    onFocus={() => {
                      setRegFocusedOtpIndex(idx);
                      handleFocusField('regOtpDigits');
                    }}
                    onBlur={() => setRegFocusedOtpIndex(null)}
                    selectTextOnFocus
                    caretHidden={false}
                  />
                </View>
              );
            })}
          </View>

          {/* Mint Green Verification Banner */}
          <View style={styles.verificationBanner}>
            <Text style={styles.verificationBannerText}>{regOtpFeedbackNotice}</Text>
          </View>

          {/* Didn't receive code? Resend in 45s */}
          <View style={styles.resendRow}>
            <Text style={styles.resendQuestion}>Didn’t receive code?</Text>
            {regResendCountdown > 0 ? (
              <Text style={styles.resendCountdown}>
                Resend in {regResendCountdown}s
              </Text>
            ) : (
              <TouchableOpacity
                onPress={handleResendRegOtp}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.resendAction}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* VERIFY & CREATE ACCOUNT Button */}
          <TouchableOpacity
            style={styles.primaryButtonForestGreen}
            activeOpacity={0.85}
            onPress={handleVerifyAndRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>VERIFY & CREATE ACCOUNT</Text>
            )}
          </TouchableOpacity>

          {/* Back to Form */}
          <TouchableOpacity
            onPress={() => {
              setRegStep('form');
              resetErrors();
            }}
            activeOpacity={0.7}
            style={styles.switchRow}
          >
            <Text style={styles.switchLinkRed}>
              ← BACK TO REGISTRATION FORM
            </Text>
          </TouchableOpacity>

          {/* Switch to Sign In */}
          <TouchableOpacity
            onPress={() => handleSwitchMode('signin')}
            activeOpacity={0.7}
            style={styles.switchRow}
          >
            <Text style={styles.switchLinkRed}>
              ALREADY HAVE AN ACCOUNT? SIGN IN
            </Text>
          </TouchableOpacity>
        </View>
      )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidWrapper: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    backgroundColor: '#FFFFFF',
    flexGrow: 1,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 6,
    marginBottom: 8,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  logoImage: {
    width: 150,
    height: 76,
  },
  headerTextGroup: {
    alignItems: 'center',
    marginBottom: 20,
  },
  titleText: {
    fontSize: 27,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontSize: 13.5,
    color: '#64748B',
    marginTop: 5,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
  },

  // Segmented Pill Tabs matching Images 1, 2, 3
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 22,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9,
    backgroundColor: 'transparent',
  },
  tabButtonActivePassword: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabButtonActiveOtp: {
    backgroundColor: '#043927', // Deep forest green matching Images 2 & 3
    shadowColor: '#043927',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButtonText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActivePassword: {
    color: '#0F172A',
    fontWeight: '700',
  },
  tabButtonTextActiveOtp: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Alerts
  alertError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  alertErrorText: {
    flex: 1,
    fontSize: 12.5,
    color: '#B91C1C',
    fontWeight: '500',
  },
  alertSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  alertSuccessText: {
    flex: 1,
    fontSize: 12.5,
    color: '#15803D',
    fontWeight: '500',
  },

  // Form
  formSection: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    height: '100%',
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    paddingLeft: 2,
  },
  eyeBtn: {
    padding: 6,
  },

  // OTP 6-Digit Code Styles (Image 3)
  otpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  otpLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  changeEmailText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#043927',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpBox: {
    width: 46,
    height: 54,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFocused: {
    borderColor: '#043927',
    borderWidth: 1.5,
  },
  otpBoxFilled: {
    borderColor: '#94A3B8',
  },
  otpInput: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  verificationBanner: {
    backgroundColor: '#E6FBF2',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationBannerText: {
    fontSize: 12.5,
    color: '#065F46',
    fontWeight: '500',
    textAlign: 'center',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingHorizontal: 2,
  },
  resendQuestion: {
    fontSize: 12.5,
    color: '#64748B',
  },
  resendCountdown: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  resendAction: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#043927',
  },

  // Password Checklist
  checklistContainer: {
    marginTop: 8,
    gap: 4,
    paddingLeft: 2,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  checkTextActive: {
    color: '#334155',
  },

  // Buttons
  primaryButtonBlack: {
    backgroundColor: '#18181B', // Dark charcoal matching Image 1
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonForestGreen: {
    backgroundColor: '#043927', // Deep forest green matching Image 2 & 3
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#043927',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 12.5,
    color: '#64748B',
    paddingHorizontal: 12,
    fontWeight: '500',
  },

  // Google Sign-In
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  googleIconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleGLetter: {
    fontWeight: '900',
    lineHeight: 20,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },

  // Switch Link
  switchRow: {
    marginTop: 26,
    alignItems: 'center',
    paddingVertical: 6,
  },
  switchLinkRed: {
    fontSize: 12,
    fontWeight: '800',
    color: '#991B1B', // Maroon/red link matching Images 1, 2, 3
    letterSpacing: 0.5,
  },
});

export default GharSansarAuth;
