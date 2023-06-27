import { Router } from 'express';
import { SeatController } from '../controllers';

const seatRouter = Router();

seatRouter.get('/', SeatController.getAllSeatHandler);
seatRouter.get('/:seatIdOrNo', SeatController.getSeatHandler);

export default seatRouter;
