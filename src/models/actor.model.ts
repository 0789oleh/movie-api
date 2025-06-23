import { Model, Table, Column, BelongsToMany, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import Movie from './movie.model';
import MovieActor from './movie-actor.model';

export interface ActorAttributes {
  id?: number;
  name: string;
}

@Table({ tableName: 'actors' })
class Actor extends Model<Actor> implements ActorAttributes {

  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;
   

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: { notEmpty: true }
  })
  name!: string;


  @BelongsToMany(() => Movie, () => MovieActor)
  movies?: Movie[];
  
}

export default Actor;
