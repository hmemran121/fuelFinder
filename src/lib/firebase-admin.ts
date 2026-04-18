import admin from "firebase-admin";
import fs from "fs";
import path from "path";

/**
 * Server-side Firebase Admin Initialization
 * Allows bypassing client-side security rules for automated maintenance.
 * 
 * ROOT-LEVEL FIX:
 * We prefer initializing from the original Service Account JSON file directly.
 * This avoids any string mangling or encoding issues from environment variables.
 */
function initializeAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Priority 1: Service Account JSON File (Most Stable/Root Fix)
  const certPath = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH;
  if (certPath) {
    try {
      console.log(`Nexus: Initializing Admin SDK from file: ${certPath}`);
      const absolutePath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), certPath);
      
      if (fs.existsSync(absolutePath)) {
        const fileContent = fs.readFileSync(absolutePath, "utf8");
        const serviceAccount = JSON.parse(fileContent);
        
        return admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        console.error(`Nexus: Service account file NOT found at: ${absolutePath}`);
      }
    } catch (e) {
      console.error("Nexus: Failed to initialize from Service Account file:", e);
    }
  }

  // Priority 2: Base64 Encoded JSON (Robust Fallback for Vercel)
  const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (base64Key) {
    try {
      console.log("Nexus: Initializing Admin SDK with Base64 string...");
      const decoded = Buffer.from(base64Key, "base64").toString("utf8");
      const serviceAccount = JSON.parse(decoded);
      
      // Robust Sanitizer for Private Keys in case of bad encoding
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key
          .replace(/^"|"$/g, "")
          .replace(/\\n/g, "\n")
          .trim();
      }

      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (e) {
      console.error("Nexus: Failed to parse Base64 key:", e);
    }
  }

  // Priority 3: Project ID Only (GCP/Firebase Hosting Default Credentials)
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (projectId) {
    console.warn("Nexus: Initializing with Project ID only. Requires Default Credentials.");
    return admin.initializeApp({ projectId });
  }

  throw new Error("Nexus: Firebase Admin missing credentials.");
}

const adminApp = initializeAdmin();
const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminApp, adminDb, adminAuth };
export default admin;
