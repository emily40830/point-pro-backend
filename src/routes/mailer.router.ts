import { Router } from 'express';
import { MailServiceController } from '../controllers';

const mailerRouter = Router();

mailerRouter.post('/', MailServiceController.sendMail);
mailerRouter.get('/verify', MailServiceController.verifyConnection);

export default mailerRouter;
