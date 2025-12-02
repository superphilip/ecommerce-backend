import { Request, Response, NextFunction } from 'express';
import * as productService from '../services/product.service.js';
import { asyncHandler } from "../middlewares/asyncHandler.js";

export const createProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;
    const files = req.files as Express.Multer.File[];
    const product = await productService.createProduct(data, files);
    res.status(201).json(product);
});

export const getByCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const id_category = Number(req.params.id_category);
    const products = await productService.getByCategory(id_category);
    res.status(200).json(products);
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    await productService.deleteProduct(id);
    res.status(200).json(true);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    const data = req.body;
    const files = req.files as Express.Multer.File[];
    const updatedProduct = await productService.updateProduct(id, data, files);
    res.status(200).json(updatedProduct);
});