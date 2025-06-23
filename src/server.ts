import dotenv from 'dotenv';
dotenv.config(); 
import  app from './app';
import  sequelize, { initializeDatabase } from './config/database';
import { Config } from './config/env.config';

const PORT = Config.PORT;

const requiredEnvVars = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  // Добавьте другие важные переменные
]

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ FATAL ERROR: ${varName} is not defined`);
    process.exit(1);
  }
});

async function initializeApp() {
  try {
    await sequelize.authenticate(); // Проверка подключения
    await initializeDatabase();
    console.log('Loaded models:', Object.keys(sequelize.models)); // Отладка
    await sequelize.sync({ force: process.env.NODE_ENV === 'development' }); // Синхронизация моделей
    console.log('Database connected and models synced');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

async function bootstrap() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');
    
    await sequelize.sync();
    console.log('Database synchronized');
    

    initializeApp().then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

bootstrap();