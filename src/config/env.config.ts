import dotenv from 'dotenv';
dotenv.config();

export const Config = {
  PORT: process.env.PORT || 8050,
  DB_DIALECT: process.env.DB_DIALECT || 'sqlite',
  DB_STORAGE: process.env.DB_STORAGE || './db.sqlite',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'simple_secret_key_32_chars_long_1234',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'simple_secret_key_32_chars_long_1234', 
  JWT_EXPIRES: process.env.JWT_EXPIRES || '1d',
  LOG_LEVEL_CONSOLE: process.env.LOG_LEVEL_CONSOLE || 'debug',
  LOG_LEVEL_FILE: process.env.LOG_LEVEL_FILE || 'info',
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
};