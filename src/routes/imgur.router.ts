import { Router } from 'express';
import { ImgurController } from '../controllers';

const imgurRouter = Router();

imgurRouter.post('/', ImgurController.createImgurHandler);
imgurRouter.delete('/', ImgurController.deleteImgurHandler);

export default imgurRouter;
