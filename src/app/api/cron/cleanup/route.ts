import { NextRequest, NextResponse } from "next/server";
import { serverCleanupService } from "@/lib/services/serverCleanupService";

export const dynamic = 'force-dynamic'; // Ensure this route is never cached

/**
 * Automated Midnight Cleanup Cron Job
 * 
 * Authorization:
 * This route is secured by a CRON_SECRET environment variable.
 * Trigger this using a GET request with 'Authorization: Bearer <YOUR_SECRET>'
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // 1. Security Check
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error("Unauthorized attempt to trigger midnight reset.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Perform automated cleanup
    const result = await serverCleanupService.performAutoCleanup();
    
    return NextResponse.json({
      message: "Dhaka Midnight Reset Successful",
      timestamp: new Date().toISOString(),
      details: result
    });
  } catch (error: any) {
    console.error("Automation Failure:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      message: error.message 
    }, { status: 500 });
  }
}
