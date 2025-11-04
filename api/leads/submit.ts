import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  processLeadSubmission,
  LeadSubmissionError,
} from '../../server/services/leadSubmission.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let payload: unknown = req.body ?? {};

  if (typeof payload === 'string') {
    try {
      payload = payload ? JSON.parse(payload) : {};
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }
  }

  try {
    const result = await processLeadSubmission(
      payload as Record<string, unknown>
    );
    return res.status(200).json({
      success: true,
      message: result.message,
      leadId: result.leadId,
    });
  } catch (error: unknown) {
    if (error instanceof LeadSubmissionError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error('Serverless lead submission error:', error);
    return res.status(500).json({ error: 'Failed to process lead' });
  }
}
