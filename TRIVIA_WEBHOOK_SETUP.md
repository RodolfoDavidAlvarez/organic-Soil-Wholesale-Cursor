# Trivia Lead Webhook Setup

The trivia game now sends lead data to a webhook URL that you configure. This allows integration with email services, CRMs, and automation platforms.

## Quick Setup

1. **Add webhook URL to environment variables:**
   ```bash
   # In server/.env
   TRIVIA_WEBHOOK_URL="https://your-webhook-endpoint.com/webhook"
   ```

2. **Restart the server:**
   ```bash
   npm run dev
   ```

3. **Test the integration:**
   - Complete the trivia game at `/trivia`
   - Or run: `node test-webhook.js`

## Webhook Payload

When a user completes the trivia game, this JSON is sent to your webhook:

```json
{
  "event": "trivia_lead_captured",
  "timestamp": "2025-01-26T10:30:45.123Z",
  "lead": {
    "name": "John Smith",
    "email": "john@example.com",
    "interests": ["Vegetables", "Cannabis", "Landscaping"],
    "score": 4,
    "answers": [0, 2, 3, 1, 2],
    "submittedAt": "2025-01-26T10:30:45.123Z",
    "eventName": "Trade Show 2025",
    "prizeCode": "SOIL20",
    "leadQuality": "hot",        // hot/warm/cold based on score
    "engagementLevel": "high"    // high/medium/low based on interests
  },
  "emailHtml": "<!DOCTYPE html>..."  // Fully styled HTML email
}
```

## Lead Scoring

- **Lead Quality:**
  - 🔥 Hot: Score 4-5/5
  - 🟡 Warm: Score 3/5
  - ❄️ Cold: Score 0-2/5

- **Engagement Level:**
  - High: 4+ interests selected
  - Medium: 2-3 interests
  - Low: 0-1 interests

## HTML Email Template

The `emailHtml` field contains a beautifully designed email with:
- Lead contact information
- Quiz score with visual indicators
- Selected interests as tags
- Lead quality assessment
- Direct "Contact Lead" button

Preview: Open `trivia-webhook-preview.html` in your browser

## Integration Examples

### Make.com (Integromat)
1. Create new scenario
2. Add "Webhooks" → "Custom webhook" trigger
3. Copy the webhook URL to `.env`
4. Add modules to process the data

### Zapier
1. Create new Zap
2. Choose "Webhooks by Zapier" trigger
3. Select "Catch Hook"
4. Copy webhook URL to `.env`
5. Add actions (Email, CRM, etc.)

### Custom Integration
```javascript
app.post('/webhook', (req, res) => {
  const { event, lead, emailHtml } = req.body;
  
  if (event === 'trivia_lead_captured') {
    // Send email to admin
    await sendEmail({
      to: 'admin@company.com',
      subject: `New ${lead.leadQuality} lead: ${lead.name}`,
      html: emailHtml
    });
    
    // Add to CRM
    await crm.createContact({
      name: lead.name,
      email: lead.email,
      tags: lead.interests,
      customFields: {
        quizScore: lead.score,
        leadQuality: lead.leadQuality
      }
    });
  }
  
  res.json({ success: true });
});
```

## Testing Tools

- **webhook.site** - Free webhook testing
- **RequestBin** - Inspect HTTP requests  
- **ngrok** - Test local webhooks

## Troubleshooting

1. **Webhook not firing?**
   - Check `TRIVIA_WEBHOOK_URL` is set in `server/.env`
   - Ensure server was restarted after adding URL
   - Check server logs for errors

2. **Testing locally?**
   - Use ngrok to expose local webhook
   - Or use webhook.site for quick testing

3. **Need to modify the payload?**
   - Edit `server/routes/triviaLeads.ts`
   - Update the `webhookPayload` object
   - Rebuild: `cd server && npm run build`