import { RequestHandler } from 'express';
import { ApiResponse } from '../types/shared';
import { object, string } from 'yup';
import { AuthService } from '../services';
import { prismaClient } from '../helpers';
import { includes, isEmpty } from 'ramda';
import { Prisma, SpecialtyItem } from '@prisma/client';

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
    try {
      const { title, type, items } = req.body;
      let a: Prisma.SpecialtyCreateInput;

      const specialty = await prismaClient.specialty.create({
        data: {
          title,
          type,
          items: {
            create: items.map((e: SpecialtyItem) =>
              e.id
                ? {
                    specialtyItem: {
                      create: {
                        title: e.title,
                        price: e.price,
                      },
                    },
                  }
                : {
                    specialtyItemId: e.id,
                  },
            ),
          },
        },
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

    try {
      const { specialtyId } = req.params;
      const { id, title, items } = req.body;
      const specialty = await prismaClient.specialty.update({ where: { id: specialtyId }, data: { id, title, items } });

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
