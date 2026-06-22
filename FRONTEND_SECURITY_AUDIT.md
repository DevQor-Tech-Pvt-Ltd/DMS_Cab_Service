# DMS Cab Service — Frontend Security & Production Audit Report

**Date:** June 22, 2026  
**Scope:** `frontend/src` — all pages, components, context, services, utils, config files  
**Environment files:** `.env.development`, `.env.production`  
**Entry point:** `index.html`

---

## Summary

| Category | Count |
|---|---|
| 🔴 Critical Security Issues | 5 |
| 🟠 High Security Issues | 5 |
| 🟡 Logic Issues | 14 |
| ⚪ Other Production Issues | 10 |
| **Total** | **34** |

---

## 🔴 Critical Security Issues

---

### SEC-01 — JWT and Refresh Token Stored in `sessionStorage` (XSS Vulnerable)

**Severity:** Critical  
**Files:** `src/context/AuthContext.jsx`, `src/services/apiClient.js`

Tokens are stored in `sessionStorage` which is fully accessible via JavaScript. Any XSS injection in the app (even via a third-party script like Razorpay, Google Fonts, or a compromised npm package) can read and exfiltrate both tokens, leading to full account takeover.

```js
// AuthContext.jsx
sessionStorage.setItem('token', data.token);
sessionStorage.setItem('refreshToken', data.refreshToken);
```

**Fix:** Store tokens in `HttpOnly; Secure; SameSite=Strict` cookies set by the backend. Remove all `sessionStorage` token writes from the frontend. The browser will attach cookies automatically on every request.

---

### SEC-02 — Razorpay Test Key Committed to `.env.production`

**Severity:** Critical  
**Files:** `.env.production`, `.env.development`

The Razorpay **test** key `rzp_test_T3TQvNRc5J1CaV` is hardcoded in the production environment file. Vite embeds all `VITE_*` variables directly into the production JS bundle at build time, making this key publicly visible to anyone who views the page source. Using a test key in production means payments go through the test gateway — no real money is collected.

```
# .env.production
VITE_RAZORPAY_KEY=rzp_test_T3TQvNRc5J1CaV
```

**Fix:** Replace with the live Razorpay key (`rzp_live_...`) in production. Never commit `.env.production` to version control — use CI/CD secrets injection instead.

---

### SEC-03 — OTP Rendered in Plain Text on Client-Side Ride Card

**Severity:** Critical  
**Files:** `src/pages/ClientDashboard.jsx`

The ride OTP (`ride.rideOtp`) is fetched from the backend and rendered directly in the DOM on the client's ride card. OTPs are a one-time secret shared verbally between the passenger and driver to confirm identity. Rendering it in the DOM means it is visible in the page source, browser devtools, and to any DOM-scraping script.

```jsx
// ClientDashboard.jsx
<p>OTP: {ride.rideOtp}</p>
```

**Fix:** The OTP should only be shown once in a modal that the user explicitly requests, then dismissed. It should never persist in the DOM as a rendered element. Ideally, the OTP should not be sent to the client at all until the driver is physically present.

---

### SEC-04 — Aadhaar Number (PII) Displayed in Plain Text in Admin Panels

**Severity:** Critical  
**Files:** `src/components/dashboard/AdminPendingDrivers.jsx`, `src/components/dashboard/AdminApprovedDrivers.jsx`

Full 12-digit Aadhaar numbers are rendered as plain text in admin tables. Aadhaar is a government-issued national identity number. Exposing it unmasked in the UI violates UIDAI guidelines and personal data protection standards. A compromised admin account or shoulder-surfing attack immediately exposes sensitive PII.

**Fix:** Mask the Aadhaar number to show only the last 4 digits: `XXXX-XXXX-1234`. Only reveal the full number if the admin explicitly clicks a "reveal" button, with the action logged.

---

### SEC-05 — Mock Payment Bypass Sends Fake IDs to Verify Endpoint

**Severity:** Critical  
**Files:** `src/pages/GetStartedPage.jsx`, `src/components/dashboard/ClientWallet.jsx`

