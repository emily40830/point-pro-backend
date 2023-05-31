import { RequestHandler } from 'express';
import { ApiResponse } from '../types/shared';
import { prismaClient } from '../helpers';

class MenuController {
  public static getMenuHandler: RequestHandler = async (req, res: ApiResponse, next) => {
    try {
      // [TODO: token validate?]
      const menu = await prismaClient.category.findMany({
        select: {
          id: true,
          title: true,
          position: true,
          meals: {
            select: {
              meal: {
                select: {
                  id: true,
                  title: true,
                  coverUrl: true,
                  description: true,
                  price: true,
                  position: true,
                  categories: {
                    select: {
                      category: {
                        select: {
                          id: true,
                          title: true,
                          position: true,
                        },
                      },
                    },
                  },
                  specialties: {
                    select: {
                      specialty: {
                        select: {
                          id: true,
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
      });

      const result = menu.map((category) => ({
        ...category,
        meals: category.meals.map(({ meal }) => ({
          ...meal,
          categories: meal.categories.map(({ category }) => ({ ...category })),
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
