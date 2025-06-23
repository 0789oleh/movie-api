import { UserService } from './user.service';
import { AuthService } from './auth.service';
import MovieService from './movie.service';

// Инициализация
const userService = new UserService();
const authService = new AuthService(userService);
const movieService = new MovieService();

export { userService, authService, movieService };