A mock payment path exists that constructs fake Razorpay payment IDs (`pay_mock_*`) and fake signatures (`sig_mock_*`) and submits them to the payment verification endpoint. This relies entirely on the backend to reject these values in production. If the backend's mock check is bypassed or misconfigured, this path becomes a complete payment fraud vector.

```js
// GetStartedPage.jsx
paymentId: `pay_mock_${Date.now()}`,
signature: `sig_mock_${Date.now()}`
```

**Fix:** Remove all mock payment code from production builds entirely. Use `import.meta.env.MODE === 'development'` guards, and strip the code via a build-time flag so it is not present in the production bundle at all.

---

## 🟠 High Security Issues

---

### SEC-06 — Socket.IO Token Passed as Query Parameter

**Severity:** High  
**Files:** `src/pages/ClientDashboard.jsx`, `src/pages/DriverDashboard.jsx`, `src/components/TrackingMap.jsx`

The JWT is passed both in the `auth` object and as a query parameter when initializing Socket.IO connections. Query parameters appear in server access logs, proxy logs, and browser history in plain text, making the token trivially extractable from logs.

```js
// DriverDashboard.jsx
const socket = io(SOCKET_URL, {
  auth: { token },
  query: { token }  // <-- token in URL
});
```

**Fix:** Pass the token only in the `auth` object, never in `query`. Remove the `query: { token }` line from all socket initializations.

---

### SEC-07 — UPI ID Stored Unencrypted in `localStorage`

**Severity:** High  
**Files:** `src/pages/ClientDashboard.jsx`

The user's UPI ID is persisted to `localStorage` with no encryption, no expiry, and no cleanup on logout. `localStorage` persists indefinitely and is accessible to all JavaScript running on the origin, including third-party scripts.

```js
localStorage.setItem('upiId', upiId);
```

**Fix:** Do not store payment identifiers like UPI IDs in `localStorage`. Either fetch this data from the server on demand, or if local storage is necessary, store it encrypted and clear it on logout.

---

### SEC-08 — `window.name` Used as Session Security Mechanism

**Severity:** High  
**Files:** `src/context/AuthContext.jsx`

`window.name` is used to bind sessions to a specific tab. However, `window.name` is readable by subframes and iframes within the same window, and it persists across same-origin navigations. It is not a reliable security boundary. Manipulating `window.name` can also be done by the user, making it trivially bypassable.

**Fix:** Use a secure, server-issued session binding mechanism (e.g., a per-session nonce stored in `sessionStorage` and validated server-side) rather than `window.name`.

---

### SEC-09 — Driver Documents Uploaded as Base64 with No Content-Type Validation

**Severity:** High  
**Files:** `src/pages/AuthPage.jsx`, `src/components/EditProfileModal.jsx`

Driver documents (Aadhaar, RC, license) are converted to base64 DataURL strings and sent as part of a JSON payload. Only the file size is validated on the frontend — there is no content-type check to confirm the file is actually an image or PDF. A malicious user can encode a file of any type as base64 and upload it.

**Fix:** Validate `file.type` on the frontend against an allowlist (`['image/jpeg', 'image/png', 'application/pdf']`) before encoding. Additionally, the backend should validate the actual magic bytes of decoded content, not just rely on the declared MIME type.

---

### SEC-10 — Social Login Buttons Are Non-Functional UI Stubs

**Severity:** High  
**Files:** `src/pages/AuthPage.jsx`

"Continue with Google" and "Continue with Apple" buttons are rendered in the UI but have no click handlers — clicking them does nothing. Users may believe they are logging in with OAuth, giving a false sense of security and authentication legitimacy. This is also misleading under consumer protection standards.

**Fix:** Either implement OAuth login correctly (backend OAuth flow + frontend redirect) or remove these buttons entirely until the feature is built. Do not ship non-functional auth UI.

---

## 🟡 Logic Issues

---

### LOGIC-01 — Default Wallet Balance Hardcoded to ₹1500

**Severity:** High  
**File:** `src/pages/ClientDashboard.jsx`

If `user.walletBalance` is `undefined` or `null`, the fallback value `1500.00` is displayed. A user who has never loaded their wallet will see a phantom ₹1500 balance.

