import express from 'express';
import { register } from '../controllers/auth.controller';

const router = express.Router();

router.post('/', register);

export default router;