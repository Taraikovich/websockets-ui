import { posix } from 'node:path';
import { games, Ship } from '../DB/games';
import { userConnections } from '../DB/users';
import { Message } from '../ws_server';
import { setTurn } from './handleGame';
import { addWinner, sendWinners } from '../DB/winners';
import { WebSocketServer } from 'ws';

export const attack = (
  wss: WebSocketServer,
  userId: string,
  msg: Message,
  random = false
): string => {
  const data = JSON.parse(msg.data);
  const usersGameData = games.get(data.gameId);
  const currentUserData = usersGameData!.find(
    (item) => item.indexPlayer === userId
  );

  if (random) {
    const generateRandomPosition = () => {
      const x = Math.floor(Math.random() * 10);
      const y = Math.floor(Math.random() * 10);
      if (
        currentUserData?.turns.findIndex(
          (item) => item.x === x && item.y === y
        ) === -1
      ) {
        return { x, y };
      } else {
        return generateRandomPosition();
      }
    };
    const position = generateRandomPosition();
    data.x = position?.x;
    data.y = position?.y;
  }

  let status: 'miss' | 'killed' | 'shot' = 'miss';

  let killedShip: Ship;

  let enemyShips = usersGameData?.find(
    (item) => item.indexPlayer !== userId
  )?.ships;

  const shipLengths = {
    small: 1,
    medium: 2,
    large: 3,
    huge: 4,
  };

  enemyShips?.forEach((ship) => {
    if (ship.direction) {
      if (
        data.y >= ship.position.y &&
        data.y < ship.position.y + shipLengths[ship.type] &&
        data.x === ship.position.x
      ) {
        if (ship.length) ship.length -= 1;
        status = ship.length === 0 ? 'killed' : 'shot';
        if (status === 'killed') killedShip = ship;
      }
    } else {
      if (
        data.x >= ship.position.x &&
        data.x < ship.position.x + shipLengths[ship.type] &&
        data.y === ship.position.y
      ) {
        if (ship.length) ship.length -= 1;
        status = ship.length === 0 ? 'killed' : 'shot';
        if (status === 'killed') killedShip = ship;
      }
    }
  });

  let isFinish = false;
  enemyShips = enemyShips?.filter((ship) => ship.length);
  if (enemyShips?.length === 0) {
    isFinish = true;
    addWinner(userId);
  }

  const response = (
    userid: string,
    position: { x: number; y: number } = {
      x: data.x,
      y: data.y,
    },
    statusAttack: 'miss' | 'killed' | 'shot' = status
  ) => ({
    type: 'attack',
    data: JSON.stringify({
      position,
      currentPlayer: userid,
      status: statusAttack,
    }),
    id: msg.id,
  });

  if (
    currentUserData?.isTurn &&
    currentUserData.turns.findIndex(
      (turn) => turn.x === data.x && turn.y === data.y
    ) === -1
  ) {
    const userTurns = usersGameData?.find(
      (item) => item.indexPlayer === userId
    )?.turns;

    userTurns?.push({
      x: data.x,
      y: data.y,
    });

    let nextTurnUserId: string = userId;

    if (status === 'miss') {
      usersGameData!.forEach((item) => {
        if (!item.isTurn) nextTurnUserId = item.indexPlayer;
        item.isTurn = !item.isTurn;
      });
    }

    usersGameData!.forEach((userGameData) => {
      const userWS = userConnections.get(userGameData.indexPlayer);

      if (status === 'killed' && killedShip) {
        const cells = Array.from(
          { length: shipLengths[killedShip.type] },
          (_, index) => {
            if (killedShip.direction) {
              return {
                x: killedShip.position.x,
                y: killedShip.position.y + index,
              };
            } else {
              return {
                x: killedShip.position.x + index,
                y: killedShip.position.y,
              };
            }
          }
        );

        const getMisses = (arg: { x: number; y: number }[]) => {
          const misses: { x: number; y: number }[] = [];

          const positions = [
            { x: 1, y: 0 },
            { x: 1, y: 1 },
            { x: 0, y: 1 },
            { x: -1, y: 1 },
            { x: -1, y: 0 },
            { x: -1, y: -1 },
            { x: 0, y: -1 },
            { x: 1, y: -1 },
          ];

          arg.forEach((cell) => {
            positions.forEach((position) => {
              const x = position.x + cell.x;
              const y = position.y + cell.y;
              if (
                cells.findIndex((cell) => cell.x === x && cell.y === y) ===
                  -1 &&
                x >= 0 &&
                y >= 0
              ) {
                misses.push({ x, y });
                userTurns?.push({ x, y });
              }
            });
          });

          return misses;
        };

        getMisses(cells).forEach((cell) => {
          userWS?.send(JSON.stringify(response(userId, cell, 'miss')));
        });

        cells.forEach((cell) => {
          userWS?.send(JSON.stringify(response(userId, cell, 'killed')));
        });
      } else {
        userWS?.send(JSON.stringify(response(userId)));
      }

      if (userWS) setTurn(userWS, nextTurnUserId, msg);

      if (isFinish) {
        sendWinners(wss, msg);
        const response = {
          type: 'finish',
          data: JSON.stringify({
            winPlayer: userId,
          }),
          id: msg.id,
        };
        if (userWS) {
          userWS.send(JSON.stringify(response));
        }
      }
    });
  }

  return `Position: ${data.x}:${data.y} - ${status}. ${(isFinish) ? 'User WIN!!' : ''}`
};
