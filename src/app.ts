import express from 'express';
import movieRoutes from './routes/movie.routes';
import requestLogger from './middleware/request-logger';
import userRoutes from './routes/user.routes';
import sessionRoutes from './routes/session.routes';
import authMiddleware from './middleware/auth';
import { ValidationError } from 'sequelize';
import  { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import logger from './config/logger';

const app = express();

app.use(express.json());
app.use(requestLogger);

app.use(cookieParser());

app.use('/api/v1/movies', authMiddleware, movieRoutes);


app.use('/api/v1/users', userRoutes);
app.use('/api/v1/sessions', sessionRoutes);

app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  
    logger.error('Error handler:', error);
    
    let status = 500;
    let message = 'Internal Server Error';
    let details: any = null;
  
    // Error handlingd
    if (error instanceof Error) {
      message = error.message;
      
      if (error.name === 'ValidationError') {
        status = 400;
      } else if (error.name === 'NotFoundError') {
        status = 404;
      } else if (error instanceof ValidationError) {
        status = 400;
        message = 'Validation error';
        details = error.errors.map(e => e.message);
      }
    }
  // Responce building
  const response: any = {
    status: 'error',
    message
  };

  if (details) {
    response.details = details;
  }

  if (process.env.NODE_ENV === 'development') {
    response.stack = error instanceof Error ? error.stack : undefined;
  }

  res.status(status).json(response);
});

export default app;