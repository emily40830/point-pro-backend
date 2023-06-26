import { Router } from 'express';
import { OrderController } from '../controllers';
import {
  cancelOrderHandlerValidation,
  createOrderHandlerValidation,
  getOrderHandlerValidation,
  updateOrderHandlerValidation,
} from '../validations';

const orderRouter = Router();

orderRouter.get('/', getOrderHandlerValidation, OrderController.getOrdersHandler);
orderRouter.post('/', createOrderHandlerValidation, OrderController.createOrderHandler);
orderRouter.patch('/', updateOrderHandlerValidation, OrderController.updateOrderHandler);
orderRouter.delete('/', cancelOrderHandlerValidation, OrderController.cancelOrderHandler);

export default orderRouter;
