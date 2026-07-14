import { NextResponse } from "next/server";
import { getApiKeyStatus } from "@/lib/integrations/config";

export async function GET() {
  return NextResponse.json(getApiKeyStatus());
}
