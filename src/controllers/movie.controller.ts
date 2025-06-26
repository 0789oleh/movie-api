import { CreateMovieDto, MovieSearchDto, UpdateMovieDto } from "../dto/movie.dto";
import multer from 'multer';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { authService, movieService } from "../services/services";
import { ImportResult, MulterRequest } from '../middleware/interfaces';
import { sequelize } from "../config/database";
import { ImportError } from "../middleware/errors";




const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const validTypes = ['text/plain'];
    const validExtensions = ['.txt'];
    
    if (
      validTypes.includes(file.mimetype) ||
      validExtensions.some(ext => file.originalname.endsWith(ext))
    ) {
      cb(null, true);
    } else {
      cb(new ImportError('Only text files (.txt) are allowed', 415));
    }
  }
});

export const createMovie = async (req: Request, res: Response) => {
  console.log('Request body:', req.body);
  try {
    const dto = CreateMovieDto.validate(req.body);
    const movie = await movieService.createMovie(dto);
    res.status(201).json(movie);
  } catch (error: any) {
    console.error('Create movie error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const updateMovie = async (req: Request, res: Response): Promise<void> => {
  console.log('Movie ID:', req.params.id, 'Request body:', req.body);
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid movie ID' });
      return;
    }

    const dto = UpdateMovieDto.validate(req.body);
    console.log('Validated DTO:', dto);

    const movie = await movieService.updateMovie(id, dto);
    const formattedMovie = {
      id: movie.id,
      title: movie.title,
      year: movie.year,
      format: movie.format,
      createdAt: movie.createdAt,
      updatedAt: movie.updatedAt,
      actors: movie.actors?.map(actor => actor.name) || [],
    };

    res.status(200).json({
      data: formattedMovie,
      status: 1,
    });
  } catch (error: any) {
    console.error('Update movie error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteMovie = async (req: Request, res: Response) => {
  try {
    const movieId = parseInt(req.params.id, 10);
    if (isNaN(movieId)) {
      res.status(400).json({ error: 'Invalid movie ID' });
    }
    
    movieService.removeMovie(movieId);
  } catch (error: unknown) {
    // if (error instanceof Error) {
      // res.status(201).json({ error: error.message });
    // } else {
      res.status(500).json({ error: 'Unexpected error' });
    // }
  }
}


export const findMovies = async (req: Request, res: Response) => {
  console.log('Query params:', req.query);
  try {
    const { sort = 'year', order = 'ASC', limit = '10', offset = '0' } = req.query;

    const result = await movieService.searchMovies({
      sort: sort as string,
      order: order as 'ASC' | 'DESC',
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Get movies error:', error);
    res.status(400).json({ error: error.message });
  }
};


export const findMovieById = async (req: Request, res: Response): Promise<void> => {
  console.log('Movie ID:', req.params.id);
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid movie ID' });
      return;
    }

    const movie = await movieService.findMovieById(id);
    if (!movie) {
      res.status(404).json({ error: 'Movie not found' });
      return;
    }

    const formattedMovie = {
      id: movie.id,
      title: movie.title,
      year: movie.year,
      format: movie.format,
      createdAt: movie.createdAt,
      updatedAt: movie.updatedAt,
      actors: movie.actors?.map(actor => actor.name) || [],
    };

    res.status(200).json({
      data: formattedMovie,
      status: 1,
    });
  } catch (error: any) {
    console.error('Get movie by ID error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const importMovies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new ImportError('No file uploaded', 400);
      
    const content = req.file.buffer.toString('utf-8').trim();
    if (!content) throw new ImportError('File is empty', 400);
    if (content.length > 1_000_000) throw new ImportError('File content too large', 413);

    const transaction = await sequelize.transaction();
      
    try {
      const result = await movieService.importMoviesFromFile(content, transaction);
      await transaction.commit();
        
      res.json({
        status: 'success',
        data: {
          imported: result.importedCount,
          failed: result.failedEntries.length,
          errors: result.failedEntries.slice(0, 10).map(e => ({
            preview: e.block.substring(0, 50) + '...',
            error: e.error
          }))
        }
      });
        
    } catch (error) {
      await transaction.rollback();
        // Очистка буфера файла
        req.file = {
          ...req.file,
          buffer: Buffer.alloc(0) // Заменяем на пустой буфер
        };
      throw error;
    }

  } catch (error: unknown) {
    const status = error instanceof ImportError
    ? error.statusCode 
    : 500;
      
    const response: any = {
      status: 'error',
      message:  error instanceof Error ? error.message : 'Unknown error'
    }
      
    if (error instanceof ImportError && error.message) {
      response.details = error.message;
    }
      
    if (process.env.NODE_ENV === 'development') {
      response.stack =  error instanceof Error ? error.message : 'Unknown error';
    }
      
    res.status(status).json(response);
  }
}