```js
const balance = user.walletBalance ?? 1500.00;
```

**Fix:** Use `0` as the default. Never use a non-zero number as a fallback for a financial value.

---

### LOGIC-02 — Fare Calculation Is Purely Client-Side and Not the Actual Server Fare

**Severity:** High  
**File:** `src/pages/GetStartedPage.jsx`

The `calculateEstimatedFare()` function computes fare entirely on the frontend using a local formula. The displayed price is an estimate and may not match what the backend actually charges. The booking confirmation should always show the server-confirmed fare.

**Fix:** After the user selects a vehicle and route, make an API call to fetch the server-calculated fare. Display only that value as the booking fare, not the locally computed estimate.

---

### LOGIC-03 — Duplicate Transactions in Wallet History

**Severity:** High  
**File:** `src/components/dashboard/ClientWallet.jsx`, `src/pages/ClientDashboard.jsx`

`getMergedTransactions()` merges ride records from `ridesList` with transaction records from the `/transactions` API. If the backend already includes ride payments in the transactions list (which is the expected behavior), this merge creates duplicate entries in the wallet history.

**Fix:** Rely on a single source of truth for transaction history — either the transactions API or the rides API, not both merged together. Deduplicate by `_id` at minimum.

---

### LOGIC-04 — Socket Re-initialized on Every `isOnline` Toggle

**Severity:** High  
**File:** `src/pages/DriverDashboard.jsx`

The `useEffect` that initializes the Socket.IO connection includes `isOnline` in its dependency array. This means every time a driver toggles their online/offline status, the socket disconnects and reconnects, causing loss of any in-flight events (e.g., incoming ride requests during the reconnect window).

**Fix:** Remove `isOnline` from the socket `useEffect` dependency array. The socket connection should be independent of the driver's availability status. Send the status change as a socket event instead of reconnecting.

---

### LOGIC-05 — `handleRides` List in `localStorage` Grows Without Bound

**Severity:** Medium  
**File:** `src/pages/DriverDashboard.jsx`

Completed/handled ride IDs are appended to a `localStorage` array keyed by driver ID (`dms_luxe_handled_rides_${user._id}`). There is no cleanup, no maximum size, and no expiry. Over time this array will grow to contain every ride the driver has ever handled.

**Fix:** Prune old entries on load — keep only IDs from the last 24 hours, or cap the array at a fixed size (e.g., 100 entries).

---

### LOGIC-06 — `isMobile` Computed Once at Module Load, Never Updates

**Severity:** Medium  
**File:** `src/utils/motion.js`

```js
const isMobile = window.innerWidth < 768;
```

This is evaluated once when the module is first imported. It never reacts to window resize events or orientation changes, so the value becomes stale on devices that change orientation.

**Fix:** Use a React hook (`useWindowSize` or a `window.matchMedia` listener) that reactively updates the value.

---

### LOGIC-07 — `Hours Online` Stat Uses `Math.max(8, ...)` — Always Minimum 8

**Severity:** Medium  
**File:** `src/pages/DriverDashboard.jsx`

The displayed "Hours Online" stat is floored at 8 hours regardless of actual data. A driver who has never been online will see "8 hrs".

```js
hoursOnline: Math.max(8, calculatedHours)
```

**Fix:** Remove the `Math.max(8, ...)` clamp. Show `0` for new drivers. Never fabricate displayed metrics.

---

### LOGIC-08 — Emergency Contact Is Hardcoded Mock Data

**Severity:** Medium  
**File:** `src/components/dashboard/ClientProfile.jsx`

The emergency contact section always shows "Sarah Miller, Partner, +1 555-9876". This is not fetched from the API and is never saved. It creates the false impression that the feature is functional.

**Fix:** Either implement the feature (fetch/save emergency contact via API) or remove the section entirely. Do not display fake data as if it were real user data.

---

### LOGIC-09 — Saved Addresses Initialized with Hardcoded Kolkata Addresses

**Severity:** Medium  
**Files:** `src/components/dashboard/ClientProfile.jsx`, `src/components/dashboard/ClientOverview.jsx`

