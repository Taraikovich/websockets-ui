type Ship = {
  position: { x: number; y: number };
  direction: boolean;
  type: 'small' | 'medium' | 'large' | 'huge';
  length: number;
};

type Player = {
  isTurn: boolean;
  indexPlayer: string;
  ships: Ship[];
};

type GameID = string;

export const games = new Map<GameID, Player[]>();
