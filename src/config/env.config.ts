import dotenv from 'dotenv';
dotenv.config();

export const Config = {
  PORT: process.env.PORT || 3000,
  DB_DIALECT: process.env.DB_DIALECT || 'sqlite',
  DB_STORAGE: process.env.DB_STORAGE || './db.sqlite',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'passcode123',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'passcode123', 
  JWT_EXPIRES: process.env.JWT_EXPIRES || '1d',
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
};