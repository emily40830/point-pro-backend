import { Router } from 'express';
import { PaymentController } from '../controllers';

const paymentRouter = Router();

paymentRouter.get('/line-pay/:orderId', PaymentController.linePayRequestHandler);
paymentRouter.get('/line-pay/confirm/:orderId', PaymentController.linePayConfirmHandler);
paymentRouter.get('/line-pay/cancel/:orderId', PaymentController.linePayRefundHandler);

paymentRouter.get('/ec-pay/:orderId', PaymentController.ecPayRequestHandler);
paymentRouter.post('/ec-pay/cancel', PaymentController.ecPayReturnHandler);

export default paymentRouter;
