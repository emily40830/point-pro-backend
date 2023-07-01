import { ReservationLog, ReservationType } from '@prisma/client';

export type ReservationStatus = 'NOT_ATTENDED' | 'IN_USE' | 'COMPLETED';

export type CreateRecord = {
  status: number;
  details: string;
  reservationLogId: string;
};

export type ReservationInfo = {
  id: string;
  reservedAt: Date;
  type: ReservationType;
  status: ReservationStatus;
  options?: { [key: string]: any };
  periodId?: string;
  periodStartedAt?: Date;
  periodEndedAt?: Date;
  startOfMeal: Date | null;
  endOfMeal: Date | null;
  seats: PartialSeat[];
};

export type PartialSeat = {
  id: string;
  seatNo: string;
  amount: number;
};

export type CreateReservation = {
  id: string;
  reservedAt: Date;
  options: { [key: string]: any };
  periodStartedAt: Date;
  periodEndedAt: Date;
  token: string;
  seats: PartialSeat[];
};

export type UpdateReservation = Pick<ReservationLog, 'id' | 'options' | 'startOfMeal' | 'endOfMeal'>;
