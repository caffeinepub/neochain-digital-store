# NeoChain Digital Earning

## Current State
- EarningsSection.tsx has SPIN_AMOUNTS = [10,12,15,18,20,22,25,30] (8 equal amounts, no Better Luck segments)
- Spin result always gives money (no loss possibility), 7th spin logic gives ₹50 bonus
- AdminPanel.tsx Users tab shows username, balance, referral code — no email/account info, no password change
- User data persists via preupgrade/postupgrade hooks in backend (main.mo), plus localStorage caching
- Backend UserProfile type has: user (Principal), username, balance, referralCode, referredBy, referralEarnings — NO email field
- Users register with Internet Identity (Principal), username. Email is stored in localStorage as 'neochain_users' cache

## Requested Changes (Diff)

### Add
- Daily Spin: 4 WIN segments (₹30, ₹50, ₹70, ₹100) + 4 LOSS segments ("Better Luck Next Time")
- Anti-loss logic: track consecutive losses per user; after 3 losses in a row, force a win on next spin
- Admin Panel → new "User Credentials" section inside Users tab: show email (from localStorage cache), login type, and allow admin to directly change username and password for any user
- Backend: add `updateUserCredentials(user: Principal, newUsername: Text, newPassword: Text)` function for admin use

### Modify
- EarningsSection.tsx: replace SPIN_AMOUNTS with WIN_AMOUNTS=[30,50,70,100] and add BETTER_LUCK_LABEL, update wheel segments to 4 win + 4 loss with alternating layout
- Spin algorithm: use anti-loss counter (localStorage), spin result is either win (if forced or random) or loss
- EarningsSection.tsx: update label from "Win ₹10–₹30" to "Win ₹30–₹100"
- AdminPanel.tsx: Users tab — add email column, add "Manage Credentials" button that opens a modal to change username/password

### Remove
- Old "7th spin = ₹50 Special" progress bar UI (replacing with new anti-loss system)
- SPIN_AMOUNTS array with 8 money values

## Implementation Plan
1. Fix EarningsSection.tsx:
   - Replace SPIN_AMOUNTS with WIN_AMOUNTS=[30,50,70,100] and define SEGMENT layout: 8 slots alternating win/loss
   - Update SVG wheel rendering: WIN segments colored (purple/cyan/blue/teal), LOSS segments dark gray
   - Update win text labels and loss text labels on wheel
   - Implement anti-loss localStorage counter: `spinLossStreak_${principalText}`, reset on win
   - Spin algorithm: if streak >= 3, force win; else random with ~50% chance each
   - Update subtitle text and remove 7th spin progress bar
2. Fix AdminPanel.tsx:
   - Add email display in Users table (read from localStorage neochain_users cache)
   - Add "Credentials" button per user row that opens a modal
   - Modal: show current username, email, allow new username + new password input, submit calls backend updateUserCredentials
3. Fix backend main.mo:
   - Add `updateUserCredentials` admin function to change username (password is frontend-only concept stored in localStorage)
   - Note: since auth is Internet Identity, "password" reset means updating the locally stored password hash in localStorage
4. Fix data persistence: ensure localStorage user cache is updated on registration and never cleared
