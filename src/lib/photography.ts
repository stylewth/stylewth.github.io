export interface PhotographyRecord {
  id: string;
  order: number;
  title: string;
  category: string;
  series: string;
  width: number;
  height: number;
  alt: string;
  src: string;
  fallback: string;
  srcSet: string;
  fullSrc: string;
}

export const photographySeries = [
  '远方与尺度',
  '擦肩与回望',
  '城市的留白',
  '微小的回声',
] as const;

export function photographySeriesId(series: string): string {
  const ids: Record<(typeof photographySeries)[number], string> = {
    远方与尺度: 'distance',
    擦肩与回望: 'encounters',
    城市的留白: 'city',
    微小的回声: 'echoes',
  };
  return ids[series as (typeof photographySeries)[number]] ?? '';
}

export function assertPhotographyManifest(records: PhotographyRecord[]): void {
  if (records.length !== 24) throw new Error('Photography manifest must contain exactly 24 records');
  const ids = new Set<string>();
  records.forEach((record, index) => {
    if (!record.id || ids.has(record.id)) throw new Error(`Duplicate or empty photography id: ${record.id}`);
    ids.add(record.id);
    if (record.order !== index + 1) throw new Error(`Photography order must be sequential at ${record.id}`);
    if (!photographySeries.includes(record.series as (typeof photographySeries)[number])) {
      throw new Error(`Unknown photography series: ${record.series}`);
    }
    if (!(record.width > 0 && record.height > 0)) throw new Error(`Invalid dimensions for ${record.id}`);
    if (!record.src.startsWith(`/images/photography/${record.id}/`)
      || !record.fallback.startsWith(`/images/photography/${record.id}/`)
      || !record.fullSrc.startsWith(`/images/photography/${record.id}/`)) {
      throw new Error(`Photography asset URL must be local to ${record.id}`);
    }
  });
}
