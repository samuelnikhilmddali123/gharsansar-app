import { Linking, Alert } from 'react-native';

export const ADMIN_WHATSAPP_NUMBER = '919492664870';
export const SECONDARY_WHATSAPP_NUMBER = '918121135980';
const BACKEND_BASE = 'https://backend.gharsansar.website';

export const getFullImageUrl = (imagePath?: string): string => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${BACKEND_BASE}${cleanPath}`;
};

export const generateOrderId = (): string => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `GS-MOB-${dateStr}-${random}`;
};

/**
 * Opens WhatsApp using app deep-link with web fallback
 */
export const openWhatsApp = async (message: string, phoneNumber = ADMIN_WHATSAPP_NUMBER) => {
  try {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const appUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`;
    const webUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    const supported = await Linking.canOpenURL(appUrl);
    if (supported) {
      await Linking.openURL(appUrl);
    } else {
      await Linking.openURL(webUrl);
    }
  } catch (error) {
    Alert.alert('Error', 'Unable to open WhatsApp. Please ensure WhatsApp is installed.');
  }
};

/**
 * 1. Single Product Enquiry / Direct Order Template
 */
export const sendProductWhatsAppEnquiry = async (params: {
  product: { id: string | number; title?: string; name?: string; price: number; image?: string; category?: string };
  quantity?: number;
  orderId?: string;
  selectedSize?: string;
  selectedColor?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
}) => {
  const { product, quantity = 1, orderId, selectedSize, selectedColor, customerName, customerPhone, deliveryAddress } = params;
  const finalOrderId = orderId || generateOrderId();
  const productName = product.name || product.title || 'Product';
  const total = product.price * quantity;

  let msg = `🛍️ *NEW PRODUCT ORDER - GHAR SANSAR*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📋 *Official Order No:* ${finalOrderId}\n`;
  msg += `📅 *Date:* ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}\n\n`;

  msg += `📦 *PRODUCT DETAILS*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `• *Item:* ${productName}\n`;
  if (product.category) msg += `• *Category:* ${product.category}\n`;
  if (selectedSize) msg += `• *Size:* ${selectedSize}\n`;
  if (selectedColor) msg += `• *Color:* ${selectedColor}\n`;
  msg += `• *Quantity:* ${quantity}\n`;
  msg += `• *Price:* ₹${product.price.toLocaleString('en-IN')}\n`;
  msg += `• *Total Amount:* ₹${total.toLocaleString('en-IN')}\n`;
  if (product.image) {
    msg += `• *Image Link:* ${getFullImageUrl(product.image)}\n`;
  }

  if (customerName || customerPhone || deliveryAddress) {
    msg += `\n📍 *CUSTOMER DETAILS*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    if (customerName) msg += `• *Name:* ${customerName}\n`;
    if (customerPhone) msg += `• *Phone:* ${customerPhone}\n`;
    if (deliveryAddress) msg += `• *Address:* ${deliveryAddress}\n`;
  }

  msg += `\nHello Ghar Sansar team, I am interested in this product. Please share availability and delivery timeline!`;

  await openWhatsApp(msg);
};

/**
 * 2. Interior Design & Consultation Enquiry Template
 */
export const sendInteriorWhatsAppEnquiry = async (params: {
  designTitle: string;
  category?: string;
  customerName: string;
  customerPhone: string;
  email?: string;
  requirements?: string;
  imageUrl?: string;
}) => {
  const { designTitle, category, customerName, customerPhone, email, requirements, imageUrl } = params;

  let msg = `✨ *INTERIOR DESIGN ENQUIRY - GHAR SANSAR*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🎨 *Design:* ${designTitle}\n`;
  if (category) msg += `📂 *Category:* ${category}\n`;
  if (imageUrl) msg += `🖼️ *Preview:* ${getFullImageUrl(imageUrl)}\n`;

  msg += `\n👤 *CUSTOMER INFORMATION*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `• *Name:* ${customerName}\n`;
  msg += `• *Phone:* +91 ${customerPhone}\n`;
  if (email) msg += `• *Email:* ${email}\n`;
  msg += `• *Requirements:* ${requirements || 'Consultation & pricing quote needed'}\n\n`;

  msg += `Looking forward to your consultation and quote!`;

  await openWhatsApp(msg);
};

/**
 * 3. Full Cart Order Enquiry Template
 */
export const sendCartWhatsAppOrder = async (params: {
  orderId?: string;
  items: Array<{ name: string; quantity: number; price: number; selectedSize?: string; image?: string }>;
  subtotal: number;
  deliveryCharge: number;
  grandTotal: number;
  customer: { name?: string; phone?: string; address?: string };
}) => {
  const { orderId, items, subtotal, deliveryCharge, grandTotal, customer } = params;
  const finalOrderId = orderId || generateOrderId();

  let msg = `🛍️ *NEW CART ORDER - GHAR SANSAR MOBILE APP*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📋 *Official Order No:* ${finalOrderId}\n`;
  msg += `📍 *Delivery Address:* ${customer.address || 'To be shared'}\n`;
  msg += `📞 *Contact:* ${customer.phone || 'Customer Phone'}\n\n`;

  msg += `📦 *ITEMS (${items.length} Products)*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  items.forEach((item, idx) => {
    msg += `${idx + 1}. *${item.name}* (x${item.quantity}) - ₹${(item.price * item.quantity).toLocaleString('en-IN')}\n`;
    if (item.selectedSize) msg += `   Size: ${item.selectedSize}\n`;
    if (item.image) msg += `   Image: ${getFullImageUrl(item.image)}\n`;
  });

  msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `• Subtotal: ₹${subtotal.toLocaleString('en-IN')}\n`;
  msg += `• Delivery: ${deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}\n`;
  msg += `⭐ *GRAND TOTAL: ₹${grandTotal.toLocaleString('en-IN')}*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `Please confirm my order and share estimated dispatch date. Thank you!`;

  await openWhatsApp(msg);
};
