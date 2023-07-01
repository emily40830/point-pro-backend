import {
  getCategories,
  getSpecialtyItems,
  getSpecialties,
  getSeats,
  getPeriods,
  getMeals,
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
    console.log('delete all periods');

    await client.$transaction([...createPeriods]);
    console.log('create all periods');

    await client.seatPeriod.deleteMany({});
    console.log('delete all seatPeriods');

    const periods = await client.period.findMany({});

    // prefix A
    const seatsA = await client.seat.findMany({
      where: {
        prefix: 'A',
      },
    });
    const seatPeriodsA = getSeatPeriods(periods, seatsA);

    const createSeatPeriodsA = seatPeriodsA.map((seatPeriod, index) => {
      console.log(index, seatPeriod);
      return client.seatPeriod.create({ data: seatPeriod });
    });

    for (let a of createSeatPeriodsA) {
      const result = await a;
      console.log(result);
    }

    // prefix B
    const seatsB = await client.seat.findMany({
      where: {
        prefix: 'B',
      },
    });
    const seatPeriodsB = getSeatPeriods(periods, seatsB);

    console.log(periods, seatsB);
    console.log(seatPeriodsB.length);

    const createSeatPeriodsB = seatPeriodsB.map((seatPeriod, index) => {
      console.log(index, seatPeriod);
      return client.seatPeriod.create({ data: seatPeriod });
    });

    for (let b of createSeatPeriodsB) {
      const result = await b;
      console.log(result);
    }

    // prefix C
    const seatsC = await client.seat.findMany({
      where: {
        prefix: 'C',
      },
    });
    const seatPeriodsC = getSeatPeriods(periods, seatsC);

    console.log(periods, seatsC);
    console.log(seatPeriodsC.length);

    const createSeatPeriodsC = seatPeriodsC.map((seatPeriod, index) => {
      console.log(index, seatPeriod);
      return client.seatPeriod.create({ data: seatPeriod });
    });

    for (let c of createSeatPeriodsC) {
      const result = await c;
      console.log(result);
    }

    // prefix G
    const seatsG = await client.seat.findMany({
      where: {
        prefix: 'G',
      },
    });
    const seatPeriodsG = getSeatPeriods(periods, seatsG);

    console.log(periods, seatsG);
    console.log(seatPeriodsG.length);

    const createSeatPeriodsG = seatPeriodsG.map((seatPeriod, index) => {
      console.log(index, seatPeriod);
      return client.seatPeriod.create({ data: seatPeriod });
    });

    for (let g of createSeatPeriodsG) {
      const result = await g;
      console.log(result);
    }
  } catch (error) {
    console.log(error);
  }
};

main();
