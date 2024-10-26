import { readFile } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'node:http';

export const httpServer = createServer((req, res) => {
  const file_path = join(
    process.cwd(),
    req.url === '/' ? '/front/index.html' : '/front' + req.url
  );
  readFile(file_path, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
});
