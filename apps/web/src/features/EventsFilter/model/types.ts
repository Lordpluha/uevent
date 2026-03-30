export const FORMAT_VALUES = ['all', 'online', 'offline'] as const;

export type Format = (typeof FORMAT_VALUES)[number];

export const FORMAT_OPTIONS: { label: string; value: Format }[] = [
  { label: 'All', value: 'all' },
  { label: 'Online', value: 'online' },
  { label: 'Offline', value: 'offline' },
];
