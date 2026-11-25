// About: every section is placeholder text, and the sign-off is a placeholder, not a name.

export interface AboutSection {
  id: string;
  heading: string;
  paragraphs: string[];
  sample: boolean;
}

const section = (id: string, heading: string, ...paragraphs: string[]): AboutSection => ({ id, heading, paragraphs, sample: true });

export const aboutSections: AboutSection[] = [
  section('origin', 'Where it started', 'Placeholder for the origin story: why Good Goblin exists, and the game night it was made for.'),
  section('privacy', 'Your table, your data', 'Placeholder for the privacy stance: what stays on your machine, and what never leaves it.'),
  section('philosophy', 'How it is designed', 'Placeholder for the design philosophy: what the tools try to do, and what they leave to the people at the table.'),
  section('commitment', 'What we commit to', 'Placeholder for the commitment: what will stay true as the project grows.'),
];

export const signOff = { text: 'Placeholder sign-off', sample: true };
