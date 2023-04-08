import { Router } from 'express';
import { AuthController } from '../controllers';

const authRouter = Router();

authRouter.post('/login', AuthController.loginHandler);
authRouter.post('/logout', AuthController.logoutHandler);
authRouter.get('/token', AuthController.generateTokenHandler);

export default authRouter;
