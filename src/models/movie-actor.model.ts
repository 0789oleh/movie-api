import { Table, Column, Model, ForeignKey } from 'sequelize-typescript';
import Movie from './movie.model';
import Actor from './actor.model';

@Table({tableName: 'movie_actors'})
export default class MovieActor extends Model<MovieActor> {
  @ForeignKey(() => Movie)
  @Column
  movieId!: number;

  @ForeignKey(() => Actor)
  @Column
  actorId!: number;
}