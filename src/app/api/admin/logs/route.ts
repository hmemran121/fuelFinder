import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const logFilePath = path.join(process.cwd(), 'logs', 'sync_audit.log');

    if (!fs.existsSync(logFilePath)) {
      return NextResponse.json({ logs: "No active sync session found." });
    }

    // Read the last 50 lines of the file
    // For simplicity, we'll read the whole file if small, or use a buffer for large files
    const content = fs.readFileSync(logFilePath, 'utf8');
    const lines = content.split('\n');
    const lastLines = lines.slice(-50).join('\n');

    return NextResponse.json({ logs: lastLines });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
