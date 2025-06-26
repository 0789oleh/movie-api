import dotenv from 'dotenv';
dotenv.config(); 
import  app from './app';
import  sequelize, { initializeDatabase } from './config/database';
import { Config } from './config/env.config';
import logger from './config/logger';

const PORT = Config.PORT;

const requiredEnvVars = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  // Добавьте другие важные переменные
]

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    logger.error(`❌ FATAL ERROR: ${varName} is not defined`);
    process.exit(1);
  }
});

async function initializeApp() {
  try {
    await sequelize.authenticate(); // Connection check
    await initializeDatabase();
    logger.info('Loaded models:', Object.keys(sequelize.models)); 
    await sequelize.sync({ force: process.env.NODE_ENV === 'development' }); // 
    logger.info('Database connected and models synced');
  } catch (error) {
    logger.info('Unable to connect to the database:', error);
    process.exit(1);
  }
}

async function bootstrap() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');
    
    await sequelize.sync();
    logger.info('Database synchronized');
    

    initializeApp().then(() => {
      app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
      });
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
}

bootstrap();