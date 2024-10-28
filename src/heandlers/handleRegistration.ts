import { randomUUID } from 'node:crypto';
import { WebSocket } from 'ws';
import { users, userConnections } from '../DB/users';
import { Message } from '../ws_server';

export function handleRegistration(
  ws: WebSocket,
  msg: Message
): [string, string] | void {
  let data;
  try {
    data = JSON.parse(msg.data);
  } catch (e) {
    console.error('Invalid data JSON:', msg.data);
    ws.send(
      JSON.stringify({
        type: 'reg',
        data: JSON.stringify({
          name: '',
          index: null,
          error: true,
          errorText: 'Invalid data format',
        }),
        id: msg.id,
      })
    );
    return;
  }

  const { name, password } = data;
  const user = users.find((user) => user.name === name);

  let responseData;

  if (user) {
    if (user.password === password) {
      responseData = {
        name,
        index: user.index,
        error: false,
        errorText: '',
      };
      userConnections.set(user.index, ws);
    } else {
      responseData = {
        name,
        index: user.index,
        error: true,
        errorText: 'User already exist / Wrong password',
      };
    }
  } else {
    const playerIndex = randomUUID();
    users.push({ index: playerIndex, name, password });

    responseData = {
      name,
      index: playerIndex,
      error: false,
      errorText: '',
    };
    userConnections.set(playerIndex, ws);
  }

  const response = {
    type: 'reg',
    data: JSON.stringify(responseData),
    id: msg.id,
  };

  ws.send(JSON.stringify(response));
  return [responseData.name, responseData.index];
}
