export class DisplayStore {
  private _currentHash: string | null = null;

  get currentHash(): string | null {
    return this._currentHash;
  }

  set currentHash(value: string) {
    this._currentHash = value;
  }
}
