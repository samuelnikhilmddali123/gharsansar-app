# Ghar Sansar Mobile App — Product Requirements Document (PRD)

**Product Name:** Ghar Sansar Mobile App  
**Platform:** Android (Expo SDK 58 / React Native 0.88 with New Architecture)  
**Package Identifier:** `com.gharsansarstore`  
**Backend API Base:** `https://backend.gharsansar.website`  
**API Documentation:** `https://gharsansar.website/api-docs/`  
**Version:** 1.0.0 (Release)  
**Date:** October 2026  

---

## 1. Executive Summary & Vision

Ghar Sansar is a premier Indian e-commerce mobile application offering a curated selection of home essentials, kitchenware, copper products, dinnerware, return gifts, and aquarium accessories.

The mobile application is designed to deliver a modern, high-performance shopping experience with:
- Instant luxury-grade authentication (Password & Email OTP verification via SMTP).
- Dynamic two-tier pricing display (Strike-through MRP, Discounted Selling Price, and % Off badges).
- Full address management with automated postal pincode lookup and backend database persistence.
- Smooth, keyboard-aware interactive forms on all Android screen sizes.
- Offline-first cache syncing with resilient cloud persistence.

---

## 2. Tech Stack & Native Specifications

| Layer | Technology | Version / Configuration |
|---|---|---|
| **Framework** | Expo SDK / React Native | Expo `58.x`, React Native `0.88.x` |
| **Architecture** | New Architecture (Fabric + TurboModules) | `newArchEnabled=true`, `hermesEnabled=true` |
| **Language** | TypeScript / Kotlin | TypeScript 5.x, Kotlin 2.2.10 |
| **Build System** | Gradle / Android Gradle Plugin | Gradle 9.4.1, AGP 9.0.0 |
| **Native Toolchain** | Android NDK / CMake / Ninja | NDK 27.1, CMake 3.31.6, Ninja 1.12.1 |
| **Android Targets** | Min SDK: 24, Target SDK: 36, Compile SDK: 37 | Build-Tools 37.0.0 |
| **Package Name** | `com.gharsansarstore` | Single unified namespace across app & native layers |

---

## 3. Core User Flows & Feature Requirements

### 3.1 Authentication & Account Creation Flow

#### 1. Registration with Email OTP Verification
- **Form Fields:** Full Name, Email Address, 10-Digit Mobile Number, Password, Confirm Password.
- **Client Validation:**
  - Full Name: non-empty string.
  - Email: RFC-compliant email address.
  - Phone: Exactly 10 digits.
  - Password Security Checklist (real-time validation icons):
    - Minimum 8 characters.
    - At least one uppercase letter (`[A-Z]`).
    - At least one lowercase letter (`[a-z]`).
    - At least one numeric digit (`[0-9]`).
  - Confirm Password: Strict equality with Password.
- **OTP Verification Step:**
  - Upon tapping **"CREATE ACCOUNT"**, the client dispatches an OTP request to `POST /api/v1/auth/send-otp`.
  - The UI transitions to the **Verify Email** state.
  - The user enters a 6-digit verification code sent via Gmail SMTP.
  - Features: Auto-advance across 6 input boxes, clipboard paste support, backspace navigation, 45-second resend countdown timer, and an "Edit Details" option.
  - Upon tapping **"VERIFY & CREATE ACCOUNT"**, the application sends the complete registration payload including `otp` to `POST /api/auth/register`.

#### 2. Dual-Method Sign In
- **Password Sign In:** Login using Email or 10-digit Phone + Password (`POST /api/auth/login`).
- **Email OTP Sign In:** Passwordless login using 6-digit email code (`POST /api/v1/auth/send-otp` and `POST /api/v1/auth/verify-otp`).
- **Google OAuth Bridge:** Native deep link integration via `gharsansar://auth/callback`.

---

### 3.2 Product Catalog & Category Discounts (Two-Tier Pricing)

- **Two-Tier Pricing Architecture:**
  - **MRP (Strike Price):** Displayed in strike-through gray (`₹1,999`).
  - **Discounted Price (Actual Selling Price):** Highlighted prominently in bold black (`₹1,499`).
  - **Discount Badge:** Displayed with percentage badge (e.g., `25% OFF`).
- **Dynamic Category Discounts:** Fetched from `GET /api/v1/discounts/active` and dynamically mapped onto eligible categories.
- **Search & Filter:** Instant suggestions with category groupings, trending keywords, and search history persistence.

---

### 3.3 Shopping Bag & Cart Architecture

- **Cart Synchronization:**
  - Local state in `AsyncStorage` when unauthenticated.
  - Automatic bidirectional merge via `POST /api/v1/cart/merge` upon sign in.
- **Per-Item Quantity Adjustment:**
  - Real-time increment and decrement buttons (`+` / `-`).
  - Dynamic line item recalculation: `item.quantity * item.price`.
  - Real-time update of Total MRP, Total Discount, and Final Payable Amount.
- **Cart Selection:** Checkbox selection per item and "Select All" toggle for checkout.

---

### 3.4 Delivery Address & Checkout

- **Address Capture:**
  - Full Name, 10-digit Phone, Street / Door Address, City, State, Pincode.
- **Automatic Postal Verification:**
  - Automated lookup from Postal Pincode API to auto-fill City and State upon entering a 6-digit Indian pincode.
- **Backend Persistence:**
  - Synchronized directly to the backend database via `PUT /api/auth/profile` and saved in the user's `addresses` collection.
- **Checkout Guard:**
  - Automatically prompts the user to enter and save their delivery address if none is on file before proceeding to payment.

---

### 3.5 Customer Order Management

- **Order Tracking:**
  - Real-time orders retrieved from `GET /api/v1/orders`.
  - Order status badges (`Processing`, `Shipped`, `Delivered`).
  - Product thumbnail preview, quantity, unit price, delivery address, and payment method details.

---

## 4. API Endpoints & Data Contracts

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/send-otp` | Sends 6-digit OTP code to email via Gmail SMTP (10 min expiry). |
| `POST` | `/api/v1/auth/verify-otp` | Verifies 6-digit OTP code for passwordless sign-in. |
| `POST` | `/api/auth/register` | Registers new user account with `name`, `email`, `phone`, `password`, and `otp`. |
| `POST` | `/api/auth/login` | Authenticates user with email/phone and password. |
| `GET / PUT` | `/api/auth/profile` | Retrieves or updates user profile and saved delivery addresses. |
| `GET` | `/api/v1/discounts/active` | Retrieves active category discounts. |
| `GET` | `/api/products` | Retrieves catalog categories and products. |
| `GET / POST` | `/api/v1/cart` | Manages customer shopping bag. |
| `GET` | `/api/v1/orders` | Retrieves order history for authenticated user. |

---

## 5. Non-Functional & Native Device Requirements

1. **Keyboard-Aware Scrolling:**
   - Registration and authentication pages dynamically calculate keyboard height on Android/iOS.
   - Active focused inputs auto-scroll into view with clear margins above the keyboard.
2. **Android 16 / 17 Compatibility:**
   - Built against Android Compile SDK 37, Target SDK 36, and Build Tools 37.0.0.
   - Long-path build support utilizing CMake 3.31.6 and Ninja 1.12.1.
3. **Offline Resilience:**
   - Products, banners, flash sales, and active discounts cached in `AsyncStorage` with automatic offline fallbacks.