When no saved addresses exist in `localStorage`, the app initializes the list with:
- `"221B Southern Avenue, Kolkata"`
- `"TCS Tower, Salt Lake, Kolkata"`

These are hardcoded placeholders tied to a specific city and have nothing to do with the actual user.

**Fix:** Initialize with an empty array. If you want placeholder UI, use clearly labeled empty-state UI, not fake addresses that look real.

---

### LOGIC-10 — "Upcoming" Tab Navigates to `/get-started` Instead of Showing Rides

**Severity:** Medium  
**File:** `src/components/dashboard/ClientActivity.jsx`

The "Upcoming" tab in the activity view navigates the user away to the booking page instead of showing their actual upcoming bookings. This is a broken feature disguised as navigation.

**Fix:** Implement the upcoming rides list from the API, or clearly mark the tab as "Book a Ride" if navigation is intentional.

---

### LOGIC-11 — HomeFleet Contains Fake Vehicles with Wrong Images

**Severity:** Medium  
**File:** `src/components/HomeFleet.jsx`

The fleet showcase lists BMW X7, Rolls Royce Phantom, and Bentley Flying Spur, but the images assigned to them are `ertiga.jpeg` and `dizire.jpeg` — budget Maruti Suzuki vehicles. This is misleading marketing.

**Fix:** Either use correct images for the listed vehicles, or display only the vehicles the service actually offers.

---

### LOGIC-12 — Duplicate `loading` Spinner Check (Unreachable Code)

**Severity:** Low  
**File:** `src/pages/ClientDashboard.jsx`

There are two separate early-return checks that both render a loading spinner. The second one can never be reached because the first one already handles the `loading === true` case.

**Fix:** Consolidate both loading checks into a single guard at the top of the component.

---

### LOGIC-13 — Hidden Mobile Header Is Dead Code

**Severity:** Low  
**File:** `src/pages/ClientDashboard.jsx`

A mobile header element exists with `className="... hidden"` and is never toggled or conditionally shown. It is dead UI code that adds confusion.

**Fix:** Remove the dead element or implement the visibility toggle.

---

### LOGIC-14 — `currentRide` Computed in Both Parent and Child Components

**Severity:** Low  
**File:** `src/pages/DriverDashboard.jsx`, `src/components/dashboard/DriverOverview.jsx`

The `currentRide` variable is derived from `rides` in both the parent `DriverDashboard` and inside `DriverOverview`. This is a redundant computation and a maintenance hazard — the two can diverge if logic changes in one place.

**Fix:** Compute `currentRide` once in the parent and pass it as a prop.

---

## ⚪ Other Production Issues

---

### PROD-01 — No Content Security Policy (CSP) in `index.html`

**Severity:** High  
**File:** `index.html`

There is no `Content-Security-Policy` meta tag. Without a CSP, the browser places no restrictions on what scripts, styles, or connections the page can make, giving XSS attacks maximum impact.

```html
<!-- index.html — no CSP meta tag present -->
```

**Fix:** Add a CSP meta tag. At minimum:

```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' https://checkout.razorpay.com; connect-src 'self' https://dms-cab-service-d2up.onrender.com wss://dms-cab-service-d2up.onrender.com https://nominatim.openstreetmap.org; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;" />
```

---

### PROD-02 — Sentry DSN Empty — Error Monitoring Disabled in Production

**Severity:** High  
**Files:** `.env.production`, `src/utils/sentry.js`

`VITE_SENTRY_DSN` is empty in both environment files. Sentry initializes but captures nothing. Any production error is silently swallowed with no alerting, no stack traces, and no visibility.

```
# .env.production
VITE_SENTRY_DSN=
```

**Fix:** Create a Sentry project, obtain a real DSN, and set it in `.env.production` (injected via CI/CD secrets, not committed to version control).

---

### PROD-03 — `tracesSampleRate: 1.0` Will Exhaust Sentry Quota Immediately

**Severity:** Medium  
**File:** `src/utils/sentry.js`

