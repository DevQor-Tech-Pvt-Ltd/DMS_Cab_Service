# DMS Cab Service — Backend Security & Production Audit Report

**Date:** June 26, 2026  
**Scope:** `backend/` — all routes, controllers, middleware, models, config files  
**Environment files:** `.env`, `.env.example`  
**Entry point:** `server.js`

---

## Summary

| Category | Count |
|---|---|
| 🔴 Critical Security Issues | 2 |
| 🟠 High Security Issues | 2 |
| 🟡 Logic / Medium Issues | 2 |
| ⚪ Other Production Issues | 1 |
| **Total** | **7** |

---

## 🔴 Critical Security Issues

---

### SEC-B01 — Double Hashing of Seeded Admin Password Prevents Initial Login

**Severity:** Critical  
**File:** `backend/config/createAdmin.js`

During initial database seeding, `createAdmin.js` pre-hashes the administrator's password:
```js
// createAdmin.js
const hashedPassword = await bcrypt.hash(
  process.env.ADMIN_PASSWORD,
  10
);

await User.create({
  fullName: process.env.ADMIN_NAME,
  email: process.env.ADMIN_EMAIL,
  phone: "+91-9876543210",
  password: hashedPassword, // <--- Passing already hashed password
  role: "admin",
  isApproved: true,
  status: "approved",
  approvalDate: new Date(),
});
```
However, the Mongoose `User` model defines a `pre('save')` hook that runs automatically during document creation:
```js
// User.js
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
```
Because the pre-save hook executes on the pre-hashed string, the password in MongoDB is saved as a **double-hash** (`bcrypt(bcrypt(plaintext))`). When the admin tries to log in, the authentication controller compares the plaintext password against this double-hash, making it impossible to log in initially.

**Fix:** Pass the plaintext password configuration directly to `User.create()`, allowing the schema pre-save hook to hash it once:
```diff
-      const hashedPassword = await bcrypt.hash(
-        process.env.ADMIN_PASSWORD,
-        10
-      );
-
       // Create admin
       await User.create({
         fullName: process.env.ADMIN_NAME,
         email: process.env.ADMIN_EMAIL,
         phone: "+91-9876543210",
-        password: hashedPassword,
+        password: process.env.ADMIN_PASSWORD,
         role: "admin",
         isApproved: true,
         status: "approved",
         approvalDate: new Date(),
       });
```

---

### SEC-B02 — Missing Webhook Amount Integrity Check (Price Manipulation Bypass)

**Severity:** Critical  
**File:** `backend/controllers/paymentController.js`

While the client-facing `verifyPayment` API verifies that the Razorpay order amount matches the booked ride fare, the asynchronous webhook processor `razorpayWebhook` does not perform this check. It relies entirely on the Razorpay order status to mark a ride as `paid`:
```js
// paymentController.js (inside razorpayWebhook)
const ride = await Ride.findOne({ razorpayOrderId: orderId });
if (ride) {
  if (ride.paymentStatus !== 'paid') {
    ride.paymentStatus = 'paid';
    if (paymentId) ride.razorpayPaymentId = paymentId;
    await ride.save();
    ...
```
If an attacker creates a ride with a fare of ₹1,500 but initiates a payment order via a custom script for ₹1, the order will be marked as paid by Razorpay. The backend webhook will receive a valid signature verification check for the ₹1 payment and blindly mark the ₹1,500 ride as fully paid.

**Fix:** In `razorpayWebhook`, verify that the payload's payment amount matches the database ride's fare (converted to paise) before completing the transaction:
```js
// Inside order.paid/payment.captured handler in razorpayWebhook:
const ride = await Ride.findOne({ razorpayOrderId: orderId });
if (ride) {
  const eventAmount = payload.payment.entity.amount; // in paise
  if (eventAmount !== Math.round(ride.fare * 100)) {
    logger.error(`[TAMPER DETECTED] Webhook amount mismatch for order ${orderId}: Expected ${ride.fare * 100} paise, received ${eventAmount} paise.`);
    return res.status(400).json({ success: false, message: 'Amount mismatch' });
  }
  
  if (ride.paymentStatus !== 'paid') {
     ride.paymentStatus = 'paid';
     ...
```

---

## 🟠 High Security Issues

---

### SEC-B03 — Decrypted Aadhaar Numbers (PII) Leaked in List APIs

**Severity:** High  
**Files:** `backend/controllers/adminController.js`, `backend/controllers/authController.js`

While `User.js` encrypts the `aadhaarNumber` in MongoDB using AES-256-CBC, the schema defines getters and configuration options to automatically decrypt fields upon conversion to JSON:
```js
// User.js
aadhaarNumber: {
  type: String,
  set: encrypt,
  get: decrypt,
},
// Options
{ 
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
}
```
In `adminController.js`, list endpoints such as `getPendingDrivers`, `getApprovedDrivers`, and `getAllUsers` do not exclude `aadhaarNumber` from projection:
```js
const pendingDrivers = await User.find({ role: 'driver', status: 'pending' }).select('-password');
```
This causes the plain text decrypted Aadhaar numbers of all drivers to be included in administrative lists and sent over the network, exposing sensitive PII.

