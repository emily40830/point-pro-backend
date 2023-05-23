import { Router } from 'express';
import { MealController } from '../controllers';

const mealRouter = Router();

mealRouter.get('/meals', MealController.getMealHandler);
mealRouter.get('/meal/:id', MealController.getMealHandler);
mealRouter.post('/meal', MealController.createMealHandler);
mealRouter.patch('/meal/:id', MealController.updateMealHandler);
mealRouter.delete('/meal/:id', MealController.deleteMealHandler);

export default mealRouter;
