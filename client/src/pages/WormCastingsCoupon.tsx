import { useRoute } from "wouter";
import {
  CUSTOMER_SUPPORT_PHONE_DISPLAY,
  CUSTOMER_SUPPORT_PHONE_TEL,
  PHOENIX_YARD_ADDRESS,
  PHOENIX_YARD_DIRECTIONS_URL,
} from "@/config/contact";

const PHOENIX_YARD_HOURS = "Tuesday–Saturday, 8:00 AM–4:00 PM";
const PHOENIX_YARD_BREAK = "Closed for break from 1:00–2:00 PM";

export default function WormCastingsCoupon() {
  const [, params] = useRoute("/redeem/worm-castings/:token");
  const token = params?.token || "";
  const qrSrc = `/api/public/worm-castings/qr/${encodeURIComponent(token)}.png`;
  return (
    <main className="min-h-screen bg-[#f6f5ee] px-5 py-8 text-[#263527] md:py-12">
      <section className="mx-auto max-w-xl overflow-hidden rounded-3xl bg-white text-center shadow-sm">
        <div className="bg-[#203f27] px-7 py-7 text-white md:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e8c98e]">Soil Seed &amp; Water community gift</p>
          <h1 className="mt-3 font-heading text-3xl font-bold">Your private 9-lb worm castings coupon</h1>
          <p className="mt-4 text-base leading-7 text-white/80">Show this QR code to a yard representative between August 1 and August 31, 2026.</p>
        </div>

        <div className="p-7 md:p-10">
          <img src={qrSrc} alt="Private worm castings redemption QR code" className="mx-auto w-full max-w-[340px] rounded-xl border border-[#d6dfcf] bg-white p-4" />
          <p className="mt-3 break-all rounded-xl bg-[#f3f6ef] px-4 py-3 text-xs text-neutral-600">Backup code: <strong className="text-[#263527]">{token}</strong></p>
          <p className="mt-5 font-semibold">One free 9-lb bag per person/email. One-time redemption.</p>

          <div className="mt-7 rounded-2xl border border-[#d6dfcf] bg-[#f8f7f1] p-5 text-left">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6a42]">Pickup details</p>
            <h2 className="mt-2 font-heading text-xl font-bold text-primary">Phoenix yard</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-700"><strong>{PHOENIX_YARD_ADDRESS}</strong><br />Use the south entrance from Grand Avenue.</p>
            <p className="mt-3 text-sm leading-6 text-neutral-700"><strong>Hours:</strong><br />{PHOENIX_YARD_HOURS}<br />{PHOENIX_YARD_BREAK}</p>
            <div className="mt-4 grid gap-3">
              <a className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 py-3 font-bold text-white" href={PHOENIX_YARD_DIRECTIONS_URL}>Open exact entrance pin</a>
              <a className="inline-flex min-h-12 items-center justify-center rounded-xl border border-primary px-5 py-3 font-bold text-primary" href="/yard-map">Open yard map</a>
            </div>
          </div>

          <p className="mt-5 text-sm text-neutral-600">
            Questions? <a className="font-semibold text-primary underline" href={CUSTOMER_SUPPORT_PHONE_TEL}>{CUSTOMER_SUPPORT_PHONE_DISPLAY}</a>
          </p>
        </div>
      </section>
    </main>
  );
}
