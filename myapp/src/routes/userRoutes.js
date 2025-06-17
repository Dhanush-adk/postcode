import { Router } from 'express';
import { getProfile } from '../controllers/userController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const r = Router();
r.get('/user/profile', authMiddleware, getProfile);
export default r;
