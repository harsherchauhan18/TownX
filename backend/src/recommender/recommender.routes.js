import { Router } from 'express';
const router = Router();
import controller from './recommender.controller.js'; // fixed extension

// POST /api/recommender/recommend
router.post('/recommend', controller.recommend);

// optional: health
router.get('/health', (req, res) => res.json({ ok: true }));

export default router;
