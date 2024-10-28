import { WebSocketServer } from 'ws';
import { sendRooms } from '../heandlers/handleRooms';

type Room = {
  roomId: string;
  roomUsers: { name: string; index: string }[];
};

export let rooms: Room[] = [];

export const filterRooms = () => {
  rooms = rooms.filter((room) => room?.roomUsers.length === 2);
};
