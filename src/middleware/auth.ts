import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Config } from '../config/env.config';
import { verifyToken } from '../utils/jwt.utils';

// Расширение типа Request для добавления свойства user
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
  
  // 2. Проверяем наличие и формат заголовка
  if (!authHeader) {
    res.status(401).json({ error: 'Authorization header is missing' });
    return;
  }
  
  // 3. Проверяем формат: должен быть "Bearer <token>"
  const [bearer, token] = authHeader.split(' ');
  
  if (bearer !== 'Bearer' || !token) {
    res.status(401).json({ error: 'Invalid authorization format. Expected: Bearer <token>' });
    return;
  }
  
  try {
    // 4. Верифицируем токен
    const decoded = verifyToken(token, 'access') as jwt.JwtPayload;
    
    // 5. Проверяем наличие userId в payload
    if (typeof decoded.userId !== 'number') {
      res.status(401).json({ error: 'Invalid token payload: userId is missing or not a number' });
      return;
    }
    
    // 6. Присваиваем пользователя объекту запроса
    req.user = {
      id: decoded.userId
    };
    
    // 7. Передаем управление следующему middleware/контроллеру
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    
    // 8. Детальная обработка ошибок верификации
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    
    // 9. Обработка прочих ошибок
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

export default authMiddleware;