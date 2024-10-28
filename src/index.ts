import { httpServer } from './http_server/index';
import { WSserver } from './ws_server/index';

const HTTP_PORT = 8181;

httpServer.listen(HTTP_PORT, () => {
  console.log(`Start static http server on the ${HTTP_PORT} port!`);
});

WSserver.listen(3000, () => {
  console.log(`WebSocket server running at ws://localhost:3000/`);
});
