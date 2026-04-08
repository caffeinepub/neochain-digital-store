# Design Brief: NeoChain Earning Pages

## Aesthetic
Cyberpunk tech platform with neon glow accents. Dark-first (#0a0b1e base), OKLCH color space, function-color coding, minimal typography hierarchy, zero skeuomorphism.

## Palette (OKLCH Raw Values)
| Token | Role | L C H | Usage |
|-------|------|-------|-------|
| background | Page | 0.09 0.02 270 | Page foundation |
| card | Elevated | 0.11 0.03 275 | Card bases |
| primary (cyan) | Primary action | 0.82 0.18 210 | Buttons, active states |
| secondary (violet) | Secondary | 0.52 0.22 280 | Referral theme |
| accent (magenta) | Highlight | 0.58 0.25 305 | CTA, emphatic text |
| chart-4 (turquoise) | Success/Earn | 0.72 0.16 160 | Reward badges, earn glow |
| chart-5 (amber) | Gold/Ranking | 0.65 0.2 45 | Leaderboard ranks, premium |
| foreground | Text | 0.96 0.01 280 | Body text, high contrast |

## Fonts
**Display:** BricolageGrotesque (800 max) — Headlines, page titles, badge counters  
**Body:** PlusJakartaSans (300–700) — Body copy, descriptions, metric labels

## Zones & Depth
| Zone | Background | Border | Glow | Purpose |
|------|-----------|--------|------|---------|
| Earn Hub | `neon-card-earn` | 0.35 green | `glow-success` | Task cards, spin wheel, streak |
| Wallet | `neon-card-wallet` | 0.35 cyan | `glow-cyan-bright` | Balance, withdrawal form, methods |
| Referral | `neon-card-referral` | 0.35 violet | `glow-violet-bright` | Share cards, stats, invite link |
| Leaderboard | `neon-card-leaderboard` | 0.25 gold | `glow-gold` | Rank table, top-3 highlight |

## Component Patterns
- **Metric Card:** Semi-transparent card with color glow, bold number (Display font), label (muted text)
- **Action Button:** Cyan → violet gradient, rounded pill, glow on hover, all caps label
- **Badge:** Tiny colored pill, matching zone glow, compact typography
- **Stat Row:** Flex left-align, icon + label left, value right, thin border-bottom between rows

## Motion
- **Entrance:** Fade-in 200ms on page load
- **Hover:** Slight translateY(-2px), enhanced glow, no jump
- **Focus:** Ring-focus with `--ring` (cyan), instant 0.2s transition

## Spacing & Rhythm
- **Padding:** 1.5rem per card, 1rem section gaps
- **Grid:** 2-col on mobile, 3–4 col on desktop; gap 1rem
- **Typography:** Line-height 1.5, letter-spacing subtle (0.02em display, 0em body)

## Signature Detail
Neon **color-coded zone glows**: each earning page has its own functional color (earn = green, wallet = cyan, referral = violet, leaderboard = gold) reinforced in borders, text shadows, and card glows. No two zones feel the same visually, yet all use the same cyberpunk foundation.

## Constraints
- No heavy animations, no bouncing, no parallax
- Text shadows only on accent text (cyan/violet/magenta)
- Grid background pattern on select sections (subtle, 0.03 opacity)
- Minimum contrast AA+ (L difference ≥ 0.7 foreground-on-background)
