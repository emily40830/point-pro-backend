import { Router } from 'express';
import { CategoryController } from '../controllers';

const categoryRouter = Router();

categoryRouter.get('/', CategoryController.getCategoriesHandler);
categoryRouter.get('/:categoryId', CategoryController.getCategoryHandler);
categoryRouter.post('/', CategoryController.createCategoryHandler);
categoryRouter.delete('/:categoryId', CategoryController.deleteCategoryHandler);

export default categoryRouter;
