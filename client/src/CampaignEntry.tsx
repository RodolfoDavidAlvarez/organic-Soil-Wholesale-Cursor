import { Analytics } from "@vercel/analytics/react";
import WormCastingsCampaign from "@/pages/WormCastingsCampaign";

export default function CampaignEntry() {
  const source = new URLSearchParams(window.location.search).get("source") || "community-print";

  return (
    <>
      <WormCastingsCampaign source={source} />
      <Analytics />
    </>
  );
}
