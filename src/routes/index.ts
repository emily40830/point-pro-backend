import { NextFunction, Request, Router } from 'express';
import { Logger } from '../helpers/utils';
import { ApiResponse } from '../types/shared';
import authRouter from './auth.router';
import orderRouter from './order.router';
import mealRouter from './meal.router';
import adminOrderRouter from './adminOrder.router';

const apiRouter = Router();

apiRouter.use((req, _, next) => {
  Logger.trace(`req ${req.path} query ${JSON.stringify(req.query)} body ${JSON.stringify(req.body)} in api router`);
  next();
});

apiRouter.use((error: Error, req: Request, res: ApiResponse, next: NextFunction) => {
  if (error.name === 'UnauthorizedError') {
    res.status(401).send({ message: error.message, result: null });
  } else {
    next(error);
  }
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/order', orderRouter);
apiRouter.use('/meal', mealRouter);
apiRouter.use('/admin', adminOrderRouter);

export default apiRouter;
