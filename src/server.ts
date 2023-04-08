require('dotenv-flow').config();

import http from 'http';
import app from './app';
import createWsServer from './socket';

const port = parseInt(process.env.PORT || '8081');

app.set('port', port);

const server = http.createServer(app);
server.listen(port, () => {
  createWsServer(server);
});

server.on('error', console.error);

server.on('listening', () => {
  const addr = server.address();
  if (!addr) {
    return console.error('cannot get the address from server');
  }
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  console.log('Listening on ' + bind);
});

process.on('SIGINT', () => {
  console.log('close server');
  server.close(() => {
    console.log('kill Node process');
    process.exit(0);
  });
});
