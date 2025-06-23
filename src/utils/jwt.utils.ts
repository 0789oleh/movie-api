// src/utils/jwt.utils.ts
import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { Config } from '../config/env.config';

// Генерация access токена
export const generateAccessToken = async (userId: number): Promise<string> => {
  if (!Config.JWT_ACCESS_SECRET) {
    throw new Error('JWT_ACCESS_SECRET is not configured');
  }
  
  const secret = new TextEncoder().encode(Config.JWT_ACCESS_SECRET);
  
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secret);
};

// Генерация refresh токена
export const generateRefreshToken = async (userId: number): Promise<string> => {
  if (!Config.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not configured');
  }
  
  const secret = new TextEncoder().encode(Config.JWT_REFRESH_SECRET);
  
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
};

// Верификация токена
export const verifyToken = async (
  token: string, 
  tokenType: 'access' | 'refresh'
): Promise<JWTPayload> => {
  const secret = tokenType === 'access' 
    ? Config.JWT_ACCESS_SECRET 
    : Config.JWT_REFRESH_SECRET;
  
  if (!secret) {
    throw new Error(`${tokenType.toUpperCase()}_SECRET is not configured`);
  }
  
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ['HS256'] }
    );
    return payload;
  } catch (error) {
    console.error(`JWT ${tokenType} verification failed:`, error);
    throw error;
  }
};