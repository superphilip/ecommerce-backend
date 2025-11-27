import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { upload } from '../middlewares/upload.middleware';
import { validateBody } from '../middlewares/validateBody';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator';
import { createCategory, deleteCategory, getAllCategories, updateCategory } from '../controllers/category.controller';





const router = express.Router();

router.get("/", authMiddleware, getAllCategories);
router.post("/", authMiddleware, upload.single("file"), validateBody(createCategorySchema), createCategory);
router.delete("/:id", authMiddleware, deleteCategory);
router.put("/:id", authMiddleware, upload.single("file"), validateBody(updateCategorySchema), updateCategory);

export default router;