import { Request, Response, NextFunction } from 'express';
import logger from './logger';

type AsyncController = (req: Request, res: Response) => Promise<void>;;

export const controllerAdapter = (controller: AsyncController) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.debug('Trying to get the controller');
      await controller(req, res);
    } catch (error: unknown) {
      // Обработка ошибки с проверкой типа
      if (error instanceof Error) {
        next(error);
      } else {
        // Создаем стандартную ошибку для неизвестных случаев
        next(new Error('Unknown error occurred'));
      }
    }
  };
};