# NeoChain Digital Earning

## Current State
- Home screen (logged-in): Branding → MyDashboard → PlansSection (horizontal scroll cards, 260px wide each) → EarningsSection → AdSense
- PlansSection: horizontal scroll of 4 large cards (260px wide, full description, bullet features), 'Choose Your Plan' heading, 'Buy Now' button on each
- WalletModal: Two tabs — Withdraw and Buy Plan. Withdraw tab has method selection (3-col grid) → form → success flow. Buy Plan tab has a 2x2 grid of compact plan cards.
- All sections have large padding, tall cards, verbose text

## Requested Changes (Diff)

### Add
- Prominent, compact plan selector directly on the home screen replacing the current bulky horizontal scroll cards
- Visual plan picker: 2x2 grid of smaller, cleaner plan cards with price, commission, and a single 'Select' button — feels like a real plan chooser

### Modify
- **PlansSection on home**: Replace large 260px horizontal scroll cards with a tight 2x2 grid of compact plan cards (max 2 columns). Each card: plan name, price (bold), commission badge, short 1-line description, 'Choose Plan' button. Remove verbose bullet lists and long descriptions.
- **WalletModal Withdraw tab**: Completely redesign to match the Buy Plan tab style — same method card grid (3-col, icon + name), same step flow (select → form → success), same visual language (colored glow borders, step indicators). Currently the withdraw tab already has a grid but it looks different from PaymentModal. Make them visually identical in structure and polish.
- **All section spacing**: Reduce padding, margins, and card sizes across LandingPage sections (PlansSection, HowItWorks, FAQ, About, CTASection). Use tighter spacing (py-4 instead of py-8, compact headings).
- **MyDashboardSection**: Reduce stat card sizes, tighten grid gaps, smaller heading text.

### Remove
- Nothing removed

## Implementation Plan
1. Redesign `PlansSection` in LandingPage.tsx — 2x2 responsive grid, compact cards (~180px), remove bullet lists, short descriptions
2. Redesign `WalletModal` withdraw method cards to exactly match the PaymentModal visual style — same card structure, same hover states, same glow colors
3. Tighten spacing across all LandingPage sections — reduce py-8 → py-4/5, reduce heading sizes, reduce card padding
4. Tighten MyDashboardSection stat cards — smaller text, tighter grid gap
