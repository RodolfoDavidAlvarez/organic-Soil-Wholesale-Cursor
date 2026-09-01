import { Analytics } from "@vercel/analytics/react";
import ExpiredAugustGift from "@/pages/ExpiredAugustGift";

/** August /free-worm-castings gift is closed. Same URL, expired message. */
export default function CampaignEntry() {
  return (
    <>
      <ExpiredAugustGift />
      <Analytics />
    </>
  );
}
