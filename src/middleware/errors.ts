// errors.ts
export class ImportError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
    this.name = 'ImportError';
  }
}
