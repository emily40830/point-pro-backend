import express from 'express';
import { LinePayController } from '../controllers';

const router = express.Router();

router.get('/line-pay/request/:id', LinePayController.requestHandler);
router.post('/line-pay/confirm', LinePayController.confirmHandler);
router.post('/line-pay/refund', LinePayController.refundHandler);

export default router;
