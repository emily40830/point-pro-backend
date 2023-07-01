import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Namespace } from 'socket.io/dist/namespace';
import { Logger } from './helpers/utils';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { verifyAdminSchema, verifyReservationSchema } from './middleware';

const secret = process.env.POINT_PRO_SECRET || 'point-proo';

// Type
type SocketArgType = {
  mainNs: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
  adminNs: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
  userNs: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
};

enum NameSpace {
  main = '/',
  user = '/user',
  admin = '/admin',
}

enum SocketTopic {
  MENU = 'MENU',
  ORDER = 'ORDER',
  RESERVATION = 'RESERVATION',
}

// Main Socket (for booking user)
function mainSocket({ mainNs, adminNs, userNs }: SocketArgType) {
  mainNs.on('connect', (socket) => {
    // Listeners
    socket.on(SocketTopic.RESERVATION, (reservation) => {
      adminNs.emit(SocketTopic.RESERVATION, reservation);
    });

    Logger.info(`BOOKING connected: ${socket.id}`);
  });

  mainNs.on('disconnect', (socket) => {
    Logger.info(`BOOKING disconnected: ${socket.id}`);
  });
}

// User Socket (for order user)
function usersSocket({ mainNs, adminNs, userNs }: SocketArgType) {
  userNs.on('connect', (socket) => {
    try {
      // Verify & Decode Token
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, secret);
      verifyReservationSchema.validateSync(decoded);
      const reservation = verifyReservationSchema.cast(decoded);

      // Join Room
      socket.join(reservation.reservationLogId);

      // Listeners
      socket.on(SocketTopic.ORDER, (order) => {
        userNs.to(reservation.reservationLogId).emit(SocketTopic.ORDER, order);
        adminNs.emit(SocketTopic.ORDER, order);
      });

      Logger.info(`USER connected: ${socket.id}`);
    } catch (error) {
      socket.disconnect();
      Logger.error(JSON.stringify(error));
    }
  });

  userNs.on('disconnect', (socket) => {
    Logger.info(`USER disconnected: ${socket.id}`);
  });
}

// Admin Socket
function adminsSocket({ mainNs, adminNs, userNs }: SocketArgType) {
  adminNs.on('connect', (socket) => {
    try {
      // Verify & Decode token
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, secret);
      verifyAdminSchema.validateSync(decoded);
      const admin = verifyAdminSchema.cast(decoded);

      // Join Room
      socket.join(admin.memberId);

      // Listeners
      socket.on(SocketTopic.MENU, (menu) => {
        adminNs.except(admin.memberId).emit(SocketTopic.MENU, menu);
        userNs.emit(SocketTopic.MENU, menu);
      });
      socket.on(SocketTopic.ORDER, (order) => {
        adminNs.except(admin.memberId).emit(SocketTopic.ORDER, order);
        userNs.to(order.result.reservationLogId).emit(SocketTopic.ORDER, order);
      });
      socket.on(SocketTopic.RESERVATION, (reservation) => {
        adminNs.except(admin.memberId).emit(SocketTopic.RESERVATION, reservation);
        userNs.emit(SocketTopic.RESERVATION, reservation);
      });

      Logger.info(`ADMIN connected: ${socket.id}`);
    } catch (error) {
      socket.disconnect();
      Logger.error(JSON.stringify(error));
    }
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
  const mainNs = io.of(NameSpace.main);
  const userNs = io.of(NameSpace.user);
  const adminNs = io.of(NameSpace.admin);

  const socketArgs = {
    mainNs,
    userNs,
    adminNs,
  };

  mainSocket(socketArgs);
  usersSocket(socketArgs);
  adminsSocket(socketArgs);
}

export default createWsServer;
