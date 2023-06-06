import { Router } from 'express';
import { SpecialtyController } from '../controllers';

const specialtyRouter = Router();

specialtyRouter.get('/', SpecialtyController.getSpecialtiesHandler);
specialtyRouter.get('/specialtyItems', SpecialtyController.getSpecialtyItemsHandler);
specialtyRouter.get('/:specialtyId', SpecialtyController.getSpecialtyHandler);
specialtyRouter.post('/', SpecialtyController.createSpecialtyHandler);
specialtyRouter.patch('/:specialtyId', SpecialtyController.updateSpecialtyHandler);
specialtyRouter.delete('/:specialtyId', SpecialtyController.deleteSpecialtyHandler);

export default specialtyRouter;
