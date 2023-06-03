import { createSeatsData, getCategories, getSpecialtyItems, getSpecialties, getMeals } from './scripts';
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
    await client.category.deleteMany();
    await client.specialty.deleteMany();
    await client.specialtyItem.deleteMany();

    await client.$transaction([...createCategories, ...createSpecialtyItems, ...createSpecialties, ...createMeals]);
  } catch (error) {
    console.log(error);
  }
};

main();
// mockMain();
