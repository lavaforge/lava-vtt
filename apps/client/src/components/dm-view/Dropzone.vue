<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { scg } from 'ioc-service-container';
import { useImageHistoryStore } from '../../logic/useImageHistoryStore';

const conduit = scg('conduit');
const apiUrl = scg('apiUrl');

const isDraggingFile = ref(false);
const isUploading = ref(false);
const uploadProgress = ref(0);

// Track drag counter to avoid flickering
let dragCounter = 0;

/**
 * Handles the drag enter event for the dropzone
 * @param e - The drag event
 */
function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer?.types.includes('Files')) {
        dragCounter++;
        isDraggingFile.value = true;
    }
}

/**
 * Handles the drag leave event for the dropzone
 * @param e - The drag event
 */
function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
        isDraggingFile.value = false;
    }
}

/**
 * Handles the drag over event for the dropzone
 * @param e - The drag event
 */
function handleDragOver(e: DragEvent) {
    if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
    }
}

/**
 * Handles the drop event for the dropzone
 * @param e - The drag event
 */
async function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragCounter = 0;
    isDraggingFile.value = false;

    const file = e.dataTransfer?.files[0];
    if (!file || !file.type.startsWith('image/')) {
        alert('Please drop an image file');
        return;
    }

    isUploading.value = true;
    uploadProgress.value = 0;

    try {
        const arrayBuffer = await file.arrayBuffer();
        const response = await fetch(`${apiUrl}/api/image`, {
            method: 'POST',
            body: arrayBuffer,
            headers: {
                'Content-Type': file.type,
            },
        });

        if (!response.ok) throw new Error('Upload failed');

        const hash = await response.text();

        uploadProgress.value = 100;

        afterUploadFinished(hash);
    } catch (error) {
        console.error('Upload failed:', error);
        alert('Failed to upload image');
    } finally {
        isUploading.value = false;
    }
}

/**
 * After upload finished
 * @param hash - The hash of the image
 */
async function afterUploadFinished(hash: string) {
    const imageHistoryStore = useImageHistoryStore();
    imageHistoryStore.reload();
    await imageHistoryStore.setDisplayImage(hash);
}

/**
 * Mounts the dropzone
 */
onMounted(() => {
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);
});

/**
 * Unmounts the dropzone
 */
onUnmounted(() => {
    document.removeEventListener('dragenter', handleDragEnter);
    document.removeEventListener('dragleave', handleDragLeave);
    document.removeEventListener('dragover', handleDragOver);
    document.removeEventListener('drop', handleDrop);
});
</script>

<template>
    <div>
        <div
            v-if="isDraggingFile"
            class="dropzone-overlay"
        >
            <div class="dropzone-content">
                <i class="fas fa-upload"></i>
                <p>Drop image to upload</p>
            </div>
        </div>

        <div
            v-if="isUploading"
            class="upload-progress-overlay"
        >
            <div class="upload-progress">
                <div
                    class="progress-bar"
                    :style="{ width: uploadProgress + '%' }"
                ></div>
                <p>Uploading... {{ uploadProgress }}%</p>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.dropzone-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.dropzone-content {
    text-align: center;
    color: white;
    font-size: 1.5rem;

    i {
        font-size: 3rem;
        margin-bottom: 1rem;
    }
}

.upload-progress-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.upload-progress {
    background: white;
    padding: 1rem;
    border-radius: 4px;
    width: 200px;
}

.progress-bar {
    height: 4px;
    background: #4caf50;
    transition: width 0.3s ease;
}
</style>
