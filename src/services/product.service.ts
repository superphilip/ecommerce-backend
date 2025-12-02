import { CreateProductInput, UpdateProductInput } from '../validators/product.validator';
import prisma from '../database/prismaClient';
import { AppError } from '../utils/AppError';
import path, { dirname } from 'path';
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const createProduct = async (data: CreateProductInput, files?: Express.Multer.File[]) => {
    const category = await prisma.category.findUnique({
        where: {
            id: data.id_category
        }
    });

    if (!category) {
        throw new AppError('La categoría no existe', 404);
    }

    let image1: string | null = null;
    let image2: string | null = null;

    if (files && files.length > 0) {
        image1 = `/uploads/products/${files[0].filename}`;
        if (files.length > 1) {
            image2 = `/uploads/products/${files[1].filename}`;
        }
    }

    const product = await prisma.product.create({
        data: {
            id_category: data.id_category,
            name: data.name,
            description: data.description,
            price: data.price,
            image1,
            image2
        }
    });

    return {
        ...product,
        image1: product.image1 ? `http://${process.env.HOST}:${process.env.PORT}${product.image1}` : null,
        image2: product.image2 ? `http://${process.env.HOST}:${process.env.PORT}${product.image2}` : null,
    }
}

export const getByCategory = async (id_category: number) => {
    const products = await prisma.product.findMany({
        where: {
            id_category: id_category
        }
    });

    const formattedProducts = products.map(product => ({
        ...product,
        image1: product.image1 ? `http://${process.env.HOST}:${process.env.PORT}${product.image1}` : null,
        image2: product.image2 ? `http://${process.env.HOST}:${process.env.PORT}${product.image2}` : null,
    }));

    return formattedProducts;
}

export const deleteProduct = async (id: number) => {
    const product = await prisma.product.findUnique({
        where: {
            id: id
        },

    });

    if (!product) {
        throw new AppError('El producto no existe', 404);
    }

    if (product.image1) {
        const relativeImagePath = product.image1.replace(/^\/+/, '');
        const imagePath = path.join(__dirname, `../../public/${relativeImagePath}`);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    }

    if (product.image2) {
        const relativeImagePath = product.image2.replace(/^\/+/, '');
        const imagePath = path.join(__dirname, `../../public/${relativeImagePath}`);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    }


    await prisma.product.delete({
        where: {
            id: id
        }
    });
}

export const updateProduct = async (id: number, data: UpdateProductInput, files?: Express.Multer.File[]) => {
    const product = await prisma.product.findUnique({
        where: {
            id: id
        }
    });

    if (!product) {
        throw new AppError('El producto no existe', 404);
    }

    let image1 = product.image1;
    let image2 = product.image2;

    if (files && files.length > 0) {
        if (files[0]) {
            if (product.image1) {
                const relativeImagePath = product.image1.replace(/^\/+/, '');
                const imagePath = path.join(__dirname, `../../public/${relativeImagePath}`);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }
            image1 = `/uploads/products/${files[0].filename}`;
        }
        if (files[1]) {
            if (product.image2) {
                const relativeImagePath = product.image2.replace(/^\/+/, '');
                const imagePath = path.join(__dirname, `../../public/${relativeImagePath}`);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }
            image2 = `/uploads/products/${files[1].filename}`;
        }
    }

    const updatedProduct = await prisma.product.update({
        where: {
            id: id
        },
        data: {
            id_category: product.id_category,
            name: data.name ?? product.name,
            description: data.description ?? product.description,
            price: data.price ?? product.price,
            image1,
            image2
        }
    });

    return {
        ...updatedProduct,
        image1: updatedProduct.image1 ? `http://${process.env.HOST}:${process.env.PORT}${updatedProduct.image1}` : null,
        image2: updatedProduct.image2 ? `http://${process.env.HOST}:${process.env.PORT}${updatedProduct.image2}` : null,
    }
}