# CRM Implementation Plan

## Status: MOSTLY COMPLETE ✅

## Tasks

### 1. ✅ Documentation
- [x] Create CRM_SYSTEM_DESIGN.md

### 2. ✅ Email via Gmail (Not Resend)
**Current:** Emails sent via Gmail API first, Resend fallback
**Goal:** Emails appear in Sent folder ✅

**Completed:**
- [x] Create Gmail service (`server/services/gmailService.ts`)
- [x] Update `/api/representatives/send-email` to use Gmail first
- [x] Fallback to Resend if Gmail fails
- [x] Store OAuth tokens at `~/.gmail-ssw-mcp/`

**Note:** Gmail credentials must exist on server at `~/.gmail-ssw-mcp/credentials.json`

### 3. ✅ Email Timing Options
**Already working:**
- [x] "Send Now" → Gmail API immediate
- [x] "Send in 24h" → Resend scheduled (TODO: migrate to Gmail cron)
- [x] "Skip" → Save contact, no email

### 4. ✅ Contact Card Submit UI
**Already polished in CRMCapture.tsx:**
- [x] Clean capture → entry → email preview → success flow
- [x] Clear success animation with "Lead Captured!" message
- [x] "Next Card" button for rapid scanning

### 5. ✅ Mobile Optimization
**Completed:**
- [x] RepresentativeContacts.tsx now has mobile card view
- [x] 44px+ touch targets for Email/Call buttons
- [x] Tables hidden on mobile, cards shown instead
- [x] CRMCapture.tsx already mobile-first

### 6. 🔧 Onboarding Flow (TODO)
**Goal:** New users can set up CRM
- [ ] Create user setup docs
- [ ] `/crm/{company}/{slug}` pattern explained
- [ ] Gmail OAuth setup instructions

---

## VPS Setup
OSW credentials added to VPS (claude-server 143.198.74.96):
- `/root/.osw-credentials/.env` - Full credentials file
- `/etc/environment` - System-wide env vars

---

*Last updated: 2026-02-01*
*Status: 5/6 tasks complete*
