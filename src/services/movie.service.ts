import  Op from 'sequelize-typescript';
import { Optional, QueryTypes } from 'sequelize'
import { Transaction } from 'sequelize';
import WhereOptions from 'sequelize-typescript';
import Movie from '../models/movie.model';
import Actor, { ActorAttributes } from '../models/actor.model';
import { CreateMovieDto, MovieSearchDto, UpdateMovieDto } from '../dto/movie.dto';
import { sequelize } from '../config/database';
import { createModelWrapper } from '../models/model-utils';
import { NullishPropertiesOf } from 'sequelize/types/utils';


const movieModel = createModelWrapper(Movie);
const actorModel = createModelWrapper(Actor);


class MovieService {

  
  async createMovie(data: CreateMovieDto, transaction?: Transaction): Promise<Movie> {
    const { title, year, format, actors } = data;
    
    const movie = await movieModel.create({
      title,
      year,
      format
    }, { transaction });

    const actorEntities = await Promise.all(
      actors.map(name => 
        actorModel.findOrCreate({
          where: { name },
          defaults: { name } as Partial<ActorAttributes>,
          transaction
        })
      )
    );

    await (movie as any).$set(
      'actors', 
      actorEntities.map(([actor]) => actor),
      { transaction }
    );

    return movie;
  }

  

  async searchMovies(
    searchDto: MovieSearchDto,
    transaction?: Transaction
  ): Promise<{ movies: Movie[]; totalCount: number }> {
    // Валидация и нормализация параметров
    const {
      search,
      title,
      actor,
      sort = 'id',
      order = 'ASC',
      limit = 20,
      offset = 0
    } = searchDto;
  
    // Валидация параметров сортировки
    const allowedSortFields = ['title', 'year', 'id', 'createdAt'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'title';
    const sortDirection = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const safeLimit = Math.min(limit, 100);
  
      // Параметры для плейсхолдеров
  const params: any = {
    limit: safeLimit,
    offset
  };

  let whereClause = '';
  let joinClause = '';
  let havingClause = '';

  if (search) {
    params.search = `%${search}%`;
    whereClause = `
      WHERE m.title ILIKE :search 
      OR EXISTS (
        SELECT 1 FROM "MovieActors" ma
        JOIN "Actors" a ON ma."actorId" = a.id
        WHERE ma."movieId" = m.id
        AND a.name ILIKE :search
      )
    `;
  } else {
    if (title) {
      params.title = `%${title}%`;
      whereClause = `WHERE m.title ILIKE :title`;
    }
    
    if (actor) {
      params.actor = `%${actor}%`;
      whereClause = whereClause 
        ? `${whereClause} AND a.name ILIKE :actor` 
        : `WHERE a.name ILIKE :actor`;
      
      joinClause = `JOIN "MovieActors" ma ON m.id = ma."movieId"
                    JOIN "Actors" a ON ma."actorId" = a.id`;
    }
  }

  // Основной запрос для получения данных
  const movies = await sequelize.query(`
    SELECT 
      m.id,
      m.title,
      m.year,
      m.format,
      m."createdAt",
      m."updatedAt",
      JSON_AGG(DISTINCT jsonb_build_object('id', a.id, 'name', a.name)) AS actors
    FROM "Movies" m
    ${joinClause}
    ${whereClause}
    GROUP BY m.id
    ${havingClause}
    ORDER BY m.${allowedSortFields} ${allowedSortFields}
    LIMIT :limit
    OFFSET :offset
  `, {
    replacements: params,
    type: QueryTypes.SELECT,
    model: Movie,
    mapToModel: true
  });

  // Запрос для получения общего количества
  const totalResult = await sequelize.query(`
    SELECT COUNT(DISTINCT m.id) 
    FROM "Movies" m
    ${joinClause}
    ${whereClause}
  `, {
    replacements: params,
    type: QueryTypes.SELECT
  });

  const totalCount =movies.length
    
    return {
      movies,
      totalCount
    };
  }
  

  async updateMovie(
    id: number,
    data: UpdateMovieDto,
    transaction?: Transaction
  ): Promise<Movie> {
    // Находим фильм с актерами
    const movie = await Movie.findByPk(id, {
      include: [Actor],
      transaction
    });

    if (!movie) {
      throw new Error('Movie not found');
    }

    // Обновляем основные поля
    if (data.title) movie.title = data.title;
    if (data.year) movie.year = data.year;
    if (data.format) movie.format = data.format;
    

    // Обновление связей с актерами
    if (data.actors) {
      // Находим или создаем актеров
      const actorEntities = await Promise.all(
        data.actors.map(name => 
          actorModel.findOrCreate({
            where: { name },
            defaults: { name },
            transaction
          })
        )
      );

      // Обновляем связи
      await (movie as any).$set(
        actorEntities.map(([actor]) => actor),
        { transaction }
      );
    }

    // Сохраняем изменения
    await movie.save({ transaction });
    
    // Перезагружаем отношения
    return movie.reload({
      include: [Actor],
      transaction
    });
  }
  
  async findMovieById(id: number) { 
    return Movie.findByPk(id);
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