Even when the DSN is configured, `tracesSampleRate: 1.0` means 100% of all transactions are sent to Sentry. On any meaningful traffic this will immediately exhaust the free tier and generate unexpected costs on paid tiers.

**Fix:** Set `tracesSampleRate` to `0.1` (10%) or lower for production. Use `0` to disable performance tracing entirely if not needed.

---

### PROD-04 — Backend Wake-Up Ping in `App.jsx` (Cold-Start Hack)

**Severity:** Medium  
**File:** `src/App.jsx`

Every time the React app mounts, it fires `api.get('/')` to wake up the Render.com backend from its free-tier sleep. This is a development workaround that should not exist in production code. It generates unnecessary traffic, exposes the full backend API URL in every user's network tab, and will not be needed on a paid hosting plan.

**Fix:** Remove this call from production. If cold-start mitigation is needed, use Render.com's built-in cron job ping or an external uptime monitor — not app-level code.

---

### PROD-05 — No Phone Number Format Validation

**Severity:** Medium  
**Files:** `src/pages/AuthPage.jsx`, `src/pages/ContactPage.jsx`

Phone number fields accept any string input with no regex validation. Users can submit empty strings, letters, or partial numbers, all of which will fail on the backend but with no user-friendly error.

**Fix:** Validate phone numbers on input change against a pattern (e.g., `/^[6-9]\d{9}$/` for Indian mobile numbers) and show an inline error before form submission.

---

### PROD-06 — No Date Validation — Past Dates Accepted for Ride Booking

**Severity:** Medium  
**File:** `src/pages/GetStartedPage.jsx`

The `pickupDate` and `pickupTime` fields have no validation that the selected datetime is in the future. A user can book a ride for a past date, which will either silently fail or create a bad database record.

**Fix:** Add a `min` attribute to the date input (`min={new Date().toISOString().split('T')[0]}`) and validate that the combined datetime is at least 30 minutes in the future before allowing submission.

---

### PROD-07 — `window.confirm` / `window.alert` Used for Critical Actions

**Severity:** Medium  
**Files:** `src/pages/ClientDashboard.jsx`, `src/pages/DriverDashboard.jsx`, `src/components/dashboard/ClientProfile.jsx`

Native browser `confirm()` and `alert()` dialogs are used for destructive actions like deleting an account, cancelling a ride, and completing a ride early. These are blocked by default in many browsers when the page is embedded in an iframe, and they cannot be styled or customized for the app's design system.

**Fix:** Replace all `window.confirm` calls with a modal confirmation component that is consistent with the app UI.

---

### PROD-08 — `console.log` / `console.error` Left in Production Code

**Severity:** Low  
**Files:** Multiple files throughout `src/`

Development `console.log` and `console.error` statements are present throughout the codebase. These print internal state, API responses, and error stack traces to the browser console, visible to any user who opens devtools.

**Fix:** Remove all `console.*` calls before production builds, or configure the Vite build to strip them automatically:

```js
// vite.config.js
build: {
  minify: 'terser',
  terserOptions: {
    compress: { drop_console: true }
  }
}
```

---

### PROD-09 — OpenStreetMap Attribution Replaced with Brand Attribution

**Severity:** Low  
**File:** `src/components/TrackingMap.jsx`

The Leaflet map attribution is set to `'© DMS Cab Service'`, replacing the required OpenStreetMap attribution. OpenStreetMap's tile usage policy requires attribution to `© OpenStreetMap contributors`. Removing it is a Terms of Service violation.

**Fix:**
```js
attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
```

---

### PROD-10 — Multiple Page Title Typos

**Severity:** Low  
**Files:** `src/pages/TermsPage.jsx`, multiple other pages, `index.html`

Several page titles contain the typo `"DMS Cab ServicesE Chauffeur Services"` — the capital `E` is an extraneous character. The `index.html` `<meta name="keywords">` tag also contains `"DMS Cab Servicese"`.

**Fix:** Do a global find-and-replace for `"ServicesE"` and `"Servicese"` across all page title strings and meta tags.

---

### PROD-11 — Nominatim Geocoding Called Directly from Frontend

