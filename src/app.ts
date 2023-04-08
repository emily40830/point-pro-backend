import express from 'express';
import cors from 'cors';
import { Logger } from './helpers/utils';
import morgan from 'morgan';

const app = express();

app.use((req, _, next) => {
  Logger.trace(`req ${req.path} query ${JSON.stringify(req.query)} body ${JSON.stringify(req.query)}`);
  next();
});

app.use(morgan('combined'));
app.use(cors());

app.get('/healthz', async (_, res) => {
  return res.send(new Date().toISOString() + ' health check');
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export default app;
