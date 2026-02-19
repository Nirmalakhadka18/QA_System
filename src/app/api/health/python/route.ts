import { NextResponse } from "next/server";
import { execSync } from "child_process";

export async function GET() {
    try {
        const pythonVersion = execSync("python3 --version").toString().trim();
        return NextResponse.json({ python: pythonVersion });
    } catch (e: any) {
        try {
            const pythonVersion = execSync("python --version").toString().trim();
            return NextResponse.json({ python: pythonVersion });
        } catch (e2: any) {
            return NextResponse.json({ error: e.message, error2: e2.message });
        }
    }
}
