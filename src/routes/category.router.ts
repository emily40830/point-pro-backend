import { Router } from 'express';
import { CategoryController } from '../controllers';

const categoryRouter = Router();

categoryRouter.get('/categories', CategoryController.getCategoryHandler);
categoryRouter.get('/category/:id', CategoryController.getCategoryHandler);
categoryRouter.post('/category', CategoryController.createCategoryHandler);
categoryRouter.patch('/category/:id', CategoryController.updateCategoryHandler);
categoryRouter.delete('/category/:id', CategoryController.deleteCategoryHandler);

export default categoryRouter;
