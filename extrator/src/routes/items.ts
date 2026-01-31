import { Router } from 'express';
import { loadItems } from '../utils/item-loader';

const router = Router();

router.get('/', (req, res) => {
  try {
    const items = loadItems();
    res.json({ items, count: Object.keys(items).length });
  } catch (error) {
    console.error('Error loading items:', error);
    res.status(500).json({ error: 'Failed to load items' });
  }
});

export default router;
