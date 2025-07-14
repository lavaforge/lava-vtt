import { MongoClient, Db } from 'mongodb';
import { config } from '../config';

/**
 * Service for managing the database
 */
export class DatabaseService {
    private client: MongoClient;
    private db: Db | null = null;

    constructor() {
        this.client = new MongoClient(config.mongodb.url);
    }

    /**
     * Connect to the database
     * @returns The database
     */
    async connect(): Promise<Db> {
        if (this.db) {
            return this.db;
        }

        await this.client.connect();
        this.db = this.client.db(config.mongodb.dbName);
        return this.db;
    }

    /**
     * Disconnect from the database
     */
    async disconnect(): Promise<void> {
        await this.client.close();
        this.db = null;
    }

    /**
     * Get the database
     * @returns The database
     */
    getDatabase(): Db {
        if (!this.db) {
            throw new Error('Database not connected');
        }
        return this.db;
    }
}
