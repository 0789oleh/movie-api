import { Sequelize } from 'sequelize-typescript';
import Movie from "./movie.model";
import User from "./user.model";
import Session from "./session.model";
import Actor from "./actor.model";
import MovieActor from "./movie-actor.model";
import RefreshToken from './refresh-token.model';
// Импортируйте все остальные модели здесь

export function initializeModels(sequelize: Sequelize) {
  sequelize.addModels([
    Movie,
    User,
    Session,
    Actor,
    MovieActor,
    RefreshToken
    // Добавьте все модели здесь
  ]);
}

// Экспортируйте все модели для удобства
export { Movie, User, Session, Actor, MovieActor, RefreshToken };