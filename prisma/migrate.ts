import { getCategories, getSpecialtyItems, getSpecialties, getMeals } from './scripts';
import client from './client';

const main = async () => {
  const categories = getCategories();
  const createCategories = categories.map((category) => client.category.create({ data: category }));

  const specialtyItems = getSpecialtyItems();
  const createSpecialtyItems = specialtyItems.map((item) => client.specialtyItem.create({ data: item }));

  const specialties = getSpecialties(specialtyItems);
  const createSpecialties = specialties.map((specialty) => client.specialty.create({ data: specialty }));

  const meals = getMeals();
  const createMeals = meals.map((meal) => client.meal.create({ data: meal }));

  try {
    await client.meal.deleteMany();
    console.info('delete all meals');

    await client.category.deleteMany();
    console.info('delete all categories');

    await client.specialty.deleteMany();
    console.info('delete all specialties');

    await client.specialtyItem.deleteMany();
    console.info('delete all specialty items');

    await client.$transaction([...createCategories]);
    console.info('create all categories');

    await client.$transaction([...createSpecialtyItems]);
    console.info('create all specialty items');

    await client.$transaction([...createSpecialties]);
    console.info('create all specialties');

    await client.$transaction([...createMeals]);
    console.info('create all meals');
  } catch (error) {
    console.log(error);
  }
};

main();
// mockMain();
