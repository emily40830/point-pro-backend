import { dayjs } from './dayjs-util';

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
  static log(message: string | Error, level: typeof LogLevel[number] = 'INFO') {
    const now = dayjs().tz('Asia/Taipei').format();
    message = message instanceof Error ? `${message.name} ${message.message} ${message.stack}` : message;
    console.log(`[${level}] ${message} [${now}]`);
  }
}
