import { Request, RequestHandler } from 'express';
import { ApiResponse, AuthRequest } from '../types/shared';
import { array, boolean, date, number, object, string } from 'yup';
import { AuthService } from '../services';
import { ignoreUndefined, prismaClient } from '../helpers';
import { Prisma, Meal } from '@prisma/client';
import { difference } from 'ramda';

type MealResponse = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  position: number;
  isPopular: boolean;
  publishedAt: Date | null;
  categories: string[];
  specialties: string[];
};

class MealController {
  public static getAllMealsHandler: RequestHandler = async (req: AuthRequest, res: ApiResponse<{}>) => {
    // validate input
    const querySchema = object({
      maxResult: number().integer().optional().default(100),
    });
    const { maxResult } = querySchema.cast(req.query);
    console.log(maxResult);
    try {
      const meals = await prismaClient.meal.findMany({
        take: maxResult,
        include: {
          categories: {
            select: {
              categoryId: true,
            },
          },
        },
      });

      let result = meals.map((meal) => ({ ...meal, categories: meal.categories.map(({ categoryId }) => categoryId) }));

      return res.status(200).send({
        message: 'GET_MEALS',
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

  public static getMealHandler: RequestHandler = async (req: AuthRequest, res: ApiResponse<MealResponse>) => {
    // validate input
    try {
      const { mealId } = req.params;
      const meal = await prismaClient.meal.findUnique({
        where: { id: mealId },
        include: { categories: true, specialties: true },
      });

      if (!meal) {
        return res.status(404).send({
          message: `meal: ${mealId} not found`,
          result: null,
        });
      }

      const { createdAt, updatedAt, ...rest } = meal;

      const result: MealResponse = {
        ...rest,
        publishedAt: rest?.publishedAt && new Date(rest.publishedAt),
        categories: meal.categories.map((category) => category.categoryId),
        specialties: meal.specialties.map((specialty) => specialty.specialtyId),
      };

      return res.status(200).send({
        message: 'GET_MEAL',
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
  public static createMealHandler: RequestHandler = async (req: AuthRequest, res: ApiResponse) => {
    // validate input
    const inputSchema = object({
      title: string().required(),
      coverUrl: string().optional(),
      description: string().optional(),
      price: number().optional(),
      position: number().positive().optional(),
      isPopular: boolean().optional().default(false),
      publishedAt: date().nullable().optional(),
      categoryIds: array(string().required()).required(),
      specialtyIds: array(string().required()).required(),
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
      const { title, coverUrl, description, price, publishedAt, categoryIds, specialtyIds } = inputSchema.cast(
        req.body,
      );

      const meal = await prismaClient.meal.create({
        data: {
          title,
          coverUrl,
          description,
          price,
          publishedAt,
          categories: {
            createMany: {
              data: categoryIds.map((id) => ({
                categoryId: id,
              })),
              skipDuplicates: true,
            },
          },
          specialties: {
            createMany: {
              data: specialtyIds.map((id) => ({
                specialtyId: id,
              })),
              skipDuplicates: true,
            },
          },
        },
        include: {
          specialties: {
            include: {
              specialty: true,
            },
          },
          categories: {
            include: { category: true },
          },
        },
      });

      return res.status(201).send({
        message: 'CREATE_MEAL',
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
    const inputSchema = object({
      title: string().optional(),
      coverUrl: string().optional(),
      description: string().optional(),
      price: number().optional(),
      position: number().positive().optional(),
      isPopular: boolean().optional(),
      publishedAt: date().nullable().optional(),
      categoryIds: array(string().required()).optional(),
      specialtyIds: array(string().required()).optional(),
    });

    try {
      await inputSchema.validate(req.body);
    } catch (error) {
      res.status(400).send({
        message: (error as Error).message,
        result: null,
      });
    }
    const { mealId } = req.params;

    const { title, coverUrl, description, price, position, isPopular, publishedAt, categoryIds, specialtyIds } =
      inputSchema.cast(req.body);

    let targetMeal: Meal | null = null;

    try {
      targetMeal = await prismaClient.meal.findUniqueOrThrow<Prisma.MealFindUniqueOrThrowArgs>({
        where: { id: mealId },
        include: {
          categories: true,
          specialties: true,
        },
      });
      if (categoryIds !== undefined) {
        if (categoryIds.length === 0) {
          await prismaClient.categoriesOnMeals.deleteMany({
            where: { mealId },
          });
        }
        if (categoryIds.length > 0) {
          await prismaClient.categoriesOnMeals.createMany({
            data:
              categoryIds?.map((id) => ({
                mealId: mealId,
                categoryId: id,
              })) || [],
            skipDuplicates: true,
          });
          let oldCategoriesOnMeals = await prismaClient.categoriesOnMeals.findMany({
            where: { mealId },
          });
          let newCategoriesOnMeals = await prismaClient.categoriesOnMeals.findMany({
            where: {
              mealId,
              OR: categoryIds.map((id) => ({
                categoryId: id,
              })),
            },
          });
          let diff = difference(oldCategoriesOnMeals, newCategoriesOnMeals);
          if (diff.length > 0) {
            await prismaClient.categoriesOnMeals.deleteMany({
              where: {
                OR: diff.map((e) => ({
                  mealId,
                  categoryId: e.categoryId,
                })),
              },
            });
          }
        }
      }

      if (specialtyIds !== undefined) {
        if (specialtyIds.length === 0) {
          await prismaClient.specialtiesOnMeals.deleteMany({
            where: { mealId },
          });
        }
        if (specialtyIds.length > 0) {
          await prismaClient.specialtiesOnMeals.createMany({
            data:
              specialtyIds?.map((id) => ({
                mealId: mealId,
                specialtyId: id,
              })) || [],
            skipDuplicates: true,
          });
          let oldSpecialtiesOnMeals = await prismaClient.specialtiesOnMeals.findMany({
            where: { mealId },
          });
          let newSpecialtiesOnMeals = await prismaClient.specialtiesOnMeals.findMany({
            where: {
              mealId,
              OR: specialtyIds.map((id) => ({
                specialtyId: id,
              })),
            },
          });
          let diff = difference(oldSpecialtiesOnMeals, newSpecialtiesOnMeals);
          if (diff.length > 0) {
            await prismaClient.specialtiesOnMeals.deleteMany({
              where: {
                OR: diff.map((e) => ({
                  mealId,
                  specialtyId: e.specialtyId,
                })),
              },
            });
          }
        }
      }

      const newMeal: Prisma.MealUpdateInput = {
        title: ignoreUndefined(title, targetMeal?.title),
        coverUrl: ignoreUndefined(coverUrl, targetMeal?.coverUrl),
        description: ignoreUndefined(description, targetMeal?.description),
        price: ignoreUndefined(price, targetMeal?.price),
        position: ignoreUndefined(position, targetMeal?.position),
        isPopular: ignoreUndefined(isPopular, targetMeal?.isPopular),
        publishedAt: ignoreUndefined(publishedAt, targetMeal?.publishedAt),
      };

      const updatedMeal = await prismaClient.meal.update({
        where: {
          id: mealId,
        },
        data: newMeal,
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          specialties: {
            include: {
              specialty: true,
            },
          },
        },
      });

      return res.status(200).send({ message: 'UPDATE_MEAL', result: updatedMeal });
    } catch (error) {
      res.status(404).send({
        message: (error as Error).message,
        result: null,
      });
    }
    if (!targetMeal) {
      res.status(404).send({
        message: `meal ${mealId} Not found`,
        result: null,
      });
    }
  };
  public static deleteMealHandler: RequestHandler = async (req: AuthRequest, res: ApiResponse) => {
    try {
      const { mealId } = req.params;

      const meal = await prismaClient.meal.delete({
        where: { id: mealId },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          specialties: {
            include: {
              specialty: true,
            },
          },
        },
      });

      return res.status(200).send({
        message: 'DELETE_MEAL',
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
