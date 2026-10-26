import express from 'express';
import serverless from 'serverless-http';
import apiRouter from '../../api-routes.ts';

const app = express();
app.use(express.json({ limit: '25mb' }));
app.use(apiRouter);

export const handler = serverless(app);
