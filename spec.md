# NeoChain Digital Store

## Current State
The app has a LandingPage with product plans (default prices not matching), Dashboard, AdminPanel, AdminLoginPage. Backend supports: products, transactions (deposit/purchase/withdrawal), user profiles with referral codes, payment methods. Backend does NOT have QR code storage per payment method.

## Requested Changes (Diff)

### Add
- Premium product cards section: 4 products at ₹1500/₹3000/₹5000/₹8000 with 10% cashback badge
- Buy Now → payment selection popup showing all 7 payment methods with QR codes
- Payment form after method selection: name, txn ID, amount (auto-filled), screenshot upload
- Admin QR management: upload/change QR images and enable/disable per payment method (store as base64 in description or localStorage for now since no new backend endpoints)
- Referral link UI shown only after admin approves payment
- 20% commission display in dashboard

### Modify
- LandingPage: Replace current hero/plans with exact premium dark purple-blue gradient design per specs
- Product cards: Small centered, not full width, rounded 12-16px, hover lift+glow animation, 10% cashback badge glowing
- AdminPanel: Add Payment Management section with QR upload and enable/disable toggles
- Dashboard: Show referral link only when user has approved purchase; show commission balance

### Remove
- Generic pricing/feature lists from product cards (replace with benefit-focused short descriptions)

## Implementation Plan
1. Redesign LandingPage with premium dark cards (₹1500/₹3000/₹5000/₹8000), cashback badges, dark gradient bg
2. Build PaymentModal component: step 1 = method selection with QR codes, step 2 = payment form
3. Use payment method `description` field to store QR as base64 and enabled/disabled status (JSON)
4. Update AdminPanel Payment Management section: QR image upload + toggle
5. Update Dashboard to show referral link conditionally (only if user has approved purchase transaction)
6. Wire all flows together in App/routing
