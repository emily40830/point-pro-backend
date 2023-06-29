import { Router } from 'express';
import { ReservationController } from '../controllers';

const reservationRouter = Router();

reservationRouter.post('/', ReservationController.createReservationHandler);
reservationRouter.get('/', ReservationController.getReservationsHandler);
reservationRouter.get('/:reservationLogId', ReservationController.getReservationDetailsHandler);
reservationRouter.patch('/:reservationLogId', ReservationController.updateReservationHandler);

export default reservationRouter;
