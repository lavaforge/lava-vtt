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
     * Get all images from the database
     * @param page The page number (1-based)
     * @param pageSize The number of items per page
     * @returns The images with pagination metadata
     */
    async getImages(
        page: number = 1,
        pageSize: number = 10,
    ): Promise<{
        images: { hash: string; content: Binary }[];
        total: number;
        page: number;
        pageSize: number;
    }> {
        const skip = (page - 1) * pageSize;
        const total = await this.db.collection('images').countDocuments();

        const images = await this.db
            .collection('images')
            .find({})
            .sort({ _id: -1 }) // _id contains 4 bytes of timestamp so this orders by most recent
            .skip(skip)
            .limit(pageSize)
            .toArray();

        return {
            images: images.map((image) => ({
                hash: image.hash,
                content: image.content,
            })),
            total,
            page,
            pageSize,
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

        // TODO: Consider creating thumbnails

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
