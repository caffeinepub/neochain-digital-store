# NeoChain Digital Earning — v27 Bug Fix & Branding

## Current State
App has home screen with Dashboard, Plans (2x2), Earnings Hub. Header has Balance/Withdraw/Login/SignUp/3-dot. Admin panel has multiple tabs. Buy Plan uses PaymentModal (createDepositRequest). Withdrawal uses WalletModal (requestWithdrawal). Both save extraNotes as JSON with all user-provided details. Admin View Details shows these fields via TxDetailModal parsing parsedNotes.

## Requested Changes (Diff)

### Add
- Above the dashboard section on the home page: small circular logo (from /assets/generated/sandeep-logo-transparent.dim_80x80.png) + "Made by Sandeep Kumar" text in glowing blue-white gradient, with side glow rays around the logo. The whole block is small and centered.
- Admin panel new tab: "System Health" — shows a live error log that captures frontend JS errors (window.onerror, unhandledrejection) and displays them in a list with timestamp, message, and stack. Admin can clear the log. This lets admin see if any bugs/errors/glitches happen.

### Modify
- **Buy Plan submit fix**: In PaymentModal handleSubmit, after the deposit.mutateAsync call fails with a message that includes 'not registered' or 'User is not registered', show a specific message: "Please login and complete registration before buying a plan." Also ensure the error is caught and displayed properly.
- **Withdrawal submit fix**: In WalletModal handleWithdraw, fix the same — if user profile not found or not registered, show clear message. Also fix: the amount field should clear after success.
- **Admin View Details — Withdrawal**: Ensure ALL fields from parsedNotes show in TxDetailModal for withdrawals: method, name, id (with correct label), ifsc, branch, bank, amount. Currently some fields might be missing. Add a clear "Withdrawal Account Details" section header.
- **Admin View Details — Plan Purchase**: Ensure parsedNotes.paymentMethod, name, txnId, screenshot all show. Currently txId vs txnId mismatch — fix: check both `parsedNotes.txId` and `parsedNotes.txnId` and also `parsedNotes.txId || parsedNotes.txnId`. Also show plan amount.
- **General QA**: Fix any TypeScript errors, lint warnings, missing keys, and ensure all interactive elements work.

### Remove
- Nothing to remove

## Implementation Plan
1. In LandingPage.tsx, above the Dashboard section (before the dashboard card/section), add a small centered branding block: circular logo image (40px) + "Made by Sandeep Kumar" text with glowing blue-white gradient + side glow effect via CSS box-shadow/filter.
2. In PaymentModal.tsx, improve error handling in handleSubmit to catch 'not registered'/'User is not registered' errors specifically.
3. In WalletModal.tsx, fix handleWithdraw error handling. Also ensure form resets after success (currently wFields reset is there but verify toast success shows properly).
4. In AdminPanel.tsx TxDetailModal, add "Withdrawal Account Details" heading before withdrawal fields, fix `txnId` vs `txId` display, ensure all parsedNotes fields render.
5. In AdminPanel.tsx, add a new "System Health" tab with frontend error capture using window.onerror and window.addEventListener('unhandledrejection') stored in a local state array, displayed in a table with clear button.
6. Run validation to fix any build errors.
