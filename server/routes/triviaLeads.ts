import { Router, Request, Response } from 'express';
import { sendAdminTriviaLeadNotification } from '../services/email.js';

const router = Router();

// HTML Email template for admin notification
const createAdminEmailHTML = (data: any) => {
  const { name, email, interests, score, answers, submittedAt } = data;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>New Trivia Lead</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
            margin: -30px -30px 30px -30px;
        }
        h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .lead-info {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .info-row {
            margin-bottom: 10px;
            display: flex;
            align-items: center;
        }
        .label {
            font-weight: 600;
            color: #4b5563;
            width: 120px;
        }
        .value {
            color: #1f2937;
        }
        .score-badge {
            display: inline-block;
            background: #059669;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: 600;
            margin-left: 10px;
        }
        .interests-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 5px;
        }
        .interest-tag {
            background: #e5e7eb;
            color: #374151;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 14px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .cta-button {
            background: #059669;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 New Trade Show Trivia Lead!</h1>
        </div>
        
        <div class="lead-info">
            <div class="info-row">
                <span class="label">Name:</span>
                <span class="value">${name}</span>
            </div>
            <div class="info-row">
                <span class="label">Email:</span>
                <span class="value"><a href="mailto:${email}">${email}</a></span>
            </div>
            <div class="info-row">
                <span class="label">Quiz Score:</span>
                <span class="value">${score}/5</span>
                <span class="score-badge">${score === 5 ? '⭐ Perfect Score!' : score >= 4 ? '🏆 High Score!' : score >= 3 ? '👍 Good Score' : '🌱 Learning'}</span>
            </div>
            <div class="info-row">
                <span class="label">Submitted:</span>
                <span class="value">${new Date(submittedAt).toLocaleString()}</span>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h3 style="color: #1f2937; margin-bottom: 10px;">Growing Interests:</h3>
            <div class="interests-list">
                ${interests.map((interest: string) => `<span class="interest-tag">${interest}</span>`).join('')}
            </div>
        </div>
        
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #4b5563;">
                <strong>Lead Quality:</strong> ${score >= 4 ? '🔥 Hot Lead' : score >= 3 ? '🟡 Warm Lead' : '❄️ Cold Lead'}<br>
                <strong>Engagement Level:</strong> ${interests.length > 3 ? 'High' : interests.length > 1 ? 'Medium' : 'Low'}
            </p>
        </div>
        
        <a href="mailto:${email}" class="cta-button">Contact Lead</a>
        
        <div class="footer">
            <p>This lead was captured at the Trade Show 2025 trivia game.</p>
            <p style="color: #9ca3af;">Organic Soil Wholesale Lead Management System</p>
        </div>
    </div>
</body>
</html>
`;
};

router.post('/trivia-leads', async (req: Request, res: Response) => {
  try {
    const { name, email, interests, score, answers } = req.body;

    // Validate required fields
    if (!name || !email || !interests || score === undefined || !answers) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    const submittedAt = new Date().toISOString();

    // Prepare webhook payload
    const webhookPayload = {
      event: 'trivia_lead_captured',
      timestamp: submittedAt,
      lead: {
        name,
        email,
        interests,
        score,
        answers,
        submittedAt,
        eventName: 'Trade Show 2025',
        prizeCode: 'SOIL20',
        leadQuality: score >= 4 ? 'hot' : score >= 3 ? 'warm' : 'cold',
        engagementLevel: interests.length > 3 ? 'high' : interests.length > 1 ? 'medium' : 'low'
      },
      emailHtml: createAdminEmailHTML({ name, email, interests, score, answers, submittedAt })
    };

    // Send admin notification email
    try {
      await sendAdminTriviaLeadNotification({
        name,
        email,
        interests,
        score,
        answers,
        submittedAt
      });
      console.log('Admin notification email sent for trivia lead:', email);
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
      // Don't fail the main request if email fails
    }

    // Return success to the client
    return res.json({ 
      success: true, 
      message: 'Lead captured successfully',
      data: {
        name,
        email,
        score,
        interests
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

// Get leaderboard endpoint (using in-memory data for now)
router.get('/trivia-leads/leaderboard', async (req: Request, res: Response) => {
  // Return empty leaderboard for now since we're not using database
  return res.json({ 
    success: true, 
    data: []
  });
});

export default router;