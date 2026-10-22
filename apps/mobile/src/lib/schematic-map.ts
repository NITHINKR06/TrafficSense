export type SchematicCoordinate = [number, number];

export function projectSchematicPoint(point: SchematicCoordinate, points: SchematicCoordinate[]): { left: string; top: string } {
  const all = points.length > 0 ? points : [point];
  const lngs = all.map(([lng]) => lng);
  const lats = all.map(([, lat]) => lat);
  const west = Math.min(...lngs);
  const east = Math.max(...lngs);
  const south = Math.min(...lats);
  const north = Math.max(...lats);
  const longitudeSpan = Math.max(east - west, 0.001);
  const latitudeSpan = Math.max(north - south, 0.001);
  const left = 8 + ((point[0] - west) / longitudeSpan) * 84;
  const top = 8 + (1 - (point[1] - south) / latitudeSpan) * 84;
  return { left: `${Number(left.toFixed(2))}%`, top: `${Number(top.toFixed(2))}%` };
}
