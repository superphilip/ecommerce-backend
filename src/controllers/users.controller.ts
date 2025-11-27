import type { Request, Response, NextFunction } from 'express';
import * as userService from '../services/users.service.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';



export const findById = asyncHandler(async (req: Request, res: Response) => {

    const { id } = req.params;
    const user = await userService.findById(Number(id));
    res.status(200).send(user);


});

export const findAll = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

    const user = await userService.findAll();
    res.status(200).send(user);

});

