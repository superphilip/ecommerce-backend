import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import usersRouter from './routes/users.routes.js';
import authRouter from './routes/auth.routes.js';
import categoryRouter from './routes/category.routes.js';
import productRouter from './routes/product.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();


app.use(cors());
app.use(express.json());

app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/categories', categoryRouter);
app.use('/products', productRouter);


app.use('/uploads', express.static(path.join(__dirname, '../public/uploads'))),
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";

app.listen(Number(PORT),HOST, () => {
    console.log(`Servidor corriendo en http://${HOST}:${PORT}`);
});