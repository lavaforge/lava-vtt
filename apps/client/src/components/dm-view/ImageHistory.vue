<script setup lang="ts">
import { onMounted } from 'vue';
import { scg } from 'ioc-service-container';
import { useImageHistoryStore } from '../../logic/useImageHistoryStore';

const apiUrl = scg('apiUrl');
const imageHistoryStore = useImageHistoryStore();

onMounted(() => {
    imageHistoryStore.fetchImages();
});
</script>

<template>
    <div class="image-history">
        <h2>Image History</h2>
        <div
            v-if="imageHistoryStore.isLoading"
            class="loading"
        >
            Loading...
        </div>
        <div
            v-else-if="imageHistoryStore.error"
            class="error"
        >
            {{ imageHistoryStore.error }}
        </div>
        <div
            v-else
            class="images"
        >
            <div
                v-for="image in imageHistoryStore.images"
                :key="image.hash"
                class="image"
                :class="{
                    selected: imageHistoryStore.selectedImage === image.hash,
                }"
                @click="imageHistoryStore.setDisplayImage(image.hash)"
            >
                <img :src="`${apiUrl}/api/image/${image.hash}`" />
                <span class="timestamp">{{
                    new Date(image.createdAt).toLocaleString()
                }}</span>
            </div>
        </div>

        <div class="pagination-controls">
            <button
                @click="imageHistoryStore.prevPage"
                :disabled="
                    imageHistoryStore.currentPage === 1 ||
                    imageHistoryStore.isLoading
                "
                class="pagination-button"
            >
                Previous
            </button>
            <span class="page-info">
                Page {{ imageHistoryStore.currentPage }} of
                {{ imageHistoryStore.totalPages }}
            </span>
            <button
                @click="imageHistoryStore.nextPage"
                :disabled="
                    imageHistoryStore.currentPage ===
                        imageHistoryStore.totalPages ||
                    imageHistoryStore.isLoading
                "
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
            cursor: pointer;
            transition:
                transform 0.2s ease,
                box-shadow 0.2s ease;

            &:hover {
                transform: scale(1.02);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }

            &.selected {
                border: 2px solid #fbb457;
                border-radius: 0.25rem;
            }

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
