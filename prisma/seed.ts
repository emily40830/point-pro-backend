import meals from './seeds/meals.json';
import categories from './seeds/categories.json';
import specialties from './seeds/specialties.json';
import { Prisma, PrismaClient, SpecialtyType } from '@prisma/client';
import { uniq, uniqBy, prop } from 'ramda';
import * as uuid from 'uuid';

const prisma = new PrismaClient();

const createSpecialties = async () => {
  specialties.forEach(
    async ({ title, type, items }) =>
      await prisma.specialty.create({
        data: {
          title,
          type: type === 'single' ? SpecialtyType.SINGLE : SpecialtyType.MULTIPLE,
          specialtyItems: {
            createMany: {
              data: items,
              skipDuplicates: true,
            },
          },
        },
      }),
  );
};

const createCategories = async () => {
  await prisma.category.createMany({
    data: categories.map((category, index) => ({
      title: category,
      position: index,
    })),
    skipDuplicates: true,
  });
};

const createMeals = async () => {
  meals.forEach(async (meal, index) => {
    await prisma.meal.create({
      data: {
        ...meal,
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
          create: meal.specialties.map((specialty) => ({
            specialty: {
              connectOrCreate: {
                where: { title: specialty },
                create: { title: specialty },
              },
            },
          })),
        },
      },
    });
  });
};

const load = async () => {
  try {
    // remove data
    await prisma.category.deleteMany();
    await prisma.meal.deleteMany();
    await prisma.specialty.deleteMany();

    // insert data
    await createSpecialties();
    await createCategories();
    await createMeals();
  } catch (e) {
    console.error(e);
  }
};

load();

// const getCategories = (): Prisma.CategoryCreateInput[] => {
//   const categories = meals.reduce<string[]>((prev, curr) => {
//     return uniq([...prev, ...curr.categories]);
//   }, []);

//   return categories.map((category, index) => ({ id: uuid.v4(), title: category, position: index }));
// };

// const getSpecialties = (): Prisma.SpecialtyCreateInput[] => {
//   const specialties = meals.reduce<{ title: string; type?: SpecialtyType; items: string[] }[]>((prev, curr) => {
//     if (!curr.specialties) {
//       return [];
//     }

//     return [
//       ...prev,
//       ...curr.specialties?.map((specialty) => ({
//         title: specialty.title,
//         type:
//           specialty.type === 'single'
//             ? (SpecialtyType.SINGLE as SpecialtyType)
//             : specialty.type === 'multiple'
//             ? (SpecialtyType.MULTIPLE as SpecialtyType)
//             : undefined,
//         items: uniq(specialty.items),
//       })),
//     ];
//   }, []);
//   const uniqueSpecialties = uniqBy(prop('title'), specialties);
//   return uniqueSpecialties.map((specialty) => ({
//     id: uuid.v4(),
//     title: specialty.title,
//     type: specialty.type,
//     specialtyItems: {
//       createMany: {
//         data: specialty.items.map((item) => ({
//           title: item,
//           price: 0,
//         })),
//         skipDuplicates: true,
//       },
//     },
//   }));
// };

// const main = async () => {
//   const categories = getCategories();

//   const createCategories = categories.map((category) => client.category.create({ data: category }));
//   const specialties = getSpecialties();
//   const createSpecialties = specialties.map((specialty) => client.specialty.create({ data: specialty }));

//   const createMeals = meals.map((meal, index) =>
//     client.meal.create({
//       data: {
//         title: meal.title,
//         price: meal.price,
//         position: index,
//         categories: {
//           create: meal.categories.map((category) => ({
//             category: {
//               connectOrCreate: {
//                 where: { title: category },
//                 create: { title: category },
//               },
//             },
//           })),
//         },
//         specialties: {
//           create: meal.specialties?.map((specialty, index) => ({
//             position: index,
//             specialty: {
//               connectOrCreate: {
//                 where: {
//                   type_title: {
//                     type:
//                       specialty.type === 'multiple' ? (SpecialtyType.MULTIPLE as SpecialtyType) : SpecialtyType.SINGLE,
//                     title: specialty.title,
//                   },
//                 },
//                 create: {
//                   title: specialty.title,
//                   type:
//                     specialty.type === 'single'
//                       ? (SpecialtyType.SINGLE as SpecialtyType)
//                       : specialty.type === 'multiple'
//                       ? (SpecialtyType.MULTIPLE as SpecialtyType)
//                       : undefined,
//                 },
//               },
//             },
//           })),
//         },
//       },
//     }),
//   );
//   try {
//     if ((await client.category.count()) === 0 || (await client.specialty.count()) === 0) {
//       await client.$transaction([...createCategories, ...createSpecialties]);
//     }
//     await client.$transaction([...createMeals]);
//   } catch (error) {
//     console.log(error);
//   }
// };

// main();
// mockMain();
