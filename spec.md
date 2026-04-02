# NeoChain Digital Earning

## Current State
Full-stack cyberpunk digital earning platform. Admin panel has 10 tabs (Overview, Users, Plan Purchases, Deposits, Withdrawals, QR Payments, Ads Tasks, Support Tickets, System Health, User Database). LandingPage has SEO sections (About, HowToEarn, FAQ, CTA) at the bottom.

## Requested Changes (Diff)

### Add
1. **Admin Panel → "Site Settings" tab** (new 11th tab)
   - Simple form with localStorage persistence (no backend needed)
   - Fields: Website Name, Owner Name, Short Description, Email, WhatsApp Number, Telegram Link, Facebook, Instagram, YouTube, TikTok, 3 review text fields, Total Users (manual number), Total Payments (manual number)
   - Save button writes to localStorage key `siteSettings`
   - Shows success toast on save

2. **LandingPage → "About & Trust" section** (added before closing tag, after CTASection)
   - Reads from localStorage key `siteSettings`
   - Shows: Owner Name + Description, WhatsApp + Email contact, Social links with icons, 2-3 Reviews as cards, Total Users + Total Payments stats
   - Stacked cards layout, mobile friendly, no heavy animation
   - Falls back to empty/default values if no settings saved yet

### Modify
- `AdminTab` type — add `"settings"` value
- Tabs array — add `{ id: "settings", label: "Site Settings", icon: Settings }` entry
- AdminPanel render — add `{activeTab === "settings" && <SiteSettingsTab />}`

### Remove
- Nothing removed

## Implementation Plan
1. Create `SiteSettingsTab` function component inside AdminPanel.tsx (before the main export)
2. Add `"settings"` to `AdminTab` type union
3. Add Settings icon import from lucide-react
4. Add tab entry to tabs array
5. Add render case for settings tab
6. Create `AboutTrustSection` component inside LandingPage.tsx
7. Add it at the bottom of the guest homepage flow (after CTASection)
