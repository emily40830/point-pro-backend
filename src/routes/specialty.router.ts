import { Router } from 'express';
import { SpecialtyController } from '../controllers';

const specialtyRouter = Router();

specialtyRouter.get('/specialties', SpecialtyController.getSpecialtyHandler);
specialtyRouter.get('/specialty/:id', SpecialtyController.getSpecialtyHandler);
specialtyRouter.post('/specialty', SpecialtyController.createSpecialtyHandler);
specialtyRouter.patch('/specialty/:id', SpecialtyController.updateSpecialtyHandler);
specialtyRouter.delete('/specialty/:id', SpecialtyController.deleteSpecialtyHandler);

export default specialtyRouter;
