import  Op from 'sequelize-typescript';
import { Attributes, BulkCreateOptions, CreationAttributes, Optional, QueryTypes } from 'sequelize'
import { Transaction } from 'sequelize';
import WhereOptions from 'sequelize-typescript';
import Movie from '../models/movie.model';
import Actor, { ActorAttributes } from '../models/actor.model';
import { CreateMovieDto, MovieSearchDto, UpdateMovieDto } from '../dto/movie.dto';
import { sequelize } from '../config/database';
import { createModelWrapper } from '../models/model-utils';
import { NullishPropertiesOf } from 'sequelize/types/utils';
import { MovieActor } from '../models';
import logger from '../config/logger';


const movieModel = createModelWrapper(Movie);
const actorModel = createModelWrapper(Actor);
const movieActorModel = createModelWrapper(MovieActor);


interface GetMoviesOptions {
  sort?: string;
  order?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}


class MovieService {

  
  async createMovie(data: CreateMovieDto, transaction?: Transaction): Promise<Movie> {
    const { title, year, format, actors } = data;
  
    const t = transaction || await sequelize.transaction();
  
    try {
      const movie = await movieModel.create({ title, year, format }, { transaction: t });
  
      const actorEntities = await Promise.all(
        actors.map(name => 
          Actor.findOrCreate({
            where: { name },
            defaults: { name } as CreationAttributes<Actor>, // Используем CreationAttributes
            transaction: t,
          })
        )
      );
  
      await movie.$set('actors', actorEntities.map(([actor]) => actor), { transaction: t });
  
      if (!transaction) {
        await t.commit();
      }
  
      return movie;
    } catch (error) {
      if (!transaction) {
        await t.rollback();
      }
      throw error;
    }
  }
  

  async searchMovies(options: GetMoviesOptions): Promise<{
    data: any[];
    meta: { total: number };
    status: number;
  }> {
    const { sort = 'year', order = 'ASC', limit = 10, offset = 0 } = options;
  
    // Валидация сортировки
    const validSortFields = ['title', 'year', 'format'];
    const sortField = validSortFields.includes(sort) ? sort : 'year';
  
    // Получаем общее количество фильмов
    const total = await Movie.count();
  
    // Получаем фильмы с актерами
    const movies = await Movie.findAll({
      attributes: ['id', 'title', 'year', 'format', 'createdAt', 'updatedAt'],
      order: [[sortField, order]],
      limit,
      offset,
      include: [
        {
          model: Actor,
          attributes: ['name'],
          through: { attributes: [] }, // Исключаем атрибуты промежуточной таблицы
        },
      ],
    });
  
    // Форматируем данные
    const formattedMovies = movies.map(movie => ({
      id: movie.id,
      title: movie.title,
      year: movie.year,
      format: movie.format,
      createdAt: movie.createdAt,
      updatedAt: movie.updatedAt,
      actors: movie.actors?.map(actor => actor.name) || [], // Добавляем массив имен актеров
    }));
  
    return {
      data: formattedMovies,
      meta: { total },
      status: 1,
    };
  }
  

