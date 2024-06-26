import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { MongoClient } from 'mongodb';
import { apiRouter } from './routes/api.route';
import { ServiceContainer } from 'ioc-service-container';
import { FowService } from './services/fow.service';
import { DrawingService } from './services/drawing.service';
import { BackendConduit } from './conduit/BackendConduit';
import { DisplayStore } from './display.store';
import { attuneToFogOfWarVeins } from './conduit/fowAttunement';
import { attuneToDrawingVeins } from './conduit/drawingAttunement';

const port = process.env.PORT || 3000;

const url = 'mongodb://rootuser:rootpass@localhost:27017';
const dbName = 'lava-vtt-db';
const client = new MongoClient(url);
await client.connect();
const db = client.db(dbName);

ServiceContainer.set('Db', () => db);
ServiceContainer.set('FowService', FowService);
ServiceContainer.set('DrawingService', DrawingService);
ServiceContainer.set('DisplayStore', DisplayStore);

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

const conduit = new BackendConduit(io);
ServiceContainer.set('conduit', () => conduit);

attuneToFogOfWarVeins();
attuneToDrawingVeins();

app.use('/api', apiRouter);

httpServer.listen(port, async () => {
    console.log('listening on *:3000');
});
