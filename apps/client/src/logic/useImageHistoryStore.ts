import { defineStore } from 'pinia';
import { ref } from 'vue';
import { scg } from 'ioc-service-container';

/**
 * Represents an image history item with its hash and creation timestamp
 */
interface ImageHistoryItem {
    /** The hash of the image */
    hash: string;
    /** The creation timestamp of the image */
    createdAt: string;
}

/**
 * Pinia store for managing image history
 * Provides functionality to fetch, paginate, and select images from the history
 */
export const useImageHistoryStore = defineStore('imageHistory', () => {
    /** API URL for image endpoints */
    const apiUrl = scg('apiUrl');
    /** Array of image history items */
    const images = ref<ImageHistoryItem[]>([]);
    /** Loading state indicator */
    const isLoading = ref(false);
    /** Error message if any */
    const error = ref<string | null>(null);
    /** Current page number in pagination */
    const currentPage = ref(1);
    /** Total number of pages available */
    const totalPages = ref(1);
    /** Number of items per page */
    const pageSize = ref(10);
    /** Currently selected image hash */
    const selectedImage = ref<string | null>(null);

    /**
     * Fetches images from the API for a specific page
     * @param page - Page number to fetch (defaults to 1)
     */
    async function fetchImages(page: number = 1) {
        isLoading.value = true;
        error.value = null;

        try {
            const response = await fetch(
                `${apiUrl}/api/image?page=${page}&pageSize=${pageSize.value}`,
            );
            if (!response.ok) {
                throw new Error('Failed to fetch images');
            }
            const data = await response.json();
            images.value = data.images;
            totalPages.value = Math.ceil(data.total / pageSize.value);
            currentPage.value = page;
        } catch (err) {
            error.value = 'Failed to load image history';
            console.error('Error fetching images:', err);
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Navigates to the next page if available
     */
    function nextPage() {
        if (currentPage.value < totalPages.value) {
            fetchImages(currentPage.value + 1);
        }
    }

    /**
     * Navigates to the previous page if available
     */
    function prevPage() {
        if (currentPage.value > 1) {
            fetchImages(currentPage.value - 1);
        }
    }

    /**
     * Sets the currently selected image
     * @param hash - Hash of the image to select
     */
    function setSelectedImage(hash: string) {
        selectedImage.value = hash;
    }

    /**
     * Sets the display image
     * @param hash - Hash of the image to set as the display image
     */
    async function setDisplayImage(hash: string) {
        try {
            const response = await fetch(`${apiUrl}/api/display`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ hash }),
            });

            if (!response.ok) {
                throw new Error('Failed to set display image');
            }

            setSelectedImage(hash);
        } catch (err) {
            console.error('Error setting display image:', err);
        }
    }

    /**
     * Reloads the image history by resetting to the first page and fetching fresh data
     * This ensures we get the most up-to-date data from the beginning
     */
    function reload() {
        currentPage.value = 1;
        fetchImages(1);
    }

    return {
        images,
        isLoading,
        error,
        currentPage,
        totalPages,
        pageSize,
        selectedImage,
        fetchImages,
        nextPage,
        prevPage,
        setSelectedImage,
        setDisplayImage,
        reload,
    };
});
