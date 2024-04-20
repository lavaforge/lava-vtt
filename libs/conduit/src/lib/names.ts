import {
    adjectives,
    colors,
    type Config,
    uniqueNamesGenerator,
} from '@joaomoreno/unique-names-generator';
import { z } from 'zod';

const lavaNouns: string[] = [
    'magma',
    'crater',
    'flame',
    'ember',
    'cinder',
    'caldera',
    'fissure',
    'obsidian',
    'basalt',
    'sulfur',
    'pyroclast',
    'tephra',
    'lavalet',
    'flare',
    'glow',
    'ash',
    'spire',
    'surge',
    'flow',
    'forge',
    'anvil',
    'mantle',
    'core',
    'pumice',
    'rift',
    'vent',
    'plume',
    'eruption',
    'fumarole',
    'geode',
    'mineral',
    'elemental',
    'titan',
    'giant',
    'phoenix',
    'drake',
    'wyrm',
    'salamander',
    'vulcan',
    'dwarf',
    'golem',
    'chimera',
    'oracle',
    'sorcerer',
    'enchanter',
    'wizard',
    'mystic',
    'prophet',
    'seer',
    'shaman',
    'warlock',
    'necromancer',
    'paladin',
    'knight',
    'guardian',
    'champion',
    'sentinel',
    'vanguard',
    'raider',
    'ranger',
    'archer',
    'scout',
    'assassin',
    'rogue',
    'thief',
    'bard',
    'minstrel',
    'troubadour',
    'scribe',
    'scholar',
    'alchemist',
    'adept',
    'priest',
    'monk',
    'cleric',
    'druid',
    'healer',
    'sage',
    'herald',
    'envoy',
    'nomad',
    'wanderer',
    'explorer',
    'voyager',
    'pilgrim',
    'settler',
    'colonist',
    'smith',
    'artisan',
    'craftsman',
    'builder',
    'mason',
    'engineer',
    'inventor',
    'pioneer',
    'visionary',
    'rebel',
    'hero',
    'legend',
    'myth',
    'tale',
    'saga',
    'epic',
    'chronicle',
    'lore',
    'fable',
    'parable',
    'allegory',
];

const nameConfig: Config = {
    dictionaries: [adjectives, colors, lavaNouns],
    separator: '-',
    style: 'lowerCase',
};

export const zodLavaName = z.custom<LavaName>(
    (val) => typeof val === 'string' && /^[a-z]+-[a-z]+-[a-z]+$/.test(val),
);
export type LavaName = `${string}-${string}-${string}`;

const generatedNames = new Set<string>();
export function uniqueLavaName(): LavaName {
    let name: string;
    do {
        name = uniqueNamesGenerator(nameConfig);
    } while (generatedNames.has(name));

    generatedNames.add(name);
    return name as LavaName;
}

export function unregisterName(name: LavaName): void {
    generatedNames.delete(name);
}
