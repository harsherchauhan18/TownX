import { Router } from 'express';
import userRoutes from './user.routes.js';
import recommenderRoutes from '../recommender/recommender.routes.js';

const router = Router();

router.use('/user', userRoutes);
router.use('/recommender', recommenderRoutes);

export default router;
