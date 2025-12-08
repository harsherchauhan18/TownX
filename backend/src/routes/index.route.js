import { Router } from 'express';
import userRoutes from './user.routes.js';
import recommenderRoutes from '../recommender/recommender.routes.js';
import llmRoutes from './llm.routes.js';
import reviewRoutes from './review.routes.js';

const router = Router();

router.use('/user', userRoutes);
router.use('/users', userRoutes); // Alias for compatibility with frontend
router.use('/recommender', recommenderRoutes);
router.use('/llm', llmRoutes);
router.use('/reviews', reviewRoutes);

export default router;
