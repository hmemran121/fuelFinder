/**
 * Dhaka Metro Area Geospatial Intelligence Utility
 * Used for automated station tagging and distance matching
 */

export interface AreaCenter {
  name: string;
  lat: number;
  lng: number;
}

export const DHAKA_AREA_CENTERS: AreaCenter[] = [
  { name: "Uttara", lat: 23.8745, lng: 90.3927 },
  { name: "Mirpur", lat: 23.8041, lng: 90.3688 },
  { name: "Gulshan", lat: 23.7925, lng: 90.4078 },
  { name: "Banani", lat: 23.7937, lng: 90.4048 },
  { name: "Dhanmondi", lat: 23.7465, lng: 90.3760 },
  { name: "Mohammadpur", lat: 23.7610, lng: 90.3556 },
  { name: "Motijheel", lat: 23.7335, lng: 90.4172 },
  { name: "Badda", lat: 23.7830, lng: 90.4287 },
  { name: "Bashundhara", lat: 23.8160, lng: 90.4357 },
  { name: "Old Dhaka", lat: 23.7088, lng: 90.4137 },
  { name: "Jatrabari", lat: 23.7056, lng: 90.4379 },
  { name: "Shahbagh", lat: 23.7383, lng: 90.3957 },
  { name: "Rampura", lat: 23.7607, lng: 90.4184 },
  { name: "Khilgaon", lat: 23.7508, lng: 90.4243 },
  { name: "Pallabi", lat: 23.8248, lng: 90.3553 },
  { name: "Keraniganj", lat: 23.6841, lng: 90.3582 },
  { name: "Narayanganj", lat: 23.6226, lng: 90.4998 },
  { name: "Savar", lat: 23.8548, lng: 90.2646 },
  { name: "Purbachal", lat: 23.8340, lng: 90.4850 },
  { name: "Gazipur", lat: 24.0000, lng: 90.4203 },
  { name: "Hasnabad", lat: 23.6820, lng: 90.3700 },
  { name: "Kadamtali", lat: 23.6950, lng: 90.4450 },
  { name: "Demra", lat: 23.7000, lng: 90.4800 },
  { name: "Siddhirganj", lat: 23.6700, lng: 90.5100 },
];

/**
 * Calculates Euclidean distance between two points
 * Good enough for city-scale neighborhood matching
 */
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
};

/**
 * Finds the nearest neighborhood name for a given GPS coordinate
 */
export const getNearestArea = (lat: number, lng: number): string => {
  let minDistance = Infinity;
  let nearestArea = DHAKA_AREA_CENTERS[0].name;

  for (const area of DHAKA_AREA_CENTERS) {
    const dist = calculateDistance(lat, lng, area.lat, area.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestArea = area.name;
    }
  }

  return nearestArea;
};
