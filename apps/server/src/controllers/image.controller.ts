import { scg } from 'ioc-service-container';
import { Binary } from 'mongodb';
import { fileTypeFromBuffer } from 'file-type';
import { createHash } from 'crypto';

/**
 * Service for managing images
 */
export class ImageController {
    private readonly db = scg('Db');

    /**
     * Get an image from the database
     * @param hash The hash of the image
     * @returns The image buffer and mime type
     */
    async getImage(
        hash: string,
    ): Promise<{ buffer: Buffer; mimeType: string } | null> {
        const image = await this.db.collection('images').findOne({ hash });

        if (image === null) {
            return null;
        }

        const mimeType =
            (await fileTypeFromBuffer(image.content.buffer))?.mime ??
            'image/png';
        return {
            buffer: image.content.buffer,
            mimeType,
        };
    }

    /**
     * Save an image to the database
     * @param buffer The image buffer
     * @returns The hash of the image
     */
    async saveImage(buffer: Buffer): Promise<string> {
        const hash = this.hashBuffer(buffer);
        const binary = new Binary(buffer as unknown as Uint8Array);

        await this.db
            .collection('images')
            .updateOne(
                { hash },
                { $setOnInsert: { content: binary, hash } },
                { upsert: true },
            );

        return hash;
    }

    /**
     * Hash a buffer
     * @param buffer The buffer to hash
     * @returns The hash of the buffer
     */
    private hashBuffer(buffer: Buffer): string {
        return createHash('sha1')
            .update(buffer as unknown as Uint8Array)
            .digest('hex');
    }
}
