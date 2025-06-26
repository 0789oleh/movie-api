import express from 'express';
import * as movieController from '../controllers/movie.controller';
import { multerMiddleware } from '../middleware/multer-middleware';
import { controllerAdapter } from '../config/controller-adapter';

const router = express.Router();

router.post('/',  controllerAdapter(movieController.createMovie));
router.delete('/:id',  controllerAdapter(movieController.deleteMovie));
router.get('/', controllerAdapter(movieController.findMovies));
router.patch('/:id',  controllerAdapter(movieController.updateMovie));
router.get('/:id',  controllerAdapter(movieController.findMovieById));
router.post('/import',  multerMiddleware, movieController.importMovies);

export default router;