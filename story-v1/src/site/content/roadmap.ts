// The road to 1.0: placeholder items, no dates. `plan` is the planned order.

import { links } from './links';

export type Stage = 'now' | 'next' | 'later' | 'shipped';

export interface RoadItem {
  id: string;
  title: string;
  line: string;
  stage: Stage;
  plan: number;
  sample: boolean;
}

export const roadmapIntro = {
  text: 'Placeholder items, to show how the road to 1.0 will be laid out. None of them is a promise.',
  sample: true,
};

// how feature requests come in
export const requests = {
  text: 'Feature requests go through Discord.',
  link: links.discord,
};

const item = (id: string, title: string, line: string, stage: Stage, plan: number): RoadItem => ({
  id, title, line, stage, plan, sample: true,
});

export const roadItems: RoadItem[] = [
  item('a', 'Sample item A', 'Placeholder line about an item being worked on.', 'now', 1),
  item('b', 'Sample item B', 'Placeholder line about an item being worked on.', 'now', 2),
  item('c', 'Sample item C', 'Placeholder line about an item coming next.', 'next', 3),
  item('d', 'Sample item D', 'Placeholder line about an item coming next.', 'next', 4),
  item('e', 'Sample item E', 'Placeholder line about an item coming next.', 'next', 5),
  item('f', 'Sample item F', 'Placeholder line about a later item.', 'later', 6),
  item('g', 'Sample item G', 'Placeholder line about a later item.', 'later', 7),
  item('h', 'Sample item H', 'Placeholder line about a shipped item.', 'shipped', 0),
];
