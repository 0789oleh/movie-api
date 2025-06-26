// src/dto/movie.dto.ts
import { IsIn, IsNumber, IsOptional, IsString, Max, Min, validateSync } from 'class-validator';
import MovieFormat from '../models/movie.model';
import logger from '../config/logger';

// Movie creation
export class CreateMovieDto {
  @IsString()
  title!: string;

  @Min(1888)
  @Max(new Date().getFullYear() + 5)
  year!: number;

  @IsString()
  @IsIn(['VHS', 'DVD', 'Blu-ray']) // Важно: значения в кавычках!
  format!: string;

  @IsString({ each: true })
  actors!: string[];

  static validate(data: Partial<CreateMovieDto>) {
    logger.info('Validating DTO:', data);
    const dto = Object.assign(new CreateMovieDto(), data);
    const errors = validateSync(dto);
    logger.info('Validation errors:', errors);
    if (errors.length > 0) {
      const errorMessages = errors.map(error => 
        Object.values(error.constraints || {}).join(', ')
      );
      throw new Error(errorMessages.join('; '));
    }
    return dto;
  }
  
}


// Movie update
export class UpdateMovieDto {

  @IsString()
  title?: string;

  @IsNumber()
  year?: number;

  @IsString()
  @IsIn(['VHS', 'DVD', 'Blu-ray'])
  format?: string;


  actors?: string[];

  static validate(data: Partial<UpdateMovieDto>) {
    const dto = Object.assign(new UpdateMovieDto(), data);
    const errors = validateSync(dto);
      
    if (errors.length > 0) {
      const errorMessages = errors.map(error => 
        Object.values(error.constraints || {}).join(', ')
      );
      throw new Error(errorMessages.join('; '));
    }
      
    return dto;
  }
}

// Movie response
export class MovieResponseDto {

  id: number;
  title: string;
  year: number;
  format: string;
  createdAt: Date;
  updatedAt: Date;
  actors: {
    id: number;
    name: string;
  }[];
}

// Movie search
export class MovieSearchDto {

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  actor?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  @IsIn(['title', 'year', 'id', 'createdAt'])
  sort?: string = 'title';

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'ASC';

  @IsOptional()
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsNumber()
  offset?: number = 0;

}

// Movie search response 
export class MovieListResponseDto {
  movies: MovieResponseDto[];
  count: number;
}