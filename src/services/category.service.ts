import prisma from "../database/prismaClient.js";
import { CreateCategoryInput, UpdateCategoryInput } from "../validators/category.validator";
import { AppError } from '../utils/AppError';
import path, { dirname } from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { update } from './auth.service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const createCategory = async (data: CreateCategoryInput, file: Express.Multer.File) => {
    let imagePath: string | null = null;

    if (file) {
        imagePath = `/uploads/categories/${file.filename}`;
    }

    const category = await prisma.category.create({
        data: {
            name: data.name,
            description: data.description,
            image: imagePath,
        },
    });

    return {
        ...category,
        image: category.image ? `http://${process.env.HOST}:${process.env.PORT}${category.image}` : null,
    }
}

export const getAllCategories = async () => {
    const categories = await prisma.category.findMany();

    return categories.map(category => ({
        ...category,
        image: category.image ? `http://${process.env.HOST}:${process.env.PORT}${category.image}` : null,
    }));
}

export const deleteCategory = async (id: number) => {
    const category = await prisma.category.findUnique({
        where: { id },
    });

    if (!category) {
        throw new AppError('La categoría no existe', 404);
    }

    if (category.image) {
        const relativeImagePath = category.image.replace(/^\/+/, '');
        const imagePath = path.join(__dirname, `../../public/${relativeImagePath}`);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    }

    await prisma.category.delete({
        where: { id: id },
    });
}

export const updateCategory = async (id: number, data: UpdateCategoryInput, file?: Express.Multer.File) => {
    const category = await prisma.category.findUnique({
        where: { id },
    });

    if (!category) {
        throw new AppError('La categoría no existe', 404);
    }

    let imagePath = category.image;

    if (file) {
        if (category.image) {
            const relativeImagePath = category.image.replace(/^\/+/, '');
            const imagePath = path.join(__dirname, `../../public/${relativeImagePath}`);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        imagePath = `/uploads/categories/${file.filename}`;
    }

    const updateCategory = await prisma.category.update({
        where: { id: id },
        data: {
            name: data.name ?? category.name,
            description: data.description ?? category.description,
            image: imagePath,
        },
    });

    return {
        ...updateCategory,
        image: updateCategory.image ? `http://${process.env.HOST}:${process.env.PORT}${updateCategory.image}` : null,
    }
}