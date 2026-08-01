import { useRoute } from "wouter";
import { CUSTOMER_SUPPORT_PHONE_DISPLAY, CUSTOMER_SUPPORT_PHONE_TEL } from "@/config/contact";

export default function WormCastingsCoupon() {
  const [, params] = useRoute("/redeem/worm-castings/:token");
  const token = params?.token || "";
  const qrSrc = `/api/public/worm-castings/qr/${encodeURIComponent(token)}.png`;
  return <main className="min-h-screen bg-[#f6f5ee] px-5 py-12 text-[#263527]"><section className="mx-auto max-w-xl rounded-3xl bg-white p-7 text-center shadow-sm md:p-10"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a6a42]">Soil Seed &amp; Water community gift</p><h1 className="mt-3 font-heading text-3xl font-bold text-primary">Your private 9-lb worm castings coupon</h1><p className="mt-4 text-lg leading-7 text-neutral-600">Show this QR code to a yard representative between August 1 and August 31, 2026.</p><img src={qrSrc} alt="Private worm castings redemption QR code" className="mx-auto mt-7 w-full max-w-[360px] rounded-xl border border-[#d6dfcf] bg-white p-4" /><p className="mt-5 font-semibold">One free 9-lb bag per person/email. One-time redemption.</p><p className="mt-4 text-sm text-neutral-600">Phoenix yard · 1634 N 19th Ave · <a className="font-semibold text-primary underline" href={CUSTOMER_SUPPORT_PHONE_TEL}>{CUSTOMER_SUPPORT_PHONE_DISPLAY}</a></p></section></main>;
}
