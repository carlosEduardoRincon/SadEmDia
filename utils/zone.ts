export const ZONES = [
  'Zona Norte',
  'Zona Leste',
  'Zona Sul',
  'Zona Oeste',
] as const;

export type Zone = (typeof ZONES)[number];

export const ZONE_OPTIONS: Zone[] = [...ZONES];
