import meals from './seeds/meals.json';
import { Prisma, PrismaClient, SpecialtyType } from '@prisma/client';
import { uniq, uniqBy, prop } from 'ramda';
import * as uuid from 'uuid';

const client = new PrismaClient();

const getCategories = (): Prisma.CategoryCreateInput[] => {
  const categories = meals.reduce<string[]>((prev, curr) => {
    return uniq([...prev, ...curr.categories]);
  }, []);

  return categories.map((category, index) => ({ id: uuid.v4(), title: category, position: index }));
};

const getSpecialties = (): Prisma.SpecialtyCreateInput[] => {
  const specialties = meals.reduce<{ title: string; type?: SpecialtyType; items: string[] }[]>((prev, curr) => {
    if (!curr.specialties) {
      return [];
    }

    return [
      ...prev,
      ...curr.specialties?.map((specialty) => ({
        title: specialty.title,
        type:
          specialty.type === 'single'
            ? (SpecialtyType.SINGLE as SpecialtyType)
            : specialty.type === 'multiple'
            ? (SpecialtyType.MULTIPLE as SpecialtyType)
            : undefined,
        items: uniq(specialty.items),
      })),
    ];
  }, []);
  const uniqueSpecialties = uniqBy(prop('title'), specialties);
  return uniqueSpecialties.map((specialty) => ({
    id: uuid.v4(),
    title: specialty.title,
    type: specialty.type,
    specialtyItems: {
      createMany: {
        data: specialty.items.map((item) => ({
          title: item,
          price: 0,
        })),
        skipDuplicates: true,
      },
    },
  }));
};

const main = async () => {
  const categories = getCategories();
  // console.log(`===== create categories: ${categories.length} =====`);
  const createCategories = categories.map((category) => client.category.create({ data: category }));
  const specialties = getSpecialties();
  const createSpecialties = specialties.map((specialty) => client.specialty.create({ data: specialty }));
  // console.log(`===== create specialties: ${specialties.length} =====`);

  const createMeals = meals.map((meal, index) =>
    client.meal.create({
      data: {
        title: meal.title,
        price: meal.price,
        position: index,
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
          create: meal.specialties?.map((specialty, index) => ({
            position: index,
            specialty: {
              connectOrCreate: {
                where: {
                  type_title: {
                    type:
                      specialty.type === 'multiple' ? (SpecialtyType.MULTIPLE as SpecialtyType) : SpecialtyType.SINGLE,
                    title: specialty.title,
                  },
                },
                create: {
                  title: specialty.title,
                  type:
                    specialty.type === 'single'
                      ? (SpecialtyType.SINGLE as SpecialtyType)
                      : specialty.type === 'multiple'
                      ? (SpecialtyType.MULTIPLE as SpecialtyType)
                      : undefined,
                },
              },
            },
          })),
        },
      },
    }),
  );
  try {
    if ((await client.category.count()) === 0 || (await client.specialty.count()) === 0) {
      await client.$transaction([...createCategories, ...createSpecialties]);
    }
    await client.$transaction([...createMeals]);
  } catch (error) {
    console.log(error);
  }
};

const mockMain = () => {
  console.log(getCategories());
  console.log(JSON.stringify(getSpecialties()));
};

main();
// mockMain();
