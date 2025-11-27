import express from 'express';
import { findById, findAll } from '../controllers/users.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';


const router = express.Router();

router.get('/allUsers', authMiddleware, findAll);
router.get('/:id', authMiddleware, findById);

export default router;