import { createServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { handleRegistration } from '../heandlers/handleRegistration';
import { addToRoom, createRoom, sendRooms } from '../heandlers/handleRooms';
import { startGame } from '../heandlers/handleGame';
import { attack } from '../heandlers/handleAttack';
import { sendWinners } from '../DB/winners';

export type Message = {
  type: string;
  data: string;
  id: number;
};

export const WSserver = createServer();

const wss = new WebSocketServer({ server: WSserver });

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');

  const user = { name: '', index: '' };

  ws.on('message', (message: string) => {
    //--
    // const req = JSON.parse(message.toString());
    // console.log(req);
    // if (req.data) console.log(JSON.parse(req.data));
    // console.log(user.index);
    //--

    let msg: Message;

    try {
      msg = JSON.parse(message);
    } catch (e) {
      console.error('Invalid JSON:', message);
      return;
    }
    console.log(`Received command: ${msg.type}`);
    let commandResult = 'Command result: ';

    if (msg.type === 'reg') {
      const result = handleRegistration(ws, msg);
      if (result) {
        [user.name, user.index] = result;
        commandResult = `Logged in user ${user.name}`;
      }
      sendRooms(wss, msg);
      sendWinners(wss, msg);
    } else if (msg.type === 'create_room') {
      const result = createRoom(wss, user, msg);
      if (result) commandResult += `User ${user.name} created room`;
    } else if (msg.type === 'add_user_to_room') {
      const result = addToRoom(wss, ws, user, msg);
      if (result) commandResult += `User ${user.name} added to room`;
    } else if (msg.type === 'add_ships') {
      const result = startGame(user, msg);
      if (result) commandResult += `Game with ID: ${result} started`;
    } else if (msg.type === 'attack') {
      const result = attack(wss, user.index, msg);
      if (result) commandResult += `User: ${user.name}, ${result}`;
    } else if (msg.type === 'randomAttack') {
      const result = attack(wss, user.index, msg, true);
      if (result) commandResult += `User: ${user.name}, ${result}`;
    }

    console.log(commandResult);
  });

  ws.on('close', () => {
    console.log('\nClient disconnected');
  });
});

const shutdown = () => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.close();
    }
  });

  wss.close(() => {
    console.log('\nWebSocket server closed');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
