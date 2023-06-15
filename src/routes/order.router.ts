import { Router } from 'express';
import { OrderController } from '../controllers';

const orderRouter = Router();

orderRouter.post('/', OrderController.createOrderHandler);
orderRouter.get('/', OrderController.getOrdersHandler);
orderRouter.delete('/', OrderController.deleteOrderHandler);
orderRouter.patch('/', OrderController.updateOrderHandler);

export default orderRouter;
