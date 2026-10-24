import { createServer } from 'node:http';
import app from './app.js';

const PORT = process.env.PORT || 5000;
const server = createServer(app);

server.requestTimeout = 120000;
server.timeout = 120000;
server.headersTimeout = 125000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
