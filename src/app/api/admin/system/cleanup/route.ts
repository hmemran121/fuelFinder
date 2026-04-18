import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { serverCleanupService } from "@/lib/services/serverCleanupService";

export const dynamic = 'force-dynamic';

/**
 * Manual Cleanup Trigger for Admins
 * 
 * Verifies the user's ID token and checks for 'admin' role in Firestore.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: "Missing identity signal" }, { status: 401 });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    // 1. Verify Authentication
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // 2. Verify Authorization (Check role in Firestore)
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== 'admin') {
      console.warn(`Unauthorized cleanup attempt by user: ${uid}`);
      return NextResponse.json({ error: "Insufficient authorization" }, { status: 403 });
    }

    // 3. Execute Cleanup
    const result = await serverCleanupService.performAutoCleanup();

    return NextResponse.json({
      success: true,
      message: "Human-triggered network cleanup successful",
      details: result
    });

  } catch (error: any) {
    console.error("Manual Cleanup Failure:", error);
    return NextResponse.json({ 
      error: "Protocol Failure", 
      message: error.message 
    }, { status: 500 });
  }
}
