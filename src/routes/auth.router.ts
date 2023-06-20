import { Router } from 'express';
import { AuthController } from '../controllers';

const authRouter = Router();

authRouter.post('/register', AuthController.registerHandler);
authRouter.post('/login', AuthController.loginHandler);
authRouter.post('/logout', AuthController.logoutHandler);
authRouter.post('/token', AuthController.generateTokenHandler);
authRouter.get('/user-info', AuthController.decodeTokenHandler);

export default authRouter;
