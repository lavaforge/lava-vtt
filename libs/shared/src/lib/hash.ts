import { createHash } from 'crypto';

export function hashBuffer(buffer: Buffer): string {
    return createHash('sha1').update(buffer).digest('hex');
}
