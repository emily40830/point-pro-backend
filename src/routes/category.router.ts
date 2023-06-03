import { Router } from 'express';
import { CategoryController } from '../controllers';

const categoryRouter = Router();

categoryRouter.get('/', CategoryController.getCategoryHandler);
categoryRouter.get('/:categoryId', CategoryController.getCategoryHandler);
categoryRouter.post('/', CategoryController.createCategoryHandler);
categoryRouter.delete('/:categoryId', CategoryController.deleteCategoryHandler);

export default categoryRouter;
