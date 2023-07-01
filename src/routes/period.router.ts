import { Router } from 'express';
import { PeriodController } from '../controllers';

const periodRouter = Router();

periodRouter.get('/', PeriodController.getPeriods);
periodRouter.get('/list', PeriodController.getPeriodList);

export default periodRouter;
