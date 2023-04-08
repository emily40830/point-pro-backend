import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Logger } from './helpers/utils';

function createWsServer(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });

  Logger.info('Socket enabled');
  io.on('connection', (socket) => {
    Logger.info(`socket connected. ${socket.id}`);
  });
  io.on('disconnect', () => {
    Logger.info(`socket disconnected.`);
  });
}

export default createWsServer;
