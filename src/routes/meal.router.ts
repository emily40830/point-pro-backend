import { Router } from 'express';
import { MealController } from '../controllers';

const mealRouter = Router();
const mealsRouter = Router();

mealsRouter.get('/', MealController.getAllMealsHandler);

mealRouter.get('/:mealId', MealController.getMealHandler);
mealRouter.post('/', MealController.createMealHandler);
mealRouter.patch('/:mealId', MealController.updateMealHandler);
mealRouter.delete('/:mealId', MealController.deleteMealHandler);

export { mealRouter, mealsRouter };
