import { Router } from 'express';
import { MenuController } from '../controllers';

const menuRouter = Router();

menuRouter.get('/', MenuController.getMenuHandler);

export default menuRouter;
