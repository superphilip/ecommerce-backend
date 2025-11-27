import type {Request, Response, NextFunction} from 'express';

type ExpressResponse = Response<any, Record<string, any>>;

type ControllerFunction = (req: Request, res: Response, next: NextFunction) => Promise<void | ExpressResponse>;

export const asyncHandler = (fn: ControllerFunction) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};