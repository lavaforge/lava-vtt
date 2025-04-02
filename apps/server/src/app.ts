import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { ServiceContainer } from 'ioc-service-container';
import { FowService } from './services/fow.service';
import { DrawingService } from './services/drawing.service';
import { BackendConduit } from './conduit/BackendConduit';
import { DisplayStore } from './display.store';
import { attuneToFogOfWarVeins } from './conduit/fowAttunement';
import { attuneToDrawingVeins } from './conduit/drawingAttunement';
import router from './routes';
import { config } from './config';
import { DatabaseService } from './services/database.service';
import { ImageController } from './controllers/image.controller';

/**
 * The main application class
 */
export class App {
    private app = express();
    private httpServer = createServer(this.app);
    private io = new Server(this.httpServer, {
        cors: {
            origin: config.cors.origin,
        },
    });
    private databaseService: DatabaseService;

    constructor() {
        this.databaseService = new DatabaseService();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupServices();
        this.setupSocketIO();
    }

    /**
     * Setup the middleware
     */
    private setupMiddleware(): void {
        this.app.use((req, res, next) => {
            res.setHeader('Access-Control-Allow-Origin', config.cors.origin);
            res.setHeader(
                'Access-Control-Allow-Headers',
                config.cors.allowedHeaders.join(','),
            );
            next();
        });
        this.app.use(express.json());
    }

    /**
     * Setup the router
     */
    private setupRoutes(): void {
        this.app.use('/api', router);
    }

    /**
     * Setup the services
     */
    private setupServices(): void {
        // TODO: May setup each in the definition file
        ServiceContainer.set('Db', () => this.databaseService.getDatabase());
        ServiceContainer.set('FowService', FowService);
        ServiceContainer.set('DrawingService', DrawingService);
        ServiceContainer.set('DisplayStore', DisplayStore);
        ServiceContainer.set('ImageController', ImageController);
    }

    /**
     * Setup the socket.io
     */
    private setupSocketIO(): void {
        const conduit = new BackendConduit(this.io);
        ServiceContainer.set('conduit', () => conduit);

        attuneToFogOfWarVeins();
        attuneToDrawingVeins();
    }

    /**
     * Start the application
     */
    public async start(): Promise<void> {
        try {
            // Connect to database first
            await this.databaseService.connect();

            // Start HTTP server
            this.httpServer.listen(config.port, () => {
                console.log(`Server listening on port ${config.port}`);
            });

            // Handle graceful shutdown
            process.on('SIGTERM', () => this.stop());
            process.on('SIGINT', () => this.stop());
        } catch (error) {
            console.error('Failed to start application:', error);
            await this.stop();
            process.exit(1);
        }
    }

    /**
     * Stop the application
     */
    public async stop(): Promise<void> {
        console.log('Shutting down application...');

        // Close HTTP server
        this.httpServer.close();

        // Close database connection
        await this.databaseService.disconnect();

        console.log('Application stopped');
    }
}
