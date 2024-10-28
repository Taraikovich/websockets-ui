import { randomUUID } from 'node:crypto';
import { WebSocket, WebSocketServer } from 'ws';
import { filterRooms, rooms } from '../DB/rooms';
import { userConnections } from '../DB/users';
import { WSserver, Message } from '../ws_server';

export const addToRoom = (
  wss: WebSocketServer,
  ws: WebSocket,
  user: { name: string; index: string },
  msg: Message
): boolean => {
  const data = JSON.parse(msg.data);

  const room = rooms.find((room) => room.roomId === data.indexRoom);

  if (room?.roomUsers[0].index === user.index) return false;

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
  filterRooms();
  sendRooms(wss, msg);
  return true;
};

export const createRoom = (
  wss: WebSocketServer,
  user: { name: string; index: string },
  msg: Message
): boolean => {
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
  return true;
};

export const sendRooms = (wss: WebSocketServer, msg: Message) => {
  const response = {
    type: 'update_room',
    data: JSON.stringify(rooms),
    id: msg.id,
  };

  wss.clients.forEach((client) => {
    client.send(JSON.stringify(response));
  });
};
