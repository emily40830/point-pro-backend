import express from 'express';
import { LinePayController } from '../controllers';

const router = express.Router();

router.post('/request', LinePayController.requestHandler);
router.post('/confirm', LinePayController.confirmHandler);
router.post('/refund', LinePayController.refundHandler);

export default router;
