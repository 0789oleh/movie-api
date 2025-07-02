// src/dto/movie.dto.ts
import { IsIn, IsNumber, IsOptional, IsString, Matches, Max, Min, validateSync } from 'class-validator';
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
  @Matches(
    /^[a-zA-Zа-яА-Я]+[a-zA-Zа-яА-Я\s-,.]*$/, 
    { 
      each: true, 
      message: `Each actor name must start with a letter and 
      contain only letters, spaces, hyphens, commas, or periods` 
    })
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

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsString()
  @IsIn(['VHS', 'DVD', 'Blu-ray'])
  format?: string;


  @IsString({ each: true })
  @Matches(
    /^[a-zA-Zа-яА-Я]+[a-zA-Zа-яА-Я\s-,.]*$/, 
    { 
      each: true, 
      message: `Each actor name must start with a letter and 
      contain only letters, spaces, hyphens, commas, or periods` 
    })
  actors!: string[];


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
    createdAt: Date;
    updatedAt: Date;
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
  order?: string = 'ASC';

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