**Fix:** Mask the Aadhaar number in the user `toJSON()` schema method so lists and standard user queries only reveal the last 4 digits (e.g., `XXXX-XXXX-1234`). Only expose the full number on an authorized single-driver details endpoint.
```js
// Add masking to User.js model output:
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  if (obj.aadhaarNumber && typeof obj.aadhaarNumber === 'string') {
    // Mask all but last 4 digits
    obj.aadhaarNumber = 'XXXX-XXXX-' + obj.aadhaarNumber.slice(-4);
  }
  return obj;
};
```

---

### SEC-B04 — Missing Expiry Check for Phone Login OTPs

**Severity:** High  
**File:** `backend/controllers/authController.js`

The `/phone-login/verify` endpoint retrieves the matching `PhoneOtp` document from MongoDB but does not manually validate if the code has expired:
```js
// authController.js (inside verifyPhoneOtp)
const record = await PhoneOtp.findOne({ phone });
if (!record) {
  return res.status(400).json({ success: false, message: 'Verification code has expired or is invalid.' });
}
```
It relies entirely on MongoDB's TTL index (`phoneOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })`) to clean up expired codes. Because the MongoDB TTL daemon only runs periodically (once per minute), a window exists where an expired OTP code is still present in the database and can be verified.

**Fix:** Add a manual date check in `verifyPhoneOtp`:
```js
if (record.expiresAt && new Date() > record.expiresAt) {
  return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new OTP.' });
}
```

---

## 🟡 Logic / Medium Issues

---

### SEC-B05 — Lack of Rate Limiting on Profile Updates (Cloudinary Resource Exhaustion)

**Severity:** Medium  
**File:** `backend/routes/authRoutes.js`

The `/update-profile` endpoint accepts heavy base64 strings (`profilePicture`, `rcDocument`, `licenseDocument`) and performs server-side Cloudinary uploads. Since this route has no specific rate limiter, an authenticated user can spam requests with large payloads, consuming all backend CPU time and exhausting the Cloudinary API quota.

**Fix:** Create and apply a specific rate limiter on `/update-profile`:
```js
const profileUpdateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 Minutes
  maxProd: 5,               // Limit profile updates to 5 per 15 minutes
  maxDev: 100,
  message: 'Too many profile updates. Please try again later.',
  apiName: 'PROFILE_UPDATE'
});

router.put('/update-profile', protect, profileUpdateLimiter, validate(updateProfileSchema), updateProfile);
```

---

### SEC-B06 — Socket.IO Fallback Checks Token in Query Parameters (JWT Leakage)

**Severity:** Medium  
**File:** `backend/server.js`

The Socket.IO authorization handshake permits extracting the JWT token from the connection query parameters:
```js
const token = socket.handshake.auth?.token || socket.handshake.query?.token || cookieToken;
```
Query parameters appear in reverse proxy logs (Nginx, Cloudflare), server request logs, and browser history. Passing the JWT in the URL query string exposes it to log-scraping or access violations.

**Fix:** Disable query parameter fallback for socket authentication. Restrict socket authentication strictly to `socket.handshake.auth.token` and secure HTTP cookies:
```js
const token = socket.handshake.auth?.token || cookieToken;
```

---

## ⚪ Other Production Issues

---

### PROD-B01 — Sensitive Environment Credentials Tracked in Git Repository

**Severity:** Medium  
**Files:** `frontend/.env.production`, `frontend/.env.development`

Production configuration files containing active keys (such as the live Razorpay API key `rzp_live_...`) are tracked in the Git repository. These files are visible in the repository history, compromising the secrets.

**Fix:** 
1. Remove the tracked files from git without deleting them locally:
   ```bash
   git rm --cached frontend/.env.production
   git rm --cached frontend/.env.development
   ```
2. Verify they are ignored in `.gitignore` (which they are under `*.env`).
3. Commit and push the untracking action. Inject variables via deployment environment settings rather than static files.

---

## Quick Reference — File-to-Issue Map

| File | Issues |
|---|---|
| `backend/config/createAdmin.js` | SEC-B01 |
| `backend/controllers/paymentController.js` | SEC-B02 |
| `backend/controllers/adminController.js` | SEC-B03 |
| `backend/controllers/authController.js` | SEC-B03, SEC-B04 |
| `backend/models/User.js` | SEC-B03 |
| `backend/routes/authRoutes.js` | SEC-B05 |
| `backend/server.js` | SEC-B06 |
| `frontend/.env.production` | PROD-B01 |
| `frontend/.env.development` | PROD-B01 |

---

## Recommended Fix Priority

1. **Immediate (Critical Access & Financial Integrity):**
   - SEC-B01: Fix double-hashing on admin create to allow setup.
   - SEC-B02: Enforce fare amount check inside Razorpay webhooks.

2. **Before Launch (Data Protection & Privacy):**
   - SEC-B03: Mask drivers' Aadhaar numbers in list APIs.
   - SEC-B04: Add manual expiry validation for login OTPs.
   - PROD-B01: Untrack all `.env` files from Git repository.

3. **Optimizations (DoS & Log Sanitization):**
   - SEC-B05: Add a rate limiter to profile updates.
   - SEC-B06: Remove token query param fallback in Socket.IO.
