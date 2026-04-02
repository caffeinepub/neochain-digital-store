# NeoChain Digital Earning

## Current State
The app uses Internet Identity (ICP) for user authentication — no username/password. Users log in via device biometrics/passkeys through the II popup. Admin login is a separate hardcoded username/password form (admin/admin2024). The RegisterModal only collects username + optional referral code after II login. No brute-force protection exists on admin login. No "Forgot Password" UX exists anywhere.

## Requested Changes (Diff)

### Add
- "Forgot Access?" link below the Login button in the Navbar (and in RegisterModal)
- `ForgotAccessModal` component: explains Internet Identity recovery steps, links to https://identity.ic0.app, and includes a helpdesk contact option
- Brute-force protection on AdminLoginPage: max 5 failed attempts → 15-minute lockout (stored in localStorage with timestamp)
- Lockout countdown timer displayed when blocked
- On-screen OTP verification modal: generates a 6-digit OTP client-side, displays it to the user for copy, allows re-generation after 5 minutes. Used as an optional 2FA step before sensitive account actions.
- Rate limiting for registration: max 3 registration attempts per session before cooldown
- Input validation improvements across RegisterModal and PaymentModal: sanitize inputs, show proper error messages

### Modify
- `AdminLoginPage.tsx`: Add failed attempt counter + lockout logic using localStorage, show lockout countdown, disable form when locked
- `Navbar.tsx`: Add small "Forgot Access?" text link that opens ForgotAccessModal
- `RegisterModal.tsx`: Improve input validation, add "Forgot Access?" link

### Remove
- Nothing removed

## Implementation Plan
1. Create `ForgotAccessModal.tsx` component with Internet Identity recovery guide (step-by-step), link to identity.ic0.app, and support ticket option
2. Modify `AdminLoginPage.tsx` to add brute-force protection: track failed attempts in localStorage (`neochain_admin_attempts`, `neochain_admin_lockout`), lock after 5 failures for 15 minutes, show countdown
3. Modify `Navbar.tsx` to show "Forgot Access?" link near Login button
4. Modify `RegisterModal.tsx` to improve input validation and add "Forgot Access?" help text
5. Create `OtpVerificationModal.tsx` for on-screen OTP display/verification (client-side generated, no email needed)
6. Validate, lint, and build
