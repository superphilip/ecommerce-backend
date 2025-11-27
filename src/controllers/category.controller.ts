import { Request, Response, NextFunction } from 'express';
import * as categoryService from '../services/category.service.js';
import { asyncHandler } from "../middlewares/asyncHandler";

export const createCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;
    const file = req.file;
    const category = await categoryService.createCategory(data, file!);
    res.status(201).json(category);
});

export const getAllCategories = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const categories = await categoryService.getAllCategories();
    res.status(200).json(categories);
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    await categoryService.deleteCategory(id);
    res.status(200).json(true);
});

export const updateCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    const data = req.body;
    const file = req.file;
    const category = await categoryService.updateCategory(id, data, file);
    res.status(200).json(category);
});