  async updateMovie(id: number, data: UpdateMovieDto, transaction?: Transaction): Promise<Movie> {
    const t = transaction || await sequelize.transaction();
  
    try {
      // Находим фильм без загрузки актеров
      const movie = await Movie.findByPk(id, { transaction });
      if (!movie) {
        throw new Error('Movie not found');
      }
  
      // Обновляем поля фильма
      const updateData: Partial<Movie> = {};
      if (data.title) updateData.title = data.title;
      if (data.year) updateData.year = data.year;
      if (data.format) updateData.format = data.format;
  
      await movie.update(updateData, { transaction });
  
      // Обновляем актеров, если переданы
      if (data.actors) {
        const uniqueActors = [...new Set(data.actors)];
        logger.info('Unique actors for update:', uniqueActors);
  
        // Находим существующих актеров
        const existingActors = await Actor.findAll({
          where: { name: uniqueActors },
          transaction,
        });
  
        const existingActorNames = existingActors.map(actor => actor.name);
        const newActorNames = uniqueActors.filter(name => !existingActorNames.includes(name));
  
        // Создаем новых актеров
        const newActors = await Promise.all(
          newActorNames.map(name =>
            actorModel.create({ name }, { transaction })
          )
        );
  
        const allActors = [...existingActors, ...newActors];
        logger.info('All actor IDs:', allActors.map(actor => actor.id));
  
        // Получаем текущие связи
        const currentAssociations = await movieActorModel.findAll({
          where: { movieId: id },
          transaction,
        });
        const currentActorIds = currentAssociations.map(assoc => assoc.actorId);
  
        // Определяем актеров для добавления и удаления
        const newActorIds = allActors.map(actor => actor.id);
        const actorIdsToAdd = newActorIds.filter(id => !currentActorIds.includes(id));
        const actorIdsToRemove = currentActorIds.filter(id => !newActorIds.includes(id));
  
        // Удаляем старые связи
        if (actorIdsToRemove.length > 0) {
          await MovieActor.destroy({
            where: { movieId: id, actorId: actorIdsToRemove },
            transaction,
          });
        }
  
        // Добавляем новые связи
        if (actorIdsToAdd.length > 0) {
          const records: ReadonlyArray<CreationAttributes<MovieActor>> = actorIdsToAdd.map(actorId => {
            return {
              movieId: id,
              actorId: actorId,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as CreationAttributes<MovieActor>;
          });
          const options: BulkCreateOptions<Attributes<MovieActor>> = {
            transaction,
            validate: true,
          };
          await movieActorModel.bulkCreate(records, options);
        }
      }
  
      // Загружаем фильм с актерами
      const updatedMovie = await Movie.findByPk(id, {
        attributes: ['id', 'title', 'year', 'format', 'createdAt', 'updatedAt'],
        include: [
          {
            model: Actor,
            attributes: ['name'],
            through: { attributes: [] },
          },
        ],
        transaction,
      });
  
      if (!updatedMovie) {
        throw new Error('Movie not found after update');
      }
  
      if (!transaction) {
        await t.commit();
      }
  
      return updatedMovie;
    } catch (error) {
      if (!transaction) {
        await t.rollback();
      }
      logger.error('Update movie error:', error);
      throw error;
    }
  }
  
  async findMovieById(id: number) { 
    return movieModel.findByPk(id);
  }

  async removeMovie(id: number): Promise<boolean> {
    const transaction = await sequelize.transaction();
    
    try {
        const movie = await Movie.findByPk(id, {
            include: [Actor],
            transaction
        });

        if (!movie) {
            await transaction.rollback();
            return false;
        }

        // Удаление связей
        await (movie as any).removeActors(movie.actors, { transaction });
        
        await movie.destroy({ transaction });
        
        await transaction.commit();
        return true;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
  }

  async importMoviesFromFile(
    content: string,
    transaction?: Transaction
  ): Promise<{ importedCount: number; failedEntries: any[] }> {
    const createdTransaction = !transaction;
    let internalTransaction = transaction;
    
    if (createdTransaction) {
      internalTransaction = await Movie.sequelize!.transaction();
    }

    try {
      const failedEntries: any[] = [];
      let importedCount = 0;
      
      // Разделение на блоки по двум переносам строки
      const movieBlocks = content.trim().split(/\n\s*\n/);
      
      for (const block of movieBlocks) {
        try {
          const movieData = this.parseMovieBlock(block);
          await this.createMovie(movieData, internalTransaction);
          importedCount++;
        } catch (error) {
          failedEntries.push({
            block,
            error: (error as Error).message
          });
        }
      }
      
      if (createdTransaction) {
        await internalTransaction!.commit();
      }
      
      return { importedCount, failedEntries };
    } catch (error) {
      if (createdTransaction && internalTransaction) {
        await internalTransaction.rollback();
      }
      throw error;
    }
  }

  private parseMovieBlock(block: string): CreateMovieDto {
    const lines = block.split('\n');
    const data: Partial<CreateMovieDto> = {};
    
    for (const line of lines) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      
      switch (key.trim().toLowerCase()) {
        case 'title':
          data.title = value;
          break;
        case 'release year':
          const year = parseInt(value, 10);
          if (isNaN(year)) throw new Error(`Invalid year: ${value}`);
          data.year = year;
          break;
        case 'format':
          data.format = value; //Type 'string' is not assignable to type 'Movie'.ts(2322)
          break;
        case 'stars':
          data.actors = value.split(',').map(s => s.trim());
          break;
      }
    }
    
    // Проверка обязательных полей
    if (!data.title || !data.year || !data.format || !data.actors) {
      throw new Error('Missing required movie data');
    }
    
    return data as CreateMovieDto;
  }

}

export default MovieService;