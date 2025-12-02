import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { upload } from '../middlewares/upload.middleware';
import { validateBody } from '../middlewares/validateBody';
import { createProduct, deleteProduct, getByCategory, updateProduct } from '../controllers/product.controller';
import { createProdcutSchema, UpdateProductSchema } from '../validators/product.validator';





const router = express.Router();


router.post("/", authMiddleware, upload.array("files",2), validateBody(createProdcutSchema), createProduct);
router.get("/category/:id_category",authMiddleware, getByCategory);
router.delete("/:id", authMiddleware, deleteProduct);
router.put("/:id", authMiddleware, upload.array("files",2), validateBody(UpdateProductSchema), updateProduct);

export default router;