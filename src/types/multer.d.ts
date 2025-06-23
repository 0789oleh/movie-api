import 'multer';

declare module 'multer' {
  interface File {
    buffer?: Buffer | null;
  }
}