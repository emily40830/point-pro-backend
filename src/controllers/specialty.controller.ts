import { RequestHandler } from 'express';
import { ApiResponse } from '../types/shared';
import { array, number, object, string } from 'yup';
import { AuthService } from '../services';
import { ignoreUndefined, prismaClient } from '../helpers';
import { clone, difference, includes, isEmpty } from 'ramda';
import { Prisma, SpecialtiesOnSpecialtyItems, SpecialtyItem, SpecialtyType } from '@prisma/client';

const specialtyResponseFormat = (specialty: any) => ({
  ...specialty,
  items: specialty.items.map(({ specialtyItem }: any) => specialtyItem),
});
class SpecialtyController {
  public static getSpecialtiesHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input
    try {
      let specialty = await prismaClient.specialty.findMany({ include: { items: true } });

      return res.status(200).send({
        message: 'successfully get specialties',
        result: specialty,
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
  public static getSpecialtyHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input
    try {
      const { specialtyId } = req.params;
      let specialty = await prismaClient.specialty.findUnique({
        where: { id: specialtyId },
        include: { items: { include: { specialtyItem: true } } },
      });

      if (isEmpty(specialty) || specialty === null) {
        res.status(404).send({
          message: `${specialtyId} doesn't exist`,
          result: null,
        });
      } else {
        return res.status(200).send({
          message: 'successfully get a specialties',
          result: specialtyResponseFormat(specialty),
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
  public static getSpecialtyItemsHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input
    try {
      let specialtyItems = await prismaClient.specialtyItem.findMany();

      return res.status(200).send({
        message: 'successfully get a specialty items',
        result: specialtyItems,
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
  public static createSpecialtyHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input
    const inputSchema = object({
      title: string().required(),
      type: string().required(),
      items: array()
        .of(
          object({
            id: string().optional(),
            title: string().required(),
            price: number().required(),
          }),
        )
        .optional(),
    });

    try {
      await inputSchema.validate(req.body);
    } catch (error) {
      res.status(400).send({
        message: (error as Error).message,
        result: null,
      });
    }

    let { title, type, items }: any = inputSchema.cast(req.body);

    let newSpecialtyItems = items.filter((item: SpecialtyItem) => !item.id);
    let specialtyItems = clone(items);
    try {
      if (newSpecialtyItems.length > 0) {
        const updatedSpecialtyItems = await prismaClient.specialtyItem.createMany({
          data: newSpecialtyItems.map((item: SpecialtyItem) => ({ title: item.title, price: item.price })),
          skipDuplicates: true,
        });
        if (updatedSpecialtyItems.count !== newSpecialtyItems.length) {
          return res.status(400).send({
            message: 'specialtyItem create error',
            result: null,
          });
        }
        specialtyItems = await prismaClient.specialtyItem.findMany({
          where: {
            OR: items.map((item: SpecialtyItem) =>
              item.id
                ? {
                    id: item.id,
                  }
                : {
                    title: item.title,
                  },
            ),
          },
        });
      }

      const specialty = await prismaClient.specialty.create({
        data: {
          title,
          type,
          items: {
            createMany: {
              data: specialtyItems.map((item: SpecialtyItem) => ({
                specialtyItemId: item.id,
              })),
              skipDuplicates: true,
            },
          },
        },
        include: { items: true },
      });

      return res.status(201).send({
        message: 'successfully create a specialty',
        result: specialty,
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
  public static updateSpecialtyHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input
    const inputSchema = object({
      title: string().optional(),
      type: string().optional(),
      items: array()
        .of(
          object({
            id: string().optional(),
            title: string().optional(),
            price: number().optional(),
          }),
        )
        .optional(),
    });

    try {
      await inputSchema.validate(req.body);
    } catch (error) {
      res.status(400).send({
        message: (error as Error).message,
        result: null,
      });
    }

    const { specialtyId } = req.params;
    const { title, type, items }: any = inputSchema.cast(req.body);

    try {
      let targetSpecialty = await prismaClient.specialty.findUniqueOrThrow<Prisma.SpecialtyFindUniqueOrThrowArgs>({
        where: { id: specialtyId },
      });

      if (items.length === 0) {
        await prismaClient.specialtiesOnSpecialtyItems.deleteMany({
          where: { specialtyId },
        });
      }
      if (items.length > 0) {
        // create or update specialtyItems
        let newSpecialtyItems = items.filter((item: SpecialtyItem) => !item.id);
        let oldSpecialtyItems = items.filter((item: SpecialtyItem) => item.id);
        let specialtyItems = clone(items);
        // create
        if (newSpecialtyItems.length > 0) {
          const updatedSpecialtyItems = await prismaClient.specialtyItem.createMany({
            data: newSpecialtyItems.map((item: SpecialtyItem) => ({ title: item.title, price: item.price })),
            skipDuplicates: true,
          });
          if (updatedSpecialtyItems.count !== newSpecialtyItems.length) {
            return res.status(400).send({
              message: 'specialtyItem create error',
              result: null,
            });
          }
        }
        // update
        if (oldSpecialtyItems.length > 0) {
          let updatedSpecialtyItems = await Promise.all(
            oldSpecialtyItems.map((item: SpecialtyItem) =>
              prismaClient.specialtyItem.update({ where: { id: item.id }, data: item }),
            ),
          );
          if (updatedSpecialtyItems.length !== oldSpecialtyItems.length) {
            return res.status(400).send({
              message: 'specialtyItem update error',
              result: null,
            });
          }
        }

        specialtyItems = await prismaClient.specialtyItem.findMany({
          where: {
            OR: items.map((item: SpecialtyItem) =>
              item.id
                ? {
                    id: item.id,
                  }
                : {
                    title: item.title,
                  },
            ),
          },
        });

        let oldSpecialtiesOnSpecialtyItems = await prismaClient.specialtiesOnSpecialtyItems.findMany({
          where: { specialtyId },
        });
        await prismaClient.specialtiesOnSpecialtyItems.createMany({
          data: specialtyItems.map((item: SpecialtyItem) => ({
            specialtyId,
            specialtyItemId: item.id,
          })),
          skipDuplicates: true,
        });

        let newSpecialtiesOnSpecialtyItems = await prismaClient.specialtiesOnSpecialtyItems.findMany({
          where: {
            specialtyId,
            OR: specialtyItems.map((item: SpecialtyItem) => ({
              specialtyItemId: item.id,
            })),
          },
        });
        let diff = difference(oldSpecialtiesOnSpecialtyItems, newSpecialtiesOnSpecialtyItems);
        if (diff.length > 0) {
          await prismaClient.specialtiesOnSpecialtyItems.deleteMany({
            where: {
              OR: diff.map((item: SpecialtiesOnSpecialtyItems) => ({
                specialtyId,
                specialtyItemId: item.specialtyItemId,
              })),
            },
          });
        }
      }

      const newSpecialty: Prisma.SpecialtyUpdateInput = {
        title: ignoreUndefined(title, targetSpecialty?.title),
        type: ignoreUndefined(type, targetSpecialty?.type),
      };

      const specialty = await prismaClient.specialty.update({
        where: { id: specialtyId },
        data: newSpecialty,
        include: { items: true },
      });

      if (isEmpty(specialty) || specialty === null) {
        res.status(404).send({
          message: `${specialtyId} doesn't exist`,
          result: null,
        });
      } else {
        return res.status(200).send({
          message: 'successfully update a specialty',
          result: specialty,
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
  public static deleteSpecialtyHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input
    try {
      const { specialtyId } = req.params;

      const specialty = await prismaClient.specialty.delete({
        where: { id: specialtyId },
      });

      return res.status(204).send({
        message: 'successfully delete a specialty',
        result: specialty,
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

export default SpecialtyController;
