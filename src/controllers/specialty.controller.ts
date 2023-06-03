import { RequestHandler } from 'express';
import { ApiResponse } from '../types/shared';
import { object, string } from 'yup';
import { AuthService } from '../services';
import { prismaClient } from '../helpers';

class SpecialtyController {
  public static getSpecialtyHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input
    try {
      const { specialtyId } = req.params;
      let specialty = await prismaClient.specialty.findMany({ where: { id: specialtyId } });

      return res.status(200).send({
        message: 'successfully get a specialties',
        result: specialty,
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
  public static createSpecialtyHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input
    try {
      const { title, type, specialtyItems } = req.body;

      const specialty = await prismaClient.specialty.create({
        data: {
          title,
          type,
          items: {
            connect: specialtyItems,
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
      const specialty = await prismaClient.specialty.update({ where: { id: specialtyId }, data: req.body });

      return res.status(200).send({
        message: 'successfully update a specialty',
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
