// Create the mapping between ServiceId and Service
import type { Db } from 'mongodb';
import { FowService } from './services/fow.service';
import { BackendConduit } from './conduit';
import { DisplayStore } from './display.store';

type IoCTypes = {
  Db: Db;
  DisplayStore: DisplayStore;
  FowService: FowService;
  conduit: BackendConduit;
  newDisplayedImage: (hash: string) => void;
};

declare module 'ioc-service-container' {
  export function scg<T extends keyof IoCTypes, U extends IoCTypes[T]>(
    id: T,
  ): U;
}
