export const config = {
    port: process.env.PORT || 3000,
    mongodb: {
        url:
            process.env.MONGODB_URL ||
            'mongodb://rootuser:rootpass@localhost:27017',
        dbName: process.env.MONGODB_DB_NAME || 'lava-vtt-db',
    },
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        allowedHeaders: [
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
        ],
    },
};
