import { Router } from 'express';

const router = Router();

// Trivia leads endpoints disabled temporarily
router.post('/trivia-leads', (req, res) => {
  res.status(503).json({ error: 'Trivia feature temporarily disabled' });
});

router.get('/trivia-leads', (req, res) => {
  res.status(503).json({ error: 'Trivia feature temporarily disabled' });
});

export default router;