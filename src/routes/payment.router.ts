import express from 'express';
import { LinePayController, EcPayController } from '../controllers';

const router = express.Router();

router.get('/line-pay/request/:id', LinePayController.requestHandler);
router.get('/line-pay/confirm', LinePayController.confirmHandler);
router.post('/line-pay/refund', LinePayController.refundHandler);

router.get('/ec-pay/request/:id', EcPayController.requestHandler);
router.post('/ec-pay/return', EcPayController.returnHandler);

export default router;
