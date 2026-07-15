import { NextResponse } from "next/server";
import { getApiKeyStatus, getAnimationProvider, isMedVidEngineReady } from "@/lib/integrations/config";
import { getHeyGenWalletBalance } from "@/lib/integrations/heygen";

export async function GET() {
  const apiStatus = getApiKeyStatus();
  const heygenWallet = apiStatus.heygen
    ? await getHeyGenWalletBalance()
    : { connected: true, balanceUsd: null, billingType: null };

  return NextResponse.json({
    ...apiStatus,
    heygenWallet,
    animationProvider: getAnimationProvider(),
    medvidEngine: isMedVidEngineReady(),
  });
}
