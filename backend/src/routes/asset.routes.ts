import { Router } from 'express';
import multer from 'multer';
import { AssetController } from '../controllers/asset.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { createAssetSchema } from '../schemas/asset.schema.js';

import { BadRequestError } from '../utils/errors.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max file size
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new BadRequestError('Only image and video files are supported'));
    }
  },
});

const router = Router();
const controller = new AssetController();

router.use(authenticate);

router.get('/', controller.getAssets);
router.post('/upload', upload.single('file'), controller.uploadMedia);
router.get('/signature', controller.getUploadSignature);
router.post('/', validate(createAssetSchema), controller.createAsset);

export default router;

