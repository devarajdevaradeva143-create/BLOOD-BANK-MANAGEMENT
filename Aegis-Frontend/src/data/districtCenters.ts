// Tamil Nadu district centres — map default view ku.
// [lat, lng] OSM / Leaflet order.

export const DISTRICT_CENTERS: Record<string, [number, number]> = {
  ariyalur: [11.14, 79.07],
  chengalpattu: [12.68, 79.98],
  chennai: [13.08, 80.27],
  coimbatore: [11.01, 76.95],
  cuddalore: [11.74, 79.76],
  dharmapuri: [12.12, 78.15],
  dindigul: [10.36, 77.96],
  erode: [11.34, 77.72],
  kallakurichi: [11.73, 78.96],
  kancheepuram: [12.83, 79.7],
  karur: [10.96, 78.07],
  krishnagiri: [12.51, 78.21],
  kanyakumari: [8.08, 77.55],
  madurai: [9.93, 78.12],
  mayiladuthurai: [11.1, 79.65],
  nagapattinam: [10.76, 79.84],
  namakkal: [11.22, 78.16],
  nilgiris: [11.41, 76.7],
  perambalur: [11.23, 78.88],
  pudukkottai: [10.38, 78.82],
  ramanathapuram: [9.36, 78.83],
  ranipet: [12.92, 79.33],
  salem: [11.65, 78.16],
  sivaganga: [9.84, 78.48],
  tenkasi: [8.95, 77.31],
  thanjavur: [10.79, 79.13],
  theni: [10.01, 77.47],
  thoothukudi: [8.8, 78.14],
  tiruchirappalli: [10.79, 78.7],
  tirunelveli: [8.71, 77.75],
  tirupathur: [12.49, 78.56],
  tiruppur: [11.1, 77.34],
  tiruvallur: [13.14, 79.91],
  tiruvannamalai: [12.22, 79.07],
  tiruvarur: [10.77, 79.63],
  vellore: [12.91, 79.13],
  viluppuram: [11.94, 79.49],
  virudhunagar: [9.56, 77.96],
};

export const DEFAULT_CENTER: [number, number] = [10.9, 78.65];

export function districtCenter(slug: string): [number, number] {
  const key = (slug ?? '').trim().toLowerCase();
  return DISTRICT_CENTERS[key] ?? DEFAULT_CENTER;
}
