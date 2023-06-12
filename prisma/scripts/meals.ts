import { Prisma, SpecialtyType } from '@prisma/client';
import { meals, specialties, categories } from '../data';
import { dayjs } from '../../src/helpers/dayjs-util';
import * as uuid from 'uuid';

export const getSpecialtyItems = (): Prisma.SpecialtyItemCreateInput[] => {
  const specialtyItems = specialties.reduce((prev: { title: string; price?: number }[], curr, currIndex) => {
    return [...prev, ...curr.items];
  }, []);

  return specialtyItems.map((item) => ({
    id: uuid.v4(),
    title: item.title,
    price: item.price,
  }));
};

export const getSpecialties = (
  specialtyItemCreateInput: Prisma.SpecialtyItemCreateInput[],
): Prisma.SpecialtyCreateInput[] => {
  const newSpecialties = specialties.map((specialty) => ({
    ...specialty,
    items: specialty.items.map((item) => {
      const itemCreateInputIds = specialtyItemCreateInput.filter((inputItem) => inputItem.title === item.title);

      return {
        ...item,
        id: itemCreateInputIds && itemCreateInputIds[0].id ? itemCreateInputIds[0].id : uuid.v4(),
      };
    }),
  }));

  return newSpecialties.map((specialty) => ({
    title: specialty.title,
    type:
      specialty.type === 'single'
        ? (SpecialtyType.SINGLE as SpecialtyType)
        : specialty.type === 'multiple'
        ? (SpecialtyType.MULTIPLE as SpecialtyType)
        : undefined,
    items: {
      createMany: {
        data: specialty.items.map<Prisma.SpecialtiesOnSpecialtyItemsCreateManySpecialtyInput>((itemInput, index) => ({
          specialtyItemId: itemInput.id,
          position: index,
        })),
        skipDuplicates: true,
      },
    },
  }));
};

export const getCategories = (): Prisma.CategoryCreateInput[] => {
  return categories.map((category, index) => ({
    id: uuid.v4(),
    title: category,
    position: index,
  }));
};

export const getMeals = (): Prisma.MealCreateInput[] => {
  return meals.map<Prisma.MealCreateInput>((meal, index) => ({
    id: uuid.v4(),
    title: meal.title,
    price: meal.price,
    position: index,
    description: meal.description,
    coverUrl: meal.coverUrl,
    isPopular: !!meal.isPopular,
    publishedAt: dayjs().startOf('year').toDate(),
    categories: {
      create: meal.categories.map((category) => ({
        category: {
          connectOrCreate: {
            where: { title: category },
            create: { title: category },
          },
        },
      })),
    },
    specialties: {
      create: meal.specialties.map((specialty) => ({
        specialty: {
          connectOrCreate: {
            where: { title: specialty },
            create: { title: specialty },
          },
        },
      })),
    },
  }));
};
