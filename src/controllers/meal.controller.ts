import { RequestHandler } from 'express';
import { ApiResponse } from '../types/shared';
import { object, string } from 'yup';
import { AuthService } from '../services';

class MealController {
  public static getMealHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input

    return res.status(200).send({
      message: 'successfully get a meals',
      result: {},
    });
  };
  public static createMealHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input

    return res.status(201).send({
      message: 'successfully create a meal',
      result: {
        meal: {},
      },
    });
  };
  public static updateMealHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input

    return res.status(200).send({
      message: 'successfully update a meal',
      result: {
        updated: {},
      },
    });
  };
  public static deleteMealHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input

    return res.status(204).send({
      message: 'successfully delete a meal',
      result: {
        delete: 'id',
      },
    });
  };
}

export default MealController;
