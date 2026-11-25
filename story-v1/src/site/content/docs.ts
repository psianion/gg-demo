// The guides: the planned tree (docs/2026-11-24-guides-to-write.md). Every page is a Sample stand-in until
// its guide is written; then its flag comes off. Slugs are the URL: /docs/<slug>.

export interface DocPage {
  slug: string;
  title: string;
  summary: string;
  sample: boolean;
}

export interface DocGroup {
  id: string;
  title: string;
  line: string;
  pages: DocPage[];
  sample: boolean;
}

export const docsIntro = {
  text: 'Placeholder guides, grouped the way the real ones will be: getting going, each of the three products, hosting, and questions.',
  sample: true,
};

const page = (slug: string, title: string, summary: string): DocPage => ({ slug, title, summary, sample: true });

const allGroups: DocGroup[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    line: 'From nothing to your first table.',
    sample: true,
    pages: [
      page('what-is-good-goblin', 'What is Good Goblin?', 'The map editor, the live table and the Discord bot, and how they fit together.'),
      page('install', 'Install Good Goblin', 'Get Good Goblin running on your own machine.'),
      page('host-your-first-table', 'Host your first table', 'Open a table, load a map and get ready for players.'),
      page('invite-your-players', 'Invite your players', 'Bring players in online through Discord, or around a real table with no login.'),
      page('playing-in-person', 'Playing in person', 'Run Good Goblin on a screen at the table, with no internet and no accounts.'),
      page('any-ttrpg', 'Using Good Goblin with any TTRPG', 'Built with D&D in mind, ready for Pathfinder, Call of Cthulhu or your own system.'),
    ],
  },
  {
    id: 'map-editor',
    title: 'Map editor',
    line: 'Build battle maps before the session.',
    sample: true,
    pages: [
      page('your-first-map', 'Your first map', 'Build a small battle map from start to finish.'),
      page('walls-and-doors', 'Walls and doors', 'Draw walls that block movement and sight, and doors your players can open.'),
      page('dynamic-lighting', 'Dynamic lighting', 'Light the scene with torches, lanterns and spells, and let walls cast the shadows.'),
      page('fog-of-war', 'Fog of war', 'Hide the map and reveal it live as the party explores.'),
      page('multi-level-maps', 'Multi-level maps', 'Stack floors, cellars and towers in one map, and move the party between them.'),
      page('importing-maps-and-tokens', 'Importing maps and tokens', 'Bring in your own map images, tokens and art.'),
    ],
  },
  {
    id: 'live-table',
    title: 'Live table',
    line: 'Run the session with your players.',
    sample: true,
    pages: [
      page('running-a-session', 'Running a session', 'Everything you do on the night, from opening the table to wrapping up.'),
      page('dm-controls', 'DM controls', 'Decide what each player sees and can touch, and set the table up your way.'),
      page('dice-and-initiative', 'Dice and initiative', 'Roll in the open or in secret, and keep turn order in combat.'),
      page('showing-handouts', 'Showing handouts', 'Share images, letters and maps with the whole party or one player.'),
    ],
  },
  {
    id: 'discord-bot',
    title: 'Discord bot',
    line: 'Play online, and keep the party together between sessions.',
    sample: true,
    pages: [
      page('add-the-bot', 'Add the bot to your server', 'Invite the Good Goblin bot to your Discord server and link it to your table.'),
      page('playing-online', 'Playing online through Discord', 'How players join your table from Discord.'),
      page('rolls-in-discord', 'Rolls in Discord', 'Roll dice in your Discord channels.'),
      page('session-reminders', 'Session reminders', 'Remind the party before game night, automatically.'),
    ],
  },
  {
    id: 'self-hosting',
    title: 'Self-hosting',
    line: 'Run Good Goblin from your own machine.',
    sample: true,
    pages: [
      page('your-machine-as-host', 'Your machine as host', 'What your computer needs, and what happens while a session runs.'),
      page('updating', 'Updating Good Goblin', 'Move to a new release without losing anything.'),
      page('backups', 'Backups', 'Keep your maps and campaigns safe.'),
    ],
  },
  {
    id: 'help',
    title: 'Help',
    line: 'Common questions and fixes.',
    sample: true,
    pages: [
      page('faq', 'Frequently asked questions', 'Is it free, do players need accounts, which systems it supports, and more.'),
      page('troubleshooting', 'Troubleshooting', 'Fixes for the problems DMs run into most.'),
    ],
  },
];

// the body every placeholder article shares, until its real text is written
export const placeholderBody = {
  paragraphs: [
    'This page is a placeholder. The real guide will be written here, in short steps, with a picture where one helps.',
    'Nothing on this page describes how Good Goblin works yet.',
  ],
  sample: true,
};

// Sample guides are listed while the site runs in development, so the layout can be reviewed. A
// production build lists only written guides (sample: false), and leaves out a group with none.
const listed = (p: DocPage) => !p.sample || import.meta.env.DEV;
export const docGroups: DocGroup[] = allGroups
  .map((g) => ({ ...g, pages: g.pages.filter(listed) }))
  .filter((g) => g.pages.length > 0);

/** every page in tree order, for previous and next */
export const docPages = docGroups.flatMap((g) => g.pages.map((p) => ({ ...p, group: g })));

/** where a link to a guide (or a guide group) goes: the guide itself once it is listed, else the guides landing */
export const guideHref = (slug: string) => (docPages.some((p) => p.slug === slug) ? `/docs/${slug}` : '/docs');
export const groupHref = (id: string) => (docGroups.some((g) => g.id === id) ? `/docs#${id}` : '/docs');
export const hasGuide = (slug: string) => docPages.some((p) => p.slug === slug);
