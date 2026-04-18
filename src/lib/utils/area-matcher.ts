/**
 * Intelligent Area Matcher
 * Maps raw strings from Google Maps/Geocoding to our internal area list.
 */

export const DHAKA_AREAS_LIST = [
  "Uttara", "Mirpur", "Gulshan", "Banani", "Dhanmondi", 
  "Mohammadpur", "Motijheel", "Badda", "Bashundhara", "Old Dhaka",
  "Jatrabari", "Shahbagh", "Rampura", "Khilgaon", "Pallabi",
  "Keraniganj", "Narayanganj", "Savar", "Purbachal", "Gazipur",
  "Hasnabad", "Kadamtali", "Demra", "Siddhirganj"
];

const BENGALI_MAPPING: { [key: string]: string } = {
  "উত্তরা": "Uttara",
  "মিরপুর": "Mirpur",
  "গুলশান": "Gulshan",
  "বনানী": "Banani",
  "ধানমন্ডি": "Dhanmondi",
  "মোহাম্মদপুর": "Mohammadpur",
  "মতিঝিল": "Motijheel",
  "বাড্ডা": "Badda",
  "বসুন্ধরা": "Bashundhara",
  "পুরাতন ঢাকা": "Old Dhaka",
  "সদরঘাট": "Old Dhaka",
  "যাত্রাবাড়ী": "Jatrabari",
  "শাহবাগ": "Shahbagh",
  "রামপুরা": "Rampura",
  "খিলগাঁও": "Khilgaon",
  "পল্লবী": "Pallabi",
  "কেরানীগঞ্জ": "Keraniganj",
  "নারায়ণগঞ্জ": "Narayanganj",
  "সাভার": "Savar",
  "পূর্বাচল": "Purbachal",
  "গাজীপুর": "Gazipur",
  "হাসনাবাদ": "Hasnabad",
  "কদমতলী": "Kadamtali",
  "ডেমরা": "Demra",
  "সিদ্ধিরগঞ্জ": "Siddhirganj"
};

/**
 * Normalizes a raw address string and finds the best matching area from our list.
 */
export const matchAreaFromAddress = (address: string): string | null => {
  if (!address) return null;

  const normalized = address.toLowerCase();

  // 1. Bengali Keyword Matching (Priority)
  for (const [bn, en] of Object.entries(BENGALI_MAPPING)) {
    if (address.includes(bn)) {
      return en;
    }
  }

  // 2. English Keyword Matching
  for (const area of DHAKA_AREAS_LIST) {
    if (normalized.includes(area.toLowerCase())) {
      return area;
    }
  }

  // 3. Specialized Mapping for common labels
  const specialMappings: { [key: string]: string } = {
    "nikunja": "Uttara",
    "khilkhet": "Uttara",
    "tejgaon": "Mohammadpur",
    "farmgate": "Shahbagh",
    "lalbagh": "Old Dhaka",
    "kotwali": "Old Dhaka",
    "bashundhara r/a": "Bashundhara",
    "kuril": "Badda",
    "aftabnagar": "Badda",
    "mogli": "Keraniganj",
    "shympur": "Kadamtali",
    "fatullah": "Narayanganj"
  };

  for (const [key, areaName] of Object.entries(specialMappings)) {
    if (normalized.includes(key)) {
      return areaName;
    }
  }

  // 4. CAPTURE ALL FALLBACK: Return the most specific part of the address
  // Usually, Google address strings are: "Neighborhood, City, Postal Code, Country"
  // We want the "Neighborhood" part.
  const addressParts = address.split(',');
  if (addressParts.length > 0) {
    const candidate = addressParts[0].trim();
    // Filter out generic city names or plus codes if possible
    if (candidate.length > 3 && !/^[A-Z0-9]{4}\+/.test(candidate)) {
      return candidate;
    }
    // If first part was a plus code, try second part
    if (addressParts.length > 1) {
      return addressParts[1].trim();
    }
  }

  return address || "Dhaka Metropolitan";
};
