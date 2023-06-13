import { RequestHandler } from 'express';
import { ApiResponse } from '../types/shared';
import { object, string } from 'yup';
import { AuthService } from '../services';
import { prismaClient } from '../helpers';
import { isEmpty } from 'ramda';

class CategoryController {
  public static getCategoriesHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input
    try {
      let category = await prismaClient.category.findMany();

      return res.status(200).send({
        message: 'successfully get categorys',
        result: category,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).send({
          message: error.message,
          result: null,
        });
      }
    }
  };
  public static getCategoryHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input
    try {
      const { categoryId } = req.params;
      let category = await prismaClient.category.findUnique({ where: { id: categoryId } });

      if (isEmpty(category) || category === null) {
        res.status(404).send({
          message: `${categoryId} doesn't exist`,
          result: null,
        });
      }
      return res.status(200).send({
        message: 'successfully get a category',
        result: category,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).send({
          message: error.message,
          result: null,
        });
      }
    }
  };
  public static createCategoryHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input
    const inputSchema = object({
      title: string().required(),
    });

    try {
      await inputSchema.validate(req.body);
    } catch (error) {
      res.status(400).send({
        message: (error as Error).message,
        result: null,
      });
    }

    try {
      const { title } = inputSchema.cast(req.body);
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
          result: null,
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
          result: null,
        });
      }
    }
  };
}

export default CategoryController;
