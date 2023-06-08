import { Router } from 'express';
import { MealController } from '../controllers';

const mealRouter = Router();

mealRouter.get('/', MealController.getAllMealsHandler);
mealRouter.get('/:mealId', MealController.getMealHandler);
mealRouter.post('/', MealController.createMealHandler);
mealRouter.put('/:mealId', MealController.updateMealHandler);
mealRouter.delete('/:mealId', MealController.deleteMealHandler);

export default mealRouter;
