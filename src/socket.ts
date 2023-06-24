import { Server as HttpServer } from 'http';
import { Socket, Server as SocketIOServer } from 'socket.io';
import { ExtendedError, Namespace } from 'socket.io/dist/namespace';
import { Logger } from './helpers/utils';
import jwt from 'jsonwebtoken';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { ReservationType } from '@prisma/client';

const secret = process.env.POINT_PRO_SECRET || 'point-proo';

// Type
type SocketArgType = {
  mainNs: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
  adminNs: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
  userNs: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
};
type UsersSocketArgType = SocketArgType;
type AdminsSocketArgType = SocketArgType;
enum SocketTopic {
  MENU = 'MENU',
  ORDER = 'ORDER',
  RESERVATION = 'RESERVATION',
}

// [TODO] have jwt type to import?
type JWTDecodedType = {
  seatNo: string;
  reservationType: ReservationType;
  startTime: string;
  reservationLogId: string;
  periodStartTime: string;
  periodEndTime: string;
  iat: number;
  exp: number;
};

// Authentication
function validated(socket: Socket, next: (err?: ExtendedError | undefined) => void) {
  // [TODO] Is validation work?
  const token = socket.handshake.auth.token;
  try {
    const decodedJWT = jwt.verify(token, secret);
    Logger.info(`TOEKN: ${JSON.stringify(decodedJWT)}`);
    next();
  } catch (error) {
    if (error instanceof Error) {
      next(new Error(error.message));
    }
  }
}

// User Socket
function usersSocket({ mainNs, adminNs, userNs }: UsersSocketArgType) {
  userNs.use(validated);

  userNs.on('connect', (socket) => {
    const token = socket.handshake.auth.token;

    Logger.info(`USER connected: ${socket.id}`);
    socket.join(token);
    // Listeners
    socket.on(SocketTopic.ORDER, (order) => {
      userNs.to(token).emit(SocketTopic.ORDER, order);
      adminNs.emit(SocketTopic.ORDER, order);
    });
    socket.on(SocketTopic.RESERVATION, (reservation) => {
      adminNs.emit(SocketTopic.RESERVATION, reservation);
    });
  });

  userNs.on('disconnect', (socket) => {
    Logger.info(`USER disconnected: ${socket.id}`);
  });
}

// Admin Socket
function adminsSocket({ mainNs, adminNs, userNs }: AdminsSocketArgType) {
  adminNs.use(validated);

  adminNs.on('connect', (socket) => {
    Logger.info(`ADMIN connected: ${socket.id}`);

    // Listeners
    socket.on(SocketTopic.MENU, (menu) => {
      adminNs.emit(SocketTopic.MENU, menu);
      userNs.emit(SocketTopic.MENU, menu);
    });
    socket.on(SocketTopic.ORDER, (order) => {
      Logger.info(`ADMIN Order: ${JSON.stringify(order)}`);
      // [TODO] when admin update order, only the order's user will get the socket. need {room} id
      adminNs.emit(SocketTopic.ORDER, order);
      userNs.emit(SocketTopic.ORDER, order);
    });
    socket.on(SocketTopic.RESERVATION, (reservation) => {
      adminNs.emit(SocketTopic.RESERVATION, reservation);
      userNs.emit(SocketTopic.RESERVATION, reservation);
    });
  });

  adminNs.on('disconnect', (socket) => {
    Logger.info(`ADMIN disconnected: ${socket.id}`);
  });
}

// Socket Server
function createWsServer(httpServer: HttpServer) {
  // [TODO] CORS setting
  const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });

  // Namespaces
  const mainNs = io.of('/');
  const adminNs = io.of('/admin');
  const userNs = io.of('/user');

  const socketArgs = { mainNs, adminNs, userNs };

  usersSocket(socketArgs);
  adminsSocket(socketArgs);
}

export default createWsServer;
