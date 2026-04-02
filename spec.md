# NeoChain Digital Earning — UI Redesign v42

## Current State

- Header: `sticky top-0 z-50` with `h-16`, dark bg (`rgba(7,8,26,0.92)`), violet bottom border. Contains logo, nav links, balance badge, Login/Sign Up buttons.
- LandingPage: Long vertical scroll with separate sections stacked — Dashboard stats → Plans 2-col grid → EarningsSection → HowItWorks → SEO sections → FAQ → CTA → About/Trust
- EarningsSection: 3-column grid with Login Bonus, Spin Wheel, Ad Tasks panels
- index.css: OKLCH dark cyberpunk palette, `.neon-card`, `.neon-btn`, `.gradient-text`, `.stat-card`, etc.
- No horizontal scroll sections; all sections are vertically stacked with large padding
- No WhatsApp floating button
- No quick nav links in header (Home | Products | Contact | Account)

## Requested Changes (Diff)

### Add
- Quick nav links in header: Home | Products | Contact | Account (desktop only, compact)
- Floating WhatsApp/Support button (bottom-left, separate from existing support widget at bottom-right)
- Horizontal scroll containers for: Plans section, HowItWorks section, AboutTrust section
- Soft glow CSS classes for green (success/earning), red (alerts), blue (main UI), yellow (highlights), white (clean)
- `scroll-behavior: smooth` on html element

### Modify
- **Header:** Ensure it is truly `position: fixed` (not just sticky), background `#0b0b0b`, add soft blue+green glow on bottom border (`box-shadow: 0 2px 20px rgba(0,200,100,0.15), 0 1px 0 rgba(0,150,255,0.2)`), keep height compact (h-12 or h-14)
- **Section padding:** Reduce all section padding from `py-16/py-20` to `py-6/py-8`. Card spacing tight.
- **Plans section:** Convert from 2×2 grid to horizontal scroll row (`flex overflow-x-auto snap-x snap-mandatory`). Each card min-width ~280px. Touch swipe enabled.
- **Features/HowItWorks section:** Convert to horizontal scroll
- **About/Trust section:** Already uses horizontal-scroll style; ensure proper snap scroll
- **Dashboard stat cards:** Convert to 2×2 tight grid with smaller text
- **All buttons:** Add soft color-coded glow (green for earn/success actions, blue for primary, yellow for highlights)
- **All cards:** Add subtle glow border matching card type (neon-card styles enhanced)
- **EarningsSection:** Reduce padding, make 3-col grid tighter on desktop
- **Body/html:** Add `scroll-behavior: smooth`

### Remove
- Nothing removed — only additions and modifications

## Implementation Plan

1. **index.css** — Add `scroll-behavior: smooth`, add glow utility classes (`.glow-green`, `.glow-blue`, `.glow-red`, `.glow-yellow`, `.glow-white`), reduce default section padding variables
2. **Navbar.tsx** — Change header to `fixed top-0` (already sticky, confirm fixed), change bg to `#0b0b0b`, add blue+green bottom glow border, add compact quick nav links (Home | Products | Contact | Account) for desktop, keep all existing functionality
3. **LandingPage.tsx** — Add `pt-14` to main content to account for fixed header; convert PlansSection from grid to horizontal scroll; convert HowItWorksSection to horizontal scroll; reduce padding on all sections; apply glow classes to buttons and important cards; add floating WhatsApp button (links to support)
4. **EarningsSection.tsx** — Reduce section padding, tighten card spacing, apply soft glow borders to panels
