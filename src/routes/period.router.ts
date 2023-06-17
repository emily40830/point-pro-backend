import { Router } from 'express';
import { PeriodController } from '../controllers';

const periodRouter = Router();

periodRouter.get('/', PeriodController.getPeriods);

export default periodRouter;
