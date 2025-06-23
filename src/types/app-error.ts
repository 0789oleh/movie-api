export class AppError extends Error {
    constructor(
      public message: string,
      public statusCode: number = 500,
      public details?: any
    ) {
      super(message);
      this.name = 'AppError';
    }
  }
  
  export class ValidationError extends AppError {
    constructor(message: string, details?: any) {
      super(message, 400, details);
      this.name = 'ValidationError';
    }
  }
  
  export class NotFoundError extends AppError {
    constructor(entity: string) {
      super(`${entity} not found`, 404);
      this.name = 'NotFoundError';
    }
  }