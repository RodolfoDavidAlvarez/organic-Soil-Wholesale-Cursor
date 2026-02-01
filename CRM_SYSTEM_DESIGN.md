# CRM System Design

## Overview
Multi-tenant CRM system for capturing leads at events, trade shows, and in-person meetings.

## URL Structure
```
/crm/{company}/{user}
```

**Examples:**
- `/crm/ssw/rodolfo` — SSW leads captured by Rodolfo
- `/crm/ufe/joe` — UFE leads captured by Joe

## Companies & Segments

### SSW (Soil Seed & Water)
| Segment | Description |
|---------|-------------|
| Operator | Composting facility operators |
| Vineyard | Wine grape growers |
| Orchard | Fruit/nut tree farms |
| Farmer | General agriculture |
| Landscaper | Landscape contractors |
| Hauler | Waste haulers |
| Other | Uncategorized |

### UFE (Urban Farming Education)
| Segment | Description |
|---------|-------------|
| Municipal | City/county governments |
| Equipment | Equipment manufacturers |
| Policy | Policy makers |
| ESG | Corporate sustainability |
| Education | Schools, universities |
| Operator | Facility operators |
| Other | Uncategorized |

## Lead Capture Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. CAPTURE CARD                                            │
│     • Take photo of business card                           │
│     • OCR extracts: name, email, phone, company, title      │
├─────────────────────────────────────────────────────────────┤
│  2. ADD CONTEXT                                             │
│     • Select segment (auto-classified by AI)                │
│     • Select lead source (event name)                       │
│     • Add voice/text notes about conversation               │
│     • AI researches company website for context             │
├─────────────────────────────────────────────────────────────┤
│  3. EMAIL OPTIONS                                           │
│     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│     │  SEND NOW    │  │ SEND IN 24H  │  │    SKIP      │   │
│     └──────────────┘  └──────────────┘  └──────────────┘   │
│     • AI generates personalized follow-up email             │
│     • Review/edit before sending                            │
│     • Sent via Gmail (appears in Sent folder)               │
├─────────────────────────────────────────────────────────────┤
│  4. SUCCESS                                                 │
│     • Contact saved to database                             │
│     • Email queued/sent                                     │
│     • Success confirmation shown                            │
│     • Ready for next card                                   │
└─────────────────────────────────────────────────────────────┘
```

## Email Sending

**Method:** Gmail API (NOT transactional email service)

**Reason:** 
- Emails appear in user's Sent folder
- Better deliverability (from real mailbox)
- Easy to track and follow up

**SSW Email:** `ralvarez@soilseedandwater.com`

**Email Features:**
- AI-generated personalized content based on:
  - Contact's company/role
  - Conversation notes
  - Company website research
- User can edit before sending
- Option to delay 24 hours

## User Management

**Current Setup:**
- Using `admin_users` table from existing OSW admin system
- User identified by `slug` in URL
- Each user has their own CRM landing page

**Account Structure:**
| User | Slug | Company | Email |
|------|------|---------|-------|
| Rodolfo Alvarez | rodolfo | SSW | ralvarez@soilseedandwater.com |
| (future) | joe | UFE | joe@ufe.com |

## Data Storage

**Tables:**
- `admin_users` — CRM users (who captures leads)
- `representative_contacts` — Captured leads
  - Links to `admin_id` (who captured it)
  - Stores segment, lead source, notes
  - Tracks email status (sent/scheduled/skipped)

## Mobile Optimization

**Priority:** Mobile-first (90% of usage is at events on phone)

**Requirements:**
- Large touch targets (44x44px minimum)
- Camera integration for card capture
- Voice recording for notes
- Fast, simple flow (2-3 taps to capture)
- Works offline (queue submissions)

## Onboarding New Users

1. Create account in admin system
2. Set `slug` for URL
3. Configure email integration
4. Share CRM URL: `/crm/{company}/{slug}`

---

*Last updated: 2026-02-01*
*Author: Clawd (AI Assistant)*
