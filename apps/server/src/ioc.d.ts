// Create the mapping between ServiceId and Service
import type { Db } from 'mongodb';

type IoCTypes = {
  Db: Db;
};

declare module 'ioc-service-container' {
  export function scg<T extends keyof IoCTypes, U extends IoCTypes[T]>(
    id: T,
  ): U;
}
