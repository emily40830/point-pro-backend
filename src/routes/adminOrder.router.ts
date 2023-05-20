import express from 'express';
import { AdminOrderController } from '../controllers';
import { validateOrderData } from '../middleware';

const router = express.Router();

router.get('/orders', AdminOrderController.getAllOrdersHandler);
router.get('/orders/:orderId', AdminOrderController.getOrderHandler);
router.post('/orders', validateOrderData, AdminOrderController.createOrderHandler);
router.put('/orders/:orderId', validateOrderData, AdminOrderController.updateOrderHandler);
router.delete('/orders/:orderId', AdminOrderController.deleteOrderHandler);

export default router;
