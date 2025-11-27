import { Request, Response, NextFunction } from 'express';

export const methodOverride = (req: Request, res: Response, next: NextFunction) => {
    
    if (req.method === 'POST') {
        
        const method = req.body._method;
        
        if (method) {
            const finalMethod = method.toUpperCase();
            
            if (finalMethod === 'PUT' || finalMethod === 'PATCH' || finalMethod === 'DELETE') {
                
                req.method = finalMethod;
                
                delete req.body._method;
            }
        }
    }
    
    next();
};