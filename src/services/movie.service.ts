import { Attributes, Op, BulkCreateOptions, CreationAttributes, Optional, QueryTypes } from 'sequelize';
import { Transaction } from 'sequelize';
import WhereOptions from 'sequelize-typescript';
import Movie from '../models/movie.model';
import Actor, { ActorAttributes } from '../models/actor.model';
import { CreateMovieDto, MovieResponseDto, MovieSearchDto, UpdateMovieDto } from '../dto/movie.dto';
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
  
  async searchMovies(dto: MovieSearchDto & { caseSensitive?: boolean }): Promise<{
    data: MovieResponseDto[];
    meta: { total: number };
    status: number;
  }> {
    const { title, actor, search, sort = 'title', order = 'ASC', limit = 10, offset = 0, caseSensitive = false } = dto;
  
    const validSortFields = ['title', 'year', 'id', 'createdAt'];
    const sortField = validSortFields.includes(sort) ? sort : 'title';
    const orderDirection = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const sortExpression = caseSensitive || sortField !== 'title' ? `m.${sortField}` : `LOWER(m.${sortField})`;
  
    // Формируем условия WHERE
    const whereConditions: string[] = [];
    const params: any = { limit, offset };
  
    if (title) {
      whereConditions.push('LOWER(m.title) LIKE LOWER(:title)');
      params.title = `%${title}%`;
    }
  
    if (search && !actor) {
      whereConditions.push(`(LOWER(m.title) LIKE LOWER(:search) OR LOWER(a.name) LIKE LOWER(:search))`);
      params.search = `%${search}%`;
    } else if (search) {
      whereConditions.push(`LOWER(m.title) LIKE LOWER(:search)`);
      params.search = `%${search}%`;
    }
  
    if (actor) {
      whereConditions.push('LOWER(a.name) LIKE LOWER(:actor)');
      params.actor = `%${actor}%`;
    }
  
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  
    // Подзапрос для получения ID фильмов
    const subQuery = `
      SELECT DISTINCT m.id
      FROM Movies m
      ${actor ? 'INNER JOIN' : 'LEFT JOIN'} movie_actors ma ON m.id = ma.movieId
      ${actor ? 'INNER JOIN' : 'LEFT JOIN'} Actors a ON ma.actorId = a.id
      ${whereClause}
    `;
  
    // Основной запрос для получения фильмов и всех актеров
    const query = `
      SELECT 
        m.id AS movie_id,
        m.title,
        m.year,
        m.format,
        m.createdAt AS movie_createdAt,
        m.updatedAt AS movie_updatedAt,
        a.id AS actor_id,
        a.name AS actor_name,
        a.createdAt AS actor_createdAt,
        a.updatedAt AS actor_updatedAt
      FROM Movies m
      LEFT JOIN movie_actors ma ON m.id = ma.movieId
      LEFT JOIN Actors a ON ma.actorId = a.id
      WHERE m.id IN (${subQuery})
      ORDER BY ${sortExpression} ${orderDirection}
      LIMIT :limit OFFSET :offset
    `;
  
    // Запрос для подсчета общего количества
    const countQuery = `
      SELECT COUNT(DISTINCT m.id) as total
      FROM Movies m
      ${actor ? 'INNER JOIN' : 'LEFT JOIN'} movie_actors ma ON m.id = ma.movieId
      ${actor ? 'INNER JOIN' : 'LEFT JOIN'} Actors a ON ma.actorId = a.id
      ${whereClause}
    `;
  
    // Логируем входные параметры, параметры и SQL-запросы
    console.log('Search DTO:', dto);
    console.log('Query Params:', params);
    console.log('SQL Query:', query.replace(/:(\w+)/g, (match, p1) => `'${params[p1] || match}'`));
    console.log('Count Query:', countQuery.replace(/:(\w+)/g, (match, p1) => `'${params[p1] || match}'`));
  
    // Выполняем подзапрос отдельно для отладки
    try {
      const subQueryResult = await sequelize.query(subQuery, {
        replacements: params,
        type: 'SELECT',
      });
      console.log('SubQuery Result:', subQueryResult);
    } catch (error) {
      console.error('SubQuery error:', error);
    }
  
    // Выполняем запросы
    try {
      const [moviesResult, countResult] = await Promise.all([
        sequelize.query(query, {
          replacements: params,
          type: 'SELECT',
        }),
        sequelize.query(countQuery, {
          replacements: params,
          type: 'SELECT',
        }),
      ]);
  
      // Логируем сырые результаты
      console.log('Movies Result:', moviesResult);
      console.log('Count Result:', countResult);
  
      // Форматируем результаты
      const moviesMap = new Map<number, MovieResponseDto>();
      (moviesResult as any[]).forEach(row => {
        const movieId = row.movie_id;
        if (!moviesMap.has(movieId)) {
          moviesMap.set(movieId, {
            id: movieId,
            title: row.title,
            year: row.year,
            format: row.format,
            createdAt: row.movie_createdAt ? new Date(row.movie_createdAt) : new Date(),
            updatedAt: row.movie_updatedAt ? new Date(row.movie_updatedAt) : new Date(),
            actors: [],
          });
        }
        if (row.actor_id && row.actor_name) {
          moviesMap.get(movieId)!.actors.push({
            id: row.actor_id,
            name: row.actor_name,
            createdAt: row.actor_createdAt ? new Date(row.actor_createdAt) : new Date(),
            updatedAt: row.actor_updatedAt ? new Date(row.actor_updatedAt) : new Date(),
          });
        }
      });
  
      const formattedMovies = Array.from(moviesMap.values());
      const total = (countResult[0] as any).total || 0;
  
      return {
        data: formattedMovies,
        meta: { total },
        status: 1,
      };
    } catch (error) {
      console.error('Search movies error:', error);
      throw new Error(`Failed to search movies: ${error}`);
    }
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
  
  async findMovieById(id: number): Promise<MovieResponseDto | null> {
    const movie = await Movie.findByPk(id, {
      attributes: ['id', 'title', 'year', 'format', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Actor,
          attributes: ['id', 'name', 'createdAt', 'updatedAt'],
          through: { attributes: [] },
        },
      ],
    });
    console.log('Found movie:', movie);
    if (!movie) {
      return null;
    }
    const response: MovieResponseDto = {
      id: movie.id,
      title: movie.title,
      year: movie.year,
      format: movie.format,
      createdAt: movie.createdAt,
      updatedAt: movie.updatedAt,
      actors: movie.actors.map(actor => ({
        id: actor.id,
        name: actor.name,
        createdAt: actor.createdAt,
        updatedAt: actor.updatedAt,
      })),
    };
    return response;
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