export default defineBackground(() => {
    console.log('Hello background!', { id: browser.runtime.id });

    browser.runtime.onInstalled.addListener(async () => {
        browser.contextMenus.create(
            {
                id: 'log-selection',
                title: 'Log selection',
                contexts: ['image'],
            },
            () => {
                console.log('clicked!');
            },
        );

        browser.contextMenus.onClicked.addListener(async (info, tab) => {
            console.log('clicked!', info, tab);
            const srcUrl = info.srcUrl;

            if (!srcUrl) {
                return;
            }

            if (srcUrl.startsWith('data:')) {
                const blob = base64ToBlob(srcUrl);

                await setNewImage(blob);
            } else {
                console.log(srcUrl);

                const response = await fetch(srcUrl);
                const contentType = response.headers.get('Content-Type');

                if (!contentType?.startsWith('image')) {
                    console.warn('did not receive an image!', contentType);
                    return;
                }

                const blob = await response.blob();

                await setNewImage(blob);
            }
        });
    });
});

async function setNewImage(blob: Blob) {
    const server = await storage.getItem('local:server', {
        defaultValue: 'http://localhost:3000',
    });
    const response = await (
        await fetch(`${server}/api/image`, {
            method: 'POST',
            body: await blob.arrayBuffer(),
            headers: { 'Content-Type': 'application/octet-stream' },
        })
    ).text();

    await fetch(`${server}/api/display`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: response }),
    });
}

function base64ToBlob(base64: string) {
    const binaryString = atob(base64.split(',')[1]);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    console.log('converted');
    return new Blob([bytes], { type: 'application/octet-stream' });
}
