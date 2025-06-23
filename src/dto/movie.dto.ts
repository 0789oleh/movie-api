// src/dto/movie.dto.ts
import { isIn, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';
import MovieFormat from '../models/movie.model';

// Movie creation
export class CreateMovieDto {

  @IsString()
  @IsNotEmpty({message: 'Title is required!'})
  title: string;

  @IsNumber()
  year: number;

  @IsString()
  @IsIn([MovieFormat])
  format: string;


  actors: string[]; // Массив имен актеров

  static validate(data: Partial<CreateMovieDto>) {
    const dto = Object.assign(new CreateMovieDto(), data);
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

// Movie update
export class UpdateMovieDto {

  @IsString()
  title?: string;

  @IsNumber()
  year?: number;

  @IsString()
  @IsIn([MovieFormat])
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