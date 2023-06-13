import { Request, RequestHandler } from 'express';
import { ApiResponse, AuthRequest } from '../types/shared';
import { array, boolean, date, number, object, string } from 'yup';
import { AuthService } from '../services';
import { ignoreUndefined, prismaClient } from '../helpers';
import { Prisma, Meal, SpecialtyType } from '@prisma/client';
import { max } from 'ramda';

type CategoryResponse = {
  id: string;
  title: string;
};
type SpecialtyItemResponse = {
  id: string;
  title: string;
  price: number | null;
};

type SpecialtyResponse = {
  id: string;
  title: string;
  items: SpecialtyItemResponse[];
};

type MealResponse = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  position: number;
  isPopular: boolean;
  publishedAt: Date | null;
  categories: CategoryResponse[];
  specialties: SpecialtyResponse[];
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
          specialties: true,
        },
      });

      return res.status(200).send({
        message: 'successfully get meals',
        result: meals,
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

      const categoryIds = meal.categories.map((category) => category.categoryId);
      const specialtyIds = meal.specialties.map((specialty) => specialty.specialtyId);

      const categories = await prismaClient.category.findMany({
        where: {
          id: {
            in: categoryIds,
          },
        },
      });

      const specialties = await prismaClient.specialty.findMany({
        where: {
          id: {
            in: specialtyIds,
          },
        },
        include: {
          items: {
            include: {
              specialtyItem: true,
            },
          },
        },
      });

      const { createdAt, updatedAt, ...rest } = meal;

      const result: MealResponse = {
        ...rest,
        publishedAt: rest?.publishedAt && new Date(rest.publishedAt),
        categories: categories.map((category) => ({ id: category.id, title: category.title })),
        specialties: specialties.map((specialty) => ({
          id: specialty.id,
          title: specialty.title,
          items: specialty.items.map((item) => ({
            id: item.specialtyItemId,
            title: item.specialtyItem.title,
            price: item.specialtyItem.price,
          })),
        })),
      };

      return res.status(200).send({
        message: 'successfully get a meals',
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
      publishedAt: date().optional(),
      categoryIds: array(string().required()).required(),
      specialtyIds: array(string().required()).required(),
    });

    try {
      const { title, coverUrl, description, price, categoryIds, specialtyIds } = inputSchema.cast(req.body);

      const meal = await prismaClient.meal.create({
        data: {
          title,
          coverUrl,
          description,
          price,
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
    const inputSchema = object({
      title: string().optional(),
      coverUrl: string().optional(),
      description: string().optional(),
      price: number().optional(),
      position: number().positive().optional(),
      isPopular: boolean().optional(),
      publishedAt: date().optional(),
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

      return res.status(200).send({ message: 'updated meal successfully', result: updatedMeal });
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
