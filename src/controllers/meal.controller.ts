import { Request, RequestHandler } from 'express';
import { ApiResponse, AuthRequest } from '../types/shared';
import { object, string } from 'yup';
import { AuthService } from '../services';
import { prismaClient } from '../helpers';
import { isEmpty } from 'ramda';
import { Prisma } from '@prisma/client';

const mealResponseFormat = (meal: any) => ({
  ...meal,
  categories: meal.categories?.map(({ categoryId }: { categoryId: string }) => categoryId),
  specialties: meal.specialties?.map(({ specialtyId }: { specialtyId: string }) => specialtyId),
});
class MealController {
  public static getAllMealsHandler: RequestHandler = async (req: AuthRequest, res: ApiResponse) => {
    // validate input
    try {
      const meal = await prismaClient.meal.findMany({ include: { categories: true } });
      let result = meal.map((e) => mealResponseFormat(e));

      return res.status(200).send({
        message: 'successfully get meals',
        result,
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
  public static getMealHandler: RequestHandler = async (req: AuthRequest, res: ApiResponse) => {
    // validate input
    try {
      const { mealId } = req.params;
      let meal = await prismaClient.meal.findUnique({
        where: { id: mealId },
        include: { categories: true, specialties: true },
      });

      if (isEmpty(meal) || meal === null) {
        res.status(404).send({
          message: `${mealId} doesn't exist`,
          result: null,
        });
      } else {
        return res.status(200).send({
          message: 'successfully get a meals',
          result: mealResponseFormat(meal),
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).send({
          message: error.message,
          result: null,
        });
      }
    }
  };
  public static createMealHandler: RequestHandler = async (req: AuthRequest, res: ApiResponse) => {
    // validate input
    try {
      const { title, coverUrl, description, price, publishedAt, isPopular, categories, specialties } = req.body;

      const meal = await prismaClient.meal.create({
        data: {
          title,
          coverUrl,
          description,
          price,
          publishedAt,
          isPopular,
          categories: {
            create: categories?.map((id: string) => ({ category: { connect: { id } } })),
          },
          specialties: { create: specialties?.map((id: string) => ({ specialty: { connect: { id } } })) },
        },
        include: { categories: true, specialties: true },
      });

      return res.status(201).send({
        message: 'successfully create a meal',
        result: meal,
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
  public static updateMealHandler: RequestHandler = async (req: AuthRequest, res: ApiResponse) => {
    // validate input
    try {
      const { mealId } = req.params;
      const { title, coverUrl, description, price, publishedAt, isPopular, categories, specialties } = req.body;

      const meal = await prismaClient.meal.update({
        where: { id: mealId },
        data: {
          title,
          coverUrl,
          description,
          price,
          publishedAt,
          isPopular,
          categories: {
            connectOrCreate: categories?.map((categoryId: string) => ({
              where: { mealId_categoryId: { mealId_categoryId: { mealId, categoryId } } },
              create: { categoryId },
            })),
          },
          specialties: {
            connectOrCreate: specialties?.map((specialtyId: string) => ({
              where: { id: specialtyId },
              create: { specialtyId },
            })),
          },
        },
        include: { categories: true, specialties: true },
      });

      if (isEmpty(meal) || meal === null) {
        res.status(404).send({
          message: `${mealId} doesn't exist`,
          result: null,
        });
      } else {
        return res.status(200).send({
          message: 'successfully update a meal',
          result: meal,
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).send({
          message: error.message,
          result: null,
        });
      }
    }
  };
  public static deleteMealHandler: RequestHandler = async (req: AuthRequest, res: ApiResponse) => {
    // validate input
    try {
      const { mealId } = req.params;

      const meal = await prismaClient.meal.delete({
        where: { id: mealId },
        include: { categories: true, specialties: true },
      });
      return res.status(204).send({
        message: 'successfully delete a meal',
        result: meal,
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

export default MealController;
