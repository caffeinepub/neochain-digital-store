# NeoChain Digital Store

## Current State
- Home screen has My Dashboard, Plans, How It Works, Deposit & Withdrawal sections
- Navbar shows balance + wallet button for logged-in users
- Admin panel manages transactions, payment methods, QR codes
- No earnings/spin/bonus system exists

## Requested Changes (Diff)

### Add
- **Earnings Section** on home screen (separate card/button to enter)
- Inside Earnings section: Free Daily Spin, Daily Login Bonus, Ads Promotion
- **Free Daily Spin**: 1 spin/day, resets after 24h, random ₹10-₹22; every 7th day spin gives ₹50 bonus
- **Daily Login Bonus**: ₹5 auto-credited on first login of each day as "Welcome Bonus"
- **Ads Promotion**: Admin creates ad tasks (image, link, reward amount, task description). User must complete task (click link). "Claim" button appears only after task completion. If incomplete, "Auto Complete Task" button shown. Admin can enable/disable tasks.
- **Withdrawal fee 12%**: Show 12% fee deduction on withdrawal form
- Backend: claimDailySpin, claimLoginBonus, createAdTask (admin), getAdTasks, completeAdTask, claimAdReward, getAdTaskProgress

### Modify
- **Home screen**: Remove Deposit & Withdrawal section, replace with Earnings section button/card
- **Navbar**: Add withdrawal button near balance (3-dots area, already has wallet button - add explicit "Withdraw" shortcut)
- **Plan Buy**: Clicking Buy Now opens payment modal directly (already works, confirm no deposit step confusion)
- **Wallet/Withdrawal modal**: Show 12% fee deduction preview

### Remove
- Deposit & Withdrawal section from home screen

## Implementation Plan
1. Regenerate backend with: claimDailySpin, claimLoginBonus, createAdTask, getAdTasks, completeAdTask, claimAdReward, getAdTaskProgress, deleteAdTask, toggleAdTask
2. Update LandingPage: remove deposit/withdrawal section, add Earnings section card
3. Create EarningsSection component: spin wheel UI, daily bonus UI, ads tasks list
4. Update WalletModal: show 12% withdrawal fee deduction preview
5. Update AdminPanel: add Ad Tasks management tab (create, edit, enable/disable, delete)
6. Navbar: already has balance + wallet button; ensure withdrawal is accessible
