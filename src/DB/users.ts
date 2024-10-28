import { UUID } from 'node:crypto';
import { WebSocket } from 'ws';

type user = {
  index: string;
  name: string;
  password: string;
};

export const users: user[] = [];
export const userConnections = new Map<string, WebSocket>();
