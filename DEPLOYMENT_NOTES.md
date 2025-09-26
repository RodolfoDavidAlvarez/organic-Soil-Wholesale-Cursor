# Deployment Notes - Trivia Webhook

## IMPORTANT: Set Environment Variable in Vercel

Before deploying, you MUST add the webhook URL to Vercel environment variables:

1. Go to your Vercel project dashboard
2. Click on "Settings" → "Environment Variables"
3. Add the following:
   - **Name**: `TRIVIA_WEBHOOK_URL`
   - **Value**: `https://hook.us1.make.com/g9vcrnuynwozkrtont4ptfte1pp89bno`
   - **Environment**: Select all (Production, Preview, Development)

## What's Changed

- Trivia leads now bypass Supabase and send directly to webhook
- Webhook receives:
  - All lead data (name, email, score, interests)
  - Pre-formatted HTML email template
  - Lead scoring (hot/warm/cold)
  - Engagement level (high/medium/low)

## Testing in Production

After deployment:
1. Visit `/trivia` on your production site
2. Complete the quiz with test data
3. Check your Make.com scenario for the incoming webhook
4. Verify the data and HTML email are received correctly

## Webhook Payload Structure

```json
{
  "event": "trivia_lead_captured",
  "timestamp": "2025-01-26T...",
  "lead": {
    "name": "John Doe",
    "email": "john@example.com",
    "interests": ["Vegetables", "Cannabis"],
    "score": 4,
    "leadQuality": "hot",
    "engagementLevel": "high"
  },
  "emailHtml": "<!DOCTYPE html>..."
}
```

## Troubleshooting

If webhook doesn't fire in production:
- Check Vercel environment variables are set
- Check Vercel function logs for errors
- Ensure Make.com scenario is active