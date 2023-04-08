import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Logger } from './helpers/utils';

function createWsServer(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });

  io.on('connection', () => {
    Logger.info('socket connected.');
  });
}

export default createWsServer;
