import { RequestHandler } from 'express';
import { ApiResponse } from '../types/shared';
import { prismaClient } from '../helpers';

class MenuController {
  public static getMenuHandler: RequestHandler = async (req, res: ApiResponse, next) => {
    try {
      // [TODO: token validate?]
      const menu = await prismaClient.categoriesOnMeals.findMany({
        select: {
          category: {
            select: {
              title: true,
              meals: {
                select: {
                  meal: {
                    select: {
                      title: true,
                      coverUrl: true,
                      description: true,
                      price: true,
                      specialties: {
                        select: {
                          specialty: {
                            select: {
                              title: true,
                              type: true,
                              items: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const result = menu.map(({ category }) => ({
        ...category,
        meals: category.meals.map(({ meal }) => ({
          ...meal,
          specialties: meal.specialties.map(({ specialty }) => ({ ...specialty })),
        })),
      }));

      return res.status(200).send({
        message: 'success',
        result,
      });
    } catch (error) {
      next();
    }
  };
}

export default MenuController;
