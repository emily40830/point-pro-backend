import { Prisma } from '@prisma/client';
import { ResponseError } from '../types/shared';
import { dayjs } from './dayjs-util';
import { date as dateSchema, object } from 'yup';

export const secret = process.env.POINT_PRO_SECRET || 'point-proo';

export const LogLevel = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'] as const;
export class Logger {
  static fatal(message: string | Error) {
    Logger.log(message, 'FATAL');
  }
  static error(message: string | Error) {
    Logger.log(message, 'ERROR');
  }
  static warn(message: string | Error) {
    Logger.log(message, 'WARN');
  }
  static info(message: string | Error) {
    Logger.log(message, 'INFO');
  }
  static debug(message: string | Error) {
    Logger.log(message, 'DEBUG');
  }
  static trace(message: string | Error) {
    Logger.log(message, 'TRACE');
  }
  static log(message: string | Error, level: (typeof LogLevel)[number] = 'INFO') {
    const now = dayjs().tz('Asia/Taipei').format();
    message = message instanceof Error ? `${message.name} ${message.message} ${message.stack}` : message;
    console.log(`[${level}] ${message} [${now}]`);
  }
}

export const ignoreUndefined = (newValue: any, defaultValue: any) => {
  return newValue !== undefined ? newValue : defaultValue;
};

export const formatReservationOptions = (options: Prisma.JsonValue) => {
  return typeof options === 'object' && options ? options : undefined;
};

export const getDateOnly = (targetDate: Date) => {
  const dateInput = object({
    date: dateSchema()
      .optional()
      .default(() => new Date()),
  });
  const todayDateString = targetDate.toLocaleDateString('zh-tw');
  const { date } = dateInput.cast({ date: todayDateString });

  return date;
};

export const getDefaultDate = () => {
  const dateInput = object({
    date: dateSchema()
      .optional()
      .default(() => new Date()),
  });
  const todayDateString = new Date().toLocaleDateString('zh-tw');
  const { date } = dateInput.cast({ date: todayDateString });

  return date;
};

export const throwError = (
  options: { code?: number; message: string; sendError?: boolean } = { message: '', sendError: true },
) => {
  const error: ResponseError = new Error(options.message);
  error.code = options.code;
  if (options.sendError) {
    Logger.error(error);
  }
  throw error;
};
