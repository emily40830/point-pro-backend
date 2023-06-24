import { Router } from 'express';
import { PaymentController } from '../controllers';

const paymentRouter = Router();

paymentRouter.post('/line-pay/request', PaymentController.linePayRequestHandler);
paymentRouter.get('/line-pay/confirm', PaymentController.linePayConfirmHandler);
paymentRouter.get('/line-pay/cancel/:orderId', PaymentController.linePayRefundHandler);

paymentRouter.post('/ec-pay/request', PaymentController.ecPayRequestHandler);
paymentRouter.post('/ec-pay/confirm', PaymentController.ecPayReturnHandler);
paymentRouter.get('/ec-pay/confirm', PaymentController.ecPayConfirmHandler);
paymentRouter.post('/cash/request', PaymentController.cashPaymentHandler);

export default paymentRouter;
