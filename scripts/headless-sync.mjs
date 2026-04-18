import puppeteer from 'puppeteer-core';
import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

// --- CONFIGURATION ---
const CHROME_PATH = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './fuel-finder-dhaka-firebase-adminsdk-fbsvc-9fda29eb73.json';
const SERVICE_ACCOUNT_BASE64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;


// Area List (Exact mapping as per app)
const DHAKA_AREAS_LIST = [
  "Uttara", "Mirpur", "Gulshan", "Banani", "Dhanmondi", 
  "Mohammadpur", "Motijheel", "Badda", "Bashundhara", "Old Dhaka",
  "Jatrabari", "Shahbagh", "Rampura", "Khilgaon", "Pallabi",
  "Keraniganj", "Narayanganj", "Savar", "Purbachal", "Gazipur",
  "Hasnabad", "Kadamtali", "Demra", "Siddhirganj"
];

const BENGALI_MAPPING = {
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

// Heuristic matching (Ultimate Version)
const matchAreaFromAddress = (address) => {
  if (!address) return "Dhaka Metropolitan";
  
  // 1. Bengali Priority
  for (const [bn, en] of Object.entries(BENGALI_MAPPING)) {
    if (address.includes(bn)) return en;
  }

  // 2. English Keyword Matching
  const normalized = address.toLowerCase();
  for (const area of DHAKA_AREAS_LIST) {
    if (normalized.includes(area.toLowerCase())) return area;
  }
  
  // 3. Special Mapping
  if (normalized.includes("khilkhet") || normalized.includes("nikunja")) return "Uttara";
  if (normalized.includes("tejgaon")) return "Mohammadpur";
  if (normalized.includes("farmgate")) return "Shahbagh";

  // 4. CAPTURE ALL FALLBACK
  const parts = address.split(',').map(p => p.trim());
  for (const part of parts) {
      // Check if it's NOT a plus code (usually contains a '+' and is short)
      if (part.length > 3 && !part.includes('+') && !part.includes('Businesses') && !part.includes('Business')) {
          // If it mentions "Dhaka" but it's the only word, keep looking
          if (part.toLowerCase() === 'dhaka' && parts.length > 1) continue;
          return part; 
      }
  }

  return parts[0] || "Dhaka Metropolitan";
};

// --- INITIALIZATION ---
if (!admin.apps.length) {
  let serviceAccount;

  if (SERVICE_ACCOUNT_BASE64) {
    serviceAccount = JSON.parse(Buffer.from(SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'));
  } else if (existsSync(SERVICE_ACCOUNT_PATH)) {
    serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    console.error("❌ CRITICAL: No Firebase credentials found. Set FIREBASE_SERVICE_ACCOUNT_BASE64 or provide a JSON file.");
    process.exit(1);
  }
}
const db = admin.firestore();


async function deepSyncAreas() {
  const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
  
  log('🚀 INITIALIZING HEADLESS INTELLIGENCE ENGINE...');
  
  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  };

  // Only use CHROME_PATH if we are explicitly on Windows or it was provided
  if (process.platform === 'win32' || process.env.CHROME_PATH) {
    launchOptions.executablePath = CHROME_PATH;
  }

  const browser = await puppeteer.launch(launchOptions);


  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // Load verified pumps that haven't been synced recently or ever
  // 1. Load stations that haven't been synced or are missing area data
  // Using a broad fetch and filtering in-memory to save on complex index requirements
  const stationsSnap = await db.collection('verified_pumps').get();
  const allStations = stationsSnap.docs;
  
  // Filter for those needing sync: missing area OR area was Not Linked
  const stationsToProcess = allStations.filter(doc => {
      const d = doc.data();
      return !d.area || d.area === 'Area Not Linked' || !d.last_headless_sync;
  });

  log(`🔍 Analyzing ${allStations.length} total stations. Found ${stationsToProcess.length} requiring sync.`);

  let updatedCount = 0;

  for (const doc of stationsToProcess) {
    const data = doc.data();
    const { latitude: lat, longitude: lng, name } = data;

    log(`\n-----------------------------------`);
    log(`📡 SCANNING: ${name} (${lat}, ${lng})`);

    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(name)}/@${lat},${lng},17z`;
    
    try {
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for results
      await page.waitForSelector('div[role="main"]', { timeout: 10000 }).catch(() => null);

      // Extract pump data using proven selectors
      const addressData = await page.evaluate(() => {
        const selectors = [
          'div.Io6YTe', // Primary address chip
          'div.fontBodyMedium', // Search results address
          'h2.fontHeadlineLarge', // Place name / Address backup
          'div.fontHeadlineSmall' // Neighborhood breadcrumb
        ];
        
        const results = [];
        for (const sel of selectors) {
          const elements = document.querySelectorAll(sel);
          elements.forEach(el => {
            if (el.innerText && el.innerText.length > 2) results.push(el.innerText);
          });
        }
        return results.join(', ');
      });

      const finalArea = matchAreaFromAddress(addressData);

      log(`📍 SOURCE: ${addressData.substring(0, 60)}...`);
      log(`✅ SYNCED: ${finalArea}`);

      await doc.ref.update({ 
          area: finalArea,
          last_headless_sync: admin.firestore.FieldValue.serverTimestamp()
      });
      updatedCount++;

      // Buffer
      await new Promise(r => setTimeout(r, 2000));

    } catch (err) {
      log(`❌ TIMEOUT/ERROR FOR ${name}. MOVING TO NEXT.`);
    }
  }

  await browser.close();
  log(`\n\n===================================`);
  log(`🏁 DEEP SYNC COMPLETED.`);
  log(`📊 TOTAL UPDATED: ${updatedCount}/${stationsSnap.size}`);
  log(`===================================`);
}

deepSyncAreas().catch((err) => {
    console.error("CRITICAL ERROR:", err);
    process.exit(1);
});
