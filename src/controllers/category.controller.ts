import { RequestHandler } from 'express';
import { ApiResponse } from '../types/shared';
import { object, string } from 'yup';
import { AuthService } from '../services';
import { prismaClient } from '../helpers';

class CategoryController {
  public static getCategoryHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input
    try {
      const { categoryId } = req.params;
      let category = await prismaClient.category.findMany({ where: { id: categoryId } });

      return res.status(200).send({
        message: 'successfully get a category',
        result: category,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).send({
          message: error.message,
          result: {},
        });
      }
    }
  };
  public static createCategoryHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input
    try {
      const { title } = req.body;

      const category = await prismaClient.category.create({
        data: {
          title,
        },
      });

      return res.status(201).send({
        message: 'successfully create a category',
        result: category,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).send({
          message: error.message,
          result: {},
        });
      }
    }
  };
  public static deleteCategoryHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input
    try {
      const { categoryId } = req.params;

      const category = await prismaClient.category.delete({
        where: { id: categoryId },
      });
      return res.status(204).send({
        message: 'successfully delete a category',
        result: category,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).send({
          message: error.message,
          result: {},
        });
      }
    }
  };
}

export default CategoryController;
