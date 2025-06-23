// test-jwt.ts
import jwt from 'jsonwebtoken';
import { Config } from './config/env.config';

const token = "ваш_тестовый_токен";
const secret = Config.JWT_ACCESS_SECRET;

console.log('Secret:', secret);
console.log('Secret length:', secret?.length);

try {
  const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
  console.log('Decoded:', decoded);
} catch (error) {
  console.error('Verification failed:', error);
  
  // Попробуем разные варианты
  try {
    const decoded = jwt.verify(token, secret + ' ', { algorithms: ['HS256'] });
    console.log('Worked with trailing space');
  } catch {}
  
  try {
    const decoded = jwt.verify(token, secret.trim(), { algorithms: ['HS256'] });
    console.log('Worked with trim');
  } catch {}
  
  try {
    const decoded = jwt.verify(token, Buffer.from(secret, 'base64'), { algorithms: ['HS256'] });
    console.log('Worked with base64 decode');
  } catch {}
}