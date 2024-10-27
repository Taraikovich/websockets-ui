import { WebSocket } from 'ws';
import { games } from '../DB/games';
import { userConnections } from '../DB/users';
import { Message } from '../ws_server';

export const attack = (userId: string, msg: Message) => {
  const data = JSON.parse(msg.data);

  const response = (userid: string) => ({
    type: 'attack',
    data: JSON.stringify({
      position: {
        x: data.x,
        y: data.y,
      },
      currentPlayer: userid,
      status: 'miss',
    }),
    id: msg.id,
  });

  const usersGameData = games.get(data.gameId);

  if (usersGameData!.find((item) => item.indexPlayer === userId)?.isTurn) {
    let nextTurnUserId = '';
    usersGameData!.forEach((item) => {
      if (!item.isTurn) nextTurnUserId = item.indexPlayer;
      item.isTurn = !item.isTurn;
    });
    usersGameData!.forEach((userGameData) => {
      const userWS = userConnections.get(userGameData.indexPlayer);
      userWS!.send(JSON.stringify(response(userId)));
      setTurn(userWS!, nextTurnUserId, msg);
    });
  }
};

const setTurn = (ws: WebSocket, userId: string, msg: Message) => {
  const response = {
    type: 'turn',
    data: JSON.stringify({
      currentPlayer: userId,
    }),
    id: msg.id,
  };

  ws.send(JSON.stringify(response));
};

export const startGame = (user: { name: string; index: string }, msg: Message) => {
  const data = JSON.parse(msg.data);

  if (!games.has(data.gameId)) {
    games.set(data.gameId, []);
  }

  games.get(data.gameId)?.push({
    ships: data.ships,
    indexPlayer: user.index,
    isTurn: false,
  });

  const usersGameData = games.get(data.gameId);
  if (usersGameData && usersGameData.length === 2) {
    const firstPlayerIndex = Math.floor(Math.random() * 2);
    const firstPlayer = usersGameData[firstPlayerIndex].indexPlayer;

    usersGameData?.forEach((player) => {
      const response = {
        type: 'start_game',
        data: JSON.stringify({
          ships: player.ships,
          currentPlayerIndex: player.indexPlayer,
        }),
        id: msg.id,
      };

      if (player.indexPlayer === firstPlayer) player.isTurn = !player.isTurn;

      const userWS = userConnections.get(player.indexPlayer);

      if (userWS) {
        userWS.send(JSON.stringify(response));
        setTurn(userWS, firstPlayer, msg);
      }
    });
  }
};
