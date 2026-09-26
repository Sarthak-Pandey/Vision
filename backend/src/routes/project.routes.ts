import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { createProjectSchema, updateProjectSchema } from '../schemas/project.schema.js';

const router = Router();
const controller = new ProjectController();

// Apply auth protection
router.use(authenticate);

router.get('/', controller.getProjects);
router.get('/:id', controller.getProjectById);
router.post('/', validate(createProjectSchema), controller.createProject);
router.patch('/:id', validate(updateProjectSchema), controller.updateProject);
router.delete('/:id', controller.deleteProject);

export default router;
