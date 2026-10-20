/** All geometry is measured in the original apparatus image's 1536 × 1024 space. */
export const sceneSize = { width: 1536, height: 1024 } as const;
export const rabbitTrack = { start: 830, end: 1430, centerY: 495, width: 144 } as const;

interface Box { x: number; y: number; width: number; height: number }

// Alpha bounds of the existing glass assets, including their original perspective edges.
const paneDefinitions = [
  { x: 970, y: 315, height: 360, crop: { x: 431, y: 32, width: 160, height: 1468 } },
  { x: 1070, y: 275, height: 440, crop: { x: 421, y: 20, width: 183, height: 1495 } },
  { x: 1170, y: 245, height: 500, crop: { x: 411, y: 14, width: 203, height: 1501 } },
] as const;

export const scenePanes = paneDefinitions.map(({ crop, ...pane }) => ({
  ...pane,
  crop,
  width: pane.height * crop.width / crop.height,
  exit: pane.x + pane.height * crop.width / crop.height,
}));

// Inset samples of the photographed inner rim, clockwise. Its tilt is not an axis-aligned ellipse.
export const apertureOutline: readonly (readonly [number, number])[] = [
  [1121, 180], [1180, 180], [1238, 200], [1267, 220], [1288, 240],
  [1305, 260], [1318, 280], [1340, 320], [1355, 360], [1364, 400],
  [1369, 440], [1370, 480], [1366, 520], [1359, 560], [1347, 600],
  [1329, 640], [1304, 680], [1271, 720], [1225, 760], [1188, 780],
  [1130, 790], [1100, 790], [1043, 780], [1016, 760], [967, 720],
  [934, 680], [912, 640], [896, 600], [886, 560], [881, 520],
  [881, 480], [886, 440], [895, 400], [910, 360], [929, 320],
  [956, 280], [994, 240], [1055, 200],
];

const normalized = ([x, y]: readonly [number, number]): string =>
  `${x / sceneSize.width} ${y / sceneSize.height}`;
const midpoint = (a: readonly [number, number], b: readonly [number, number]): [number, number] =>
  [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

// Rounded, resolution-independent clipping stays just inside the real rim at every scale.
export const aperturePath = `M ${normalized(midpoint(apertureOutline.at(-1)!, apertureOutline[0]))} ${
  apertureOutline.map((point, index) =>
    `Q ${normalized(point)} ${normalized(midpoint(point, apertureOutline[(index + 1) % apertureOutline.length]))}`,
  ).join(' ')
} Z`;

const percent = (value: number, total: number): string => `${value / total * 100}%`;

export function sceneBox({ x, y, width, height }: Box): string {
  return `left: ${percent(x, sceneSize.width)}; top: ${percent(y, sceneSize.height)}; width: ${percent(width, sceneSize.width)}; height: ${percent(height, sceneSize.height)};`;
}

export function sceneRegion(left: number, right: number, top = 0, bottom: number = sceneSize.height): string {
  return `clip-path: inset(${percent(top, sceneSize.height)} ${percent(sceneSize.width - right, sceneSize.width)} ${percent(sceneSize.height - bottom, sceneSize.height)} ${percent(left, sceneSize.width)});`;
}

export function paneImageStyle(crop: Box): string {
  return `left: ${percent(-crop.x, crop.width)}; top: ${percent(-crop.y, crop.height)}; width: ${percent(1024, crop.width)}; height: ${percent(1536, crop.height)};`;
}
