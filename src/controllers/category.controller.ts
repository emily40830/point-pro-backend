import { RequestHandler } from 'express';
import { ApiResponse } from '../types/shared';
import { object, string } from 'yup';
import { AuthService } from '../services';

class CategoryController {
  public static getCategoryHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input

    return res.status(200).send({
      message: 'successfully get a categories',
      result: {},
    });
  };
  public static createCategoryHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input

    return res.status(201).send({
      message: 'successfully create a category',
      result: {
        category: {},
      },
    });
  };
  public static updateCategoryHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input

    return res.status(200).send({
      message: 'successfully update a category',
      result: {
        updated: {},
      },
    });
  };
  public static deleteCategoryHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input

    return res.status(204).send({
      message: 'successfully delete a category',
      result: {
        delete: 'id',
      },
    });
  };
}

export default CategoryController;
