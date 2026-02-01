# CRM Implementation Plan

## Status: IN PROGRESS

## Tasks

### 1. ✅ Documentation
- [x] Create CRM_SYSTEM_DESIGN.md

### 2. 🔧 Email via Gmail (Not Resend)
**Current:** Emails sent via Resend API
**Goal:** Emails sent via Gmail API → appears in Sent folder

**Changes needed:**
- [ ] Create Gmail service for OSW (reuse SSW Gmail helper pattern)
- [ ] Add `/api/representatives/send-email-gmail` endpoint
- [ ] Update CRMCapture.tsx to use Gmail endpoint
- [ ] Store OAuth tokens securely

**Gmail credentials location:**
`~/.gmail-ssw-mcp/` (existing SSW Gmail setup)

### 3. 🔧 Email Timing Options
**Current:** Send now OR schedule 24hr
**Goal:** Keep same but ensure Gmail sends work

**UI Options:**
- [ ] "Send Now" → Gmail API immediate
- [ ] "Send in 24h" → Store in DB, cron job sends later
- [ ] "Skip" → Save contact, no email

### 4. 🔧 Contact Card Submit UI
**Goal:** Polish the frontend

- [ ] Clean, simple form
- [ ] Clear success message after submit
- [ ] Mobile-optimized touch targets

### 5. 🔧 Mobile Optimization
**Goal:** Optimize admin CRM for mobile

- [ ] Check RepresentativeContacts.tsx mobile layout
- [ ] 44x44px minimum touch targets
- [ ] Responsive tables → cards on mobile
- [ ] Test on 375px viewport

### 6. 🔧 Onboarding Flow
**Goal:** New users can set up CRM

- [ ] Create user setup docs
- [ ] `/crm/{company}/{slug}` pattern explained
- [ ] Gmail OAuth setup instructions

---

## Priority Order
1. Gmail email sending (core functionality)
2. Contact card UI polish
3. Mobile optimization
4. Onboarding docs

---

*Last updated: 2026-02-01*
