import { useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sprout, Phone } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { CUSTOMER_SUPPORT_PHONE_DISPLAY, CUSTOMER_SUPPORT_PHONE_TEL } from "@/config/contact";

export default function NotFound() {
  useEffect(() => {
    trackEvent("404 Viewed", { path: window.location.pathname });
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center">
          <Sprout className="mx-auto h-10 w-10 text-[#264027]" />
          <h1 className="mt-3 text-2xl font-bold text-gray-900">That page moved or doesn&apos;t exist.</h1>
          <p className="mt-2 text-sm text-gray-600">
            The soil is still here. Browse our products or give us a call and we&apos;ll point you the right way.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button asChild className="bg-[#264027] hover:bg-[#1f3320]">
              <Link href="/products">Browse Products</Link>
            </Button>
            <Button asChild variant="outline">
              <a href={CUSTOMER_SUPPORT_PHONE_TEL}>
                <Phone className="mr-2 h-4 w-4" />
                Call {CUSTOMER_SUPPORT_PHONE_DISPLAY}
              </a>
            </Button>
            <Link href="/" className="text-sm font-medium text-stone-600 hover:text-stone-900 hover:underline">
              Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
