
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = "";
        if(req.baseUrl.includes("auth")) {
            const idUser = req.params.id;
            uploadPath = path.join(__dirname, `../../../public/uploads/auth/${idUser}`);
        }
        else if(req.baseUrl.includes("categories")) {
            uploadPath = path.join(__dirname, `../../../public/uploads/categories`);
        } 
        else if(req.baseUrl.includes("products")) {
            uploadPath = path.join(__dirname, `../../../public/uploads/products`);
        }
        else {
            uploadPath = path.join(__dirname, `../../../public/uploads/others`);
        }
        
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
        cb(null, uniqueName);

    }
});

export const upload =  multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
        if(!allowed.includes(file.mimetype)) {
            return cb(new Error('Solo se permite imagenes JPEG, PNG, JPG'));
        }
        cb(null, true);
    }
});