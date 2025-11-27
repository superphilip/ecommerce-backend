import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    
    const statusCode = err.statusCode || 500; 
    const status = err.status || (String(statusCode).startsWith('4') ? 'fail' : 'error');
    const message = err.message || 'Error interno del servidor.';
    const details = err.details || undefined; 

    res.status(statusCode).json({
        status: status,
        statusCode: statusCode,
        message: message,
        details: details, 
    });
};