import { App } from './app';

async function bootstrap() {
    try {
        const app = new App();
        console.log('Starting application...');
        await app.start();
    } catch (error) {
        console.error('Failed to start application:', error);
        process.exit(1);
    }
}

bootstrap();
