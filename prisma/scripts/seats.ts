import { Prisma } from '@prisma/client';
import * as uuid from 'uuid';

import seats from '../data/seats.json';
import client from '../client';

export const getSeats = (): {
  seats: Prisma.SeatCreateInput[];
  siblings: {
    seat: string;
    nextSeat: string;
  }[];
} => {
  const { data: seatsData, siblings } = seats;

  return {
    seats: seatsData.map((seat) => ({
      id: uuid.v4(),
      prefix: seat.prefix,
      no: seat.no,
      amount: seat.peopleAmount,
    })),
    siblings,
  };
};

const main = async () => {
  const { seats, siblings } = getSeats();

  const createSeats = seats.map((seat) =>
    client.seat.create({
      data: seat,
    }),
  );

  try {
    if ((await client.seat.count()) === 0) {
      await client.$transaction([...createSeats]);
    }

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
  } catch (error) {
    console.log(error);
  }
};
