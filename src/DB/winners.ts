import { WebSocketServer } from 'ws';
import { Message } from '../ws_server';
import { users } from './users';

const winners: { name: string; wins: number }[] = [];

export const addWinner = (userId: string) => {
  const userName = users.find((user) => user.index === userId)?.name;
  const winner = winners.find((winner) => winner.name === userName);
  if (winner) {
    winner.wins += 1;
  } else {
    if (userName) winners.push({ name: userName, wins: 1 });
  }
};

export const sendWinners = (wss: WebSocketServer, msq: Message) => {
  const response = {
    type: 'update_winners',
    data: JSON.stringify(winners),
    id: msq.id,
  };

  wss.clients.forEach((client) => {
    client.send(JSON.stringify(response));
  });
};
