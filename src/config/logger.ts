import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { Config } from './env.config';

// Logging levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

// Настройка транспортов
const transports = [
  new winston.transports.Console({
    level: Config.LOG_LEVEL_CONSOLE,
    format: logFormat,
  }),
  // Запись в файл (ежедневная ротация)
  new DailyRotateFile({
    filename: 'logs/app-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m', // Максимальный размер файла 20MB
    maxFiles: '14d', // Хранить логи за 14 дней
    level: Config.LOG_LEVEL_FILE,
    format: logFormat,
  }),
];

// Создаем логгер
const logger = winston.createLogger({
  levels: logLevels,
  transports,
});

export default logger;