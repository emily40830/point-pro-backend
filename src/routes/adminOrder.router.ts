import express from 'express';
import { AdminOrderController } from '../controllers';
import { ValidateOrderData } from '../middlewares';

const router = express.Router();

router.get('/orders', AdminOrderController.getAllOrdersHandler);
router.get('/orders/:orderId', AdminOrderController.getOrderHandler);
router.post('/orders', ValidateOrderData, AdminOrderController.createOrderHandler);
router.put('/orders/:orderId', ValidateOrderData, AdminOrderController.updateOrderHandler);
router.delete('/orders/:orderId', AdminOrderController.deleteOrderHandler);

export default router;
