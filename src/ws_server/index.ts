import { createServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { handleRegistration } from '../heandlers/handleRegistration';
import { addToRoom, createRoom, sendRooms } from '../heandlers/handleRooms';
import { attack, startGame } from '../heandlers/handleGame';

export type Message = {
  type: string;
  data: string;
  id: number;
};

export const WSserver = createServer();

const wss = new WebSocketServer({ server: WSserver });

wss.on('connection', (ws: WebSocket) => {
  console.log('client connected');

  const user = { name: '', index: '' };

  ws.on('message', (message: string) => {
    //--
    const req = JSON.parse(message.toString());
    console.log(req);
    if (req.data) console.log(JSON.parse(req.data));
    console.log(user.index);
    //--

    let msg: Message;

    try {
      msg = JSON.parse(message);
    } catch (e) {
      console.error('Invalid JSON:', message);
      return;
    }

    if (msg.type === 'reg') {
      const result = handleRegistration(ws, msg);
      if (result) [user.name, user.index] = result;
      console.log(result);
      console.log(user);
      sendRooms(wss, msg);
    } else if (msg.type === 'create_room') {
      console.log('User creating room:', user);
      createRoom(wss, user, msg);
    } else if (msg.type === 'add_user_to_room') {
      addToRoom(ws, user, msg);
    } else if (msg.type === 'add_ships') {
      startGame(user, msg);
    } else if (msg.type === 'attack') {
      attack(user.index, msg);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
