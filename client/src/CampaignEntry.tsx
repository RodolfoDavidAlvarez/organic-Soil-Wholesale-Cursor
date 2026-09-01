import { Analytics } from "@vercel/analytics/react";
import NotFound from "@/pages/not-found";

/** August /free-worm-castings gift is closed. Keep this entry as a soft 404. */
export default function CampaignEntry() {
  return (
    <>
      <NotFound />
      <Analytics />
    </>
  );
}
