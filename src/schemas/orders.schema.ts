import { OrderStatus, OrderType } from '@prisma/client';
import { object, string, array, number, mixed } from 'yup';

export const specialtiesValidatedSchema = array().of(
  object({
    id: string().required(),
    title: string().required(),
    type: string().required(),
    items: array().of(
      object({
        id: string().required(),
        title: string().required(),
        price: number().required(),
      }),
    ),
  }),
);

export const orderMealsValidatedSchema = array()
  .of(
    object({
      id: string().required(),
      amount: number().required(),
      price: number().required(),
      title: string().required(),
      servedAmount: number().required(),
      specialties: specialtiesValidatedSchema,
    }),
  )
  .required();

export const orderStatusValidatedSchema = object({
  status: mixed().oneOf(Object.values(OrderStatus)).required(),
});

export const reservationLogValidatedSchema = object({
  reservationLogId: string().uuid(),
});

export const orderIdValidatedSchema = object({
  orderId: string().uuid().required(),
});

export const createOrderReqBodySchema = object({
  orderMeals: orderMealsValidatedSchema,
});

export const updateOrderReqBodySchema = object({
  id: string().uuid().required(),
  status: string().oneOf(Object.values(OrderStatus)).required(),
  type: string().oneOf(Object.values(OrderType)).required(),
  orderMeals: orderMealsValidatedSchema,
});
