import { RequestHandler } from 'express';
import multer from 'multer';
import path from 'path';

const upload = multer({ storage: multer.memoryStorage() }).single('movies');

export const multerMiddleware: RequestHandler = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) return next(err);
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext !== '.txt') {
      return res.status(400).json({ error: 'Unsupported file format' });
    }
    next();
  });
};