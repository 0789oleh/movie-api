import { Column, Model, DataType, Table, BelongsToMany, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import Actor from './actor.model';
import MovieActor from './movie-actor.model';

@Table({ tableName: 'movies' })
class Movie extends Model<Movie> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  })
  title!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      isInt: true,
      min: 1888,
      max: new Date().getFullYear(),
    },
  })
  year!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      isIn: {
        args: [['VHS', 'DVD', 'Blu-Ray']],
        msg: 'Invalid format. Allowed values are: VHS, DVD, Blu-Ray.',
      },
    },
  })
  format!: string;

  @BelongsToMany(() => Actor, () => MovieActor)
  actors!: Actor[];
}

export default Movie;