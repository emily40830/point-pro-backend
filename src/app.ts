import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { errorMiddleware, verifyMiddleware, sessionMiddleware } from './middleware';
import apiRouter from './routes';
import corsOptionDelegate from './helpers/cors';

const app = express();

app.use(morgan('combined'));
app.use(cors(corsOptionDelegate));
app.use(cookieParser());

app.get('/healthz', async (_, res) => {
  return res.send(new Date().toISOString() + ' health check');
});
app.use(sessionMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', verifyMiddleware(['/auth/login', '/auth/register']), apiRouter);
app.use(errorMiddleware);

export default app;
