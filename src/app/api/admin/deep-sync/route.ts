import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: "Missing identity signal" }, { status: 401 });
  }

  try {
    const idToken = authHeader.split('Bearer ')[1];

    // 1. Verify Authentication
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // 2. Verify Authorization
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: "Insufficient authorization" }, { status: 403 });
    }

    // 3. Environment Check
    if (process.env.VERCEL) {
      return NextResponse.json({ 
        success: true, 
        message: "Production Mode: Deep Sync should be triggered via GitHub Actions for stability." 
      });
    }

    // 4. Local Execution (Development only)
    // Using eval('require') to completely bypass static analysis for build-time resolution
    // this specific file/logic will only exist/execute on Node.js runtimes.
    const _require = eval('require');
    const { spawn } = _require('child_process');
    const path = _require('path');
    const fs = _require('fs');

    const scriptsFolder = 'scripts';
    const scriptName = 'headless-sync.mjs';
    const scriptPath = path.join(process.cwd(), scriptsFolder, scriptName);
    const logsDir = path.join(process.cwd(), 'logs');
    const logFilePath = path.join(logsDir, 'sync_audit.log');

    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

    const fd = fs.openSync(logFilePath, 'a');
    fs.writeSync(fd, `\n\n--- MANUAL DEEP SYNC TRIGGERED: ${new Date().toLocaleString()} ---\n`);

    const processInstance = spawn('node', [scriptPath], {
      detached: true,
      stdio: ['ignore', fd, fd]
    });

    processInstance.unref();

    return NextResponse.json({ 
      success: true, 
      message: `Local Deep Sync Engine Launched (PID: ${processInstance.pid}). Monitor sync_audit.log for progress.` 
    });

  } catch (error: any) {
    console.error("Deep Sync Launch Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
