// Create the mapping between ServiceId and Service
import type { Db } from 'mongodb';
import { FowService } from './services/fow.service';
import { DrawingService } from './services/drawing.service';
import { BackendConduit } from './conduit/BackendConduit';
import { DisplayStore } from './display.store';

type IoCTypes = {
    Db: Db;
    DisplayStore: DisplayStore;
    DrawingService: DrawingService;
    FowService: FowService;
    conduit: BackendConduit;
    newDisplayedImage: (hash: string) => void;
};

declare module 'ioc-service-container' {
    export function scg<T extends keyof IoCTypes, U extends IoCTypes[T]>(
        id: T,
    ): U;
}
