export const FORMAT_VALUES = ['all', 'online', 'offline'] as const;

export type Format = (typeof FORMAT_VALUES)[number];

export const FORMAT_OPTIONS: { value: Format }[] = FORMAT_VALUES.map((value) => ({ value }));
