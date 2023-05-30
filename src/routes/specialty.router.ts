import { Router } from 'express';
import { SpecialtyController } from '../controllers';

const specialtyRouter = Router();

specialtyRouter.get('/', SpecialtyController.getSpecialtyHandler);
specialtyRouter.get('/:specialtyId', SpecialtyController.getSpecialtyHandler);
specialtyRouter.post('/', SpecialtyController.createSpecialtyHandler);
specialtyRouter.patch('/:specialtyId', SpecialtyController.updateSpecialtyHandler);
specialtyRouter.delete('/:specialtyId', SpecialtyController.deleteSpecialtyHandler);

export default specialtyRouter;
