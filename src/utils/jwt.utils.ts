import jwt from 'jsonwebtoken';
import { Config } from '../config/env.config';
import logger from '../config/logger';

// Token validation check
const isValidToken = (token: string): boolean => {
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
};

// Access token generation
export const generateAccessToken = (userId: number): string => {
  if (!Config.JWT_ACCESS_SECRET) {
    throw new Error('JWT_ACCESS_SECRET is not configured');
  }
  
  try {
    return jwt.sign(
      { userId },
      Config.JWT_ACCESS_SECRET,
      { algorithm: 'HS256', expiresIn: '1h' }
    );
  } catch (error) {
    logger.error('Access token generation failed:', error);
    throw new Error('Token generation error');
  }
};


// Refresh token generation
export const generateRefreshToken = (userId: number): string => {
  if (!Config.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not configured');
  }
  
  try {
    return jwt.sign(
      { userId },
      Config.JWT_REFRESH_SECRET,
      { algorithm: 'HS256', expiresIn: '7d' }
    );
  } catch (error) {
    logger.error('Refresh token generation failed:', error);
    throw new Error('Token generation error');
  }
};

// Token verification
export const verifyToken = (
  token: string, 
  tokenType: 'access' | 'refresh'
): jwt.JwtPayload => {
  if (!isValidToken(token)) {
    throw new Error('Invalid token format');
  }
  
  const secret = tokenType === 'access' 
    ? Config.JWT_ACCESS_SECRET 
    : Config.JWT_REFRESH_SECRET;
  
  if (!secret) {
    throw new Error(`${tokenType.toUpperCase()}_SECRET is not configured`);
  }
  
  try {
    const payload = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      ignoreExpiration: false
    }) as jwt.JwtPayload;

    // Диагностика
    logger.info(`Verified ${tokenType} token payload:`, payload);
    logger.info(`Payload userId type: ${typeof payload.userId}, value: ${payload.userId}`);
    
    return payload;
  } catch (error) {
    logger.error(`JWT ${tokenType} verification failed:`, error);
    
    // Error details
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token signature');
    }
    
    throw new Error('Token verification error');
  }
};
