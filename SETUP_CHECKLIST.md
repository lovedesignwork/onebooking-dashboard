# OneBooking Dashboard - Setup Checklist

This document tracks all external service configurations required for the OneBooking Dashboard to function properly.

---

## Resend (Email Service)

Resend is used to send customer emails (pickup time notifications, confirmations) from brand-specific sender addresses.

### Account Setup
- [ ] Create Resend account at https://resend.com
- [ ] Get API Key from Resend dashboard

### Domain Verification
Each brand needs its domain verified to send emails from that domain.

| Domain | Status | DNS Records Added |
|--------|--------|-------------------|
| hanumanworldphuket.com | [ ] Verified | [ ] SPF, DKIM, DMARC |
| flyinghanuman.com | [ ] Verified | [ ] SPF, DKIM, DMARC |
| hanumanluge.com | [ ] Verified | [ ] SPF, DKIM, DMARC |
| onebooking.co (fallback) | [ ] Verified | [ ] SPF, DKIM, DMARC |

### Environment Variables (Vercel)
- [ ] `RESEND_API_KEY` - Added to Vercel production environment

### Sender Emails Configured
These are configured in `lib/email/config.ts`:
- [x] `support@hanumanworldphuket.com` (Hanuman World)
- [x] `support@flyinghanuman.com` (Flying Hanuman)
- [x] `support@hanumanluge.com` (Hanuman Luge)
- [x] `noreply@onebooking.co` (Default fallback)

---

## LINE Messaging API (Booking Notifications)

LINE is used to send instant booking notifications to a shared admin group chat.

### LINE Developers Console Setup
- [ ] Create LINE Developers account at https://developers.line.biz
- [ ] Create a new Provider (or use existing)
- [ ] Create a Messaging API Channel

### Channel Configuration
- [ ] Get Channel Access Token (long-lived)
- [ ] Enable Webhooks (optional, for getting Group ID)
- [ ] Note down Channel ID and Channel Secret

### LINE Group Setup
- [ ] Create LINE group for booking notifications
- [ ] Add the LINE bot to the group
- [ ] Get Group ID (bot receives this when added or when message is sent in group)

> **How to get Group ID:** 
> 1. Set up a webhook endpoint temporarily
> 2. Add bot to group - webhook receives `join` event with `groupId`
> 3. Or send a message in the group - webhook receives `message` event with `source.groupId`

### Environment Variables (Vercel)
- [ ] `LINE_CHANNEL_ACCESS_TOKEN` - Added to Vercel production environment
- [ ] `LINE_GROUP_ID` - Added to Vercel production environment

---

## Supabase (Database & Auth)

Supabase is the backend database and authentication provider.

### Project Setup
- [x] Create Supabase project
- [x] Database schema created (bookings, websites, sync_logs, admin_users tables)
- [x] Row Level Security (RLS) policies configured

### Environment Variables (Vercel)
- [x] `NEXT_PUBLIC_SUPABASE_URL` - Added to Vercel
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Added to Vercel
- [x] `SUPABASE_SERVICE_ROLE_KEY` - Added to Vercel

### Websites Table Data
API keys for each brand website:

| Website ID | Name | API Key Generated | API Key Shared |
|------------|------|-------------------|----------------|
| hanuman-world | Hanuman World | [x] Generated | [x] Shared with HW project |
| flying-hanuman | Flying Hanuman | [ ] Generated | [ ] Shared |
| hanuman-luge | Hanuman Luge | [ ] Generated | [ ] Shared |

---

## Vercel (Hosting)

### Deployment
- [x] GitHub repository connected
- [x] Auto-deploy on push to main branch
- [x] Custom domain configured (db.onebooking.co)

### Environment Variables Summary

| Variable | Added | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | [x] | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | [x] | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | [x] | Supabase service role key |
| `NEXT_PUBLIC_APP_URL` | [x] | https://db.onebooking.co |
| `RESEND_API_KEY` | [ ] | Resend API key for emails |
| `LINE_CHANNEL_ACCESS_TOKEN` | [ ] | LINE Messaging API token |
| `LINE_GROUP_ID` | [ ] | LINE group chat ID |

---

## Hanuman World Integration

Configuration needed in the Hanuman World Vercel project to sync bookings to OneBooking.

### Environment Variables (Hanuman World Vercel)
- [x] `ONEBOOKING_API_URL` = `https://db.onebooking.co`
- [x] `ONEBOOKING_API_KEY` = `hw_sk_live_5623c99495930dadafc8f3d67c8eee05b17aee5771cda897`
- [x] `WEBSITE_ID` = `hanuman-world`

### Database Trigger
- [x] PostgreSQL trigger (`pg_net`) configured to push bookings on creation

---

## Flying Hanuman Integration

Configuration needed in the Flying Hanuman Vercel project to sync bookings to OneBooking.

### Environment Variables (Flying Hanuman Vercel)
- [ ] `ONEBOOKING_API_URL` = `https://db.onebooking.co`
- [ ] `ONEBOOKING_API_KEY` = (generate from websites table)
- [ ] `WEBSITE_ID` = `flying-hanuman`

### Sync Implementation
- [ ] Booking sync code implemented
- [ ] Database trigger or API call configured

---

## Hanuman Luge Integration

Configuration needed in the Hanuman Luge Vercel project to sync bookings to OneBooking.

### Environment Variables (Hanuman Luge Vercel)
- [ ] `ONEBOOKING_API_URL` = `https://db.onebooking.co`
- [ ] `ONEBOOKING_API_KEY` = (generate from websites table)
- [ ] `WEBSITE_ID` = `hanuman-luge`

### Sync Implementation
- [ ] Booking sync code implemented
- [ ] Database trigger or API call configured

---

## Quick Reference - All Environment Variables

### OneBooking Dashboard (Vercel)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx

# App
NEXT_PUBLIC_APP_URL=https://db.onebooking.co

# Email (Resend)
RESEND_API_KEY=re_xxxxx

# LINE Messaging
LINE_CHANNEL_ACCESS_TOKEN=xxxxx
LINE_GROUP_ID=Cxxxxx
```

### Brand Websites (HW/FH/HL Vercel)
```env
ONEBOOKING_API_URL=https://db.onebooking.co
ONEBOOKING_API_KEY=xx_sk_live_xxxxx
WEBSITE_ID=hanuman-world  # or flying-hanuman, hanuman-luge
```

---

## Progress Summary

| Service | Status |
|---------|--------|
| Supabase | ✅ Complete |
| Vercel Hosting | ✅ Complete |
| Hanuman World Integration | ✅ Complete |
| Resend Email | ⏳ Pending domain verification |
| LINE Notifications | ⏳ Pending setup |
| Flying Hanuman Integration | ⏳ Not started |
| Hanuman Luge Integration | ⏳ Not started |

---

*Last updated: February 2026*
