import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes.js';
import projectRoutes from './routes/project.routes.js';
import authRoutes from './routes/auth.routes.js';
import assetRoutes from './routes/asset.routes.js';
import searchRoutes from './routes/search.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/search', searchRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.url} not found`,
    },
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
