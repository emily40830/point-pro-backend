import { Router } from 'express';
import { SeatController } from '../controllers';

const seatRouter = Router();

seatRouter.get('/', SeatController.getAllSeatHandler);

export default seatRouter;
