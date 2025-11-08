import { Router } from 'express';
import { createLogger } from '../utils/logger.js';

const router = Router();
const logger = createLogger();

router.get('/', async (req, res) => {
  try {
    const { productName } = req.query;

    if (!productName || typeof productName !== 'string') {
      return res.status(400).json({ error: 'Product name is required' });
    }

    logger.info('Searching alternatives:', { productName });

    // TODO: Implement actual alternatives search
    // This is a placeholder response
    const result = {
      alternatives: [],
      sortedBy: 'price_asc',
    };

    res.json(result);
  } catch (error) {
    logger.error('Alternatives search error:', error);
    res.status(500).json({ error: 'Failed to search alternatives' });
  }
});

export default router;
