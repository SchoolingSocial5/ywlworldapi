import { Router } from 'express';
import { getSocialPlatforms, createSocialPlatform, updateSocialPlatform } from '../controllers/socialPlatformController';
import { protect, adminOnly } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

router.get('/', getSocialPlatforms);
router.post('/', protect, adminOnly, upload.single('icon'), createSocialPlatform);
router.post('/:id', protect, adminOnly, upload.single('icon'), updateSocialPlatform);

export default router;
