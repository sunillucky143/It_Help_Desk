import { Router, Request, Response } from 'express';
import { orchestrateTurn, getChatHistory, clearSession } from '../services/agents/orchestrator';

const router = Router();

// Send a message to the chatbot
router.post('/message', async (req: Request, res: Response) => {
  try {
    const { message, userId } = req.body;

    if (!message || !userId) {
      return res.status(400).json({ error: 'message and userId are required' });
    }

    const result = await orchestrateTurn(message, userId);

    res.json({
      reply: result.reply,
      intent: result.intent,
      agent: result.agent,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('Chatbot message error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get chat history for a user
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const history = await getChatHistory(userId);

    res.json({ history });
  } catch (error: any) {
    console.error('Get history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear chat history for a user
router.delete('/history/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    clearSession(userId);

    res.json({ message: 'Chat history cleared successfully' });
  } catch (error: any) {
    console.error('Clear history error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
