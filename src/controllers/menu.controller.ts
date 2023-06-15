import { RequestHandler } from 'express';
import { ApiResponse } from '../types/shared';
import { prismaClient } from '../helpers';

class MenuController {
  public static getMenuHandler: RequestHandler = async (req, res: ApiResponse, next) => {
    try {
      const menu = await prismaClient.category.findMany({
        select: {
          id: true,
          title: true,
          position: true,
          meals: {
            where: {
              meal: {
                publishedAt: {
                  lte: new Date(),
                },
              },
            },
            select: {
              meal: {
                select: {
                  id: true,
                  title: true,
                  coverUrl: true,
                  description: true,
                  price: true,
                  position: true,
                  isPopular: true,
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
                          items: {
                            select: {
                              specialtyItem: {
                                select: {
                                  id: true,
                                  title: true,
                                  price: true,
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
          },
        },
      });

      const result = menu.map((category) => ({
        ...category,
        meals: category.meals.map(({ meal }) => ({
          ...meal,
          categories: meal.categories.map(({ category }) => ({ ...category })),
          specialties: meal.specialties.map(({ specialty }) => ({
            ...specialty,
            items: specialty.items.map((item) => ({ ...item.specialtyItem })),
          })),
        })),
      }));

      return res.status(200).send({
        message: 'success',
        result,
      });
    } catch (error) {
      res.status(500).send({
        message: (error as Error).message,
        result: null,
      });
    }
  };
}

export default MenuController;
