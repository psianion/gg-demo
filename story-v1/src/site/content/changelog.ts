// The changelog: releases newest first, on the road to 1.0 (0.x versions), each written up from its
// major pull requests. The ones below are placeholders: their versions carry "-sample" so none can be
// mistaken for a real release, and a production build leaves them out.

export interface Release {
  version: string;
  kind: 'Update' | 'Hotfix';
  date: string;
  summary: string;
  notes: { heading: string; items: string[] }[];
  sample: boolean;
}

const notes = [
  { heading: 'New', items: ['Sample line: one thing that was added.', 'Sample line: another thing that was added.'] },
  { heading: 'Fixed', items: ['Sample line: one thing that was fixed.'] },
];

const allReleases: Release[] = [
  {
    version: '0.2.0-sample',
    kind: 'Update',
    date: 'Sample date',
    summary: 'Placeholder summary of a sample update.',
    notes,
    sample: true,
  },
  {
    version: '0.1.1-sample',
    kind: 'Hotfix',
    date: 'Sample date',
    summary: 'Placeholder summary of a sample hotfix.',
    notes: [{ heading: 'Fixed', items: ['Sample line: one thing that was fixed.'] }],
    sample: true,
  },
  {
    version: '0.1.0-sample',
    kind: 'Update',
    date: 'Sample date',
    summary: 'Placeholder summary of the first sample update.',
    notes,
    sample: true,
  },
];

// shown while the site runs in development; a production build lists only real releases
export const releases = allReleases.filter((r) => !r.sample || import.meta.env.DEV);
