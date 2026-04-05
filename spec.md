# NeoChain Digital Store

## Current State
The app is a full NeoChain Digital Earning platform (cyberpunk theme, dark purple-blue) with:
- Single-page React app with client-side routing (hash or state-based)
- Admin panel at `/admin`
- Login/Register as modals (not dedicated pages)
- Existing SEO meta tags in index.html (title, description, OG, Twitter Card, google-site-verification)
- No dedicated pages for: Mobile Applications, Products, Contact
- No JSON-LD structured data (Organization, WebSite, Sitelinks Searchbox)
- No sitemap.xml or robots.txt
- All existing features: Buy Plan, Withdraw, Spin, Referral, Support Widget, Admin Panel, etc.

## Requested Changes (Diff)

### Add
- Dedicated route pages: `/login`, `/register`, `/mobile-apps`, `/products`, `/contact`
- JSON-LD structured data blocks in index.html: Organization, WebSite (with SearchAction for Sitelinks), BreadcrumbList for nav links
- sitemap.xml in public/ listing all 6 pages
- robots.txt in public/ pointing to sitemap
- SEO-optimized `<title>` and `<meta name="description">` per-page (via react-helmet or document.title in each page component)
- Clear internal navigation links in header/footer linking to all 6 pages
- Mobile Applications page: showcase of apps with download links or info
- Products page: showcase of the 4 digital plans with SEO content
- Contact page: contact form + contact info
- Login page: standalone version of existing LoginModal content
- Registration page: standalone version of existing RegisterModal content

### Modify
- `index.html` `<title>` → "NeoChain Digital Store - Official Website"
- `index.html` `<meta name="description">` → "Best digital store with fast and secure services"
- `index.html`: add JSON-LD scripts for Organization + WebSite + Sitelinks search
- Header Navbar: add nav links to all 6 pages (Home, Login, Register, Mobile Apps, Products, Contact)
- Footer: add internal links to all 6 pages
- App.tsx routing: add routes for the new pages

### Remove
- Nothing (all existing features preserved)

## Implementation Plan
1. Update `index.html`: new title, description, and 3 JSON-LD `<script type="application/ld+json">` blocks (Organization, WebSite with SearchAction, SiteLinksSearchBox)
2. Create `public/sitemap.xml` with all 6 page URLs
3. Create `public/robots.txt` pointing to sitemap
4. Create page components:
   - `src/pages/LoginPage.tsx` — standalone login form using existing auth logic
   - `src/pages/RegisterPage.tsx` — standalone registration form
   - `src/pages/MobileAppsPage.tsx` — mobile apps showcase
   - `src/pages/ProductsPage.tsx` — digital plans showcase
   - `src/pages/ContactPage.tsx` — contact form + info
5. Update `App.tsx` to add React Router routes for `/login`, `/register`, `/mobile-apps`, `/products`, `/contact`
6. Update Navbar and Footer with internal links to all pages
7. Each page sets `document.title` and a meta description dynamically for per-page SEO
