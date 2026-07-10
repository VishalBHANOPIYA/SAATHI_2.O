import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const logPath = "/home/vish/.gemini/antigravity/brain/656863e2-cd7a-411e-8b6e-27efccff94ad/.system_generated/logs/overview.txt";
    const content = fs.readFileSync(logPath, "utf8");
    
    // Let's write the raw content of overview.txt to a public file so we can view it.
    // To prevent it from being too huge or breaking, let's just write the whole thing.
    const publicFilePath = path.join(process.cwd(), "public", "raw_overview.txt");
    fs.writeFileSync(publicFilePath, content, "utf8");
    
    return NextResponse.json({ success: true, message: "Saved raw overview to public/raw_overview.txt" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
