import { randomUUID } from 'node:crypto';
import { WebSocket, WebSocketServer } from 'ws';
import { rooms } from '../DB/rooms';
import { userConnections } from '../DB/users';
import { Message } from '../ws_server';

export const addToRoom = (
  ws: WebSocket,
  user: { name: string; index: string },
  msg: Message
): string => {
  const data = JSON.parse(msg.data);

  const room = rooms.find((room) => room.roomId === data.indexRoom);
  const idGame = randomUUID();
  const secondUserWs = userConnections.get(room!.roomUsers[0].index);

  const response = (idPlayer: string) => {
    const res = {
      type: 'create_game',
      data: JSON.stringify({
        idGame,
        idPlayer,
      }),
      id: msg.id,
    };

    return JSON.stringify(res);
  };

  ws.send(response(user.index));
  secondUserWs!.send(response(room!.roomUsers[0].index));
  return idGame;
};

export const createRoom = (
  wss: WebSocketServer,
  user: { name: string; index: string },
  msg: Message
) => {
  const room = {
    roomId: randomUUID(),
    roomUsers: [
      {
        name: user.name,
        index: user.index,
      },
    ],
  };
  rooms.push(room);
  sendRooms(wss, msg);
};

export const sendRooms = (wss: WebSocketServer, msg: Message) => {
  const response = {
    type: 'update_room',
    data: JSON.stringify(rooms),
    id: msg.id,
  };

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(response));
    }
  });
};
