import { Sequelize } from 'sequelize-typescript';
import { Config } from './env.config';
import { initializeModels } from '../models'; // Путь к вашему index.ts
import * as models from '../models';
import logger from './logger';

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: Config.DB_STORAGE,
  logging: process.env.LOG_LEVEL === 'debug' ? logger.info : false,
  // УБРАТЬ автоматическую загрузку моделей отсюда!
});

export async function initializeDatabase() {
  logger.debug(`ACCESS_TOKEN_SECRET exists: ${Config.JWT_ACCESS_SECRET}`);
  logger.debug(`REFRESH_TOKEN_SECRET exists: ${Config.JWT_REFRESH_SECRET}`);
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');
    
    if (sequelize.getDialect() === 'sqlite') {
      await sequelize.query('PRAGMA foreign_keys = OFF');
    }
    // Инициализация моделей БЕЗ ассоциаций
    initializeModels(sequelize);

    if (sequelize.getDialect() === 'sqlite') {
      await sequelize.query('PRAGMA foreign_keys = ON');
    }

    
    // Синхронизация структуры БД
    await sequelize.sync({ alter: false });
    logger.debug('Database synchronized');
    
    // Теперь устанавливаем ассоциации ПОСЛЕ синхронизации
    setupAssociations();
    logger.debug('Associations established');
    
    logger.debug('Loaded models:', sequelize.modelManager.models.map(m => m.name));
  } catch (error) {
    logger.error('Database initialization failed:', error);
    process.exit(1);
  }
}

function setupAssociations() {
  // Импортируем модели через sequelize.modelManager
  const { Movie, User, Session, Actor, MovieActor, RefreshToken} = sequelize.models;
  
    // Many-to-Many Movie <=> Actor
    models.Movie.belongsToMany(models.Actor, {
      through: models.MovieActor,
      foreignKey: 'movieId',
      otherKey: 'ActorId'
    });
    
    models.Actor.belongsToMany(models.Movie, {
      through: models.MovieActor,
      foreignKey: 'ActorId',
      otherKey: 'movieId'
    });
    
    // Дополнительные связи для промежуточной модели
    models.MovieActor.belongsTo(models.Movie, {
      foreignKey: 'movieId'
    });
    
    models.MovieActor.belongsTo(models.Actor, {
      foreignKey: 'ActorId'
    });

    models.RefreshToken.belongsTo(models.RefreshToken, {
      foreignKey: 'userId'
    })

    models.Session.belongsTo(models.User, {
      foreignKey: 'userId'
    })

    models.User.hasMany(models.RefreshToken, {
      foreignKey: 'userId',
      sourceKey: 'id' 
    })

    models.User.hasMany(models.Session, {
      foreignKey: 'userId',
      sourceKey: 'id' 
    })
  
  // Добавьте ВСЕ ваши ассоциации здесь
}

export default sequelize;