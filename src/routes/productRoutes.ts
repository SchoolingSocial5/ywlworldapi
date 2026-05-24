import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/productController';
import { protect, adminOnly, retailOnly } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', protect, adminOnly, retailOnly, upload.array('images'), createProduct);
router.post('/:id', protect, adminOnly, retailOnly, upload.array('images'), updateProduct);
router.put('/:id', protect, adminOnly, retailOnly, upload.array('images'), updateProduct);
router.delete('/:id', protect, adminOnly, retailOnly, deleteProduct);

export default router;
