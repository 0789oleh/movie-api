import { RequestHandler } from 'express';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() }).single('movies');

export const multerMiddleware: RequestHandler = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) return next(err);
    next();
  });
};
