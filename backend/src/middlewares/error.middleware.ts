import { Request, Response, NextFunction } from 'express';

/**
 * Centralizador Global de Exceções e Erros (Global Error Exception Handling Middleware)
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Unhandled Server Exception] Erro não tratado (Unhandled error caught):', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Erro interno do servidor (Internal Server Error)';

  res.status(statusCode).json({
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
