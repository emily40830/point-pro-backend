import { object, string, array, number } from 'yup';

export const orderSchema = object().shape({
  status: string().required(),
  type: string().required(),
  reservationId: string().optional(),
  orderMeals: array()
    .of(
      object().shape({
        mealId: string().required(),
        mealTitle: string().required(),
        price: number().required(),
        specialities: object().required(),
        categories: array().of(string()).required(),
        amount: number().required(),
        servedAmount: number().required(),
      }),
    )
    .required(),
});
