// Create the mapping between ServiceId and Service
import type { Db } from 'mongodb';
import { FowService } from './services/fow.service';

type IoCTypes = {
  Db: Db;
  FowService: FowService;
  newDisplayedImage: (hash: string) => void;
};

declare module 'ioc-service-container' {
  export function scg<T extends keyof IoCTypes, U extends IoCTypes[T]>(
    id: T,
  ): U;
}
