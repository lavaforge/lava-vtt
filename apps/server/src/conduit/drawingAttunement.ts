import { scg } from 'ioc-service-container';

export function attuneToDrawingVeins(): void {
    const conduit = scg('conduit');

    conduit.attune('drawingRequest', async (lore, respond) => {
        const drawingService = scg('DrawingService');
        const drawingData = await drawingService.getDrawing(lore.hash);

        return respond({ data: drawingData, hash: lore.hash });
    });

    conduit.attune('drawingUpdate', async (lore) => {
        const drawingService = scg('DrawingService');
        await drawingService.setDrawing(lore.hash, lore.data);
    });
}
