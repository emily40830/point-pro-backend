import { RequestHandler } from 'express';
import { ApiResponse } from '../types/shared';

class OrderController {
  public static createOrderHandler: RequestHandler = async (req, res: ApiResponse) => {};
  public static getOrdersHandler: RequestHandler = async (req, res: ApiResponse) => {};
}

export default OrderController;
