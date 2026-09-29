import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { createProjectSchema, updateProjectSchema } from '../schemas/project.schema.js';
import comparisonRoutes from './comparison.routes.js';
import claimRoutes from './claim.routes.js';

const router = Router();
const controller = new ProjectController();

// Apply auth protection
router.use(authenticate);

// Phase 5: Nested Before/After comparisons
router.use('/:projectId/comparisons', comparisonRoutes);

// Phase 6: Nested Evidence & Claims
router.use('/:projectId/claims', claimRoutes);


router.get('/', controller.getProjects);
router.get('/:id', controller.getProjectById);
router.post('/', validate(createProjectSchema), controller.createProject);
router.patch('/:id', validate(updateProjectSchema), controller.updateProject);
router.delete('/:id', controller.deleteProject);

export default router;

