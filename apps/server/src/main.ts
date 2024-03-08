import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { MongoClient } from 'mongodb';
import { apiRouter } from './routes/api.route';
import { scg, ServiceContainer } from 'ioc-service-container';
import { FowService } from './services/fow.service';

const port = process.env.PORT || 3000;

const url = 'mongodb://rootuser:rootpass@localhost:27017';
const dbName = 'lava-vtt-db';
const client = new MongoClient(url);
await client.connect();
const db = client.db(dbName);
ServiceContainer.set('Db', () => db);
ServiceContainer.set('FowService', FowService);

const app = express();
app.use((req, res, next) => {
  // TODO: Fix for production!!!!!
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin,X-Requested-With,Content-Type,Accept',
  );
  next();
});
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

const fogOfWars = {};
let currentImage = '';

io.on('connection', (socket) => {
  console.log('A user connected');
  console.log(fogOfWars, currentImage);
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });

  socket.on('new-fow', (msg) => {
    console.log('new fow', msg);
    const fowService = scg('FowService');
    void fowService.setFow(currentImage, msg);
    io.emit('fow-broadcast', msg);
  });
});

function newDisplayedImage(hash: string) {
  currentImage = hash;
  console.log('new image on server', hash);
  io.emit('new-image', hash);
}

ServiceContainer.set('newDisplayedImage', () => newDisplayedImage);

app.use('/api', apiRouter);

httpServer.listen(port, async () => {
  console.log('listening on *:3000');
});
