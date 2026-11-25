// The homepage sections below the hero. "Why" holds only what is true today (confirmed by Nayan,
// 2026-11-24); everything else is a Sample stand-in.

// when the closed beta starts, as the hero, the closing band and the footer read it
export const BETA_STARTS = 'December 2026';

export interface Item {
  title: string;
  line: string;
  sample: boolean;
}

// a Blender render from blender/out/look, copied into public/images
export interface Picture {
  src: string;
  width: number;
  height: number;
  alt: string;
}

// why Good Goblin: the true claims, so no Sample mark. The first is the lead point.
export const why: Item[] = [
  { title: 'Every pro tool, free', line: 'Dynamic lighting, live fog of war, multi-level maps and full control of your table, at no cost.', sample: false },
  { title: 'Your table, on your machine', line: 'It runs on your own computer, so your maps and campaign stay yours. Sessions at a real table need no login.', sample: false },
  { title: 'Open source', line: 'Read the code, change it, keep it. No subscription can lock your campaign away.', sample: false },
];

// the three products; `id` is the anchor on the homepage, `docs` the guide group it links to
export interface Product extends Item {
  id: string;
  docs: string;
  picture: Picture;
}
export const products: Product[] = [
  {
    id: 'map-editor',
    title: 'Map editor',
    line: 'Build battle maps with walls, dynamic lighting and multiple levels, ready before the session.',
    docs: 'map-editor',
    sample: true,
    picture: {
      src: '/images/map-editor.jpg',
      width: 1400,
      height: 1114,
      alt: 'The floating island seen from above: the camp, the path of stones, the trees and the flowers around the rim.',
    },
  },
  {
    id: 'live-table',
    title: 'Live table',
    line: 'Run the night with live fog of war and full control over what every player sees.',
    docs: 'live-table',
    sample: true,
    picture: {
      src: '/images/live-table.jpg',
      width: 1100,
      height: 875,
      alt: 'The island standing on a gridded map on a round wooden table, lit by two candles.',
    },
  },
  {
    id: 'discord-bot',
    title: 'Discord bot',
    line: 'Bring the party in online and keep them together between sessions, in your own server.',
    docs: 'discord-bot',
    sample: true,
    picture: {
      src: '/images/discord-bot.jpg',
      width: 1400,
      height: 604,
      alt: 'The party in a row: a horned mage with a staff, an orc with an axe, a woman in yellow, a red-bearded dwarf and the goblin.',
    },
  },
];

// four features across the products; `guide` is a docs page slug
export interface Feature extends Item {
  product: string;
  guide: string;
}
export const features: Feature[] = [
  { title: 'Dynamic lighting', product: 'Map editor and live table', line: 'Torches, lanterns and spells light the scene, and walls throw real shadows.', guide: 'dynamic-lighting', sample: true },
  { title: 'Live fog of war', product: 'Live table', line: 'The map reveals itself as the party explores, live, for every player at once.', guide: 'fog-of-war', sample: true },
  { title: 'Multi-level maps', product: 'Map editor', line: 'Towers, dungeons and cellars as floors of one map, with the party moving between them.', guide: 'multi-level-maps', sample: true },
  { title: 'Full DM control', product: 'Live table', line: 'Set the table up your way, and decide what each player sees and can touch.', guide: 'dm-controls', sample: true },
];

// the smaller table features; `icon` names the glyph the page draws beside each
export interface SmallFeature extends Item {
  icon: 'dice' | 'initiative' | 'ruler' | 'handout' | 'condition' | 'pin' | 'notes' | 'sound';
}
export const smallFeatures: SmallFeature[] = [
  { title: 'Dice roller', line: 'Placeholder line.', icon: 'dice', sample: true },
  { title: 'Initiative tracker', line: 'Placeholder line.', icon: 'initiative', sample: true },
  { title: 'Grid and measuring', line: 'Placeholder line.', icon: 'ruler', sample: true },
  { title: 'Handouts', line: 'Placeholder line.', icon: 'handout', sample: true },
  { title: 'Token conditions', line: 'Placeholder line.', icon: 'condition', sample: true },
  { title: 'Map pins', line: 'Placeholder line.', icon: 'pin', sample: true },
  { title: 'Session notes', line: 'Placeholder line.', icon: 'notes', sample: true },
  { title: 'Ambient sound', line: 'Placeholder line.', icon: 'sound', sample: true },
];

// start here: six steps, each into the guides; `guide` is a docs page slug
export interface Step extends Item {
  guide: string;
}
export const steps: Step[] = [
  { title: 'Install', line: 'Placeholder step.', guide: 'install', sample: true },
  { title: 'Host your first table', line: 'Placeholder step.', guide: 'host-your-first-table', sample: true },
  { title: 'Invite your players', line: 'Placeholder step.', guide: 'invite-your-players', sample: true },
  { title: 'Make your first map', line: 'Placeholder step.', guide: 'your-first-map', sample: true },
  { title: 'Run a session', line: 'Placeholder step.', guide: 'running-a-session', sample: true },
  { title: 'Add the bot', line: 'Placeholder step.', guide: 'add-the-bot', sample: true },
];

// the closing band
export const closingPicture: Picture = {
  src: '/images/campfire.jpg',
  width: 1600,
  height: 1272,
  alt: 'The goblin warming himself at the campfire, the signpost, the bench and the lantern around him.',
};

// the not-found page
export const lostPicture: Picture = {
  src: '/images/goblin.jpg',
  width: 600,
  height: 804,
  alt: 'The goblin in his brown hood, looking straight out with a toothy grin.',
};
