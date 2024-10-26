import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

export const WSserver = createServer();

const wss = new WebSocketServer({ server: WSserver });

wss.on('connection', (ws) => {
  console.log('client connected');

  ws.on('message', (message) => {
    console.log('Received:', message);
    ws.send(`Echo: ${message}`);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
