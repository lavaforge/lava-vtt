import type { FrontendConduit } from './logic/conduit';

type IoCTypes = {
  conduit: FrontendConduit;
  apiUrl: string;
};

declare module 'ioc-service-container' {
  export function scg<T extends keyof IoCTypes, U extends IoCTypes[T]>(
    id: T,
  ): U;
}
