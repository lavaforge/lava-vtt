import { scg } from 'ioc-service-container';

export function attuneToFogOfWarVeins(): void {
    const conduit = scg('conduit');

    conduit.attune('fowRequest', async (lore, respond) => {
        const fowService = scg('FowService');
        const fowData = await fowService.getFow(lore.hash);

        return respond({ data: fowData, hash: lore.hash });
    });

    conduit.attune('fowUpdate', async (lore) => {
        const fowService = scg('FowService');
        await fowService.setFow(lore.hash, lore.data);
    });
}
