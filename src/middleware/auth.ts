import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Config } from '../config/env.config';
import { verifyToken } from '../utils/jwt.utils';
import logger from '../config/logger';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
      };
    }
  }
}


const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // 1. Получаем заголовок Authorization
  const authHeader = req.headers.authorization;
  logger.info('Full authorization header:', authHeader);
  // 2. Проверяем наличие и формат заголовка
  if (!authHeader) {
    res.status(401).json({ error: 'Authorization header is missing' });
    return;
  }
  
  const token = authHeader;
  
  try {
    const decoded = verifyToken(token, 'access');
    
    // Payload check
    if (typeof decoded === 'object' && 'userId' in decoded && typeof decoded.userId === 'number') {
      req.user = {
        id: decoded.userId
      };
      next();
    } else {
      logger.error('Invalid token payload:', decoded);
      res.status(401).json({ 
        error: 'Invalid token payload',
        details: `Payload must contain numeric userId. Received: ${JSON.stringify(decoded)}`
      });
    }
  
  } catch (error) {
    logger.error('JWT Verification Error:', error);
    
    // 8. Детальная обработка ошибок верификации
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    
    // 7. Все остальные ошибки также возвращают 401
    res.status(401).json({ error: 'Authentication failed', details: error });
  }
};

export default authMiddleware;