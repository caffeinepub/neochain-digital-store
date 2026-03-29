# NeoChain Digital Store

## Current State
- WalletModal has deposit and withdrawal tabs but withdrawal uses generic fields (Name, Account/UPI ID, Bank, IFSC) without payment-method-specific differentiation
- PaymentModal screenshot upload uses button+ref pattern which may fail in some environments
- LandingPage product cards have short descriptions but no referral commission description
- Hero section is functional but can be cleaner/more premium
- Navbar shows balance and wallet button only when identity && userProfile (correct behavior)

## Requested Changes (Diff)

### Add
- Withdrawal tab: dynamic fields based on selected payment method:
  - eSewa: eSewa ID, Name, Amount
  - Khalti: Khalti ID, Name, Amount
  - Paytm: Paytm Number or UPI ID, Name, Amount
  - PhonePe: PhonePe Number or UPI ID, Name, Amount
  - Google Pay: Google Pay Number or UPI ID, Name, Amount
  - SBI Bank: Account Number, IFSC Code, Account Holder Name, Branch Name, Amount
  - HDFC Bank: Account Number, IFSC Code, Account Holder Name, Branch Name, Amount
- Product cards: add referral commission description below each plan: "Buy this product and share with your friends. When your friend signs up and purchases any product, you will earn 20% commission."
- Hero section: cleaner, more premium look with reduced clutter

### Modify
- WalletModal withdrawal form: replace generic fields with method-specific fields rendered after method selection
- PaymentModal screenshot upload: change from button+ref click to proper label-wrapping approach for reliable file selection
- LandingPage: remove any unnecessary sections, keep only hero + products + how it works
- Withdrawal methods limited to: eSewa, Khalti, Paytm, PhonePe, Google Pay, SBI Bank, HDFC Bank (not USD Payment / Bybit Pay)

### Remove
- Any extra/clutter sections from LandingPage
- Unnecessary footer links

## Implementation Plan
1. Update WalletModal.tsx: method-specific withdrawal fields with conditional rendering
2. Update PaymentModal.tsx: fix screenshot upload with label-wrapping
3. Update LandingPage.tsx: add referral description to product cards, improve hero, remove clutter
