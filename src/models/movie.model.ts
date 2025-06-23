import Actor from './actor.model';
import {Column, Model, DataType, Table, BelongsToMany, Validate, BeforeValidate, PrimaryKey, AutoIncrement, } from 'sequelize-typescript';
import MovieActor from './movie-actor.model';

export enum MovieFormat {
  VHS = 'VHS',
  DVD = 'DVD',
  BLURAY = 'Blu-Ray'
}

// 2. Создаем хелпер для валидации
const validateFormat = (value: string): void => {
  if (!Object.values(MovieFormat).includes(value as MovieFormat)) {
    throw new Error(`Invalid format. Allowed values: ${Object.values(MovieFormat).join(', ')}`);
  }
};

@Table({ tableName: 'movies' })
class Movie extends Model<Movie> {

  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;
   

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: { notEmpty: true }
  })
  title!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      min: 1888, // Первый фильм в истории
      max: new Date().getFullYear()
    }
  })
  year!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      isValidFormat: (value: string) => {
        const validFormats = ['VHS', 'DVD', 'Blu-Ray'];
        if (!validFormats.includes(value)) {
          throw new Error('Invalid format');
        }
      }
    }
  })
  format!: string;

  @BelongsToMany(() => Movie, () => MovieActor)
  actors!: Actor[];

}

export default Movie;