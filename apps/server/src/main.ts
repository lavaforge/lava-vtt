import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { MongoClient } from 'mongodb';
import { apiRouter } from './routes/api.route';
import { ServiceContainer } from 'ioc-service-container';

const port = process.env.PORT || 3000;

const app = express();
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin,X-Requested-With,Content-Type,Accept',
  );
  next();
});
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer);

const fogOfWars = {};
const currentImage = '';

io.on('connection', (socket) => {
  console.log('A user connected');
  console.log(fogOfWars, currentImage);
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });

  if (fogOfWars[currentImage]) {
    setTimeout(
      () => socket.emit('fow-broadcast', fogOfWars[currentImage]),
      100,
    );
  }

  socket.on('new-fow', (msg) => {
    fogOfWars[currentImage] = msg;
    io.emit('fow-broadcast', msg);
  });

  socket.on('loaded', () => {
    if (fogOfWars[currentImage]) {
      socket.emit('fow-broadcast', fogOfWars[currentImage]);
    }
  });
});

app.use('/api', apiRouter);

// Connection URL
const url = 'mongodb://rootuser:rootpass@localhost:27017';
// Replace 'myDatabase' with your database name
const dbName = 'lava-vtt-db';

const client = new MongoClient(url);
httpServer.listen(port, async () => {
  try {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to server');

    const db = client.db(dbName);
    ServiceContainer.set('Db', () => db);

    // Your database interaction code here
    // For example, list the available collections
    const collections = await db.listCollections().toArray();
    console.log(
      'Collections:',
      collections.map((col) => col.name),
    );
  } catch (err) {
    console.error('Connection failed', err);
  } finally {
    // Ensure that the client will close when you finish/error
    // await client.close();
  }

  console.log('listening on *:3000');
});
