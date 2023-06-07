import {
  getCategories,
  getSpecialtyItems,
  getSpecialties,
  getMeals,
  getSeats,
  getPeriods,
  getSeatPeriods,
} from './scripts';
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

  const { seats, siblings } = getSeats();

  const createSeats = seats.map((seat) =>
    client.seat.create({
      data: seat,
    }),
  );

  const periods = getPeriods();

  const createPeriods = periods.map((period) => client.period.create({ data: period }));

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

    await client.seatSibling.deleteMany();
    await client.seat.deleteMany();

    await client.$transaction([...createSeats]);

    if ((await client.seat.count()) > 0 && (await client.seatSibling.count()) === 0) {
      for (const sibling of siblings) {
        const seat = await client.seat.findUnique({
          where: {
            seatNo: { prefix: sibling.seat.substring(0, 1), no: parseInt(sibling.seat.substring(1)) },
          },
        });

        const nextSeat = await client.seat.findUnique({
          where: {
            seatNo: {
              prefix: sibling.nextSeat.substring(0, 1),
              no: parseInt(sibling.nextSeat.substring(1)),
            },
          },
        });

        if (!seat) {
          console.log(`seat: ${sibling.seat} not found`);
          continue;
        }
        if (!nextSeat) {
          console.log(`next_seat: ${sibling.nextSeat} not found`);
          continue;
        }

        await client.seatSibling.create({
          data: {
            seatId: seat.id,
            nextSeatId: nextSeat.id,
          },
        });
      }
    }

    await client.period.deleteMany();
    await client.$transaction([...createPeriods]);

    const seats = await client.seat.findMany();
    const periods = await client.period.findMany();
    const seatPeriods = getSeatPeriods(seats, periods);

    if (seats && periods) {
      await client.seatPeriod.deleteMany();

      // For Local
      for (let i = 0; i < 20; i++) {
        const curr = seatPeriods[i];
        await client.$transaction([client.seatPeriod.create({ data: curr })]);
        console.info(curr.startedAt, curr.seat);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

main();
