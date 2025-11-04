import { Router } from 'express';
import {
  processLeadSubmission,
  LeadSubmissionError
} from '../services/leadSubmission.js';

const router = Router();

// Submit lead
router.post('/submit', async (req, res) => {
  try {
    console.log('Lead submission request received:', req.body);
    const result = await processLeadSubmission(req.body);

    res.json({
      success: true,
      message: result.message,
      leadId: result.leadId
    });
  } catch (error) {
    console.error('Lead submission error:', error);

    if (error instanceof LeadSubmissionError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to process lead' });
    }
  }
});

export default router;
