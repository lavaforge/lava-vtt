<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { scg } from 'ioc-service-container';

interface ImageHistoryItem {
    hash: string;
    createdAt: string;
}

const images = ref<ImageHistoryItem[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const currentPage = ref(1);
const totalPages = ref(1);
const pageSize = ref(10);
const apiUrl = scg('apiUrl');

/**
 * Extracts the creation date from a MongoDB ObjectId
 * @param id - The MongoDB ObjectId
 * @returns The creation date
 */
function getCreationDate(id: string): Date {
    // Extract the timestamp from the ObjectId (first 4 bytes)
    const timestamp = parseInt(id.substring(0, 8), 16) * 1000;
    return new Date(timestamp);
}

/**
 * Fetches the images from the server
 * @param page - The page number to fetch
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

function nextPage() {
    if (currentPage.value < totalPages.value) {
        fetchImages(currentPage.value + 1);
    }
}

function prevPage() {
    if (currentPage.value > 1) {
        fetchImages(currentPage.value - 1);
    }
}

onMounted(() => {
    fetchImages();
});
</script>

<template>
    <div class="image-history">
        <h2>Image History</h2>
        <div
            v-if="isLoading"
            class="loading"
        >
            Loading...
        </div>
        <div
            v-else-if="error"
            class="error"
        >
            {{ error }}
        </div>
        <div
            v-else
            class="images"
        >
            <div
                v-for="image in images"
                :key="image.hash"
                class="image"
            >
                <img :src="`${apiUrl}/api/image/${image.hash}`" />
                <span class="timestamp">{{
                    new Date(image.createdAt).toLocaleString()
                }}</span>
            </div>
        </div>

        <div class="pagination-controls">
            <button
                @click="prevPage"
                :disabled="currentPage === 1 || isLoading"
                class="pagination-button"
            >
                Previous
            </button>
            <span class="page-info">
                Page {{ currentPage }} of {{ totalPages }}
            </span>
            <button
                @click="nextPage"
                :disabled="currentPage === totalPages || isLoading"
                class="pagination-button"
            >
                Next
            </button>
        </div>
    </div>
</template>

<style scoped lang="scss">
.image-history {
    border-left: 1px solid #22312f;
    padding: 1rem;
    color: #ddd;
    height: 100%;
    overflow-y: auto;
    width: 250px;

    h2 {
        margin-top: 0;
        margin-bottom: 1rem;
    }

    .loading,
    .error {
        text-align: center;
        padding: 1rem;
    }

    .error {
        color: #ff4444;
    }

    .images {
        display: flex;
        flex-direction: column;
        gap: 1rem;

        .image {
            img {
                width: 100%;
                height: auto;
                border-radius: 0.25rem;
            }

            .timestamp {
                display: block;
                font-size: 0.8rem;
                color: #999;
                margin-top: 0.25rem;
            }
        }
    }

    .pagination-controls {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        margin-top: 1rem;
    }

    .pagination-button {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.25rem;
        background-color: #fefcf1;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover:not(:disabled) {
            background-color: #fbb457;
        }

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    }

    .page-info {
        color: #ddd;
    }
}
</style>
