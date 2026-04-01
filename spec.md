# NeoChain Digital Earning

## Current State
Full-stack cyberpunk earning platform with plans, wallet, referral, admin panel, and earnings hub. Backend uses Motoko stable variables. Frontend is React/TypeScript with cyberpunk dark purple-blue theme.

## Requested Changes (Diff)

### Add
- **SupportTicket type** in backend: ticketId, userId (Principal), guestName, guestEmail, problemSummary, status (open/resolved), createdAt, adminReply, adminRepliedAt
- **Backend functions**: createSupportTicket (public, no auth), getMyTickets (user), getAllSupportTickets (admin), replyToTicket (admin), resolveTicket (admin)
- **Stable storage** for support tickets with preupgrade/postupgrade hooks updated
- **CustomerSupportWidget component**: floating 💬 button at bottom-right corner of every page, opens a chat panel, smart rule-based AI bot responding in Hinglish, auto-creates support ticket if issue unresolved
- **Support Tickets tab** in AdminPanel: shows all tickets with Ticket ID, User ID/Name, Problem Summary, Status (Open/Resolved), admin reply input, resolve button

### Modify
- **App.tsx**: Mount `<CustomerSupportWidget />` inside RootLayout (outside admin route), so it appears on all non-admin pages
- **AdminPanel.tsx**: Add "Support Tickets" tab to the tabs list
- **backend main.mo**: Add SupportTicket type, stable vars, CRUD functions, update preupgrade/postupgrade hooks

### Remove
- Nothing removed

## Implementation Plan
1. Add SupportTicket type and functions to main.mo, update stable storage hooks
2. Regenerate backend bindings
3. Create CustomerSupportWidget.tsx with floating chat UI and AI bot logic
4. Add Support Tickets tab to AdminPanel.tsx
5. Mount widget in App.tsx RootLayout
