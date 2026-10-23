export type PresetLocation = {
  name: string;
  coords: [number, number];
};

export const MANGALURU_PRESETS: PresetLocation[] = [
  { name: "Hampankatta Junction", coords: [74.8426, 12.8698] },
  { name: "KSRTC / Bejai Circle", coords: [74.8530, 12.8856] },
  { name: "Ambedkar (Jyothi) Circle", coords: [74.8465, 12.8715] },
  { name: "Ladyhill Circle", coords: [74.8385, 12.8890] },
  { name: "Pumpwell (Mahaveera) Circle", coords: [74.8685, 12.8550] },
  { name: "Mangaluru Central Railway", coords: [74.8390, 12.8640] },
  { name: "Kadri Manjunatha Temple", coords: [74.8580, 12.8820] },
  { name: "Mangalore International Airport", coords: [74.8900, 12.9610] },
];
