import { scg } from 'ioc-service-container';

export function setupFowConduit(): void {
  const conduit = scg('conduit');

  conduit.attune('requestFow', async (lore, respond) => {
    const fowService = scg('FowService');
    const fowData = await fowService.getFow(lore.hash);

    console.log('requestFow', lore.hash, fowData);
    return respond({ fow: fowData, hash: lore.hash });
  });

  conduit.attune('fowUpdate', async (lore) => {
    const fowService = scg('FowService');
    await fowService.setFow(lore.hash, lore.fow);
  });
}
