import { Column, Model, Table, ForeignKey } from 'sequelize-typescript';
import Movie from './movie.model';
import Actor from './actor.model';


@Table({ tableName: 'movie_actors' })
class MovieActor extends Model<MovieActor> {
  @ForeignKey(() => Movie)
  @Column({primaryKey: true})
  movieId!: number;

  @ForeignKey(() => Actor)
  @Column({primaryKey: true})
  actorId!: number;
}

export default MovieActor;