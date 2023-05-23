import { RequestHandler } from 'express';
import { ApiResponse } from '../types/shared';
import { object, string } from 'yup';
import { AuthService } from '../services';

class SpecialtyController {
  public static getSpecialtyHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input

    return res.status(200).send({
      message: 'successfully get a specialties',
      result: {},
    });
  };
  public static createSpecialtyHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input

    return res.status(201).send({
      message: 'successfully create a specialty',
      result: {
        specialty: {},
      },
    });
  };
  public static updateSpecialtyHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input

    return res.status(200).send({
      message: 'successfully update a specialty',
      result: {
        updated: {},
      },
    });
  };
  public static deleteSpecialtyHandler: RequestHandler = async (req, res: ApiResponse) => {
    // validate input

    return res.status(204).send({
      message: 'successfully delete a specialty',
      result: {
        delete: 'id',
      },
    });
  };
}

export default SpecialtyController;
