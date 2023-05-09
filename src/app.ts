import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import errorMiddleware from './middleware';
import apiRouter from './routes';
import corsOptionDelegate from './helpers/cors';

const app = express();

app.use(morgan('combined'));
app.use(cors(corsOptionDelegate));

app.get('/healthz', async (_, res) => {
  return res.send(new Date().toISOString() + ' health check');
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRouter);
app.use(errorMiddleware);

export default app;
