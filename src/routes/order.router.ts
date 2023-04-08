import { Router } from 'express';
import { OrderController } from '../controllers';

const orderRouter = Router();

orderRouter.post('/create', OrderController.createOrderHandler);
orderRouter.get('/all', OrderController.getOrdersHandler);

export default orderRouter;