**Severity:** Low  
**File:** `src/components/TrackingMap.jsx`

The app calls the Nominatim (OpenStreetMap) geocoding API directly from browser-side code with a hardcoded `User-Agent` header. The Nominatim usage policy prohibits high-volume or automated requests without a proper `User-Agent` identifying your application, and it rate-limits by IP. Browser requests cannot reliably set `User-Agent` and browser IPs will get rate-limited quickly under any real traffic.

**Fix:** Proxy geocoding requests through your own backend, which can set the correct `User-Agent`, handle caching, and respect rate limits centrally.

---

### PROD-12 — Inline SVG Namespace Typo

**Severity:** Low  
**File:** `src/pages/ClientDashboard.jsx`

An inline SVG icon has `xmlns="http://www.w3.org/2050/svg"` — the year `2050` is a typo for `2000`. This is an invalid XML namespace and will cause the SVG to fail to render correctly in strict XML contexts.

**Fix:**
```jsx
xmlns="http://www.w3.org/2000/svg"
```

---

## Quick Reference — File-to-Issue Map

| File | Issues |
|---|---|
| `.env.production` | SEC-02, PROD-02 |
| `.env.development` | SEC-02, PROD-02 |
| `index.html` | PROD-01, PROD-10 |
| `src/context/AuthContext.jsx` | SEC-01, SEC-08 |
| `src/services/apiClient.js` | SEC-01 |
| `src/pages/AuthPage.jsx` | SEC-09, SEC-10, PROD-05 |
| `src/pages/ClientDashboard.jsx` | SEC-03, SEC-07, LOGIC-01, LOGIC-12, LOGIC-13, PROD-07, PROD-12 |
| `src/pages/DriverDashboard.jsx` | SEC-06, LOGIC-04, LOGIC-05, LOGIC-07, LOGIC-14, PROD-07 |
| `src/pages/GetStartedPage.jsx` | SEC-05, LOGIC-02, PROD-06 |
| `src/pages/AdminDashboard.jsx` | SEC-04 |
| `src/components/dashboard/AdminPendingDrivers.jsx` | SEC-04 |
| `src/components/dashboard/AdminApprovedDrivers.jsx` | SEC-04 |
| `src/components/dashboard/ClientWallet.jsx` | SEC-05, LOGIC-03 |
| `src/components/dashboard/ClientProfile.jsx` | LOGIC-08, LOGIC-09, PROD-07 |
| `src/components/dashboard/ClientOverview.jsx` | LOGIC-09 |
| `src/components/dashboard/ClientActivity.jsx` | LOGIC-10 |
| `src/components/dashboard/DriverOverview.jsx` | LOGIC-14 |
| `src/components/TrackingMap.jsx` | SEC-06, PROD-09, PROD-11 |
| `src/components/HomeFleet.jsx` | LOGIC-11 |
| `src/components/EditProfileModal.jsx` | SEC-09 |
| `src/utils/motion.js` | LOGIC-06 |
| `src/utils/sentry.js` | PROD-02, PROD-03 |
| `src/App.jsx` | PROD-04 |
| `src/pages/TermsPage.jsx` | PROD-10 |
| `src/pages/ContactPage.jsx` | PROD-05 |

---

## Recommended Fix Priority

1. **Immediate (before any production traffic):**
   - SEC-01: Move tokens to HttpOnly cookies
   - SEC-02: Replace test Razorpay key with live key
   - SEC-03: Remove OTP from DOM
   - SEC-05: Remove mock payment bypass from production build
   - PROD-01: Add Content Security Policy

2. **Before public launch:**
   - SEC-04: Mask Aadhaar numbers
   - SEC-06: Remove token from socket query params
   - SEC-07: Remove UPI ID from localStorage
   - SEC-10: Remove non-functional social login buttons
   - LOGIC-01: Fix wallet balance default to 0
   - PROD-02: Configure Sentry with a real DSN
   - PROD-04: Remove backend wake-up ping

3. **Sprint cleanup:**
   - All remaining LOGIC and PROD issues

---

*Report generated by automated codebase audit — June 22, 2026*
