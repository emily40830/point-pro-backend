import { NextFunction, Request, Router } from 'express';
import { Logger } from '../helpers/utils';
import { ApiResponse } from '../types/shared';
import authRouter from './auth.router';
import orderRouter from './order.router';
import mealRouter from './meal.router';
import categoryRouter from './category.router';
import specialtyRouter from './specialty.router';
import menuRouter from './menu.router';
import imgurRouter from './imgur.router';
import paymentRouter from './payment.router';
import seatRouter from './seat.router';
import periodRouter from './period.router';
import reservationRouter from './reservation.router';
import mailerRouter from './mailer.router';

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
apiRouter.use('/category', categoryRouter);
apiRouter.use('/specialty', specialtyRouter);
apiRouter.use('/menu', menuRouter);
apiRouter.use('/imgur', imgurRouter);
apiRouter.use('/payment', paymentRouter);
apiRouter.use('/seat', seatRouter);
apiRouter.use('/period', periodRouter);
apiRouter.use('/reservation', reservationRouter);
apiRouter.use('/mail', mailerRouter);

export default apiRouter;
